ALTER TABLE "HealthAppointment"
ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN "confirmedAt" TIMESTAMP(3),
ADD COLUMN "arrivedAt" TIMESTAMP(3),
ADD COLUMN "triagedAt" TIMESTAMP(3),
ADD COLUMN "calledAt" TIMESTAMP(3),
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "arrivalNotes" TEXT,
ADD COLUMN "municipalitySnapshot" TEXT,
ADD COLUMN "stateSnapshot" TEXT,
ADD COLUMN "outcome" TEXT,
ADD COLUMN "sequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "schedulingGroupId" TEXT,
ADD COLUMN "specialtyId" TEXT,
ADD COLUMN "serviceId" TEXT;

ALTER TABLE "MedicalRecord"
ADD COLUMN "respiratoryRate" INTEGER,
ADD COLUMN "oxygenSaturation" DOUBLE PRECISION,
ADD COLUMN "bloodGlucose" DOUBLE PRECISION,
ADD COLUMN "anamnesis" TEXT,
ADD COLUMN "assessment" TEXT,
ADD COLUMN "observations" TEXT,
ADD COLUMN "outcome" TEXT,
ADD COLUMN "completedAt" TIMESTAMP(3);

ALTER TABLE "HealthPrescription"
ADD COLUMN "unitId" TEXT,
ADD COLUMN "medicalRecordId" TEXT;

ALTER TABLE "HealthExamRequest"
ADD COLUMN "unitId" TEXT,
ADD COLUMN "medicalRecordId" TEXT,
ADD COLUMN "procedureId" TEXT,
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'Rotina',
ADD COLUMN "indication" TEXT,
ADD COLUMN "notes" TEXT;

ALTER TABLE "HealthReferral"
ADD COLUMN "medicalRecordId" TEXT,
ADD COLUMN "specialtyId" TEXT,
ADD COLUMN "serviceId" TEXT,
ADD COLUMN "destinationUnitId" TEXT,
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'Normal',
ADD COLUMN "observation" TEXT;

CREATE TABLE "HealthAppointmentEvent" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "notes" TEXT,
  "actorUsuarioId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HealthAppointmentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthTriage" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,
  "chiefComplaint" TEXT NOT NULL,
  "bloodPressure" TEXT,
  "temperature" DOUBLE PRECISION,
  "weight" DOUBLE PRECISION,
  "height" DOUBLE PRECISION,
  "heartRate" INTEGER,
  "respiratoryRate" INTEGER,
  "oxygenSaturation" DOUBLE PRECISION,
  "bloodGlucose" DOUBLE PRECISION,
  "observedConditions" TEXT,
  "riskClassification" TEXT NOT NULL,
  "priorityLabel" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HealthTriage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthClinicalEvolution" (
  "id" TEXT NOT NULL,
  "medicalRecordId" TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HealthClinicalEvolution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthDiagnosis" (
  "id" TEXT NOT NULL,
  "medicalRecordId" TEXT NOT NULL,
  "cidReferenceId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HealthDiagnosis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthPerformedProcedure" (
  "id" TEXT NOT NULL,
  "medicalRecordId" TEXT NOT NULL,
  "procedureId" TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "notes" TEXT,
  "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HealthPerformedProcedure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthClinicalDocument" (
  "id" TEXT NOT NULL,
  "medicalRecordId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "addedByUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HealthClinicalDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthPrescriptionItem" (
  "id" TEXT NOT NULL,
  "prescriptionId" TEXT NOT NULL,
  "medicineId" TEXT,
  "medicineName" TEXT NOT NULL,
  "presentation" TEXT,
  "dose" TEXT NOT NULL,
  "route" TEXT,
  "frequency" TEXT NOT NULL,
  "duration" TEXT,
  "quantity" DOUBLE PRECISION,
  "instructions" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HealthPrescriptionItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HealthAppointment_origin_status_date_idx" ON "HealthAppointment"("origin", "status", "date");
CREATE INDEX "HealthAppointment_schedulingGroupId_date_idx" ON "HealthAppointment"("schedulingGroupId", "date");
CREATE INDEX "HealthAppointment_specialtyId_date_idx" ON "HealthAppointment"("specialtyId", "date");
CREATE INDEX "HealthAppointmentEvent_appointmentId_occurredAt_idx" ON "HealthAppointmentEvent"("appointmentId", "occurredAt");
CREATE INDEX "HealthAppointmentEvent_eventType_occurredAt_idx" ON "HealthAppointmentEvent"("eventType", "occurredAt");
CREATE UNIQUE INDEX "HealthTriage_appointmentId_key" ON "HealthTriage"("appointmentId");
CREATE INDEX "HealthTriage_riskClassification_createdAt_idx" ON "HealthTriage"("riskClassification", "createdAt");
CREATE INDEX "HealthTriage_professionalId_createdAt_idx" ON "HealthTriage"("professionalId", "createdAt");
CREATE INDEX "HealthClinicalEvolution_medicalRecordId_createdAt_idx" ON "HealthClinicalEvolution"("medicalRecordId", "createdAt");
CREATE UNIQUE INDEX "HealthDiagnosis_medicalRecordId_cidReferenceId_key" ON "HealthDiagnosis"("medicalRecordId", "cidReferenceId");
CREATE INDEX "HealthDiagnosis_cidReferenceId_createdAt_idx" ON "HealthDiagnosis"("cidReferenceId", "createdAt");
CREATE INDEX "HealthPerformedProcedure_medicalRecordId_performedAt_idx" ON "HealthPerformedProcedure"("medicalRecordId", "performedAt");
CREATE INDEX "HealthPerformedProcedure_procedureId_performedAt_idx" ON "HealthPerformedProcedure"("procedureId", "performedAt");
CREATE UNIQUE INDEX "HealthClinicalDocument_documentId_key" ON "HealthClinicalDocument"("documentId");
CREATE INDEX "HealthClinicalDocument_medicalRecordId_kind_createdAt_idx" ON "HealthClinicalDocument"("medicalRecordId", "kind", "createdAt");
CREATE INDEX "HealthPrescriptionItem_prescriptionId_idx" ON "HealthPrescriptionItem"("prescriptionId");
CREATE INDEX "HealthPrescriptionItem_medicineId_idx" ON "HealthPrescriptionItem"("medicineId");

ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_schedulingGroupId_fkey" FOREIGN KEY ("schedulingGroupId") REFERENCES "HealthSchedulingGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthAppointmentEvent" ADD CONSTRAINT "HealthAppointmentEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "HealthAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthAppointmentEvent" ADD CONSTRAINT "HealthAppointmentEvent_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthTriage" ADD CONSTRAINT "HealthTriage_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "HealthAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthTriage" ADD CONSTRAINT "HealthTriage_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthClinicalEvolution" ADD CONSTRAINT "HealthClinicalEvolution_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthClinicalEvolution" ADD CONSTRAINT "HealthClinicalEvolution_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthDiagnosis" ADD CONSTRAINT "HealthDiagnosis_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthDiagnosis" ADD CONSTRAINT "HealthDiagnosis_cidReferenceId_fkey" FOREIGN KEY ("cidReferenceId") REFERENCES "HealthSusReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthPerformedProcedure" ADD CONSTRAINT "HealthPerformedProcedure_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthPerformedProcedure" ADD CONSTRAINT "HealthPerformedProcedure_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthPerformedProcedure" ADD CONSTRAINT "HealthPerformedProcedure_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthClinicalDocument" ADD CONSTRAINT "HealthClinicalDocument_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthClinicalDocument" ADD CONSTRAINT "HealthClinicalDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthClinicalDocument" ADD CONSTRAINT "HealthClinicalDocument_addedByUsuarioId_fkey" FOREIGN KEY ("addedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthPrescription" ADD CONSTRAINT "HealthPrescription_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthPrescription" ADD CONSTRAINT "HealthPrescription_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthPrescriptionItem" ADD CONSTRAINT "HealthPrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "HealthPrescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthPrescriptionItem" ADD CONSTRAINT "HealthPrescriptionItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthExamRequest" ADD CONSTRAINT "HealthExamRequest_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthExamRequest" ADD CONSTRAINT "HealthExamRequest_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthExamRequest" ADD CONSTRAINT "HealthExamRequest_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthReferral" ADD CONSTRAINT "HealthReferral_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthReferral" ADD CONSTRAINT "HealthReferral_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthReferral" ADD CONSTRAINT "HealthReferral_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthReferral" ADD CONSTRAINT "HealthReferral_destinationUnitId_fkey" FOREIGN KEY ("destinationUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
