-- Correção final POC B6: setores, protocolo, anexos, convênio, dupla custódia TFD

CREATE TABLE IF NOT EXISTS "HealthRegulationSector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthRegulationSector_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthRegulationSector_name_key" ON "HealthRegulationSector"("name");

CREATE TABLE IF NOT EXISTS "HealthRegulationAttachment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "uploadedByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthRegulationAttachment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthRegulationAttachment_requestId_idx" ON "HealthRegulationAttachment"("requestId");

CREATE TABLE IF NOT EXISTS "HealthTfdPassengerRemoval" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "requestedByUsuarioId" TEXT NOT NULL,
    "confirmedByUsuarioId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthTfdPassengerRemoval_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthTfdPassengerRemoval_passengerId_key" ON "HealthTfdPassengerRemoval"("passengerId");

ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "sectorId" TEXT;
ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "protocolNumber" TEXT;
ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "validationCode" TEXT;
ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "cidReferenceId" TEXT;
ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "patientCondition" TEXT;
ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "executorNotes" TEXT;
ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "transportNotes" TEXT;
ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "isExternal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "observations" TEXT;
ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "preparation" TEXT;
ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;
ALTER TABLE "HealthRegulationRequest" ADD COLUMN IF NOT EXISTS "feedback" TEXT;
ALTER TABLE "HealthRegulationQuota" ADD COLUMN IF NOT EXISTS "convenioId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "HealthRegulationRequest_protocolNumber_key" ON "HealthRegulationRequest"("protocolNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "HealthRegulationRequest_validationCode_key" ON "HealthRegulationRequest"("validationCode");
CREATE INDEX IF NOT EXISTS "HealthRegulationRequest_sectorId_status_idx" ON "HealthRegulationRequest"("sectorId", "status");

DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "HealthRegulationSector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_cidReferenceId_fkey" FOREIGN KEY ("cidReferenceId") REFERENCES "HealthSusReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationAttachment" ADD CONSTRAINT "HealthRegulationAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HealthRegulationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationAttachment" ADD CONSTRAINT "HealthRegulationAttachment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "Covenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthTfdPassengerRemoval" ADD CONSTRAINT "HealthTfdPassengerRemoval_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "HealthTfdPassenger"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
