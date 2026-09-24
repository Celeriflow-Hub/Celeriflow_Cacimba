-- CreateTable
CREATE TABLE "TaxCollectionProfile" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCollectionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCollectionPortfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileId" TEXT,
    "selectionMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "selectionSnapshot" JSONB NOT NULL,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCollectionPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCollectionPortfolioItem" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "originalDecimal" DECIMAL(18,2) NOT NULL,
    "outstandingDecimal" DECIMAL(18,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCollectionPortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCollectionRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileCode" TEXT,
    "steps" JSONB NOT NULL,
    "allowedChannels" JSONB NOT NULL,
    "allowedModalities" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCollectionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCollectionAction" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "portfolioItemId" TEXT,
    "taxpayerId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "performedAt" TIMESTAMP(3),
    "resultCode" TEXT,
    "resultDescription" TEXT,
    "nextActionAt" TIMESTAMP(3),
    "evidenceDocumentId" TEXT,
    "dteMessageId" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCollectionAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCollectionActionEvent" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCollectionActionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalReference" TEXT NOT NULL,
    "minInstallments" INTEGER NOT NULL DEFAULT 1,
    "maxInstallments" INTEGER NOT NULL,
    "minQuotaDecimal" DECIMAL(18,2) NOT NULL,
    "discountConfiguration" JSONB NOT NULL,
    "feeConfiguration" JSONB NOT NULL,
    "breakConfiguration" JSONB NOT NULL,
    "dueDayOptions" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInstallmentRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentAgreement" (
    "id" TEXT NOT NULL,
    "agreementNumber" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "parentAgreementId" TEXT,
    "agreementType" TEXT NOT NULL DEFAULT 'ORIGINAL',
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "installmentCount" INTEGER NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "originalDebtDecimal" DECIMAL(18,2) NOT NULL,
    "discountDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "feesDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalAgreementDecimal" DECIMAL(18,2) NOT NULL,
    "paidDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "balanceDecimal" DECIMAL(18,2) NOT NULL,
    "simulationSnapshot" JSONB NOT NULL,
    "termDocumentId" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "adheredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brokenAt" TIMESTAMP(3),
    "reactivatedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInstallmentAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentDebt" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "originLabel" TEXT NOT NULL,
    "originalAmountDecimal" DECIMAL(18,2) NOT NULL,
    "revisedAmountDecimal" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxInstallmentDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentQuota" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "quotaNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "originalDecimal" DECIMAL(18,2) NOT NULL,
    "paidDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "balanceDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "guideId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInstallmentQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentPaymentAllocation" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "quotaId" TEXT NOT NULL,
    "paymentKey" TEXT NOT NULL,
    "amountDecimal" DECIMAL(18,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMode" TEXT NOT NULL DEFAULT 'FORA_DA_PARCELA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxInstallmentPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentEvent" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxInstallmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxpayerPortalAccess" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "accessType" TEXT NOT NULL DEFAULT 'TITULAR',
    "scopes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "grantedByUsuarioId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "TaxpayerPortalAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxBenefitRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "benefitType" TEXT NOT NULL,
    "legalReference" TEXT NOT NULL,
    "eligibility" JSONB NOT NULL,
    "calculation" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxBenefitRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxBenefitGrant" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "originalAmountDecimal" DECIMAL(18,2) NOT NULL,
    "creditDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "reductionDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "renunciationDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "finalAmountDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONCEDIDO',
    "calculationSnapshot" JSONB NOT NULL,
    "grantedByUsuarioId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxBenefitGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPrizeDraw" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "drawNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "eligibilityRules" JSONB NOT NULL,
    "requiresPayment" BOOLEAN NOT NULL DEFAULT false,
    "taxpayerTypes" JSONB NOT NULL,
    "winnerCount" INTEGER NOT NULL DEFAULT 1,
    "technicalSeed" TEXT NOT NULL,
    "officialActReference" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxPrizeDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPrizeCoupon" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "couponNumber" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "sourceDocumentType" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "eligibilitySnapshot" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ELEGIVEL',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxPrizeCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPrizeExecution" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "executionNumber" INTEGER NOT NULL,
    "algorithm" TEXT NOT NULL,
    "seedHash" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "resultHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONCLUIDA',
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedByUsuarioId" TEXT NOT NULL,

    CONSTRAINT "TaxPrizeExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPrizeWinner" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "resultKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxPrizeWinner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxCollectionProfile_code_key" ON "TaxCollectionProfile"("code");

-- CreateIndex
CREATE INDEX "TaxCollectionPortfolio_profileId_status_idx" ON "TaxCollectionPortfolio"("profileId", "status");

-- CreateIndex
CREATE INDEX "TaxCollectionPortfolioItem_taxpayerId_status_idx" ON "TaxCollectionPortfolioItem"("taxpayerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCollectionPortfolioItem_portfolioId_sourceType_sourceId_key" ON "TaxCollectionPortfolioItem"("portfolioId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "TaxCollectionRule_active_effectiveFrom_idx" ON "TaxCollectionRule"("active", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCollectionRule_code_effectiveFrom_key" ON "TaxCollectionRule"("code", "effectiveFrom");

-- CreateIndex
CREATE INDEX "TaxCollectionAction_portfolioId_scheduledAt_status_idx" ON "TaxCollectionAction"("portfolioId", "scheduledAt", "status");

-- CreateIndex
CREATE INDEX "TaxCollectionAction_taxpayerId_createdAt_idx" ON "TaxCollectionAction"("taxpayerId", "createdAt");

-- CreateIndex
CREATE INDEX "TaxCollectionActionEvent_actionId_createdAt_idx" ON "TaxCollectionActionEvent"("actionId", "createdAt");

-- CreateIndex
CREATE INDEX "TaxInstallmentRule_active_effectiveFrom_idx" ON "TaxInstallmentRule"("active", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInstallmentRule_code_effectiveFrom_key" ON "TaxInstallmentRule"("code", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInstallmentAgreement_agreementNumber_key" ON "TaxInstallmentAgreement"("agreementNumber");

-- CreateIndex
CREATE INDEX "TaxInstallmentAgreement_taxpayerId_status_idx" ON "TaxInstallmentAgreement"("taxpayerId", "status");

-- CreateIndex
CREATE INDEX "TaxInstallmentAgreement_parentAgreementId_idx" ON "TaxInstallmentAgreement"("parentAgreementId");

-- CreateIndex
CREATE INDEX "TaxInstallmentDebt_sourceType_sourceId_idx" ON "TaxInstallmentDebt"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInstallmentDebt_agreementId_sourceType_sourceId_key" ON "TaxInstallmentDebt"("agreementId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "TaxInstallmentQuota_dueDate_status_idx" ON "TaxInstallmentQuota"("dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInstallmentQuota_agreementId_quotaNumber_key" ON "TaxInstallmentQuota"("agreementId", "quotaNumber");

-- CreateIndex
CREATE INDEX "TaxInstallmentPaymentAllocation_agreementId_paymentDate_idx" ON "TaxInstallmentPaymentAllocation"("agreementId", "paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInstallmentPaymentAllocation_paymentKey_quotaId_key" ON "TaxInstallmentPaymentAllocation"("paymentKey", "quotaId");

-- CreateIndex
CREATE INDEX "TaxInstallmentEvent_agreementId_createdAt_idx" ON "TaxInstallmentEvent"("agreementId", "createdAt");

-- CreateIndex
CREATE INDEX "TaxpayerPortalAccess_taxpayerId_status_idx" ON "TaxpayerPortalAccess"("taxpayerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxpayerPortalAccess_usuarioId_taxpayerId_key" ON "TaxpayerPortalAccess"("usuarioId", "taxpayerId");

-- CreateIndex
CREATE INDEX "TaxBenefitRule_active_effectiveFrom_idx" ON "TaxBenefitRule"("active", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaxBenefitRule_code_effectiveFrom_key" ON "TaxBenefitRule"("code", "effectiveFrom");

-- CreateIndex
CREATE INDEX "TaxBenefitGrant_taxpayerId_status_idx" ON "TaxBenefitGrant"("taxpayerId", "status");

-- CreateIndex
CREATE INDEX "TaxBenefitGrant_grantedAt_idx" ON "TaxBenefitGrant"("grantedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaxBenefitGrant_ruleId_taxpayerId_sourceType_sourceId_key" ON "TaxBenefitGrant"("ruleId", "taxpayerId", "sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeDraw_slug_key" ON "TaxPrizeDraw"("slug");

-- CreateIndex
CREATE INDEX "TaxPrizeDraw_status_scheduledAt_idx" ON "TaxPrizeDraw"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeDraw_year_drawNumber_key" ON "TaxPrizeDraw"("year", "drawNumber");

-- CreateIndex
CREATE INDEX "TaxPrizeCoupon_taxpayerId_status_idx" ON "TaxPrizeCoupon"("taxpayerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeCoupon_drawId_couponNumber_key" ON "TaxPrizeCoupon"("drawId", "couponNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeCoupon_drawId_sourceDocumentType_sourceDocumentId_key" ON "TaxPrizeCoupon"("drawId", "sourceDocumentType", "sourceDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeExecution_drawId_executionNumber_key" ON "TaxPrizeExecution"("drawId", "executionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeWinner_executionId_position_key" ON "TaxPrizeWinner"("executionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeWinner_executionId_couponId_key" ON "TaxPrizeWinner"("executionId", "couponId");

-- AddForeignKey
ALTER TABLE "TaxCollectionPortfolio" ADD CONSTRAINT "TaxCollectionPortfolio_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TaxCollectionProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCollectionPortfolioItem" ADD CONSTRAINT "TaxCollectionPortfolioItem_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "TaxCollectionPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCollectionAction" ADD CONSTRAINT "TaxCollectionAction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "TaxCollectionPortfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCollectionAction" ADD CONSTRAINT "TaxCollectionAction_portfolioItemId_fkey" FOREIGN KEY ("portfolioItemId") REFERENCES "TaxCollectionPortfolioItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCollectionActionEvent" ADD CONSTRAINT "TaxCollectionActionEvent_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "TaxCollectionAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentAgreement" ADD CONSTRAINT "TaxInstallmentAgreement_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "TaxInstallmentRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentDebt" ADD CONSTRAINT "TaxInstallmentDebt_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "TaxInstallmentAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentQuota" ADD CONSTRAINT "TaxInstallmentQuota_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "TaxInstallmentAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentPaymentAllocation" ADD CONSTRAINT "TaxInstallmentPaymentAllocation_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "TaxInstallmentAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentPaymentAllocation" ADD CONSTRAINT "TaxInstallmentPaymentAllocation_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "TaxInstallmentQuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentEvent" ADD CONSTRAINT "TaxInstallmentEvent_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "TaxInstallmentAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxBenefitGrant" ADD CONSTRAINT "TaxBenefitGrant_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "TaxBenefitRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPrizeCoupon" ADD CONSTRAINT "TaxPrizeCoupon_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "TaxPrizeDraw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPrizeExecution" ADD CONSTRAINT "TaxPrizeExecution_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "TaxPrizeDraw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPrizeWinner" ADD CONSTRAINT "TaxPrizeWinner_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "TaxPrizeExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPrizeWinner" ADD CONSTRAINT "TaxPrizeWinner_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "TaxPrizeCoupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
