"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import {
  ContractLifecycleError,
  assertInstrumentAggregateTotalWithinCurrentValue,
  calculateInclusiveContractTermDays,
  parseContractDate,
  requiredLifecycleText,
} from "@/lib/compras/contract-lifecycle";
import { dispatchSiaficEvents } from "@/lib/siafic/dispatcher";
import { queueCovenantSnapshot } from "@/lib/siafic/source";

type CovenantActionResult = { success: true } | { success: false; error: string };

const covenantStatuses = ["Ativo", "Suspenso", "Encerrado", "Rescindido", "Em análise"];
const activeMeasurementStatuses = ["Rascunho", "Em análise", "Atestada"];

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function formDecimal(formData: FormData, name: string, label: string) {
  const value = formString(formData, name);
  if (!/^\d{1,16}(?:[.,]\d{1,2})?$/.test(value)) {
    throw new ContractLifecycleError(`Informe ${label.toLocaleLowerCase("pt-BR")} com até duas casas decimais.`);
  }
  const numericValue = Number(value.replace(",", "."));
  if (!Number.isFinite(numericValue) || numericValue < 0) throw new ContractLifecycleError(`Informe ${label.toLocaleLowerCase("pt-BR")} válido.`);
  return new Prisma.Decimal(value.replace(",", "."));
}

function idempotencyKey(formData: FormData, scope: string) {
  const value = formString(formData, "idempotencyKey");
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(value)) {
    throw new ContractLifecycleError("Não foi possível validar a repetição segura da ação. Atualize a página e tente novamente.");
  }
  return `${scope}:${value}`;
}

function revalidateCovenantPaths(id?: string) {
  revalidatePath("/compras/convenios");
  if (id) {
    revalidatePath(`/compras/convenios/${id}`);
    revalidatePath(`/compras/convenios/${id}/editar`);
    revalidatePath(`/compras/convenios/${id}/relatorio`);
  }
}

function actionFailure(error: unknown, fallback: string): CovenantActionResult {
  if (error instanceof ContractLifecycleError || error instanceof AccessError) return { success: false, error: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { success: false, error: "Já existe um convênio com esse número." };
  }
  console.error(fallback, error);
  return { success: false, error: fallback };
}

export async function saveCovenant(formData: FormData): Promise<CovenantActionResult> {
  try {
    const id = formString(formData, "id") || null;
    const number = requiredLifecycleText(formString(formData, "number"), "o número do convênio", 120);
    const grantor = requiredLifecycleText(formString(formData, "grantor"), "o concedente", 300);
    const description = requiredLifecycleText(formString(formData, "description"), "a descrição", 2_000);
    const totalValueDecimal = formDecimal(formData, "totalValueDecimal", "o valor total");
    const startDate = parseContractDate(formString(formData, "startDate"));
    const endDate = parseContractDate(formString(formData, "endDate"));
    const status = formString(formData, "status") || "Ativo";
    if (!startDate || !endDate) return { success: false, error: "Informe a vigência do convênio." };
    calculateInclusiveContractTermDays(startDate, endDate);
    if (!covenantStatuses.includes(status)) return { success: false, error: "Situação do convênio inválida." };

    const context = await getTenantContextForModuleOperation("COMPRAS", id ? "update" : "create");
    const key = idempotencyKey(formData, id ? `COVENANT_UPDATE:${id}` : "COVENANT_CREATE");
    const result = await context.prisma.$transaction(async (tx) => {
      const existingEvent = await tx.procurementLifecycleEvent.findUnique({
        where: { idempotencyKey: key },
        select: { entityType: true, sourceType: true, sourceId: true, entityId: true },
      });
      if (existingEvent) {
        if (existingEvent.entityType !== "COVENANT" || existingEvent.sourceType !== "COVENANT") {
          throw new ContractLifecycleError("A chave de repetição já foi usada em outro ato.");
        }
        return { id: existingEvent.sourceId ?? existingEvent.entityId, eventIds: [] as string[] };
      }

      const data = { number, grantor, description, totalValueDecimal, startDate, endDate, status };
      if (!id) {
        const created = await tx.covenant.create({ data });
        await tx.procurementLifecycleEvent.create({
          data: {
            eventType: "COVENANT_CREATED",
            entityType: "COVENANT",
            entityId: created.id,
            sourceType: "COVENANT",
            sourceId: created.id,
            actorUsuarioId: context.user.id,
            idempotencyKey: key,
          },
        });
        return {
          id: created.id,
          eventIds: await queueCovenantSnapshot(tx, { usuarioId: context.user.id }, created.id, "CREATE"),
        };
      }

      const existing = await tx.covenant.findUnique({ where: { id }, select: { id: true, status: true, updatedAt: true } });
      if (!existing) throw new ContractLifecycleError("Convênio não encontrado.");
      const [measurementAggregate, installmentAggregate] = await Promise.all([
        tx.instrumentMeasurement.aggregate({
          where: { covenantId: existing.id, status: { in: activeMeasurementStatuses } },
          _sum: { valueDecimal: true },
        }),
        tx.instrumentInstallment.aggregate({
          where: { covenantId: existing.id, status: "Programada" },
          _sum: { valueDecimal: true },
        }),
      ]);
      assertInstrumentAggregateTotalWithinCurrentValue(
        totalValueDecimal,
        measurementAggregate._sum.valueDecimal ?? new Prisma.Decimal(0),
        "medições ativas",
      );
      assertInstrumentAggregateTotalWithinCurrentValue(
        totalValueDecimal,
        installmentAggregate._sum.valueDecimal ?? new Prisma.Decimal(0),
        "parcelas programadas",
      );
      const updated = await tx.covenant.updateMany({ where: { id: existing.id, updatedAt: existing.updatedAt }, data });
      if (updated.count !== 1) throw new ContractLifecycleError("O convênio foi alterado por outra operação. Atualize e tente novamente.");
      await tx.procurementLifecycleEvent.create({
        data: {
          eventType: existing.status === status ? "COVENANT_UPDATED" : "COVENANT_STATUS_UPDATED",
          entityType: "COVENANT",
          entityId: existing.id,
          sourceType: "COVENANT",
          sourceId: existing.id,
          actorUsuarioId: context.user.id,
          idempotencyKey: key,
        },
      });
      return {
        id: existing.id,
        eventIds: await queueCovenantSnapshot(tx, { usuarioId: context.user.id }, existing.id, "UPDATE"),
      };
    });

    await dispatchSiaficEvents(context.prisma, result.eventIds);
    revalidateCovenantPaths(result.id);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível salvar o convênio.");
  }
}

export async function deleteCovenant(id: string): Promise<CovenantActionResult> {
  try {
    const covenantId = String(id || "").trim();
    if (!covenantId) return { success: false, error: "Convênio inválido." };
    const context = await getTenantContextForModuleOperation("COMPRAS", "delete");
    await context.prisma.$transaction(async (tx) => {
      const key = `COVENANT_DELETE:${covenantId}`;
      const existingEvent = await tx.procurementLifecycleEvent.findUnique({
        where: { idempotencyKey: key },
        select: { entityType: true, sourceType: true, sourceId: true },
      });
      if (existingEvent) {
        if (existingEvent.entityType !== "COVENANT" || existingEvent.sourceType !== "COVENANT" || existingEvent.sourceId !== covenantId) {
          throw new ContractLifecycleError("A chave de repetição já foi usada em outro ato.");
        }
        return;
      }

      const covenant = await tx.covenant.findUnique({
        where: { id: covenantId },
        select: {
          id: true,
          updatedAt: true,
          _count: { select: { commitments: true, instrumentParties: true, responsibilityGroups: true, measurements: true, installments: true } },
        },
      });
      if (!covenant) throw new ContractLifecycleError("Convênio não encontrado.");
      const exported = await tx.siaficOutboxEvent.findFirst({
        where: { entityType: "INSTRUMENT", entityId: covenant.id },
        select: { id: true },
      });
      if (exported) {
        throw new ContractLifecycleError("Convênio com histórico de integração SIAFIC não pode ser excluído. Use o encerramento do instrumento.");
      }
      const dependencies = covenant._count.commitments + covenant._count.instrumentParties + covenant._count.responsibilityGroups + covenant._count.measurements + covenant._count.installments;
      if (dependencies) throw new ContractLifecycleError("Convênio com execução, partes, parcelas ou empenhos vinculados não pode ser excluído. Use o encerramento do instrumento.");

      const deleted = await tx.covenant.deleteMany({ where: { id: covenant.id, updatedAt: covenant.updatedAt } });
      if (deleted.count !== 1) throw new ContractLifecycleError("O convênio foi alterado por outra operação. Atualize e tente novamente.");
      await tx.procurementLifecycleEvent.create({
        data: {
          eventType: "COVENANT_DELETED",
          entityType: "COVENANT",
          entityId: covenant.id,
          sourceType: "COVENANT",
          sourceId: covenant.id,
          actorUsuarioId: context.user.id,
          idempotencyKey: key,
        },
      });
    });

    revalidateCovenantPaths(covenantId);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível excluir o convênio.");
  }
}
