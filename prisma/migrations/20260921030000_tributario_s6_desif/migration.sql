-- CreateTable
CREATE TABLE "DesifFinancialInstitution" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT,
    "name" TEXT NOT NULL,
    "baseCnpj" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifFinancialInstitution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifAgency" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "economicRegistrationId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullCnpj" TEXT NOT NULL,
    "municipalRegistration" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifAgency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifCosifAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "nature" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifCosifAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPgccPlan" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "source" TEXT NOT NULL DEFAULT 'INSTITUICAO',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifPgccPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPgccAccount" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "desifTaxCode" TEXT,
    "serviceItem" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifPgccAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPgccCosifLink" (
    "id" TEXT NOT NULL,
    "pgccAccountId" TEXT NOT NULL,
    "cosifAccountId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesifPgccCosifLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifSubtitle" (
    "id" TEXT NOT NULL,
    "pgccAccountId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceItem" TEXT,
    "taxRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifSubtitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifTariff" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amountDecimal" DECIMAL(18,2) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifTariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPackage" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "tariffId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesifPackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifImportBatch" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "agencyId" TEXT,
    "competence" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "abrasfVersion" TEXT NOT NULL,
    "originMode" TEXT NOT NULL DEFAULT 'CONTROLLED_INTERNAL',
    "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "signaturePolicy" TEXT NOT NULL DEFAULT 'NAO_CONFIGURADA',
    "signatureStatus" TEXT NOT NULL DEFAULT 'NAO_VERIFICADA',
    "payload" JSONB NOT NULL,
    "inconsistencies" JSONB,
    "validationSummary" JSONB,
    "receiptNumber" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifAssessment" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subtitleId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "revenueDecimal" DECIMAL(18,2) NOT NULL,
    "deductionDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxableBaseDecimal" DECIMAL(18,2) NOT NULL,
    "rate" DECIMAL(9,6) NOT NULL,
    "grossTaxDecimal" DECIMAL(18,2) NOT NULL,
    "creditDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "debitAdjustmentDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxDueDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APURADA',
    "calculationSnapshot" JSONB NOT NULL,
    "taxAssessmentId" TEXT,
    "guideId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifTrialBalance" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "pgccAccountId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "openingBalanceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "creditsDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "debitsDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "calculatedCloseDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "declaredCloseDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "differenceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "inconsistency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesifTrialBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPackageMovement" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "accountHolderQuantity" INTEGER NOT NULL,
    "potentialRevenueDecimal" DECIMAL(18,2) NOT NULL,
    "collectedRevenueDecimal" DECIMAL(18,2) NOT NULL,
    "differenceDecimal" DECIMAL(18,2) NOT NULL,
    "assessmentImpactDecimal" DECIMAL(18,2) NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesifPackageMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifFiscalCase" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "agencyId" TEXT,
    "assessmentId" TEXT,
    "competence" TEXT NOT NULL,
    "findingType" TEXT NOT NULL,
    "findingDescription" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "processId" TEXT,
    "serviceOrderNumber" TEXT,
    "tiafDocumentId" TEXT,
    "mapDocumentId" TEXT,
    "infractionId" TEXT,
    "dteMessageId" TEXT,
    "guideId" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifFiscalCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifFiscalEvent" (
    "id" TEXT NOT NULL,
    "fiscalCaseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesifFiscalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesifFinancialInstitution_baseCnpj_key" ON "DesifFinancialInstitution"("baseCnpj");

-- CreateIndex
CREATE INDEX "DesifFinancialInstitution_status_validFrom_idx" ON "DesifFinancialInstitution"("status", "validFrom");

-- CreateIndex
CREATE INDEX "DesifFinancialInstitution_taxpayerId_idx" ON "DesifFinancialInstitution"("taxpayerId");

-- CreateIndex
CREATE UNIQUE INDEX "DesifAgency_fullCnpj_key" ON "DesifAgency"("fullCnpj");

-- CreateIndex
CREATE INDEX "DesifAgency_institutionId_status_idx" ON "DesifAgency"("institutionId", "status");

-- CreateIndex
CREATE INDEX "DesifAgency_economicRegistrationId_idx" ON "DesifAgency"("economicRegistrationId");

-- CreateIndex
CREATE UNIQUE INDEX "DesifAgency_institutionId_code_key" ON "DesifAgency"("institutionId", "code");

-- CreateIndex
CREATE INDEX "DesifCosifAccount_active_validFrom_idx" ON "DesifCosifAccount"("active", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "DesifCosifAccount_code_validFrom_key" ON "DesifCosifAccount"("code", "validFrom");

-- CreateIndex
CREATE INDEX "DesifPgccPlan_institutionId_status_validFrom_idx" ON "DesifPgccPlan"("institutionId", "status", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPgccPlan_institutionId_version_key" ON "DesifPgccPlan"("institutionId", "version");

-- CreateIndex
CREATE INDEX "DesifPgccAccount_planId_active_idx" ON "DesifPgccAccount"("planId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPgccAccount_planId_code_key" ON "DesifPgccAccount"("planId", "code");

-- CreateIndex
CREATE INDEX "DesifPgccCosifLink_cosifAccountId_validFrom_idx" ON "DesifPgccCosifLink"("cosifAccountId", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPgccCosifLink_pgccAccountId_cosifAccountId_validFrom_key" ON "DesifPgccCosifLink"("pgccAccountId", "cosifAccountId", "validFrom");

-- CreateIndex
CREATE INDEX "DesifSubtitle_active_validFrom_idx" ON "DesifSubtitle"("active", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "DesifSubtitle_pgccAccountId_code_validFrom_key" ON "DesifSubtitle"("pgccAccountId", "code", "validFrom");

-- CreateIndex
CREATE INDEX "DesifTariff_institutionId_active_idx" ON "DesifTariff"("institutionId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DesifTariff_institutionId_code_validFrom_key" ON "DesifTariff"("institutionId", "code", "validFrom");

-- CreateIndex
CREATE INDEX "DesifPackage_institutionId_active_idx" ON "DesifPackage"("institutionId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPackage_institutionId_code_validFrom_key" ON "DesifPackage"("institutionId", "code", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPackageItem_packageId_tariffId_key" ON "DesifPackageItem"("packageId", "tariffId");

-- CreateIndex
CREATE UNIQUE INDEX "DesifImportBatch_checksum_key" ON "DesifImportBatch"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "DesifImportBatch_receiptNumber_key" ON "DesifImportBatch"("receiptNumber");

-- CreateIndex
CREATE INDEX "DesifImportBatch_institutionId_competence_status_idx" ON "DesifImportBatch"("institutionId", "competence", "status");

-- CreateIndex
CREATE INDEX "DesifImportBatch_agencyId_competence_idx" ON "DesifImportBatch"("agencyId", "competence");

-- CreateIndex
CREATE INDEX "DesifAssessment_agencyId_competence_status_idx" ON "DesifAssessment"("agencyId", "competence", "status");

-- CreateIndex
CREATE INDEX "DesifAssessment_taxAssessmentId_idx" ON "DesifAssessment"("taxAssessmentId");

-- CreateIndex
CREATE INDEX "DesifAssessment_guideId_idx" ON "DesifAssessment"("guideId");

-- CreateIndex
CREATE UNIQUE INDEX "DesifAssessment_importBatchId_agencyId_subtitleId_key" ON "DesifAssessment"("importBatchId", "agencyId", "subtitleId");

-- CreateIndex
CREATE INDEX "DesifTrialBalance_agencyId_competence_idx" ON "DesifTrialBalance"("agencyId", "competence");

-- CreateIndex
CREATE UNIQUE INDEX "DesifTrialBalance_importBatchId_agencyId_pgccAccountId_key" ON "DesifTrialBalance"("importBatchId", "agencyId", "pgccAccountId");

-- CreateIndex
CREATE INDEX "DesifPackageMovement_agencyId_competence_idx" ON "DesifPackageMovement"("agencyId", "competence");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPackageMovement_importBatchId_agencyId_packageId_key" ON "DesifPackageMovement"("importBatchId", "agencyId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "DesifFiscalCase_serviceOrderNumber_key" ON "DesifFiscalCase"("serviceOrderNumber");

-- CreateIndex
CREATE INDEX "DesifFiscalCase_institutionId_competence_status_idx" ON "DesifFiscalCase"("institutionId", "competence", "status");

-- CreateIndex
CREATE INDEX "DesifFiscalCase_agencyId_findingType_idx" ON "DesifFiscalCase"("agencyId", "findingType");

-- CreateIndex
CREATE INDEX "DesifFiscalCase_processId_idx" ON "DesifFiscalCase"("processId");

-- CreateIndex
CREATE INDEX "DesifFiscalEvent_fiscalCaseId_createdAt_idx" ON "DesifFiscalEvent"("fiscalCaseId", "createdAt");

-- AddForeignKey
ALTER TABLE "DesifAgency" ADD CONSTRAINT "DesifAgency_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPgccPlan" ADD CONSTRAINT "DesifPgccPlan_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPgccAccount" ADD CONSTRAINT "DesifPgccAccount_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DesifPgccPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPgccCosifLink" ADD CONSTRAINT "DesifPgccCosifLink_pgccAccountId_fkey" FOREIGN KEY ("pgccAccountId") REFERENCES "DesifPgccAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPgccCosifLink" ADD CONSTRAINT "DesifPgccCosifLink_cosifAccountId_fkey" FOREIGN KEY ("cosifAccountId") REFERENCES "DesifCosifAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifSubtitle" ADD CONSTRAINT "DesifSubtitle_pgccAccountId_fkey" FOREIGN KEY ("pgccAccountId") REFERENCES "DesifPgccAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifTariff" ADD CONSTRAINT "DesifTariff_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackage" ADD CONSTRAINT "DesifPackage_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackageItem" ADD CONSTRAINT "DesifPackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "DesifPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackageItem" ADD CONSTRAINT "DesifPackageItem_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "DesifTariff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifImportBatch" ADD CONSTRAINT "DesifImportBatch_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifImportBatch" ADD CONSTRAINT "DesifImportBatch_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "DesifAgency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifAssessment" ADD CONSTRAINT "DesifAssessment_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "DesifImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifAssessment" ADD CONSTRAINT "DesifAssessment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "DesifAgency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifAssessment" ADD CONSTRAINT "DesifAssessment_subtitleId_fkey" FOREIGN KEY ("subtitleId") REFERENCES "DesifSubtitle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifTrialBalance" ADD CONSTRAINT "DesifTrialBalance_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "DesifImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifTrialBalance" ADD CONSTRAINT "DesifTrialBalance_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "DesifAgency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifTrialBalance" ADD CONSTRAINT "DesifTrialBalance_pgccAccountId_fkey" FOREIGN KEY ("pgccAccountId") REFERENCES "DesifPgccAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackageMovement" ADD CONSTRAINT "DesifPackageMovement_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "DesifImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackageMovement" ADD CONSTRAINT "DesifPackageMovement_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "DesifAgency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackageMovement" ADD CONSTRAINT "DesifPackageMovement_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "DesifPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifFiscalCase" ADD CONSTRAINT "DesifFiscalCase_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifFiscalCase" ADD CONSTRAINT "DesifFiscalCase_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "DesifAgency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifFiscalCase" ADD CONSTRAINT "DesifFiscalCase_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "DesifAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifFiscalEvent" ADD CONSTRAINT "DesifFiscalEvent_fiscalCaseId_fkey" FOREIGN KEY ("fiscalCaseId") REFERENCES "DesifFiscalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
