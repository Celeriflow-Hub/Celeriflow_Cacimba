import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";

export class TerritoryError extends Error {}

export async function saveArea(context: AppContext, input: { code: string; name: string; unitId?: string | null; teamId?: string | null }) {
  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  if (!code || name.length < 2) throw new TerritoryError("Informe código e nome da área.");
  if (input.unitId) assertHealthUnitAccess(context.user, input.unitId);
  else if (context.user.hasHealthAccessScope) throw new TerritoryError("Informe a unidade da área.");
  return context.prisma.healthTerritoryArea.upsert({
    where: { code },
    create: { code, name, unitId: input.unitId || null, teamId: input.teamId || null },
    update: { name, unitId: input.unitId || null, teamId: input.teamId || null, isActive: true },
    select: { id: true },
  });
}

export async function saveMicroarea(context: AppContext, input: { code: string; areaId: string; agentProfessionalId?: string | null }) {
  const code = input.code.trim().toUpperCase();
  if (!code) throw new TerritoryError("Informe o código da microárea.");
  const area = await context.prisma.healthTerritoryArea.findUnique({ where: { id: input.areaId }, select: { id: true, unitId: true } });
  if (!area) throw new TerritoryError("Área não encontrada.");
  if (area.unitId) assertHealthUnitAccess(context.user, area.unitId);
  return context.prisma.healthMicroarea.upsert({
    where: { areaId_code: { areaId: input.areaId, code } },
    create: { code, areaId: input.areaId, agentProfessionalId: input.agentProfessionalId || null },
    update: { agentProfessionalId: input.agentProfessionalId || null, isActive: true },
    select: { id: true },
  });
}

export async function saveHousehold(context: AppContext, input: { householdCode?: string | null; microareaId?: string | null }) {
  if (input.microareaId) {
    const micro = await context.prisma.healthMicroarea.findUnique({ where: { id: input.microareaId }, select: { id: true, area: { select: { unitId: true } } } });
    if (!micro) throw new TerritoryError("Microárea não encontrada.");
    if (micro.area.unitId) assertHealthUnitAccess(context.user, micro.area.unitId);
  }
  const code = input.householdCode?.trim() || null;
  if (code) {
    const existing = await context.prisma.healthHousehold.findUnique({ where: { householdCode: code }, select: { id: true } });
    if (existing) return context.prisma.healthHousehold.update({ where: { id: existing.id }, data: { microareaId: input.microareaId || null, isActive: true }, select: { id: true } });
  }
  return context.prisma.healthHousehold.create({ data: { householdCode: code, microareaId: input.microareaId || null }, select: { id: true } });
}

export async function saveFamily(context: AppContext, input: { familyCode?: string | null; householdId?: string | null; responsiblePersonId?: string | null }) {
  if (input.householdId && !await context.prisma.healthHousehold.findUnique({ where: { id: input.householdId }, select: { id: true } })) throw new TerritoryError("Domicílio não encontrado.");
  if (input.responsiblePersonId && !await context.prisma.person.findUnique({ where: { id: input.responsiblePersonId }, select: { id: true } })) throw new TerritoryError("Responsável não encontrado.");
  return context.prisma.healthFamily.create({
    data: { familyCode: input.familyCode?.trim() || null, householdId: input.householdId || null, responsiblePersonId: input.responsiblePersonId || null },
    select: { id: true },
  });
}

export async function addFamilyMember(context: AppContext, input: { familyId: string; personId: string; kinship?: string | null }) {
  const family = await context.prisma.healthFamily.findUnique({ where: { id: input.familyId }, select: { id: true } });
  if (!family) throw new TerritoryError("Família não encontrada.");
  if (!await context.prisma.person.findUnique({ where: { id: input.personId }, select: { id: true } })) throw new TerritoryError("Pessoa não encontrada.");
  const existing = await context.prisma.healthFamilyMember.findUnique({ where: { personId: input.personId }, select: { id: true, familyId: true } });
  if (existing) {
    if (existing.familyId !== input.familyId) throw new TerritoryError("Pessoa já vinculada a outra família.");
    return existing;
  }
  return context.prisma.healthFamilyMember.create({ data: { familyId: input.familyId, personId: input.personId, kinship: input.kinship?.trim() || null }, select: { id: true } });
}

const visitSchema = z.object({
  householdId: z.string().min(1).nullable().optional(),
  familyId: z.string().min(1).nullable().optional(),
  teamId: z.string().min(1).nullable().optional(),
  professionalId: z.string().min(1),
  areaId: z.string().min(1).nullable().optional(),
  microareaId: z.string().min(1).nullable().optional(),
  visitedAt: z.coerce.date(),
  actions: z.string().trim().min(3).max(2000),
  observations: z.string().trim().max(2000).nullable().optional(),
}).strict();

export async function createVisit(context: AppContext, raw: unknown) {
  const input = visitSchema.parse(raw);
  if (!input.householdId && !input.familyId) throw new TerritoryError("Informe o domicílio ou a família visitada.");
  const professional = await context.prisma.healthProfessional.findUnique({ where: { id: input.professionalId }, select: { id: true, unitId: true } });
  if (!professional) throw new TerritoryError("Agente/profissional não encontrado.");
  if (professional.unitId) assertHealthUnitAccess(context.user, professional.unitId);
  return context.prisma.healthHomeVisit.create({
    data: { ...input, householdId: input.householdId || null, familyId: input.familyId || null, teamId: input.teamId || null, areaId: input.areaId || null, microareaId: input.microareaId || null, observations: input.observations || null, createdByUsuarioId: context.user.id },
    select: { id: true },
  });
}

export async function addVisitParticipant(context: AppContext, input: { visitId: string; personId: string }) {
  const visit = await context.prisma.healthHomeVisit.findUnique({ where: { id: input.visitId }, select: { id: true, status: true } });
  if (!visit) throw new TerritoryError("Visita não encontrada.");
  if (visit.status === "CANCELADA") throw new TerritoryError("Visita cancelada não aceita participantes.");
  const person = await context.prisma.person.findUnique({ where: { id: input.personId }, select: { id: true } });
  if (!person) throw new TerritoryError("Pessoa não encontrada.");
  const patient = await context.prisma.patient.findUnique({ where: { personId: input.personId }, select: { id: true } });
  const existing = await context.prisma.healthHomeVisitParticipant.findUnique({ where: { visitId_personId: { visitId: input.visitId, personId: input.personId } }, select: { id: true } });
  if (existing) return existing;
  return context.prisma.healthHomeVisitParticipant.create({ data: { visitId: input.visitId, personId: input.personId, patientId: patient?.id || null }, select: { id: true } });
}

const formSchema = z.object({
  kind: z.enum(["INDIVIDUAL","DOMICILIAR","VISITA","ATENDIMENTO_INDIVIDUAL","ODONTO","ATIVIDADE_COLETIVA","PROCEDIMENTOS","CONSUMO_ALIMENTAR","ATENDIMENTO_DOMICILIAR","OUTRO"]),
  householdId: z.string().min(1).nullable().optional(),
  familyId: z.string().min(1).nullable().optional(),
  personId: z.string().min(1).nullable().optional(),
  patientId: z.string().min(1).nullable().optional(),
  professionalId: z.string().min(1).nullable().optional(),
  teamId: z.string().min(1).nullable().optional(),
  unitId: z.string().min(1).nullable().optional(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  details: z.string().trim().max(4000).nullable().optional(),
  fields: z.record(z.string(), z.unknown()).nullable().optional(),
  originMedicalRecordId: z.string().min(1).nullable().optional(),
}).strict();

function validateFormLinks(input: z.infer<typeof formSchema>) {
  // Ficha vinculada a atendimento existente não duplica: exige originMedicalRecordId apenas como vínculo
  if (["ATENDIMENTO_INDIVIDUAL","ODONTO","ATENDIMENTO_DOMICILIAR","PROCEDIMENTOS"].includes(input.kind) && !input.originMedicalRecordId && !input.patientId && !input.personId) {
    throw new TerritoryError("Ficha de atendimento exige paciente/pessoa ou vínculo com o prontuário existente.");
  }
  if (input.kind === "DOMICILIAR" && !input.householdId && !input.familyId) throw new TerritoryError("Ficha domiciliar exige domicílio ou família.");
  if (input.kind === "ATIVIDADE_COLETIVA" && !input.teamId) throw new TerritoryError("Atividade coletiva exige equipe responsável.");
  if (!input.professionalId) throw new TerritoryError("Informe o profissional responsável pela ficha.");
  if (!input.unitId) throw new TerritoryError("Informe a unidade da ficha.");
}

export async function saveForm(context: AppContext, raw: unknown) {
  const input = formSchema.parse(raw);
  validateFormLinks(input);
  const { validateEsusFields } = await import("./sisab-form-config");
  const typedError = validateEsusFields(input.kind, (input.fields || {}) as Record<string, unknown>);
  if (typedError) throw new TerritoryError(typedError);
  assertHealthUnitAccess(context.user, input.unitId!);
  if (input.originMedicalRecordId) {
    const record = await context.prisma.medicalRecord.findUnique({ where: { id: input.originMedicalRecordId }, select: { id: true, unitId: true } });
    if (!record) throw new TerritoryError("Prontuário de origem não encontrado.");
    assertHealthUnitAccess(context.user, record.unitId);
  }
  return context.prisma.healthEsusForm.create({
    data: {
      kind: input.kind,
      householdId: input.householdId || null,
      familyId: input.familyId || null,
      personId: input.personId || null,
      patientId: input.patientId || null,
      professionalId: input.professionalId || null,
      teamId: input.teamId || null,
      unitId: input.unitId || null,
      period: input.period,
      payload: { ...(input.details ? { details: input.details } : {}), ...(input.fields || {}) },
      originMedicalRecordId: input.originMedicalRecordId || null,
      idempotencyKey: randomUUID(),
      createdByUsuarioId: context.user.id,
    },
    select: { id: true },
  });
}

export async function finalizeForm(context: AppContext, formId: string) {
  const form = await context.prisma.healthEsusForm.findUnique({ where: { id: formId }, select: { id: true, status: true, unitId: true, period: true, patientId: true, personId: true, professionalId: true, kind: true } });
  if (!form) throw new TerritoryError("Ficha não encontrada.");
  if (form.unitId) assertHealthUnitAccess(context.user, form.unitId);
  if (form.status === "FINALIZADA") return { id: form.id };
  return context.prisma.$transaction(async tx => {
    await tx.healthEsusForm.update({ where: { id: form.id }, data: { status: "FINALIZADA", finalizedAt: new Date() } });
    // Produção automática idempotente a partir da ficha (reutiliza a origem)
    const key = `ESUS_FORM:${form.id}`;
    const exists = await tx.healthProductionFact.findUnique({ where: { idempotencyKey: key }, select: { id: true } });
    if (!exists) {
      let patientId = form.patientId;
      if (!patientId && form.personId) {
        const patient = await tx.patient.findUnique({ where: { personId: form.personId }, select: { id: true } });
        patientId = patient?.id || null;
      }
      await tx.healthProductionFact.create({
        data: { originType: "ESUS_FORM", originId: form.id, patientId, unitId: form.unitId, professionalId: form.professionalId, quantity: 1, occurredAt: new Date(), period: form.period, idempotencyKey: key },
      });
    }
    return { id: form.id };
  });
}
