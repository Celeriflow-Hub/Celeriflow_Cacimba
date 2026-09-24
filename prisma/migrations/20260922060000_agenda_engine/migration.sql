-- Correção final POC B1: motor da Agenda (cronogramas, vagas, espera)

CREATE TABLE IF NOT EXISTS "HealthCareSchedule" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'FIXO',
    "unitId" TEXT NOT NULL,
    "specialtyId" TEXT,
    "professionalId" TEXT,
    "groupId" TEXT,
    "providerSupplierId" TEXT,
    "weekday" INTEGER,
    "date" DATE,
    "startTime" TEXT,
    "endTime" TEXT,
    "totalSlots" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "blockReason" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthCareSchedule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthCareSchedule_unitId_status_idx" ON "HealthCareSchedule"("unitId", "status");
CREATE INDEX IF NOT EXISTS "HealthCareSchedule_professionalId_date_idx" ON "HealthCareSchedule"("professionalId", "date");
CREATE INDEX IF NOT EXISTS "HealthCareSchedule_kind_status_idx" ON "HealthCareSchedule"("kind", "status");

CREATE TABLE IF NOT EXISTS "HealthWaitlist" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "specialtyId" TEXT,
    "scheduleId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'Aguardando',
    "notes" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthWaitlist_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HealthWaitlist_status_priority_createdAt_idx" ON "HealthWaitlist"("status", "priority", "createdAt");
CREATE INDEX IF NOT EXISTS "HealthWaitlist_patientId_status_idx" ON "HealthWaitlist"("patientId", "status");

ALTER TABLE "HealthAppointment" ADD COLUMN IF NOT EXISTS "scheduleId" TEXT;
ALTER TABLE "HealthAppointment" ADD COLUMN IF NOT EXISTS "visitType" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "bloodDonor" BOOLEAN;

DO $$ BEGIN
  ALTER TABLE "HealthCareSchedule" ADD CONSTRAINT "HealthCareSchedule_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthCareSchedule" ADD CONSTRAINT "HealthCareSchedule_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthCareSchedule" ADD CONSTRAINT "HealthCareSchedule_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthCareSchedule" ADD CONSTRAINT "HealthCareSchedule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "HealthSchedulingGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthCareSchedule" ADD CONSTRAINT "HealthCareSchedule_providerSupplierId_fkey" FOREIGN KEY ("providerSupplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthWaitlist" ADD CONSTRAINT "HealthWaitlist_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthWaitlist" ADD CONSTRAINT "HealthWaitlist_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthWaitlist" ADD CONSTRAINT "HealthWaitlist_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "HealthCareSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "HealthCareSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
