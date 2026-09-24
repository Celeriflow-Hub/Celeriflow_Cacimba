import { z } from "zod";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";

export class TfdError extends Error {}

const requestSchema = z.object({
  patientId: z.string().min(1),
  regulationRequestId: z.string().min(1).nullable().optional(),
  originUnitId: z.string().min(1).nullable().optional(),
  destination: z.string().trim().min(3).max(200),
  reason: z.string().trim().min(3).max(2000),
  priority: z.enum(["Alta","Media","Normal"]).default("Normal"),
  companionName: z.string().trim().max(120).nullable().optional(),
  companionDocument: z.string().trim().max(30).nullable().optional(),
}).strict();

const tripSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  origin: z.string().trim().min(2).max(200),
  destination: z.string().trim().min(2).max(200),
  fleetUnitId: z.string().min(1),
  driverEmployeeId: z.string().min(1).nullable().optional(),
  capacity: z.number().int().positive().max(100),
}).strict();

export async function createTfdRequest(context: AppContext, raw: unknown) {
  const input = requestSchema.parse(raw);
  if (input.originUnitId) assertHealthUnitAccess(context.user, input.originUnitId);
  const patient = await context.prisma.patient.findUnique({ where: { id: input.patientId }, select: { id: true } });
  if (!patient) throw new TfdError("Paciente não encontrado.");
  return context.prisma.healthTfdRequest.create({
    data: {
      patientId: input.patientId,
      regulationRequestId: input.regulationRequestId || null,
      originUnitId: input.originUnitId || null,
      destination: input.destination,
      reason: input.reason,
      priority: input.priority,
      companionName: input.companionName || null,
      companionDocument: input.companionDocument || null,
      createdByUsuarioId: context.user.id,
    },
    select: { id: true },
  });
}

export async function authorizeTfdRequest(context: AppContext, id: string) {
  const req = await context.prisma.healthTfdRequest.findUnique({ where: { id }, select: { id: true, status: true, originUnitId: true } });
  if (!req) throw new TfdError("Solicitação TFD não encontrada.");
  if (req.originUnitId) assertHealthUnitAccess(context.user, req.originUnitId);
  if (req.status !== "SOLICITADA") throw new TfdError("Somente solicitações pendentes podem ser autorizadas.");
  return context.prisma.healthTfdRequest.update({ where: { id }, data: { status: "AUTORIZADA", authorizedAt: new Date() }, select: { id: true } });
}

export async function createTfdTrip(context: AppContext, raw: unknown) {
  const input = tripSchema.parse(raw);
  const fleet = await context.prisma.fleetUnit.findUnique({ where: { id: input.fleetUnitId }, select: { id: true } });
  if (!fleet) throw new TfdError("Veículo não encontrado. Use um veículo do módulo Frotas.");
  if (input.driverEmployeeId) {
    const driver = await context.prisma.employee.findUnique({ where: { id: input.driverEmployeeId }, select: { id: true } });
    if (!driver) throw new TfdError("Condutor não encontrado.");
  }
  return context.prisma.healthTfdTrip.create({
    data: {
      date: new Date(`${input.date}T12:00:00`),
      origin: input.origin,
      destination: input.destination,
      fleetUnitId: input.fleetUnitId,
      driverEmployeeId: input.driverEmployeeId || null,
      capacity: input.capacity,
      createdByUsuarioId: context.user.id,
    },
    select: { id: true },
  });
}

export async function addPassenger(context: AppContext, input: { tripId: string; patientId: string; tfdRequestId?: string | null; companionName?: string | null; companionDocument?: string | null; kind?: string }) {
  const trip = await context.prisma.healthTfdTrip.findUnique({ where: { id: input.tripId }, select: { id: true, capacity: true, status: true } });
  if (!trip) throw new TfdError("Viagem não encontrada.");
  if (["CONCLUIDA","CANCELADA"].includes(trip.status)) throw new TfdError("Viagem já concluída.");
  const patient = await context.prisma.patient.findUnique({ where: { id: input.patientId }, select: { id: true } });
  if (!patient) throw new TfdError("Paciente não encontrado.");
  const kind = input.kind === "ACOMPANHANTE" ? "ACOMPANHANTE" : "PACIENTE";
  return context.prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.tripId}))`;
    const count = await tx.healthTfdPassenger.count({ where: { tripId: input.tripId } });
    if (count >= trip.capacity) throw new TfdError("Capacidade do veículo atingida.");
    // companionName distinguishes companion row, but patientId+kind unique prevents duplicate
    return tx.healthTfdPassenger.create({
      data: {
        tripId: input.tripId,
        patientId: input.patientId,
        tfdRequestId: input.tfdRequestId || null,
        companionName: input.companionName || null,
        companionDocument: input.companionDocument || null,
        kind,
      },
      select: { id: true },
    });
  });
}

export async function movePassenger(context: AppContext, passengerId: string, targetTripId: string) {
  const passenger = await context.prisma.healthTfdPassenger.findUnique({ where: { id: passengerId }, select: { id: true, tripId: true, patientId: true, kind: true, companionName: true, companionDocument: true, tfdRequestId: true } });
  if (!passenger) throw new TfdError("Passageiro não encontrado.");
  const target = await context.prisma.healthTfdTrip.findUnique({ where: { id: targetTripId }, select: { id: true, capacity: true } });
  if (!target) throw new TfdError("Viagem destino não encontrada.");
  return context.prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${targetTripId}))`;
    const count = await tx.healthTfdPassenger.count({ where: { tripId: targetTripId } });
    if (count >= target.capacity) throw new TfdError("Capacidade da viagem destino atingida.");
    await tx.healthTfdPassenger.delete({ where: { id: passengerId } });
    return tx.healthTfdPassenger.create({ data: { tripId: targetTripId, patientId: passenger.patientId, tfdRequestId: passenger.tfdRequestId, companionName: passenger.companionName, companionDocument: passenger.companionDocument, kind: passenger.kind }, select: { id: true } });
  });
}

export async function requestPassengerRemoval(context: AppContext, passengerId: string) {
  const passenger = await context.prisma.healthTfdPassenger.findUnique({ where: { id: passengerId }, select: { id: true } });
  if (!passenger) throw new TfdError("Passageiro não encontrado.");
  const existing = await context.prisma.healthTfdPassengerRemoval.findUnique({ where: { passengerId }, select: { id: true, status: true } });
  if (existing && existing.status === "Pendente") throw new TfdError("Já existe pedido de exclusão pendente.");
  return context.prisma.healthTfdPassengerRemoval.upsert({ where: { passengerId }, create: { passengerId, requestedByUsuarioId: context.user.id }, update: { requestedByUsuarioId: context.user.id, confirmedByUsuarioId: null, status: "Pendente" }, select: { id: true } });
}

// Dupla custódia: a confirmação exige usuário diferente do solicitante.
export async function confirmPassengerRemoval(context: AppContext, passengerId: string, approve: boolean) {
  const removal = await context.prisma.healthTfdPassengerRemoval.findUnique({ where: { passengerId }, select: { id: true, status: true, requestedByUsuarioId: true } });
  if (!removal || removal.status !== "Pendente") throw new TfdError("Pedido de exclusão não está pendente.");
  if (removal.requestedByUsuarioId === context.user.id) throw new TfdError("A confirmação exige um segundo usuário (dupla custódia).");
  if (!approve) {
    return context.prisma.healthTfdPassengerRemoval.update({ where: { id: removal.id }, data: { status: "Cancelada", confirmedByUsuarioId: context.user.id }, select: { id: true } });
  }
  return context.prisma.$transaction(async tx => {
    await tx.healthTfdPassenger.delete({ where: { id: passengerId } });
    return tx.healthTfdPassengerRemoval.update({ where: { id: removal.id }, data: { status: "Confirmada", confirmedByUsuarioId: context.user.id }, select: { id: true } });
  });
}

export async function updateTripStatus(context: AppContext, tripId: string, status: string) {
  const allowed: Record<string, string[]> = {
    PLANEJADA: ["EMBARCANDO","CANCELADA"],
    EMBARCANDO: ["EM_TRANSITO","CANCELADA"],
    EM_TRANSITO: ["RETORNANDO","CONCLUIDA"],
    RETORNANDO: ["CONCLUIDA"],
  };
  const trip = await context.prisma.healthTfdTrip.findUnique({ where: { id: tripId }, select: { id: true, status: true } });
  if (!trip) throw new TfdError("Viagem não encontrada.");
  if (trip.status === status) return trip;
  if (!allowed[trip.status]?.includes(status)) throw new TfdError(`Transição de ${trip.status} para ${status} não permitida.`);
  const data: Record<string, unknown> = { status };
  if (status === "EM_TRANSITO") data["departureAt"] = new Date();
  if (status === "CONCLUIDA") data["returnAt"] = new Date();
  return context.prisma.healthTfdTrip.update({ where: { id: tripId }, data, select: { id: true, status: true } });
}
