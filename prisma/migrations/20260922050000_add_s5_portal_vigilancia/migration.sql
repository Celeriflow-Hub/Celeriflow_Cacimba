-- S5: vínculo Portal do Paciente/Prestador + Vigilância em Saúde

ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "usuarioId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_usuarioId_key" ON "Patient"("usuarioId");

CREATE TABLE IF NOT EXISTS "HealthProviderAccess" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthProviderAccess_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthProviderAccess_supplierId_usuarioId_key" ON "HealthProviderAccess"("supplierId", "usuarioId");
CREATE INDEX IF NOT EXISTS "HealthProviderAccess_usuarioId_isActive_idx" ON "HealthProviderAccess"("usuarioId", "isActive");

CREATE TABLE IF NOT EXISTS "HealthVigilanceEstablishment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "companyId" TEXT,
    "personId" TEXT,
    "addressId" TEXT,
    "cnae" TEXT,
    "activity" TEXT,
    "riskLevel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthVigilanceEstablishment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthVigilanceEstablishment_status_idx" ON "HealthVigilanceEstablishment"("status");
CREATE INDEX IF NOT EXISTS "HealthVigilanceEstablishment_cnae_idx" ON "HealthVigilanceEstablishment"("cnae");

CREATE TABLE IF NOT EXISTS "HealthVigilanceComplaint" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT,
    "place" TEXT,
    "description" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "reporterPersonId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Recebida',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthVigilanceComplaint_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthVigilanceComplaint_status_createdAt_idx" ON "HealthVigilanceComplaint"("status", "createdAt");

CREATE TABLE IF NOT EXISTS "HealthVigilanceInspection" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "complaintId" TEXT,
    "professionalId" TEXT,
    "inspectedAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "findings" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Agendada',
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthVigilanceInspection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthVigilanceInspection_establishmentId_inspectedAt_idx" ON "HealthVigilanceInspection"("establishmentId", "inspectedAt");
CREATE INDEX IF NOT EXISTS "HealthVigilanceInspection_status_idx" ON "HealthVigilanceInspection"("status");

CREATE TABLE IF NOT EXISTS "HealthVigilanceInspectionItem" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'Não avaliado',
    "notes" TEXT,
    CONSTRAINT "HealthVigilanceInspectionItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HealthVigilanceLicense" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Válido',
    "documentId" TEXT,
    "issuedByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthVigilanceLicense_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HealthVigilanceLicense_licenseNumber_key" ON "HealthVigilanceLicense"("licenseNumber");
CREATE INDEX IF NOT EXISTS "HealthVigilanceLicense_status_validUntil_idx" ON "HealthVigilanceLicense"("status", "validUntil");

DO $$ BEGIN
  ALTER TABLE "Patient" ADD CONSTRAINT "Patient_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthProviderAccess" ADD CONSTRAINT "HealthProviderAccess_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthProviderAccess" ADD CONSTRAINT "HealthProviderAccess_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthVigilanceEstablishment" ADD CONSTRAINT "HealthVigilanceEstablishment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthVigilanceEstablishment" ADD CONSTRAINT "HealthVigilanceEstablishment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthVigilanceEstablishment" ADD CONSTRAINT "HealthVigilanceEstablishment_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthVigilanceComplaint" ADD CONSTRAINT "HealthVigilanceComplaint_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "HealthVigilanceEstablishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthVigilanceComplaint" ADD CONSTRAINT "HealthVigilanceComplaint_reporterPersonId_fkey" FOREIGN KEY ("reporterPersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthVigilanceInspection" ADD CONSTRAINT "HealthVigilanceInspection_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "HealthVigilanceEstablishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthVigilanceInspection" ADD CONSTRAINT "HealthVigilanceInspection_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "HealthVigilanceComplaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthVigilanceInspection" ADD CONSTRAINT "HealthVigilanceInspection_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthVigilanceInspectionItem" ADD CONSTRAINT "HealthVigilanceInspectionItem_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "HealthVigilanceInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthVigilanceLicense" ADD CONSTRAINT "HealthVigilanceLicense_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "HealthVigilanceEstablishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthVigilanceLicense" ADD CONSTRAINT "HealthVigilanceLicense_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
