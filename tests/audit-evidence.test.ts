import "dotenv/config";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { auditEventTypes, writeAuditEvent, type AuditEventInput, type AuditEventType } from "../src/lib/platform/audit-evidence.ts";
import { auditEventPageSize, buildAuditEventPageQuery, buildAuditEventWhere, createAuditEventPage, encodeAuditEventCursor, normalizeAuditEventFilters, parseAuditEventQuery } from "../src/lib/platform/audit-query.ts";
import { prisma } from "../src/lib/prisma.ts";
import { canEditModule, canPerformModuleOperation, canShowDashboardCard, canViewModule, isModuleActive, isModuleBlockedForUser, isSystemAdministrator } from "../src/lib/platform/tenant-context.ts";

const permissionUser: Parameters<typeof canViewModule>[0] = {
  id: "permission-fixture", firebaseUid: "permission-fixture", email: "permission@example.invalid", name: "Operador", role: "Operador", profileCode: "OPERACIONAL",
  permissions: "{}", modulePermissions: [], allowedBudgetUnitIds: [], employeeId: null, departmentId: null, secretariatId: null,
};

test("persists payload-free audit evidence with only actor, event, and target identifiers", async () => {
  let data: unknown;
  const prisma = {
    auditEvent: {
      create: async ({ data: receivedData }: { data: unknown }) => {
        data = receivedData;
      },
    },
  } as never;

  await writeAuditEvent(prisma, {
    actorUsuarioId: "user-1",
    eventType: auditEventTypes.documentDownload,
    targetType: "DOCUMENT",
    targetId: "document-1",
  });

  assert.deepEqual(data, {
    actorUsuarioId: "user-1",
    eventType: "DOCUMENT_DOWNLOAD",
    targetType: "DOCUMENT",
    targetId: "document-1",
  });
});

test("defines authentication, protected-operation, and usage-monitoring event types", () => {
  assert.deepEqual(Object.values(auditEventTypes), [
    "SESSION_LOGIN",
    "SESSION_LOGOUT",
    "DOCUMENT_DOWNLOAD",
    "FINANCIAL_REPORT_EXPORT",
    "REPORT_ISSUED",
    "PAGE_VIEW",
    "UI_INTERACTION",
    "FORM_SUBMIT",
    "INSTANCE_CONFIGURATION_CHANGED",
    "INTERNAL_NOTIFICATION_CREATED",
    "INTERNAL_NOTIFICATION_READ",
    "PERSON_MERGE_PROPOSED",
    "PERSON_MERGE_EXECUTED",
    "PERSON_MERGE_REVERSED",
    "ADMINISTRATIVE_MUTATION",
    "PROCESS_OPENED",
    "PROCESS_UPDATED",
    "PROCESS_DOCUMENT_LINKED",
    "GED_DOCUMENT_INGESTED",
    "DOCUMENT_SIGNATURE_REQUESTED",
    "DOCUMENT_SIGNATURE_REGISTERED",
    "PUBLIC_NOTICE_PUBLISHED",
    "STOCK_MANUALLY_ADJUSTED",
    "ASSET_ACQUIRED_FROM_RECEIPT",
    "INTERNAL_CONTROL_FINDING_REGISTERED",
    "FLEET_OPERATION_REGISTERED",
    "SIAFIC_OUTBOX_QUEUED",
    "SIAFIC_DELIVERY_CONFIRMED",
    "SIAFIC_DELIVERY_FAILED",
    "SIAFIC_DELIVERY_RETRY_REQUESTED",
  ]);
});

test("exports the audit event contract", () => {
  const eventType: AuditEventType = auditEventTypes.instanceConfigurationChanged;
  const input: AuditEventInput = {
    actorUsuarioId: "user-1",
    eventType,
    targetType: "INSTANCE_CONFIGURATION",
    targetId: "instance-1:WORKFLOW_DEFAULT_SLA_DAYS",
  };

  assert.equal(input.eventType, "INSTANCE_CONFIGURATION_CHANGED");
});

test("normalizes validated audit consultation filters and builds their Prisma where clause", () => {
  const filters = normalizeAuditEventFilters({
    actorUsuarioId: " user-1 ",
    eventType: "DOCUMENT_DOWNLOAD",
    targetType: " DOCUMENT ",
    targetId: " document-1 ",
    from: "2026-08-01",
    to: "2026-08-02",
  });

  assert.deepEqual(filters, {
    actorUsuarioId: "user-1",
    eventType: "DOCUMENT_DOWNLOAD",
    targetType: "DOCUMENT",
    targetId: "document-1",
    from: "2026-08-01",
    to: "2026-08-02",
  });
  assert.deepEqual(buildAuditEventWhere(filters), {
    actorUsuarioId: "user-1",
    eventType: "DOCUMENT_DOWNLOAD",
    targetType: "DOCUMENT",
    targetId: "document-1",
    createdAt: {
      gte: new Date("2026-08-01T00:00:00.000Z"),
      lte: new Date("2026-08-02T23:59:59.999Z"),
    },
  });
  assert.throws(() => normalizeAuditEventFilters({ eventType: "UNKNOWN" }), /eventType inválido/);
  assert.throws(() => normalizeAuditEventFilters({ from: "2026-08-03", to: "2026-08-02" }), /auditoria/i);
  assert.throws(() => normalizeAuditEventFilters({ targetId: ["one", "two"] }), /targetId inválido/);
});

test("builds stable cursor queries and page navigation without a database", () => {
  const cursor = { id: "event-50", createdAt: new Date("2026-08-02T12:00:00.000Z") };
  const nextQuery = parseAuditEventQuery({ targetType: "DOCUMENT", cursor: encodeAuditEventCursor(cursor) });
  const previousQuery = parseAuditEventQuery({ targetType: "DOCUMENT", cursor: encodeAuditEventCursor(cursor), direction: "previous" });

  assert.deepEqual(buildAuditEventPageQuery(nextQuery), {
    where: {
      AND: [
        { targetType: "DOCUMENT" },
        { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: "event-50" } }] },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: auditEventPageSize + 1,
  });
  assert.deepEqual(buildAuditEventPageQuery(previousQuery).orderBy, [{ createdAt: "asc" }, { id: "asc" }]);

  const records = Array.from({ length: auditEventPageSize + 1 }, (_, index) => ({
    id: `event-${index}`,
    createdAt: new Date(Date.UTC(2026, 7, 2, 12, 0, -index)),
  }));
  const nextPage = createAuditEventPage(records, nextQuery);
  assert.equal(nextPage.events.length, auditEventPageSize);
  assert.equal(nextPage.previousCursor, encodeAuditEventCursor(records[0]));
  assert.equal(nextPage.nextCursor, encodeAuditEventCursor(records[auditEventPageSize - 1]));

  const previousPage = createAuditEventPage([...records].reverse(), previousQuery);
  assert.equal(previousPage.events[0].id, "event-1");
  assert.equal(previousPage.events.at(-1)?.id, `event-${auditEventPageSize}`);
  assert.ok(previousPage.previousCursor);
  assert.ok(previousPage.nextCursor);
});

test("limits audit-log consultation to the stable system administrator profile code", () => {
  const administrator = {
    profileCode: "SYSTEM_ADMINISTRATOR",
  } as Parameters<typeof isSystemAdministrator>[0];
  const administratorWithoutTotalAccess = {
    profileCode: "OPERACIONAL",
  } as Parameters<typeof isSystemAdministrator>[0];
  const nonAdministrator = {
    profileCode: "GESTOR",
  } as Parameters<typeof isSystemAdministrator>[0];

  assert.equal(isSystemAdministrator(administrator), true);
  assert.equal(isSystemAdministrator(administratorWithoutTotalAccess), false);
  assert.equal(isSystemAdministrator(nonAdministrator), false);
});

test("uses the same profile permissions for dashboard visibility and route access", () => {
  const profileAuthorized = {
    ...permissionUser,
    role: "Gestor",
    profileCode: "GESTOR",
    permissions: JSON.stringify({ modulosPermitidos: ["FINANCEIRO", "COMPRAS"] }),
    modulePermissions: [],
  } as Parameters<typeof canViewModule>[0];
  const explicitlyBlocked = {
    ...permissionUser,
    role: "Gestor",
    profileCode: "GESTOR",
    permissions: JSON.stringify({ modulosBloqueados: ["COMPRAS"] }),
    modulePermissions: [{ code: "COMPRAS", canView: true, canEdit: true }],
  } as Parameters<typeof canViewModule>[0];

  assert.equal(canViewModule(profileAuthorized, "COMPRAS"), true);
  assert.equal(canViewModule(explicitlyBlocked, "COMPRAS"), false);
});

test("applies dashboard visibility, blocking, and operational module permissions independently", () => {
  const profile = {
    role: "Gestor",
    permissions: JSON.stringify({
      acesso: "operacional",
      modules: {
        FINANCEIRO: { showDashboardCard: false, blocked: false, create: true, update: false, delete: false },
        COMPRAS: { showDashboardCard: true, blocked: true, view: true, create: true, update: true, delete: true },
      },
    }),
    modulePermissions: [],
  } as unknown as Parameters<typeof canViewModule>[0];

  assert.equal(canShowDashboardCard(profile, "FINANCEIRO"), false);
  assert.equal(canViewModule(profile, "FINANCEIRO"), true);
  assert.equal(canEditModule(profile, "FINANCEIRO"), true);
  assert.equal(canShowDashboardCard(profile, "COMPRAS"), true);
  assert.equal(isModuleBlockedForUser(profile, "COMPRAS"), true);
  assert.equal(canViewModule(profile, "COMPRAS"), false);
  assert.equal(canEditModule(profile, "COMPRAS"), false);
});

test("shows every dashboard module to the protected system administrator", () => {
  const administrator = {
    ...permissionUser,
    profileCode: "SYSTEM_ADMINISTRATOR",
    permissions: JSON.stringify({ acesso: "operacional", modules: {} }),
    modulePermissions: [],
  } as Parameters<typeof canShowDashboardCard>[0];

  assert.equal(canShowDashboardCard(administrator, "PATRIMONIO"), true);
  assert.equal(canShowDashboardCard(administrator, "CONFIGURACOES"), true);
});

test("requires the exact module operation for profiles using the granular matrix", () => {
  const profile = {
    ...permissionUser,
    role: "Operador",
    profileCode: "OPERACIONAL",
    permissions: JSON.stringify({
      modules: {
        CADASTROS: { showDashboardCard: true, blocked: false, create: true, update: false, delete: false, issueReports: true },
      },
    }),
    modulePermissions: [],
  } as Parameters<typeof canPerformModuleOperation>[0];

  assert.equal(canPerformModuleOperation(profile, "CADASTROS", "create"), true);
  assert.equal(canPerformModuleOperation(profile, "CADASTROS", "update"), false);
  assert.equal(canPerformModuleOperation(profile, "CADASTROS", "delete"), false);
  assert.equal(canPerformModuleOperation(profile, "CADASTROS", "issueReports"), true);
});

test("does not allow financial cancellations from the create permission", () => {
  const profile = {
    ...permissionUser,
    role: "Operador Financeiro",
    profileCode: "OPERACIONAL",
    permissions: JSON.stringify({
      modules: {
        FINANCEIRO: { showDashboardCard: true, blocked: false, create: true, update: false, delete: false, issueReports: false },
      },
    }),
    modulePermissions: [],
  } as Parameters<typeof canPerformModuleOperation>[0];

  assert.equal(canPerformModuleOperation(profile, "FINANCEIRO", "create"), true);
  assert.equal(canPerformModuleOperation(profile, "FINANCEIRO", "delete"), false);
});

test("treats explicitly inactive modules as unavailable", () => {
  assert.equal(isModuleActive(undefined), true);
  assert.equal(isModuleActive(true), true);
  assert.equal(isModuleActive(false), false);
});

test("migration protects audit evidence from mutation and indexes retention queries", async () => {
  const migration = await readFile(
    new URL("../prisma/migrations/20260802130000_add_audit_evidence_events/migration.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /ON DELETE RESTRICT ON UPDATE CASCADE/);
  assert.match(migration, /CREATE INDEX "AuditEvent_createdAt_idx"/);
  assert.match(migration, /CREATE INDEX "AuditEvent_actorUsuarioId_createdAt_idx"/);
  assert.match(migration, /BEFORE UPDATE OR DELETE ON "AuditEvent"/);
});

test("database rejects mutation of audit evidence", async () => {
  const actor = await prisma.usuario.findFirst({ select: { id: true } });
  assert.ok(actor, "A test actor is required to verify the audit foreign key.");

  await assert.rejects(
    prisma.$transaction(async (tx) => {
      const event = await tx.auditEvent.create({
        data: {
          actorUsuarioId: actor.id,
          eventType: auditEventTypes.sessionLogin,
          targetType: "SESSION",
          targetId: actor.id,
        },
      });
      await tx.auditEvent.update({
        where: { id: event.id },
        data: { eventType: auditEventTypes.sessionLogout },
      });
    }),
    /append-only/,
  );
});
