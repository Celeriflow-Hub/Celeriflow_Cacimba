"use server";

import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { parseInstanceConfigurationValues } from "@/lib/platform/instance-configuration";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult = { error?: string; message?: string };

const saveInstanceConfigurationSchema = z.object({
  instanceId: z.string().min(1),
  values: z.unknown(),
}).strict();

export async function saveInstanceConfiguration(rawInput: unknown): Promise<ActionResult> {
  try {
    const input = saveInstanceConfigurationSchema.parse(rawInput);
    const values = parseInstanceConfigurationValues(input.values);
    const context = await getTenantContextForSystemAdministration();
    const instance = await context.prisma.configuracaoInstancia.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!instance || instance.id !== input.instanceId) {
      throw new Error("A instância operacional selecionada não está disponível.");
    }

    const currentParameters = await context.prisma.configuracaoParametroInstancia.findMany({
      where: { configuracaoInstanciaId: instance.id },
      select: { chave: true, valor: true },
    });
    const currentValues = new Map(currentParameters.map((parameter) => [parameter.chave, parameter.valor]));
    const changes = Object.entries(values).filter(([key, value]) => currentValues.get(key) !== value);

    if (changes.length === 0) {
      return { message: "Nenhuma configuração foi alterada." };
    }

    await context.prisma.$transaction(async (tx) => {
      for (const [key, value] of changes) {
        await tx.configuracaoParametroInstancia.upsert({
          where: {
            configuracaoInstanciaId_chave: {
              configuracaoInstanciaId: instance.id,
              chave: key,
            },
          },
          create: {
            configuracaoInstanciaId: instance.id,
            chave: key,
            valor: value,
          },
          update: { valor: value },
        });
        await writeAuditEvent(tx, {
          actorUsuarioId: context.user.id,
          eventType: auditEventTypes.instanceConfigurationChanged,
          targetType: "INSTANCE_CONFIGURATION",
          targetId: `${instance.id}:${key}`,
        });
      }
    });

    revalidatePath("/configuracoes");
    revalidatePath("/configuracoes/instancia");
    revalidatePath("/configuracoes/auditoria");
    return { message: "Parâmetros operacionais salvos e registrados na auditoria." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar as configurações." };
  }
}
