-- TRIB-S9 — Dívida ativa (eventos, CDA, carteiras, protesto, execução) e cemitérios

-- CreateTable
CREATE TABLE "TaxActiveDebtEvent" (
    "id" TEXT NOT NULL,
    "activeDebtId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxActiveDebtEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TaxActiveDebtEvent_activeDebtId_createdAt_idx" ON "TaxActiveDebtEvent"("activeDebtId", "createdAt");

-- CreateTable
CREATE TABLE "TaxCdaVersion" (
    "id" TEXT NOT NULL,
    "activeDebtId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "cdaNumber" TEXT NOT NULL,
    "contentSnapshot" JSONB NOT NULL,
    "annotation" TEXT,
    "signatureStatus" TEXT NOT NULL DEFAULT 'NAO_ASSINADA',
    "signedByUsuarioId" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCdaVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaxCdaVersion_activeDebtId_versionNumber_key" ON "TaxCdaVersion"("activeDebtId", "versionNumber");
CREATE INDEX "TaxCdaVersion_cdaNumber_idx" ON "TaxCdaVersion"("cdaNumber");

-- CreateTable
CREATE TABLE "TaxDebtSuspension" (
    "id" TEXT NOT NULL,
    "activeDebtId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "legalGround" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'VIGENTE',
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxDebtSuspension_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TaxDebtSuspension_activeDebtId_status_idx" ON "TaxDebtSuspension"("activeDebtId", "status");

-- CreateTable
CREATE TABLE "TaxDaPortfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDaPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDaPortfolioItem" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "activeDebtId" TEXT NOT NULL,
    "outstandingDecimal" DECIMAL(18,2) NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxDaPortfolioItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaxDaPortfolioItem_portfolioId_activeDebtId_key" ON "TaxDaPortfolioItem"("portfolioId", "activeDebtId");
CREATE INDEX "TaxDaPortfolioItem_activeDebtId_idx" ON "TaxDaPortfolioItem"("activeDebtId");

-- CreateTable
CREATE TABLE "TaxProtestBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREPARADA',
    "fileContent" JSONB NOT NULL,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxProtestBatch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaxProtestBatch_batchNumber_key" ON "TaxProtestBatch"("batchNumber");

-- CreateTable
CREATE TABLE "TaxProtestItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "activeDebtId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SELECIONADA',
    "returnCode" TEXT,
    "returnMessage" TEXT,
    "consentIssuedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxProtestItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaxProtestItem_batchId_activeDebtId_key" ON "TaxProtestItem"("batchId", "activeDebtId");
CREATE INDEX "TaxProtestItem_activeDebtId_status_idx" ON "TaxProtestItem"("activeDebtId", "status");

-- CreateTable
CREATE TABLE "TaxExecutionBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "internalProtocol" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'MONTADO',
    "prosecutor" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxExecutionBatch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaxExecutionBatch_batchNumber_key" ON "TaxExecutionBatch"("batchNumber");
CREATE UNIQUE INDEX "TaxExecutionBatch_internalProtocol_key" ON "TaxExecutionBatch"("internalProtocol");

-- CreateTable
CREATE TABLE "TaxExecutionCase" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "activeDebtId" TEXT NOT NULL,
    "internalProtocol" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_PREPARO',
    "prosecutor" TEXT,
    "attorneyReference" TEXT,
    "mniStatus" TEXT NOT NULL DEFAULT 'NAO_ENVIADO',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "caseSnapshot" JSONB NOT NULL,
    "nextHearingAt" TIMESTAMP(3),
    "hearingNotes" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxExecutionCase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaxExecutionCase_internalProtocol_key" ON "TaxExecutionCase"("internalProtocol");
CREATE INDEX "TaxExecutionCase_activeDebtId_status_idx" ON "TaxExecutionCase"("activeDebtId", "status");

-- CreateTable
CREATE TABLE "TaxExecutionEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxExecutionEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TaxExecutionEvent_caseId_createdAt_idx" ON "TaxExecutionEvent"("caseId", "createdAt");

-- CreateTable
CREATE TABLE "TaxCemetery" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "wakePlace" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCemetery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaxCemetery_code_key" ON "TaxCemetery"("code");

-- CreateTable
CREATE TABLE "TaxCemeterySector" (
    "id" TEXT NOT NULL,
    "cemeteryId" TEXT NOT NULL,
    "parentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TaxCemeterySector_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaxCemeterySector_cemeteryId_code_key" ON "TaxCemeterySector"("cemeteryId", "code");

-- CreateTable
CREATE TABLE "TaxCemeteryEmployee" (
    "id" TEXT NOT NULL,
    "cemeteryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCemeteryEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxFuneralHome" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxFuneralHome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeathCause" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxDeathCause_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaxDeathCause_code_key" ON "TaxDeathCause"("code");

-- CreateTable
CREATE TABLE "TaxGrave" (
    "id" TEXT NOT NULL,
    "cemeteryId" TEXT NOT NULL,
    "sectorId" TEXT,
    "code" TEXT NOT NULL,
    "graveType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "occupantCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'LIVRE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxGrave_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaxGrave_cemeteryId_code_key" ON "TaxGrave"("cemeteryId", "code");
CREATE INDEX "TaxGrave_sectorId_status_idx" ON "TaxGrave"("sectorId", "status");

-- CreateTable
CREATE TABLE "TaxDeceased" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "deathDate" TIMESTAMP(3) NOT NULL,
    "deathTime" TEXT,
    "gender" TEXT,
    "document" TEXT,
    "maritalStatus" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "address" TEXT,
    "cemeteryId" TEXT NOT NULL,
    "graveId" TEXT,
    "funeralHomeId" TEXT,
    "funeralHomeName" TEXT,
    "causeId" TEXT,
    "causeText" TEXT,
    "doctorName" TEXT NOT NULL,
    "doctorCrm" TEXT NOT NULL,
    "groups" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SEPULTADO',
    "taxpayerId" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDeceased_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TaxDeceased_cemeteryId_deathDate_idx" ON "TaxDeceased"("cemeteryId", "deathDate");
CREATE INDEX "TaxDeceased_graveId_idx" ON "TaxDeceased"("graveId");

-- CreateTable
CREATE TABLE "TaxBurialMovement" (
    "id" TEXT NOT NULL,
    "deceasedId" TEXT,
    "graveId" TEXT NOT NULL,
    "fromGraveId" TEXT,
    "toGraveId" TEXT,
    "movementType" TEXT NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feeAssessmentId" TEXT,
    "notes" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxBurialMovement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TaxBurialMovement_graveId_movementType_idx" ON "TaxBurialMovement"("graveId", "movementType");

-- CreateTable
CREATE TABLE "TaxGraveConcession" (
    "id" TEXT NOT NULL,
    "graveId" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "taxpayerId" TEXT,
    "concessionType" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'VIGENTE',
    "feeAssessmentId" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxGraveConcession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TaxGraveConcession_graveId_status_idx" ON "TaxGraveConcession"("graveId", "status");

-- AlterTable: idempotência de inscrição manual/arquivo (mesma origem nunca duplica dívida)
ALTER TABLE "ActiveDebt" ADD COLUMN "sourceKey" TEXT;
CREATE UNIQUE INDEX "ActiveDebt_sourceKey_key" ON "ActiveDebt"("sourceKey");
