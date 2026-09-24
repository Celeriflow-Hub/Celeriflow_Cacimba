-- One mutable, instance-wide report layout. Institution remains the source of identity.
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "version" INTEGER NOT NULL DEFAULT 1,
    "fingerprint" TEXT NOT NULL,
    "header" TEXT NOT NULL DEFAULT '',
    "footer" TEXT NOT NULL DEFAULT '',
    "orientation" TEXT NOT NULL DEFAULT 'LANDSCAPE',
    "includeEmissionMetadata" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReportTemplate_orientation_check" CHECK ("orientation" IN ('PORTRAIT', 'LANDSCAPE'))
);

CREATE UNIQUE INDEX "ReportTemplate_scope_key" ON "ReportTemplate"("scope");
CREATE UNIQUE INDEX "ReportTemplate_fingerprint_key" ON "ReportTemplate"("fingerprint");
