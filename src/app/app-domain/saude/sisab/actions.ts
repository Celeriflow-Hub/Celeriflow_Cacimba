"use server";
import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { finalizeForm, saveForm } from "@/lib/saude/territory-service";
import { createBatch, processBatch } from "@/lib/saude/sisab-service";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();
const refresh = () => revalidatePath("/saude/sisab");

export async function saveFormAction(data: FormData): Promise<{ error?: string }> {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "create");
    let fields: Record<string, unknown> | null = null;
    try {
      const raw = text(data, "fields");
      if (raw) fields = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { error: "Campos da ficha inválidos." };
    }
    await saveForm(context, {
      kind: text(data, "kind"),
      householdId: text(data, "householdId") || null,
      familyId: text(data, "familyId") || null,
      personId: text(data, "personId") || null,
      patientId: text(data, "patientId") || null,
      professionalId: text(data, "professionalId") || null,
      teamId: text(data, "teamId") || null,
      unitId: text(data, "unitId") || null,
      period: text(data, "period"),
      details: text(data, "details") || null,
      fields,
      originMedicalRecordId: text(data, "originMedicalRecordId") || null,
    });
    refresh();
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar a ficha." };
  }
}

export async function finalizeFormAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await finalizeForm(context, text(data, "formId"));
  refresh();
}

export async function createBatchAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await createBatch(context, text(data, "competence"));
  refresh();
}

export async function processBatchAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await processBatch(context, text(data, "batchId"));
  refresh();
}
