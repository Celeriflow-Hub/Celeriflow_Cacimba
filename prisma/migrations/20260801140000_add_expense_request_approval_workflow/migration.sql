ALTER TABLE "Expense"
  ADD COLUMN IF NOT EXISTS "supplierId" TEXT,
  ADD COLUMN IF NOT EXISTS "requestedById" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Expense_supplierId_fkey') THEN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Expense_requestedById_fkey') THEN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Expense_approvedById_fkey') THEN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Expense_appropriationId_status_idx" ON "Expense"("appropriationId", "status");
CREATE INDEX IF NOT EXISTS "Expense_requestedById_idx" ON "Expense"("requestedById");
