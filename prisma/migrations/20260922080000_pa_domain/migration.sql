-- Correção final POC B5: recepção, risco configurável, salas, leitos, observação, destinos

CREATE TABLE IF NOT EXISTS "HealthRiskProtocol" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL DEFAULT '#64748b',
    "maxWaitMinutes" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthRiskProtocol_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthRiskProtocol_level_key" ON "HealthRiskProtocol"("level");

CREATE TABLE IF NOT EXISTS "HealthDestination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthDestination_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthDestination_name_key" ON "HealthDestination"("name");

CREATE TABLE IF NOT EXISTS "HealthRoom" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Atendimento',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthRoom_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthRoom_unitId_name_key" ON "HealthRoom"("unitId", "name");

CREATE TABLE IF NOT EXISTS "HealthReception" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "unidentifiedName" TEXT,
    "unitId" TEXT NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priorityFlags" TEXT,
    "companionName" TEXT,
    "companionKinship" TEXT,
    "companionPhone" TEXT,
    "transportMode" TEXT,
    "agreement" TEXT,
    "roomId" TEXT,
    "destinationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aguardando',
    "outcome" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthReception_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthReception_unitId_status_arrivalAt_idx" ON "HealthReception"("unitId", "status", "arrivalAt");
CREATE INDEX IF NOT EXISTS "HealthReception_patientId_idx" ON "HealthReception"("patientId");

CREATE TABLE IF NOT EXISTS "HealthBed" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "room" TEXT,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Livre',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthBed_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthBed_unitId_code_key" ON "HealthBed"("unitId", "code");
CREATE INDEX IF NOT EXISTS "HealthBed_unitId_status_idx" ON "HealthBed"("unitId", "status");

CREATE TABLE IF NOT EXISTS "HealthBedOccupancy" (
    "id" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dischargedAt" TIMESTAMP(3),
    "notes" TEXT,
    CONSTRAINT "HealthBedOccupancy_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthBedOccupancy_bedId_dischargedAt_idx" ON "HealthBedOccupancy"("bedId", "dischargedAt");
CREATE INDEX IF NOT EXISTS "HealthBedOccupancy_patientId_idx" ON "HealthBedOccupancy"("patientId");

CREATE TABLE IF NOT EXISTS "HealthObservation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "bedId" TEXT,
    "responsible" TEXT,
    "solicitedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Em observação',
    "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dischargedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthObservation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthObservation_unitId_status_idx" ON "HealthObservation"("unitId", "status");

DO $$ BEGIN
  ALTER TABLE "HealthRoom" ADD CONSTRAINT "HealthRoom_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthReception" ADD CONSTRAINT "HealthReception_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthReception" ADD CONSTRAINT "HealthReception_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthReception" ADD CONSTRAINT "HealthReception_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HealthRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthReception" ADD CONSTRAINT "HealthReception_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "HealthDestination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthBed" ADD CONSTRAINT "HealthBed_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthBedOccupancy" ADD CONSTRAINT "HealthBedOccupancy_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "HealthBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthBedOccupancy" ADD CONSTRAINT "HealthBedOccupancy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthObservation" ADD CONSTRAINT "HealthObservation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthObservation" ADD CONSTRAINT "HealthObservation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthObservation" ADD CONSTRAINT "HealthObservation_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "HealthBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
