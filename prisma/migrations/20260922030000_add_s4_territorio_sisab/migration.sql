-- S4-D: Territorio, SISAB e e-SUS

CREATE TABLE IF NOT EXISTS "HealthTerritoryArea" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitId" TEXT,
    "teamId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthTerritoryArea_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthTerritoryArea_code_key" ON "HealthTerritoryArea"("code");
CREATE INDEX IF NOT EXISTS "HealthTerritoryArea_unitId_isActive_idx" ON "HealthTerritoryArea"("unitId", "isActive");

CREATE TABLE IF NOT EXISTS "HealthMicroarea" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "agentProfessionalId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthMicroarea_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthMicroarea_areaId_code_key" ON "HealthMicroarea"("areaId", "code");

CREATE TABLE IF NOT EXISTS "HealthHousehold" (
    "id" TEXT NOT NULL,
    "householdCode" TEXT,
    "microareaId" TEXT,
    "addressId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthHousehold_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthHousehold_householdCode_key" ON "HealthHousehold"("householdCode");

CREATE TABLE IF NOT EXISTS "HealthFamily" (
    "id" TEXT NOT NULL,
    "familyCode" TEXT,
    "householdId" TEXT,
    "responsiblePersonId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthFamily_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthFamily_householdId_isActive_idx" ON "HealthFamily"("householdId", "isActive");

CREATE TABLE IF NOT EXISTS "HealthFamilyMember" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "kinship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthFamilyMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthFamilyMember_personId_key" ON "HealthFamilyMember"("personId");
CREATE INDEX IF NOT EXISTS "HealthFamilyMember_familyId_idx" ON "HealthFamilyMember"("familyId");

CREATE TABLE IF NOT EXISTS "HealthHomeVisit" (
    "id" TEXT NOT NULL,
    "householdId" TEXT,
    "familyId" TEXT,
    "teamId" TEXT,
    "professionalId" TEXT NOT NULL,
    "areaId" TEXT,
    "microareaId" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL,
    "actions" TEXT NOT NULL,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REALIZADA',
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthHomeVisit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthHomeVisit_visitedAt_status_idx" ON "HealthHomeVisit"("visitedAt", "status");
CREATE INDEX IF NOT EXISTS "HealthHomeVisit_familyId_visitedAt_idx" ON "HealthHomeVisit"("familyId", "visitedAt");

CREATE TABLE IF NOT EXISTS "HealthHomeVisitParticipant" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "patientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthHomeVisitParticipant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthHomeVisitParticipant_visitId_personId_key" ON "HealthHomeVisitParticipant"("visitId", "personId");

CREATE TABLE IF NOT EXISTS "HealthEsusForm" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "householdId" TEXT,
    "familyId" TEXT,
    "personId" TEXT,
    "patientId" TEXT,
    "professionalId" TEXT,
    "teamId" TEXT,
    "unitId" TEXT,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "payload" JSONB,
    "originMedicalRecordId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthEsusForm_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthEsusForm_idempotencyKey_key" ON "HealthEsusForm"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "HealthEsusForm_kind_period_status_idx" ON "HealthEsusForm"("kind", "period", "status");
CREATE INDEX IF NOT EXISTS "HealthEsusForm_unitId_period_idx" ON "HealthEsusForm"("unitId", "period");

CREATE TABLE IF NOT EXISTS "HealthEsusBatch" (
    "id" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GERADO',
    "fileContent" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "accepted" INTEGER NOT NULL DEFAULT 0,
    "rejected" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthEsusBatch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthEsusBatch_competence_status_idx" ON "HealthEsusBatch"("competence", "status");

CREATE TABLE IF NOT EXISTS "HealthEsusBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthEsusBatchItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthEsusBatchItem_batchId_formId_key" ON "HealthEsusBatchItem"("batchId", "formId");

DO $$ BEGIN
  ALTER TABLE "HealthTerritoryArea" ADD CONSTRAINT "HealthTerritoryArea_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthTerritoryArea" ADD CONSTRAINT "HealthTerritoryArea_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthMicroarea" ADD CONSTRAINT "HealthMicroarea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "HealthTerritoryArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthMicroarea" ADD CONSTRAINT "HealthMicroarea_agentProfessionalId_fkey" FOREIGN KEY ("agentProfessionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthHousehold" ADD CONSTRAINT "HealthHousehold_microareaId_fkey" FOREIGN KEY ("microareaId") REFERENCES "HealthMicroarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthHousehold" ADD CONSTRAINT "HealthHousehold_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthFamily" ADD CONSTRAINT "HealthFamily_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HealthHousehold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthFamily" ADD CONSTRAINT "HealthFamily_responsiblePersonId_fkey" FOREIGN KEY ("responsiblePersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthFamilyMember" ADD CONSTRAINT "HealthFamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "HealthFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthFamilyMember" ADD CONSTRAINT "HealthFamilyMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HealthHousehold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "HealthFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "HealthTerritoryArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_microareaId_fkey" FOREIGN KEY ("microareaId") REFERENCES "HealthMicroarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthHomeVisitParticipant" ADD CONSTRAINT "HealthHomeVisitParticipant_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "HealthHomeVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthHomeVisitParticipant" ADD CONSTRAINT "HealthHomeVisitParticipant_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthHomeVisitParticipant" ADD CONSTRAINT "HealthHomeVisitParticipant_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HealthHousehold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "HealthFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_originMedicalRecordId_fkey" FOREIGN KEY ("originMedicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthEsusBatchItem" ADD CONSTRAINT "HealthEsusBatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "HealthEsusBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthEsusBatchItem" ADD CONSTRAINT "HealthEsusBatchItem_formId_fkey" FOREIGN KEY ("formId") REFERENCES "HealthEsusForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
