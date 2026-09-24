-- Preserve the operational reason and instant of a cancellation without changing legacy appointments.
ALTER TABLE "HealthAppointment"
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "cancellationReason" TEXT;

CREATE INDEX "HealthAppointment_unitId_date_idx" ON "HealthAppointment"("unitId", "date");
CREATE INDEX "HealthAppointment_professionalId_date_idx" ON "HealthAppointment"("professionalId", "date");
CREATE INDEX "HealthAppointment_patientId_date_idx" ON "HealthAppointment"("patientId", "date");

-- Do not silently detach clinical and administrative references when a parent is deleted.
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_referenceUnitId_fkey";
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_referenceUnitId_fkey" FOREIGN KEY ("referenceUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Patient" DROP CONSTRAINT "Patient_teamId_fkey";
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HealthProfessional" DROP CONSTRAINT "HealthProfessional_unitId_fkey";
ALTER TABLE "HealthProfessional" ADD CONSTRAINT "HealthProfessional_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HealthProfessional" DROP CONSTRAINT "HealthProfessional_teamId_fkey";
ALTER TABLE "HealthProfessional" ADD CONSTRAINT "HealthProfessional_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HealthAppointment" DROP CONSTRAINT "HealthAppointment_professionalId_fkey";
ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MedicalRecord" DROP CONSTRAINT "MedicalRecord_appointmentId_fkey";
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "HealthAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
