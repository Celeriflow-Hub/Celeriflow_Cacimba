import type { Prisma, PrismaClient } from "@prisma/client";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

export const internalNotificationPriorities = ["BAIXA", "NORMAL", "ALTA", "URGENTE"] as const;
export type InternalNotificationPriority = (typeof internalNotificationPriorities)[number];

type NotificationDatabase = PrismaClient | Prisma.TransactionClient;

export type InternalNotificationInput = {
  actorUsuarioId: string;
  recipientUserIds: string[];
  sourceModule: string;
  entityType: string;
  entityId: string;
  processId?: string | null;
  type: string;
  title: string;
  message: string;
  priority?: InternalNotificationPriority;
  dedupeDiscriminator: string;
};

type ListOptions = {
  sourceModule?: string;
  take?: number;
};

const typedName = /^[A-Z][A-Z0-9_]*$/;

export function assertInternalNotificationPriority(value: string): asserts value is InternalNotificationPriority {
  if (!internalNotificationPriorities.includes(value as InternalNotificationPriority)) {
    throw new Error("Prioridade de notificacao invalida.");
  }
}

function assertTypedEntity(sourceModule: string, entityType: string, entityId: string) {
  if (!typedName.test(sourceModule) || !typedName.test(entityType) || !entityId.trim()) {
    throw new Error("Origem ou entidade da notificacao invalida.");
  }
}

export function buildInternalNotificationDedupeKey(input: Pick<InternalNotificationInput, "sourceModule" | "entityType" | "entityId" | "type" | "dedupeDiscriminator">) {
  assertTypedEntity(input.sourceModule, input.entityType, input.entityId);
  if (!input.type.trim() || !input.dedupeDiscriminator.trim()) throw new Error("Chave de deduplicacao invalida.");
  return [input.sourceModule, input.entityType, input.entityId, input.type.trim(), input.dedupeDiscriminator.trim()].join(":");
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

// Call inside the source operation transaction so the entity and its notification succeed together.
export async function createInternalNotifications(tx: Prisma.TransactionClient, input: InternalNotificationInput) {
  const priority = input.priority ?? "NORMAL";
  assertInternalNotificationPriority(priority);
  assertTypedEntity(input.sourceModule, input.entityType, input.entityId);
  if (!input.actorUsuarioId || !input.title.trim() || !input.message.trim()) throw new Error("Dados da notificacao invalidos.");
  if (input.processId && (input.sourceModule !== "PROCESSOS" || input.entityType !== "PROCESS" || input.processId !== input.entityId)) {
    throw new Error("Relacao de processo inconsistente com a entidade da notificacao.");
  }

  const dedupeKey = buildInternalNotificationDedupeKey(input);
  const recipients = [...new Set(input.recipientUserIds.filter(Boolean))];
  let created = 0;

  for (const userId of recipients) {
    const existing = await tx.protocolNotification.findFirst({ where: { userId, dedupeKey }, select: { id: true } });
    if (existing) continue;

    try {
      const notification = await tx.protocolNotification.create({
        data: {
          userId,
          processId: input.processId ?? null,
          sourceModule: input.sourceModule,
          entityType: input.entityType,
          entityId: input.entityId,
          type: input.type,
          title: input.title.trim(),
          message: input.message.trim(),
          priority,
          dedupeKey,
        },
        select: { id: true },
      });
      await writeAuditEvent(tx, {
        actorUsuarioId: input.actorUsuarioId,
        eventType: auditEventTypes.internalNotificationCreated,
        targetType: "INTERNAL_NOTIFICATION",
        targetId: notification.id,
      });
      created += 1;
    } catch (error) {
      // The partial unique index is the final guard when two workers race on the same event.
      if (!isUniqueViolation(error)) throw error;
    }
  }

  return { created, dedupeKey };
}

export async function listInternalNotifications(db: NotificationDatabase, userId: string, options: ListOptions = {}) {
  return db.protocolNotification.findMany({
    where: { userId, ...(options.sourceModule ? { sourceModule: options.sourceModule } : {}) },
    orderBy: { createdAt: "desc" },
    take: options.take ?? 50,
  });
}

export async function countUnreadInternalNotifications(db: NotificationDatabase, userId: string) {
  return db.protocolNotification.count({ where: { userId, readAt: null } });
}

// Acknowledgement is intentionally recipient-owned and does not require source-module edit permission.
export async function markInternalNotificationRead(tx: Prisma.TransactionClient, notificationId: string, userId: string) {
  const notification = await tx.protocolNotification.findFirst({
    where: { id: notificationId, userId, readAt: null },
    select: { id: true },
  });
  if (!notification) return false;

  const updated = await tx.protocolNotification.updateMany({
    where: { id: notification.id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  if (!updated.count) return false;

  await writeAuditEvent(tx, {
    actorUsuarioId: userId,
    eventType: auditEventTypes.internalNotificationRead,
    targetType: "INTERNAL_NOTIFICATION",
    targetId: notification.id,
  });
  return true;
}
