"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { HealthOperationError } from "@/lib/saude/appointment-service";
import { healthSusImportInputSchema, parseHealthSusImport } from "@/lib/saude/sus-import-contract";
import { processHealthSusRecords } from "@/lib/saude/sus-import-service";

const MAX_FILE_SIZE = 700 * 1024;

function hasErrorCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

export type HealthSusImportActionResult =
  | { success: true; batchId: string; duplicate: boolean }
  | { error: string };

function errorMessage(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Revise os dados da carga.";
  if (error instanceof AccessError || error instanceof HealthOperationError) return error.message;
  if (error instanceof Error && [
    "O arquivo está vazio.",
    "O arquivo deve conter cabeçalho e ao menos um registro.",
    "O arquivo possui aspas não encerradas.",
    "O cabeçalho possui colunas vazias ou repetidas.",
    "O XML não contém registros reconhecidos pelo contrato local controlado.",
    "Use um arquivo XML, CSV ou TXT.",
  ].includes(error.message)) return error.message;
  if (error instanceof Error && error.message.startsWith("O arquivo excede o limite")) return error.message;
  if (error instanceof Error && error.message.startsWith("A linha ")) return error.message;
  return "Não foi possível concluir a carga. Nenhum dado parcial foi mantido.";
}

export async function importHealthSusFile(formData: FormData): Promise<HealthSusImportActionResult> {
  let batchId: string | null = null;
  let committed = false;
  let duplicateKey: { source: string; competence: string; checksum: string } | null = null;
  try {
    const input = healthSusImportInputSchema.parse({
      source: formData.get("source"),
      competence: formData.get("competence"),
      origin: formData.get("origin"),
    });
    const context = await getTenantContextForModuleOperation("SAUDE", "create");
    if (context.user.hasHealthAccessScope) throw new AccessError("Cargas globais do SUS exigem acesso administrativo sem restrição por unidade.", 403);
    const file = formData.get("file");
    if (!(file instanceof File) || !file.name || file.size === 0) throw new HealthOperationError("Selecione um arquivo para processar.");
    if (file.size > MAX_FILE_SIZE) throw new HealthOperationError("O arquivo deve ter no máximo 700 KB.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["xml", "csv", "txt"].includes(extension)) throw new HealthOperationError("Use um arquivo XML, CSV ou TXT.");
    const bytes = Buffer.from(await file.arrayBuffer());
    let content: string;
    try {
      content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new HealthOperationError("O arquivo deve estar codificado em UTF-8.");
    }
    const records = parseHealthSusImport(content, extension);
    const checksum = createHash("sha256").update(bytes).digest("hex");
    duplicateKey = { source: input.source, competence: input.competence, checksum };
    const existing = await context.prisma.healthSusImportBatch.findUnique({
      where: { source_competence_checksum: { source: input.source, competence: input.competence, checksum } },
      select: { id: true, status: true },
    });
    if (existing?.status === "PROCESSING") return { error: "Uma carga idêntica já está em processamento." };
    if (existing && existing.status !== "FAILED") return { success: true, batchId: existing.id, duplicate: true };
    const batch = existing
      ? await context.prisma.healthSusImportBatch.update({
          where: { id: existing.id },
          data: { status: "PROCESSING", origin: input.origin, fileName: file.name.slice(0, 255), fileFormat: extension.toUpperCase(), actorUsuarioId: context.user.id, startedAt: new Date(), completedAt: null },
          select: { id: true },
        })
      : await context.prisma.healthSusImportBatch.create({
          data: {
            source: input.source,
            competence: input.competence,
            origin: input.origin,
            fileName: file.name.slice(0, 255),
            fileFormat: extension.toUpperCase(),
            contractVersion: "LOCAL_CONTROLLED_V1",
            checksum,
            actorUsuarioId: context.user.id,
          },
          select: { id: true },
        });
    batchId = batch.id;
    await context.prisma.$transaction(async tx => {
      await tx.healthSusImportIssue.deleteMany({ where: { batchId: batch.id } });
      const result = await processHealthSusRecords(tx, { source: input.source, competence: input.competence, batchId: batch.id, records });
      if (result.issues.length) await tx.healthSusImportIssue.createMany({ data: result.issues.map(item => ({ ...item, batchId: batch.id })) });
      await tx.healthSusImportBatch.update({
        where: { id: batch.id },
        data: {
          status: result.issues.length ? "COMPLETED_WITH_ISSUES" : "COMPLETED",
          processedCount: result.counters.processed,
          insertedCount: result.counters.inserted,
          updatedCount: result.counters.updated,
          ignoredCount: result.counters.ignored,
          issueCount: result.issues.length,
          completedAt: new Date(),
        },
      });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_SUS_IMPORT", targetId: batch.id });
    }, { timeout: 60_000 });
    committed = true;
    try {
      revalidatePath("/app-domain/saude/administracao");
      revalidatePath("/app-domain/saude/administracao/importacoes");
      revalidatePath("/app-domain/saude/administracao/procedimentos");
    } catch {
      // The committed import remains authoritative if cache invalidation is unavailable.
    }
    return { success: true, batchId: batch.id, duplicate: false };
  } catch (error) {
    if (!batchId && duplicateKey && hasErrorCode(error, "P2002")) {
      try {
        const context = await getTenantContextForModuleOperation("SAUDE", "create");
        const concurrent = await context.prisma.healthSusImportBatch.findUnique({ where: { source_competence_checksum: duplicateKey }, select: { id: true, status: true } });
        if (concurrent && concurrent.status !== "PROCESSING" && concurrent.status !== "FAILED") return { success: true, batchId: concurrent.id, duplicate: true };
        return { error: "Uma carga idêntica já está em processamento." };
      } catch {
        return { error: "Não foi possível verificar uma carga concorrente." };
      }
    }
    if (batchId && !committed) {
      try {
        const context = await getTenantContextForModuleOperation("SAUDE", "create");
        await context.prisma.healthSusImportBatch.update({ where: { id: batchId }, data: { status: "FAILED", completedAt: new Date() } });
      } catch {
        // Preserve the original processing error.
      }
    }
    return { error: errorMessage(error) };
  }
}
