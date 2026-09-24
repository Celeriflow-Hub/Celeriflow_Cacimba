CREATE TYPE "RevenueStage" AS ENUM ('LANCADA', 'ARRECADADA', 'ESTORNADA');
CREATE TYPE "RevenueClassification" AS ENUM ('ORCAMENTARIA', 'INTRAORCAMENTARIA', 'REDUTORA');

ALTER TABLE "Revenue"
    ADD COLUMN "stage" "RevenueStage" NOT NULL DEFAULT 'ARRECADADA',
    ADD COLUMN "classification" "RevenueClassification" NOT NULL DEFAULT 'ORCAMENTARIA',
    ADD COLUMN "launchDate" TIMESTAMP(3),
    ADD COLUMN "collectionDate" TIMESTAMP(3),
    ADD COLUMN "reversedAt" TIMESTAMP(3);

-- Existing records represented confirmed collections before this lifecycle was introduced.
UPDATE "Revenue"
SET "collectionDate" = "date"
WHERE "collectionDate" IS NULL;

CREATE INDEX "Revenue_financialYearId_stage_date_idx" ON "Revenue"("financialYearId", "stage", "date");
CREATE INDEX "Revenue_resourceSourceId_stage_idx" ON "Revenue"("resourceSourceId", "stage");

CREATE TABLE "RevenueReversal" (
    "id" TEXT NOT NULL,
    "revenueId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "justification" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "treasuryMovementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueReversal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RevenueReversal_revenueId_key" ON "RevenueReversal"("revenueId");
CREATE UNIQUE INDEX "RevenueReversal_treasuryMovementId_key" ON "RevenueReversal"("treasuryMovementId");
CREATE INDEX "RevenueReversal_financialYearId_date_idx" ON "RevenueReversal"("financialYearId", "date");

CREATE TABLE "RevenueResourceRedistribution" (
    "id" TEXT NOT NULL,
    "revenueId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "sourceResourceSourceId" TEXT NOT NULL,
    "destinationResourceSourceId" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "history" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueResourceRedistribution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RevenueResourceRedistribution_idempotencyKey_key" ON "RevenueResourceRedistribution"("idempotencyKey");
CREATE INDEX "RevenueResourceRedistribution_revenueId_date_idx" ON "RevenueResourceRedistribution"("revenueId", "date");
CREATE INDEX "RevenueResourceRedistribution_sourceResourceSourceId_destinationResourceSourceId_idx" ON "RevenueResourceRedistribution"("sourceResourceSourceId", "destinationResourceSourceId");

ALTER TABLE "RevenueReversal"
    ADD CONSTRAINT "RevenueReversal_revenueId_fkey"
        FOREIGN KEY ("revenueId") REFERENCES "Revenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "RevenueReversal_financialYearId_fkey"
        FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "RevenueReversal_treasuryMovementId_fkey"
        FOREIGN KEY ("treasuryMovementId") REFERENCES "TreasuryMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RevenueResourceRedistribution"
    ADD CONSTRAINT "RevenueResourceRedistribution_revenueId_fkey"
        FOREIGN KEY ("revenueId") REFERENCES "Revenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "RevenueResourceRedistribution_sourceResourceSourceId_fkey"
        FOREIGN KEY ("sourceResourceSourceId") REFERENCES "ResourceSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "RevenueResourceRedistribution_destinationResourceSourceId_fkey"
        FOREIGN KEY ("destinationResourceSourceId") REFERENCES "ResourceSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "RevenueResourceRedistribution_financialYearId_fkey"
        FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
