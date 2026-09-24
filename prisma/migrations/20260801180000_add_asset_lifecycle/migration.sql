CREATE TABLE "AssetValueHistory" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "referenceMonth" TIMESTAMP(3) NOT NULL,
  "openingValue" DOUBLE PRECISION NOT NULL,
  "depreciation" DOUBLE PRECISION NOT NULL,
  "closingValue" DOUBLE PRECISION NOT NULL,
  "lifeSpanMonths" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AssetValueHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AssetWriteOff"
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'Baixa',
  ADD COLUMN "disposalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "bookValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "gainLoss" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "AssetValueHistory_assetId_referenceMonth_key" ON "AssetValueHistory"("assetId", "referenceMonth");
CREATE INDEX "AssetValueHistory_referenceMonth_idx" ON "AssetValueHistory"("referenceMonth");

ALTER TABLE "AssetValueHistory"
  ADD CONSTRAINT "AssetValueHistory_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
