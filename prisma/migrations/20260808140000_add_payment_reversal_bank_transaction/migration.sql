ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "reversalBankTransactionId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_reversalBankTransactionId_key" ON "Payment"("reversalBankTransactionId") WHERE "reversalBankTransactionId" IS NOT NULL;
