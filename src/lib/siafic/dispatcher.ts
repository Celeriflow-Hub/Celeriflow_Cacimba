import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, type IntegrationConnection, type PrismaClient } from "@prisma/client";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import {
  createSiaficRequestHash,
  siaficDemoEnvelopeSchema,
  siaficReceiptSchema,
  type SiaficDemoEnvelope,
  type SiaficReceipt,
} from "./contract";
import { assertSiaficConnectionMatchesRuntime, getSiaficDemoRuntimeConfig } from "./config";

const RETRY_DELAYS_SECONDS = [2, 5, 15, 60, 300] as const;
const RECEIPT_LOOKUP_MAX_BYTES = 64 * 1024;

type DeliveryWithEvent = Prisma.SiaficDeliveryGetPayload<{
  include: { event: { include: { connection: true } } };
}>;

type DispatchOutcome = {
  status: "PROCESSED" | "RETRY_SCHEDULED" | "RECEIVED_PENDING" | "REJECTED" | "AUTH_BLOCKED" | "CONFIRMATION_UNKNOWN" | "WAITING_DEPENDENCY" | "NEEDS_REVIEW";
  httpStatus?: number;
  errorCode?: string;
  message: string;
  receipt?: SiaficReceipt;
  retryAfterSeconds?: number;
};

function truncate(value: string, maximum = 500) {
  return value.length <= maximum ? value : `${value.slice(0, maximum - 3)}...`;
}

function retryAt(attemptCount: number, overrideSeconds?: number) {
  const delay = overrideSeconds ?? RETRY_DELAYS_SECONDS[Math.min(Math.max(attemptCount - 1, 0), RETRY_DELAYS_SECONDS.length - 1)];
  return new Date(Date.now() + delay * 1_000);
}

function retryAfterSeconds(value: string | null) {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isInteger(seconds) && seconds >= 1 && seconds <= 3_600 ? seconds : undefined;
}

function isFinalStatus(status: string) {
  return ["PROCESSED", "REJECTED", "AUTH_BLOCKED", "NEEDS_REVIEW"].includes(status);
}

function isClaimable(delivery: { status: string; nextAttemptAt: Date; leaseExpiresAt: Date | null }, now: Date) {
  if (delivery.status === "SENDING") return Boolean(delivery.leaseExpiresAt && delivery.leaseExpiresAt < now);
  return ["PENDING", "RETRY_SCHEDULED", "WAITING_DEPENDENCY", "CONFIRMATION_UNKNOWN", "RECEIVED_PENDING"].includes(delivery.status)
    && delivery.nextAttemptAt <= now;
}

async function claimDelivery(db: PrismaClient, eventId: string): Promise<DeliveryWithEvent | null> {
  const candidate = await db.siaficDelivery.findUnique({
    where: { eventId },
    include: { event: { include: { connection: true } } },
  });
  if (!candidate || isFinalStatus(candidate.status)) return null;
  const now = new Date();
  if (!isClaimable(candidate, now)) return null;
  const leaseToken = randomUUID();
  const runtime = getSiaficDemoRuntimeConfig();
  if (!runtime) return null;
  const changed = await db.siaficDelivery.updateMany({
    where: {
      id: candidate.id,
      OR: [
        {
          status: { in: ["PENDING", "RETRY_SCHEDULED", "WAITING_DEPENDENCY", "CONFIRMATION_UNKNOWN", "RECEIVED_PENDING"] },
          nextAttemptAt: { lte: now },
        },
        { status: "SENDING", leaseExpiresAt: { lt: now } },
      ],
    },
    data: {
      status: "SENDING",
      leaseToken,
      leaseExpiresAt: new Date(now.getTime() + runtime.workerLeaseSeconds * 1_000),
    },
  });
  if (changed.count !== 1) return null;
  return db.siaficDelivery.findUnique({
    where: { id: candidate.id },
    include: { event: { include: { connection: true } } },
  });
}

function extractErrorCode(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const nested = record.error && typeof record.error === "object" && !Array.isArray(record.error)
    ? record.error as Record<string, unknown>
    : record;
  return typeof nested.code === "string" ? nested.code.slice(0, 100) : undefined;
}

async function responseJson(response: Response) {
  const text = await response.text();
  if (!text || text.length > RECEIPT_LOOKUP_MAX_BYTES) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function validateReceipt(envelope: SiaficDemoEnvelope, response: unknown): { receipt: SiaficReceipt } | { error: string } {
  const parsed = siaficReceiptSchema.safeParse(response);
  if (!parsed.success) {
    return { error: "O receptor retornou um recibo fora do contrato SIAFIC DEMO." } as const;
  }
  const receipt = parsed.data;
  const matches = receipt.eventId === envelope.eventId
    && receipt.sourceInstanceId === envelope.sourceInstanceId
    && receipt.datasetId === envelope.datasetId
    && receipt.entityType === envelope.entityType
    && receipt.entityId === envelope.entityId
    && receipt.entityVersion === envelope.entityVersion
    && receipt.requestHash === createSiaficRequestHash(envelope);
  if (!matches) return { error: "O recibo do receptor nao corresponde ao evento transmitido." } as const;
  return { receipt } as const;
}

function destinationUrl(connection: IntegrationConnection) {
  const config = assertSiaficConnectionMatchesRuntime(connection.baseUrl);
  return config;
}

async function ensureInstrumentDependencies(db: PrismaClient, delivery: DeliveryWithEvent, envelope: SiaficDemoEnvelope) {
  if (envelope.entityType !== "INSTRUMENT") return null;
  for (const party of envelope.payload.parties) {
    const link = await db.siaficExternalLink.findUnique({
      where: {
        connectionId_datasetId_entityType_entityId: {
          connectionId: delivery.event.connectionId,
          datasetId: envelope.datasetId,
          entityType: "PERSON",
          entityId: party.sourcePersonId,
        },
      },
      select: { id: true },
    });
    if (!link) return `A parte ${party.sourcePersonId} ainda nao foi confirmada pelo receptor.`;
  }
  return null;
}

async function lookupReceipt(config: ReturnType<typeof destinationUrl>, eventId: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.httpTimeoutMs);
  try {
    const response = await fetch(`${config.receiverBaseUrl}/api/demo/v1/receipts/by-event/${encodeURIComponent(eventId)}`, {
      headers: { Authorization: `Bearer ${config.apiToken}` },
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
    });
    const body = await responseJson(response);
    return { response, body };
  } finally {
    clearTimeout(timer);
  }
}

async function sendEnvelope(config: ReturnType<typeof destinationUrl>, envelope: SiaficDemoEnvelope, idempotencyKey: string, correlationId: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.httpTimeoutMs);
  try {
    const response = await fetch(`${config.receiverBaseUrl}/api/demo/v1/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "X-Correlation-Id": correlationId,
      },
      body: JSON.stringify(envelope),
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
    });
    return { response, body: await responseJson(response) };
  } finally {
    clearTimeout(timer);
  }
}

function mapError(response: Response, body: unknown): DispatchOutcome {
  const code = extractErrorCode(body);
  if (response.status === 401 || response.status === 403) {
    return { status: "AUTH_BLOCKED", httpStatus: response.status, errorCode: code ?? "UNAUTHORIZED", message: "O receptor recusou a credencial ou o escopo SIAFIC." };
  }
  if (response.status === 409 && code === "DEPENDENCY_MISSING") {
    return { status: "WAITING_DEPENDENCY", httpStatus: response.status, errorCode: code, message: "O receptor ainda aguarda uma dependencia do instrumento." };
  }
  if (response.status === 409) {
    return { status: "NEEDS_REVIEW", httpStatus: response.status, errorCode: code ?? "CONFLICT", message: "O receptor identificou conflito de idempotencia ou versao." };
  }
  if (response.status === 422 || response.status === 400) {
    return { status: "REJECTED", httpStatus: response.status, errorCode: code ?? "VALIDATION_ERROR", message: "O receptor rejeitou os dados do evento." };
  }
  if (response.status === 429 || response.status >= 500) {
    return {
      status: "RETRY_SCHEDULED",
      httpStatus: response.status,
      errorCode: code ?? "TEMPORARY_UNAVAILABLE",
      message: "O receptor esta indisponivel temporariamente; o reenvio sera agendado.",
      retryAfterSeconds: retryAfterSeconds(response.headers.get("retry-after")),
    };
  }
  return { status: "NEEDS_REVIEW", httpStatus: response.status, errorCode: code ?? "PROTOCOL_MISMATCH", message: "O receptor retornou uma resposta nao reconhecida." };
}

async function finalizeDelivery(
  db: PrismaClient,
  delivery: DeliveryWithEvent,
  correlationId: string,
  startedAt: Date,
  outcome: DispatchOutcome,
) {
  const finishedAt = new Date();
  const nextAttempt = delivery.attemptCount + 1;
  const processed = outcome.status === "PROCESSED";
  const terminal = isFinalStatus(outcome.status);
  const nextAttemptAt = terminal
    ? delivery.nextAttemptAt
    : outcome.status === "RECEIVED_PENDING"
      ? retryAt(nextAttempt, 15)
      : retryAt(nextAttempt, outcome.retryAfterSeconds);
  await db.$transaction(async (tx) => {
    const updated = await tx.siaficDelivery.updateMany({
      where: { id: delivery.id, leaseToken: delivery.leaseToken },
      data: {
        status: outcome.status,
        attemptCount: { increment: 1 },
        nextAttemptAt,
        leaseToken: null,
        leaseExpiresAt: null,
        lastError: processed ? null : outcome.message,
        remoteEntityId: outcome.receipt?.remoteEntityId,
        receiptId: outcome.receipt?.receiptId,
        processedAt: outcome.receipt ? new Date(outcome.receipt.processedAt) : null,
        receipt: outcome.receipt as Prisma.InputJsonValue | undefined,
      },
    });
    if (updated.count !== 1) return;
    await tx.siaficDeliveryAttempt.create({
      data: {
        deliveryId: delivery.id,
        correlationId,
        status: outcome.status,
        httpStatus: outcome.httpStatus,
        errorCode: outcome.errorCode,
        message: truncate(outcome.message),
        durationMs: Math.max(0, finishedAt.valueOf() - startedAt.valueOf()),
        outcome: outcome.receipt
          ? {
            eventId: outcome.receipt.eventId,
            receiptId: outcome.receipt.receiptId,
            remoteEntityId: outcome.receipt.remoteEntityId,
            processingStatus: outcome.receipt.processingStatus,
            requestHash: outcome.receipt.requestHash,
          } as Prisma.InputJsonValue
          : undefined,
        startedAt,
        finishedAt,
      },
    });
    if (outcome.receipt?.processingStatus === "PROCESSED") {
      await tx.siaficExternalLink.upsert({
        where: {
          connectionId_datasetId_entityType_entityId: {
            connectionId: delivery.event.connectionId,
            datasetId: delivery.event.datasetId,
            entityType: delivery.event.entityType,
            entityId: delivery.event.entityId,
          },
        },
        create: {
          connectionId: delivery.event.connectionId,
          datasetId: delivery.event.datasetId,
          entityType: delivery.event.entityType,
          entityId: delivery.event.entityId,
          remoteEntityId: outcome.receipt.remoteEntityId,
          latestVersion: delivery.event.entityVersion,
          latestPayloadHash: delivery.event.payloadHash,
          lastEventId: delivery.event.id,
          receiptId: outcome.receipt.receiptId,
          confirmedAt: new Date(outcome.receipt.processedAt),
        },
        update: {
          remoteEntityId: outcome.receipt.remoteEntityId,
          latestVersion: delivery.event.entityVersion,
          latestPayloadHash: delivery.event.payloadHash,
          lastEventId: delivery.event.id,
          receiptId: outcome.receipt.receiptId,
          confirmedAt: new Date(outcome.receipt.processedAt),
        },
      });
      await writeAuditEvent(tx, {
        actorUsuarioId: delivery.event.actorUsuarioId,
        eventType: auditEventTypes.siaficDeliveryConfirmed,
        targetType: "SiaficOutboxEvent",
        targetId: delivery.event.id,
      });
    } else if (terminal) {
      await writeAuditEvent(tx, {
        actorUsuarioId: delivery.event.actorUsuarioId,
        eventType: auditEventTypes.siaficDeliveryFailed,
        targetType: "SiaficOutboxEvent",
        targetId: delivery.event.id,
      });
    }
  });
}

export async function dispatchSiaficEvent(db: PrismaClient, eventId: string) {
  const delivery = await claimDelivery(db, eventId);
  if (!delivery) return { processed: false, reason: "NOT_CLAIMED" as const };
  const startedAt = new Date();
  const correlationId = randomUUID();
  let envelope: SiaficDemoEnvelope;
  try {
    envelope = siaficDemoEnvelopeSchema.parse(delivery.event.payload);
  } catch {
    await finalizeDelivery(db, delivery, correlationId, startedAt, {
      status: "NEEDS_REVIEW",
      errorCode: "INVALID_LOCAL_EVENT",
      message: "O snapshot local nao atende ao contrato SIAFIC DEMO.",
    });
    return { processed: false, reason: "INVALID_LOCAL_EVENT" as const };
  }

  try {
    const config = destinationUrl(delivery.event.connection);
    if (delivery.status === "SENDING") {
      const dependencyMessage = await ensureInstrumentDependencies(db, delivery, envelope);
      if (dependencyMessage) {
        await finalizeDelivery(db, delivery, correlationId, startedAt, {
          status: "WAITING_DEPENDENCY",
          errorCode: "DEPENDENCY_MISSING",
          message: dependencyMessage,
        });
        return { processed: false, reason: "WAITING_DEPENDENCY" as const };
      }
    }
    if (delivery.event.connection.status !== "ATIVA") {
      await finalizeDelivery(db, delivery, correlationId, startedAt, {
        status: "RETRY_SCHEDULED",
        errorCode: "DESTINATION_DISABLED",
        message: "A conexao SIAFIC esta desativada ou em configuracao.",
        retryAfterSeconds: 300,
      });
      return { processed: false, reason: "DESTINATION_DISABLED" as const };
    }

    if (delivery.status === "SENDING" && delivery.attemptCount > 0 && delivery.lastError) {
      // A lease resumed after an uncertain response. Consult the receiver before
      // sending the same immutable event again.
      const lookup = await lookupReceipt(config, envelope.eventId);
      if (lookup.response.ok) {
        const checked = validateReceipt(envelope, lookup.body);
        if ("receipt" in checked) {
          await finalizeDelivery(db, delivery, correlationId, startedAt, {
            status: checked.receipt.processingStatus === "PROCESSED" ? "PROCESSED" : "RECEIVED_PENDING",
            httpStatus: lookup.response.status,
            message: "Recibo existente confirmado no receptor SIAFIC DEMO.",
            receipt: checked.receipt,
          });
          return { processed: checked.receipt.processingStatus === "PROCESSED", reason: "RECEIPT_CONFIRMED" as const };
        }
      }
      if (lookup.response.status !== 404) {
        const outcome = mapError(lookup.response, lookup.body);
        await finalizeDelivery(db, delivery, correlationId, startedAt, outcome);
        return { processed: false, reason: outcome.status };
      }
    }

    const sent = await sendEnvelope(config, envelope, delivery.event.idempotencyKey, correlationId);
    if (sent.response.status === 202) {
      await finalizeDelivery(db, delivery, correlationId, startedAt, {
        status: "RECEIVED_PENDING",
        httpStatus: sent.response.status,
        errorCode: "RECEIVED_PENDING",
        message: "O receptor confirmou recebimento pendente, sem processamento final.",
      });
      return { processed: false, reason: "RECEIVED_PENDING" as const };
    }
    if (sent.response.ok) {
      const checked = validateReceipt(envelope, sent.body);
      if ("error" in checked) {
        await finalizeDelivery(db, delivery, correlationId, startedAt, {
          status: "NEEDS_REVIEW",
          httpStatus: sent.response.status,
          errorCode: "PROTOCOL_MISMATCH",
          message: checked.error,
        });
        return { processed: false, reason: "PROTOCOL_MISMATCH" as const };
      }
      const status = checked.receipt.processingStatus === "PROCESSED"
        ? "PROCESSED"
        : checked.receipt.processingStatus === "RECEIVED_PENDING"
          ? "RECEIVED_PENDING"
          : "REJECTED";
      await finalizeDelivery(db, delivery, correlationId, startedAt, {
        status,
        httpStatus: sent.response.status,
        message: status === "PROCESSED" ? "Evento processado no receptor SIAFIC DEMO." : "O receptor ainda nao confirmou processamento final.",
        receipt: checked.receipt,
      });
      return { processed: status === "PROCESSED", reason: status };
    }
    const outcome = mapError(sent.response, sent.body);
    await finalizeDelivery(db, delivery, correlationId, startedAt, outcome);
    return { processed: false, reason: outcome.status };
  } catch {
    await finalizeDelivery(db, delivery, correlationId, startedAt, {
      status: "CONFIRMATION_UNKNOWN",
      errorCode: "NETWORK_OR_TIMEOUT",
      message: "Nao foi possivel confirmar a entrega. O proximo ciclo consultara o recibo antes de reenviar.",
    });
    return { processed: false, reason: "CONFIRMATION_UNKNOWN" as const };
  }
}

export async function dispatchSiaficEvents(db: PrismaClient, eventIds: readonly string[]) {
  const results = [];
  for (const eventId of eventIds) results.push(await dispatchSiaficEvent(db, eventId));
  return results;
}

export async function processPendingSiaficDeliveries(db: PrismaClient, limit?: number) {
  const config = getSiaficDemoRuntimeConfig();
  if (!config) return { enabled: false, checked: 0, processed: 0 };
  const now = new Date();
  const deliveries = await db.siaficDelivery.findMany({
    where: {
      event: { connection: { code: "SIAFIC_DEMO", environment: "DEMO", status: "ATIVA" } },
      OR: [
        { status: { in: ["PENDING", "RETRY_SCHEDULED", "WAITING_DEPENDENCY", "CONFIRMATION_UNKNOWN", "RECEIVED_PENDING"] }, nextAttemptAt: { lte: now } },
        { status: "SENDING", leaseExpiresAt: { lt: now } },
      ],
    },
    select: { eventId: true },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: limit ?? config.workerBatchSize,
  });
  let processed = 0;
  for (const delivery of deliveries) {
    const result = await dispatchSiaficEvent(db, delivery.eventId);
    if (result.processed) processed += 1;
  }
  return { enabled: true, checked: deliveries.length, processed };
}

export async function testSiaficDemoConnection(connection: IntegrationConnection) {
  const config = destinationUrl(connection);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.httpTimeoutMs);
  try {
    const response = await fetch(`${config.receiverBaseUrl}/api/demo/v1/capabilities`, {
      headers: { Authorization: `Bearer ${config.apiToken}` },
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
    });
    const body = await responseJson(response);
    if (!response.ok || !body || typeof body !== "object" || Array.isArray(body)) {
      return { status: "FALHA" as const, message: "O receptor SIAFIC DEMO nao respondeu ao contrato de capacidades." };
    }
    const capabilities = body as Record<string, unknown>;
    if (capabilities.protocol !== "ROBONUVEM-SIAFIC-DEMO" || capabilities.protocolVersion !== "1.0" || capabilities.environment !== "DEMO") {
      return { status: "FALHA" as const, message: "O destino respondeu, mas nao se identificou como receptor SIAFIC DEMO compativel." };
    }
    return { status: "SUCESSO" as const, message: "Receptor SIAFIC DEMO autenticado e compativel com o contrato 1.0." };
  } catch {
    return { status: "FALHA" as const, message: "Nao foi possivel consultar o receptor SIAFIC DEMO configurado." };
  } finally {
    clearTimeout(timer);
  }
}
