ALTER TABLE "Settlement"
  ADD COLUMN "fiscalDocumentNumber" TEXT,
  ADD COLUMN "fiscalDocumentSeries" TEXT,
  ADD COLUMN "fiscalDocumentIssueDate" TIMESTAMP(3),
  ADD COLUMN "fiscalDocumentAccessKey" TEXT;

CREATE UNIQUE INDEX "Settlement_fiscalDocumentAccessKey_key" ON "Settlement"("fiscalDocumentAccessKey");
CREATE INDEX "Settlement_fiscalDocumentNumber_fiscalDocumentSeries_idx" ON "Settlement"("fiscalDocumentNumber", "fiscalDocumentSeries");

CREATE TABLE "SettlementRetention" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "retentionRuleId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "calculationBaseDecimal" DECIMAL(18,2) NOT NULL,
  "ratePercentage" DECIMAL(7,4) NOT NULL,
  "valueDecimal" DECIMAL(18,2) NOT NULL,
  "beneficiaryName" TEXT NOT NULL,
  "beneficiaryDocument" TEXT,
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SettlementRetention_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PaymentRetention" ADD COLUMN "settlementRetentionId" TEXT;

CREATE UNIQUE INDEX "SettlementRetention_settlementId_retentionRuleId_key" ON "SettlementRetention"("settlementId", "retentionRuleId");
CREATE INDEX "SettlementRetention_retentionRuleId_idx" ON "SettlementRetention"("retentionRuleId");
CREATE INDEX "PaymentRetention_settlementRetentionId_idx" ON "PaymentRetention"("settlementRetentionId");

ALTER TABLE "SettlementRetention"
  ADD CONSTRAINT "SettlementRetention_settlementId_fkey"
  FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SettlementRetention"
  ADD CONSTRAINT "SettlementRetention_retentionRuleId_fkey"
  FOREIGN KEY ("retentionRuleId") REFERENCES "RetentionRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentRetention"
  ADD CONSTRAINT "PaymentRetention_settlementRetentionId_fkey"
  FOREIGN KEY ("settlementRetentionId") REFERENCES "SettlementRetention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
