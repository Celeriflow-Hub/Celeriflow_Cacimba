"use server";
import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { addRequestAttachment, createRegulationRequest, grantProviderAccess, reclassifyRequest, saveRegulationQuota, saveSector, transferAuthorization, transitionRegulationRequest } from "@/lib/saude/regulation-service";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();
const refresh = () => revalidatePath("/saude/regulacao");

export async function saveRegulationQuotaAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveRegulationQuota(context, {
    providerSupplierId: text(data, "providerSupplierId"),
    unitId: text(data, "unitId") || null,
    specialtyId: text(data, "specialtyId") || null,
    serviceId: text(data, "serviceId") || null,
    procedureId: text(data, "procedureId") || null,
    period: text(data, "period"),
    totalQuantity: Number(data.get("totalQuantity")),
    unitValue: text(data, "unitValue") ? Number(data.get("unitValue")) : null,
    convenioId: text(data, "convenioId") || null,
  });
  refresh();
}

export async function createRegulationRequestAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await createRegulationRequest(context, {
    patientId: text(data, "patientId"),
    requestUnitId: text(data, "requestUnitId") || null,
    specialtyId: text(data, "specialtyId") || null,
    serviceId: text(data, "serviceId") || null,
    procedureId: text(data, "procedureId") || null,
    sectorId: text(data, "sectorId") || null,
    cidReferenceId: text(data, "cidReferenceId") || null,
    priority: (text(data, "priority") as never) || "Normal",
    description: text(data, "description") || null,
    origin: "DIRECT",
    patientCondition: text(data, "patientCondition") || null,
    executorNotes: text(data, "executorNotes") || null,
    transportNotes: text(data, "transportNotes") || null,
    isExternal: data.get("isExternal") === "on",
    observations: text(data, "observations") || null,
    preparation: text(data, "preparation") || null,
    contactPhone: text(data, "contactPhone") || null,
  });
  refresh();
}

export async function saveSectorAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveSector(context, text(data, "name"));
  refresh();
}

export async function reclassifyAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await reclassifyRequest(context, text(data, "requestId"), { specialtyId: text(data, "specialtyId") || null, serviceId: text(data, "serviceId") || null, notes: text(data, "notes") });
  refresh();
}

export async function transferAuthorizationAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await transferAuthorization(context, text(data, "requestId"), text(data, "quotaId"));
  refresh();
}

export async function grantProviderAccessAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await grantProviderAccess(context, { supplierId: text(data, "supplierId"), usuarioId: text(data, "usuarioId") });
  refresh();
}

export async function addAttachmentAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const file = data.get("file");
  if (!(file instanceof File)) throw new Error("Selecione o arquivo.");
  await addRequestAttachment(context, { requestId: text(data, "requestId"), file });
  refresh();
}

export async function transitionRegulationAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await transitionRegulationRequest(context, text(data, "requestId"), text(data, "toStatus"), {
    quotaId: text(data, "quotaId") || null,
    notes: text(data, "notes") || null,
    scheduledAt: text(data, "scheduledAt") || null,
  });
  refresh();
}
