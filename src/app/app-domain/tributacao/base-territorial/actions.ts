"use server";

import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";

type Result = { error?: string };
function required(value: unknown, label: string) { const text = String(value ?? "").trim(); if (!text) throw new Error(`${label} é obrigatório.`); return text; }

export async function saveTerritorialRecord(input: { code: string; recordType: string; sectorCode: string; neighborhood: string; streetName: string; side?: string; rangeStart?: string; rangeEnd?: string; effectiveFrom: string }): Promise<Result> {
  try {
    const code = required(input.code, "Código").toUpperCase(); const recordType = required(input.recordType, "Tipo").toUpperCase();
    if (!["SETOR", "FACE", "FAIXA"].includes(recordType)) throw new Error("Tipo territorial inválido.");
    const effectiveFrom = new Date(`${required(input.effectiveFrom, "Vigência")}T12:00:00.000Z`); if (Number.isNaN(effectiveFrom.getTime())) throw new Error("Vigência inválida.");
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    await context.prisma.$transaction(async (tx) => {
      const previous = await tx.taxRegistryEntry.findFirst({ where: { entityType: "TERRITORIAL_BASE", entityId: code, category: recordType }, orderBy: { version: "desc" }, select: { version: true } });
      const entry = await tx.taxRegistryEntry.create({ data: { entityType: "TERRITORIAL_BASE", entityId: code, category: recordType, title: `${recordType} ${code}`, data: { details: `${input.streetName} · ${input.neighborhood}`, sectorCode: input.sectorCode, neighborhood: input.neighborhood, streetName: input.streetName, side: input.side || null, rangeStart: input.rangeStart || null, rangeEnd: input.rangeEnd || null }, status: "ATIVO", source: "INTERNO", effectiveFrom, actorUsuarioId: context.user.id, version: (previous?.version ?? 0) + 1 } });
      await tx.taxAuditLog.create({ data: { action: "UPSERT_TERRITORIAL_BASE", entityType: "TaxRegistryEntry", entityId: entry.id, payload: { code, recordType, version: entry.version }, authorUsuarioId: context.user.id, authorEmployeeId: context.user.employeeId } });
    });
    revalidatePath("/tributacao/base-territorial"); return {};
  } catch (error) { return { error: error instanceof Error ? error.message : "Não foi possível salvar o registro territorial." }; }
}
