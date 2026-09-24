CREATE TABLE "InventorySession" (
  "id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'COUNTING',
  "lockMovements" BOOLEAN NOT NULL DEFAULT true,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "approvalEvidence" TEXT,
  "warehouseId" TEXT NOT NULL,
  "createdByUsuarioId" TEXT NOT NULL,
  "approvedByUsuarioId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventorySession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventorySession_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InventorySession_createdByUsuarioId_fkey" FOREIGN KEY ("createdByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InventorySession_approvedByUsuarioId_fkey" FOREIGN KEY ("approvedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "InventorySessionItem" (
  "id" TEXT NOT NULL,
  "expectedQuantity" DOUBLE PRECISION NOT NULL,
  "countedQuantity" DOUBLE PRECISION,
  "divergenceType" TEXT NOT NULL DEFAULT 'SEM_DIVERGENCIA',
  "countEvidence" TEXT,
  "adjustmentReason" TEXT,
  "countedAt" TIMESTAMP(3),
  "sessionId" TEXT NOT NULL,
  "stockId" TEXT NOT NULL,
  "adjustmentMovementId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventorySessionItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventorySessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InventorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InventorySessionItem_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MaterialStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE "MaterialMovement"
  ADD COLUMN "inventorySessionId" TEXT;

ALTER TABLE "InventorySessionItem"
  ADD CONSTRAINT "InventorySessionItem_adjustmentMovementId_fkey"
  FOREIGN KEY ("adjustmentMovementId") REFERENCES "MaterialMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MaterialMovement"
  ADD CONSTRAINT "MaterialMovement_inventorySessionId_fkey"
  FOREIGN KEY ("inventorySessionId") REFERENCES "InventorySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "InventorySessionItem_sessionId_stockId_key" ON "InventorySessionItem"("sessionId", "stockId");
CREATE UNIQUE INDEX "InventorySessionItem_adjustmentMovementId_key" ON "InventorySessionItem"("adjustmentMovementId");
CREATE INDEX "InventorySession_warehouseId_status_idx" ON "InventorySession"("warehouseId", "status");
CREATE INDEX "InventorySession_createdByUsuarioId_idx" ON "InventorySession"("createdByUsuarioId");
CREATE INDEX "InventorySession_approvedByUsuarioId_idx" ON "InventorySession"("approvedByUsuarioId");
CREATE INDEX "InventorySessionItem_stockId_idx" ON "InventorySessionItem"("stockId");
CREATE INDEX "MaterialMovement_inventorySessionId_idx" ON "MaterialMovement"("inventorySessionId");

-- A warehouse may have only one stock-moving lock at a time. It also protects
-- against concurrent requests racing the application-level session check.
CREATE UNIQUE INDEX "InventorySession_one_open_lock_per_warehouse"
  ON "InventorySession"("warehouseId")
  WHERE "lockMovements" = true AND "status" IN ('COUNTING', 'PENDING_APPROVAL');
