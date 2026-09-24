ALTER TABLE "BudgetGuideline"
  ADD COLUMN IF NOT EXISTS "multiYearPlanId" TEXT;

ALTER TABLE "AnnualBudgetLaw"
  ADD COLUMN IF NOT EXISTS "budgetGuidelineId" TEXT;

ALTER TABLE "BudgetAppropriation"
  ADD COLUMN IF NOT EXISTS "annualBudgetExpenseFixationId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BudgetGuideline_multiYearPlanId_fkey') THEN
    ALTER TABLE "BudgetGuideline" ADD CONSTRAINT "BudgetGuideline_multiYearPlanId_fkey" FOREIGN KEY ("multiYearPlanId") REFERENCES "MultiYearPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AnnualBudgetLaw_budgetGuidelineId_fkey') THEN
    ALTER TABLE "AnnualBudgetLaw" ADD CONSTRAINT "AnnualBudgetLaw_budgetGuidelineId_fkey" FOREIGN KEY ("budgetGuidelineId") REFERENCES "BudgetGuideline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BudgetAppropriation_annualBudgetExpenseFixationId_fkey') THEN
    ALTER TABLE "BudgetAppropriation" ADD CONSTRAINT "BudgetAppropriation_annualBudgetExpenseFixationId_fkey" FOREIGN KEY ("annualBudgetExpenseFixationId") REFERENCES "AnnualBudgetExpenseFixation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "BudgetGuideline_multiYearPlanId_idx" ON "BudgetGuideline"("multiYearPlanId");
CREATE INDEX IF NOT EXISTS "AnnualBudgetLaw_budgetGuidelineId_idx" ON "AnnualBudgetLaw"("budgetGuidelineId");
CREATE INDEX IF NOT EXISTS "BudgetAppropriation_annualBudgetExpenseFixationId_idx" ON "BudgetAppropriation"("annualBudgetExpenseFixationId");
