"use server";
import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { addFamilyMember, addVisitParticipant, createVisit, saveArea, saveFamily, saveHousehold, saveMicroarea } from "@/lib/saude/territory-service";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();
const refresh = () => revalidatePath("/saude/territorio");

export async function saveAreaAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveArea(context, { code: text(data, "code"), name: text(data, "name"), unitId: text(data, "unitId") || null, teamId: text(data, "teamId") || null });
  refresh();
}

export async function saveMicroareaAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveMicroarea(context, { code: text(data, "code"), areaId: text(data, "areaId"), agentProfessionalId: text(data, "agentProfessionalId") || null });
  refresh();
}

export async function saveHouseholdAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveHousehold(context, { householdCode: text(data, "householdCode") || null, microareaId: text(data, "microareaId") || null });
  refresh();
}

export async function saveFamilyAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveFamily(context, { familyCode: text(data, "familyCode") || null, householdId: text(data, "householdId") || null, responsiblePersonId: text(data, "responsiblePersonId") || null });
  refresh();
}

export async function addFamilyMemberAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await addFamilyMember(context, { familyId: text(data, "familyId"), personId: text(data, "personId"), kinship: text(data, "kinship") || null });
  refresh();
}

export async function createVisitAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await createVisit(context, {
    householdId: text(data, "householdId") || null,
    familyId: text(data, "familyId") || null,
    teamId: text(data, "teamId") || null,
    professionalId: text(data, "professionalId"),
    microareaId: text(data, "microareaId") || null,
    visitedAt: text(data, "visitedAt"),
    actions: text(data, "actions"),
    observations: text(data, "observations") || null,
  });
  refresh();
}

export async function addVisitParticipantAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await addVisitParticipant(context, { visitId: text(data, "visitId"), personId: text(data, "personId") });
  refresh();
}
