"use server";

import { getTenantContextForModule, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CulturalIncentiveProject, Prisma } from "@prisma/client";

type ActionResult<T = unknown> = { error?: string; data?: T };

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const projectSchema = z.object({
  codigoEdital: z.string().min(1, "Informe o código do edital."),
  nomeEdital: z.string().min(1, "Informe o nome do edital."),
  tituloProjeto: z.string().min(1, "Informe o título do projeto."),
  proponenteNome: z.string().min(1, "Informe o nome do proponente."),
  proponenteCpfCnpj: z.string().min(1, "Informe o CPF/CNPJ."),
  categoriaCultural: z.string().min(1, "Selecione a categoria cultural."),
  valorSolicitado: z.number().positive("Informe o valor solicitado."),
});

export async function submitCulturalProjectAction(input: z.infer<typeof projectSchema>): Promise<ActionResult<CulturalIncentiveProject>> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const context = await getTenantContextForModuleOperation("CULTURA", "create");
    const project = await context.prisma.culturalIncentiveProject.create({
      data: {
        ...parsed.data,
        valorSolicitado: new Prisma.Decimal(parsed.data.valorSolicitado),
        valorAprovado: new Prisma.Decimal(parsed.data.valorSolicitado),
        status: "APROVADO",
      },
    });

    revalidatePath("/cultura/fomento-projetos");
    return { data: project };
  } catch (error) {
    return { error: getErrorMessage(error, "Erro ao submeter projeto cultural.") };
  }
}

export async function submitAccountabilityAction(projectId: string, reciboNota: string): Promise<ActionResult<{ project: CulturalIncentiveProject; recibo: string }>> {
  void reciboNota;
  try {
    const context = await getTenantContextForModuleOperation("CULTURA", "update");
    const timestamp = Date.now();
    const recibo = `REC-PREST-${timestamp}`;

    const updated = await context.prisma.culturalIncentiveProject.update({
      where: { id: projectId },
      data: {
        prestacaoContasStatus: "HOMOLOGADA",
        reciboPrestacaoContas: recibo,
        status: "CONCLUIDO",
      },
    });

    revalidatePath("/cultura/fomento-projetos");
    return { data: { project: updated, recibo } };
  } catch (error) {
    return { error: getErrorMessage(error, "Erro ao enviar prestação de contas.") };
  }
}

export async function getCulturalProjectsAction(): Promise<ActionResult<CulturalIncentiveProject[]>> {
  try {
    const context = await getTenantContextForModule("CULTURA");
    const projects = await context.prisma.culturalIncentiveProject.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return { data: projects };
  } catch (error) {
    return { error: getErrorMessage(error, "Erro ao carregar projetos de fomento.") };
  }
}
