-- C5 is additive and intentionally not applied by this change.
-- Existing procurement and stock records stay valid; new lifecycle records carry
-- their own immutable source and idempotency evidence.
ALTER TABLE "PurchaseRequest"
  ADD COLUMN "approvedByEmployeeId" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3);

ALTER TABLE "PurchaseProcess"
  ADD COLUMN "purchaseRequestId" TEXT;

ALTER TABLE "Expense"
  ADD COLUMN "purchaseReceiptId" TEXT;

ALTER TABLE "Commitment"
  ADD COLUMN "purchaseProcessId" TEXT,
  ADD COLUMN "purchaseReceiptId" TEXT;

ALTER TABLE "MaterialRequest"
  ADD COLUMN "approvedByEmployeeId" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "issuedByEmployeeId" TEXT,
  ADD COLUMN "issuedAt" TIMESTAMP(3);

ALTER TABLE "MaterialMovement"
  ADD COLUMN "materialRequestItemId" TEXT;

CREATE TABLE "ProcurementLifecycleEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "sourceType" TEXT,
  "sourceId" TEXT,
  "actorUsuarioId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcurementLifecycleEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseReceipt" (
  "id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'APPROVED',
  "contractId" TEXT NOT NULL,
  "purchaseProcessId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "attesterId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL DEFAULT 'CONTRACT',
  "sourceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseReceiptItem" (
  "id" TEXT NOT NULL,
  "purchaseReceiptId" TEXT NOT NULL,
  "purchaseProcessItemId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unitCost" DOUBLE PRECISION NOT NULL,
  "batchNumber" TEXT NOT NULL DEFAULT '',
  "expirationDate" TIMESTAMP(3),
  "stockMovementId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseReceiptItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Expense_purchaseReceiptId_key" ON "Expense"("purchaseReceiptId");
CREATE UNIQUE INDEX "Commitment_purchaseReceiptId_key" ON "Commitment"("purchaseReceiptId");
CREATE UNIQUE INDEX "ProcurementLifecycleEvent_idempotencyKey_key" ON "ProcurementLifecycleEvent"("idempotencyKey");
CREATE UNIQUE INDEX "PurchaseReceipt_number_key" ON "PurchaseReceipt"("number");
CREATE UNIQUE INDEX "PurchaseReceipt_idempotencyKey_key" ON "PurchaseReceipt"("idempotencyKey");
CREATE UNIQUE INDEX "PurchaseReceiptItem_stockMovementId_key" ON "PurchaseReceiptItem"("stockMovementId");
CREATE INDEX "PurchaseProcess_purchaseRequestId_idx" ON "PurchaseProcess"("purchaseRequestId");
CREATE INDEX "Commitment_purchaseProcessId_idx" ON "Commitment"("purchaseProcessId");
CREATE INDEX "MaterialMovement_materialRequestItemId_idx" ON "MaterialMovement"("materialRequestItemId");
CREATE INDEX "ProcurementLifecycleEvent_entityType_entityId_createdAt_idx" ON "ProcurementLifecycleEvent"("entityType", "entityId", "createdAt");
CREATE INDEX "ProcurementLifecycleEvent_sourceType_sourceId_idx" ON "ProcurementLifecycleEvent"("sourceType", "sourceId");
CREATE INDEX "PurchaseReceipt_purchaseProcessId_receivedAt_idx" ON "PurchaseReceipt"("purchaseProcessId", "receivedAt");
CREATE INDEX "PurchaseReceipt_contractId_receivedAt_idx" ON "PurchaseReceipt"("contractId", "receivedAt");
CREATE INDEX "PurchaseReceipt_sourceType_sourceId_idx" ON "PurchaseReceipt"("sourceType", "sourceId");
CREATE INDEX "PurchaseReceiptItem_purchaseProcessItemId_idx" ON "PurchaseReceiptItem"("purchaseProcessItemId");
CREATE INDEX "PurchaseReceiptItem_materialId_warehouseId_idx" ON "PurchaseReceiptItem"("materialId", "warehouseId");

ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_approvedByEmployeeId_fkey"
  FOREIGN KEY ("approvedByEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseProcess" ADD CONSTRAINT "PurchaseProcess_purchaseRequestId_fkey"
  FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_purchaseReceiptId_fkey"
  FOREIGN KEY ("purchaseReceiptId") REFERENCES "PurchaseReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_purchaseProcessId_fkey"
  FOREIGN KEY ("purchaseProcessId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_purchaseReceiptId_fkey"
  FOREIGN KEY ("purchaseReceiptId") REFERENCES "PurchaseReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_approvedByEmployeeId_fkey"
  FOREIGN KEY ("approvedByEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_issuedByEmployeeId_fkey"
  FOREIGN KEY ("issuedByEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_materialRequestItemId_fkey"
  FOREIGN KEY ("materialRequestItemId") REFERENCES "MaterialRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementLifecycleEvent" ADD CONSTRAINT "ProcurementLifecycleEvent_actorUsuarioId_fkey"
  FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_contractId_fkey"
  FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_purchaseProcessId_fkey"
  FOREIGN KEY ("purchaseProcessId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_attesterId_fkey"
  FOREIGN KEY ("attesterId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseReceiptItem" ADD CONSTRAINT "PurchaseReceiptItem_purchaseReceiptId_fkey"
  FOREIGN KEY ("purchaseReceiptId") REFERENCES "PurchaseReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseReceiptItem" ADD CONSTRAINT "PurchaseReceiptItem_purchaseProcessItemId_fkey"
  FOREIGN KEY ("purchaseProcessItemId") REFERENCES "PurchaseProcessItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseReceiptItem" ADD CONSTRAINT "PurchaseReceiptItem_materialId_fkey"
  FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseReceiptItem" ADD CONSTRAINT "PurchaseReceiptItem_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseReceiptItem" ADD CONSTRAINT "PurchaseReceiptItem_stockMovementId_fkey"
  FOREIGN KEY ("stockMovementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
