-- Additive CLC-024 persistence. A planning record describes a future need only;
-- it has no link that can create a process, reservation, commitment, or payment.
CREATE TABLE "PurchasePlanning" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "catalogItemId" TEXT,
    "originPurchaseRequestId" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "expectedPeriodStart" DATE NOT NULL,
    "expectedPeriodEnd" DATE NOT NULL,
    "estimatedValueDecimal" DECIMAL(18, 2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PurchasePlanning_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PurchasePlanning_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "PurchasePlanning_estimatedValueDecimal_check" CHECK ("estimatedValueDecimal" >= 0),
    CONSTRAINT "PurchasePlanning_expectedPeriod_check" CHECK ("expectedPeriodEnd" >= "expectedPeriodStart")
);

CREATE INDEX "PurchasePlanning_status_expectedPeriodStart_idx"
  ON "PurchasePlanning"("status", "expectedPeriodStart");
CREATE INDEX "PurchasePlanning_catalogItemId_idx"
  ON "PurchasePlanning"("catalogItemId");
CREATE INDEX "PurchasePlanning_originPurchaseRequestId_idx"
  ON "PurchasePlanning"("originPurchaseRequestId");

ALTER TABLE "PurchasePlanning"
  ADD CONSTRAINT "PurchasePlanning_catalogItemId_fkey"
  FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchasePlanning"
  ADD CONSTRAINT "PurchasePlanning_originPurchaseRequestId_fkey"
  FOREIGN KEY ("originPurchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
