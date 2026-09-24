CREATE TABLE "AssetValueAdjustment" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "openingValue" DOUBLE PRECISION NOT NULL,
  "adjustmentValue" DOUBLE PRECISION NOT NULL,
  "closingValue" DOUBLE PRECISION NOT NULL,
  "justification" TEXT NOT NULL,
  "evidence" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssetValueAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssetIntegrationPendingConfiguration" (
  "id" TEXT NOT NULL,
  "assetWriteOffId" TEXT NOT NULL,
  "expectedEventCode" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_CONFIGURATION',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssetIntegrationPendingConfiguration_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AssetWriteOff" ADD COLUMN "accountingTransactionId" TEXT;
ALTER TABLE "MaterialMovement" ADD COLUMN "settlementId" TEXT;

CREATE UNIQUE INDEX "AssetWriteOff_accountingTransactionId_key" ON "AssetWriteOff"("accountingTransactionId");
CREATE UNIQUE INDEX "AssetIntegrationPendingConfiguration_assetWriteOffId_key" ON "AssetIntegrationPendingConfiguration"("assetWriteOffId");
CREATE INDEX "AssetValueAdjustment_assetId_date_idx" ON "AssetValueAdjustment"("assetId", "date");
CREATE INDEX "MaterialMovement_settlementId_idx" ON "MaterialMovement"("settlementId");

ALTER TABLE "AssetValueAdjustment" ADD CONSTRAINT "AssetValueAdjustment_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssetIntegrationPendingConfiguration" ADD CONSTRAINT "AssetIntegrationPendingConfiguration_assetWriteOffId_fkey"
  FOREIGN KEY ("assetWriteOffId") REFERENCES "AssetWriteOff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssetWriteOff" ADD CONSTRAINT "AssetWriteOff_accountingTransactionId_fkey"
  FOREIGN KEY ("accountingTransactionId") REFERENCES "AccountingTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_settlementId_fkey"
  FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
