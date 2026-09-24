-- Nenhuma conta sem Unidade Gestora pode permanecer disponível para movimentação.
-- O administrador deve classificá-la explicitamente antes de reativá-la.
UPDATE "BankAccount"
SET "isActive" = false
WHERE "budgetUnitId" IS NULL
  AND "isActive" = true;
