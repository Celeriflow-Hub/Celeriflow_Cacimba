import { z } from "zod";
import type { AppContext } from "@/lib/platform/tenant-context";

export class VigilanceError extends Error {}

const establishmentSchema = z.object({
  name: z.string().trim().min(2).max(200),
  document: z.string().trim().max(30).nullable().optional(),
  companyId: z.string().min(1).nullable().optional(),
  personId: z.string().min(1).nullable().optional(),
  cnae: z.string().trim().max(20).nullable().optional(),
  activity: z.string().trim().max(500).nullable().optional(),
  riskLevel: z.string().trim().max(60).nullable().optional(),
}).strict();

export async function saveEstablishment(context: AppContext, raw: unknown) {
  const input = establishmentSchema.parse(raw);
  if (input.companyId && !await context.prisma.company.findUnique({ where: { id: input.companyId }, select: { id: true } })) throw new VigilanceError("Empresa não encontrada.");
  if (input.personId && !await context.prisma.person.findUnique({ where: { id: input.personId }, select: { id: true } })) throw new VigilanceError("Pessoa não encontrada.");
  const existing = input.document ? await context.prisma.healthVigilanceEstablishment.findFirst({ where: { document: input.document }, select: { id: true } }) : null;
  if (existing) {
    return context.prisma.healthVigilanceEstablishment.update({ where: { id: existing.id }, data: { name: input.name, companyId: input.companyId || null, personId: input.personId || null, cnae: input.cnae || null, activity: input.activity || null, riskLevel: input.riskLevel || null, status: "Ativo" }, select: { id: true } });
  }
  return context.prisma.healthVigilanceEstablishment.create({ data: { name: input.name, document: input.document || null, companyId: input.companyId || null, personId: input.personId || null, cnae: input.cnae || null, activity: input.activity || null, riskLevel: input.riskLevel || null }, select: { id: true } });
}

const complaintSchema = z.object({
  establishmentId: z.string().min(1).nullable().optional(),
  place: z.string().trim().max(300).nullable().optional(),
  description: z.string().trim().min(10).max(4000),
  isAnonymous: z.boolean().default(true),
  reporterPersonId: z.string().min(1).nullable().optional(),
}).strict();

export async function saveComplaint(context: AppContext, raw: unknown) {
  const input = complaintSchema.parse(raw);
  if (!input.establishmentId && !input.place?.trim()) throw new VigilanceError("Informe o estabelecimento ou o local da denúncia.");
  if (input.establishmentId && !await context.prisma.healthVigilanceEstablishment.findUnique({ where: { id: input.establishmentId }, select: { id: true } })) throw new VigilanceError("Estabelecimento não encontrado.");
  if (input.isAnonymous && input.reporterPersonId) throw new VigilanceError("Denúncia anônima não identifica o denunciante.");
  if (!input.isAnonymous && !input.reporterPersonId) throw new VigilanceError("Denúncia identificada exige o denunciante.");
  return context.prisma.healthVigilanceComplaint.create({
    data: { establishmentId: input.establishmentId || null, place: input.place?.trim() || null, description: input.description, isAnonymous: input.isAnonymous, reporterPersonId: input.isAnonymous ? null : input.reporterPersonId },
    select: { id: true },
  });
}

export async function transitionComplaint(context: AppContext, complaintId: string, status: string) {
  const target = status.trim();
  if (!["Recebida", "Em apuração", "Encerrada"].includes(target)) throw new VigilanceError("Situação inválida.");
  const complaint = await context.prisma.healthVigilanceComplaint.findUnique({ where: { id: complaintId }, select: { id: true } });
  if (!complaint) throw new VigilanceError("Denúncia não encontrada.");
  return context.prisma.healthVigilanceComplaint.update({ where: { id: complaintId }, data: { status: target }, select: { id: true } });
}

const inspectionSchema = z.object({
  establishmentId: z.string().min(1),
  complaintId: z.string().min(1).nullable().optional(),
  professionalId: z.string().min(1).nullable().optional(),
  inspectedAt: z.coerce.date(),
  reason: z.string().trim().max(2000).nullable().optional(),
  findings: z.string().trim().max(4000).nullable().optional(),
  items: z.array(z.object({ description: z.string().trim().min(2).max(500), result: z.enum(["Conforme", "Não conforme", "Não avaliado"]).default("Não avaliado"), notes: z.string().trim().max(1000).nullable().optional() })).max(100).default([]),
}).strict();

export async function saveInspection(context: AppContext, raw: unknown) {
  const input = inspectionSchema.parse(raw);
  if (!await context.prisma.healthVigilanceEstablishment.findUnique({ where: { id: input.establishmentId }, select: { id: true } })) throw new VigilanceError("Estabelecimento não encontrado.");
  // Nova inspeção registra constatação própria; nunca herda conclusão anterior.
  return context.prisma.healthVigilanceInspection.create({
    data: {
      establishmentId: input.establishmentId, complaintId: input.complaintId || null, professionalId: input.professionalId || null,
      inspectedAt: input.inspectedAt, reason: input.reason || null, findings: input.findings || null, status: "Realizada",
      createdByUsuarioId: context.user.id,
      items: { create: input.items.map(item => ({ description: item.description, result: item.result, notes: item.notes || null })) },
    },
    select: { id: true },
  });
}

export async function transitionInspection(context: AppContext, inspectionId: string, status: string) {
  const target = status.trim();
  if (!["Agendada", "Realizada", "Com pendências", "Encerrada"].includes(target)) throw new VigilanceError("Situação inválida.");
  const inspection = await context.prisma.healthVigilanceInspection.findUnique({ where: { id: inspectionId }, select: { id: true } });
  if (!inspection) throw new VigilanceError("Inspeção não encontrada.");
  return context.prisma.healthVigilanceInspection.update({ where: { id: inspectionId }, data: { status: target }, select: { id: true } });
}

const licenseSchema = z.object({
  establishmentId: z.string().min(1),
  licenseNumber: z.string().trim().min(2).max(60),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

// Alvará é ato explícito de emissão. Atualizar o cadastro do
// estabelecimento nunca gera alvará automaticamente.
export async function issueLicense(context: AppContext, raw: unknown) {
  const input = licenseSchema.parse(raw);
  if (input.validUntil < input.validFrom) throw new VigilanceError("Vigência final anterior à inicial.");
  if (!await context.prisma.healthVigilanceEstablishment.findUnique({ where: { id: input.establishmentId }, select: { id: true } })) throw new VigilanceError("Estabelecimento não encontrado.");
  const number = input.licenseNumber.trim().toUpperCase();
  const existing = await context.prisma.healthVigilanceLicense.findUnique({ where: { licenseNumber: number }, select: { id: true } });
  if (existing) throw new VigilanceError("Número de alvará já utilizado.");
  return context.prisma.healthVigilanceLicense.create({
    data: { establishmentId: input.establishmentId, licenseNumber: number, validFrom: new Date(`${input.validFrom}T12:00:00`), validUntil: new Date(`${input.validUntil}T12:00:00`), status: "Válido", issuedByUsuarioId: context.user.id },
    select: { id: true },
  });
}

export async function transitionLicense(context: AppContext, licenseId: string, status: string) {
  const target = status.trim();
  if (!["Válido", "Vencido", "Suspenso", "Cancelado"].includes(target)) throw new VigilanceError("Situação inválida.");
  const license = await context.prisma.healthVigilanceLicense.findUnique({ where: { id: licenseId }, select: { id: true } });
  if (!license) throw new VigilanceError("Alvará não encontrado.");
  return context.prisma.healthVigilanceLicense.update({ where: { id: licenseId }, data: { status: target }, select: { id: true } });
}
