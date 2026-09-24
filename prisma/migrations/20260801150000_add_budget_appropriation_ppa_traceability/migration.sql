ALTER TABLE "BudgetAppropriation"
  ADD COLUMN IF NOT EXISTS "programPPAId" TEXT,
  ADD COLUMN IF NOT EXISTS "actionPPAId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BudgetAppropriation_programPPAId_fkey') THEN
    ALTER TABLE "BudgetAppropriation" ADD CONSTRAINT "BudgetAppropriation_programPPAId_fkey" FOREIGN KEY ("programPPAId") REFERENCES "ProgramPPA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BudgetAppropriation_actionPPAId_fkey') THEN
    ALTER TABLE "BudgetAppropriation" ADD CONSTRAINT "BudgetAppropriation_actionPPAId_fkey" FOREIGN KEY ("actionPPAId") REFERENCES "ActionPPA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "BudgetAppropriation_programPPAId_actionPPAId_idx" ON "BudgetAppropriation"("programPPAId", "actionPPAId");
