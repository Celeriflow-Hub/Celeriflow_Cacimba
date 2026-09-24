"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPatientPortalAccess } from "@/lib/portal-paciente/access";
import { portalCreateManifestation, portalRequestAppointment, portalTransitionAppointment, portalUpdateContact } from "@/lib/saude/patient-portal-service";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();

async function ownPatient() {
  const access = await getPatientPortalAccess();
  if (access.status !== "AVAILABLE") redirect("/app-domain/login");
  return access;
}

export async function requestAppointmentAction(data: FormData): Promise<void> {
  const access = await ownPatient();
  await portalRequestAppointment(access.context, access.patient.id, { unitId: text(data, "unitId"), date: text(data, "date"), specialty: text(data, "specialty") || null, scheduleId: text(data, "scheduleId") || null });
  revalidatePath("/portal-paciente/agenda");
}

export async function confirmAppointmentAction(data: FormData): Promise<void> {
  const access = await ownPatient();
  await portalTransitionAppointment(access.context, access.patient.id, text(data, "appointmentId"), "Confirmado");
  revalidatePath("/portal-paciente/agenda");
}

export async function cancelAppointmentAction(data: FormData): Promise<void> {
  const access = await ownPatient();
  await portalTransitionAppointment(access.context, access.patient.id, text(data, "appointmentId"), "Cancelado", text(data, "reason") || "Cancelado pelo paciente no portal");
  revalidatePath("/portal-paciente/agenda");
}

export async function updateContactAction(data: FormData): Promise<void> {
  const access = await ownPatient();
  await portalUpdateContact(access.context, access.patient.personId, {
    phonePrimary: text(data, "phonePrimary") || null,
    phoneSecondary: text(data, "phoneSecondary") || null,
    whatsapp: text(data, "whatsapp") || null,
    email: text(data, "email") || null,
  });
  revalidatePath("/portal-paciente/dados");
}

export async function createManifestationAction(data: FormData): Promise<void> {
  const access = await ownPatient();
  await portalCreateManifestation(access.context, access.patient.personId, {
    type: text(data, "type"),
    subject: text(data, "subject"),
    description: text(data, "description"),
    isAnonymous: data.get("isAnonymous") === "on",
  });
  revalidatePath("/portal-paciente/ouvidoria");
}
