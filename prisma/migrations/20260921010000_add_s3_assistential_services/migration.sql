ALTER TABLE "HealthLaboratoryConfiguration"
  ADD COLUMN IF NOT EXISTS "publishesPatientPortal" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "resultFooterMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "usesDigitalSignature" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Warehouse" ADD COLUMN IF NOT EXISTS "healthUnitId" TEXT;
ALTER TABLE "MaterialStock"
  ADD COLUMN IF NOT EXISTS "blockReason" TEXT,
  ADD COLUMN IF NOT EXISTS "blockedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "productionDate" TIMESTAMP(3);
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "materialId" TEXT;
ALTER TABLE "Vaccine" ADD COLUMN IF NOT EXISTS "materialId" TEXT;
ALTER TABLE "MedicineDispensation"
  ADD COLUMN IF NOT EXISTS "dispensedByProfessionalId" TEXT,
  ADD COLUMN IF NOT EXISTS "dosageSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "movementId" TEXT,
  ADD COLUMN IF NOT EXISTS "nextWithdrawalAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "observation" TEXT,
  ADD COLUMN IF NOT EXISTS "prescriptionItemId" TEXT,
  ADD COLUMN IF NOT EXISTS "specializedPlanId" TEXT,
  ADD COLUMN IF NOT EXISTS "stockId" TEXT,
  ADD COLUMN IF NOT EXISTS "warehouseId" TEXT,
  ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE "VaccinationRecord"
  ADD COLUMN IF NOT EXISTS "administrationRoute" TEXT,
  ADD COLUMN IF NOT EXISTS "applicationReason" TEXT,
  ADD COLUMN IF NOT EXISTS "applicationSite" TEXT,
  ADD COLUMN IF NOT EXISTS "citizenCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "movementId" TEXT,
  ADD COLUMN IF NOT EXISTS "shift" TEXT,
  ADD COLUMN IF NOT EXISTS "stockId" TEXT,
  ADD COLUMN IF NOT EXISTS "strategy" TEXT,
  ADD COLUMN IF NOT EXISTS "teamSnapshot" TEXT;

CREATE TABLE IF NOT EXISTS "HealthMaterialProfile" (
  "id" TEXT PRIMARY KEY,
  "materialId" TEXT NOT NULL,
  "productKind" TEXT NOT NULL,
  "subgroup" TEXT,
  "packaging" TEXT,
  "dcbCode" TEXT,
  "classification" TEXT,
  "barcode" TEXT,
  "sourceCatalog" TEXT,
  "sourceCode" TEXT,
  "patientReleaseAllowed" BOOLEAN NOT NULL DEFAULT true,
  "manufacturerSupplierId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "HealthStockPolicy" (
  "id" TEXT PRIMARY KEY,
  "warehouseId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "minQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "HealthStockReceipt" (
  "id" TEXT PRIMARY KEY,
  "warehouseId" TEXT NOT NULL,
  "supplierId" TEXT,
  "documentId" TEXT,
  "entryType" TEXT NOT NULL,
  "fundingSource" TEXT,
  "invoiceNumber" TEXT,
  "invoiceKey" TEXT,
  "invoiceXmlHash" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "idempotencyKey" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "postedAt" TIMESTAMP(3),
  "createdByUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "HealthStockReceiptItem" (
  "id" TEXT PRIMARY KEY,
  "receiptId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "batchNumber" TEXT NOT NULL,
  "productionDate" TIMESTAMP(3),
  "expirationDate" TIMESTAMP(3),
  "quantity" DOUBLE PRECISION NOT NULL,
  "unitCost" DOUBLE PRECISION NOT NULL,
  "movementId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "HealthStockTransfer" (
  "id" TEXT PRIMARY KEY,
  "originWarehouseId" TEXT NOT NULL,
  "destinationWarehouseId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "requestNumber" TEXT,
  "notes" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "dispatchedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "createdByUsuarioId" TEXT NOT NULL,
  "receivedByUsuarioId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "HealthStockTransferItem" (
  "id" TEXT PRIMARY KEY,
  "transferId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "batchNumber" TEXT NOT NULL,
  "expirationDate" TIMESTAMP(3),
  "quantity" DOUBLE PRECISION NOT NULL,
  "departureMovementId" TEXT,
  "arrivalMovementId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "PharmacyRequest" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT,
  "destinationWarehouseId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fulfilledAt" TIMESTAMP(3),
  "createdByUsuarioId" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "PharmacyRequestItem" (
  "id" TEXT PRIMARY KEY,
  "requestId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "requestedQuantity" DOUBLE PRECISION NOT NULL,
  "fulfilledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "ControlledMedicineBook" (
  "id" TEXT PRIMARY KEY,
  "warehouseId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "openedByUsuarioId" TEXT NOT NULL,
  "closedByUsuarioId" TEXT,
  "closingEvidence" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "HealthAssistentialDevice" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "deviceType" TEXT NOT NULL,
  "protocol" TEXT NOT NULL,
  "unitId" TEXT,
  "operatorUsuarioIds" JSONB NOT NULL,
  "configuration" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "HealthDeviceMessage" (
  "id" TEXT PRIMARY KEY,
  "deviceId" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "sanitizedData" JSONB,
  "processedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "HealthLabQuestionnaire" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveUntil" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "HealthLabQuestionGroup" (
  "id" TEXT PRIMARY KEY,
  "questionnaireId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL,
  "pageBreak" BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS "HealthLabQuestionItem" (
  "id" TEXT PRIMARY KEY,
  "groupId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "valueType" TEXT NOT NULL,
  "unitOfMeasure" TEXT,
  "maxLength" INTEGER,
  "calculation" TEXT,
  "options" JSONB,
  "printOnReport" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL,
  "references" JSONB
);
CREATE TABLE IF NOT EXISTS "HealthLabExamModel" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "procedureId" TEXT,
  "questionnaireId" TEXT,
  "bench" TEXT,
  "preparation" TEXT,
  "performedInternally" BOOLEAN NOT NULL DEFAULT true,
  "deliveryDays" INTEGER NOT NULL DEFAULT 0,
  "duplicateWindowDays" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "HealthLabExamMaterial" (
  "id" TEXT PRIMARY KEY,
  "examModelId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS "HealthLabSchedule" (
  "id" TEXT PRIMARY KEY,
  "examModelId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "date" TIMESTAMP(3),
  "weekday" INTEGER,
  "capacity" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "HealthLabProviderQuota" (
  "id" TEXT PRIMARY KEY,
  "providerSupplierId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "examModelId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "allowedQuantity" INTEGER NOT NULL,
  "consumedQuantity" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "HealthLabOrder" (
  "id" TEXT PRIMARY KEY,
  "examRequestId" TEXT,
  "examModelId" TEXT,
  "patientId" TEXT NOT NULL,
  "requestUnitId" TEXT,
  "collectionUnitId" TEXT,
  "collectorProfessionalId" TEXT,
  "providerSupplierId" TEXT,
  "origin" TEXT NOT NULL DEFAULT 'ELECTRONIC_REQUEST',
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "priority" TEXT NOT NULL DEFAULT 'ROUTINE',
  "scheduledAt" TIMESTAMP(3),
  "collectedAt" TIMESTAMP(3),
  "expectedResultAt" TIMESTAMP(3),
  "sampleBarcode" TEXT,
  "collectionByThirdParty" BOOLEAN NOT NULL DEFAULT false,
  "authorizationKey" TEXT,
  "referenceValue" DOUBLE PRECISION,
  "idempotencyKey" TEXT NOT NULL,
  "createdByUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "HealthLabResult" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PARTIAL',
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "values" JSONB NOT NULL,
  "interpretation" TEXT,
  "deviceCorrelationId" TEXT,
  "enteredByUsuarioId" TEXT NOT NULL,
  "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "HealthLabOrderEvent" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "reason" TEXT,
  "actorUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "HealthLabReport" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "reviewerProfessionalId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "deliveredTo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "SpecializedCatalogItem" (
  "id" TEXT PRIMARY KEY,
  "category" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "referenceValue" DOUBLE PRECISION,
  "materialId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "SpecializedTeamSchedule" (
  "id" TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "patientCapacity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "SpecializedTherapeuticPlan" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "initialMedicalRecordId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "goals" TEXT NOT NULL,
  "carePlan" TEXT NOT NULL,
  "plannedConsultations" INTEGER NOT NULL,
  "completedConsultations" INTEGER NOT NULL DEFAULT 0,
  "outcome" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdByUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "SpecializedPlanEntry" (
  "id" TEXT PRIMARY KEY,
  "planId" TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,
  "specialtyId" TEXT,
  "medicalRecordId" TEXT,
  "kind" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "diagnosisSummary" TEXT,
  "weight" DOUBLE PRECISION,
  "height" DOUBLE PRECISION,
  "bmi" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "healthServiceId" TEXT
);
CREATE TABLE IF NOT EXISTS "SpecializedQuota" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "allowedQuantity" DOUBLE PRECISION NOT NULL,
  "consumedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "SpecializedDistribution" (
  "id" TEXT PRIMARY KEY,
  "planId" TEXT NOT NULL,
  "quotaId" TEXT,
  "patientId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "stockId" TEXT NOT NULL,
  "movementId" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "referenceValue" DOUBLE PRECISION,
  "deliveredByUsuarioId" TEXT NOT NULL,
  "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT
);

-- Reuse the legacy medicine/vaccine catalogs by attaching each record to the
-- canonical material catalog. Legacy aggregate balances are not imported as
-- operational stock because they have no reliable unit or warehouse origin.
INSERT INTO "MaterialCategory" ("id", "name", "code", "isActive", "createdAt", "updatedAt")
VALUES ('health-assistential-products', 'Produtos assistenciais', 'SAUDE_ASSISTENCIAL', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Material" ("id", "code", "name", "type", "unitOfMeasure", "minStock", "maxStock", "isPerishable", "isActive", "categoryId", "createdAt", "updatedAt")
SELECT 'health-material-med-' || m."id", 'SAU-MED-' || substr(md5(m."id"), 1, 20), m."name", 'MATERIAL', 'UN', 0, 0, true, m."isActive", (SELECT "id" FROM "MaterialCategory" WHERE "code" = 'SAUDE_ASSISTENCIAL'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Medicine" m WHERE m."materialId" IS NULL
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "HealthMaterialProfile" ("id", "materialId", "productKind", "packaging", "classification", "patientReleaseAllowed", "isActive", "createdAt", "updatedAt")
SELECT 'health-profile-med-' || m."id", 'health-material-med-' || m."id", CASE WHEN m."isControlled" THEN 'CONTROLLED' ELSE 'MEDICINE' END, m."presentation", m."activePrinciple", true, m."isActive", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Medicine" m WHERE m."materialId" IS NULL
ON CONFLICT ("id") DO NOTHING;
UPDATE "Medicine" SET "materialId" = 'health-material-med-' || "id" WHERE "materialId" IS NULL;
INSERT INTO "Material" ("id", "code", "name", "type", "unitOfMeasure", "minStock", "maxStock", "isPerishable", "isActive", "categoryId", "createdAt", "updatedAt")
SELECT 'health-material-vac-' || v."id", 'SAU-VAC-' || substr(md5(v."id"), 1, 20), v."name", 'MATERIAL', 'DOSE', 0, 0, true, v."isActive", (SELECT "id" FROM "MaterialCategory" WHERE "code" = 'SAUDE_ASSISTENCIAL'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Vaccine" v WHERE v."materialId" IS NULL
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "HealthMaterialProfile" ("id", "materialId", "productKind", "patientReleaseAllowed", "isActive", "createdAt", "updatedAt")
SELECT 'health-profile-vac-' || v."id", 'health-material-vac-' || v."id", 'IMMUNOBIOLOGICAL', false, v."isActive", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Vaccine" v WHERE v."materialId" IS NULL
ON CONFLICT ("id") DO NOTHING;
UPDATE "Vaccine" SET "materialId" = 'health-material-vac-' || "id" WHERE "materialId" IS NULL;

CREATE UNIQUE INDEX "Medicine_materialId_key" ON "Medicine"("materialId");
CREATE UNIQUE INDEX "Vaccine_materialId_key" ON "Vaccine"("materialId");
CREATE UNIQUE INDEX "MedicineDispensation_movementId_key" ON "MedicineDispensation"("movementId");
CREATE UNIQUE INDEX "MedicineDispensation_idempotencyKey_key" ON "MedicineDispensation"("idempotencyKey");
CREATE UNIQUE INDEX "VaccinationRecord_movementId_key" ON "VaccinationRecord"("movementId");
CREATE UNIQUE INDEX "VaccinationRecord_idempotencyKey_key" ON "VaccinationRecord"("idempotencyKey");
CREATE INDEX "Warehouse_healthUnitId_isActive_idx" ON "Warehouse"("healthUnitId", "isActive");
CREATE UNIQUE INDEX "HealthMaterialProfile_materialId_key" ON "HealthMaterialProfile"("materialId");
CREATE UNIQUE INDEX "HealthMaterialProfile_barcode_key" ON "HealthMaterialProfile"("barcode");
CREATE INDEX "HealthMaterialProfile_productKind_isActive_idx" ON "HealthMaterialProfile"("productKind", "isActive");
CREATE INDEX "HealthMaterialProfile_sourceCatalog_sourceCode_idx" ON "HealthMaterialProfile"("sourceCatalog", "sourceCode");
CREATE UNIQUE INDEX "HealthStockPolicy_warehouseId_materialId_key" ON "HealthStockPolicy"("warehouseId", "materialId");
CREATE UNIQUE INDEX "HealthStockReceipt_documentId_key" ON "HealthStockReceipt"("documentId");
CREATE UNIQUE INDEX "HealthStockReceipt_idempotencyKey_key" ON "HealthStockReceipt"("idempotencyKey");
CREATE INDEX "HealthStockReceipt_warehouseId_receivedAt_idx" ON "HealthStockReceipt"("warehouseId", "receivedAt");
CREATE INDEX "HealthStockReceipt_invoiceKey_idx" ON "HealthStockReceipt"("invoiceKey");
CREATE UNIQUE INDEX "HealthStockReceiptItem_movementId_key" ON "HealthStockReceiptItem"("movementId");
CREATE UNIQUE INDEX "HealthStockReceiptItem_receiptId_materialId_batchNumber_key" ON "HealthStockReceiptItem"("receiptId", "materialId", "batchNumber");
CREATE UNIQUE INDEX "HealthStockTransfer_requestNumber_key" ON "HealthStockTransfer"("requestNumber");
CREATE UNIQUE INDEX "HealthStockTransfer_idempotencyKey_key" ON "HealthStockTransfer"("idempotencyKey");
CREATE INDEX "HealthStockTransfer_originWarehouseId_status_createdAt_idx" ON "HealthStockTransfer"("originWarehouseId", "status", "createdAt");
CREATE INDEX "HealthStockTransfer_destinationWarehouseId_status_createdAt_idx" ON "HealthStockTransfer"("destinationWarehouseId", "status", "createdAt");
CREATE UNIQUE INDEX "HealthStockTransferItem_departureMovementId_key" ON "HealthStockTransferItem"("departureMovementId");
CREATE UNIQUE INDEX "HealthStockTransferItem_arrivalMovementId_key" ON "HealthStockTransferItem"("arrivalMovementId");
CREATE UNIQUE INDEX "HealthStockTransferItem_transferId_materialId_batchNumber_key" ON "HealthStockTransferItem"("transferId", "materialId", "batchNumber");
CREATE INDEX "PharmacyRequest_destinationWarehouseId_status_requestedAt_idx" ON "PharmacyRequest"("destinationWarehouseId", "status", "requestedAt");
CREATE INDEX "PharmacyRequest_patientId_requestedAt_idx" ON "PharmacyRequest"("patientId", "requestedAt");
CREATE UNIQUE INDEX "PharmacyRequestItem_requestId_materialId_key" ON "PharmacyRequestItem"("requestId", "materialId");
CREATE UNIQUE INDEX "ControlledMedicineBook_warehouseId_period_key" ON "ControlledMedicineBook"("warehouseId", "period");
CREATE UNIQUE INDEX "HealthAssistentialDevice_code_key" ON "HealthAssistentialDevice"("code");
CREATE INDEX "HealthAssistentialDevice_domain_isActive_idx" ON "HealthAssistentialDevice"("domain", "isActive");
CREATE UNIQUE INDEX "HealthDeviceMessage_idempotencyKey_key" ON "HealthDeviceMessage"("idempotencyKey");
CREATE INDEX "HealthDeviceMessage_deviceId_createdAt_idx" ON "HealthDeviceMessage"("deviceId", "createdAt");
CREATE INDEX "HealthDeviceMessage_correlationId_idx" ON "HealthDeviceMessage"("correlationId");
CREATE UNIQUE INDEX "HealthLabQuestionnaire_code_key" ON "HealthLabQuestionnaire"("code");
CREATE UNIQUE INDEX "HealthLabQuestionGroup_questionnaireId_displayOrder_key" ON "HealthLabQuestionGroup"("questionnaireId", "displayOrder");
CREATE UNIQUE INDEX "HealthLabQuestionItem_groupId_code_key" ON "HealthLabQuestionItem"("groupId", "code");
CREATE UNIQUE INDEX "HealthLabQuestionItem_groupId_displayOrder_key" ON "HealthLabQuestionItem"("groupId", "displayOrder");
CREATE UNIQUE INDEX "HealthLabExamModel_code_key" ON "HealthLabExamModel"("code");
CREATE INDEX "HealthLabExamModel_isActive_name_idx" ON "HealthLabExamModel"("isActive", "name");
CREATE UNIQUE INDEX "HealthLabExamMaterial_examModelId_materialId_key" ON "HealthLabExamMaterial"("examModelId", "materialId");
CREATE INDEX "HealthLabSchedule_unitId_examModelId_isActive_idx" ON "HealthLabSchedule"("unitId", "examModelId", "isActive");
CREATE UNIQUE INDEX "HealthLabProviderQuota_providerSupplierId_unitId_examModelId_period_key" ON "HealthLabProviderQuota"("providerSupplierId", "unitId", "examModelId", "period");
CREATE UNIQUE INDEX "HealthLabOrder_examRequestId_key" ON "HealthLabOrder"("examRequestId");
CREATE UNIQUE INDEX "HealthLabOrder_sampleBarcode_key" ON "HealthLabOrder"("sampleBarcode");
CREATE UNIQUE INDEX "HealthLabOrder_authorizationKey_key" ON "HealthLabOrder"("authorizationKey");
CREATE UNIQUE INDEX "HealthLabOrder_idempotencyKey_key" ON "HealthLabOrder"("idempotencyKey");
CREATE INDEX "HealthLabOrder_status_priority_createdAt_idx" ON "HealthLabOrder"("status", "priority", "createdAt");
CREATE INDEX "HealthLabOrder_patientId_createdAt_idx" ON "HealthLabOrder"("patientId", "createdAt");
CREATE INDEX "HealthLabOrder_collectionUnitId_scheduledAt_idx" ON "HealthLabOrder"("collectionUnitId", "scheduledAt");
CREATE UNIQUE INDEX "HealthLabResult_orderId_version_key" ON "HealthLabResult"("orderId", "version");
CREATE INDEX "HealthLabResult_deviceCorrelationId_idx" ON "HealthLabResult"("deviceCorrelationId");
CREATE INDEX "HealthLabOrderEvent_orderId_createdAt_idx" ON "HealthLabOrderEvent"("orderId", "createdAt");
CREATE UNIQUE INDEX "HealthLabReport_documentId_key" ON "HealthLabReport"("documentId");
CREATE INDEX "HealthLabReport_orderId_status_idx" ON "HealthLabReport"("orderId", "status");
CREATE UNIQUE INDEX "SpecializedCatalogItem_category_code_key" ON "SpecializedCatalogItem"("category", "code");
CREATE INDEX "SpecializedCatalogItem_category_isActive_name_idx" ON "SpecializedCatalogItem"("category", "isActive", "name");
CREATE UNIQUE INDEX "SpecializedTeamSchedule_teamId_unitId_month_key" ON "SpecializedTeamSchedule"("teamId", "unitId", "month");
CREATE INDEX "SpecializedTherapeuticPlan_patientId_status_startedAt_idx" ON "SpecializedTherapeuticPlan"("patientId", "status", "startedAt");
CREATE INDEX "SpecializedTherapeuticPlan_teamId_status_idx" ON "SpecializedTherapeuticPlan"("teamId", "status");
CREATE INDEX "SpecializedPlanEntry_planId_createdAt_idx" ON "SpecializedPlanEntry"("planId", "createdAt");
CREATE INDEX "SpecializedPlanEntry_professionalId_createdAt_idx" ON "SpecializedPlanEntry"("professionalId", "createdAt");
CREATE UNIQUE INDEX "SpecializedQuota_patientId_materialId_period_key" ON "SpecializedQuota"("patientId", "materialId", "period");
CREATE UNIQUE INDEX "SpecializedDistribution_movementId_key" ON "SpecializedDistribution"("movementId");
CREATE INDEX "SpecializedDistribution_patientId_deliveredAt_idx" ON "SpecializedDistribution"("patientId", "deliveredAt");
CREATE INDEX "SpecializedDistribution_planId_deliveredAt_idx" ON "SpecializedDistribution"("planId", "deliveredAt");

ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_healthUnitId_fkey" FOREIGN KEY ("healthUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vaccine" ADD CONSTRAINT "Vaccine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthMaterialProfile" ADD CONSTRAINT "HealthMaterialProfile_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthMaterialProfile" ADD CONSTRAINT "HealthMaterialProfile_manufacturerSupplierId_fkey" FOREIGN KEY ("manufacturerSupplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockPolicy" ADD CONSTRAINT "HealthStockPolicy_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockPolicy" ADD CONSTRAINT "HealthStockPolicy_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockReceipt" ADD CONSTRAINT "HealthStockReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockReceipt" ADD CONSTRAINT "HealthStockReceipt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockReceipt" ADD CONSTRAINT "HealthStockReceipt_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockReceiptItem" ADD CONSTRAINT "HealthStockReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "HealthStockReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthStockReceiptItem" ADD CONSTRAINT "HealthStockReceiptItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockReceiptItem" ADD CONSTRAINT "HealthStockReceiptItem_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockTransfer" ADD CONSTRAINT "HealthStockTransfer_originWarehouseId_fkey" FOREIGN KEY ("originWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockTransfer" ADD CONSTRAINT "HealthStockTransfer_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockTransferItem" ADD CONSTRAINT "HealthStockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "HealthStockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthStockTransferItem" ADD CONSTRAINT "HealthStockTransferItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockTransferItem" ADD CONSTRAINT "HealthStockTransferItem_departureMovementId_fkey" FOREIGN KEY ("departureMovementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthStockTransferItem" ADD CONSTRAINT "HealthStockTransferItem_arrivalMovementId_fkey" FOREIGN KEY ("arrivalMovementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PharmacyRequest" ADD CONSTRAINT "PharmacyRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PharmacyRequest" ADD CONSTRAINT "PharmacyRequest_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PharmacyRequestItem" ADD CONSTRAINT "PharmacyRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PharmacyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PharmacyRequestItem" ADD CONSTRAINT "PharmacyRequestItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthDeviceMessage" ADD CONSTRAINT "HealthDeviceMessage_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "HealthAssistentialDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ControlledMedicineBook" ADD CONSTRAINT "ControlledMedicineBook_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthAssistentialDevice" ADD CONSTRAINT "HealthAssistentialDevice_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabQuestionGroup" ADD CONSTRAINT "HealthLabQuestionGroup_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "HealthLabQuestionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthLabQuestionItem" ADD CONSTRAINT "HealthLabQuestionItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "HealthLabQuestionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthLabExamModel" ADD CONSTRAINT "HealthLabExamModel_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabExamModel" ADD CONSTRAINT "HealthLabExamModel_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "HealthLabQuestionnaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabExamMaterial" ADD CONSTRAINT "HealthLabExamMaterial_examModelId_fkey" FOREIGN KEY ("examModelId") REFERENCES "HealthLabExamModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthLabExamMaterial" ADD CONSTRAINT "HealthLabExamMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabSchedule" ADD CONSTRAINT "HealthLabSchedule_examModelId_fkey" FOREIGN KEY ("examModelId") REFERENCES "HealthLabExamModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabSchedule" ADD CONSTRAINT "HealthLabSchedule_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabProviderQuota" ADD CONSTRAINT "HealthLabProviderQuota_providerSupplierId_fkey" FOREIGN KEY ("providerSupplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabProviderQuota" ADD CONSTRAINT "HealthLabProviderQuota_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabProviderQuota" ADD CONSTRAINT "HealthLabProviderQuota_examModelId_fkey" FOREIGN KEY ("examModelId") REFERENCES "HealthLabExamModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_examRequestId_fkey" FOREIGN KEY ("examRequestId") REFERENCES "HealthExamRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_examModelId_fkey" FOREIGN KEY ("examModelId") REFERENCES "HealthLabExamModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_requestUnitId_fkey" FOREIGN KEY ("requestUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_collectionUnitId_fkey" FOREIGN KEY ("collectionUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_collectorProfessionalId_fkey" FOREIGN KEY ("collectorProfessionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_providerSupplierId_fkey" FOREIGN KEY ("providerSupplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabResult" ADD CONSTRAINT "HealthLabResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HealthLabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabOrderEvent" ADD CONSTRAINT "HealthLabOrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HealthLabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabReport" ADD CONSTRAINT "HealthLabReport_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HealthLabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabReport" ADD CONSTRAINT "HealthLabReport_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthLabReport" ADD CONSTRAINT "HealthLabReport_reviewerProfessionalId_fkey" FOREIGN KEY ("reviewerProfessionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedCatalogItem" ADD CONSTRAINT "SpecializedCatalogItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedTeamSchedule" ADD CONSTRAINT "SpecializedTeamSchedule_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedTeamSchedule" ADD CONSTRAINT "SpecializedTeamSchedule_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedTherapeuticPlan" ADD CONSTRAINT "SpecializedTherapeuticPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedTherapeuticPlan" ADD CONSTRAINT "SpecializedTherapeuticPlan_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedTherapeuticPlan" ADD CONSTRAINT "SpecializedTherapeuticPlan_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedTherapeuticPlan" ADD CONSTRAINT "SpecializedTherapeuticPlan_initialMedicalRecordId_fkey" FOREIGN KEY ("initialMedicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedPlanEntry" ADD CONSTRAINT "SpecializedPlanEntry_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SpecializedTherapeuticPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedPlanEntry" ADD CONSTRAINT "SpecializedPlanEntry_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedPlanEntry" ADD CONSTRAINT "SpecializedPlanEntry_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedPlanEntry" ADD CONSTRAINT "SpecializedPlanEntry_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedPlanEntry" ADD CONSTRAINT "SpecializedPlanEntry_healthServiceId_fkey" FOREIGN KEY ("healthServiceId") REFERENCES "HealthService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SpecializedQuota" ADD CONSTRAINT "SpecializedQuota_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedQuota" ADD CONSTRAINT "SpecializedQuota_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SpecializedTherapeuticPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "SpecializedQuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MaterialStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "HealthPrescriptionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MaterialStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_dispensedByProfessionalId_fkey" FOREIGN KEY ("dispensedByProfessionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_specializedPlanId_fkey" FOREIGN KEY ("specializedPlanId") REFERENCES "SpecializedTherapeuticPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MaterialStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
