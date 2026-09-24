CREATE TABLE "MonthlyAccountingCloseEvent" (
    "id" TEXT NOT NULL,
    "monthlyAccountingCloseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "justification" TEXT,
    "pendingSummary" JSONB,
    "closureEvidence" JSONB,
    "requestedByUsuarioId" TEXT NOT NULL,
    "authorizedByUsuarioId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyAccountingCloseEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AnnualAccountingClose"
    ADD COLUMN "preparedByUsuarioId" TEXT,
    ADD COLUMN "preparedAt" TIMESTAMP(3);

CREATE INDEX "MonthlyAccountingCloseEvent_monthlyAccountingCloseId_createdAt_idx"
    ON "MonthlyAccountingCloseEvent"("monthlyAccountingCloseId", "createdAt");
CREATE INDEX "MonthlyAccountingCloseEvent_requestedByUsuarioId_idx"
    ON "MonthlyAccountingCloseEvent"("requestedByUsuarioId");
CREATE INDEX "MonthlyAccountingCloseEvent_authorizedByUsuarioId_idx"
    ON "MonthlyAccountingCloseEvent"("authorizedByUsuarioId");

ALTER TABLE "MonthlyAccountingCloseEvent"
    ADD CONSTRAINT "MonthlyAccountingCloseEvent_monthlyAccountingCloseId_fkey"
    FOREIGN KEY ("monthlyAccountingCloseId") REFERENCES "MonthlyAccountingClose"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MonthlyAccountingCloseEvent"
    ADD CONSTRAINT "MonthlyAccountingCloseEvent_requestedByUsuarioId_fkey"
    FOREIGN KEY ("requestedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonthlyAccountingCloseEvent"
    ADD CONSTRAINT "MonthlyAccountingCloseEvent_authorizedByUsuarioId_fkey"
    FOREIGN KEY ("authorizedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
