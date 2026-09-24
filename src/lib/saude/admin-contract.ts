import { z } from "zod";
import { healthEntityIdSchema } from "./contract";

const requiredText = (label: string, max = 200) => z.string().trim().min(1, `${label} é obrigatório.`).max(max, `${label} excede o tamanho permitido.`);
const optionalText = (label: string, max = 200) => z.union([z.string().max(max, `${label} excede o tamanho permitido.`), z.null(), z.undefined()])
  .transform(value => typeof value === "string" ? value.trim() || null : null);
const optionalId = z.union([healthEntityIdSchema, z.literal(""), z.null(), z.undefined()])
  .transform(value => typeof value === "string" && value ? value : null);
const optionalPositiveInteger = (label: string, max: number) => z.union([z.literal(""), z.number(), z.string().trim().regex(/^\d+$/, `${label} deve ser um número inteiro.`), z.null(), z.undefined()])
  .transform(value => value === "" || value === null || value === undefined ? null : Number(value))
  .refine(value => value === null || (Number.isInteger(value) && value > 0 && value <= max), `${label} deve estar entre 1 e ${max}.`);

export const optionalHealthEntityIdSchema = optionalId;

export const healthStatusChangeSchema = z.object({
  id: healthEntityIdSchema,
  isActive: z.boolean(),
  reason: optionalText("Motivo", 500),
}).strict().superRefine((value, context) => {
  if (!value.isActive && !value.reason) {
    context.addIssue({ code: "custom", path: ["reason"], message: "Informe o motivo da inativação." });
  }
});

export const healthCatalogInputSchema = z.object({
  code: requiredText("Código", 50),
  name: requiredText("Descrição", 200),
  classification: optionalText("Classificação", 100),
  isActive: z.boolean().default(true),
}).strict();
export type HealthCatalogInput = z.input<typeof healthCatalogInputSchema>;

export const healthSpecialtyGroupInputSchema = z.object({
  name: requiredText("Nome do grupo", 200),
  isActive: z.boolean().default(true),
  specialtyIds: z.array(healthEntityIdSchema).max(100, "Selecione no máximo 100 especialidades.").default([]),
  serviceIds: z.array(healthEntityIdSchema).max(100, "Selecione no máximo 100 serviços.").default([]),
}).strict().superRefine((value, context) => {
  if (new Set(value.specialtyIds).size !== value.specialtyIds.length) {
    context.addIssue({ code: "custom", path: ["specialtyIds"], message: "Não repita especialidades no grupo." });
  }
  if (new Set(value.serviceIds).size !== value.serviceIds.length) {
    context.addIssue({ code: "custom", path: ["serviceIds"], message: "Não repita serviços no grupo." });
  }
});
export type HealthSpecialtyGroupInput = z.input<typeof healthSpecialtyGroupInputSchema>;

export const healthUnitAdministrationInputSchema = z.object({
  name: requiredText("Nome da unidade"),
  type: requiredText("Tipo da unidade", 100),
  cnes: optionalText("CNES", 30),
  phone: optionalText("Telefone", 50),
  email: optionalText("E-mail", 200).refine(value => value === null || z.string().email().safeParse(value).success, "Informe um e-mail válido."),
  isThirdParty: z.boolean().default(false),
}).strict();
export type HealthUnitAdministrationInput = z.input<typeof healthUnitAdministrationInputSchema>;

export const healthUnitShiftInputSchema = z.object({
  unitId: healthEntityIdSchema,
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe o horário inicial."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe o horário final."),
  isActive: z.boolean().default(true),
}).strict().refine(value => value.startTime < value.endTime, { path: ["endTime"], message: "O horário final deve ser posterior ao inicial." });
export type HealthUnitShiftInput = z.input<typeof healthUnitShiftInputSchema>;

export const healthUnitSpecialtyInputSchema = z.object({
  unitId: healthEntityIdSchema,
  specialtyId: healthEntityIdSchema,
  isActive: z.boolean().default(true),
}).strict();
export type HealthUnitSpecialtyInput = z.input<typeof healthUnitSpecialtyInputSchema>;

export const healthServiceAssignmentInputSchema = z.object({
  serviceId: healthEntityIdSchema,
  unitId: optionalId,
  professionalId: optionalId,
  isActive: z.boolean().default(true),
}).strict().superRefine((value, context) => {
  if ((value.unitId ? 1 : 0) + (value.professionalId ? 1 : 0) !== 1) {
    context.addIssue({ code: "custom", path: ["unitId"], message: "Selecione uma unidade ou um profissional." });
  }
});
export type HealthServiceAssignmentInput = z.input<typeof healthServiceAssignmentInputSchema>;

export const healthHabilitationInputSchema = z.object({
  code: requiredText("Código", 50),
  description: requiredText("Descrição", 300),
  unitId: optionalId,
  professionalId: optionalId,
  isActive: z.boolean().default(true),
}).strict().superRefine((value, context) => {
  if ((value.unitId ? 1 : 0) + (value.professionalId ? 1 : 0) !== 1) {
    context.addIssue({ code: "custom", path: ["unitId"], message: "Selecione uma unidade ou um profissional." });
  }
});
export type HealthHabilitationInput = z.input<typeof healthHabilitationInputSchema>;

export const healthProfessionalAdministrationInputSchema = z.object({
  employeeId: healthEntityIdSchema,
  cns: optionalText("CNS", 30),
  treatment: optionalText("Tratamento", 100),
  cbo: optionalText("CBO", 50),
  councilName: optionalText("Conselho", 50),
  councilNumber: optionalText("Número do conselho", 100),
  specialtyId: optionalId,
  unitId: optionalId,
  weeklyHours: z.union([z.literal(""), z.number(), z.string().trim().regex(/^\d+$/, "Carga horária deve ser um número inteiro."), z.null(), z.undefined()])
    .transform(value => value === "" || value === null || value === undefined ? 0 : Number(value))
    .refine(value => Number.isInteger(value) && value >= 0 && value <= 168, "Carga horária deve estar entre 0 e 168."),
  isAuditor: z.boolean().default(false),
  consultationIntervalMinutes: optionalPositiveInteger("Intervalo de consulta", 480),
}).strict().superRefine((value, context) => {
  if (value.consultationIntervalMinutes && !value.specialtyId) {
    context.addIssue({ code: "custom", path: ["specialtyId"], message: "Selecione a especialidade para informar o intervalo de consulta." });
  }
});
export type HealthProfessionalAdministrationInput = z.input<typeof healthProfessionalAdministrationInputSchema>;

export const healthProfessionalAssignmentInputSchema = z.object({
  professionalId: healthEntityIdSchema,
  unitId: healthEntityIdSchema,
  specialtyId: optionalId,
  weeklyHours: z.number().int().min(0).max(168),
  isActive: z.boolean().default(true),
}).strict();
export type HealthProfessionalAssignmentInput = z.input<typeof healthProfessionalAssignmentInputSchema>;

export const healthSchedulingGroupInputSchema = z.object({
  name: requiredText("Nome do grupo de agendamento", 200),
  unitId: healthEntityIdSchema,
  specialtyGroupId: healthEntityIdSchema,
  isActive: z.boolean().default(true),
}).strict();
export type HealthSchedulingGroupInput = z.input<typeof healthSchedulingGroupInputSchema>;

export const healthHolidayInputSchema = z.object({
  title: requiredText("Nome do feriado", 200),
  description: optionalText("Descrição", 500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data do feriado."),
  type: z.enum(["Nacional", "Estadual", "Municipal", "Ponto Facultativo", "Outros"]),
}).strict();
export type HealthHolidayInput = z.input<typeof healthHolidayInputSchema>;

const dateOnly = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."), z.null(), z.undefined()])
  .transform(value => value || null);

export const healthUserAccessInputSchema = z.object({
  usuarioId: healthEntityIdSchema,
  perfilId: healthEntityIdSchema,
  employeeId: healthEntityIdSchema,
  ativo: z.boolean(),
  canView: z.boolean(),
  canEdit: z.boolean(),
  unitIds: z.array(healthEntityIdSchema).min(1, "Selecione ao menos uma unidade de saúde.").max(50),
  validFrom: dateOnly,
  validUntil: dateOnly,
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, "Selecione ao menos um dia da semana."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe o horário inicial."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe o horário final."),
}).strict().superRefine((value, context) => {
  if (value.canEdit && !value.canView) context.addIssue({ code: "custom", path: ["canView"], message: "A permissão de edição exige visualização." });
  if (value.validFrom && value.validUntil && value.validUntil < value.validFrom) context.addIssue({ code: "custom", path: ["validUntil"], message: "A vigência final deve ser posterior à inicial." });
  if (value.endTime <= value.startTime) context.addIssue({ code: "custom", path: ["endTime"], message: "O horário final deve ser posterior ao inicial." });
  if (new Set(value.unitIds).size !== value.unitIds.length) context.addIssue({ code: "custom", path: ["unitIds"], message: "Não repita unidades de saúde." });
  if (new Set(value.weekdays).size !== value.weekdays.length) context.addIssue({ code: "custom", path: ["weekdays"], message: "Não repita dias da semana." });
});
export type HealthUserAccessInput = z.input<typeof healthUserAccessInputSchema>;
