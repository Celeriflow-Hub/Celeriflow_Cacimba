ALTER TABLE "BankAccount"
  ADD COLUMN IF NOT EXISTS "externalId" TEXT,
  ADD COLUMN IF NOT EXISTS "purpose" TEXT,
  ADD COLUMN IF NOT EXISTS "linkedInvestmentAccountId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "BankAccount_externalId_key" ON "BankAccount"("externalId") WHERE "externalId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "BankAccount_linkedInvestmentAccountId_idx" ON "BankAccount"("linkedInvestmentAccountId");
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_linkedInvestmentAccountId_fkey" FOREIGN KEY ("linkedInvestmentAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paymentOrderExternalId" TEXT, ADD COLUMN IF NOT EXISTS "integrationEventId" TEXT, ADD COLUMN IF NOT EXISTS "bankAccountExternalId" TEXT, ADD COLUMN IF NOT EXISTS "bankTransactionId" TEXT, ADD COLUMN IF NOT EXISTS "bankStatus" TEXT DEFAULT 'PENDING_SUBMISSION', ADD COLUMN IF NOT EXISTS "bankSubmittedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "bankProcessedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "bankRejectionCode" TEXT, ADD COLUMN IF NOT EXISTS "bankRejectionMessage" TEXT, ADD COLUMN IF NOT EXISTS "reversalOfBankTransactionId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_paymentOrderExternalId_key" ON "Payment"("paymentOrderExternalId") WHERE "paymentOrderExternalId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_integrationEventId_key" ON "Payment"("integrationEventId") WHERE "integrationEventId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_bankTransactionId_key" ON "Payment"("bankTransactionId") WHERE "bankTransactionId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Payment_bankAccountExternalId_bankStatus_idx" ON "Payment"("bankAccountExternalId", "bankStatus");

ALTER TABLE "Revenue" ADD COLUMN IF NOT EXISTS "integrationEventId" TEXT, ADD COLUMN IF NOT EXISTS "bankTransactionId" TEXT, ADD COLUMN IF NOT EXISTS "bankAccountExternalId" TEXT, ADD COLUMN IF NOT EXISTS "collectionReference" TEXT;
CREATE INDEX IF NOT EXISTS "Revenue_bankTransactionId_idx" ON "Revenue"("bankTransactionId");
CREATE INDEX IF NOT EXISTS "Revenue_integrationEventId_idx" ON "Revenue"("integrationEventId");

ALTER TABLE "BankStatementItem" ADD COLUMN IF NOT EXISTS "bankAccountId" TEXT, ADD COLUMN IF NOT EXISTS "bankTransactionId" TEXT, ADD COLUMN IF NOT EXISTS "integrationEventId" TEXT, ADD COLUMN IF NOT EXISTS "transactionType" TEXT, ADD COLUMN IF NOT EXISTS "clientReference" TEXT, ADD COLUMN IF NOT EXISTS "collectionReference" TEXT, ADD COLUMN IF NOT EXISTS "reversalOfBankTransactionId" TEXT;
CREATE INDEX IF NOT EXISTS "BankStatementItem_bankAccountId_bankTransactionId_idx" ON "BankStatementItem"("bankAccountId", "bankTransactionId");
CREATE INDEX IF NOT EXISTS "BankStatementItem_integrationEventId_idx" ON "BankStatementItem"("integrationEventId");
ALTER TABLE "BankStatementItem" ADD CONSTRAINT "BankStatementItem_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PayableCarryForward" ADD COLUMN IF NOT EXISTS "bankTransactionId" TEXT, ADD COLUMN IF NOT EXISTS "integrationEventId" TEXT, ADD COLUMN IF NOT EXISTS "paymentOrderExternalId" TEXT;
CREATE INDEX IF NOT EXISTS "PayableCarryForward_bankTransactionId_idx" ON "PayableCarryForward"("bankTransactionId");
ALTER TABLE "ActiveDebt" ADD COLUMN IF NOT EXISTS "bankTransactionId" TEXT, ADD COLUMN IF NOT EXISTS "integrationEventId" TEXT, ADD COLUMN IF NOT EXISTS "collectionReference" TEXT;
ALTER TABLE "Covenant" ADD COLUMN IF NOT EXISTS "bankTransactionId" TEXT, ADD COLUMN IF NOT EXISTS "integrationEventId" TEXT, ADD COLUMN IF NOT EXISTS "bankAccountExternalId" TEXT, ADD COLUMN IF NOT EXISTS "bankAccountId" TEXT;
CREATE INDEX IF NOT EXISTS "Covenant_bankTransactionId_idx" ON "Covenant"("bankTransactionId");
ALTER TABLE "Covenant" ADD CONSTRAINT "Covenant_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
