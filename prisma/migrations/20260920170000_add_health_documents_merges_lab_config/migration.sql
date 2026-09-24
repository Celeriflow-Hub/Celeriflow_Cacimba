ALTER TABLE "Address" ADD COLUMN "canonicalAddressId" TEXT;

CREATE TABLE "HealthStandardDocument" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "moduleCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthStandardDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthAdministrativeMerge" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "sourceIds" JSONB NOT NULL,
    "criteria" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthAdministrativeMerge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthLaboratoryConfiguration" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "laboratoryName" TEXT NOT NULL,
    "collectionStartTime" TEXT NOT NULL,
    "collectionEndTime" TEXT NOT NULL,
    "resultReleaseDays" INTEGER NOT NULL,
    "allowsExternalProcessing" BOOLEAN NOT NULL DEFAULT false,
    "requiresTechnicalReview" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TEXT NOT NULL,
    "effectiveUntil" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthLaboratoryConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthStandardDocument_documentId_key" ON "HealthStandardDocument"("documentId");
CREATE INDEX "HealthStandardDocument_moduleCode_category_isActive_idx" ON "HealthStandardDocument"("moduleCode", "category", "isActive");
CREATE INDEX "HealthStandardDocument_createdAt_idx" ON "HealthStandardDocument"("createdAt");
CREATE INDEX "HealthAdministrativeMerge_kind_createdAt_idx" ON "HealthAdministrativeMerge"("kind", "createdAt");
CREATE INDEX "HealthAdministrativeMerge_targetId_createdAt_idx" ON "HealthAdministrativeMerge"("targetId", "createdAt");
CREATE INDEX "HealthLaboratoryConfiguration_unitId_isActive_effectiveFrom_idx" ON "HealthLaboratoryConfiguration"("unitId", "isActive", "effectiveFrom");
CREATE INDEX "HealthLaboratoryConfiguration_createdAt_idx" ON "HealthLaboratoryConfiguration"("createdAt");
CREATE INDEX "Address_canonicalAddressId_idx" ON "Address"("canonicalAddressId");

ALTER TABLE "Address" ADD CONSTRAINT "Address_canonicalAddressId_fkey" FOREIGN KEY ("canonicalAddressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStandardDocument" ADD CONSTRAINT "HealthStandardDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStandardDocument" ADD CONSTRAINT "HealthStandardDocument_addedByUsuarioId_fkey" FOREIGN KEY ("addedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthAdministrativeMerge" ADD CONSTRAINT "HealthAdministrativeMerge_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLaboratoryConfiguration" ADD CONSTRAINT "HealthLaboratoryConfiguration_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLaboratoryConfiguration" ADD CONSTRAINT "HealthLaboratoryConfiguration_createdByUsuarioId_fkey" FOREIGN KEY ("createdByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "DocumentClass" ("id", "code", "label", "signaturePolicy", "isActive", "createdAt", "updatedAt")
VALUES ('health-standard-document', 'SAUDE_DOCUMENTO_PADRAO', 'Documento padrão da Saúde', 'INTERNAL_ALLOWED', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET "label" = EXCLUDED."label", "signaturePolicy" = EXCLUDED."signaturePolicy", "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP;
