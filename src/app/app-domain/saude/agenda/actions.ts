"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { HealthAppointmentPolicyError } from "@/lib/saude/appointment-policy";
import { HealthOperationError, createHealthAppointment, transitionHealthAppointment } from "@/lib/saude/appointment-service";

function revalidateAgenda() {
  revalidatePath("/app-domain/saude");
  revalidatePath("/app-domain/saude/agenda");
  revalidatePath("/app-domain/saude/atendimentos");
}

function actionError(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Revise os campos informados.";
  if (error instanceof AccessError || error instanceof HealthOperationError || error instanceof HealthAppointmentPolicyError) return error.message;
  return "Nao foi possivel confirmar a operacao da agenda. Os dados foram preservados.";
}

export async function createHealthAppointmentAction(input: unknown) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "create");
    const appointment = await createHealthAppointment(context, input);
    revalidateAgenda();
    return { id: appointment.id, error: undefined };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function transitionHealthAppointmentAction(input: unknown) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    const appointment = await transitionHealthAppointment(context, input);
    revalidateAgenda();
    return { id: appointment.id, error: undefined };
  } catch (error) {
    return { error: actionError(error) };
  }
}
