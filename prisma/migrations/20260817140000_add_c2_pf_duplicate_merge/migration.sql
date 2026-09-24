-- C2-003 initial PF-only duplicate flow. This migration is intentionally not applied by this change.
CREATE TABLE "PersonMergeRequest" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "sourcePersonId" TEXT NOT NULL,
    "targetPersonId" TEXT NOT NULL,
    "proposedByUsuarioId" TEXT NOT NULL,
    "approvedByUsuarioId" TEXT,
    "reversedByUsuarioId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PersonMergeRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PersonMergeRequest_distinct_people" CHECK ("sourcePersonId" <> "targetPersonId"),
    CONSTRAINT "PersonMergeRequest_status" CHECK ("status" IN ('PROPOSED', 'EXECUTED', 'REVERSED')),
    CONSTRAINT "PersonMergeRequest_execution_approval" CHECK (
      ("status" = 'PROPOSED' AND "approvedByUsuarioId" IS NULL AND "executedAt" IS NULL)
      OR ("status" IN ('EXECUTED', 'REVERSED') AND "approvedByUsuarioId" IS NOT NULL AND "executedAt" IS NOT NULL)
    ),
    CONSTRAINT "PersonMergeRequest_two_administrators" CHECK ("approvedByUsuarioId" IS NULL OR "approvedByUsuarioId" <> "proposedByUsuarioId")
);

CREATE TABLE "PersonMergeLedger" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sourcePersonId" TEXT NOT NULL,
    "targetPersonId" TEXT NOT NULL,
    "actorUsuarioId" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonMergeLedger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PersonMergeLedger_distinct_people" CHECK ("sourcePersonId" <> "targetPersonId"),
    CONSTRAINT "PersonMergeLedger_event_type" CHECK ("eventType" IN ('PROPOSED', 'EXECUTED', 'REVERSED'))
);

ALTER TABLE "PersonMergeRequest" ADD CONSTRAINT "PersonMergeRequest_sourcePersonId_fkey"
    FOREIGN KEY ("sourcePersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonMergeRequest" ADD CONSTRAINT "PersonMergeRequest_targetPersonId_fkey"
    FOREIGN KEY ("targetPersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonMergeRequest" ADD CONSTRAINT "PersonMergeRequest_proposedByUsuarioId_fkey"
    FOREIGN KEY ("proposedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonMergeRequest" ADD CONSTRAINT "PersonMergeRequest_approvedByUsuarioId_fkey"
    FOREIGN KEY ("approvedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonMergeRequest" ADD CONSTRAINT "PersonMergeRequest_reversedByUsuarioId_fkey"
    FOREIGN KEY ("reversedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonMergeLedger" ADD CONSTRAINT "PersonMergeLedger_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "PersonMergeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonMergeLedger" ADD CONSTRAINT "PersonMergeLedger_sourcePersonId_fkey"
    FOREIGN KEY ("sourcePersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonMergeLedger" ADD CONSTRAINT "PersonMergeLedger_targetPersonId_fkey"
    FOREIGN KEY ("targetPersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonMergeLedger" ADD CONSTRAINT "PersonMergeLedger_actorUsuarioId_fkey"
    FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "PersonMergeRequest_status_createdAt_idx" ON "PersonMergeRequest"("status", "createdAt");
CREATE INDEX "PersonMergeRequest_sourcePersonId_idx" ON "PersonMergeRequest"("sourcePersonId");
CREATE INDEX "PersonMergeRequest_targetPersonId_idx" ON "PersonMergeRequest"("targetPersonId");
CREATE INDEX "PersonMergeLedger_requestId_createdAt_idx" ON "PersonMergeLedger"("requestId", "createdAt");
CREATE INDEX "PersonMergeLedger_sourcePersonId_createdAt_idx" ON "PersonMergeLedger"("sourcePersonId", "createdAt");
CREATE INDEX "PersonMergeLedger_targetPersonId_createdAt_idx" ON "PersonMergeLedger"("targetPersonId", "createdAt");

CREATE OR REPLACE FUNCTION prevent_person_merge_ledger_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'PersonMergeLedger e append-only e nao pode ser alterado ou excluido';
END;
$$;

CREATE TRIGGER "PersonMergeLedger_append_only"
BEFORE UPDATE OR DELETE ON "PersonMergeLedger"
FOR EACH ROW EXECUTE FUNCTION prevent_person_merge_ledger_mutation();
