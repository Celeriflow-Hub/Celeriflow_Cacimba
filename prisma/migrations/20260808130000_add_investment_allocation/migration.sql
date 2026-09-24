CREATE TABLE "InvestmentAllocation" (
  "id" TEXT NOT NULL,
  "originBankAccountId" TEXT NOT NULL,
  "investmentBankAccountId" TEXT NOT NULL,
  "treasuryTransferId" TEXT,
  "valueDecimal" DECIMAL(18,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ATIVA',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvestmentAllocation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InvestmentAllocation_treasuryTransferId_key" ON "InvestmentAllocation"("treasuryTransferId");
CREATE INDEX "InvestmentAllocation_investmentBankAccountId_originBankAccountId_status_idx" ON "InvestmentAllocation"("investmentBankAccountId", "originBankAccountId", "status");
ALTER TABLE "InvestmentAllocation" ADD CONSTRAINT "InvestmentAllocation_originBankAccountId_fkey" FOREIGN KEY ("originBankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvestmentAllocation" ADD CONSTRAINT "InvestmentAllocation_investmentBankAccountId_fkey" FOREIGN KEY ("investmentBankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvestmentAllocation" ADD CONSTRAINT "InvestmentAllocation_treasuryTransferId_fkey" FOREIGN KEY ("treasuryTransferId") REFERENCES "TreasuryTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
