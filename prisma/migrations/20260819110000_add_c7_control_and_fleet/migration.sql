CREATE TABLE "InternalControlPlan" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ABERTO',
  "dueAt" TIMESTAMP(3),
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InternalControlPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalControlFinding" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "dueAt" TIMESTAMP(3),
  "responsibleId" TEXT,
  "evidenceDocumentId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InternalControlFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FleetOperation" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "odometer" DOUBLE PRECISION,
  "quantity" DOUBLE PRECISION,
  "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "description" TEXT NOT NULL,
  "supplierName" TEXT,
  "evidenceDocumentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REGISTRADO',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FleetOperation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternalControlPlan_status_dueAt_idx" ON "InternalControlPlan"("status", "dueAt");
CREATE INDEX "InternalControlFinding_planId_status_idx" ON "InternalControlFinding"("planId", "status");
CREATE INDEX "InternalControlFinding_responsibleId_dueAt_idx" ON "InternalControlFinding"("responsibleId", "dueAt");
CREATE INDEX "FleetOperation_assetId_occurredAt_idx" ON "FleetOperation"("assetId", "occurredAt");
CREATE INDEX "FleetOperation_type_occurredAt_idx" ON "FleetOperation"("type", "occurredAt");

ALTER TABLE "InternalControlFinding" ADD CONSTRAINT "InternalControlFinding_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "InternalControlPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FleetOperation" ADD CONSTRAINT "FleetOperation_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
