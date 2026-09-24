"use server";

import { C7OperationError, createInternalControlFinding, createInternalControlPlan, resolveInternalControlFinding } from "@/lib/c7/operations-service";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

type Result = { error?: string };
const date = (value?: string) => value ? new Date(`${value}T12:00:00.000Z`) : undefined;

export async function createControlPlanAction(input: { title: string; reference: string; dueAt?: string }): Promise<Result> {
  try {
    const context = await getTenantContextForModuleOperation("ADMINISTRACAO", "create");
    await createInternalControlPlan(context.prisma, { usuarioId: context.user.id }, { ...input, dueAt: date(input.dueAt) });
    revalidatePath("/controle-interno");
    revalidatePath("/indicadores");
    return {};
  } catch (error) { return { error: error instanceof C7OperationError ? error.message : "Não foi possível criar o plano." }; }
}

export async function createControlFindingAction(input: { planId: string; title: string; description: string; responsibleId?: string; evidenceDocumentId?: string; dueAt?: string }): Promise<Result> {
  try {
    const context = await getTenantContextForModuleOperation("ADMINISTRACAO", "create");
    await createInternalControlFinding(context.prisma, { usuarioId: context.user.id }, { ...input, dueAt: date(input.dueAt) });
    revalidatePath("/controle-interno");
    revalidatePath("/indicadores");
    return {};
  } catch (error) { return { error: error instanceof C7OperationError ? error.message : "Não foi possível registrar o apontamento." }; }
}

export async function resolveControlFindingAction(id: string): Promise<Result> {
  try {
    const context = await getTenantContextForModuleOperation("ADMINISTRACAO", "update");
    await resolveInternalControlFinding(context.prisma, { usuarioId: context.user.id }, id);
    revalidatePath("/controle-interno");
    revalidatePath("/indicadores");
    return {};
  } catch (error) { return { error: error instanceof C7OperationError ? error.message : "Não foi possível resolver o apontamento." }; }
}
