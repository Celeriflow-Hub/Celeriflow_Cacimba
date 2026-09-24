-- Additive persistence for procurement aggregation, bidding, supplier portal
-- identities, and contract/covenant execution. Existing header records stay
-- unchanged; all new references are carried by child tables.

CREATE TABLE "PurchaseRequestItemBudgetAllocation" (
    "id" TEXT NOT NULL,
    "purchaseRequestItemId" TEXT NOT NULL,
    "budgetAppropriationId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "valueDecimal" DECIMAL(18, 2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PurchaseRequestItemBudgetAllocation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PurchaseRequestItemBudgetAllocation_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "PurchaseRequestItemBudgetAllocation_valueDecimal_check" CHECK ("valueDecimal" >= 0)
);

CREATE TABLE "PurchaseProcessRequestOrigin" (
    "id" TEXT NOT NULL,
    "purchaseProcessId" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PurchaseProcessRequestOrigin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseProcessItemOrigin" (
    "id" TEXT NOT NULL,
    "purchaseProcessItemId" TEXT NOT NULL,
    "purchaseRequestItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PurchaseProcessItemOrigin_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PurchaseProcessItemOrigin_quantity_check" CHECK ("quantity" > 0)
);

CREATE TABLE "SupplierPortalIdentity" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupplierPortalIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BiddingAppointment" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appointmentDocumentId" TEXT,
    "appointedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BiddingAppointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BiddingAppointmentMember" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "appointedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BiddingAppointmentMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BiddingAppointmentAssignment" (
    "id" TEXT NOT NULL,
    "biddingId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "role" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BiddingAppointmentAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BiddingPhase" (
    "id" TEXT NOT NULL,
    "biddingId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BiddingPhase_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BiddingPhase_sequence_check" CHECK ("sequence" > 0),
    CONSTRAINT "BiddingPhase_version_check" CHECK ("version" > 0)
);

CREATE TABLE "BiddingLot" (
    "id" TEXT NOT NULL,
    "biddingId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "estimatedValueDecimal" DECIMAL(18, 2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BiddingLot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BiddingLot_number_check" CHECK ("number" > 0),
    CONSTRAINT "BiddingLot_estimatedValueDecimal_check" CHECK ("estimatedValueDecimal" IS NULL OR "estimatedValueDecimal" >= 0)
);

CREATE TABLE "BiddingAct" (
    "id" TEXT NOT NULL,
    "biddingId" TEXT NOT NULL,
    "phaseId" TEXT,
    "biddingLotId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Registrado',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT,
    "actorUsuarioId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BiddingAct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BiddingParticipant" (
    "id" TEXT NOT NULL,
    "biddingId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "displayCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Inscrito',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BiddingParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BiddingLotItem" (
    "id" TEXT NOT NULL,
    "biddingLotId" TEXT NOT NULL,
    "purchaseProcessItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BiddingLotItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BiddingLotItem_quantity_check" CHECK ("quantity" > 0)
);

CREATE TABLE "BiddingBid" (
    "id" TEXT NOT NULL,
    "biddingLotId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "supplierPortalIdentityId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Lance',
    "unitValueDecimal" DECIMAL(18, 2),
    "totalValueDecimal" DECIMAL(18, 2) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Aceito',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BiddingBid_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BiddingBid_sequence_check" CHECK ("sequence" > 0),
    CONSTRAINT "BiddingBid_unitValueDecimal_check" CHECK ("unitValueDecimal" IS NULL OR "unitValueDecimal" > 0),
    CONSTRAINT "BiddingBid_totalValueDecimal_check" CHECK ("totalValueDecimal" > 0)
);

CREATE TABLE "BiddingEligibility" (
    "id" TEXT NOT NULL,
    "biddingLotId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "documentId" TEXT,
    "decidedByUsuarioId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BiddingEligibility_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BiddingResult" (
    "id" TEXT NOT NULL,
    "biddingLotId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "biddingBidId" TEXT,
    "biddingActId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Arrematado',
    "reason" TEXT,
    "unitValueDecimal" DECIMAL(18, 2),
    "totalValueDecimal" DECIMAL(18, 2) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "decidedByUsuarioId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BiddingResult_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BiddingResult_unitValueDecimal_check" CHECK ("unitValueDecimal" IS NULL OR "unitValueDecimal" >= 0),
    CONSTRAINT "BiddingResult_totalValueDecimal_check" CHECK ("totalValueDecimal" >= 0)
);

CREATE TABLE "InstrumentResponsibilityGroup" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "covenantId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstrumentResponsibilityGroup_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InstrumentResponsibilityGroup_one_parent_check" CHECK (
        ("contractId" IS NOT NULL AND "covenantId" IS NULL)
        OR ("contractId" IS NULL AND "covenantId" IS NOT NULL)
    )
);

CREATE TABLE "InstrumentParty" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "covenantId" TEXT,
    "role" TEXT NOT NULL,
    "supplierId" TEXT,
    "personId" TEXT,
    "companyId" TEXT,
    "employeeId" TEXT,
    "responsibilityGroupId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstrumentParty_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InstrumentParty_one_parent_check" CHECK (
        ("contractId" IS NOT NULL AND "covenantId" IS NULL)
        OR ("contractId" IS NULL AND "covenantId" IS NOT NULL)
    ),
    CONSTRAINT "InstrumentParty_one_identity_check" CHECK (
        (CASE WHEN "supplierId" IS NULL THEN 0 ELSE 1 END)
        + (CASE WHEN "personId" IS NULL THEN 0 ELSE 1 END)
        + (CASE WHEN "companyId" IS NULL THEN 0 ELSE 1 END)
        + (CASE WHEN "employeeId" IS NULL THEN 0 ELSE 1 END) = 1
    )
);

CREATE TABLE "InstrumentMeasurement" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "covenantId" TEXT,
    "number" INTEGER NOT NULL,
    "description" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "valueDecimal" DECIMAL(18, 2) NOT NULL,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstrumentMeasurement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InstrumentMeasurement_one_parent_check" CHECK (
        ("contractId" IS NOT NULL AND "covenantId" IS NULL)
        OR ("contractId" IS NULL AND "covenantId" IS NOT NULL)
    ),
    CONSTRAINT "InstrumentMeasurement_number_check" CHECK ("number" > 0),
    CONSTRAINT "InstrumentMeasurement_quantity_check" CHECK ("quantity" IS NULL OR "quantity" >= 0),
    CONSTRAINT "InstrumentMeasurement_valueDecimal_check" CHECK ("valueDecimal" >= 0)
);

CREATE TABLE "InstrumentMeasurementItem" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "purchaseProcessItemId" TEXT,
    "purchaseReceiptItemId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitValueDecimal" DECIMAL(18, 2),
    "valueDecimal" DECIMAL(18, 2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstrumentMeasurementItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InstrumentMeasurementItem_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "InstrumentMeasurementItem_unitValueDecimal_check" CHECK ("unitValueDecimal" IS NULL OR "unitValueDecimal" >= 0),
    CONSTRAINT "InstrumentMeasurementItem_valueDecimal_check" CHECK ("valueDecimal" >= 0)
);

CREATE TABLE "InstrumentInstallment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "covenantId" TEXT,
    "number" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "valueDecimal" DECIMAL(18, 2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Programada',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstrumentInstallment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InstrumentInstallment_one_parent_check" CHECK (
        ("contractId" IS NOT NULL AND "covenantId" IS NULL)
        OR ("contractId" IS NULL AND "covenantId" IS NOT NULL)
    ),
    CONSTRAINT "InstrumentInstallment_number_check" CHECK ("number" > 0),
    CONSTRAINT "InstrumentInstallment_quantity_check" CHECK ("quantity" IS NULL OR "quantity" >= 0),
    CONSTRAINT "InstrumentInstallment_valueDecimal_check" CHECK ("valueDecimal" >= 0)
);

CREATE UNIQUE INDEX "PurchaseRequestItemBudgetAllocation_purchaseRequestItemId_budgetAppropriationId_key"
  ON "PurchaseRequestItemBudgetAllocation"("purchaseRequestItemId", "budgetAppropriationId");
CREATE INDEX "PurchaseRequestItemBudgetAllocation_budgetAppropriationId_idx"
  ON "PurchaseRequestItemBudgetAllocation"("budgetAppropriationId");

CREATE UNIQUE INDEX "PurchaseProcessRequestOrigin_purchaseProcessId_purchaseRequestId_key"
  ON "PurchaseProcessRequestOrigin"("purchaseProcessId", "purchaseRequestId");
CREATE INDEX "PurchaseProcessRequestOrigin_purchaseRequestId_idx"
  ON "PurchaseProcessRequestOrigin"("purchaseRequestId");

CREATE UNIQUE INDEX "PurchaseProcessItemOrigin_purchaseProcessItemId_purchaseRequestItemId_key"
  ON "PurchaseProcessItemOrigin"("purchaseProcessItemId", "purchaseRequestItemId");
CREATE INDEX "PurchaseProcessItemOrigin_purchaseRequestItemId_idx"
  ON "PurchaseProcessItemOrigin"("purchaseRequestItemId");

CREATE UNIQUE INDEX "SupplierPortalIdentity_supplierId_usuarioId_key"
  ON "SupplierPortalIdentity"("supplierId", "usuarioId");
CREATE INDEX "SupplierPortalIdentity_usuarioId_status_idx"
  ON "SupplierPortalIdentity"("usuarioId", "status");

CREATE INDEX "BiddingAppointment_kind_status_idx"
  ON "BiddingAppointment"("kind", "status");
CREATE INDEX "BiddingAppointment_appointmentDocumentId_idx"
  ON "BiddingAppointment"("appointmentDocumentId");

CREATE UNIQUE INDEX "BiddingAppointmentMember_appointmentId_employeeId_role_key"
  ON "BiddingAppointmentMember"("appointmentId", "employeeId", "role");
CREATE INDEX "BiddingAppointmentMember_employeeId_status_idx"
  ON "BiddingAppointmentMember"("employeeId", "status");

CREATE UNIQUE INDEX "BiddingAppointmentAssignment_biddingId_appointmentId_key"
  ON "BiddingAppointmentAssignment"("biddingId", "appointmentId");
CREATE INDEX "BiddingAppointmentAssignment_appointmentId_status_idx"
  ON "BiddingAppointmentAssignment"("appointmentId", "status");

CREATE UNIQUE INDEX "BiddingPhase_biddingId_code_version_key"
  ON "BiddingPhase"("biddingId", "code", "version");
CREATE UNIQUE INDEX "BiddingPhase_biddingId_sequence_version_key"
  ON "BiddingPhase"("biddingId", "sequence", "version");
CREATE INDEX "BiddingPhase_biddingId_isCurrent_sequence_idx"
  ON "BiddingPhase"("biddingId", "isCurrent", "sequence");

CREATE UNIQUE INDEX "BiddingAct_idempotencyKey_key"
  ON "BiddingAct"("idempotencyKey");
CREATE INDEX "BiddingAct_biddingId_occurredAt_idx"
  ON "BiddingAct"("biddingId", "occurredAt");
CREATE INDEX "BiddingAct_phaseId_idx"
  ON "BiddingAct"("phaseId");
CREATE INDEX "BiddingAct_biddingLotId_occurredAt_idx"
  ON "BiddingAct"("biddingLotId", "occurredAt");
CREATE INDEX "BiddingAct_actorUsuarioId_idx"
  ON "BiddingAct"("actorUsuarioId");

CREATE UNIQUE INDEX "BiddingParticipant_biddingId_supplierId_key"
  ON "BiddingParticipant"("biddingId", "supplierId");
CREATE UNIQUE INDEX "BiddingParticipant_biddingId_displayCode_key"
  ON "BiddingParticipant"("biddingId", "displayCode");
CREATE INDEX "BiddingParticipant_supplierId_status_idx"
  ON "BiddingParticipant"("supplierId", "status");

CREATE UNIQUE INDEX "BiddingLot_biddingId_number_key"
  ON "BiddingLot"("biddingId", "number");
CREATE INDEX "BiddingLot_biddingId_status_idx"
  ON "BiddingLot"("biddingId", "status");

CREATE UNIQUE INDEX "BiddingLotItem_biddingLotId_purchaseProcessItemId_key"
  ON "BiddingLotItem"("biddingLotId", "purchaseProcessItemId");
CREATE INDEX "BiddingLotItem_purchaseProcessItemId_idx"
  ON "BiddingLotItem"("purchaseProcessItemId");

CREATE UNIQUE INDEX "BiddingBid_idempotencyKey_key"
  ON "BiddingBid"("idempotencyKey");
CREATE UNIQUE INDEX "BiddingBid_biddingLotId_sequence_key"
  ON "BiddingBid"("biddingLotId", "sequence");
CREATE INDEX "BiddingBid_participantId_submittedAt_idx"
  ON "BiddingBid"("participantId", "submittedAt");
CREATE INDEX "BiddingBid_supplierPortalIdentityId_idx"
  ON "BiddingBid"("supplierPortalIdentityId");

CREATE UNIQUE INDEX "BiddingEligibility_idempotencyKey_key"
  ON "BiddingEligibility"("idempotencyKey");
CREATE INDEX "BiddingEligibility_biddingLotId_participantId_decidedAt_idx"
  ON "BiddingEligibility"("biddingLotId", "participantId", "decidedAt");
CREATE INDEX "BiddingEligibility_decidedByUsuarioId_idx"
  ON "BiddingEligibility"("decidedByUsuarioId");
CREATE INDEX "BiddingEligibility_documentId_idx"
  ON "BiddingEligibility"("documentId");

CREATE UNIQUE INDEX "BiddingResult_biddingActId_key"
  ON "BiddingResult"("biddingActId");
CREATE UNIQUE INDEX "BiddingResult_idempotencyKey_key"
  ON "BiddingResult"("idempotencyKey");
CREATE UNIQUE INDEX "BiddingResult_oneCurrentPerLot_key"
  ON "BiddingResult"("biddingLotId") WHERE "isCurrent";
CREATE INDEX "BiddingResult_biddingLotId_isCurrent_decidedAt_idx"
  ON "BiddingResult"("biddingLotId", "isCurrent", "decidedAt");
CREATE INDEX "BiddingResult_participantId_idx"
  ON "BiddingResult"("participantId");
CREATE INDEX "BiddingResult_biddingBidId_idx"
  ON "BiddingResult"("biddingBidId");
CREATE INDEX "BiddingResult_decidedByUsuarioId_idx"
  ON "BiddingResult"("decidedByUsuarioId");

CREATE UNIQUE INDEX "InstrumentResponsibilityGroup_contractId_name_key"
  ON "InstrumentResponsibilityGroup"("contractId", "name");
CREATE UNIQUE INDEX "InstrumentResponsibilityGroup_covenantId_name_key"
  ON "InstrumentResponsibilityGroup"("covenantId", "name");
CREATE INDEX "InstrumentResponsibilityGroup_contractId_status_idx"
  ON "InstrumentResponsibilityGroup"("contractId", "status");
CREATE INDEX "InstrumentResponsibilityGroup_covenantId_status_idx"
  ON "InstrumentResponsibilityGroup"("covenantId", "status");

CREATE INDEX "InstrumentParty_contractId_role_idx"
  ON "InstrumentParty"("contractId", "role");
CREATE INDEX "InstrumentParty_covenantId_role_idx"
  ON "InstrumentParty"("covenantId", "role");
CREATE INDEX "InstrumentParty_supplierId_idx"
  ON "InstrumentParty"("supplierId");
CREATE INDEX "InstrumentParty_personId_idx"
  ON "InstrumentParty"("personId");
CREATE INDEX "InstrumentParty_companyId_idx"
  ON "InstrumentParty"("companyId");
CREATE INDEX "InstrumentParty_employeeId_idx"
  ON "InstrumentParty"("employeeId");
CREATE INDEX "InstrumentParty_responsibilityGroupId_idx"
  ON "InstrumentParty"("responsibilityGroupId");

CREATE UNIQUE INDEX "InstrumentMeasurement_contractId_number_key"
  ON "InstrumentMeasurement"("contractId", "number");
CREATE UNIQUE INDEX "InstrumentMeasurement_covenantId_number_key"
  ON "InstrumentMeasurement"("covenantId", "number");
CREATE INDEX "InstrumentMeasurement_contractId_measuredAt_idx"
  ON "InstrumentMeasurement"("contractId", "measuredAt");
CREATE INDEX "InstrumentMeasurement_covenantId_measuredAt_idx"
  ON "InstrumentMeasurement"("covenantId", "measuredAt");
CREATE INDEX "InstrumentMeasurement_documentId_idx"
  ON "InstrumentMeasurement"("documentId");

CREATE UNIQUE INDEX "InstrumentMeasurementItem_purchaseReceiptItemId_key"
  ON "InstrumentMeasurementItem"("purchaseReceiptItemId");
CREATE INDEX "InstrumentMeasurementItem_purchaseProcessItemId_idx"
  ON "InstrumentMeasurementItem"("purchaseProcessItemId");

CREATE UNIQUE INDEX "InstrumentInstallment_contractId_number_key"
  ON "InstrumentInstallment"("contractId", "number");
CREATE UNIQUE INDEX "InstrumentInstallment_covenantId_number_key"
  ON "InstrumentInstallment"("covenantId", "number");
CREATE INDEX "InstrumentInstallment_contractId_dueDate_idx"
  ON "InstrumentInstallment"("contractId", "dueDate");
CREATE INDEX "InstrumentInstallment_covenantId_dueDate_idx"
  ON "InstrumentInstallment"("covenantId", "dueDate");
CREATE INDEX "InstrumentInstallment_paymentId_idx"
  ON "InstrumentInstallment"("paymentId");

ALTER TABLE "PurchaseRequestItemBudgetAllocation"
  ADD CONSTRAINT "PurchaseRequestItemBudgetAllocation_purchaseRequestItemId_fkey"
  FOREIGN KEY ("purchaseRequestItemId") REFERENCES "PurchaseRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequestItemBudgetAllocation"
  ADD CONSTRAINT "PurchaseRequestItemBudgetAllocation_budgetAppropriationId_fkey"
  FOREIGN KEY ("budgetAppropriationId") REFERENCES "BudgetAppropriation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseProcessRequestOrigin"
  ADD CONSTRAINT "PurchaseProcessRequestOrigin_purchaseProcessId_fkey"
  FOREIGN KEY ("purchaseProcessId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseProcessRequestOrigin"
  ADD CONSTRAINT "PurchaseProcessRequestOrigin_purchaseRequestId_fkey"
  FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseProcessItemOrigin"
  ADD CONSTRAINT "PurchaseProcessItemOrigin_purchaseProcessItemId_fkey"
  FOREIGN KEY ("purchaseProcessItemId") REFERENCES "PurchaseProcessItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseProcessItemOrigin"
  ADD CONSTRAINT "PurchaseProcessItemOrigin_purchaseRequestItemId_fkey"
  FOREIGN KEY ("purchaseRequestItemId") REFERENCES "PurchaseRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupplierPortalIdentity"
  ADD CONSTRAINT "SupplierPortalIdentity_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierPortalIdentity"
  ADD CONSTRAINT "SupplierPortalIdentity_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiddingAppointment"
  ADD CONSTRAINT "BiddingAppointment_appointmentDocumentId_fkey"
  FOREIGN KEY ("appointmentDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiddingAppointmentMember"
  ADD CONSTRAINT "BiddingAppointmentMember_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "BiddingAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingAppointmentMember"
  ADD CONSTRAINT "BiddingAppointmentMember_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiddingAppointmentAssignment"
  ADD CONSTRAINT "BiddingAppointmentAssignment_biddingId_fkey"
  FOREIGN KEY ("biddingId") REFERENCES "Bidding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingAppointmentAssignment"
  ADD CONSTRAINT "BiddingAppointmentAssignment_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "BiddingAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiddingPhase"
  ADD CONSTRAINT "BiddingPhase_biddingId_fkey"
  FOREIGN KEY ("biddingId") REFERENCES "Bidding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiddingLot"
  ADD CONSTRAINT "BiddingLot_biddingId_fkey"
  FOREIGN KEY ("biddingId") REFERENCES "Bidding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiddingAct"
  ADD CONSTRAINT "BiddingAct_biddingId_fkey"
  FOREIGN KEY ("biddingId") REFERENCES "Bidding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingAct"
  ADD CONSTRAINT "BiddingAct_phaseId_fkey"
  FOREIGN KEY ("phaseId") REFERENCES "BiddingPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingAct"
  ADD CONSTRAINT "BiddingAct_biddingLotId_fkey"
  FOREIGN KEY ("biddingLotId") REFERENCES "BiddingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingAct"
  ADD CONSTRAINT "BiddingAct_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingAct"
  ADD CONSTRAINT "BiddingAct_actorUsuarioId_fkey"
  FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiddingParticipant"
  ADD CONSTRAINT "BiddingParticipant_biddingId_fkey"
  FOREIGN KEY ("biddingId") REFERENCES "Bidding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingParticipant"
  ADD CONSTRAINT "BiddingParticipant_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiddingLotItem"
  ADD CONSTRAINT "BiddingLotItem_biddingLotId_fkey"
  FOREIGN KEY ("biddingLotId") REFERENCES "BiddingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingLotItem"
  ADD CONSTRAINT "BiddingLotItem_purchaseProcessItemId_fkey"
  FOREIGN KEY ("purchaseProcessItemId") REFERENCES "PurchaseProcessItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiddingBid"
  ADD CONSTRAINT "BiddingBid_biddingLotId_fkey"
  FOREIGN KEY ("biddingLotId") REFERENCES "BiddingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingBid"
  ADD CONSTRAINT "BiddingBid_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "BiddingParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingBid"
  ADD CONSTRAINT "BiddingBid_supplierPortalIdentityId_fkey"
  FOREIGN KEY ("supplierPortalIdentityId") REFERENCES "SupplierPortalIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiddingEligibility"
  ADD CONSTRAINT "BiddingEligibility_biddingLotId_fkey"
  FOREIGN KEY ("biddingLotId") REFERENCES "BiddingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingEligibility"
  ADD CONSTRAINT "BiddingEligibility_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "BiddingParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingEligibility"
  ADD CONSTRAINT "BiddingEligibility_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingEligibility"
  ADD CONSTRAINT "BiddingEligibility_decidedByUsuarioId_fkey"
  FOREIGN KEY ("decidedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiddingResult"
  ADD CONSTRAINT "BiddingResult_biddingLotId_fkey"
  FOREIGN KEY ("biddingLotId") REFERENCES "BiddingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingResult"
  ADD CONSTRAINT "BiddingResult_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "BiddingParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingResult"
  ADD CONSTRAINT "BiddingResult_biddingBidId_fkey"
  FOREIGN KEY ("biddingBidId") REFERENCES "BiddingBid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingResult"
  ADD CONSTRAINT "BiddingResult_biddingActId_fkey"
  FOREIGN KEY ("biddingActId") REFERENCES "BiddingAct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BiddingResult"
  ADD CONSTRAINT "BiddingResult_decidedByUsuarioId_fkey"
  FOREIGN KEY ("decidedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InstrumentResponsibilityGroup"
  ADD CONSTRAINT "InstrumentResponsibilityGroup_contractId_fkey"
  FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentResponsibilityGroup"
  ADD CONSTRAINT "InstrumentResponsibilityGroup_covenantId_fkey"
  FOREIGN KEY ("covenantId") REFERENCES "Covenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InstrumentParty"
  ADD CONSTRAINT "InstrumentParty_contractId_fkey"
  FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentParty"
  ADD CONSTRAINT "InstrumentParty_covenantId_fkey"
  FOREIGN KEY ("covenantId") REFERENCES "Covenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentParty"
  ADD CONSTRAINT "InstrumentParty_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentParty"
  ADD CONSTRAINT "InstrumentParty_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentParty"
  ADD CONSTRAINT "InstrumentParty_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentParty"
  ADD CONSTRAINT "InstrumentParty_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentParty"
  ADD CONSTRAINT "InstrumentParty_responsibilityGroupId_fkey"
  FOREIGN KEY ("responsibilityGroupId") REFERENCES "InstrumentResponsibilityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InstrumentMeasurement"
  ADD CONSTRAINT "InstrumentMeasurement_contractId_fkey"
  FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentMeasurement"
  ADD CONSTRAINT "InstrumentMeasurement_covenantId_fkey"
  FOREIGN KEY ("covenantId") REFERENCES "Covenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentMeasurement"
  ADD CONSTRAINT "InstrumentMeasurement_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InstrumentMeasurementItem"
  ADD CONSTRAINT "InstrumentMeasurementItem_measurementId_fkey"
  FOREIGN KEY ("measurementId") REFERENCES "InstrumentMeasurement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentMeasurementItem"
  ADD CONSTRAINT "InstrumentMeasurementItem_purchaseProcessItemId_fkey"
  FOREIGN KEY ("purchaseProcessItemId") REFERENCES "PurchaseProcessItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentMeasurementItem"
  ADD CONSTRAINT "InstrumentMeasurementItem_purchaseReceiptItemId_fkey"
  FOREIGN KEY ("purchaseReceiptItemId") REFERENCES "PurchaseReceiptItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InstrumentInstallment"
  ADD CONSTRAINT "InstrumentInstallment_contractId_fkey"
  FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentInstallment"
  ADD CONSTRAINT "InstrumentInstallment_covenantId_fkey"
  FOREIGN KEY ("covenantId") REFERENCES "Covenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentInstallment"
  ADD CONSTRAINT "InstrumentInstallment_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
