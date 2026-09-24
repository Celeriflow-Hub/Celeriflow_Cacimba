"use server";

import { getTenantContextForModule, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { runTaxAuditCrossCheck, issueTaxInfractionNotice, type TaxAuditCrossCheckResult } from "@/lib/tributacao/inteligencia-tributaria-engine";
import type { TaxAuditCrossCheck } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult<T = unknown> = { error?: string; data?: T };

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const auditSchema = z.object({
  cnpjCpfContribuinte: z.string().min(1, "Informe o CNPJ/CPF."),
  razaoSocial: z.string().min(1, "Informe a Razão Social."),
  origemCruzamento: z.enum(["DEISS_BANCOS", "CARTORIO_DOI", "CARTORIO_ITBI"]).default("DEISS_BANCOS"),
  valorDeclarado: z.number().nonnegative(),
  valorApuradoBancos: z.number().nonnegative(),
});

export async function runTaxAuditAction(input: z.infer<typeof auditSchema>): Promise<ActionResult<TaxAuditCrossCheckResult>> {
  const parsed = auditSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    const result = await runTaxAuditCrossCheck(context.prisma, parsed.data);

    revalidatePath("/tributacao/fiscalizacao");
    return { data: result };
  } catch (error) {
    return { error: getErrorMessage(error, "Erro ao executar cruzamento fiscal.") };
  }
}

export async function issueInfractionNoticeAction(crossCheckId: string): Promise<ActionResult<{ record: TaxAuditCrossCheck; numeroAutoInfracao: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update");
    const result = await issueTaxInfractionNotice(context.prisma, crossCheckId);

    revalidatePath("/tributacao/fiscalizacao");
    return { data: result };
  } catch (error) {
    return { error: getErrorMessage(error, "Erro ao emitir Auto de Infração.") };
  }
}

export async function getTaxAuditRecordsAction(): Promise<ActionResult<TaxAuditCrossCheck[]>> {
  try {
    const context = await getTenantContextForModule("TRIBUTACAO");
    const records = await context.prisma.taxAuditCrossCheck.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });
    return { data: records };
  } catch (error) {
    return { error: getErrorMessage(error, "Erro ao carregar registros de malha fina.") };
  }
}
