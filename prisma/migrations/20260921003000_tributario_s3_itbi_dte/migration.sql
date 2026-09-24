CREATE TABLE "ItbiTransactionType" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rate" DECIMAL(9,6) NOT NULL,
  "damStage" TEXT NOT NULL DEFAULT 'APROVACAO',
  "cadastralUpdateMode" TEXT NOT NULL DEFAULT 'MANUAL',
  "requiresDebtClearance" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "legalBasis" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItbiTransactionType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItbiDeclaration" (
  "id" TEXT NOT NULL,
  "declarationNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
  "transactionTypeId" TEXT NOT NULL,
  "realEstateId" TEXT NOT NULL,
  "processId" TEXT,
  "protocolNumber" TEXT,
  "registryOffice" TEXT,
  "transmissionScope" TEXT NOT NULL DEFAULT 'INTEGRAL',
  "transmittedFraction" DECIMAL(9,6) NOT NULL,
  "declaredPropertyValue" DECIMAL(18,2) NOT NULL,
  "taxableBase" DECIMAL(18,2) NOT NULL,
  "appliedRate" DECIMAL(9,6) NOT NULL,
  "taxAmount" DECIMAL(18,2) NOT NULL,
  "calculationSnapshot" JSONB NOT NULL,
  "blockingTaxDebt" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "nonTaxDebtAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "isLeasehold" BOOLEAN NOT NULL DEFAULT false,
  "leaseholdDetails" TEXT,
  "cadastralUpdateMode" TEXT NOT NULL DEFAULT 'MANUAL',
  "cadastralUpdatedAt" TIMESTAMP(3),
  "assessmentId" TEXT,
  "guideId" TEXT,
  "documentId" TEXT,
  "analysisNotes" TEXT,
  "analyzedAt" TIMESTAMP(3),
  "createdByUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItbiDeclaration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItbiParty" (
  "id" TEXT NOT NULL,
  "declarationId" TEXT NOT NULL,
  "taxpayerId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "participationPercent" DECIMAL(9,6),
  "liabilityType" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ItbiParty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItbiEvent" (
  "id" TEXT NOT NULL,
  "declarationId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "payload" JSONB,
  "actorUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ItbiEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DteMailbox" (
  "id" TEXT NOT NULL,
  "taxpayerId" TEXT NOT NULL,
  "establishmentCnpj" TEXT,
  "accessMode" TEXT NOT NULL DEFAULT 'LOGIN_PASSWORD',
  "status" TEXT NOT NULL DEFAULT 'ATIVA',
  "emailNoticeEnabled" BOOLEAN NOT NULL DEFAULT true,
  "smsNoticeEnabled" BOOLEAN NOT NULL DEFAULT false,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DteMailbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DteCategory" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "retentionRequired" BOOLEAN NOT NULL DEFAULT true,
  "defaultDeadlineDays" INTEGER NOT NULL DEFAULT 5,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DteCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DteMessage" (
  "id" TEXT NOT NULL,
  "mailboxId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
  "processId" TEXT,
  "documentId" TEXT,
  "batchKey" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deadlineAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  "acknowledgedAt" TIMESTAMP(3),
  "tacitAcknowledgedAt" TIMESTAMP(3),
  "emailNoticeAt" TIMESTAMP(3),
  "smsNoticeAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "signatureRequired" BOOLEAN NOT NULL DEFAULT false,
  "signatureStatus" TEXT,
  "createdByUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DteMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DteMessageEvent" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "actorUsuarioId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DteMessageEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DtePowerOfAttorney" (
  "id" TEXT NOT NULL,
  "grantorTaxpayerId" TEXT NOT NULL,
  "attorneyTaxpayerId" TEXT NOT NULL,
  "establishmentCnpjs" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE_ACEITE',
  "legitimacyMode" TEXT NOT NULL,
  "legitimacyEvidence" TEXT,
  "officialCertificateValidated" BOOLEAN NOT NULL DEFAULT false,
  "documentId" TEXT,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "refusedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdByUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DtePowerOfAttorney_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DtePowerOfAttorneyEvent" (
  "id" TEXT NOT NULL,
  "powerOfAttorneyId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "actorUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DtePowerOfAttorneyEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ItbiTransactionType_code_key" ON "ItbiTransactionType"("code");
CREATE UNIQUE INDEX "ItbiDeclaration_declarationNumber_key" ON "ItbiDeclaration"("declarationNumber");
CREATE INDEX "ItbiDeclaration_realEstateId_status_idx" ON "ItbiDeclaration"("realEstateId", "status");
CREATE INDEX "ItbiDeclaration_processId_idx" ON "ItbiDeclaration"("processId");
CREATE INDEX "ItbiDeclaration_assessmentId_idx" ON "ItbiDeclaration"("assessmentId");
CREATE INDEX "ItbiDeclaration_guideId_idx" ON "ItbiDeclaration"("guideId");
CREATE INDEX "ItbiParty_declarationId_role_sortOrder_idx" ON "ItbiParty"("declarationId", "role", "sortOrder");
CREATE INDEX "ItbiParty_taxpayerId_idx" ON "ItbiParty"("taxpayerId");
CREATE INDEX "ItbiEvent_declarationId_createdAt_idx" ON "ItbiEvent"("declarationId", "createdAt");
CREATE UNIQUE INDEX "DteMailbox_taxpayerId_establishmentCnpj_key" ON "DteMailbox"("taxpayerId", "establishmentCnpj");
CREATE INDEX "DteMailbox_status_idx" ON "DteMailbox"("status");
CREATE UNIQUE INDEX "DteCategory_code_key" ON "DteCategory"("code");
CREATE UNIQUE INDEX "DteMessage_idempotencyKey_key" ON "DteMessage"("idempotencyKey");
CREATE INDEX "DteMessage_mailboxId_status_availableAt_idx" ON "DteMessage"("mailboxId", "status", "availableAt");
CREATE INDEX "DteMessage_batchKey_idx" ON "DteMessage"("batchKey");
CREATE INDEX "DteMessage_documentId_idx" ON "DteMessage"("documentId");
CREATE INDEX "DteMessageEvent_messageId_createdAt_idx" ON "DteMessageEvent"("messageId", "createdAt");
CREATE INDEX "DtePowerOfAttorney_grantorTaxpayerId_status_idx" ON "DtePowerOfAttorney"("grantorTaxpayerId", "status");
CREATE INDEX "DtePowerOfAttorney_attorneyTaxpayerId_status_idx" ON "DtePowerOfAttorney"("attorneyTaxpayerId", "status");
CREATE INDEX "DtePowerOfAttorneyEvent_powerOfAttorneyId_createdAt_idx" ON "DtePowerOfAttorneyEvent"("powerOfAttorneyId", "createdAt");

ALTER TABLE "ItbiDeclaration" ADD CONSTRAINT "ItbiDeclaration_transactionTypeId_fkey" FOREIGN KEY ("transactionTypeId") REFERENCES "ItbiTransactionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItbiParty" ADD CONSTRAINT "ItbiParty_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "ItbiDeclaration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItbiEvent" ADD CONSTRAINT "ItbiEvent_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "ItbiDeclaration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DteMessage" ADD CONSTRAINT "DteMessage_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "DteMailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DteMessage" ADD CONSTRAINT "DteMessage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DteCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DteMessageEvent" ADD CONSTRAINT "DteMessageEvent_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DteMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DtePowerOfAttorneyEvent" ADD CONSTRAINT "DtePowerOfAttorneyEvent_powerOfAttorneyId_fkey" FOREIGN KEY ("powerOfAttorneyId") REFERENCES "DtePowerOfAttorney"("id") ON DELETE CASCADE ON UPDATE CASCADE;
