"use server";

import { revalidatePath } from "next/cache";
import { getCurrentTenantContext, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import {
  closePriceResearch,
  createPriceResearch,
  createSupplierInvitationAccessKey,
  deletePriceResearch,
  getSupplierPriceResearchPortalAccess,
  inviteSupplierToPriceResearch,
  PriceResearchError,
  saveSupplierPriceQuoteDraft,
  submitSupplierPriceQuote,
  updatePriceResearchDeadline,
} from "@/lib/compras/price-research";

type ActionResult = {
  error?: string;
  researchId?: string;
  invitationId?: string;
  accessKey?: string;
  accessUrl?: string;
  created?: boolean;
  presentedAt?: string;
};

function parseDeadline(value: string) {
  const deadline = new Date(value);
  if (!Number.isFinite(deadline.getTime())) throw new PriceResearchError("Informe um prazo de encerramento válido.");
  return deadline;
}

function researchPaths(researchId?: string) {
  revalidatePath("/compras/pesquisas-precos");
  if (researchId) revalidatePath(`/compras/pesquisas-precos/${researchId}`);
}

function supplierPortalUrl(accessKey: string) {
  const path = `/compras/pesquisas-precos/portal/${encodeURIComponent(accessKey)}`;
  const publicBaseUrl = process.env.CELERIFLOW_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return publicBaseUrl ? `${publicBaseUrl}${path}` : path;
}

function internalError(error: unknown, fallback: string) {
  return error instanceof PriceResearchError ? error.message : fallback;
}

export async function createPriceResearchAction(input: { processId: string; deadlineAt: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("COMPRAS", "create");
    const research = await createPriceResearch(context.prisma, { processId: input.processId, deadlineAt: parseDeadline(input.deadlineAt) });
    researchPaths(research.id);
    return { researchId: research.id };
  } catch (error) {
    return { error: internalError(error, "Não foi possível criar a pesquisa de preços.") };
  }
}

export async function updatePriceResearchDeadlineAction(input: { researchId: string; deadlineAt: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");
    await updatePriceResearchDeadline(context.prisma, { researchId: input.researchId, deadlineAt: parseDeadline(input.deadlineAt) });
    researchPaths(input.researchId);
    return { researchId: input.researchId };
  } catch (error) {
    return { error: internalError(error, "Não foi possível atualizar o prazo da pesquisa.") };
  }
}

export async function closePriceResearchAction(researchId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");
    await closePriceResearch(context.prisma, researchId);
    researchPaths(researchId);
    return { researchId };
  } catch (error) {
    return { error: internalError(error, "Não foi possível encerrar a pesquisa.") };
  }
}

export async function deletePriceResearchAction(researchId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("COMPRAS", "delete");
    await deletePriceResearch(context.prisma, researchId);
    researchPaths();
    return { researchId };
  } catch (error) {
    return { error: internalError(error, "Não foi possível excluir a pesquisa.") };
  }
}

export async function inviteSupplierToPriceResearchAction(input: { researchId: string; supplierId: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("COMPRAS", "create");
    const result = await inviteSupplierToPriceResearch(context.prisma, { ...input, actorUsuarioId: context.user.id });
    const accessKey = createSupplierInvitationAccessKey(result.invitation);
    researchPaths(input.researchId);
    return {
      researchId: input.researchId,
      invitationId: result.invitation.id,
      created: result.created,
      accessKey,
      accessUrl: supplierPortalUrl(accessKey),
    };
  } catch (error) {
    return { error: internalError(error, "Não foi possível registrar o convite do fornecedor.") };
  }
}

export async function getSupplierInvitationLinkAction(input: { researchId: string; invitationId: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");
    const invitation = await context.prisma.priceQuote.findFirst({
      where: { id: input.invitationId, researchId: input.researchId },
      select: { id: true, researchId: true, supplierId: true, status: true },
    });
    if (!invitation || invitation.status === "CONVITE_CANCELADO") throw new PriceResearchError("Convite de cotação não encontrado.");

    const accessKey = createSupplierInvitationAccessKey(invitation);
    return { invitationId: invitation.id, accessKey, accessUrl: supplierPortalUrl(accessKey) };
  } catch (error) {
    return { error: internalError(error, "Não foi possível gerar o acesso do fornecedor.") };
  }
}

async function supplierPortalContext(accessKey: string) {
  const context = await getCurrentTenantContext();
  const access = await getSupplierPriceResearchPortalAccess(context.prisma, {
    accessKey,
    authenticatedEmail: context.user.email,
  });
  return { context, access };
}

export async function saveSupplierPriceQuoteDraftAction(input: { accessKey: string; value: number }): Promise<ActionResult> {
  try {
    const { context, access } = await supplierPortalContext(input.accessKey);
    await saveSupplierPriceQuoteDraft(context.prisma, {
      invitationId: access.invitationId,
      researchId: access.researchId,
      supplierId: access.supplierId,
      value: input.value,
    });
    researchPaths(access.researchId);
    return { invitationId: access.invitationId };
  } catch (error) {
    return { error: internalError(error, "Não foi possível salvar o rascunho da cotação.") };
  }
}

export async function submitSupplierPriceQuoteAction(input: { accessKey: string; value: number }): Promise<ActionResult> {
  try {
    const { context, access } = await supplierPortalContext(input.accessKey);
    const result = await submitSupplierPriceQuote(context.prisma, {
      invitationId: access.invitationId,
      researchId: access.researchId,
      supplierId: access.supplierId,
      actorUsuarioId: context.user.id,
      value: input.value,
    });
    researchPaths(access.researchId);
    return { invitationId: access.invitationId, presentedAt: result.quote.date.toISOString() };
  } catch (error) {
    return { error: internalError(error, "Não foi possível apresentar a cotação.") };
  }
}
