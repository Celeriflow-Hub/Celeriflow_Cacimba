"use server";
import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { captureFacts, captureManualFact, closeCompetence, ensureCompetence, generateSusFile, importProductionFile, processCompetence, processSusFile, reopenCompetence, resolveCriticism, saveProductionTarget, saveUnitCeiling } from "@/lib/saude/production-service";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();
const refresh = () => revalidatePath("/saude/producao");

export async function openCompetenceAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await ensureCompetence(context, text(data, "period"));
  refresh();
}

export async function captureFactsAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await captureFacts(context, text(data, "period") || null);
  refresh();
}

export async function processCompetenceAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await processCompetence(context, text(data, "competenceId"));
  refresh();
}

export async function closeCompetenceAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await closeCompetence(context, text(data, "competenceId"));
  refresh();
}

export async function reopenCompetenceAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await reopenCompetence(context, text(data, "competenceId"));
  refresh();
}

export async function resolveCriticismAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await resolveCriticism(context, text(data, "criticismId"));
  refresh();
}

export async function generateFileAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await generateSusFile(context, { competenceId: text(data, "competenceId"), fileType: text(data, "fileType"), unitId: text(data, "unitId") || null, financing: text(data, "financing") || null });
  refresh();
}

export async function captureManualFactAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await captureManualFact(context, { procedureId: text(data, "procedureId"), unitId: text(data, "unitId"), professionalId: text(data, "professionalId") || null, patientId: text(data, "patientId") || null, quantity: Number(data.get("quantity")), value: text(data, "value") ? Number(data.get("value")) : null, occurredAt: text(data, "occurredAt"), idempotencyKey: text(data, "idempotencyKey") || null });
  refresh();
}

export async function importProductionFileAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Selecione o arquivo de produção.");
  if (file.size > 700 * 1024) throw new Error("O arquivo deve ter no máximo 700 KB.");
  const content = await file.text();
  await importProductionFile(context, content);
  refresh();
}

export async function saveProductionTargetAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveProductionTarget(context, { competenceId: text(data, "competenceId"), procedureId: text(data, "procedureId"), contractedQuantity: Number(data.get("contractedQuantity")) });
  refresh();
}

export async function saveUnitCeilingAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveUnitCeiling(context, { unitId: text(data, "unitId"), period: text(data, "period"), value: Number(data.get("value")) });
  refresh();
}

export async function processFileAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await processSusFile(context, text(data, "fileId"));
  refresh();
}
