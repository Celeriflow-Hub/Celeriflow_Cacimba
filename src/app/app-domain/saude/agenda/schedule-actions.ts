"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { HealthAppointmentPolicyError } from "@/lib/saude/appointment-policy";
import { HealthOperationError } from "@/lib/saude/appointment-service";
import { addWaitlist, remanejarAppointment, saveSchedule, transitionSchedule, transitionWaitlist } from "@/lib/saude/schedule-service";

function revalidateAgenda() {
  revalidatePath("/app-domain/saude/agenda");
  revalidatePath("/saude/agenda");
}

function actionError(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Revise os campos informados.";
  if (error instanceof AccessError || error instanceof HealthOperationError || error instanceof HealthAppointmentPolicyError) return error.message;
  return "Não foi possível concluir a operação. Os dados foram preservados.";
}

export async function saveScheduleAction(input: unknown) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "create");
    const schedule = await saveSchedule(context, input);
    revalidateAgenda();
    return { id: schedule.id, error: undefined };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function transitionScheduleAction(scheduleId: string, status: string, blockReason?: string) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    await transitionSchedule(context, scheduleId, status, blockReason);
    revalidateAgenda();
    return { error: undefined };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function addWaitlistAction(input: unknown) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "create");
    const entry = await addWaitlist(context, input);
    revalidateAgenda();
    return { id: entry.id, error: undefined };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function transitionWaitlistAction(waitlistId: string, status: string, convert?: { date: string; unitId: string; professionalId?: string | null }) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    await transitionWaitlist(context, waitlistId, status, convert);
    revalidateAgenda();
    return { error: undefined };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function remanejarAppointmentAction(input: unknown) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    const appointment = await remanejarAppointment(context, input);
    revalidateAgenda();
    return { id: appointment.id, error: undefined };
  } catch (error) {
    return { error: actionError(error) };
  }
}
