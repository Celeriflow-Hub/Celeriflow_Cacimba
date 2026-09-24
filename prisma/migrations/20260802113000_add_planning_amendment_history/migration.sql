CREATE TABLE "PlanningAmendment" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "originalSnapshot" JSONB NOT NULL,
    "amendedSnapshot" JSONB NOT NULL,
    "authorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningAmendment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanningAmendment_entityType_entityId_version_key"
    ON "PlanningAmendment"("entityType", "entityId", "version");

CREATE INDEX "PlanningAmendment_entityType_entityId_createdAt_idx"
    ON "PlanningAmendment"("entityType", "entityId", "createdAt");
