-- Segrega as contas bancarias por Unidade Gestora sem assumir uma UG para contas legadas.
-- Contas sem vinculo devem ser classificadas pelo administrador antes de movimentacoes.
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "budgetUnitId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'BankAccount_budgetUnitId_fkey'
  ) THEN
    ALTER TABLE "BankAccount"
      ADD CONSTRAINT "BankAccount_budgetUnitId_fkey"
      FOREIGN KEY ("budgetUnitId") REFERENCES "BudgetUnit"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "BankAccount_budgetUnitId_idx" ON "BankAccount"("budgetUnitId");

CREATE OR REPLACE FUNCTION prevent_financial_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'FinancialAuditLog e append-only e nao pode ser alterado ou excluido';
END;
$$;

DROP TRIGGER IF EXISTS "FinancialAuditLog_append_only" ON "FinancialAuditLog";
CREATE TRIGGER "FinancialAuditLog_append_only"
BEFORE UPDATE OR DELETE ON "FinancialAuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_financial_audit_log_mutation();
