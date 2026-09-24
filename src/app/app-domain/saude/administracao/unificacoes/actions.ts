"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { executeHealthAdministrativeMerge } from "@/lib/saude/health-merge-service";

const schema = z.object({ kind: z.enum(["ADDRESS", "PATIENT", "PROFESSIONAL"]), targetId: z.string().min(1), sourceId: z.string().min(1) }).strict();

export async function mergeHealthRecords(data: unknown): Promise<{ success: true; mergeId: string } | { error: string }> {
  try {
    const input = schema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    const mergeId = await executeHealthAdministrativeMerge(context.prisma, { ...input, actorUsuarioId: context.user.id });
    revalidatePath("/app-domain/saude/administracao/unificacoes");
    return { success: true, mergeId };
  } catch (error) {
    return { error: error instanceof z.ZodError ? error.issues[0]?.message || "Dados inválidos." : error instanceof Error ? error.message : "Não foi possível concluir a unificação." };
  }
}
