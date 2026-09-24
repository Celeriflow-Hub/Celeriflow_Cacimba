"use server";

import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentTenantContext, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { nextYearlyCode } from "@/lib/sequence";
import { BIDDING_NUMBER_DUPLICATE_ERROR, biddingNumberDuplicateError } from "@/lib/compras/bidding-number-integrity";
import {
  BIDDING_BID_STATUS,
  BIDDING_ELIGIBILITY_STATUS,
  BIDDING_LOT_STATUS,
  BIDDING_PHASE_DEFINITIONS,
  BIDDING_PHASE_STATUS,
  BIDDING_RESULT_STATUS,
  BIDDING_STATUS,
  BiddingWorkflowError,
  assertBiddingStatusTransition,
  biddingLotStatusForBiddingStatus,
  biddingModalityPrefix,
  biddingSequenceKey,
  canConfigureBiddingLots,
  canDecideBiddingEligibility,
  canDecideBiddingResult,
  canEditBiddingDetails,
  canRegisterBiddingParticipant,
  getBiddingPhasePlan,
  isBiddingBidSubmissionOpen,
  isBiddingModality,
  isBiddingParticipantEligible,
  isTerminalBiddingStatus,
  normalizeBiddingStatus,
} from "@/lib/compras/bidding-workflow";

type Tx = Prisma.TransactionClient;

export type BiddingActionResult =
  | { success: true; status?: string; id?: string; created?: boolean; alreadySubmitted?: boolean }
  | { success: false; error: string };

export type BiddingAppointmentMemberInput = {
  employeeId: string;
  role: string;
};

export type BiddingLotItemInput = {
  purchaseProcessItemId: string;
  quantity: number;
};

function formText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function requiredText(value: string | null | undefined, label: string) {
  const normalized = value?.trim() ?? "";
  if (!normalized) throw new BiddingWorkflowError(`${label} é obrigatório.`);
  return normalized;
}

function optionalDate(value: string, label: string) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new BiddingWorkflowError(`${label} inválida.`);
  return date;
}

function requiredMoney(value: number, label: string, allowZero = false) {
  if (!Number.isFinite(value)) throw new BiddingWorkflowError(`${label} deve ser um valor numérico válido.`);
  const cents = Math.round(value * 100);
  if (!Number.isSafeInteger(cents) || Math.abs(value * 100 - cents) > 0.000001) {
    throw new BiddingWorkflowError(`${label} deve possuir no máximo duas casas decimais.`);
  }
  if (allowZero ? cents < 0 : cents <= 0) throw new BiddingWorkflowError(`${label} deve ser ${allowZero ? "maior ou igual a zero" : "maior que zero"}.`);
  return new Prisma.Decimal(cents).div(100);
}

function optionalMoney(value: number | null | undefined, label: string) {
  return value === null || value === undefined ? null : requiredMoney(value, label);
}

function requiredQuantity(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new BiddingWorkflowError(`${label} deve ser maior que zero.`);
  return value;
}

function isActiveStatus(status: string | null | undefined) {
  return status?.trim().toLocaleLowerCase("pt-BR") === "ativo";
}

function isInactiveParticipantStatus(status: string | null | undefined) {
  const normalized = status?.trim().toLocaleLowerCase("pt-BR");
  return normalized === "inativo" || normalized === "desclassificado" || normalized === "impedido";
}

function decimalsEqual(left: Prisma.Decimal | null, right: Prisma.Decimal | null) {
  if (left === null || right === null) return left === right;
  return left.equals(right);
}

function isUniqueConstraint(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function actionError(error: unknown, fallback: string): BiddingActionResult {
  if (error instanceof BiddingWorkflowError) return { success: false, error: error.message };
  console.error(fallback, error);
  return { success: false, error: fallback };
}

function revalidateBiddingPaths(id?: string) {
  revalidatePath("/compras/licitacoes");
  revalidatePath("/compras/licitacoes/portal");
  revalidatePath("/compras/licitacoes/portal/[participantId]", "page");
  if (id) revalidatePath(`/compras/licitacoes/${id}`);
}

async function currentPhaseId(tx: Tx, biddingId: string) {
  const phase = await tx.biddingPhase.findFirst({
    where: { biddingId, version: 1, isCurrent: true },
    orderBy: { sequence: "asc" },
    select: { id: true },
  });
  return phase?.id ?? null;
}

async function writeBiddingAct(
  tx: Tx,
  input: {
    biddingId: string;
    actorUsuarioId: string;
    type: string;
    description?: string | null;
    phaseId?: string | null;
    biddingLotId?: string | null;
    idempotencyKey?: string;
  },
) {
  return tx.biddingAct.create({
    data: {
      biddingId: input.biddingId,
      actorUsuarioId: input.actorUsuarioId,
      type: input.type,
      description: input.description ?? null,
      phaseId: input.phaseId ?? null,
      biddingLotId: input.biddingLotId ?? null,
      idempotencyKey: input.idempotencyKey ?? randomUUID(),
    },
  });
}

async function writeLifecycleEvent(
  tx: Tx,
  input: { eventType: string; biddingId: string; actorUsuarioId: string; sourceType?: string; sourceId?: string; idempotencyKey?: string },
) {
  await tx.procurementLifecycleEvent.create({
    data: {
      eventType: input.eventType,
      entityType: "BIDDING",
      entityId: input.biddingId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      actorUsuarioId: input.actorUsuarioId,
      idempotencyKey: input.idempotencyKey ?? randomUUID(),
    },
  });
}

async function ensureBiddingPhases(tx: Tx, biddingId: string, biddingStatus: string, now = new Date()) {
  let phases = await tx.biddingPhase.findMany({
    where: { biddingId, version: 1 },
    orderBy: { sequence: "asc" },
  });
  const existingCodes = new Set(phases.map((phase) => phase.code));

  for (const definition of BIDDING_PHASE_DEFINITIONS) {
    if (existingCodes.has(definition.code)) continue;
    await tx.biddingPhase.create({
      data: {
        biddingId,
        code: definition.code,
        name: definition.name,
        sequence: definition.sequence,
        version: 1,
        isCurrent: false,
        status: BIDDING_PHASE_STATUS.PENDING,
      },
    });
  }

  phases = await tx.biddingPhase.findMany({
    where: { biddingId, version: 1 },
    orderBy: { sequence: "asc" },
  });
  const plan = getBiddingPhasePlan(biddingStatus);

  if (!plan) {
    const suspended = normalizeBiddingStatus(biddingStatus) === BIDDING_STATUS.SUSPENDED;
    await tx.biddingPhase.updateMany({
      where: { biddingId, version: 1, isCurrent: true },
      data: {
        status: suspended ? BIDDING_PHASE_STATUS.SUSPENDED : BIDDING_PHASE_STATUS.INTERRUPTED,
        isCurrent: suspended,
      },
    });
    return currentPhaseId(tx, biddingId);
  }

  const phaseByCode = new Map(phases.map((phase) => [phase.code, phase]));
  for (const expected of plan) {
    const phase = phaseByCode.get(expected.code);
    if (!phase) continue;
    await tx.biddingPhase.update({
      where: { id: phase.id },
      data: {
        name: expected.name,
        sequence: expected.sequence,
        isCurrent: expected.isCurrent,
        status: expected.status,
        startedAt: expected.status === BIDDING_PHASE_STATUS.PENDING ? phase.startedAt : phase.startedAt ?? now,
        completedAt: expected.status === BIDDING_PHASE_STATUS.COMPLETED ? phase.completedAt ?? now : null,
      },
    });
  }

  return currentPhaseId(tx, biddingId);
}

async function assertTransitionRequirements(
  tx: Tx,
  bidding: { id: string; sessionDate: Date | null },
  nextStatus: string,
  now: Date,
) {
  if (nextStatus === BIDDING_STATUS.PUBLISHED) {
    const [lots, assignment] = await Promise.all([
      tx.biddingLot.findMany({
        where: { biddingId: bidding.id },
        select: { id: true, _count: { select: { items: true } } },
      }),
      tx.biddingAppointmentAssignment.findFirst({
        where: { biddingId: bidding.id, status: "Ativa" },
        select: { id: true },
      }),
    ]);
    if (!assignment) throw new BiddingWorkflowError("Vincule uma comissão ou agente de contratação antes de publicar a licitação.");
    if (!lots.length) throw new BiddingWorkflowError("Cadastre ao menos um lote antes de publicar a licitação.");
    if (lots.some((lot) => lot._count.items === 0)) throw new BiddingWorkflowError("Todos os lotes precisam possuir ao menos um item antes da publicação.");
  }

  if (nextStatus === BIDDING_STATUS.OPEN) {
    if (!bidding.sessionDate || bidding.sessionDate.getTime() <= now.getTime()) {
      throw new BiddingWorkflowError("Defina um prazo futuro para a sessão antes de abrir a disputa.");
    }
    const participantCount = await tx.biddingParticipant.count({ where: { biddingId: bidding.id } });
    if (!participantCount) throw new BiddingWorkflowError("Cadastre ao menos um participante antes de abrir a disputa.");
  }

  if (nextStatus === BIDDING_STATUS.HOMOLOGATED) {
    const lots = await tx.biddingLot.findMany({
      where: { biddingId: bidding.id },
      select: { id: true, results: { where: { isCurrent: true }, select: { id: true } } },
    });
    if (!lots.length || lots.some((lot) => !lot.results.length)) {
      throw new BiddingWorkflowError("Registre a arrematação de todos os lotes antes de homologar a licitação.");
    }
  }
}

async function changeBiddingStatus(id: string, requestedStatus: string): Promise<BiddingActionResult> {
  const context = await getTenantContextForModuleOperation("COMPRAS", "update");
  try {
    const status = await context.prisma.$transaction(async (tx) => {
      const bidding = await tx.bidding.findUnique({
        where: { id },
        select: { id: true, status: true, sessionDate: true },
      });
      if (!bidding) throw new BiddingWorkflowError("Licitação não encontrada.");

      const { current, next } = assertBiddingStatusTransition(bidding.status, requestedStatus);
      const now = new Date();
      await assertTransitionRequirements(tx, bidding, next, now);
      const claimed = await tx.bidding.updateMany({
        where: { id: bidding.id, status: bidding.status },
        data: { status: next },
      });
      if (claimed.count !== 1) {
        throw new BiddingWorkflowError("A situação da licitação foi alterada por outra operação. Atualize a página e tente novamente.");
      }

      const phaseId = await ensureBiddingPhases(tx, bidding.id, next, now);
      await tx.biddingLot.updateMany({
        where: { biddingId: bidding.id },
        data: { status: biddingLotStatusForBiddingStatus(next) },
      });

      const idempotencyKey = randomUUID();
      await writeBiddingAct(tx, {
        biddingId: bidding.id,
        actorUsuarioId: context.user.id,
        type: "STATUS_TRANSITION",
        description: `${current} para ${next}`,
        phaseId,
        idempotencyKey: `BIDDING:${bidding.id}:STATUS:${idempotencyKey}`,
      });
      await writeLifecycleEvent(tx, {
        eventType: "BIDDING_STATUS_TRANSITION",
        biddingId: bidding.id,
        actorUsuarioId: context.user.id,
        sourceType: current,
        sourceId: next,
        idempotencyKey: `BIDDING:${bidding.id}:STATUS:${idempotencyKey}:LIFECYCLE`,
      });

      return next;
    });

    revalidateBiddingPaths(id);
    return { success: true, status };
  } catch (error) {
    return actionError(error, "Falha ao alterar a situação da licitação.");
  }
}

export async function transitionBiddingStatus(id: string, nextStatus: string) {
  return changeBiddingStatus(id, nextStatus);
}

export async function inactivateBidding(id: string) {
  return changeBiddingStatus(id, BIDDING_STATUS.INACTIVE);
}

export async function saveBidding(formData: FormData): Promise<BiddingActionResult> {
  const id = formText(formData, "id") || null;
  const context = await getTenantContextForModuleOperation("COMPRAS", id ? "update" : "create");

  try {
    const number = formText(formData, "number");
    const modality = formText(formData, "modality");
    const processId = formText(formData, "processId");
    const publicationDate = optionalDate(formText(formData, "publicationDate"), "Data de publicação");
    const sessionDate = optionalDate(formText(formData, "sessionDate"), "Data da sessão");

    if (!processId) return { success: false, error: "Selecione o processo de compra vinculado." };
    if (publicationDate && sessionDate && sessionDate < publicationDate) {
      return { success: false, error: "A sessão não pode ocorrer antes da publicação." };
    }

    const process = await context.prisma.purchaseProcess.findUnique({ where: { id: processId }, select: { id: true } });
    if (!process) return { success: false, error: "O processo de compra selecionado não existe." };

    if (id) {
      const existing = await context.prisma.bidding.findUnique({ where: { id }, select: { id: true, modality: true, status: true } });
      if (!existing) return { success: false, error: "Licitação não encontrada." };
      if (!canEditBiddingDetails(existing.status)) {
        return { success: false, error: "Somente licitações em elaboração podem ter seus dados alterados." };
      }
      if (!number) return { success: false, error: "Informe o número da licitação." };
      if (modality && modality !== existing.modality) {
        return { success: false, error: "A modalidade é definida na criação para preservar a numeração do certame." };
      }

      const duplicate = await context.prisma.bidding.findFirst({
        where: { number, id: { not: existing.id } },
        select: { id: true },
      });
      if (duplicate) return { success: false, error: BIDDING_NUMBER_DUPLICATE_ERROR };

      await context.prisma.bidding.update({
        where: { id: existing.id },
        data: { number, processId: process.id, publicationDate, sessionDate },
      });
      revalidateBiddingPaths(existing.id);
      return { success: true, id: existing.id };
    }

    if (!isBiddingModality(modality)) return { success: false, error: "Selecione uma modalidade válida." };

    const biddingId = await context.prisma.$transaction(async (tx) => {
      const finalNumber = number || await nextYearlyCode({
        prisma: tx,
        key: biddingSequenceKey(modality),
        prefix: biddingModalityPrefix(modality),
        existingCodes: (await tx.bidding.findMany({ select: { number: true } })).map(({ number: code }) => ({ code })),
      });

      const duplicate = number
        ? await tx.bidding.findFirst({ where: { number: finalNumber }, select: { id: true } })
        : null;
      if (duplicate) throw new BiddingWorkflowError(BIDDING_NUMBER_DUPLICATE_ERROR);

      const bidding = await tx.bidding.create({
        data: {
          number: finalNumber,
          modality,
          status: BIDDING_STATUS.DRAFT,
          publicationDate,
          sessionDate,
          processId: process.id,
        },
      });
      const phaseId = await ensureBiddingPhases(tx, bidding.id, BIDDING_STATUS.DRAFT);
      await writeBiddingAct(tx, {
        biddingId: bidding.id,
        actorUsuarioId: context.user.id,
        type: "BIDDING_CREATED",
        description: "Certame criado em elaboração.",
        phaseId,
        idempotencyKey: `BIDDING:${bidding.id}:CREATED:ACT`,
      });
      await writeLifecycleEvent(tx, {
        eventType: "BIDDING_CREATED",
        biddingId: bidding.id,
        actorUsuarioId: context.user.id,
        sourceType: "BIDDING_STATUS",
        sourceId: BIDDING_STATUS.DRAFT,
        idempotencyKey: `BIDDING:${bidding.id}:CREATED`,
      });
      return bidding.id;
    });

    revalidateBiddingPaths(biddingId);
    return { success: true, id: biddingId };
  } catch (error) {
    const duplicateNumberError = biddingNumberDuplicateError(error);
    if (duplicateNumberError) return { success: false, ...duplicateNumberError };
    return actionError(error, "Falha ao salvar a licitação.");
  }
}

export async function initializeBiddingWorkflow(biddingId: string): Promise<BiddingActionResult> {
  const context = await getTenantContextForModuleOperation("COMPRAS", "update");
  try {
    await context.prisma.$transaction(async (tx) => {
      const bidding = await tx.bidding.findUnique({ where: { id: biddingId }, select: { id: true, status: true } });
      if (!bidding) throw new BiddingWorkflowError("Licitação não encontrada.");
      const phaseCount = await tx.biddingPhase.count({ where: { biddingId: bidding.id, version: 1 } });
      const phaseId = await ensureBiddingPhases(tx, bidding.id, bidding.status);
      if (phaseCount < BIDDING_PHASE_DEFINITIONS.length) {
        await writeBiddingAct(tx, {
          biddingId: bidding.id,
          actorUsuarioId: context.user.id,
          type: "WORKFLOW_INITIALIZED",
          description: "Fases persistidas foram inicializadas para o certame.",
          phaseId,
        });
      }
    });
    revalidateBiddingPaths(biddingId);
    return { success: true, id: biddingId };
  } catch (error) {
    return actionError(error, "Falha ao inicializar as fases da licitação.");
  }
}

export async function createBiddingAppointment(input: {
  biddingId: string;
  kind: string;
  name: string;
  members: BiddingAppointmentMemberInput[];
  role?: string;
  appointedAt?: string;
  endsAt?: string;
  notes?: string;
}): Promise<BiddingActionResult> {
  const context = await getTenantContextForModuleOperation("COMPRAS", "update");
  try {
    const biddingId = requiredText(input.biddingId, "Licitação");
    const kind = requiredText(input.kind, "Tipo de designação");
    const name = requiredText(input.name, "Nome da designação");
    const members = input.members.map((member) => ({
      employeeId: requiredText(member.employeeId, "Servidor designado"),
      role: requiredText(member.role, "Função do servidor"),
    }));
    if (!members.length) throw new BiddingWorkflowError("Informe ao menos um servidor para a designação.");
    const memberKeys = new Set(members.map((member) => `${member.employeeId}:${member.role}`));
    if (memberKeys.size !== members.length) throw new BiddingWorkflowError("Não repita o mesmo servidor na mesma função.");

    const appointedAt = optionalDate(input.appointedAt?.trim() ?? "", "Data da designação");
    const endsAt = optionalDate(input.endsAt?.trim() ?? "", "Data final da designação");
    if (appointedAt && endsAt && endsAt < appointedAt) throw new BiddingWorkflowError("A vigência não pode terminar antes da designação.");

    const appointmentId = await context.prisma.$transaction(async (tx) => {
      const [bidding, employees] = await Promise.all([
        tx.bidding.findUnique({ where: { id: biddingId }, select: { id: true, status: true } }),
        tx.employee.findMany({
          where: { id: { in: members.map((member) => member.employeeId) }, isActive: true },
          select: { id: true },
        }),
      ]);
      if (!bidding) throw new BiddingWorkflowError("Licitação não encontrada.");
      if (isTerminalBiddingStatus(bidding.status)) throw new BiddingWorkflowError("Não é possível alterar a comissão de uma licitação encerrada.");
      if (employees.length !== new Set(members.map((member) => member.employeeId)).size) {
        throw new BiddingWorkflowError("Um ou mais servidores não estão ativos.");
      }

      const appointment = await tx.biddingAppointment.create({
        data: {
          kind,
          name,
          appointedAt,
          endsAt,
          notes: input.notes?.trim() || null,
          members: {
            create: members.map((member) => ({
              employeeId: member.employeeId,
              role: member.role,
              appointedAt,
              endsAt,
            })),
          },
          assignments: {
            create: {
              biddingId: bidding.id,
              role: input.role?.trim() || null,
            },
          },
        },
      });
      const phaseId = await currentPhaseId(tx, bidding.id);
      await writeBiddingAct(tx, {
        biddingId: bidding.id,
        actorUsuarioId: context.user.id,
        type: "APPOINTMENT_ASSIGNED",
        description: `${appointment.name} foi designada para o certame.`,
        phaseId,
      });
      return appointment.id;
    });

    revalidateBiddingPaths(biddingId);
    return { success: true, id: appointmentId, created: true };
  } catch (error) {
    return actionError(error, "Falha ao registrar a designação da comissão.");
  }
}

export async function assignBiddingAppointment(input: { biddingId: string; appointmentId: string; role?: string }): Promise<BiddingActionResult> {
  const context = await getTenantContextForModuleOperation("COMPRAS", "update");
  try {
    const biddingId = requiredText(input.biddingId, "Licitação");
    const appointmentId = requiredText(input.appointmentId, "Designação");
    const assignmentId = await context.prisma.$transaction(async (tx) => {
      const [bidding, appointment] = await Promise.all([
        tx.bidding.findUnique({ where: { id: biddingId }, select: { id: true, status: true } }),
        tx.biddingAppointment.findUnique({ where: { id: appointmentId }, select: { id: true, name: true, status: true } }),
      ]);
      if (!bidding) throw new BiddingWorkflowError("Licitação não encontrada.");
      if (!appointment || appointment.status !== "Ativa") throw new BiddingWorkflowError("A designação informada não está ativa.");
      if (isTerminalBiddingStatus(bidding.status)) throw new BiddingWorkflowError("Não é possível alterar a comissão de uma licitação encerrada.");

      const current = await tx.biddingAppointmentAssignment.findFirst({
        where: { biddingId: bidding.id, appointmentId: appointment.id },
        select: { id: true },
      });
      const assignment = current
        ? await tx.biddingAppointmentAssignment.update({
          where: { id: current.id },
          data: { status: "Ativa", endedAt: null, role: input.role?.trim() || null },
        })
        : await tx.biddingAppointmentAssignment.create({
          data: { biddingId: bidding.id, appointmentId: appointment.id, role: input.role?.trim() || null },
        });
      const phaseId = await currentPhaseId(tx, bidding.id);
      await writeBiddingAct(tx, {
        biddingId: bidding.id,
        actorUsuarioId: context.user.id,
        type: "APPOINTMENT_ASSIGNED",
        description: `${appointment.name} foi vinculada ao certame.`,
        phaseId,
      });
      return assignment.id;
    });
    revalidateBiddingPaths(biddingId);
    return { success: true, id: assignmentId };
  } catch (error) {
    return actionError(error, "Falha ao vincular a designação ao certame.");
  }
}

export async function endBiddingAppointmentAssignment(input: { biddingId: string; assignmentId: string }): Promise<BiddingActionResult> {
  const context = await getTenantContextForModuleOperation("COMPRAS", "update");
  try {
    const biddingId = requiredText(input.biddingId, "Licitação");
    const assignmentId = requiredText(input.assignmentId, "Vínculo de designação");
    await context.prisma.$transaction(async (tx) => {
      const assignment = await tx.biddingAppointmentAssignment.findFirst({
        where: { id: assignmentId, biddingId },
        include: { appointment: { select: { name: true } }, bidding: { select: { status: true } } },
      });
      if (!assignment) throw new BiddingWorkflowError("Vínculo de designação não encontrado.");
      if (isTerminalBiddingStatus(assignment.bidding.status)) throw new BiddingWorkflowError("Não é possível alterar a comissão de uma licitação encerrada.");
      if (assignment.status === "Encerrada") return;
      await tx.biddingAppointmentAssignment.update({
        where: { id: assignment.id },
        data: { status: "Encerrada", endedAt: new Date() },
      });
      const phaseId = await currentPhaseId(tx, biddingId);
      await writeBiddingAct(tx, {
        biddingId,
        actorUsuarioId: context.user.id,
        type: "APPOINTMENT_ENDED",
        description: `${assignment.appointment.name} teve sua vinculação encerrada.`,
        phaseId,
      });
    });
    revalidateBiddingPaths(biddingId);
    return { success: true, id: assignmentId };
  } catch (error) {
    return actionError(error, "Falha ao encerrar a designação do certame.");
  }
}

export async function createBiddingLot(input: {
  biddingId: string;
  description?: string;
  items: BiddingLotItemInput[];
}): Promise<BiddingActionResult> {
  const context = await getTenantContextForModuleOperation("COMPRAS", "update");
  try {
    const biddingId = requiredText(input.biddingId, "Licitação");
    const quantities = new Map<string, number>();
    for (const item of input.items) {
      const itemId = requiredText(item.purchaseProcessItemId, "Item do processo");
      if (quantities.has(itemId)) throw new BiddingWorkflowError("Um item do processo só pode ser informado uma vez no lote.");
      quantities.set(itemId, requiredQuantity(item.quantity, "Quantidade do item"));
    }
    if (!quantities.size) throw new BiddingWorkflowError("Selecione ao menos um item para o lote.");

    const lotId = await context.prisma.$transaction(async (tx) => {
      const bidding = await tx.bidding.findUnique({ where: { id: biddingId }, select: { id: true, processId: true, status: true } });
      if (!bidding) throw new BiddingWorkflowError("Licitação não encontrada.");
      if (!canConfigureBiddingLots(bidding.status)) {
        throw new BiddingWorkflowError("Os lotes só podem ser alterados enquanto a licitação está em elaboração.");
      }

      const itemIds = [...quantities.keys()];
      const [processItems, alreadyAssigned] = await Promise.all([
        tx.purchaseProcessItem.findMany({
          where: { id: { in: itemIds }, purchaseProcessId: bidding.processId },
          select: { id: true, quantity: true, estimatedUnitValue: true },
        }),
        tx.biddingLotItem.findMany({
          where: { purchaseProcessItemId: { in: itemIds }, biddingLot: { biddingId: bidding.id } },
          select: { purchaseProcessItemId: true },
        }),
      ]);
      if (processItems.length !== itemIds.length) throw new BiddingWorkflowError("Um ou mais itens não pertencem ao processo desta licitação.");
      if (alreadyAssigned.length) throw new BiddingWorkflowError("Um ou mais itens já pertencem a outro lote deste certame.");

      let estimatedValue = new Prisma.Decimal(0);
      for (const item of processItems) {
        const quantity = quantities.get(item.id);
        if (!quantity || quantity > item.quantity) {
          throw new BiddingWorkflowError("A quantidade do lote não pode ser maior que a quantidade disponível no processo.");
        }
        estimatedValue = estimatedValue.plus(new Prisma.Decimal(String(item.estimatedUnitValue ?? 0)).mul(String(quantity)));
      }

      const lastLot = await tx.biddingLot.findFirst({
        where: { biddingId: bidding.id },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      const lot = await tx.biddingLot.create({
        data: {
          biddingId: bidding.id,
          number: (lastLot?.number ?? 0) + 1,
          description: input.description?.trim() || null,
          status: BIDDING_LOT_STATUS.DRAFT,
          estimatedValueDecimal: estimatedValue.toDecimalPlaces(2),
          items: {
            create: processItems.map((item) => ({
              purchaseProcessItemId: item.id,
              quantity: quantities.get(item.id) ?? 0,
            })),
          },
        },
      });
      const phaseId = await currentPhaseId(tx, bidding.id);
      await writeBiddingAct(tx, {
        biddingId: bidding.id,
        actorUsuarioId: context.user.id,
        type: "LOT_CREATED",
        description: `Lote ${lot.number} foi criado com ${processItems.length} item(ns).`,
        phaseId,
        biddingLotId: lot.id,
      });
      return lot.id;
    });

    revalidateBiddingPaths(biddingId);
    return { success: true, id: lotId, created: true };
  } catch (error) {
    return actionError(error, "Falha ao criar o lote da licitação.");
  }
}

export async function addBiddingParticipant(input: {
  biddingId: string;
  supplierId: string;
  displayCode?: string;
  notes?: string;
}): Promise<BiddingActionResult> {
  const context = await getTenantContextForModuleOperation("COMPRAS", "update");
  try {
    const biddingId = requiredText(input.biddingId, "Licitação");
    const supplierId = requiredText(input.supplierId, "Fornecedor");
    const displayCode = input.displayCode?.trim() || null;
    const result = await context.prisma.$transaction(async (tx) => {
      const [bidding, supplier] = await Promise.all([
        tx.bidding.findUnique({ where: { id: biddingId }, select: { id: true, status: true } }),
        tx.supplier.findUnique({ where: { id: supplierId }, select: { id: true, status: true } }),
      ]);
      if (!bidding) throw new BiddingWorkflowError("Licitação não encontrada.");
      if (!canRegisterBiddingParticipant(bidding.status)) {
        throw new BiddingWorkflowError("Participantes só podem ser registrados antes da abertura da disputa.");
      }
      if (!supplier || !isActiveStatus(supplier.status)) throw new BiddingWorkflowError("O fornecedor selecionado não está ativo.");
      if (displayCode) {
        const duplicateCode = await tx.biddingParticipant.findFirst({
          where: { biddingId: bidding.id, displayCode },
          select: { id: true },
        });
        if (duplicateCode) throw new BiddingWorkflowError("Este código de participante já está em uso no certame.");
      }

      const existing = await tx.biddingParticipant.findFirst({
        where: { biddingId: bidding.id, supplierId: supplier.id },
        select: { id: true },
      });
      if (existing) return { id: existing.id, created: false };

      const participant = await tx.biddingParticipant.create({
        data: {
          biddingId: bidding.id,
          supplierId: supplier.id,
          displayCode,
          notes: input.notes?.trim() || null,
        },
      });
      const phaseId = await currentPhaseId(tx, bidding.id);
      await writeBiddingAct(tx, {
        biddingId: bidding.id,
        actorUsuarioId: context.user.id,
        type: "PARTICIPANT_REGISTERED",
        description: `Participante ${participant.displayCode || participant.id} foi registrado.`,
        phaseId,
      });
      return { id: participant.id, created: true };
    });
    revalidateBiddingPaths(biddingId);
    return { success: true, ...result };
  } catch (error) {
    return actionError(error, "Falha ao registrar o participante.");
  }
}

export async function saveSupplierPortalIdentity(input: {
  biddingId: string;
  supplierId: string;
  usuarioId: string;
}): Promise<BiddingActionResult> {
  const context = await getTenantContextForModuleOperation("COMPRAS", "update");
  try {
    const biddingId = requiredText(input.biddingId, "Licitação");
    const supplierId = requiredText(input.supplierId, "Fornecedor");
    const usuarioId = requiredText(input.usuarioId, "Usuário do portal");
    const result = await context.prisma.$transaction(async (tx) => {
      const [participant, user] = await Promise.all([
        tx.biddingParticipant.findFirst({
          where: { biddingId, supplierId },
          include: { supplier: { select: { status: true } } },
        }),
        tx.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, ativo: true } }),
      ]);
      if (!participant) throw new BiddingWorkflowError("Registre o fornecedor como participante antes de liberar o portal.");
      if (!isActiveStatus(participant.supplier.status)) throw new BiddingWorkflowError("O fornecedor não está ativo para usar o portal.");
      if (!user?.ativo) throw new BiddingWorkflowError("O usuário selecionado não está ativo.");

      const current = await tx.supplierPortalIdentity.findFirst({
        where: { supplierId, usuarioId },
        select: { id: true },
      });
      const identity = current
        ? await tx.supplierPortalIdentity.update({ where: { id: current.id }, data: { status: "Ativo" } })
        : await tx.supplierPortalIdentity.create({ data: { supplierId, usuarioId, status: "Ativo" } });
      const phaseId = await currentPhaseId(tx, biddingId);
      await writeBiddingAct(tx, {
        biddingId,
        actorUsuarioId: context.user.id,
        type: "SUPPLIER_PORTAL_LINKED",
        description: "Acesso autenticado do fornecedor foi vinculado ao certame.",
        phaseId,
      });
      return { id: identity.id, created: !current };
    });
    revalidateBiddingPaths(biddingId);
    return { success: true, ...result };
  } catch (error) {
    return actionError(error, "Falha ao vincular o acesso do fornecedor.");
  }
}

export async function registerBiddingAct(input: {
  biddingId: string;
  type: string;
  description?: string;
  phaseId?: string;
  biddingLotId?: string;
}): Promise<BiddingActionResult> {
  const context = await getTenantContextForModuleOperation("COMPRAS", "update");
  try {
    const biddingId = requiredText(input.biddingId, "Licitação");
    const type = requiredText(input.type, "Tipo do ato");
    const phaseId = input.phaseId?.trim() || null;
    const biddingLotId = input.biddingLotId?.trim() || null;
    const actId = await context.prisma.$transaction(async (tx) => {
      const bidding = await tx.bidding.findUnique({ where: { id: biddingId }, select: { id: true, status: true } });
      if (!bidding) throw new BiddingWorkflowError("Licitação não encontrada.");
      if (isTerminalBiddingStatus(bidding.status)) throw new BiddingWorkflowError("Não é possível registrar novos atos em uma licitação encerrada.");
      if (phaseId) {
        const phase = await tx.biddingPhase.findFirst({ where: { id: phaseId, biddingId }, select: { id: true } });
        if (!phase) throw new BiddingWorkflowError("A fase selecionada não pertence à licitação.");
      }
      if (biddingLotId) {
        const lot = await tx.biddingLot.findFirst({ where: { id: biddingLotId, biddingId }, select: { id: true } });
        if (!lot) throw new BiddingWorkflowError("O lote selecionado não pertence à licitação.");
      }
      const act = await writeBiddingAct(tx, {
        biddingId,
        actorUsuarioId: context.user.id,
        type,
        description: input.description?.trim() || null,
        phaseId,
        biddingLotId,
      });
      return act.id;
    });
    revalidateBiddingPaths(biddingId);
    return { success: true, id: actId, created: true };
  } catch (error) {
    return actionError(error, "Falha ao registrar o ato da licitação.");
  }
}

export async function decideBiddingEligibility(input: {
  biddingId: string;
  biddingLotId: string;
  participantId: string;
  status: string;
  reason?: string;
  idempotencyKey?: string;
}): Promise<BiddingActionResult> {
  const context = await getTenantContextForModuleOperation("COMPRAS", "update");
  try {
    const biddingId = requiredText(input.biddingId, "Licitação");
    const biddingLotId = requiredText(input.biddingLotId, "Lote");
    const participantId = requiredText(input.participantId, "Participante");
    const status = requiredText(input.status, "Decisão de habilitação");
    if (status !== BIDDING_ELIGIBILITY_STATUS.ELIGIBLE && status !== BIDDING_ELIGIBILITY_STATUS.INELIGIBLE) {
      throw new BiddingWorkflowError("Informe uma decisão de habilitação válida.");
    }
    const idempotencyKey = input.idempotencyKey?.trim() || randomUUID();

    const decisionId = await context.prisma.$transaction(async (tx) => {
      const existing = await tx.biddingEligibility.findUnique({ where: { idempotencyKey }, select: { id: true, biddingLotId: true, participantId: true } });
      if (existing) {
        if (existing.biddingLotId !== biddingLotId || existing.participantId !== participantId) {
          throw new BiddingWorkflowError("A chave de idempotência já pertence a outra decisão.");
        }
        return existing.id;
      }
      const [bidding, lot, participant] = await Promise.all([
        tx.bidding.findUnique({ where: { id: biddingId }, select: { id: true, status: true } }),
        tx.biddingLot.findFirst({ where: { id: biddingLotId, biddingId }, select: { id: true } }),
        tx.biddingParticipant.findFirst({ where: { id: participantId, biddingId }, select: { id: true, displayCode: true } }),
      ]);
      if (!bidding) throw new BiddingWorkflowError("Licitação não encontrada.");
      if (!canDecideBiddingEligibility(bidding.status)) throw new BiddingWorkflowError("Não é possível decidir a habilitação de uma licitação encerrada.");
      if (!lot || !participant) throw new BiddingWorkflowError("O lote ou participante não pertence à licitação.");

      const decision = await tx.biddingEligibility.create({
        data: {
          biddingLotId,
          participantId,
          status,
          reason: input.reason?.trim() || null,
          decidedByUsuarioId: context.user.id,
          idempotencyKey,
        },
      });
      const phaseId = await currentPhaseId(tx, biddingId);
      await writeBiddingAct(tx, {
        biddingId,
        actorUsuarioId: context.user.id,
        type: "ELIGIBILITY_DECIDED",
        description: `${participant.displayCode || "Participante"}: ${status}.`,
        phaseId,
        biddingLotId,
        idempotencyKey: `${idempotencyKey}:ACT`,
      });
      await writeLifecycleEvent(tx, {
        eventType: "BIDDING_ELIGIBILITY_DECIDED",
        biddingId,
        actorUsuarioId: context.user.id,
        sourceType: "BIDDING_LOT",
        sourceId: biddingLotId,
        idempotencyKey: `${idempotencyKey}:LIFECYCLE`,
      });
      return decision.id;
    });
    revalidateBiddingPaths(biddingId);
    return { success: true, id: decisionId };
  } catch (error) {
    return actionError(error, "Falha ao registrar a habilitação do participante.");
  }
}

export async function decideBiddingResult(input: {
  biddingId: string;
  biddingLotId: string;
  biddingBidId: string;
  idempotencyKey?: string;
}): Promise<BiddingActionResult> {
  const context = await getTenantContextForModuleOperation("COMPRAS", "update");
  try {
    const biddingId = requiredText(input.biddingId, "Licitação");
    const biddingLotId = requiredText(input.biddingLotId, "Lote");
    const biddingBidId = requiredText(input.biddingBidId, "Lance");
    const idempotencyKey = input.idempotencyKey?.trim() || randomUUID();
    const resultId = await context.prisma.$transaction(async (tx) => {
      const existing = await tx.biddingResult.findUnique({ where: { idempotencyKey }, select: { id: true, biddingLotId: true, biddingBidId: true } });
      if (existing) {
        if (existing.biddingLotId !== biddingLotId || existing.biddingBidId !== biddingBidId) {
          throw new BiddingWorkflowError("A chave de idempotência já pertence a outra arrematação.");
        }
        return existing.id;
      }

      const lot = await tx.biddingLot.findFirst({
        where: { id: biddingLotId, biddingId },
        include: { bidding: { select: { status: true } } },
      });
      if (!lot) throw new BiddingWorkflowError("O lote não pertence à licitação.");
      if (!canDecideBiddingResult(lot.bidding.status)) {
        throw new BiddingWorkflowError("A arrematação só pode ser registrada durante o julgamento.");
      }
      const bid = await tx.biddingBid.findFirst({
        where: { id: biddingBidId, biddingLotId },
        include: { participant: { select: { id: true, biddingId: true, displayCode: true } } },
      });
      if (!bid || bid.participant.biddingId !== biddingId) throw new BiddingWorkflowError("O lance não pertence ao lote desta licitação.");
      if (bid.status !== BIDDING_BID_STATUS.ACCEPTED) throw new BiddingWorkflowError("Somente lances aceitos podem ser arrematados.");

      const eligibility = await tx.biddingEligibility.findFirst({
        where: { biddingLotId, participantId: bid.participantId },
        orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
        select: { status: true },
      });
      if (!eligibility || !isBiddingParticipantEligible(eligibility.status)) {
        throw new BiddingWorkflowError("O participante precisa estar habilitado neste lote para receber a arrematação.");
      }

      const phaseId = await currentPhaseId(tx, biddingId);
      const act = await writeBiddingAct(tx, {
        biddingId,
        actorUsuarioId: context.user.id,
        type: "RESULT_AWARDED",
        description: `Lote ${lot.number} arrematado pelo participante ${bid.participant.displayCode || bid.participant.id}.`,
        phaseId,
        biddingLotId,
        idempotencyKey: `${idempotencyKey}:ACT`,
      });
      await tx.biddingResult.updateMany({ where: { biddingLotId, isCurrent: true }, data: { isCurrent: false } });
      const result = await tx.biddingResult.create({
        data: {
          biddingLotId,
          participantId: bid.participantId,
          biddingBidId: bid.id,
          biddingActId: act.id,
          status: BIDDING_RESULT_STATUS.AWARDED,
          unitValueDecimal: bid.unitValueDecimal,
          totalValueDecimal: bid.totalValueDecimal,
          decidedByUsuarioId: context.user.id,
          idempotencyKey,
        },
      });
      await tx.biddingLot.update({ where: { id: biddingLotId }, data: { status: BIDDING_LOT_STATUS.AWARDED } });
      await writeLifecycleEvent(tx, {
        eventType: "BIDDING_LOT_AWARDED",
        biddingId,
        actorUsuarioId: context.user.id,
        sourceType: "BIDDING_LOT",
        sourceId: biddingLotId,
        idempotencyKey: `${idempotencyKey}:LIFECYCLE`,
      });
      return result.id;
    });
    revalidateBiddingPaths(biddingId);
    return { success: true, id: resultId };
  } catch (error) {
    return actionError(error, "Falha ao registrar a arrematação do lote.");
  }
}

export async function submitBiddingBid(input: {
  participantId: string;
  biddingLotId: string;
  totalValue: number;
  unitValue?: number | null;
  idempotencyKey: string;
}): Promise<BiddingActionResult> {
  const context = await getCurrentTenantContext();
  try {
    const participantId = requiredText(input.participantId, "Participante");
    const biddingLotId = requiredText(input.biddingLotId, "Lote");
    const idempotencyKey = requiredText(input.idempotencyKey, "Chave de idempotência");
    const totalValueDecimal = requiredMoney(input.totalValue, "Valor total do lance");
    const unitValueDecimal = optionalMoney(input.unitValue, "Valor unitário do lance");

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await context.prisma.$transaction(async (tx) => {
          const participant = await tx.biddingParticipant.findUnique({
            where: { id: participantId },
            include: {
              supplier: { select: { status: true } },
              bidding: { select: { id: true, status: true, sessionDate: true } },
            },
          });
          if (!participant || isInactiveParticipantStatus(participant.status)) {
            throw new BiddingWorkflowError("O participante não está ativo para apresentar lances.");
          }

          const identity = await tx.supplierPortalIdentity.findFirst({
            where: {
              supplierId: participant.supplierId,
              usuarioId: context.user.id,
              status: "Ativo",
            },
            select: { id: true },
          });
          if (!identity || !isActiveStatus(participant.supplier.status)) {
            throw new BiddingWorkflowError("Sua conta não possui acesso ativo para enviar lances deste fornecedor.");
          }

          const existing = await tx.biddingBid.findUnique({ where: { idempotencyKey } });
          if (existing) {
            if (
              existing.biddingLotId !== biddingLotId
              || existing.participantId !== participant.id
              || existing.supplierPortalIdentityId !== identity.id
              || !existing.totalValueDecimal.equals(totalValueDecimal)
              || !decimalsEqual(existing.unitValueDecimal, unitValueDecimal)
            ) {
              throw new BiddingWorkflowError("A chave de idempotência já foi usada para outro lance.");
            }
            return { id: existing.id, alreadySubmitted: true, biddingId: participant.bidding.id };
          }

          const lot = await tx.biddingLot.findFirst({
            where: { id: biddingLotId, biddingId: participant.bidding.id },
            select: { id: true, status: true },
          });
          if (!lot) throw new BiddingWorkflowError("O lote não pertence a este certame.");
          if (!participant.bidding.sessionDate) throw new BiddingWorkflowError("O certame não possui prazo definido para lances.");
          if (!isBiddingBidSubmissionOpen({
            biddingStatus: participant.bidding.status,
            lotStatus: lot.status,
            deadline: participant.bidding.sessionDate,
          })) {
            throw new BiddingWorkflowError("O prazo de lances está encerrado ou a disputa não está aberta.");
          }

          const eligibility = await tx.biddingEligibility.findFirst({
            where: { biddingLotId: lot.id, participantId: participant.id },
            orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
            select: { status: true },
          });
          if (!eligibility || !isBiddingParticipantEligible(eligibility.status)) {
            throw new BiddingWorkflowError("Seu fornecedor precisa estar habilitado neste lote antes de apresentar lances.");
          }

          const lastBid = await tx.biddingBid.findFirst({
            where: { biddingLotId: lot.id },
            orderBy: { sequence: "desc" },
            select: { sequence: true },
          });
          const bid = await tx.biddingBid.create({
            data: {
              biddingLotId: lot.id,
              participantId: participant.id,
              supplierPortalIdentityId: identity.id,
              kind: "Lance",
              unitValueDecimal,
              totalValueDecimal,
              sequence: (lastBid?.sequence ?? 0) + 1,
              status: BIDDING_BID_STATUS.ACCEPTED,
              idempotencyKey,
            },
          });
          const phaseId = await currentPhaseId(tx, participant.bidding.id);
          await writeBiddingAct(tx, {
            biddingId: participant.bidding.id,
            actorUsuarioId: context.user.id,
            type: "BID_SUBMITTED",
            description: `Lance ${bid.sequence} recebido para o lote ${lot.id}.`,
            phaseId,
            biddingLotId: lot.id,
            idempotencyKey: `${idempotencyKey}:ACT`,
          });
          await writeLifecycleEvent(tx, {
            eventType: "BIDDING_BID_SUBMITTED",
            biddingId: participant.bidding.id,
            actorUsuarioId: context.user.id,
            sourceType: "BIDDING_LOT",
            sourceId: lot.id,
            idempotencyKey: `${idempotencyKey}:LIFECYCLE`,
          });
          return { id: bid.id, alreadySubmitted: false, biddingId: participant.bidding.id };
        });
        revalidateBiddingPaths(result.biddingId);
        return { success: true, id: result.id, alreadySubmitted: result.alreadySubmitted };
      } catch (error) {
        if (!isUniqueConstraint(error)) throw error;
        const existing = await context.prisma.biddingBid.findUnique({ where: { idempotencyKey } });
        if (existing) {
          if (
            existing.biddingLotId !== biddingLotId
            || existing.participantId !== participantId
            || !existing.totalValueDecimal.equals(totalValueDecimal)
            || !decimalsEqual(existing.unitValueDecimal, unitValueDecimal)
          ) {
            throw new BiddingWorkflowError("A chave de idempotência já foi usada para outro lance.");
          }
          revalidateBiddingPaths();
          return { success: true, id: existing.id, alreadySubmitted: true };
        }
        if (attempt === 2) throw new BiddingWorkflowError("Outro lance foi registrado ao mesmo tempo. Tente novamente.");
      }
    }
    throw new BiddingWorkflowError("Não foi possível registrar o lance.");
  } catch (error) {
    return actionError(error, "Falha ao registrar o lance.");
  }
}
