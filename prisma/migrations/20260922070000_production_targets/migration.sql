-- Correção final POC B4: metas FPO e teto por unidade

CREATE TABLE IF NOT EXISTS "HealthProductionTarget" (
    "id" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "contractedQuantity" DOUBLE PRECISION NOT NULL,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthProductionTarget_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthProductionTarget_competenceId_procedureId_key" ON "HealthProductionTarget"("competenceId", "procedureId");

CREATE TABLE IF NOT EXISTS "HealthUnitCeiling" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthUnitCeiling_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthUnitCeiling_unitId_period_key" ON "HealthUnitCeiling"("unitId", "period");

DO $$ BEGIN
  ALTER TABLE "HealthProductionTarget" ADD CONSTRAINT "HealthProductionTarget_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "HealthProductionCompetence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthProductionTarget" ADD CONSTRAINT "HealthProductionTarget_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthUnitCeiling" ADD CONSTRAINT "HealthUnitCeiling_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
