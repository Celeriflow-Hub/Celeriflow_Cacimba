"use server";
import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { addPassenger, authorizeTfdRequest, confirmPassengerRemoval, createTfdRequest, createTfdTrip, movePassenger, requestPassengerRemoval, updateTripStatus } from "@/lib/saude/tfd-service";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();
const refresh = () => revalidatePath("/saude/tfd");

export async function createTfdRequestAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await createTfdRequest(context, {
    patientId: text(data, "patientId"),
    regulationRequestId: text(data, "regulationRequestId") || null,
    originUnitId: text(data, "originUnitId") || null,
    destination: text(data, "destination"),
    reason: text(data, "reason"),
    priority: (text(data, "priority") as never) || "Normal",
    companionName: text(data, "companionName") || null,
    companionDocument: text(data, "companionDocument") || null,
  });
  refresh();
}

export async function authorizeTfdAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await authorizeTfdRequest(context, text(data, "requestId"));
  refresh();
}

export async function createTripAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await createTfdTrip(context, {
    date: text(data, "date"),
    origin: text(data, "origin"),
    destination: text(data, "destination"),
    fleetUnitId: text(data, "fleetUnitId"),
    driverEmployeeId: text(data, "driverEmployeeId") || null,
    capacity: Number(data.get("capacity")),
  });
  refresh();
}

export async function addPassengerAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await addPassenger(context, {
    tripId: text(data, "tripId"),
    patientId: text(data, "patientId"),
    tfdRequestId: text(data, "tfdRequestId") || null,
    companionName: text(data, "companionName") || null,
    companionDocument: text(data, "companionDocument") || null,
    kind: text(data, "kind") || "PACIENTE",
  });
  refresh();
}

export async function movePassengerAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await movePassenger(context, text(data, "passengerId"), text(data, "targetTripId"));
  refresh();
}

export async function updateTripStatusAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await updateTripStatus(context, text(data, "tripId"), text(data, "status"));
  refresh();
}

export async function requestPassengerRemovalAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await requestPassengerRemoval(context, text(data, "passengerId"));
  refresh();
}

export async function confirmPassengerRemovalAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await confirmPassengerRemoval(context, text(data, "passengerId"), text(data, "decision") === "confirm");
  refresh();
}
