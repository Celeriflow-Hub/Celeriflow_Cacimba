-- Fechamento S4: CID e município/UF históricos nos fatos de produção

ALTER TABLE "HealthProductionFact" ADD COLUMN IF NOT EXISTS "cidReferenceId" TEXT;
ALTER TABLE "HealthProductionFact" ADD COLUMN IF NOT EXISTS "municipality" TEXT;
ALTER TABLE "HealthProductionFact" ADD COLUMN IF NOT EXISTS "state" TEXT;

CREATE INDEX IF NOT EXISTS "HealthProductionFact_cidReferenceId_idx" ON "HealthProductionFact"("cidReferenceId");
CREATE INDEX IF NOT EXISTS "HealthProductionFact_municipality_state_idx" ON "HealthProductionFact"("municipality", "state");

DO $$ BEGIN
  ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_cidReferenceId_fkey" FOREIGN KEY ("cidReferenceId") REFERENCES "HealthSusReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
