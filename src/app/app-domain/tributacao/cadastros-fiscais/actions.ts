"use server";

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";

export type FiscalEntityType = "TAXPAYER" | "REAL_ESTATE" | "ECONOMIC_REGISTRATION";

type ActionResult = { error?: string; id?: string; duplicate?: boolean };

const entityTypes = new Set<FiscalEntityType>(["TAXPAYER", "REAL_ESTATE", "ECONOMIC_REGISTRATION"]);
const redesimEvents = new Set(["VIABILIDADE", "FORMALIZACAO", "ABERTURA", "ALTERACAO", "BAIXA", "MEI", "LICENCIAMENTO"]);

function requiredText(value: unknown, label: string, max = 240) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${label} é obrigatório.`);
  if (text.length > max) throw new Error(`${label} excede ${max} caracteres.`);
  return text;
}

function optionalText(value: unknown, max = 240) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (text.length > max) throw new Error(`O valor excede ${max} caracteres.`);
  return text;
}

function dateValue(value: unknown, label: string, required = false) {
  const text = String(value ?? "").trim();
  if (!text && !required) return null;
  const date = new Date(`${text}T12:00:00.000Z`);
  if (!text || Number.isNaN(date.getTime())) throw new Error(`${label} inválida.`);
  return date;
}

async function assertFiscalEntity(prisma: Prisma.TransactionClient, entityType: FiscalEntityType, entityId: string) {
  if (entityType === "TAXPAYER") return Boolean(await prisma.taxpayer.findUnique({ where: { id: entityId }, select: { id: true } }));
  if (entityType === "REAL_ESTATE") return Boolean(await prisma.realEstate.findUnique({ where: { id: entityId }, select: { id: true } }));
  return Boolean(await prisma.economicRegistration.findUnique({ where: { id: entityId }, select: { id: true } }));
}

function revalidateFiscalEntity(entityType: FiscalEntityType, entityId: string) {
  if (entityType === "TAXPAYER") revalidatePath(`/tributacao/pessoas/${entityId}`);
  if (entityType === "REAL_ESTATE") revalidatePath(`/tributacao/imoveis/${entityId}`);
  if (entityType === "ECONOMIC_REGISTRATION") revalidatePath(`/tributacao/economico/${entityId}`);
}

export async function saveTaxRegistryEntry(input: {
  entityType: FiscalEntityType;
  entityId: string;
  category: string;
  title: string;
  details: string;
  value?: string;
  percentage?: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  source?: string;
  processId?: string;
  documentId?: string;
  requiresReview?: boolean;
}): Promise<ActionResult> {
  try {
    if (!entityTypes.has(input.entityType)) throw new Error("Tipo de cadastro fiscal inválido.");
    const entityId = requiredText(input.entityId, "Cadastro");
    const category = requiredText(input.category, "Categoria", 80).toUpperCase();
    const title = requiredText(input.title, "Título");
    const details = requiredText(input.details, "Detalhamento", 4_000);
    const effectiveFrom = dateValue(input.effectiveFrom, "Início da vigência", true)!;
    const effectiveUntil = dateValue(input.effectiveUntil, "Fim da vigência");
    if (effectiveUntil && effectiveUntil < effectiveFrom) throw new Error("O fim da vigência deve ser posterior ao início.");
    const percentage = optionalText(input.percentage, 30);
    if (percentage !== null) {
      const parsed = Number(percentage.replace(",", "."));
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) throw new Error("O percentual deve estar entre 0 e 100.");
    }

    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    const entry = await context.prisma.$transaction(async (tx) => {
      if (!await assertFiscalEntity(tx, input.entityType, entityId)) throw new Error("O cadastro de origem não foi encontrado.");
      const processId = optionalText(input.processId);
      const documentId = optionalText(input.documentId);
      if (processId && !await tx.process.findUnique({ where: { id: processId }, select: { id: true } })) throw new Error("O processo informado não existe.");
      if (documentId && !await tx.document.findUnique({ where: { id: documentId }, select: { id: true } })) throw new Error("O documento informado não existe no GED.");

      const previous = await tx.taxRegistryEntry.findFirst({
        where: { entityType: input.entityType, entityId, category, title },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const created = await tx.taxRegistryEntry.create({
        data: {
          entityType: input.entityType,
          entityId,
          category,
          title,
          data: {
            details,
            ...(optionalText(input.value, 500) ? { value: optionalText(input.value, 500) } : {}),
            ...(percentage !== null ? { percentage } : {}),
          } as Prisma.InputJsonValue,
          status: input.requiresReview ? "PENDENTE_VALIDACAO" : "ATIVO",
          source: optionalText(input.source, 80) ?? "INTERNO",
          effectiveFrom,
          effectiveUntil,
          processId,
          documentId,
          actorUsuarioId: context.user.id,
          version: (previous?.version ?? 0) + 1,
        },
      });
      await tx.taxAuditLog.create({
        data: {
          action: input.requiresReview ? "REQUEST" : "CREATE",
          entityType: "TaxRegistryEntry",
          entityId: created.id,
          payload: { targetType: input.entityType, targetId: entityId, category, status: created.status, version: created.version },
          authorUsuarioId: context.user.id,
          authorEmployeeId: context.user.employeeId,
        },
      });
      return created;
    });
    revalidateFiscalEntity(input.entityType, entityId);
    revalidatePath("/tributacao/pessoas");
    return { id: entry.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar o registro fiscal." };
  }
}

export async function reviewTaxRegistryEntry(id: string, decision: "APPROVE" | "REJECT"): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update");
    const entry = await context.prisma.$transaction(async (tx) => {
      const current = await tx.taxRegistryEntry.findUnique({ where: { id } });
      if (!current) throw new Error("Registro fiscal não encontrado.");
      if (current.status !== "PENDENTE_VALIDACAO") throw new Error("O registro não está aguardando validação.");
      const updated = await tx.taxRegistryEntry.update({
        where: { id },
        data: {
          status: decision === "APPROVE" ? "ATIVO" : "REJEITADO",
          reviewedByUsuarioId: context.user.id,
          reviewedAt: new Date(),
        },
      });
      await tx.taxAuditLog.create({
        data: {
          action: decision,
          entityType: "TaxRegistryEntry",
          entityId: id,
          payload: { before: current.status, after: updated.status, targetType: current.entityType, targetId: current.entityId },
          authorUsuarioId: context.user.id,
          authorEmployeeId: context.user.employeeId,
        },
      });
      return updated;
    });
    revalidateFiscalEntity(entry.entityType as FiscalEntityType, entry.entityId);
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível revisar o registro fiscal." };
  }
}

function redesimKey(input: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)))).digest("hex");
}

export async function registerRedesimEvent(input: {
  eventType: string;
  taxpayerId: string;
  municipalInsc?: string;
  primaryCnae?: string;
  taxRegime?: string;
  riskLevel?: string;
  externalReference?: string;
  protocol?: string;
  eventDate: string;
  serviceActivity?: boolean;
}): Promise<ActionResult> {
  try {
    const eventType = requiredText(input.eventType, "Evento", 40).toUpperCase();
    if (!redesimEvents.has(eventType)) throw new Error("Evento REDESIM não suportado.");
    const taxpayerId = requiredText(input.taxpayerId, "Contribuinte");
    const eventDate = dateValue(input.eventDate, "Data do evento", true)!;
    const normalized = {
      eventType,
      taxpayerId,
      municipalInsc: optionalText(input.municipalInsc, 80),
      primaryCnae: optionalText(input.primaryCnae, 40),
      taxRegime: optionalText(input.taxRegime, 80),
      riskLevel: optionalText(input.riskLevel, 40),
      externalReference: optionalText(input.externalReference, 120),
      eventDate: eventDate.toISOString(),
      serviceActivity: Boolean(input.serviceActivity),
    };
    const idempotencyKey = redesimKey(normalized);
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    const result = await context.prisma.$transaction(async (tx) => {
      const existing = await tx.taxIntegrationEvent.findUnique({ where: { idempotencyKey } });
      if (existing) return { event: existing, duplicate: true };
      const taxpayer = await tx.taxpayer.findUnique({
        where: { id: taxpayerId },
        include: { company: true, economicRegistrations: { orderBy: { createdAt: "desc" } } },
      });
      if (!taxpayer?.company) throw new Error("A REDESIM exige contribuinte vinculado a uma pessoa jurídica existente.");

      let registration = taxpayer.economicRegistrations[0] ?? null;
      let status = "PROCESSADO_INTERNO";
      const municipalInsc = normalized.municipalInsc;
      const latestApplied = await tx.taxIntegrationEvent.findFirst({
        where: { integrationCode: "REDESIM", taxpayerId, status: "PROCESSADO_INTERNO" },
        orderBy: { receivedAt: "desc" },
        select: { receivedAt: true },
      });
      const outOfOrder = ["ABERTURA", "FORMALIZACAO", "MEI", "ALTERACAO", "BAIXA"].includes(eventType)
        && Boolean(latestApplied && eventDate < latestApplied.receivedAt);
      if (outOfOrder) {
        status = "FORA_DE_ORDEM";
      } else if (["ABERTURA", "FORMALIZACAO", "MEI"].includes(eventType)) {
        if (!registration && !municipalInsc) throw new Error("Informe a inscrição municipal para formalização ou abertura.");
        if (!registration) {
          registration = await tx.economicRegistration.create({
            data: {
              taxpayerId,
              municipalInsc: municipalInsc!,
              primaryCnae: normalized.primaryCnae,
              taxRegime: eventType === "MEI" ? "SIMEI" : normalized.taxRegime,
              startDate: eventDate,
              status: "Ativo",
            },
          });
        }
      } else if (eventType === "ALTERACAO") {
        if (!registration) throw new Error("Nenhuma inscrição econômica foi localizada para alteração.");
        registration = await tx.economicRegistration.update({
          where: { id: registration.id },
          data: {
            ...(normalized.primaryCnae ? { primaryCnae: normalized.primaryCnae } : {}),
            ...(normalized.taxRegime ? { taxRegime: normalized.taxRegime } : {}),
          },
        });
      } else if (eventType === "BAIXA") {
        if (!registration) throw new Error("Nenhuma inscrição econômica foi localizada para baixa.");
        registration = await tx.economicRegistration.update({ where: { id: registration.id }, data: { status: "Baixado" } });
      } else if (eventType === "VIABILIDADE" && !normalized.riskLevel) {
        status = "PENDENTE_REGRA";
      }

      const event = await tx.taxIntegrationEvent.create({
        data: {
          integrationCode: "REDESIM",
          eventType,
          idempotencyKey,
          protocol: optionalText(input.protocol, 120),
          externalReference: normalized.externalReference,
          status,
          evidenceLevel: "L0",
          taxpayerId,
          economicRegistrationId: registration?.id,
          payload: normalized as Prisma.InputJsonValue,
          result: { registrationId: registration?.id ?? null, status, officialConfirmation: false },
          receivedAt: eventDate,
          processedAt: new Date(),
        },
      });
      if (!outOfOrder && normalized.riskLevel) {
        await tx.taxRegistryEntry.create({
          data: {
            entityType: registration ? "ECONOMIC_REGISTRATION" : "TAXPAYER",
            entityId: registration?.id ?? taxpayerId,
            category: "RISCO_ATIVIDADE",
            title: `Risco ${normalized.primaryCnae ?? "da atividade"}`,
            data: { details: `Nível de risco informado no evento ${eventType}.`, value: normalized.riskLevel },
            source: "REDESIM",
            effectiveFrom: eventDate,
            actorUsuarioId: context.user.id,
          },
        });
      }
      if (!outOfOrder && registration && normalized.serviceActivity && ["FORMALIZACAO", "ABERTURA", "MEI"].includes(eventType)) {
        await tx.taxRegistryEntry.create({
          data: {
            entityType: "ECONOMIC_REGISTRATION",
            entityId: registration.id,
            category: "CREDENCIAMENTO_NFSE",
            title: "Habilitação NFS-e originada da formalização",
            data: { details: "Atividade de serviço identificada; habilitação aguarda validação fiscal antes de produzir efeito externo.", cnae: normalized.primaryCnae },
            status: "PENDENTE_VALIDACAO",
            source: "REDESIM",
            effectiveFrom: eventDate,
            actorUsuarioId: context.user.id,
          },
        });
      }
      await tx.taxAuditLog.create({
        data: {
          action: "INTEGRATION_EVENT",
          entityType: "TaxIntegrationEvent",
          entityId: event.id,
          payload: { integrationCode: "REDESIM", eventType, status, evidenceLevel: "L0", registrationId: registration?.id ?? null },
          authorUsuarioId: context.user.id,
          authorEmployeeId: context.user.employeeId,
        },
      });
      return { event, duplicate: false };
    });
    revalidatePath("/tributacao/redesim");
    revalidatePath("/tributacao/economico");
    if (result.event.economicRegistrationId) revalidatePath(`/tributacao/economico/${result.event.economicRegistrationId}`);
    return { id: result.event.id, duplicate: result.duplicate };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível registrar o evento REDESIM." };
  }
}

export async function requestRegistrySourceLookup(input: { source: string; identifier: string }): Promise<ActionResult> {
  try {
    const source = requiredText(input.source, "Fonte", 40).toUpperCase();
    if (!["SERPRO_CPF", "SERPRO_CNPJ", "CORREIOS_DNE"].includes(source)) throw new Error("Fonte cadastral não suportada.");
    const identifier = requiredText(input.identifier, "Identificador", 120).toUpperCase();
    const idempotencyKey = redesimKey({ source, identifier });
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    const existing = await context.prisma.taxIntegrationEvent.findUnique({ where: { idempotencyKey } });
    if (existing) return { id: existing.id, duplicate: true };
    const event = await context.prisma.taxIntegrationEvent.create({
      data: {
        integrationCode: source,
        eventType: "CONSULTA_CADASTRAL",
        idempotencyKey,
        status: "AGUARDA_CONFIGURACAO",
        evidenceLevel: "L0",
        payload: { identifier, requestedAt: new Date().toISOString() },
        result: { officialConfirmation: false, message: "Credencial ou contrato ainda não configurado; o cadastro manual permanece disponível." },
      },
    });
    revalidatePath("/tributacao/fontes-cadastrais");
    return { id: event.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível registrar a consulta cadastral." };
  }
}

export async function bulkUpdateTaxpayersByFilter(input: { query?: string; expectedCount: number; status: string }): Promise<ActionResult> {
  try {
    const query = optionalText(input.query, 120) ?? "";
    const status = requiredText(input.status, "Situação", 40);
    if (!["Ativo", "Suspenso", "Inativo"].includes(status)) throw new Error("Situação cadastral inválida.");
    if (!Number.isInteger(input.expectedCount) || input.expectedCount < 1) throw new Error("A seleção em lote está vazia.");
    const digits = query.replace(/\D/g, "");
    const alphanumeric = query.replace(/[^A-Za-z0-9]/g, "");
    const where = query ? { OR: [
      { municipalInsc: { contains: query, mode: "insensitive" as const } },
      { person: { is: { fullName: { contains: query, mode: "insensitive" as const } } } },
      ...(digits ? [{ person: { is: { cpf: { contains: digits } } } }] : []),
      { company: { is: { corporateName: { contains: query, mode: "insensitive" as const } } } },
      ...(alphanumeric ? [{ company: { is: { cnpj: { contains: alphanumeric } } } }] : []),
    ] } : {};
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update");
    const ids = await context.prisma.taxpayer.findMany({ where, select: { id: true }, orderBy: { id: "asc" } });
    if (ids.length !== input.expectedCount) throw new Error("O conjunto mudou desde a prévia. Atualize a consulta antes de confirmar.");
    if (ids.length > 1_000) throw new Error("Refine o filtro para no máximo 1.000 registros por lote.");
    const now = new Date();
    await context.prisma.$transaction(async (tx) => {
      await tx.taxpayer.updateMany({ where: { id: { in: ids.map((item) => item.id) } }, data: { status } });
      await tx.taxRegistryEntry.createMany({ data: ids.map((item) => ({ entityType: "TAXPAYER", entityId: item.id, category: "SITUACAO", title: `Alteração em lote para ${status}`, data: { details: `Situação atualizada pelo filtro ${query || "todos os contribuintes"}.` }, status: "ATIVO", source: "LOTE_INTERNO", effectiveFrom: now, actorUsuarioId: context.user.id })) });
      await tx.taxAuditLog.create({ data: { action: "BULK_UPDATE", entityType: "Taxpayer", entityId: `batch:${now.toISOString()}`, payload: { query, count: ids.length, status }, authorUsuarioId: context.user.id, authorEmployeeId: context.user.employeeId } });
    });
    revalidatePath("/tributacao/pessoas");
    return { id: String(ids.length) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível executar a atualização em lote." };
  }
}
