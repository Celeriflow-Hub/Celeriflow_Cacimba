-- Vincula cada conta bancária a uma conta analítica exclusiva para apuração do razão bancário.
-- O campo inicia opcional para permitir backfill auditado das contas históricas.
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "accountingPlanId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "BankAccount_accountingPlanId_key"
  ON "BankAccount"("accountingPlanId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BankAccount_accountingPlanId_fkey'
  ) THEN
    ALTER TABLE "BankAccount"
      ADD CONSTRAINT "BankAccount_accountingPlanId_fkey"
      FOREIGN KEY ("accountingPlanId") REFERENCES "AccountingPlan"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
