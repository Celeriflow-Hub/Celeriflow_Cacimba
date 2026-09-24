"use server";
import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { issueLicense, saveComplaint, saveEstablishment, saveInspection, transitionComplaint, transitionInspection, transitionLicense } from "@/lib/saude/vigilance-service";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();
const refresh = () => revalidatePath("/saude/vigilancia");

export async function saveEstablishmentAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveEstablishment(context, { name: text(data, "name"), document: text(data, "document") || null, cnae: text(data, "cnae") || null, activity: text(data, "activity") || null, riskLevel: text(data, "riskLevel") || null });
  refresh();
}

export async function saveComplaintAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveComplaint(context, { establishmentId: text(data, "establishmentId") || null, place: text(data, "place") || null, description: text(data, "description"), isAnonymous: data.get("isAnonymous") === "on", reporterPersonId: text(data, "reporterPersonId") || null });
  refresh();
}

export async function transitionComplaintAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await transitionComplaint(context, text(data, "complaintId"), text(data, "status"));
  refresh();
}

export async function saveInspectionAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const items = text(data, "items").split("\n").map(line => line.trim()).filter(Boolean).map(description => ({ description, result: "Não avaliado" as const }));
  await saveInspection(context, { establishmentId: text(data, "establishmentId"), complaintId: text(data, "complaintId") || null, professionalId: text(data, "professionalId") || null, inspectedAt: text(data, "inspectedAt"), reason: text(data, "reason") || null, findings: text(data, "findings") || null, items });
  refresh();
}

export async function transitionInspectionAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await transitionInspection(context, text(data, "inspectionId"), text(data, "status"));
  refresh();
}

export async function issueLicenseAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await issueLicense(context, { establishmentId: text(data, "establishmentId"), licenseNumber: text(data, "licenseNumber"), validFrom: text(data, "validFrom"), validUntil: text(data, "validUntil") });
  refresh();
}

export async function transitionLicenseAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await transitionLicense(context, text(data, "licenseId"), text(data, "status"));
  refresh();
}
