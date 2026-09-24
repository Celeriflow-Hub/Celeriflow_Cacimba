ALTER TABLE "Asset" ADD COLUMN "purchaseReceiptItemId" TEXT;

CREATE INDEX "Asset_purchaseReceiptItemId_idx" ON "Asset"("purchaseReceiptItemId");

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_purchaseReceiptItemId_fkey"
  FOREIGN KEY ("purchaseReceiptItemId") REFERENCES "PurchaseReceiptItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
