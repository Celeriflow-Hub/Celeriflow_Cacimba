-- RAP is an internal control workflow. It intentionally does not create financial or accounting entries.
ALTER TABLE "PayableCarryForward"
    ADD COLUMN "originFinancialYearId" TEXT,
    ADD COLUMN "previousPayableCarryForwardId" TEXT;

UPDATE "PayableCarryForward"
SET "originFinancialYearId" = "financialYearId"
WHERE "originFinancialYearId" IS NULL;

ALTER TABLE "PayableCarryForward"
    ALTER COLUMN "originFinancialYearId" SET NOT NULL;

ALTER TABLE "PayableCarryForward"
    DROP CONSTRAINT IF EXISTS "PayableCarryForward_financialYearId_commitmentId_key";

ALTER TABLE "PayableCarryForward"
    ADD CONSTRAINT "PayableCarryForward_financialYearId_commitmentId_type_key"
        UNIQUE ("financialYearId", "commitmentId", "type"),
    ADD CONSTRAINT "PayableCarryForward_previousPayableCarryForwardId_key"
        UNIQUE ("previousPayableCarryForwardId"),
    ADD CONSTRAINT "PayableCarryForward_originFinancialYearId_fkey"
        FOREIGN KEY ("originFinancialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "PayableCarryForward_previousPayableCarryForwardId_fkey"
        FOREIGN KEY ("previousPayableCarryForwardId") REFERENCES "PayableCarryForward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PayableCarryForward_originFinancialYearId_type_idx"
    ON "PayableCarryForward"("originFinancialYearId", "type");

CREATE TABLE "PayableCarryForwardEvent" (
    "id" TEXT NOT NULL,
    "payableCarryForwardId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "justification" TEXT,
    "valueDecimal" DECIMAL(18,2),
    "paymentId" TEXT,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayableCarryForwardEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayableCarryForwardEvent_paymentId_key"
    ON "PayableCarryForwardEvent"("paymentId");
CREATE INDEX "PayableCarryForwardEvent_payableCarryForwardId_createdAt_idx"
    ON "PayableCarryForwardEvent"("payableCarryForwardId", "createdAt");
CREATE INDEX "PayableCarryForwardEvent_actorUsuarioId_idx"
    ON "PayableCarryForwardEvent"("actorUsuarioId");

ALTER TABLE "PayableCarryForwardEvent"
    ADD CONSTRAINT "PayableCarryForwardEvent_payableCarryForwardId_fkey"
        FOREIGN KEY ("payableCarryForwardId") REFERENCES "PayableCarryForward"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "PayableCarryForwardEvent_paymentId_fkey"
        FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "PayableCarryForwardEvent_actorUsuarioId_fkey"
        FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
