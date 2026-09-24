CREATE TABLE "TaxRegistryEntry" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ATIVO',
  "source" TEXT NOT NULL DEFAULT 'INTERNO',
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveUntil" TIMESTAMP(3),
  "processId" TEXT,
  "documentId" TEXT,
  "actorUsuarioId" TEXT,
  "reviewedByUsuarioId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TaxRegistryEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaxRegistryEntry_entityType_entityId_category_status_idx"
  ON "TaxRegistryEntry"("entityType", "entityId", "category", "status");
CREATE INDEX "TaxRegistryEntry_processId_idx" ON "TaxRegistryEntry"("processId");
CREATE INDEX "TaxRegistryEntry_documentId_idx" ON "TaxRegistryEntry"("documentId");
CREATE INDEX "TaxRegistryEntry_effectiveFrom_effectiveUntil_idx"
  ON "TaxRegistryEntry"("effectiveFrom", "effectiveUntil");

CREATE TABLE "TaxIntegrationEvent" (
  "id" TEXT NOT NULL,
  "integrationCode" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "protocol" TEXT,
  "externalReference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
  "evidenceLevel" TEXT NOT NULL DEFAULT 'L0',
  "payload" JSONB NOT NULL,
  "result" JSONB,
  "taxpayerId" TEXT,
  "economicRegistrationId" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TaxIntegrationEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaxIntegrationEvent_idempotencyKey_key" ON "TaxIntegrationEvent"("idempotencyKey");
CREATE INDEX "TaxIntegrationEvent_integrationCode_eventType_status_idx"
  ON "TaxIntegrationEvent"("integrationCode", "eventType", "status");
CREATE INDEX "TaxIntegrationEvent_taxpayerId_idx" ON "TaxIntegrationEvent"("taxpayerId");
CREATE INDEX "TaxIntegrationEvent_economicRegistrationId_idx" ON "TaxIntegrationEvent"("economicRegistrationId");
CREATE INDEX "TaxIntegrationEvent_receivedAt_idx" ON "TaxIntegrationEvent"("receivedAt");
