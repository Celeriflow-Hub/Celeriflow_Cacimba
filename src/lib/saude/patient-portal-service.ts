import { z } from "zod";
import type { AppContext } from "@/lib/platform/tenant-context";
import { AccessError } from "@/lib/platform/tenant-context";
import { createHealthAppointment, transitionHealthAppointment } from "./appointment-service";
import { nextYearlyCode } from "@/lib/sequence";

export class PatientPortalError extends Error {}

// Todas as funções recebem o patientId resolvido exclusivamente da sessão
// (getPatientPortalAccess). Nenhum ID vindo do navegador é aceito.

export async function portalAppointments(context: AppContext, patientId: string) {
  return context.prisma.healthAppointment.findMany({
    where: { patientId },
    orderBy: { date: "desc" },
    take: 100,
    select: { id: true, date: true, status: true, specialty: true, priority: true, unit: { select: { name: true } }, professional: { select: { specialty: true } } },
  });
}

export async function portalRequestAppointment(context: AppContext, patientId: string, raw: unknown) {
  const input = z.object({ unitId: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/), specialty: z.string().max(200).nullable().optional(), scheduleId: z.string().min(1).nullable().optional() }).strict().parse(raw);
  const unit = await context.prisma.healthUnit.findFirst({ where: { id: input.unitId, isActive: true }, select: { id: true } });
  if (!unit) throw new PatientPortalError("Unidade de saúde inválida.");
  return createHealthAppointment(context, { patientId, unitId: unit.id, professionalId: null, date: input.date, specialty: input.specialty || null, schedulingGroupId: null, specialtyId: null, serviceId: null, scheduleId: input.scheduleId || null, priority: "Normal" });
}

export async function portalOpenSchedules(context: AppContext) {
  const schedules = await context.prisma.healthCareSchedule.findMany({
    where: { status: "Ativo" },
    orderBy: [{ date: "asc" }, { weekday: "asc" }],
    take: 100,
    include: {
      unit: { select: { name: true } },
      specialty: { select: { name: true } },
      professional: { select: { employee: { select: { name: true } } } },
      appointments: { where: { status: { in: ["Agendado", "Confirmado", "Aguardando", "Em Atendimento"] } }, select: { id: true } },
    },
  });
  return schedules.map(s => ({ id: s.id, unitId: s.unitId, unit: s.unit.name, specialty: s.specialty?.name || null, professional: s.professional?.employee.name || null, when: s.date ? s.date.toLocaleDateString("pt-BR") : s.weekday !== null && s.weekday !== undefined ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][s.weekday] : "-", free: s.totalSlots - s.appointments.length, total: s.totalSlots }));
}

export async function portalTransitionAppointment(context: AppContext, patientId: string, appointmentId: string, status: "Confirmado" | "Cancelado", cancellationReason?: string | null) {
  const appointment = await context.prisma.healthAppointment.findUnique({ where: { id: appointmentId }, select: { id: true, patientId: true } });
  if (!appointment || appointment.patientId !== patientId) throw new AccessError("Agendamento não encontrado.", 404);
  return transitionHealthAppointment(context, { appointmentId, status, cancellationReason: cancellationReason || null });
}

export async function portalVaccinations(context: AppContext, patientId: string) {
  return context.prisma.vaccinationRecord.findMany({ where: { patientId }, orderBy: { date: "desc" }, take: 200, select: { id: true, date: true, doseNumber: true, lotNumber: true, vaccine: { select: { name: true } }, unit: { select: { name: true } } } });
}

export async function portalDispensations(context: AppContext, patientId: string) {
  return context.prisma.medicineDispensation.findMany({ where: { patientId }, orderBy: { date: "desc" }, take: 200, select: { id: true, date: true, quantity: true, dosageSnapshot: true, observation: true, nextWithdrawalAt: true, medicine: { select: { name: true } }, unit: { select: { name: true } } } });
}

// Somente laudos LIBERADOS com publicação ao paciente aparecem.
export async function portalLabReports(context: AppContext, patientId: string) {
  return context.prisma.healthLabReport.findMany({
    where: { order: { patientId }, status: "RELEASED", publishedAt: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, createdAt: true, releasedAt: true, document: { select: { id: true, title: true, fileUrl: true } } },
  });
}

export async function portalReferralsRegulation(context: AppContext, patientId: string) {
  const [referrals, regulations] = await Promise.all([
    context.prisma.healthReferral.findMany({ where: { patientId }, orderBy: { date: "desc" }, take: 100, select: { id: true, date: true, specialty: true, status: true, priority: true } }),
    context.prisma.healthRegulationRequest.findMany({ where: { patientId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, createdAt: true, status: true, guideNumber: true, priority: true, specialty: { select: { name: true } }, service: { select: { name: true } } } }),
  ]);
  return { referrals, regulations };
}

export async function portalDocuments(context: AppContext, patientId: string) {
  return context.prisma.healthClinicalDocument.findMany({ where: { medicalRecord: { patientId } }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, kind: true, createdAt: true, document: { select: { id: true, title: true, fileUrl: true } } } });
}

const contactSchema = z.object({
  phonePrimary: z.string().trim().max(30).nullable().optional(),
  phoneSecondary: z.string().trim().max(30).nullable().optional(),
  whatsapp: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().max(120).nullable().optional(),
}).strict();

// Atualização cadastral restrita a contatos. Identidade clínica e
// documentos permanecem sob fluxo administrativo.
export async function portalUpdateContact(context: AppContext, personId: string, raw: unknown) {
  const input = contactSchema.parse(raw);
  const email = input.email?.trim() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PatientPortalError("E-mail inválido.");
  return context.prisma.person.update({
    where: { id: personId },
    data: { phonePrimary: input.phonePrimary?.trim() || null, phoneSecondary: input.phoneSecondary?.trim() || null, whatsapp: input.whatsapp?.trim() || null, email },
    select: { id: true },
  });
}

const manifestationSchema = z.object({
  type: z.enum(["Denúncia", "Reclamação", "Sugestão", "Elogio"]),
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(4000),
  isAnonymous: z.boolean().default(false),
}).strict();

export async function portalCreateManifestation(context: AppContext, personId: string, raw: unknown) {
  const input = manifestationSchema.parse(raw);
  return context.prisma.$transaction(async tx => {
    const channel = await tx.supportChannel.findFirst({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true } });
    if (!channel) throw new PatientPortalError("Nenhum canal de ouvidoria ativo.");
    const existingCodes = await tx.ombudsman.findMany({ select: { protocolNumber: true } }).then(rows => rows.map(r => ({ code: r.protocolNumber })));
    const protocolNumber = await nextYearlyCode({ prisma: tx, key: "OUV", prefix: "OUV", padding: 6, existingCodes });
    return tx.ombudsman.create({
      data: {
        protocolNumber, type: input.type, subject: input.subject, description: input.description,
        channelId: channel.id, personId: null, isAnonymous: input.isAnonymous, isConfidential: false,
        ...(input.isAnonymous ? {} : { identity: { create: { personId } } }),
      },
      select: { id: true, protocolNumber: true },
    }).then(async created => {
      await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: created.id, userId: context.user.id, action: "CREATED_VIA_PORTAL", details: { type: input.type, isAnonymous: input.isAnonymous } } });
      return created;
    });
  });
}

export async function portalManifestations(context: AppContext, personId: string) {
  const identities = await context.prisma.ombudsmanIdentity.findMany({ where: { personId }, select: { ombudsmanId: true } });
  if (!identities.length) return [];
  return context.prisma.ombudsman.findMany({
    where: { id: { in: identities.map(i => i.ombudsmanId) } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, protocolNumber: true, type: true, subject: true, status: true, response: true, respondedAt: true, createdAt: true,
      movements: { orderBy: { createdAt: "desc" }, take: 20, select: { toDepartmentId: true, reason: true, createdAt: true } },
      interactions: { where: { isInternal: false }, orderBy: { createdAt: "desc" }, take: 20, select: { type: true, message: true, createdAt: true } },
    },
  });
}
