-- S4-C: Producao e Faturamento SUS

CREATE TABLE IF NOT EXISTS "HealthProductionCompetence" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthProductionCompetence_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthProductionCompetence_period_key" ON "HealthProductionCompetence"("period");
CREATE INDEX IF NOT EXISTS "HealthProductionCompetence_status_idx" ON "HealthProductionCompetence"("status");

CREATE TABLE IF NOT EXISTS "HealthProductionFact" (
    "id" TEXT NOT NULL,
    "originType" TEXT NOT NULL,
    "originId" TEXT NOT NULL,
    "patientId" TEXT,
    "unitId" TEXT,
    "professionalId" TEXT,
    "procedureId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "value" DECIMAL(14,2),
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "competenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VALIDO',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthProductionFact_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthProductionFact_idempotencyKey_key" ON "HealthProductionFact"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "HealthProductionFact_period_status_idx" ON "HealthProductionFact"("period", "status");
CREATE INDEX IF NOT EXISTS "HealthProductionFact_competenceId_status_idx" ON "HealthProductionFact"("competenceId", "status");
CREATE INDEX IF NOT EXISTS "HealthProductionFact_unitId_period_idx" ON "HealthProductionFact"("unitId", "period");

CREATE TABLE IF NOT EXISTS "HealthProductionCriticism" (
    "id" TEXT NOT NULL,
    "factId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionNeeded" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthProductionCriticism_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthProductionCriticism_factId_status_idx" ON "HealthProductionCriticism"("factId", "status");

CREATE TABLE IF NOT EXISTS "HealthSusFile" (
    "id" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "unitId" TEXT,
    "content" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalValue" DECIMAL(14,2),
    "status" TEXT NOT NULL DEFAULT 'GERADO',
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthSusFile_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthSusFile_competenceId_fileType_idx" ON "HealthSusFile"("competenceId", "fileType");

DO $$ BEGIN
  ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "HealthProductionCompetence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthProductionCriticism" ADD CONSTRAINT "HealthProductionCriticism_factId_fkey" FOREIGN KEY ("factId") REFERENCES "HealthProductionFact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthSusFile" ADD CONSTRAINT "HealthSusFile_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "HealthProductionCompetence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthSusFile" ADD CONSTRAINT "HealthSusFile_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
