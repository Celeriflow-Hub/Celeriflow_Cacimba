"use server";

import { AssetLifecycleError, depreciateAssetsForMonth, recordAssetDisposal, recordAssetValueAdjustment, type AssetValueAdjustmentType } from "@/lib/patrimonio/asset-lifecycle";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string; message?: string };

function messageFor(error: unknown) {
  return error instanceof AssetLifecycleError ? error.message : "Não foi possível concluir a operação patrimonial.";
}

function parseCompetence(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) throw new AssetLifecycleError("Informe a competência no formato AAAA-MM.");
  const date = new Date(`${value}-01T12:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 7) !== value) {
    throw new AssetLifecycleError("Competência de depreciação inválida.");
  }
  return date;
}

export async function runMonthlyDepreciation(competence: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "create");
    const result = await depreciateAssetsForMonth(context.prisma, parseCompetence(competence));
    revalidatePath("/patrimonio/ciclo-vida");
    revalidatePath("/patrimonio/bens");
    revalidatePath("/patrimonio");
    return { message: `${result.processed} bem(ns) depreciado(s); ${result.skipped} sem lançamento.` };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function registerAssetDisposal(input: {
  assetId: string;
  date: string;
  type: "Baixa" | "Alienação";
  reason: string;
  justification: string;
  disposalValue: string;
}): Promise<ActionResult> {
  try {
    const date = new Date(`${input.date}T12:00:00.000Z`);
    if (!input.date || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== input.date) {
      throw new AssetLifecycleError("Data da baixa inválida.");
    }
    const disposalValue = input.disposalValue.trim() === "" ? 0 : Number(input.disposalValue.replace(",", "."));
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "delete");
    const writeOff = await recordAssetDisposal(context.prisma, {
      ...input,
      date,
      disposalValue,
      actor: { usuarioId: context.user.id, employeeId: context.user.employeeId },
    });
    revalidatePath("/patrimonio/ciclo-vida");
    revalidatePath("/patrimonio/bens");
    revalidatePath("/patrimonio");
    revalidatePath("/frotas");
    revalidatePath("/patrimonio/bens", "layout");
    return { message: writeOff.integration.pending
      ? "Baixa registrada e frota vinculada inativada. O resultado contábil ficou pendente de parametrização; nenhuma receita ou lançamento foi criado."
      : "Baixa patrimonial registrada com a evidência de valor contábil." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function registerAssetValueAdjustment(input: {
  assetId: string;
  date: string;
  type: AssetValueAdjustmentType;
  value: string;
  justification: string;
  evidence: string;
}): Promise<ActionResult> {
  try {
    const date = new Date(`${input.date}T12:00:00.000Z`);
    if (!input.date || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== input.date) {
      throw new AssetLifecycleError("Data do ajuste inválida.");
    }
    const value = Number(input.value.replace(",", "."));
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
    await recordAssetValueAdjustment(context.prisma, { ...input, date, value });
    revalidatePath("/patrimonio/ciclo-vida");
    revalidatePath("/patrimonio/bens");
    revalidatePath("/patrimonio");
    return { message: "Ajuste de valor registrado com justificativa e evidência." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}
