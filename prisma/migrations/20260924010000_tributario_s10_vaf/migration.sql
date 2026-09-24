-- TRIB-S10 — VAF (Valor Adicionado Fiscal) — VAF-001..057

-- CreateTable: VafExercise
CREATE TABLE "VafExercise" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafExercise_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VafExercise_year_key" ON "VafExercise"("year");

-- CreateTable: VafRule
CREATE TABLE "VafRule" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "cfop" TEXT NOT NULL,
    "cfopDescription" TEXT,
    "composesVaf" BOOLEAN NOT NULL DEFAULT true,
    "formula" TEXT NOT NULL,
    "formulaVersion" TEXT NOT NULL DEFAULT '1',
    "contrapartidaCfop" TEXT,
    "contrapartidaRule" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "situation" TEXT NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafRule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VafRule_exerciseId_cfop_idx" ON "VafRule"("exerciseId", "cfop");
CREATE INDEX "VafRule_effectiveFrom_effectiveUntil_idx" ON "VafRule"("effectiveFrom", "effectiveUntil");

-- CreateTable: VafCompany
CREATE TABLE "VafCompany" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "corporateName" TEXT NOT NULL,
    "tradeName" TEXT,
    "stateInsc" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "cnae" TEXT,
    "taxRegime" TEXT,
    "accountantId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafCompany_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VafCompany_cnpj_key" ON "VafCompany"("cnpj");
CREATE INDEX "VafCompany_accountantId_idx" ON "VafCompany"("accountantId");

-- CreateTable: VafAccountant
CREATE TABLE "VafAccountant" (
    "id" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafAccountant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VafAccountant_cpfCnpj_key" ON "VafAccountant"("cpfCnpj");

-- CreateTable: VafEfdImport
CREATE TABLE "VafEfdImport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "parsedData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'IMPORTADO',
    "importedBy" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "parentImportId" TEXT,
    CONSTRAINT "VafEfdImport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VafEfdImport_companyId_exerciseId_competency_version_key" ON "VafEfdImport"("companyId", "exerciseId", "competency", "version");
CREATE INDEX "VafEfdImport_exerciseId_competency_idx" ON "VafEfdImport"("exerciseId", "competency");
CREATE INDEX "VafEfdImport_parentImportId_idx" ON "VafEfdImport"("parentImportId");

-- CreateTable: VafGiaImport
CREATE TABLE "VafGiaImport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "parsedData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'IMPORTADO',
    "importedBy" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "parentImportId" TEXT,
    CONSTRAINT "VafGiaImport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VafGiaImport_companyId_exerciseId_competency_version_key" ON "VafGiaImport"("companyId", "exerciseId", "competency", "version");
CREATE INDEX "VafGiaImport_exerciseId_competency_idx" ON "VafGiaImport"("exerciseId", "competency");
CREATE INDEX "VafGiaImport_parentImportId_idx" ON "VafGiaImport"("parentImportId");

-- CreateTable: VafMonthlySummary
CREATE TABLE "VafMonthlySummary" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "cfop" TEXT NOT NULL,
    "cfopDescription" TEXT,
    "efdSaida" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "efdEntrada" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "giaSaida" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "giaEntrada" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "composesVaf" BOOLEAN NOT NULL DEFAULT true,
    "vafCalculated" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "formulaApplied" TEXT,
    "divergences" JSONB,
    "sourcePriority" TEXT NOT NULL DEFAULT 'EFD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VafMonthlySummary_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VafMonthlySummary_exerciseId_companyId_competency_cfop_key" ON "VafMonthlySummary"("exerciseId", "companyId", "competency", "cfop");
CREATE INDEX "VafMonthlySummary_exerciseId_competency_idx" ON "VafMonthlySummary"("exerciseId", "competency");
CREATE INDEX "VafMonthlySummary_companyId_competency_idx" ON "VafMonthlySummary"("companyId", "competency");

-- CreateTable: VafResult
CREATE TABLE "VafResult" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "saidaElegivel" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "entradaElegivel" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "vafValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "participation" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "isSimples" BOOLEAN NOT NULL DEFAULT false,
    "simplesData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VafResult_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VafResult_exerciseId_companyId_competency_sourceType_key" ON "VafResult"("exerciseId", "companyId", "competency", "sourceType");
CREATE INDEX "VafResult_exerciseId_competency_idx" ON "VafResult"("exerciseId", "competency");
CREATE INDEX "VafResult_exerciseId_vafValue_idx" ON "VafResult"("exerciseId", "vafValue");

-- CreateTable: VafCompanyIndex
CREATE TABLE "VafCompanyIndex" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "indexProvisorio" DECIMAL(9,6),
    "indexDefinitivo" DECIMAL(9,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VafCompanyIndex_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VafCompanyIndex_exerciseId_companyId_competency_key" ON "VafCompanyIndex"("exerciseId", "companyId", "competency");
CREATE INDEX "VafCompanyIndex_exerciseId_competency_idx" ON "VafCompanyIndex"("exerciseId", "competency");

-- CreateTable: VafMunicipalIndex
CREATE TABLE "VafMunicipalIndex" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "indexProvisorio" DECIMAL(9,6),
    "indexDefinitivo" DECIMAL(9,6),
    "totalVafProvisorio" DECIMAL(18,2),
    "totalVafDefinitivo" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VafMunicipalIndex_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VafMunicipalIndex_exerciseId_competency_key" ON "VafMunicipalIndex"("exerciseId", "competency");
CREATE INDEX "VafMunicipalIndex_exerciseId_competency_idx" ON "VafMunicipalIndex"("exerciseId", "competency");

-- CreateTable: VafRepasse
CREATE TABLE "VafRepasse" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "weekNumber" INTEGER,
    "municipalValue" DECIMAL(18,2) NOT NULL,
    "stateTotalValue" DECIMAL(18,2) NOT NULL,
    "sourceFile" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL DEFAULT '1',
    "parentRepasseId" TEXT,
    CONSTRAINT "VafRepasse_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VafRepasse_exerciseId_competency_weekNumber_version_key" ON "VafRepasse"("exerciseId", "competency", "weekNumber", "version");
CREATE INDEX "VafRepasse_exerciseId_competency_idx" ON "VafRepasse"("exerciseId", "competency");
CREATE INDEX "VafRepasse_parentRepasseId_idx" ON "VafRepasse"("parentRepasseId");

-- CreateTable: VafProtocol
CREATE TABLE "VafProtocol" (
    "id" TEXT NOT NULL,
    "protocolNumber" TEXT NOT NULL,
    "companyId" TEXT,
    "accountantId" TEXT,
    "documentType" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "VafProtocol_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VafProtocol_protocolNumber_key" ON "VafProtocol"("protocolNumber");
CREATE INDEX "VafProtocol_companyId_competency_idx" ON "VafProtocol"("companyId", "competency");
CREATE INDEX "VafProtocol_accountantId_competency_idx" ON "VafProtocol"("accountantId", "competency");
CREATE INDEX "VafProtocol_exerciseId_competency_idx" ON "VafProtocol"("exerciseId", "competency");

-- CreateTable: VafNotification
CREATE TABLE "VafNotification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "accountantId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "competency" TEXT,
    "exerciseId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENVIADA',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "VafNotification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VafNotification_companyId_status_idx" ON "VafNotification"("companyId", "status");
CREATE INDEX "VafNotification_accountantId_status_idx" ON "VafNotification"("accountantId", "status");
CREATE INDEX "VafNotification_exerciseId_competency_idx" ON "VafNotification"("exerciseId", "competency");

-- CreateTable: VafActivity
CREATE TABLE "VafActivity" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "assignedTo" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forwardedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "analyzedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "VafActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VafActivity_exerciseId_competency_status_idx" ON "VafActivity"("exerciseId", "competency", "status");
CREATE INDEX "VafActivity_assignedTo_status_idx" ON "VafActivity"("assignedTo", "status");

-- CreateTable: VafEstimate
CREATE TABLE "VafEstimate" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT,
    "competency" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "realizedMonths" INTEGER NOT NULL,
    "realizedValue" DECIMAL(18,2) NOT NULL,
    "estimatedValue" DECIMAL(18,2) NOT NULL,
    "hypothesis" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VafEstimate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VafEstimate_exerciseId_competency_idx" ON "VafEstimate"("exerciseId", "competency");

-- CreateTable: VafCrossCheck
CREATE TABLE "VafCrossCheck" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "cfop" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'ALERTA',
    "efdValue" DECIMAL(18,2),
    "giaValue" DECIMAL(18,2),
    "expectedValue" DECIMAL(18,2),
    "difference" DECIMAL(18,2),
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VafCrossCheck_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VafCrossCheck_exerciseId_competency_status_idx" ON "VafCrossCheck"("exerciseId", "competency", "status");
CREATE INDEX "VafCrossCheck_companyId_competency_idx" ON "VafCrossCheck"("companyId", "competency");

-- CreateTable: VafCfopEntry
CREATE TABLE "VafCfopEntry" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "cfop" TEXT NOT NULL,
    "cfopDescription" TEXT,
    "operationType" TEXT NOT NULL,
    "efdValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "giaValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "composesVaf" BOOLEAN NOT NULL DEFAULT true,
    "onlyContabil" BOOLEAN NOT NULL DEFAULT false,
    "divergence" JSONB,
    "formulaDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VafCfopEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VafCfopEntry_exerciseId_companyId_competency_cfop_idx" ON "VafCfopEntry"("exerciseId", "companyId", "competency", "cfop");

-- AddForeignKeys
ALTER TABLE "VafRule" ADD CONSTRAINT "VafRule_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VafCompany" ADD CONSTRAINT "VafCompany_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "VafAccountant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VafEfdImport" ADD CONSTRAINT "VafEfdImport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafEfdImport" ADD CONSTRAINT "VafEfdImport_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafEfdImport" ADD CONSTRAINT "VafEfdImport_parentImportId_fkey" FOREIGN KEY ("parentImportId") REFERENCES "VafEfdImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VafGiaImport" ADD CONSTRAINT "VafGiaImport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafGiaImport" ADD CONSTRAINT "VafGiaImport_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafGiaImport" ADD CONSTRAINT "VafGiaImport_parentImportId_fkey" FOREIGN KEY ("parentImportId") REFERENCES "VafGiaImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VafMonthlySummary" ADD CONSTRAINT "VafMonthlySummary_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafMonthlySummary" ADD CONSTRAINT "VafMonthlySummary_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VafResult" ADD CONSTRAINT "VafResult_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafResult" ADD CONSTRAINT "VafResult_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VafCompanyIndex" ADD CONSTRAINT "VafCompanyIndex_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafCompanyIndex" ADD CONSTRAINT "VafCompanyIndex_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VafMunicipalIndex" ADD CONSTRAINT "VafMunicipalIndex_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VafRepasse" ADD CONSTRAINT "VafRepasse_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafRepasse" ADD CONSTRAINT "VafRepasse_parentRepasseId_fkey" FOREIGN KEY ("parentRepasseId") REFERENCES "VafRepasse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VafProtocol" ADD CONSTRAINT "VafProtocol_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VafProtocol" ADD CONSTRAINT "VafProtocol_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "VafAccountant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VafProtocol" ADD CONSTRAINT "VafProtocol_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VafNotification" ADD CONSTRAINT "VafNotification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VafNotification" ADD CONSTRAINT "VafNotification_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "VafAccountant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VafNotification" ADD CONSTRAINT "VafNotification_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VafActivity" ADD CONSTRAINT "VafActivity_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafActivity" ADD CONSTRAINT "VafActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VafEstimate" ADD CONSTRAINT "VafEstimate_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafEstimate" ADD CONSTRAINT "VafEstimate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VafCrossCheck" ADD CONSTRAINT "VafCrossCheck_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafCrossCheck" ADD CONSTRAINT "VafCrossCheck_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VafCfopEntry" ADD CONSTRAINT "VafCfopEntry_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VafCfopEntry" ADD CONSTRAINT "VafCfopEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;