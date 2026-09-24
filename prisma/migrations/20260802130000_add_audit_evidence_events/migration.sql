-- Minimal, payload-free evidence ledger for authenticated session and document activity.
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditEvent"
    ADD CONSTRAINT "AuditEvent_actorUsuarioId_fkey"
    FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- These support actor, event, target, and retention-window evidence searches.
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");
CREATE INDEX "AuditEvent_actorUsuarioId_createdAt_idx" ON "AuditEvent"("actorUsuarioId", "createdAt");
CREATE INDEX "AuditEvent_eventType_createdAt_idx" ON "AuditEvent"("eventType", "createdAt");
CREATE INDEX "AuditEvent_targetType_targetId_createdAt_idx" ON "AuditEvent"("targetType", "targetId", "createdAt");

CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'AuditEvent e append-only e nao pode ser alterado ou excluido';
END;
$$;

CREATE TRIGGER "AuditEvent_append_only"
BEFORE UPDATE OR DELETE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();
