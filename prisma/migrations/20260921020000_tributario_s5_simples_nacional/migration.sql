CREATE TABLE "SimplesImportBatch" (
  "id" TEXT NOT NULL, "sourceType" TEXT NOT NULL, "originMode" TEXT NOT NULL DEFAULT 'CONTROLLED_INTERNAL', "fileName" TEXT NOT NULL,
  "checksum" TEXT NOT NULL, "competence" TEXT, "status" TEXT NOT NULL DEFAULT 'PROCESSADO', "totalRows" INTEGER NOT NULL DEFAULT 0,
  "acceptedRows" INTEGER NOT NULL DEFAULT 0, "rejectedRows" INTEGER NOT NULL DEFAULT 0, "payload" JSONB NOT NULL, "errorSummary" JSONB,
  "createdByUsuarioId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SimplesImportBatch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SimplesFiscalRecord" (
  "id" TEXT NOT NULL, "importBatchId" TEXT NOT NULL, "taxpayerId" TEXT NOT NULL, "competence" TEXT NOT NULL, "recordType" TEXT NOT NULL,
  "nationalRevenueDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0, "declaredServiceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "taxableBaseDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0, "rate" DECIMAL(9,6), "municipalIssDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "confirmedPaymentDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0, "activityCode" TEXT, "paymentCode" TEXT, "isEstimate" BOOLEAN NOT NULL DEFAULT false,
  "rawData" JSONB NOT NULL, "status" TEXT NOT NULL DEFAULT 'VALIDO', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SimplesFiscalRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SimplesOptionPeriod" (
  "id" TEXT NOT NULL, "taxpayerId" TEXT NOT NULL, "regime" TEXT NOT NULL, "startDate" TIMESTAMP(3) NOT NULL, "endDate" TIMESTAMP(3),
  "sourceBatchId" TEXT, "status" TEXT NOT NULL DEFAULT 'ATIVO', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SimplesOptionPeriod_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SimplesDivergence" (
  "id" TEXT NOT NULL, "taxpayerId" TEXT NOT NULL, "competence" TEXT NOT NULL, "divergenceType" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'ABERTA',
  "nfseServiceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0, "declaredServiceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "revenueDifferenceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0, "municipalIssDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "confirmedPaymentDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0, "paymentDifferenceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "details" JSONB NOT NULL, "dteMessageId" TEXT, "lastProcessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SimplesDivergence_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SimplesRegularizationEvent" (
  "id" TEXT NOT NULL, "divergenceId" TEXT NOT NULL, "eventType" TEXT NOT NULL, "description" TEXT NOT NULL, "payload" JSONB,
  "actorUsuarioId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SimplesRegularizationEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SimplesExclusionCase" (
  "id" TEXT NOT NULL, "taxpayerId" TEXT NOT NULL, "competence" TEXT NOT NULL, "reason" TEXT NOT NULL,
  "calendarRevenueDecimal" DECIMAL(18,2) NOT NULL, "legalLimitDecimal" DECIMAL(18,2) NOT NULL, "status" TEXT NOT NULL DEFAULT 'PREPARADA',
  "documentId" TEXT, "dteMessageId" TEXT, "exportContent" TEXT, "externalReceipt" TEXT, "createdByUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SimplesExclusionCase_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SimplesPaymentAllocation" (
  "id" TEXT NOT NULL, "importBatchId" TEXT NOT NULL, "taxpayerId" TEXT NOT NULL, "competence" TEXT NOT NULL, "revenueCode" TEXT NOT NULL,
  "taxpayerRegime" TEXT NOT NULL, "nationalDasDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0, "municipalComponentDecimal" DECIMAL(18,2) NOT NULL,
  "confirmedDecimal" DECIMAL(18,2) NOT NULL, "differenceDecimal" DECIMAL(18,2) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SimplesPaymentAllocation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SimplesImportBatch_checksum_key" ON "SimplesImportBatch"("checksum");
CREATE INDEX "SimplesImportBatch_sourceType_competence_createdAt_idx" ON "SimplesImportBatch"("sourceType", "competence", "createdAt");
CREATE INDEX "SimplesFiscalRecord_taxpayerId_competence_recordType_idx" ON "SimplesFiscalRecord"("taxpayerId", "competence", "recordType");
CREATE INDEX "SimplesFiscalRecord_importBatchId_status_idx" ON "SimplesFiscalRecord"("importBatchId", "status");
CREATE UNIQUE INDEX "SimplesOptionPeriod_taxpayerId_regime_startDate_key" ON "SimplesOptionPeriod"("taxpayerId", "regime", "startDate");
CREATE INDEX "SimplesOptionPeriod_taxpayerId_status_idx" ON "SimplesOptionPeriod"("taxpayerId", "status");
CREATE UNIQUE INDEX "SimplesDivergence_taxpayerId_competence_divergenceType_key" ON "SimplesDivergence"("taxpayerId", "competence", "divergenceType");
CREATE INDEX "SimplesDivergence_status_competence_idx" ON "SimplesDivergence"("status", "competence");
CREATE INDEX "SimplesDivergence_taxpayerId_status_idx" ON "SimplesDivergence"("taxpayerId", "status");
CREATE INDEX "SimplesRegularizationEvent_divergenceId_createdAt_idx" ON "SimplesRegularizationEvent"("divergenceId", "createdAt");
CREATE INDEX "SimplesExclusionCase_taxpayerId_status_idx" ON "SimplesExclusionCase"("taxpayerId", "status");
CREATE INDEX "SimplesExclusionCase_competence_idx" ON "SimplesExclusionCase"("competence");
CREATE INDEX "SimplesPaymentAllocation_taxpayerId_competence_idx" ON "SimplesPaymentAllocation"("taxpayerId", "competence");
CREATE INDEX "SimplesPaymentAllocation_revenueCode_competence_idx" ON "SimplesPaymentAllocation"("revenueCode", "competence");
ALTER TABLE "SimplesFiscalRecord" ADD CONSTRAINT "SimplesFiscalRecord_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "SimplesImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SimplesRegularizationEvent" ADD CONSTRAINT "SimplesRegularizationEvent_divergenceId_fkey" FOREIGN KEY ("divergenceId") REFERENCES "SimplesDivergence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SimplesPaymentAllocation" ADD CONSTRAINT "SimplesPaymentAllocation_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "SimplesImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
