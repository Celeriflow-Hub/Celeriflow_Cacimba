import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertInternalNotificationPriority,
  buildInternalNotificationDedupeKey,
  countUnreadInternalNotifications,
  createInternalNotifications,
  listInternalNotifications,
  markInternalNotificationRead,
} from "../src/lib/notifications/internal-notifications.ts";

function memoryTransaction() {
  const notifications: Array<Record<string, unknown>> = [];
  const auditEvents: Array<Record<string, unknown>> = [];
  const tx = {
    protocolNotification: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => notifications.find((notification) => Object.entries(where).every(([key, value]) => notification[key] === value)) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const notification = { ...data, id: `notification-${notifications.length + 1}`, createdAt: new Date(), readAt: null };
        notifications.push(notification);
        return { id: notification.id };
      },
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const matches = notifications.filter((notification) => Object.entries(where).every(([key, value]) => notification[key] === value));
        matches.forEach((notification) => Object.assign(notification, data));
        return { count: matches.length };
      },
      findMany: async ({ where }: { where: Record<string, unknown> }) => notifications.filter((notification) => Object.entries(where).every(([key, value]) => notification[key] === value)),
      count: async ({ where }: { where: Record<string, unknown> }) => notifications.filter((notification) => Object.entries(where).every(([key, value]) => notification[key] === value)).length,
    },
    auditEvent: { create: async ({ data }: { data: Record<string, unknown> }) => { auditEvents.push(data); } },
  };
  return { tx: tx as never, notifications, auditEvents };
}

const notification = {
  actorUsuarioId: "author-1",
  recipientUserIds: ["recipient-1", "recipient-2", "recipient-1"],
  sourceModule: "PROCESSOS",
  entityType: "PROCESS",
  entityId: "process-1",
  processId: "process-1",
  type: "FORWARDED",
  title: "Processo encaminhado",
  message: "Há uma nova etapa.",
  priority: "ALTA" as const,
  dedupeDiscriminator: "movement-1",
};

test("accepts only the approved internal notification priorities", () => {
  assert.doesNotThrow(() => assertInternalNotificationPriority("BAIXA"));
  assert.doesNotThrow(() => assertInternalNotificationPriority("NORMAL"));
  assert.doesNotThrow(() => assertInternalNotificationPriority("ALTA"));
  assert.doesNotThrow(() => assertInternalNotificationPriority("URGENTE"));
  assert.throws(() => assertInternalNotificationPriority("Normal"), /Prioridade/);
});

test("builds stable dedupe keys from the typed source and entity", () => {
  assert.equal(buildInternalNotificationDedupeKey(notification), "PROCESSOS:PROCESS:process-1:FORWARDED:movement-1");
  assert.equal(buildInternalNotificationDedupeKey(notification), buildInternalNotificationDedupeKey({ ...notification }));
});

test("creates one notification per recipient and keeps recipient histories isolated", async () => {
  const { tx, notifications, auditEvents } = memoryTransaction();
  const result = await createInternalNotifications(tx, notification);
  const repeated = await createInternalNotifications(tx, notification);
  assert.equal(result.created, 2);
  assert.equal(repeated.created, 0);
  assert.equal((await listInternalNotifications(tx, "recipient-1")).length, 1);
  assert.equal((await listInternalNotifications(tx, "recipient-2")).length, 1);
  assert.equal(notifications.length, 2);
  assert.equal(auditEvents.length, 2);
});

test("allows only the notification owner to acknowledge a read and audits it", async () => {
  const { tx, auditEvents } = memoryTransaction();
  await createInternalNotifications(tx, notification);
  assert.equal(await markInternalNotificationRead(tx, "notification-1", "recipient-2"), false);
  assert.equal(await markInternalNotificationRead(tx, "notification-1", "recipient-1"), true);
  assert.equal(await countUnreadInternalNotifications(tx, "recipient-1"), 0);
  assert.equal(auditEvents.at(-1)?.eventType, "INTERNAL_NOTIFICATION_READ");
});

test("requires typed entities and preserves a nullable process compatibility relation", async () => {
  const { tx, notifications } = memoryTransaction();
  await createInternalNotifications(tx, { ...notification, sourceModule: "ATENDIMENTO", entityType: "TICKET", entityId: "ticket-1", processId: null, dedupeDiscriminator: "ticket-event" });
  assert.equal(notifications[0].processId, null);
  await assert.rejects(createInternalNotifications(tx, { ...notification, sourceModule: "processos" }), /Origem ou entidade/);
});

test("migration backfills protocol entities and enforces per-recipient dedupe", async () => {
  const migration = await readFile(new URL("../prisma/migrations/20260816110000_add_internal_notification_center/migration.sql", import.meta.url), "utf8");
  assert.match(migration, /ALTER COLUMN "processId" DROP NOT NULL/);
  assert.match(migration, /SET "entityId" = "processId"/);
  assert.match(migration, /"priority" IN \('BAIXA', 'NORMAL', 'ALTA', 'URGENTE'\)/);
  assert.match(migration, /CREATE UNIQUE INDEX "ProtocolNotification_userId_dedupeKey_unique"/);
  assert.match(migration, /WHERE "dedupeKey" IS NOT NULL/);
});
