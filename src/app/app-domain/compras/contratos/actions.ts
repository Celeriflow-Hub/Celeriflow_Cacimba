"use server";

import { assertBudgetUnitAccess, AccessError, getTenantContextForModuleOperation, type AppContext, type ModuleOperation } from "@/lib/platform/tenant-context";
import { dispatchSiaficEvents } from "@/lib/siafic/dispatcher";
import { queueContractSnapshot, saveContractWithSiaficEvent } from "@/lib/siafic/source";
import { FinanceError } from "@/lib/financeiro";
import {
  ProcurementFinanceBridgeError,
  deriveExpenseAuthorizationsForContract,
  recordSupplyAuthorizationForContract,
} from "@/lib/compras/procurement-finance-bridge";
import {
  ContractLifecycleError,
  assertInstrumentAggregateTotalWithinCurrentValue,
  calculateInclusiveContractTermDays,
  contractBudgetUnitIdsForMutation,
  isContractAmendmentType,
  parseContractDate,
  resolveContractAmendmentEffect,
} from "@/lib/compras/contract-lifecycle";
import { revalidatePath } from "next/cache";

type ContractActionResult = { success: true } | { success: false; error: string };

const contractStatuses = ["Minuta", "Vigente", "Encerrado", "Aditado", "Suspenso", "Rescindido", "Em Análise"];
const directlyEditableStatuses = ["Minuta", "Vigente", "Encerrado"];

async function getTenantContext(operation: ModuleOperation) {
  return getTenantContextForModuleOperation("COMPRAS", operation);
}

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function formNumber(formData: FormData, name: string) {
  const value = formString(formData, name);
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function actionFailure(error: unknown, fallback: string): ContractActionResult {
  if (error instanceof ContractLifecycleError || error instanceof ProcurementFinanceBridgeError || error instanceof FinanceError || error instanceof AccessError) {
    return { success: false, error: error.message };
  }
  return { success: false, error: fallback };
}

export async function generateContractProcurementAuthorizations(contractId: string): Promise<ContractActionResult> {
  try {
    const id = String(contractId || "").trim();
    if (!id) return { success: false, error: "Contrato inválido." };

    const context = await getTenantContext("update");
    const contract = await context.prisma.contract.findUnique({
      where: { id },
      select: { id: true, sourceBudgetUnitId: true },
    });
    if (!contract) return { success: false, error: "Contrato não encontrado." };
    authorizeContractBudgetUnits(context.user, { currentSourceBudgetUnitId: contract.sourceBudgetUnitId });

    const financeContext = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    if (contract.sourceBudgetUnitId) assertBudgetUnitAccess(financeContext.user, contract.sourceBudgetUnitId);

    await deriveExpenseAuthorizationsForContract(
      financeContext.prisma,
      { usuarioId: financeContext.user.id, employeeId: financeContext.user.employeeId },
      contract.id,
    );
    await recordSupplyAuthorizationForContract(
      context.prisma,
      { usuarioId: context.user.id, employeeId: context.user.employeeId },
      contract.id,
    );
    revalidateContractPaths(contract.id);
    revalidatePath("/financeiro/orcamento");
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível gerar as autorizações de empenho e fornecimento.");
  }
}

function authorizeContractBudgetUnits(
  user: AppContext["user"],
  input: { currentSourceBudgetUnitId?: string | null; requestedSourceBudgetUnitId?: string | null },
) {
  const budgetUnitIds = contractBudgetUnitIdsForMutation(user, input);
  // Keep the centralized tenant authorization as the final guard for every UG involved.
  for (const budgetUnitId of budgetUnitIds) assertBudgetUnitAccess(user, budgetUnitId);
}

function lifecycleIdempotencyKey(formData: FormData, kind: string, contractId: string) {
  const key = formString(formData, "idempotencyKey");
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(key)) {
    throw new ContractLifecycleError("Não foi possível validar a repetição segura da ação. Atualize a página e tente novamente.");
  }
  return `${kind}:${contractId}:${key}`;
}

function revalidateContractPaths(id: string) {
  revalidatePath("/compras/contratos");
  revalidatePath(`/compras/contratos/${id}`);
  revalidatePath(`/compras/contratos/${id}/editar`);
}

export async function deleteContract(id: string) {
  try {
    const contractId = String(id || "").trim();
    if (!contractId) return { success: false, error: "Contrato inválido." };

    const context = await getTenantContext("delete");
    await context.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: contractId },
        select: { id: true, sourceBudgetUnitId: true, updatedAt: true },
      });
      if (!contract) throw new ContractLifecycleError("Contrato não encontrado.");

      authorizeContractBudgetUnits(context.user, { currentSourceBudgetUnitId: contract.sourceBudgetUnitId });

      const exported = await tx.siaficOutboxEvent.findFirst({
        where: { entityType: "INSTRUMENT", entityId: contract.id },
        select: { id: true },
      });
      if (exported) {
        throw new ContractLifecycleError("Contrato com histórico de integração SIAFIC não pode ser excluído. Use o encerramento do instrumento.");
      }

      // The source UG is part of the delete predicate so a concurrent reassignment cannot bypass authorization.
      const deleted = await tx.contract.deleteMany({
        where: { id: contract.id, sourceBudgetUnitId: contract.sourceBudgetUnitId, updatedAt: contract.updatedAt },
      });
      if (deleted.count !== 1) throw new ContractLifecycleError("O contrato foi alterado por outra operação. Revise e tente novamente.");
    });

    revalidateContractPaths(contractId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting contract:", error);
    return actionFailure(error, "Falha ao excluir o contrato.");
  }
}

export async function saveContract(formData: FormData) {
  try {
    const id = formString(formData, "id") || undefined;
    const context = await getTenantContext(id ? "update" : "create");
    const number = formString(formData, "number");
    const object = formString(formData, "object");
    const status = formString(formData, "status");
    const requestedProcessId = formString(formData, "processId");
    const supplierId = formString(formData, "supplierId");
    const requestedSecretariatId = formString(formData, "secretariatId");
    const sourceBudgetUnitId = formString(formData, "sourceBudgetUnitId");
    const requestedInitialValue = formNumber(formData, "initialValue");
    const requestedStartDate = parseContractDate(formString(formData, "startDate"));
    const requestedEndDate = parseContractDate(formString(formData, "endDate"));

    const current = id ? await context.prisma.contract.findUnique({
      where: { id },
      select: {
        id: true,
        processId: true,
        secretariatId: true,
        sourceBudgetUnitId: true,
        initialValue: true,
        updatedValue: true,
        startDate: true,
        endDate: true,
        status: true,
        updatedAt: true,
      },
    }) : null;
    if (id && !current) return { success: false, error: "Contrato não encontrado." };

    if (!number || !object || !supplierId || !sourceBudgetUnitId || (!current && (!requestedProcessId || !requestedSecretariatId))) {
      return { success: false, error: "Dados básicos (número, objeto, processo, fornecedor, secretaria e unidade gestora) são obrigatórios." };
    }
    if (!contractStatuses.includes(status)) return { success: false, error: "Status do contrato inválido." };
    if (current && ["Suspenso", "Rescindido"].includes(status) && status !== current.status) {
      return { success: false, error: "Registre suspensão ou rescisão pela ação do ciclo de vida do contrato." };
    }
    if (current && !directlyEditableStatuses.includes(current.status) && status !== current.status) {
      return { success: false, error: "A situação atual do contrato só pode ser alterada por um ato do ciclo de vida." };
    }

    authorizeContractBudgetUnits(context.user, {
      currentSourceBudgetUnitId: current?.sourceBudgetUnitId,
      requestedSourceBudgetUnitId: sourceBudgetUnitId,
    });

    const initialValue = current?.initialValue ?? requestedInitialValue;
    const startDate = current?.startDate ?? requestedStartDate;
    const endDate = current?.endDate ?? requestedEndDate;
    const processId = current?.processId ?? requestedProcessId;
    const secretariatId = current?.secretariatId ?? requestedSecretariatId;

    if (initialValue === null || initialValue < 0) return { success: false, error: "Informe um valor contratual válido." };
    if (!startDate || !endDate) return { success: false, error: "Informe uma vigência válida para o contrato." };
    calculateInclusiveContractTermDays(startDate, endDate);

    const [process, supplier, sourceBudgetUnit] = await Promise.all([
      context.prisma.purchaseProcess.findUnique({ where: { id: processId }, select: { id: true, secretariatId: true, purchaseRequest: { select: { status: true } } } }),
      context.prisma.supplier.findUnique({ where: { id: supplierId }, select: { id: true, status: true } }),
      context.prisma.budgetUnit.findUnique({ where: { id: sourceBudgetUnitId }, select: { id: true, secretariatId: true } }),
    ]);
    if (!process || process.secretariatId !== secretariatId || process.purchaseRequest?.status !== "Aprovada") {
      return { success: false, error: "O contrato exige um processo originado de solicitação de compra aprovada e da mesma secretaria." };
    }
    if (!supplier || supplier.status !== "Ativo") return { success: false, error: "Selecione um fornecedor ativo." };
    if (!sourceBudgetUnit || sourceBudgetUnit.secretariatId !== secretariatId) {
      return { success: false, error: "A Unidade Gestora deve pertencer à secretaria do contrato." };
    }

    const data = {
      number,
      object,
      initialValue,
      // The current value changes only through an amendment; regular edits must not erase its history.
      updatedValue: current?.updatedValue ?? initialValue,
      startDate,
      endDate,
      status,
      processId,
      supplierId,
      secretariatId,
      sourceBudgetUnitId,
    };

    let result: { eventIds: string[] };
    if (current) {
      const existing = current;
      result = await context.prisma.$transaction(async (tx) => {
        const fresh = await tx.contract.findUnique({
          where: { id: existing.id },
          select: { id: true, sourceBudgetUnitId: true },
        });
        if (!fresh) throw new ContractLifecycleError("Contrato não encontrado.");
        authorizeContractBudgetUnits(context.user, {
          currentSourceBudgetUnitId: fresh.sourceBudgetUnitId,
          requestedSourceBudgetUnitId: sourceBudgetUnitId,
        });

        // Compare the source UG and version read before validation so a concurrent update cannot be overwritten.
        const updated = await tx.contract.updateMany({
          where: { id: existing.id, sourceBudgetUnitId: existing.sourceBudgetUnitId, updatedAt: existing.updatedAt },
          data,
        });
        if (updated.count !== 1) throw new ContractLifecycleError("O contrato foi alterado por outra operação. Revise e tente novamente.");
        return { eventIds: await queueContractSnapshot(tx, { usuarioId: context.user.id }, existing.id, "UPDATE") };
      });
    } else {
      result = await saveContractWithSiaficEvent(context.prisma, { usuarioId: context.user.id }, data);
    }
    await dispatchSiaficEvents(context.prisma, result.eventIds);
    revalidatePath("/compras/contratos");
    if (id) revalidateContractPaths(id);
    return { success: true };
  } catch (error) {
    console.error("Error saving contract:", error);
    return actionFailure(error, "Falha ao salvar o contrato.");
  }
}

export async function saveContractAmendment(formData: FormData): Promise<ContractActionResult> {
  try {
    const contractId = formString(formData, "contractId");
    const type = formString(formData, "type");
    const justification = formString(formData, "justification");
    if (!contractId || !justification) return { success: false, error: "Informe o contrato e a justificativa do ato." };
    if (!isContractAmendmentType(type)) return { success: false, error: "Tipo de ato contratual inválido." };

    const newValue = formNumber(formData, "newValue") ?? undefined;
    const newEndDate = parseContractDate(formString(formData, "newEndDate")) ?? undefined;
    const idempotencyKey = lifecycleIdempotencyKey(formData, "CONTRACT_AMENDMENT", contractId);
    const context = await getTenantContext("update");

    const current = await context.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, sourceBudgetUnitId: true },
    });
    if (!current) return { success: false, error: "Contrato não encontrado." };
    authorizeContractBudgetUnits(context.user, { currentSourceBudgetUnitId: current.sourceBudgetUnitId });

    const result = await context.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: contractId },
        select: { id: true, sourceBudgetUnitId: true, updatedValue: true, startDate: true, endDate: true, status: true, updatedAt: true },
      });
      if (!contract) throw new ContractLifecycleError("Contrato não encontrado.");
      authorizeContractBudgetUnits(context.user, { currentSourceBudgetUnitId: contract.sourceBudgetUnitId });

      const existingEvent = await tx.procurementLifecycleEvent.findUnique({
        where: { idempotencyKey },
        select: { entityType: true, sourceId: true },
      });
      if (existingEvent) {
        if (existingEvent.entityType !== "CONTRACT_AMENDMENT" || existingEvent.sourceId !== contract.id) {
          throw new ContractLifecycleError("A chave de repetição já foi usada em outro ato contratual.");
        }
        return { eventIds: [] as string[] };
      }

      if (contract.status === "Rescindido") throw new ContractLifecycleError("Contrato rescindido não aceita novos atos.");
      if (type === "Suspensão" && contract.status === "Suspenso") throw new ContractLifecycleError("O contrato já está suspenso.");
      if (type === "Rescisão" && contract.status === "Rescindido") throw new ContractLifecycleError("O contrato já está rescindido.");

      const effect = resolveContractAmendmentEffect(contract, { type, newValue, newEndDate });
      if (effect.contractUpdate.updatedValue !== undefined) {
        const [measurementAggregate, installmentAggregate] = await Promise.all([
          tx.instrumentMeasurement.aggregate({
            where: { contractId: contract.id, status: { in: ["Rascunho", "Em análise", "Atestada"] } },
            _sum: { valueDecimal: true },
          }),
          tx.instrumentInstallment.aggregate({
            where: { contractId: contract.id, status: "Programada" },
            _sum: { valueDecimal: true },
          }),
        ]);
        assertInstrumentAggregateTotalWithinCurrentValue(
          effect.contractUpdate.updatedValue,
          measurementAggregate._sum.valueDecimal ?? 0,
          "medições ativas",
        );
        assertInstrumentAggregateTotalWithinCurrentValue(
          effect.contractUpdate.updatedValue,
          installmentAggregate._sum.valueDecimal ?? 0,
          "parcelas programadas",
        );
      }
      const amendment = await tx.contractAmendment.create({
        data: {
          type,
          justification,
          previousValue: effect.previousValue,
          newValue: effect.newValue,
          previousEndDate: effect.previousEndDate,
          newEndDate: effect.newEndDate,
          status: "Aplicado",
          contractId: contract.id,
        },
      });
      const updated = await tx.contract.updateMany({
        where: { id: contract.id, sourceBudgetUnitId: contract.sourceBudgetUnitId, updatedAt: contract.updatedAt },
        data: effect.contractUpdate,
      });
      if (updated.count !== 1) throw new ContractLifecycleError("O contrato foi alterado por outra operação. Revise e tente novamente.");
      await tx.procurementLifecycleEvent.create({
        data: {
          eventType: effect.lifecycleEventType,
          entityType: "CONTRACT_AMENDMENT",
          entityId: amendment.id,
          sourceType: "CONTRACT",
          sourceId: contract.id,
          actorUsuarioId: context.user.id,
          idempotencyKey,
        },
      });

      // Legacy contracts can be repaired only by administrators, but cannot be exported without a source UG.
      const eventIds = contract.sourceBudgetUnitId
        ? await queueContractSnapshot(tx, { usuarioId: context.user.id }, contract.id, "UPDATE")
        : [];
      return { eventIds };
    });

    await dispatchSiaficEvents(context.prisma, result.eventIds);
    revalidateContractPaths(contractId);
    return { success: true };
  } catch (error) {
    console.error("Error saving contract amendment:", error);
    return actionFailure(error, "Falha ao registrar o ato contratual.");
  }
}

export async function updateContractResponsibles(formData: FormData): Promise<ContractActionResult> {
  try {
    const contractId = formString(formData, "contractId");
    if (!contractId) return { success: false, error: "Contrato inválido." };

    const managerId = formString(formData, "managerId") || null;
    const inspectorId = formString(formData, "inspectorId") || null;
    const idempotencyKey = lifecycleIdempotencyKey(formData, "CONTRACT_RESPONSIBLES", contractId);
    const context = await getTenantContext("update");

    const current = await context.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, sourceBudgetUnitId: true },
    });
    if (!current) return { success: false, error: "Contrato não encontrado." };
    authorizeContractBudgetUnits(context.user, { currentSourceBudgetUnitId: current.sourceBudgetUnitId });

    await context.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: contractId },
        select: { id: true, sourceBudgetUnitId: true, managerId: true, inspectorId: true, updatedAt: true },
      });
      if (!contract) throw new ContractLifecycleError("Contrato não encontrado.");
      authorizeContractBudgetUnits(context.user, { currentSourceBudgetUnitId: contract.sourceBudgetUnitId });

      const existingEvent = await tx.procurementLifecycleEvent.findUnique({
        where: { idempotencyKey },
        select: { entityType: true, sourceId: true },
      });
      if (existingEvent) {
        if (existingEvent.entityType !== "CONTRACT_RESPONSIBLES" || existingEvent.sourceId !== contract.id) {
          throw new ContractLifecycleError("A chave de repetição já foi usada em outro ato contratual.");
        }
        return;
      }

      const employeeIds = [...new Set([managerId, inspectorId].filter((employeeId): employeeId is string => Boolean(employeeId)))];
      const employees = employeeIds.length
        ? await tx.employee.findMany({ where: { id: { in: employeeIds }, isActive: true }, select: { id: true } })
        : [];
      if (employees.length !== employeeIds.length) throw new ContractLifecycleError("Selecione apenas servidores ativos para os responsáveis do contrato.");

      if (contract.managerId === managerId && contract.inspectorId === inspectorId) return;

      const updated = await tx.contract.updateMany({
        where: { id: contract.id, sourceBudgetUnitId: contract.sourceBudgetUnitId, updatedAt: contract.updatedAt },
        data: { managerId, inspectorId },
      });
      if (updated.count !== 1) throw new ContractLifecycleError("O contrato foi alterado por outra operação. Revise e tente novamente.");
      await tx.procurementLifecycleEvent.create({
        data: {
          eventType: "CONTRACT_RESPONSIBLES_UPDATED",
          entityType: "CONTRACT_RESPONSIBLES",
          entityId: contract.id,
          sourceType: "CONTRACT",
          sourceId: contract.id,
          actorUsuarioId: context.user.id,
          idempotencyKey,
        },
      });
    });

    revalidateContractPaths(contractId);
    return { success: true };
  } catch (error) {
    console.error("Error updating contract responsibles:", error);
    return actionFailure(error, "Falha ao atualizar os responsáveis do contrato.");
  }
}
