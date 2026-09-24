"use server";
import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { admitBed, createObservation, createReception, dischargeBed, ensureRiskProtocols, linkReceptionPatient, saveBed, saveDestination, saveRiskProtocol, saveRoom, transitionBed, transitionObservation, transitionReception } from "@/lib/saude/reception-service";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();
const refresh = () => revalidatePath("/saude/pronto-atendimento");
const flags = (data: FormData) => ["GESTANTE", "IDOSO", "DEFICIENTE"].filter(flag => data.get(`flag_${flag}`) === "on");

export async function createReceptionAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await createReception(context, { patientId: text(data, "patientId") || null, unidentifiedName: text(data, "unidentifiedName") || null, unitId: text(data, "unitId"), priorityFlags: flags(data), companionName: text(data, "companionName") || null, companionKinship: text(data, "companionKinship") || null, companionPhone: text(data, "companionPhone") || null, transportMode: text(data, "transportMode") || null, agreement: text(data, "agreement") || null, roomId: text(data, "roomId") || null, destinationId: text(data, "destinationId") || null });
  refresh();
}

export async function linkReceptionAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await linkReceptionPatient(context, text(data, "receptionId"), text(data, "patientId"));
  refresh();
}

export async function transitionReceptionAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await transitionReception(context, text(data, "receptionId"), text(data, "status"), text(data, "outcome") || null);
  refresh();
}

export async function saveProtocolAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await saveRiskProtocol(context, { level: Number(data.get("level")), label: text(data, "label"), colorHex: text(data, "colorHex"), maxWaitMinutes: Number(data.get("maxWaitMinutes")) });
  refresh();
}

export async function saveDestinationAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveDestination(context, { name: text(data, "name") });
  refresh();
}

export async function saveRoomAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveRoom(context, { unitId: text(data, "unitId"), name: text(data, "name"), kind: text(data, "kind") });
  refresh();
}

export async function saveBedAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveBed(context, { unitId: text(data, "unitId"), room: text(data, "room") || null, code: text(data, "code") });
  refresh();
}

export async function transitionBedAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await transitionBed(context, text(data, "bedId"), text(data, "status"));
  refresh();
}

export async function admitBedAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await admitBed(context, { bedId: text(data, "bedId"), patientId: text(data, "patientId"), notes: text(data, "notes") || null });
  refresh();
}

export async function dischargeBedAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await dischargeBed(context, text(data, "occupancyId"));
  refresh();
}

export async function createObservationAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await createObservation(context, { patientId: text(data, "patientId"), unitId: text(data, "unitId"), bedId: text(data, "bedId") || null, responsible: text(data, "responsible") || null, solicitedBy: text(data, "solicitedBy") || null });
  refresh();
}

export async function transitionObservationAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await transitionObservation(context, text(data, "observationId"), text(data, "status"));
  refresh();
}

export { ensureRiskProtocols };
