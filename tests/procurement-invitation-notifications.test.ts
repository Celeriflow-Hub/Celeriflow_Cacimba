import assert from "node:assert/strict";
import test from "node:test";
import { notifyPendingPriceResearchInvitations } from "../src/lib/integrations/procurement-invitation-notifications.ts";

function transaction() {
  const notifications: Array<Record<string, unknown>> = [];
  const auditEvents: Array<Record<string, unknown>> = [];
  const tx = {
    priceQuote: {
      findMany: async () => [{
        id: "quote-1",
        supplier: { person: null, company: { tradeName: "Fornecedor POC", corporateName: "Fornecedor POC LTDA" } },
        research: { process: { number: "PROC-2026-001" } },
      }],
    },
    protocolNotification: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => notifications.find((notification) => Object.entries(where).every(([key, value]) => notification[key] === value)) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const notification = { ...data, id: `notification-${notifications.length + 1}` };
        notifications.push(notification);
        return { id: notification.id };
      },
    },
    auditEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        auditEvents.push(data);
      },
    },
  };
  return { tx, notifications, auditEvents };
}

test("price invitation reminders use the internal notification and audit infrastructure without claiming email delivery", async () => {
  const memory = transaction();

  const first = await notifyPendingPriceResearchInvitations(memory.tx as never, { actorUsuarioId: "buyer-1", recipientUserIds: ["buyer-1"] });
  const repeated = await notifyPendingPriceResearchInvitations(memory.tx as never, { actorUsuarioId: "buyer-1", recipientUserIds: ["buyer-1"] });

  assert.deepEqual(first, { pendingInvitations: 1, eligibleRecipients: 1, notificationsCreated: 1 });
  assert.equal(repeated.notificationsCreated, 0);
  assert.equal(memory.notifications[0].sourceModule, "COMPRAS");
  assert.equal(memory.notifications[0].entityType, "PRICE_QUOTE");
  assert.equal(memory.notifications[0].type, "PRICE_RESEARCH_INVITATION_PENDING_DELIVERY");
  assert.match(String(memory.notifications[0].message), /entrega manual/);
  assert.doesNotMatch(String(memory.notifications[0].message), /e-mail|email/i);
  assert.equal(memory.auditEvents[0].eventType, "INTERNAL_NOTIFICATION_CREATED");
});
