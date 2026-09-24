"use server";

import { C7OperationError, registerFleetOperation } from "@/lib/c7/operations-service";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fleetMutationOperation, fleetMutationSchema, type FleetMutationInput } from "@/lib/frotas/contract";
import { FleetError, mutateFleet } from "@/lib/frotas/service";
import { StockServiceError } from "@/lib/patrimonio/stock-service";
import { AccessError } from "@/lib/platform/tenant-context";

export async function mutateFleetAction(input: FleetMutationInput) {
  try {
    const parsed = fleetMutationSchema.parse(input);
    const context = await getTenantContextForModuleOperation("FROTAS", fleetMutationOperation(parsed));
    const result = await mutateFleet(context, input);
    revalidatePath("/frotas");
    revalidatePath("/patrimonio", "layout");
    return { ...result, error: undefined, fields: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: "Revise os campos indicados.", fields: Object.fromEntries(error.issues.map(i => [String(i.path.at(-1)), i.message])) };
    return { error: error instanceof FleetError || error instanceof AccessError || error instanceof StockServiceError ? error.message : "Não foi possível confirmar a operação. Os dados foram preservados.", fields: undefined };
  }
}

export async function registerFleetOperationAction(input: { assetId: string; type: "ABASTECIMENTO" | "MANUTENCAO" | "ORDEM_SERVICO"; occurredAt: string; odometer?: number; quantity?: number; cost: number; description: string; supplierName?: string; evidenceDocumentId?: string }) {
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "create");
    await registerFleetOperation(context.prisma, { usuarioId: context.user.id }, { ...input, occurredAt: new Date(`${input.occurredAt}T12:00:00.000Z`) });
    revalidatePath("/frotas");
    revalidatePath("/indicadores");
    return {};
  } catch (error) { return { error: error instanceof C7OperationError ? error.message : "Não foi possível registrar a operação de frota." }; }
}
