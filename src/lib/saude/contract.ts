import { z } from "zod";
import { healthAppointmentTransitionTargets } from "./appointment-policy";

export const healthEntityIdSchema = z.string().trim().min(1, "Selecione um registro valido.").max(100, "Identificador invalido.");

const requiredText = (label: string, max = 200) => z.string().trim().min(1, `${label} e obrigatorio.`).max(max, `${label} excede o tamanho permitido.`);
const optionalText = (label: string, max = 200) => z.union([z.string().max(max, `${label} excede o tamanho permitido.`), z.null(), z.undefined()])
  .transform(value => typeof value === "string" ? value.trim() || null : null);
const optionalId = () => z.union([z.string().trim().max(100, "Identificador invalido."), z.null(), z.undefined()])
  .transform(value => typeof value === "string" ? value || null : null);
const optionalDate = () => z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data valida."), z.null(), z.undefined()])
  .transform(value => typeof value === "string" && value ? value : null)
  .refine(value => {
    if (!value) return true;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }, "Informe uma data existente.");

const optionalNumber = (label: string, min: number, max: number) => z.union([
  z.literal(""),
  z.number(),
  z.string().trim().regex(/^\d+(?:[.,]\d+)?$/, `${label} deve ser numerico.`),
]).optional().transform(value => {
  if (value === undefined || value === "") return null;
  return typeof value === "number" ? value : Number(value.replace(",", "."));
}).refine(value => value === null || (Number.isFinite(value) && value >= min && value <= max), `${label} deve estar entre ${min} e ${max}.`);

export const healthUnitInputSchema = z.object({
  name: requiredText("Nome da unidade"),
  type: requiredText("Tipo da unidade", 100),
  cnes: optionalText("CNES", 30),
  phone: optionalText("Telefone", 50),
}).strict();
export type HealthUnitInput = z.input<typeof healthUnitInputSchema>;

export const healthProfessionalInputSchema = z.object({
  employeeId: healthEntityIdSchema,
  specialty: optionalText("Especialidade", 200),
  councilType: optionalText("Conselho", 50),
  councilNumber: optionalText("Numero do conselho", 100),
}).strict();
export type HealthProfessionalInput = z.input<typeof healthProfessionalInputSchema>;

export const healthTeamInputSchema = z.object({
  name: requiredText("Nome da equipe"),
  code: optionalText("Codigo da equipe", 100),
  microarea: optionalText("Microarea", 100),
  unitId: healthEntityIdSchema,
}).strict();
export type HealthTeamInput = z.input<typeof healthTeamInputSchema>;

export const patientInputSchema = z.object({
  personId: z.string().trim().max(100, "Identificador da pessoa invalido.").default(""),
  cns: optionalText("CNS", 30),
  bloodType: optionalText("Tipo sanguineo", 10),
  bloodDonor: z.union([z.boolean(), z.null(), z.undefined()]),
  referenceUnitId: optionalId(),
  teamId: optionalId(),
  fullName: optionalText("Nome completo", 200),
  cpf: optionalText("CPF", 30),
  birthDate: optionalDate(),
}).strict();
export type PatientInput = z.input<typeof patientInputSchema>;

export const healthAppointmentCreateSchema = z.object({
  patientId: healthEntityIdSchema,
  unitId: healthEntityIdSchema,
  professionalId: optionalId(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Informe data e horario validos."),
  specialty: optionalText("Especialidade", 200),
  schedulingGroupId: optionalId(),
  specialtyId: optionalId(),
  serviceId: optionalId(),
  scheduleId: optionalId(),
  visitType: z.union([z.enum(["Primeira", "Retorno", "Avaliação"]), z.null(), z.undefined()]),
  priority: z.enum(["Normal", "Prioridade", "Urgência"]),
}).strict();
export type HealthAppointmentCreateInput = z.input<typeof healthAppointmentCreateSchema>;

export const spontaneousCareCreateSchema = z.object({
  patientId: healthEntityIdSchema,
  unitId: healthEntityIdSchema,
  professionalId: optionalId(),
  specialtyId: optionalId(),
  serviceId: optionalId(),
  arrivalNotes: requiredText("Motivo da procura", 2000),
  priority: z.enum(["Normal", "Prioridade", "Urgência"]),
}).strict();

export const healthTriageInputSchema = z.object({
  appointmentId: healthEntityIdSchema,
  chiefComplaint: requiredText("Queixa principal", 2000),
  bloodPressure: optionalText("Pressão arterial", 30),
  temperature: optionalNumber("Temperatura", 25, 45),
  weight: optionalNumber("Peso", 0.1, 500),
  height: optionalNumber("Altura", 0.1, 3),
  heartRate: optionalNumber("Frequência cardíaca", 1, 300).refine(value => value === null || Number.isInteger(value), "Frequência cardíaca deve ser inteira."),
  respiratoryRate: optionalNumber("Frequência respiratória", 1, 100).refine(value => value === null || Number.isInteger(value), "Frequência respiratória deve ser inteira."),
  oxygenSaturation: optionalNumber("Saturação", 1, 100),
  bloodGlucose: optionalNumber("Glicemia", 1, 1000),
  observedConditions: optionalText("Condições observadas", 5000),
  riskClassification: z.enum(["Não urgente", "Pouco urgente", "Urgente", "Muita urgência", "Emergência"]),
  priorityLabel: requiredText("Prioridade", 100),
  notes: optionalText("Observações", 5000),
}).strict();

export const healthAppointmentTransitionSchema = z.object({
  appointmentId: healthEntityIdSchema,
  status: z.enum(healthAppointmentTransitionTargets),
  cancellationReason: optionalText("Motivo do cancelamento", 500),
}).strict().superRefine((value, context) => {
  if (value.status === "Cancelado" && !value.cancellationReason) {
    context.addIssue({ code: "custom", path: ["cancellationReason"], message: "Informe o motivo do cancelamento." });
  }
  if (value.status !== "Cancelado" && value.cancellationReason) {
    context.addIssue({ code: "custom", path: ["cancellationReason"], message: "O motivo so pode ser informado ao cancelar." });
  }
});
export type HealthAppointmentTransitionInput = z.input<typeof healthAppointmentTransitionSchema>;

export const healthAppointmentCompletionSchema = z.object({
  appointmentId: healthEntityIdSchema,
  type: z.enum(["Consulta", "Triagem", "Procedimento"]),
  bloodPressure: optionalText("Pressao arterial", 30),
  temperature: optionalNumber("Temperatura", 25, 45),
  weight: optionalNumber("Peso", 0.1, 500),
  height: optionalNumber("Altura", 0.1, 3),
  heartRate: optionalNumber("Frequencia cardiaca", 1, 300).refine(value => value === null || Number.isInteger(value), "Frequencia cardiaca deve ser inteira."),
  chiefComplaint: optionalText("Queixa principal", 2000),
  evolution: optionalText("Evolucao", 10000),
  conduct: optionalText("Conduta registrada", 10000),
}).strict();
export type HealthAppointmentCompletionInput = z.input<typeof healthAppointmentCompletionSchema>;
