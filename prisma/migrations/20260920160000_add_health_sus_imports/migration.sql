CREATE TABLE "HealthSusImportBatch" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "contractVersion" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "insertedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "ignoredCount" INTEGER NOT NULL DEFAULT 0,
    "issueCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "actorUsuarioId" TEXT NOT NULL,

    CONSTRAINT "HealthSusImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthSusImportIssue" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthSusImportIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthSusProcedure" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "groupCode" TEXT,
    "groupName" TEXT,
    "subgroupCode" TEXT,
    "subgroupName" TEXT,
    "complexity" TEXT,
    "registrationInstrument" TEXT,
    "unitValue" DECIMAL(14,2),
    "minimumAge" INTEGER,
    "maximumAge" INTEGER,
    "allowedSex" TEXT,
    "financing" TEXT,
    "cidCodes" TEXT,
    "cboCodes" TEXT,
    "serviceCodes" TEXT,
    "classificationCodes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "sourceBatchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthSusProcedure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthSusReference" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "classification" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "sourceBatchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthSusReference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthSusProcedureReference" (
    "id" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthSusProcedureReference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthSusImportBatch_source_competence_checksum_key" ON "HealthSusImportBatch"("source", "competence", "checksum");
CREATE INDEX "HealthSusImportBatch_source_competence_startedAt_idx" ON "HealthSusImportBatch"("source", "competence", "startedAt");
CREATE INDEX "HealthSusImportBatch_status_startedAt_idx" ON "HealthSusImportBatch"("status", "startedAt");
CREATE INDEX "HealthSusImportIssue_batchId_rowNumber_idx" ON "HealthSusImportIssue"("batchId", "rowNumber");
CREATE UNIQUE INDEX "HealthSusProcedure_sourceBatchId_code_key" ON "HealthSusProcedure"("sourceBatchId", "code");
CREATE INDEX "HealthSusProcedure_code_idx" ON "HealthSusProcedure"("code");
CREATE INDEX "HealthSusProcedure_description_idx" ON "HealthSusProcedure"("description");
CREATE INDEX "HealthSusProcedure_source_competence_code_isCurrent_idx" ON "HealthSusProcedure"("source", "competence", "code", "isCurrent");
CREATE INDEX "HealthSusProcedure_competence_isActive_isCurrent_idx" ON "HealthSusProcedure"("competence", "isActive", "isCurrent");
CREATE UNIQUE INDEX "HealthSusReference_sourceBatchId_kind_code_key" ON "HealthSusReference"("sourceBatchId", "kind", "code");
CREATE INDEX "HealthSusReference_source_competence_kind_code_isCurrent_idx" ON "HealthSusReference"("source", "competence", "kind", "code", "isCurrent");
CREATE INDEX "HealthSusReference_description_idx" ON "HealthSusReference"("description");
CREATE INDEX "HealthSusReference_competence_isActive_isCurrent_idx" ON "HealthSusReference"("competence", "isActive", "isCurrent");
CREATE UNIQUE INDEX "HealthSusProcedureReference_procedureId_referenceId_relationType_key" ON "HealthSusProcedureReference"("procedureId", "referenceId", "relationType");
CREATE INDEX "HealthSusProcedureReference_referenceId_relationType_idx" ON "HealthSusProcedureReference"("referenceId", "relationType");

ALTER TABLE "HealthSusImportBatch" ADD CONSTRAINT "HealthSusImportBatch_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthSusImportIssue" ADD CONSTRAINT "HealthSusImportIssue_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "HealthSusImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthSusProcedure" ADD CONSTRAINT "HealthSusProcedure_sourceBatchId_fkey" FOREIGN KEY ("sourceBatchId") REFERENCES "HealthSusImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthSusReference" ADD CONSTRAINT "HealthSusReference_sourceBatchId_fkey" FOREIGN KEY ("sourceBatchId") REFERENCES "HealthSusImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthSusProcedureReference" ADD CONSTRAINT "HealthSusProcedureReference_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthSusProcedureReference" ADD CONSTRAINT "HealthSusProcedureReference_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "HealthSusReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
