"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { HealthOperationError, callHealthAppointment, createSpontaneousCare, registerHealthTriage } from "@/lib/saude/appointment-service";

function message(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Revise os campos informados.";
  if (error instanceof AccessError || error instanceof HealthOperationError) return error.message;
  return "Não foi possível concluir a operação. Os dados foram preservados.";
}

function refresh() {
  revalidatePath("/app-domain/saude/acolhimento");
  revalidatePath("/app-domain/saude/agenda");
  revalidatePath("/app-domain/saude/atendimentos");
}

export async function createSpontaneousCareAction(input: unknown) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "create");
    const result = await createSpontaneousCare(context, input);
    refresh();
    return { id: result.id, error: undefined };
  } catch (error) { return { error: message(error) }; }
}

export async function registerHealthTriageAction(input: unknown) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    const result = await registerHealthTriage(context, input);
    refresh();
    return { id: result.id, error: undefined };
  } catch (error) { return { error: message(error) }; }
}

export async function callHealthAppointmentAction(appointmentId: string) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    const result = await callHealthAppointment(context, appointmentId);
    refresh();
    return { id: result.id, error: undefined };
  } catch (error) { return { error: message(error) }; }
}
