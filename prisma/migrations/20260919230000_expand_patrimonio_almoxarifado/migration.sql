CREATE TABLE "CostCenter" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Warehouse"
  ADD COLUMN "zipCode" TEXT,
  ADD COLUMN "streetName" TEXT,
  ADD COLUMN "number" TEXT,
  ADD COLUMN "neighborhood" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "costCenterId" TEXT;

ALTER TABLE "Material"
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'MATERIAL',
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "PurchaseReceiptItem"
  ADD COLUMN "brand" TEXT,
  ADD COLUMN "model" TEXT,
  ADD COLUMN "serialNumber" TEXT;

CREATE UNIQUE INDEX "CostCenter_code_key" ON "CostCenter"("code");
CREATE INDEX "Warehouse_costCenterId_idx" ON "Warehouse"("costCenterId");

ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_costCenterId_fkey"
  FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
