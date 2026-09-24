"use server";

import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";

type Result = { error?: string; id?: string; count?: number };

function required(value: unknown, label: string) { const parsed = String(value ?? "").trim(); if (!parsed) throw new Error(`${label} é obrigatório.`); return parsed; }
function date(value: unknown, label: string) { const parsed = new Date(`${required(value, label)}T12:00:00.000Z`); if (Number.isNaN(parsed.getTime())) throw new Error(`${label} inválida.`); return parsed; }

export async function createRecadastramentoCampaign(input: { code: string; title: string; startsAt: string; endsAt: string; fiscalZone?: string; block?: string; status?: string; allowedFields: string[] }): Promise<Result> {
  try {
    const code = required(input.code, "Código").toUpperCase();
    const title = required(input.title, "Título");
    const startsAt = date(input.startsAt, "Início"); const endsAt = date(input.endsAt, "Encerramento");
    if (endsAt < startsAt) throw new Error("O encerramento deve ser posterior ao início.");
    const allowedFields = [...new Set(input.allowedFields.map((field) => field.trim()).filter(Boolean))];
    if (!allowedFields.length) throw new Error("Selecione ao menos um campo permitido ao contribuinte.");
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    const where = { ...(input.fiscalZone ? { fiscalZone: input.fiscalZone } : {}), ...(input.block ? { block: input.block } : {}), ...(input.status ? { status: input.status } : {}) };
    const properties = await context.prisma.realEstate.findMany({ where, select: { id: true } });
    if (!properties.length) throw new Error("Nenhum imóvel corresponde ao recorte informado.");
    await context.prisma.$transaction(async (tx) => {
      const existing = await tx.taxRegistryEntry.findFirst({ where: { entityType: "RECADASTRAMENTO_CAMPAIGN", entityId: code, category: "CAMPOS_PERMITIDOS" }, select: { id: true } });
      if (existing) throw new Error("Já existe campanha com este código.");
      const scope = { fiscalZone: input.fiscalZone || null, block: input.block || null, status: input.status || null };
      await tx.taxRegistryEntry.create({ data: { entityType: "RECADASTRAMENTO_CAMPAIGN", entityId: code, category: "CAMPOS_PERMITIDOS", title, data: { details: "Configuração de campos e recorte da campanha.", allowedFields, scope, propertyCount: properties.length }, status: "ATIVO", source: "INTERNO", effectiveFrom: startsAt, effectiveUntil: endsAt, actorUsuarioId: context.user.id } });
      await tx.taxRegistryEntry.createMany({ data: properties.map((property) => ({ entityType: "REAL_ESTATE", entityId: property.id, category: "CAMPANHA_RECADASTRAMENTO", title, data: { details: `Imóvel incluído no recorte da campanha ${code}.`, campaignCode: code, allowedFields, scope }, status: "ATIVO", source: "RECADASTRAMENTO", effectiveFrom: startsAt, effectiveUntil: endsAt, actorUsuarioId: context.user.id })) });
      await tx.taxAuditLog.create({ data: { action: "CREATE_CAMPAIGN", entityType: "TaxRegistryEntry", entityId: code, payload: { propertyCount: properties.length, allowedFields, scope }, authorUsuarioId: context.user.id, authorEmployeeId: context.user.employeeId } });
    });
    revalidatePath("/tributacao/recadastramento"); return { id: code, count: properties.length };
  } catch (error) { return { error: error instanceof Error ? error.message : "Não foi possível criar a campanha." }; }
}

export async function submitRecadastramentoRequest(input: { campaignCode: string; estateId: string; field: string; proposedValue: string }): Promise<Result> {
  try {
    const campaignCode = required(input.campaignCode, "Campanha").toUpperCase(); const estateId = required(input.estateId, "Imóvel"); const field = required(input.field, "Campo"); const proposedValue = required(input.proposedValue, "Valor proposto");
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    const entry = await context.prisma.$transaction(async (tx) => {
      const campaign = await tx.taxRegistryEntry.findFirst({ where: { entityType: "RECADASTRAMENTO_CAMPAIGN", entityId: campaignCode, category: "CAMPOS_PERMITIDOS", status: "ATIVO" }, orderBy: { version: "desc" } });
      if (!campaign) throw new Error("Campanha não encontrada ou inativa.");
      const now = new Date(); if (campaign.effectiveFrom > now || (campaign.effectiveUntil && campaign.effectiveUntil < now)) throw new Error("A campanha está fora do período de adesão.");
      const config = campaign.data as { allowedFields?: unknown };
      const allowedFields = Array.isArray(config.allowedFields) ? config.allowedFields.map(String) : [];
      if (!allowedFields.includes(field)) throw new Error("O campo não está liberado para atualização pelo contribuinte.");
      const included = await tx.taxRegistryEntry.findFirst({ where: { entityType: "REAL_ESTATE", entityId: estateId, category: "CAMPANHA_RECADASTRAMENTO", title: campaign.title, status: "ATIVO" }, select: { id: true } });
      if (!included) throw new Error("O imóvel não pertence ao recorte desta campanha.");
      const created = await tx.taxRegistryEntry.create({ data: { entityType: "REAL_ESTATE", entityId: estateId, category: "PEDIDO_ALTERACAO", title: `Recadastramento ${campaignCode}`, data: { details: `Alteração proposta para ${field}.`, campaignCode, field, proposedValue }, status: "PENDENTE_VALIDACAO", source: "CONTRIBUINTE", effectiveFrom: now, actorUsuarioId: context.user.id } });
      await tx.taxAuditLog.create({ data: { action: "REQUEST", entityType: "TaxRegistryEntry", entityId: created.id, payload: { campaignCode, estateId, field }, authorUsuarioId: context.user.id, authorEmployeeId: context.user.employeeId } });
      return created;
    });
    revalidatePath("/tributacao/recadastramento"); revalidatePath(`/tributacao/imoveis/${estateId}`); return { id: entry.id };
  } catch (error) { return { error: error instanceof Error ? error.message : "Não foi possível enviar o recadastramento." }; }
}
