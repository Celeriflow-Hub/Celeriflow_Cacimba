ALTER TABLE "WithholdingPayable"
  ADD COLUMN "receiptDocumentId" TEXT;

ALTER TABLE "FinancialDocument"
  ADD COLUMN "withholdingPayableId" TEXT;

CREATE UNIQUE INDEX "FinancialDocument_withholdingPayableId_key" ON "FinancialDocument"("withholdingPayableId");
CREATE INDEX "WithholdingPayable_receiptDocumentId_idx" ON "WithholdingPayable"("receiptDocumentId");

ALTER TABLE "WithholdingPayable"
  ADD CONSTRAINT "WithholdingPayable_receiptDocumentId_fkey"
  FOREIGN KEY ("receiptDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialDocument"
  ADD CONSTRAINT "FinancialDocument_withholdingPayableId_fkey"
  FOREIGN KEY ("withholdingPayableId") REFERENCES "WithholdingPayable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
