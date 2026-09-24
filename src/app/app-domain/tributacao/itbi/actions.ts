"use server";

import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { analyzeItbiDeclaration, createItbiDeclaration, generateItbiDocument, issueItbiDam, transmitItbiDeclaration } from "@/lib/tributacao/s3-service";

const path = "/tributacao/itbi";
const result = (error?: unknown) => ({ error: error instanceof Error ? error.message : error ? "Não foi possível concluir a operação." : undefined });

export async function createItbiAction(input: Parameters<typeof createItbiDeclaration>[2]) {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    await createItbiDeclaration(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, input);
    revalidatePath(path); return result();
  } catch (error) { return result(error); }
}

export async function transmitItbiAction(id: string) {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update");
    await transmitItbiDeclaration(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, id);
    revalidatePath(path); return result();
  } catch (error) { return result(error); }
}

export async function analyzeItbiAction(input: { declarationId: string; approved: boolean; notes: string }) {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update");
    await analyzeItbiDeclaration(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, input);
    revalidatePath(path); return result();
  } catch (error) { return result(error); }
}

export async function issueItbiDamAction(id: string) {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    await issueItbiDam(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, id);
    revalidatePath(path); revalidatePath("/tributacao/guias"); return result();
  } catch (error) { return result(error); }
}

export async function generateItbiDocumentAction(id: string) {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    await generateItbiDocument(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, id);
    revalidatePath(path); return result();
  } catch (error) { return result(error); }
}
