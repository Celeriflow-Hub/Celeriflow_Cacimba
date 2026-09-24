import { z } from "zod";
import { healthEntityIdSchema } from "./contract";

const text = (label: string, max: number) => z.string().trim().min(1, `${label} é obrigatório.`).max(max);
const optional = (max: number) => z.union([z.string().trim().max(max), z.null(), z.undefined()]).transform(value => value || null);
const optionalId = z.union([z.string().trim().max(100), z.null(), z.undefined()]).transform(value => value || null);

export const medicalRecordNarrativeSchema = z.object({ medicalRecordId: healthEntityIdSchema, anamnesis: optional(10000), assessment: optional(10000), evolution: optional(10000), conduct: optional(10000), observations: optional(10000) }).strict();
export const clinicalEvolutionSchema = z.object({ medicalRecordId: healthEntityIdSchema, content: text("Evolução", 10000) }).strict();
export const diagnosisInputSchema = z.object({ medicalRecordId: healthEntityIdSchema, cidReferenceId: healthEntityIdSchema, isPrimary: z.boolean().default(false), notes: optional(2000) }).strict();
export const prescriptionInputSchema = z.object({ medicalRecordId: healthEntityIdSchema, medicineId: optionalId, medicineName: text("Medicamento", 300), presentation: optional(200), dose: text("Dose", 200), route: optional(100), frequency: text("Frequência", 200), duration: optional(100), quantity: z.number().positive().max(100000).nullable(), instructions: optional(2000) }).strict();
export const examRequestInputSchema = z.object({ medicalRecordId: healthEntityIdSchema, procedureId: optionalId, examName: text("Exame", 300), priority: z.enum(["Rotina", "Prioridade", "Urgente"]), indication: text("Indicação", 2000), notes: optional(2000) }).strict();
export const performedProcedureInputSchema = z.object({ medicalRecordId: healthEntityIdSchema, procedureId: healthEntityIdSchema, quantity: z.number().int().min(1).max(999), notes: optional(2000) }).strict();
export const referralInputSchema = z.object({ medicalRecordId: healthEntityIdSchema, specialtyId: optionalId, serviceId: optionalId, destinationUnitId: optionalId, specialty: text("Especialidade ou destino", 300), priority: z.enum(["Normal", "Prioridade", "Urgência"]), reason: text("Motivo", 3000), observation: optional(3000) }).strict();
export const concludeCareSchema = z.object({ medicalRecordId: healthEntityIdSchema, outcome: z.enum(["Alta", "Encaminhamento", "Observação", "Internação", "Transferência", "Óbito"]), conduct: text("Conduta final", 10000) }).strict();
