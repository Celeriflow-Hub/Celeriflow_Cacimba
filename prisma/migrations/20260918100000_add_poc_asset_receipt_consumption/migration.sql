-- Keeps receipt eligibility and the free-stock position consistent when a unit
-- is incorporated as an asset. Existing assets are backfilled before new
-- conditional increments are used by the application.
ALTER TABLE "PurchaseReceiptItem"
  ADD COLUMN "quantityIncorporated" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "PurchaseReceiptItem" AS receipt
SET "quantityIncorporated" = (
  SELECT COUNT(*)::DOUBLE PRECISION
  FROM "Asset" AS asset
  WHERE asset."purchaseReceiptItemId" = receipt."id"
);

ALTER TABLE "Asset"
  ADD COLUMN "stockMovementId" TEXT;

CREATE UNIQUE INDEX "Asset_stockMovementId_key" ON "Asset"("stockMovementId");

ALTER TABLE "Asset"
  ADD CONSTRAINT "Asset_stockMovementId_fkey"
  FOREIGN KEY ("stockMovementId") REFERENCES "MaterialMovement"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MaterialRequest"
  ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "MaterialRequest_idempotencyKey_key" ON "MaterialRequest"("idempotencyKey");
