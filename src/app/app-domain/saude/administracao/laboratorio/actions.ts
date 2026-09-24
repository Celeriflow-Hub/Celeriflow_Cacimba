"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";

const schema = z.object({
  unitId: z.string().min(1, "Selecione a unidade."),
  laboratoryName: z.string().trim().min(3, "Informe o nome do laboratório.").max(160),
  collectionStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inicial inválido."),
  collectionEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário final inválido."),
  resultReleaseDays: z.number().int().min(0).max(365),
  allowsExternalProcessing: z.boolean(),
  requiresTechnicalReview: z.boolean(),
  usesDigitalSignature: z.boolean().default(false),
  publishesPatientPortal: z.boolean().default(false),
  resultFooterMessage: z.string().trim().max(500).nullable().default(null),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe o início da vigência."),
  effectiveUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
}).strict();

export async function saveLaboratoryConfiguration(data: unknown): Promise<{ success: true; id: string } | { error: string }> {
  try {
    const input = schema.parse(data);
    if (input.collectionEndTime <= input.collectionStartTime) throw new Error("O horário final deve ser posterior ao inicial.");
    if (input.effectiveUntil && input.effectiveUntil < input.effectiveFrom) throw new Error("O fim da vigência deve ser posterior ao início.");
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    const unit = await context.prisma.healthUnit.findFirst({ where: { id: input.unitId, isActive: true }, select: { id: true } });
    if (!unit) throw new Error("Unidade de saúde ativa não encontrada.");
    const configuration = await context.prisma.$transaction(async tx => {
      await tx.healthLaboratoryConfiguration.updateMany({ where: { unitId: input.unitId, isActive: true }, data: { isActive: false } });
      return tx.healthLaboratoryConfiguration.create({ data: { ...input, createdByUsuarioId: context.user.id } });
    });
    revalidatePath("/app-domain/saude/administracao/laboratorio");
    return { success: true, id: configuration.id };
  } catch (error) {
    return { error: error instanceof z.ZodError ? error.issues[0]?.message || "Dados inválidos." : error instanceof Error ? error.message : "Não foi possível salvar a configuração." };
  }
}
