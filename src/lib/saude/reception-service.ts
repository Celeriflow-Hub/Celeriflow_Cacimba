import { z } from "zod";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";

export class ReceptionError extends Error {}

const RISK_LABELS = ["Não urgente", "Pouco urgente", "Urgente", "Muita urgência", "Emergência"];
const RISK_COLORS = ["#2563eb", "#16a34a", "#eab308", "#f97316", "#dc2626"];
const RISK_WAITS = [240, 120, 60, 30, 10];

// Classificação de risco configurável (níveis, cores, tempos). Não
// incorpora protocolo clínico oficial; a comissão configura os valores.
export async function ensureRiskProtocols(context: AppContext) {
  for (let level = 1; level <= 5; level += 1) {
    await context.prisma.healthRiskProtocol.upsert({
      where: { level },
      create: { level, label: `Nível ${6 - level} · ${RISK_LABELS[5 - level]}`, colorHex: RISK_COLORS[5 - level], maxWaitMinutes: RISK_WAITS[5 - level] },
      update: {},
      select: { id: true },
    });
  }
  return context.prisma.healthRiskProtocol.findMany({ where: { isActive: true }, orderBy: { level: "asc" } });
}

export async function saveRiskProtocol(context: AppContext, raw: unknown) {
  const input = z.object({ level: z.number().int().min(1).max(5), label: z.string().trim().min(2).max(80), colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/), maxWaitMinutes: z.number().int().min(0).max(1440) }).strict().parse(raw);
  return context.prisma.healthRiskProtocol.upsert({ where: { level: input.level }, create: { ...input, isActive: true }, update: { label: input.label, colorHex: input.colorHex, maxWaitMinutes: input.maxWaitMinutes, isActive: true }, select: { id: true } });
}

export async function saveDestination(context: AppContext, raw: unknown) {
  const input = z.object({ name: z.string().trim().min(2).max(120) }).strict().parse(raw);
  const name = input.name;
  const existing = await context.prisma.healthDestination.findUnique({ where: { name }, select: { id: true } });
  if (existing) return context.prisma.healthDestination.update({ where: { id: existing.id }, data: { isActive: true }, select: { id: true } });
  return context.prisma.healthDestination.create({ data: { name }, select: { id: true } });
}

export async function saveRoom(context: AppContext, raw: unknown) {
  const input = z.object({ unitId: z.string().min(1), name: z.string().trim().min(2).max(120), kind: z.enum(["Atendimento", "Triagem"]).default("Atendimento") }).strict().parse(raw);
  assertHealthUnitAccess(context.user, input.unitId);
  return context.prisma.healthRoom.upsert({ where: { unitId_name: { unitId: input.unitId, name: input.name.trim() } }, create: { unitId: input.unitId, name: input.name.trim(), kind: input.kind }, update: { kind: input.kind, isActive: true }, select: { id: true } });
}

const receptionSchema = z.object({
  patientId: z.string().min(1).nullable().optional(),
  unidentifiedName: z.string().trim().max(200).nullable().optional(),
  unitId: z.string().min(1),
  priorityFlags: z.array(z.enum(["GESTANTE", "IDOSO", "DEFICIENTE"])).max(3).default([]),
  companionName: z.string().trim().max(200).nullable().optional(),
  companionKinship: z.string().trim().max(60).nullable().optional(),
  companionPhone: z.string().trim().max(30).nullable().optional(),
  transportMode: z.enum(["Meios próprios", "Socorro"]).nullable().optional(),
  agreement: z.string().trim().max(120).nullable().optional(),
  roomId: z.string().min(1).nullable().optional(),
  destinationId: z.string().min(1).nullable().optional(),
}).strict();

export async function createReception(context: AppContext, raw: unknown) {
  const input = receptionSchema.parse(raw);
  assertHealthUnitAccess(context.user, input.unitId);
  if (!input.patientId && !(input.unidentifiedName || "").trim()) throw new ReceptionError("Identifique o paciente ou registre atendimento sem identificação.");
  if (input.patientId && !await context.prisma.patient.findFirst({ where: { id: input.patientId, status: "Ativo" }, select: { id: true } })) throw new ReceptionError("Paciente ativo não encontrado.");
  if (input.roomId) {
    const room = await context.prisma.healthRoom.findUnique({ where: { id: input.roomId }, select: { unitId: true, isActive: true } });
    if (!room?.isActive || room.unitId !== input.unitId) throw new ReceptionError("Sala inválida para a unidade.");
  }
  return context.prisma.healthReception.create({
    data: { patientId: input.patientId || null, unidentifiedName: input.patientId ? null : (input.unidentifiedName || "").trim(), unitId: input.unitId, priorityFlags: input.priorityFlags.join(","), companionName: input.companionName || null, companionKinship: input.companionKinship || null, companionPhone: input.companionPhone || null, transportMode: input.transportMode || null, agreement: input.agreement || null, roomId: input.roomId || null, destinationId: input.destinationId || null, createdByUsuarioId: context.user.id },
    select: { id: true },
  });
}

export async function linkReceptionPatient(context: AppContext, receptionId: string, patientId: string) {
  const reception = await context.prisma.healthReception.findUnique({ where: { id: receptionId }, select: { id: true, unitId: true, patientId: true } });
  if (!reception) throw new ReceptionError("Recepção não encontrada.");
  assertHealthUnitAccess(context.user, reception.unitId);
  if (reception.patientId) throw new ReceptionError("Recepção já vinculada.");
  if (!await context.prisma.patient.findFirst({ where: { id: patientId, status: "Ativo" }, select: { id: true } })) throw new ReceptionError("Paciente ativo não encontrado.");
  return context.prisma.healthReception.update({ where: { id: receptionId }, data: { patientId, unidentifiedName: null }, select: { id: true } });
}

export async function transitionReception(context: AppContext, receptionId: string, status: string, outcome?: string | null) {
  const target = status.trim();
  if (!["Aguardando", "Em atendimento", "Concluída", "Evadiu-se", "Cancelada"].includes(target)) throw new ReceptionError("Situação inválida.");
  const reception = await context.prisma.healthReception.findUnique({ where: { id: receptionId }, select: { id: true, unitId: true, status: true } });
  if (!reception) throw new ReceptionError("Recepção não encontrada.");
  assertHealthUnitAccess(context.user, reception.unitId);
  if (["Concluída", "Evadiu-se", "Cancelada"].includes(reception.status)) throw new ReceptionError("Recepção já encerrada.");
  return context.prisma.healthReception.update({ where: { id: receptionId }, data: { status: target, outcome: outcome?.trim() || null }, select: { id: true } });
}

const bedSchema = z.object({ unitId: z.string().min(1), room: z.string().trim().max(80).nullable().optional(), code: z.string().trim().min(1).max(40) }).strict();

export async function saveBed(context: AppContext, raw: unknown) {
  const input = bedSchema.parse(raw);
  assertHealthUnitAccess(context.user, input.unitId);
  return context.prisma.healthBed.upsert({ where: { unitId_code: { unitId: input.unitId, code: input.code.trim().toUpperCase() } }, create: { unitId: input.unitId, room: input.room || null, code: input.code.trim().toUpperCase() }, update: { room: input.room || null }, select: { id: true } });
}

export async function transitionBed(context: AppContext, bedId: string, status: string) {
  const target = status.trim();
  if (!["Livre", "Ocupado", "Manutenção", "Reservado", "Limpeza"].includes(target)) throw new ReceptionError("Situação do leito inválida.");
  const bed = await context.prisma.healthBed.findUnique({ where: { id: bedId }, select: { id: true, unitId: true } });
  if (!bed) throw new ReceptionError("Leito não encontrado.");
  assertHealthUnitAccess(context.user, bed.unitId);
  if (target === "Ocupado") throw new ReceptionError("Ocupação de leito exige internação do paciente.");
  const open = await context.prisma.healthBedOccupancy.count({ where: { bedId, dischargedAt: null } });
  if (open > 0 && target !== "Ocupado") throw new ReceptionError("Leito com internação ativa.");
  return context.prisma.healthBed.update({ where: { id: bedId }, data: { status: target }, select: { id: true } });
}

export async function admitBed(context: AppContext, raw: unknown) {
  const input = z.object({ bedId: z.string().min(1), patientId: z.string().min(1), notes: z.string().trim().max(1000).nullable().optional() }).strict().parse(raw);
  const bed = await context.prisma.healthBed.findUnique({ where: { id: input.bedId }, select: { id: true, unitId: true, status: true } });
  if (!bed) throw new ReceptionError("Leito não encontrado.");
  assertHealthUnitAccess(context.user, bed.unitId);
  if (bed.status !== "Livre") throw new ReceptionError("Somente leitos livres recebem internação.");
  if (!await context.prisma.patient.findFirst({ where: { id: input.patientId, status: "Ativo" }, select: { id: true } })) throw new ReceptionError("Paciente ativo não encontrado.");
  return context.prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.bedId}))`;
    if (await tx.healthBedOccupancy.findFirst({ where: { bedId: input.bedId, dischargedAt: null }, select: { id: true } })) throw new ReceptionError("Leito ocupado por outra internação.");
    await tx.healthBedOccupancy.create({ data: { bedId: input.bedId, patientId: input.patientId, notes: input.notes || null } });
    return tx.healthBed.update({ where: { id: input.bedId }, data: { status: "Ocupado" }, select: { id: true } });
  });
}

export async function dischargeBed(context: AppContext, occupancyId: string) {
  const occupancy = await context.prisma.healthBedOccupancy.findUnique({ where: { id: occupancyId }, select: { id: true, bedId: true, dischargedAt: true, bed: { select: { unitId: true } } } });
  if (!occupancy || occupancy.dischargedAt) throw new ReceptionError("Internação não encontrada ou já encerrada.");
  assertHealthUnitAccess(context.user, occupancy.bed.unitId);
  return context.prisma.$transaction(async tx => {
    await tx.healthBedOccupancy.update({ where: { id: occupancyId }, data: { dischargedAt: new Date() } });
    return tx.healthBed.update({ where: { id: occupancy.bedId }, data: { status: "Limpeza" }, select: { id: true } });
  });
}

const observationSchema = z.object({ patientId: z.string().min(1), unitId: z.string().min(1), bedId: z.string().min(1).nullable().optional(), responsible: z.string().trim().max(200).nullable().optional(), solicitedBy: z.string().trim().max(200).nullable().optional() }).strict();

export async function createObservation(context: AppContext, raw: unknown) {
  const input = observationSchema.parse(raw);
  assertHealthUnitAccess(context.user, input.unitId);
  if (!await context.prisma.patient.findFirst({ where: { id: input.patientId, status: "Ativo" }, select: { id: true } })) throw new ReceptionError("Paciente ativo não encontrado.");
  if (input.bedId && !await context.prisma.healthBed.findFirst({ where: { id: input.bedId, unitId: input.unitId }, select: { id: true } })) throw new ReceptionError("Leito inválido para a unidade.");
  return context.prisma.healthObservation.create({ data: { patientId: input.patientId, unitId: input.unitId, bedId: input.bedId || null, responsible: input.responsible || null, solicitedBy: input.solicitedBy || null, createdByUsuarioId: context.user.id }, select: { id: true } });
}

export async function transitionObservation(context: AppContext, observationId: string, status: string) {
  const target = status.trim();
  if (!["Em observação", "Alta", "Transferido"].includes(target)) throw new ReceptionError("Situação inválida.");
  const observation = await context.prisma.healthObservation.findUnique({ where: { id: observationId }, select: { id: true, unitId: true, status: true } });
  if (!observation) throw new ReceptionError("Observação não encontrada.");
  assertHealthUnitAccess(context.user, observation.unitId);
  if (observation.status !== "Em observação") throw new ReceptionError("Observação já encerrada.");
  return context.prisma.healthObservation.update({ where: { id: observationId }, data: { status: target, dischargedAt: new Date() }, select: { id: true } });
}
