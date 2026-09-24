"use server";

import { getTenantContextForModule, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { generateEnvironmentalLicense, type EnvironmentalLicenseInput, type EnvironmentalLicenseResult } from "@/lib/meio-ambiente/licenciamento-engine";
import type { EnvironmentalLicense } from "@prisma/client";
import { revalidatePath } from "next/cache";

type ActionResult<T = unknown> = { error?: string; data?: T };

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function issueEnvironmentalLicenseAction(input: EnvironmentalLicenseInput): Promise<ActionResult<EnvironmentalLicenseResult>> {
  try {
    const context = await getTenantContextForModuleOperation("MEIO_AMBIENTE", "create");
    const result = await generateEnvironmentalLicense(context.prisma, input);

    revalidatePath("/meio-ambiente/licenciamento");
    return { data: result };
  } catch (error) {
    return { error: getErrorMessage(error, "Erro ao emitir Licença Ambiental.") };
  }
}

export async function getIssuedLicensesAction(): Promise<ActionResult<EnvironmentalLicense[]>> {
  try {
    const context = await getTenantContextForModule("MEIO_AMBIENTE");
    const licenses = await context.prisma.environmentalLicense.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });
    return { data: licenses };
  } catch (error) {
    return { error: getErrorMessage(error, "Erro ao listar licenças emitidas.") };
  }
}
