"use server";

import { getTenantContextForModule, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { processWaterReadingAndBill } from "@/lib/saneamento/saneamento-engine";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult<T = unknown> = { error?: string; data?: T };

const readingSchema = z.object({
  codigoMatricula: z.string().min(1, "Informe o código da matrícula."),
  nomeConsumidor: z.string().min(1, "Informe o nome do consumidor."),
  endereco: z.string().min(1, "Informe o endereço."),
  numeroHidrometro: z.string().min(1, "Informe o número do hidrômetro."),
  leituraAnterior: z.number().nonnegative(),
  leituraAtual: z.number().nonnegative(),
  tipoTarifa: z.enum(["RESIDENCIAL", "COMERCIAL", "INDUSTRIAL"]).default("RESIDENCIAL"),
});

export async function processMeterReadingAction(input: z.infer<typeof readingSchema>): Promise<ActionResult<Awaited<ReturnType<typeof processWaterReadingAndBill>>>> {
  const parsed = readingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  if (parsed.data.leituraAtual < parsed.data.leituraAnterior) {
    return { error: "A leitura atual não pode ser inferior à leitura anterior." };
  }

  try {
    const context = await getTenantContextForModuleOperation("SANEAMENTO", "update");
    const result = await processWaterReadingAndBill(context.prisma, parsed.data);

    revalidatePath("/saneamento/leituras");
    return { data: result };
  } catch (err) {
    return { error: err instanceof Error && err.message ? err.message : "Erro ao processar leitura e emitir fatura." };
  }
}

export async function getWaterReadingsAction() {
  try {
    const context = await getTenantContextForModule("SANEAMENTO");
    const readings = await context.prisma.waterMeterReading.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });
    return { data: readings };
  } catch (err) {
    return { error: err instanceof Error && err.message ? err.message : "Erro ao carregar leituras de hidrômetros." };
  }
}
