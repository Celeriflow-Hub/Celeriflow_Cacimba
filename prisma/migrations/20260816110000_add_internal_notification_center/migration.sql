-- Evolves the protocol-only table into the shared internal notification center.
ALTER TABLE "ProtocolNotification"
    ALTER COLUMN "processId" DROP NOT NULL,
    ADD COLUMN "sourceModule" TEXT NOT NULL DEFAULT 'PROCESSOS',
    ADD COLUMN "entityType" TEXT NOT NULL DEFAULT 'PROCESS',
    ADD COLUMN "entityId" TEXT,
    ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'NORMAL';

-- Every legacy notification remains a process notification and keeps its history.
UPDATE "ProtocolNotification"
SET "entityId" = "processId"
WHERE "entityId" IS NULL AND "processId" IS NOT NULL;

ALTER TABLE "ProtocolNotification"
    ALTER COLUMN "entityId" SET NOT NULL;

ALTER TABLE "ProtocolNotification"
    ADD CONSTRAINT "ProtocolNotification_priority_check"
    CHECK ("priority" IN ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE'));

-- Preserve legacy rows if a previous job wrote the same non-null dedupe key more than once.
WITH duplicate_keys AS (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId", "dedupeKey" ORDER BY "createdAt", "id") AS row_number
    FROM "ProtocolNotification"
    WHERE "dedupeKey" IS NOT NULL
)
UPDATE "ProtocolNotification" notification
SET "dedupeKey" = NULL
FROM duplicate_keys
WHERE notification."id" = duplicate_keys."id" AND duplicate_keys.row_number > 1;

CREATE UNIQUE INDEX "ProtocolNotification_userId_dedupeKey_unique"
    ON "ProtocolNotification"("userId", "dedupeKey")
    WHERE "dedupeKey" IS NOT NULL;
CREATE INDEX "ProtocolNotification_sourceModule_entityType_entityId_createdAt_idx"
    ON "ProtocolNotification"("sourceModule", "entityType", "entityId", "createdAt");
