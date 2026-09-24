"use server";

import { getTenantContextForModule, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { queryCadUnicoMds, createSuasRmaRecord } from "@/lib/social/social-engine";
import { revalidatePath } from "next/cache";

type ActionResult<T = unknown> = { error?: string; data?: T };

export async function searchCadUnicoAction(nisOrCpf: string): Promise<ActionResult<Awaited<ReturnType<typeof queryCadUnicoMds>>>> {
  if (!nisOrCpf || nisOrCpf.trim().length < 3) {
    return { error: "Informe um NIS ou CPF válido para consulta." };
  }

  try {
    const context = await getTenantContextForModule("SOCIAL");
    const result = await queryCadUnicoMds(context.prisma, nisOrCpf.trim());
    return { data: result };
  } catch (err) {
    return { error: err instanceof Error && err.message ? err.message : "Falha ao consultar CadÚnico (MDS)." };
  }
}

export async function saveRmaRecordAction(data: {
  nis: string;
  nomeCidadao: string;
  unidadeAtendimento: string;
  tipoAtendimento: string;
  detalhesRma: string;
}): Promise<ActionResult<Awaited<ReturnType<typeof createSuasRmaRecord>>>> {
  try {
    const context = await getTenantContextForModuleOperation("SOCIAL", "create");
    const record = await createSuasRmaRecord(context.prisma, {
      ...data,
      tecnicoResponsavel: context.user.email || context.user.name || "Assistente Social",
    });

    revalidatePath("/social/prontuario");
    return { data: record };
  } catch (err) {
    return { error: err instanceof Error && err.message ? err.message : "Erro ao gravar atendimento no Prontuário SUAS/RMA." };
  }
}

export async function getRmaHistoryAction() {
  try {
    const context = await getTenantContextForModule("SOCIAL");
    const history = await context.prisma.suasProntuarioRma.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });
    return { data: history };
  } catch (err) {
    return { error: err instanceof Error && err.message ? err.message : "Erro ao carregar histórico RMA." };
  }
}
