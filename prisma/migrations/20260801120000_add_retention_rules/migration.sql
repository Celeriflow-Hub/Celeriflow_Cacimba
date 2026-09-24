CREATE TABLE "RetentionRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "calculationBasePercentage" DECIMAL(7,4) NOT NULL,
    "ratePercentage" DECIMAL(7,4) NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "beneficiaryDocument" TEXT,
    "serviceCode" TEXT,
    "financialYearId" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "dueDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RetentionRule_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PaymentRetention" ADD COLUMN "retentionRuleId" TEXT;

CREATE UNIQUE INDEX "RetentionRule_code_key" ON "RetentionRule"("code");
CREATE INDEX "RetentionRule_isActive_effectiveFrom_effectiveTo_idx" ON "RetentionRule"("isActive", "effectiveFrom", "effectiveTo");
CREATE INDEX "RetentionRule_financialYearId_serviceCode_idx" ON "RetentionRule"("financialYearId", "serviceCode");
CREATE INDEX "PaymentRetention_retentionRuleId_idx" ON "PaymentRetention"("retentionRuleId");

ALTER TABLE "RetentionRule" ADD CONSTRAINT "RetentionRule_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentRetention" ADD CONSTRAINT "PaymentRetention_retentionRuleId_fkey" FOREIGN KEY ("retentionRuleId") REFERENCES "RetentionRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
