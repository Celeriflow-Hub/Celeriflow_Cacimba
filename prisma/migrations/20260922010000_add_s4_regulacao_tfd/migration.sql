-- S4-A/B: Regulacao, Cotas, TFD e Transporte

CREATE TABLE IF NOT EXISTS "HealthRegulationQuota" (
    "id" TEXT NOT NULL,
    "providerSupplierId" TEXT NOT NULL,
    "unitId" TEXT,
    "specialtyId" TEXT,
    "serviceId" TEXT,
    "procedureId" TEXT,
    "period" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "realizedQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitValue" DECIMAL(14,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthRegulationQuota_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HealthRegulationRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestUnitId" TEXT,
    "professionalId" TEXT,
    "specialtyId" TEXT,
    "serviceId" TEXT,
    "procedureId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'RECEBIDA',
    "origin" TEXT NOT NULL DEFAULT 'DIRECT',
    "referralId" TEXT,
    "examRequestId" TEXT,
    "description" TEXT,
    "quotaId" TEXT,
    "guideNumber" TEXT,
    "guideIssuedAt" TIMESTAMP(3),
    "guideDocumentId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthRegulationRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HealthRegulationEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "notes" TEXT,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthRegulationEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HealthTfdRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "regulationRequestId" TEXT,
    "originUnitId" TEXT,
    "destination" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'SOLICITADA',
    "companionName" TEXT,
    "companionDocument" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthTfdRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HealthTfdTrip" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "fleetUnitId" TEXT NOT NULL,
    "driverEmployeeId" TEXT,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "departureAt" TIMESTAMP(3),
    "returnAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthTfdTrip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HealthTfdPassenger" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "tfdRequestId" TEXT,
    "companionName" TEXT,
    "companionDocument" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'PACIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthTfdPassenger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "HealthRegulationQuota_providerSupplierId_period_idx" ON "HealthRegulationQuota"("providerSupplierId", "period");
CREATE INDEX IF NOT EXISTS "HealthRegulationQuota_unitId_period_idx" ON "HealthRegulationQuota"("unitId", "period");
CREATE INDEX IF NOT EXISTS "HealthRegulationQuota_period_isActive_idx" ON "HealthRegulationQuota"("period", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "HealthRegulationRequest_referralId_key" ON "HealthRegulationRequest"("referralId");
CREATE UNIQUE INDEX IF NOT EXISTS "HealthRegulationRequest_examRequestId_key" ON "HealthRegulationRequest"("examRequestId");
CREATE UNIQUE INDEX IF NOT EXISTS "HealthRegulationRequest_guideNumber_key" ON "HealthRegulationRequest"("guideNumber");
CREATE INDEX IF NOT EXISTS "HealthRegulationRequest_status_priority_createdAt_idx" ON "HealthRegulationRequest"("status", "priority", "createdAt");
CREATE INDEX IF NOT EXISTS "HealthRegulationRequest_patientId_status_idx" ON "HealthRegulationRequest"("patientId", "status");
CREATE INDEX IF NOT EXISTS "HealthRegulationRequest_requestUnitId_status_idx" ON "HealthRegulationRequest"("requestUnitId", "status");
CREATE INDEX IF NOT EXISTS "HealthRegulationRequest_quotaId_idx" ON "HealthRegulationRequest"("quotaId");
CREATE INDEX IF NOT EXISTS "HealthRegulationEvent_requestId_createdAt_idx" ON "HealthRegulationEvent"("requestId", "createdAt");
CREATE INDEX IF NOT EXISTS "HealthTfdRequest_status_createdAt_idx" ON "HealthTfdRequest"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "HealthTfdRequest_patientId_status_idx" ON "HealthTfdRequest"("patientId", "status");
CREATE INDEX IF NOT EXISTS "HealthTfdTrip_date_status_idx" ON "HealthTfdTrip"("date", "status");
CREATE INDEX IF NOT EXISTS "HealthTfdTrip_fleetUnitId_date_idx" ON "HealthTfdTrip"("fleetUnitId", "date");
CREATE INDEX IF NOT EXISTS "HealthTfdPassenger_patientId_idx" ON "HealthTfdPassenger"("patientId");
CREATE UNIQUE INDEX IF NOT EXISTS "HealthTfdPassenger_tripId_patientId_kind_key" ON "HealthTfdPassenger"("tripId", "patientId", "kind");

DO $$ BEGIN
  ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_providerSupplierId_fkey" FOREIGN KEY ("providerSupplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_requestUnitId_fkey" FOREIGN KEY ("requestUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "HealthReferral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_examRequestId_fkey" FOREIGN KEY ("examRequestId") REFERENCES "HealthExamRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "HealthRegulationQuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_guideDocumentId_fkey" FOREIGN KEY ("guideDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthRegulationEvent" ADD CONSTRAINT "HealthRegulationEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HealthRegulationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthTfdRequest" ADD CONSTRAINT "HealthTfdRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthTfdRequest" ADD CONSTRAINT "HealthTfdRequest_regulationRequestId_fkey" FOREIGN KEY ("regulationRequestId") REFERENCES "HealthRegulationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthTfdRequest" ADD CONSTRAINT "HealthTfdRequest_originUnitId_fkey" FOREIGN KEY ("originUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthTfdTrip" ADD CONSTRAINT "HealthTfdTrip_fleetUnitId_fkey" FOREIGN KEY ("fleetUnitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthTfdTrip" ADD CONSTRAINT "HealthTfdTrip_driverEmployeeId_fkey" FOREIGN KEY ("driverEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthTfdPassenger" ADD CONSTRAINT "HealthTfdPassenger_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "HealthTfdTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthTfdPassenger" ADD CONSTRAINT "HealthTfdPassenger_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "HealthTfdPassenger" ADD CONSTRAINT "HealthTfdPassenger_tfdRequestId_fkey" FOREIGN KEY ("tfdRequestId") REFERENCES "HealthTfdRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
