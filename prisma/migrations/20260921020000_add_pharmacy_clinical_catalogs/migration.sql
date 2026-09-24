CREATE TABLE "MedicineInteraction" (
  "id" TEXT PRIMARY KEY,
  "originMedicineId" TEXT NOT NULL,
  "targetMedicineId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" TEXT,
  "source" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "MedicineDosageTemplate" (
  "id" TEXT PRIMARY KEY,
  "medicineId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dose" TEXT NOT NULL,
  "route" TEXT,
  "frequency" TEXT NOT NULL,
  "duration" TEXT,
  "instructions" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "MedicineInteraction_originMedicineId_targetMedicineId_key" ON "MedicineInteraction"("originMedicineId", "targetMedicineId");
CREATE UNIQUE INDEX "MedicineDosageTemplate_medicineId_name_key" ON "MedicineDosageTemplate"("medicineId", "name");
ALTER TABLE "MedicineInteraction" ADD CONSTRAINT "MedicineInteraction_originMedicineId_fkey" FOREIGN KEY ("originMedicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicineInteraction" ADD CONSTRAINT "MedicineInteraction_targetMedicineId_fkey" FOREIGN KEY ("targetMedicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicineDosageTemplate" ADD CONSTRAINT "MedicineDosageTemplate_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
