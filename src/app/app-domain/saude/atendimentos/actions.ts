"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { HealthAppointmentPolicyError } from "@/lib/saude/appointment-policy";
import { HealthOperationError, completeHealthAppointment } from "@/lib/saude/appointment-service";
import { startHealthCare } from "@/lib/saude/care-service";

function actionError(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Revise os campos informados.";
  if (error instanceof AccessError || error instanceof HealthOperationError || error instanceof HealthAppointmentPolicyError) return error.message;
  return "Nao foi possivel registrar o atendimento. Os dados foram preservados.";
}

export async function startHealthCareAction(appointmentId: string) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    const record = await startHealthCare(context, appointmentId);
    revalidatePath("/app-domain/saude/acolhimento");
    revalidatePath("/app-domain/saude/agenda");
    revalidatePath("/app-domain/saude/atendimentos");
    return { id: record.id, error: undefined };
  } catch (error) { return { error: actionError(error) }; }
}

export async function completeHealthAppointmentAction(input: unknown) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    const record = await completeHealthAppointment(context, input);
    revalidatePath("/app-domain/saude");
    revalidatePath("/app-domain/saude/agenda");
    revalidatePath("/app-domain/saude/atendimentos");
    return { id: record.id, error: undefined };
  } catch (error) {
    return { error: actionError(error) };
  }
}
