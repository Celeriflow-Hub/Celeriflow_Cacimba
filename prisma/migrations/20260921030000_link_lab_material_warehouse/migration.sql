ALTER TABLE "HealthLabExamMaterial" ADD COLUMN "warehouseId" TEXT;
ALTER TABLE "HealthLabExamMaterial" ADD CONSTRAINT "HealthLabExamMaterial_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
