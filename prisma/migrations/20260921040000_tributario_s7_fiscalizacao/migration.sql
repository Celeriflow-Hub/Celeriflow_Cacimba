-- CreateTable
CREATE TABLE "FiscalAuditPlan" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "planType" TEXT NOT NULL DEFAULT 'ANUAL',
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "cnaeFilter" TEXT,
    "serviceItemFilter" TEXT,
    "neighborhoodFilter" TEXT,
    "streetFilter" TEXT,
    "propertyTypeFilter" TEXT,
    "fiscalSectorFilter" TEXT,
    "fiscalZoneFilter" TEXT,
    "filterSnapshot" JSONB NOT NULL,
    "createdByUsuarioId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalAuditPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalAuditPlanSelection" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "taxpayerId" TEXT,
    "realEstateId" TEXT,
    "subjectLabel" TEXT NOT NULL,
    "sourceData" JSONB NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalAuditPlanSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalAuditPlanInspector" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FISCAL',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalAuditPlanInspector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalAuditPlanEvent" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalAuditPlanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalServiceOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "originType" TEXT NOT NULL,
    "planId" TEXT,
    "taxpayerId" TEXT,
    "realEstateId" TEXT,
    "responsibleEmployeeId" TEXT NOT NULL,
    "requestedByEmployeeId" TEXT,
    "processId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EMITIDA',
    "reason" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalServiceOrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalServiceOrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalInspectionDocument" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "documentId" TEXT,
    "documentKind" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EMITIDO',
    "templateCode" TEXT,
    "contentSnapshot" JSONB NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "issuedByEmployeeId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalInspectionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalDocumentRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADO',
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "receivedDocumentId" TEXT,
    "receivedAt" TIMESTAMP(3),
    "receivedBy" TEXT,
    "returnedAt" TIMESTAMP(3),
    "returnedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalDocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalAssessmentMap" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "obligationType" TEXT NOT NULL DEFAULT 'PRINCIPAL',
    "competence" TEXT NOT NULL,
    "originalBaseDecimal" DECIMAL(18,2) NOT NULL,
    "assessedBaseDecimal" DECIMAL(18,2) NOT NULL,
    "rate" DECIMAL(9,6) NOT NULL,
    "principalDecimal" DECIMAL(18,2) NOT NULL,
    "penaltyDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "interestDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "correctionDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalDecimal" DECIMAL(18,2) NOT NULL,
    "calculationSnapshot" JSONB NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalAssessmentMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalDocumentTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentKind" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "requiredFields" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalDocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalPenaltyRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "obligationType" TEXT NOT NULL,
    "penaltyRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "discountRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "interestRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "correctionRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "discountDeadlineDays" INTEGER,
    "legalBasis" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalPenaltyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalMeshFinding" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "findingType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INDICIO',
    "nfseDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "simplesDeclaredDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "cardDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "desifDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "comparableBaseDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "differenceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "rate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "potentialTaxDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "causes" JSONB NOT NULL,
    "sourceSnapshot" JSONB NOT NULL,
    "lastProcessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalMeshFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalMeshOrderLink" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalMeshOrderLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalProductivityTaskRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "points" DECIMAL(9,2) NOT NULL,
    "valueRanges" JSONB,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalProductivityTaskRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalProductivityConfig" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "pointValueDecimal" DECIMAL(18,2) NOT NULL,
    "maxAmountDecimal" DECIMAL(18,2) NOT NULL,
    "maxPoints" DECIMAL(9,2),
    "salaryBaseReferenceDecimal" DECIMAL(18,2),
    "fixedComponentDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "variablePolicy" JSONB NOT NULL,
    "vacationPolicy" JSONB,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalProductivityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalProductivityEntry" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "orderId" TEXT,
    "taskRuleId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "taskLabel" TEXT NOT NULL,
    "sourceValueDecimal" DECIMAL(18,2),
    "points" DECIMAL(9,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EXECUTADA',
    "executedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalProductivityEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalProductivityPeriod" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APURADA',
    "pointsDecimal" DECIMAL(9,2) NOT NULL,
    "pointValueDecimal" DECIMAL(18,2) NOT NULL,
    "grossAmountDecimal" DECIMAL(18,2) NOT NULL,
    "cappedAmountDecimal" DECIMAL(18,2) NOT NULL,
    "excessAmountDecimal" DECIMAL(18,2) NOT NULL,
    "adjustmentDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "finalAmountDecimal" DECIMAL(18,2) NOT NULL,
    "calculationSnapshot" JSONB NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalProductivityPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalProductivityLedger" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "amountDecimal" DECIMAL(18,2) NOT NULL,
    "description" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "authorizedByUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalProductivityLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FiscalAuditPlan_year_status_planType_idx" ON "FiscalAuditPlan"("year", "status", "planType");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalAuditPlan_year_name_planType_key" ON "FiscalAuditPlan"("year", "name", "planType");

-- CreateIndex
CREATE INDEX "FiscalAuditPlanSelection_taxpayerId_idx" ON "FiscalAuditPlanSelection"("taxpayerId");

-- CreateIndex
CREATE INDEX "FiscalAuditPlanSelection_realEstateId_idx" ON "FiscalAuditPlanSelection"("realEstateId");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalAuditPlanSelection_planId_taxpayerId_realEstateId_key" ON "FiscalAuditPlanSelection"("planId", "taxpayerId", "realEstateId");

-- CreateIndex
CREATE INDEX "FiscalAuditPlanInspector_employeeId_idx" ON "FiscalAuditPlanInspector"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalAuditPlanInspector_planId_employeeId_key" ON "FiscalAuditPlanInspector"("planId", "employeeId");

-- CreateIndex
CREATE INDEX "FiscalAuditPlanEvent_planId_createdAt_idx" ON "FiscalAuditPlanEvent"("planId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalServiceOrder_orderNumber_key" ON "FiscalServiceOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalServiceOrder_sourceKey_key" ON "FiscalServiceOrder"("sourceKey");

-- CreateIndex
CREATE INDEX "FiscalServiceOrder_responsibleEmployeeId_status_issuedAt_idx" ON "FiscalServiceOrder"("responsibleEmployeeId", "status", "issuedAt");

-- CreateIndex
CREATE INDEX "FiscalServiceOrder_taxpayerId_status_idx" ON "FiscalServiceOrder"("taxpayerId", "status");

-- CreateIndex
CREATE INDEX "FiscalServiceOrder_realEstateId_status_idx" ON "FiscalServiceOrder"("realEstateId", "status");

-- CreateIndex
CREATE INDEX "FiscalServiceOrder_planId_idx" ON "FiscalServiceOrder"("planId");

-- CreateIndex
CREATE INDEX "FiscalServiceOrder_processId_idx" ON "FiscalServiceOrder"("processId");

-- CreateIndex
CREATE INDEX "FiscalServiceOrderEvent_orderId_createdAt_idx" ON "FiscalServiceOrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalInspectionDocument_documentNumber_key" ON "FiscalInspectionDocument"("documentNumber");

-- CreateIndex
CREATE INDEX "FiscalInspectionDocument_orderId_documentKind_status_idx" ON "FiscalInspectionDocument"("orderId", "documentKind", "status");

-- CreateIndex
CREATE INDEX "FiscalInspectionDocument_documentId_idx" ON "FiscalInspectionDocument"("documentId");

-- CreateIndex
CREATE INDEX "FiscalDocumentRequest_orderId_status_deadlineAt_idx" ON "FiscalDocumentRequest"("orderId", "status", "deadlineAt");

-- CreateIndex
CREATE INDEX "FiscalAssessmentMap_orderId_status_idx" ON "FiscalAssessmentMap"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalAssessmentMap_orderId_version_obligationType_key" ON "FiscalAssessmentMap"("orderId", "version", "obligationType");

-- CreateIndex
CREATE INDEX "FiscalDocumentTemplate_documentKind_status_effectiveFrom_idx" ON "FiscalDocumentTemplate"("documentKind", "status", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalDocumentTemplate_code_version_key" ON "FiscalDocumentTemplate"("code", "version");

-- CreateIndex
CREATE INDEX "FiscalPenaltyRule_obligationType_active_effectiveFrom_idx" ON "FiscalPenaltyRule"("obligationType", "active", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalPenaltyRule_code_effectiveFrom_key" ON "FiscalPenaltyRule"("code", "effectiveFrom");

-- CreateIndex
CREATE INDEX "FiscalMeshFinding_competence_status_differenceDecimal_idx" ON "FiscalMeshFinding"("competence", "status", "differenceDecimal");

-- CreateIndex
CREATE INDEX "FiscalMeshFinding_taxpayerId_status_idx" ON "FiscalMeshFinding"("taxpayerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalMeshFinding_taxpayerId_competence_findingType_key" ON "FiscalMeshFinding"("taxpayerId", "competence", "findingType");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalMeshOrderLink_findingId_orderId_key" ON "FiscalMeshOrderLink"("findingId", "orderId");

-- CreateIndex
CREATE INDEX "FiscalProductivityTaskRule_active_effectiveFrom_idx" ON "FiscalProductivityTaskRule"("active", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalProductivityTaskRule_code_effectiveFrom_key" ON "FiscalProductivityTaskRule"("code", "effectiveFrom");

-- CreateIndex
CREATE INDEX "FiscalProductivityConfig_employeeId_active_effectiveFrom_idx" ON "FiscalProductivityConfig"("employeeId", "active", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalProductivityConfig_employeeId_effectiveFrom_key" ON "FiscalProductivityConfig"("employeeId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalProductivityEntry_sourceKey_key" ON "FiscalProductivityEntry"("sourceKey");

-- CreateIndex
CREATE INDEX "FiscalProductivityEntry_employeeId_competence_status_idx" ON "FiscalProductivityEntry"("employeeId", "competence", "status");

-- CreateIndex
CREATE INDEX "FiscalProductivityEntry_orderId_idx" ON "FiscalProductivityEntry"("orderId");

-- CreateIndex
CREATE INDEX "FiscalProductivityPeriod_competence_status_idx" ON "FiscalProductivityPeriod"("competence", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalProductivityPeriod_employeeId_competence_key" ON "FiscalProductivityPeriod"("employeeId", "competence");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalProductivityLedger_idempotencyKey_key" ON "FiscalProductivityLedger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "FiscalProductivityLedger_periodId_createdAt_idx" ON "FiscalProductivityLedger"("periodId", "createdAt");

-- AddForeignKey
ALTER TABLE "FiscalAuditPlanSelection" ADD CONSTRAINT "FiscalAuditPlanSelection_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FiscalAuditPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalAuditPlanInspector" ADD CONSTRAINT "FiscalAuditPlanInspector_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FiscalAuditPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalAuditPlanEvent" ADD CONSTRAINT "FiscalAuditPlanEvent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FiscalAuditPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalServiceOrder" ADD CONSTRAINT "FiscalServiceOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FiscalAuditPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalServiceOrderEvent" ADD CONSTRAINT "FiscalServiceOrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FiscalServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalInspectionDocument" ADD CONSTRAINT "FiscalInspectionDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FiscalServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocumentRequest" ADD CONSTRAINT "FiscalDocumentRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FiscalServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalAssessmentMap" ADD CONSTRAINT "FiscalAssessmentMap_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FiscalServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalMeshOrderLink" ADD CONSTRAINT "FiscalMeshOrderLink_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "FiscalMeshFinding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalMeshOrderLink" ADD CONSTRAINT "FiscalMeshOrderLink_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FiscalServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalProductivityEntry" ADD CONSTRAINT "FiscalProductivityEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FiscalServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalProductivityEntry" ADD CONSTRAINT "FiscalProductivityEntry_taskRuleId_fkey" FOREIGN KEY ("taskRuleId") REFERENCES "FiscalProductivityTaskRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalProductivityLedger" ADD CONSTRAINT "FiscalProductivityLedger_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "FiscalProductivityPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
