import { z } from "zod";
import type { AppContext } from "@/lib/platform/tenant-context";
import { AccessError } from "@/lib/platform/tenant-context";
import { transitionRegulationRequest } from "./regulation-service";

export class ProviderError extends Error {}

export async function resolveProviderSupplier(context: AppContext) {
  const access = await context.prisma.healthProviderAccess.findFirst({
    where: { usuarioId: context.user.id, isActive: true },
    select: { supplierId: true, supplier: { select: { id: true, status: true, person: { select: { fullName: true } }, company: { select: { corporateName: true } } } } },
  });
  if (!access || access.supplier.status !== "Ativo") throw new AccessError("Nenhum prestador ativo vinculado a este acesso.", 403);
  return access.supplier;
}

// Guias do prestador: solicitações autorizadas/agendadas vinculadas às
// cotas do próprio fornecedor. Prestador A nunca enxerga o Prestador B.
export async function providerGuides(context: AppContext, supplierId: string) {
  return context.prisma.healthRegulationRequest.findMany({
    where: { quota: { providerSupplierId: supplierId }, status: { in: ["AUTORIZADA", "AGENDADA", "EXECUTADA", "CONCLUIDA"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { patient: { include: { person: { select: { fullName: true } } } }, specialty: true, service: true, procedure: { select: { code: true, description: true } }, requestUnit: true },
  });
}

const executeSchema = z.object({ requestId: z.string().min(1), notes: z.string().trim().max(2000).nullable().optional() }).strict();

export async function providerExecuteGuide(context: AppContext, supplierId: string, raw: unknown) {
  const input = executeSchema.parse(raw);
  const request = await context.prisma.healthRegulationRequest.findUnique({ where: { id: input.requestId }, select: { id: true, status: true, quota: { select: { providerSupplierId: true } } } });
  if (!request || request.quota?.providerSupplierId !== supplierId) throw new AccessError("Guia não encontrada para este prestador.", 404);
  if (!["AUTORIZADA", "AGENDADA"].includes(request.status)) throw new ProviderError("Somente guias autorizadas ou agendadas podem ser executadas.");
  return transitionRegulationRequest(context, request.id, "EXECUTADA", { notes: input.notes || null });
}

export async function providerHistory(context: AppContext, supplierId: string) {
  return context.prisma.healthRegulationRequest.findMany({
    where: { quota: { providerSupplierId: supplierId }, status: { in: ["EXECUTADA", "CONCLUIDA", "CANCELADA"] } },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: { id: true, status: true, guideNumber: true, executedAt: true, returnedAt: true, updatedAt: true, patient: { select: { person: { select: { fullName: true } } } } },
  });
}
