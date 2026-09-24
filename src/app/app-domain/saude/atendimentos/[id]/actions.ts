"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { HealthOperationError } from "@/lib/saude/appointment-service";
import { addClinicalEvolution, addHealthClinicalDocument, addHealthDiagnosis, addHealthExamRequest, addHealthPrescription, addHealthReferral, addPerformedProcedure, concludeHealthCare, saveMedicalRecordNarrative } from "@/lib/saude/care-service";

function errorMessage(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Revise os campos informados.";
  if (error instanceof AccessError || error instanceof HealthOperationError) return error.message;
  return "Não foi possível salvar o registro clínico. Os dados foram preservados.";
}

async function execute(input: unknown, operation: (context: Awaited<ReturnType<typeof getTenantContextForModuleOperation>>, value: unknown) => Promise<{ id: string }>) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    const result = await operation(context, input);
    const medicalRecordId = typeof input === "object" && input && "medicalRecordId" in input ? String(input.medicalRecordId) : result.id;
    revalidatePath(`/app-domain/saude/atendimentos/${medicalRecordId}`);
    revalidatePath("/app-domain/saude/atendimentos");
    revalidatePath("/app-domain/saude/acolhimento");
    return { id: result.id, error: undefined };
  } catch (error) { return { error: errorMessage(error) }; }
}

export async function saveNarrativeAction(input: unknown) { return execute(input, saveMedicalRecordNarrative); }
export async function addEvolutionAction(input: unknown) { return execute(input, addClinicalEvolution); }
export async function addDiagnosisAction(input: unknown) { return execute(input, addHealthDiagnosis); }
export async function addPrescriptionAction(input: unknown) { return execute(input, addHealthPrescription); }
export async function addExamAction(input: unknown) { return execute(input, addHealthExamRequest); }
export async function addProcedureAction(input: unknown) { return execute(input, addPerformedProcedure); }
export async function addReferralAction(input: unknown) { return execute(input, addHealthReferral); }
export async function concludeCareAction(input: unknown) { return execute(input, concludeHealthCare); }

export async function addClinicalDocumentAction(formData: FormData) {
  try {
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    const file = formData.get("file");
    if (!(file instanceof File)) return { error: "Selecione um arquivo clínico." };
    const result = await addHealthClinicalDocument(context, { medicalRecordId: String(formData.get("medicalRecordId") || ""), kind: String(formData.get("kind") || ""), title: String(formData.get("title") || ""), file });
    revalidatePath(`/app-domain/saude/atendimentos/${formData.get("medicalRecordId")}`);
    return { id: result.id, error: undefined };
  } catch (error) { return { error: errorMessage(error) }; }
}
