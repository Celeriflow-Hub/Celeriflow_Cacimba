CREATE TABLE "FinancialDocument" (
  "id" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'SYSTEM',
  "generatedByUsuarioId" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "commitmentId" TEXT,
  "settlementId" TEXT,
  "paymentId" TEXT,

  CONSTRAINT "FinancialDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinancialDocument_number_key" ON "FinancialDocument"("number");
CREATE UNIQUE INDEX "FinancialDocument_commitmentId_key" ON "FinancialDocument"("commitmentId");
CREATE UNIQUE INDEX "FinancialDocument_settlementId_key" ON "FinancialDocument"("settlementId");
CREATE UNIQUE INDEX "FinancialDocument_paymentId_key" ON "FinancialDocument"("paymentId");
CREATE INDEX "FinancialDocument_documentType_generatedAt_idx" ON "FinancialDocument"("documentType", "generatedAt");

ALTER TABLE "FinancialDocument"
  ADD CONSTRAINT "FinancialDocument_commitmentId_fkey"
  FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialDocument"
  ADD CONSTRAINT "FinancialDocument_settlementId_fkey"
  FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialDocument"
  ADD CONSTRAINT "FinancialDocument_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
