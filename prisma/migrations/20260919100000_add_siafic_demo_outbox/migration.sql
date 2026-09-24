-- SIAFIC DEMO is additive. Existing source records and the generic integration
-- run history remain untouched; this migration adds durable snapshots and
-- delivery evidence for the external demonstration adapter.
ALTER TABLE "Contract" ADD COLUMN "sourceBudgetUnitId" TEXT;

CREATE TABLE "SiaficEntityVersion" (
  "id" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "datasetId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiaficEntityVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiaficOutboxEvent" (
  "id" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "actorUsuarioId" TEXT NOT NULL,
  "datasetId" TEXT NOT NULL,
  "sourceInstanceId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "entityVersion" INTEGER NOT NULL,
  "deliveryRevision" INTEGER NOT NULL DEFAULT 1,
  "eventType" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "destinationSnapshot" JSONB NOT NULL,
  "replacesEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiaficOutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiaficDelivery" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseToken" TEXT,
  "leaseExpiresAt" TIMESTAMP(3),
  "lastError" TEXT,
  "remoteEntityId" TEXT,
  "receiptId" TEXT,
  "processedAt" TIMESTAMP(3),
  "receipt" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiaficDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiaficDeliveryAttempt" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "httpStatus" INTEGER,
  "errorCode" TEXT,
  "message" TEXT,
  "durationMs" INTEGER,
  "outcome" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "SiaficDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiaficExternalLink" (
  "id" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "datasetId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "remoteEntityId" TEXT NOT NULL,
  "latestVersion" INTEGER NOT NULL,
  "latestPayloadHash" TEXT NOT NULL,
  "lastEventId" TEXT NOT NULL,
  "receiptId" TEXT NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiaficExternalLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SiaficEntityVersion_connectionId_datasetId_entityType_entityId_key"
  ON "SiaficEntityVersion"("connectionId", "datasetId", "entityType", "entityId");
CREATE INDEX "SiaficEntityVersion_entityType_entityId_idx"
  ON "SiaficEntityVersion"("entityType", "entityId");
CREATE UNIQUE INDEX "SiaficOutboxEvent_connectionId_datasetId_idempotencyKey_key"
  ON "SiaficOutboxEvent"("connectionId", "datasetId", "idempotencyKey");
CREATE UNIQUE INDEX "SiaficOutboxEvent_entity_version_revision_uq"
  ON "SiaficOutboxEvent"("connectionId", "datasetId", "entityType", "entityId", "entityVersion", "deliveryRevision");
CREATE INDEX "SiaficOutboxEvent_entity_version_ix"
  ON "SiaficOutboxEvent"("connectionId", "datasetId", "entityType", "entityId", "entityVersion");
CREATE INDEX "SiaficOutboxEvent_actorUsuarioId_createdAt_idx"
  ON "SiaficOutboxEvent"("actorUsuarioId", "createdAt");
CREATE UNIQUE INDEX "SiaficDelivery_eventId_key" ON "SiaficDelivery"("eventId");
CREATE INDEX "SiaficDelivery_status_nextAttemptAt_idx" ON "SiaficDelivery"("status", "nextAttemptAt");
CREATE INDEX "SiaficDelivery_leaseExpiresAt_idx" ON "SiaficDelivery"("leaseExpiresAt");
CREATE INDEX "SiaficDeliveryAttempt_deliveryId_startedAt_idx" ON "SiaficDeliveryAttempt"("deliveryId", "startedAt");
CREATE INDEX "SiaficDeliveryAttempt_correlationId_idx" ON "SiaficDeliveryAttempt"("correlationId");
CREATE UNIQUE INDEX "SiaficExternalLink_connectionId_datasetId_entityType_entityId_key"
  ON "SiaficExternalLink"("connectionId", "datasetId", "entityType", "entityId");
CREATE INDEX "SiaficExternalLink_connectionId_datasetId_remoteEntityId_idx"
  ON "SiaficExternalLink"("connectionId", "datasetId", "remoteEntityId");

ALTER TABLE "Contract" ADD CONSTRAINT "Contract_sourceBudgetUnitId_fkey"
  FOREIGN KEY ("sourceBudgetUnitId") REFERENCES "BudgetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SiaficEntityVersion" ADD CONSTRAINT "SiaficEntityVersion_connectionId_fkey"
  FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SiaficOutboxEvent" ADD CONSTRAINT "SiaficOutboxEvent_connectionId_fkey"
  FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SiaficOutboxEvent" ADD CONSTRAINT "SiaficOutboxEvent_actorUsuarioId_fkey"
  FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SiaficDelivery" ADD CONSTRAINT "SiaficDelivery_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "SiaficOutboxEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SiaficDeliveryAttempt" ADD CONSTRAINT "SiaficDeliveryAttempt_deliveryId_fkey"
  FOREIGN KEY ("deliveryId") REFERENCES "SiaficDelivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SiaficExternalLink" ADD CONSTRAINT "SiaficExternalLink_connectionId_fkey"
  FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
