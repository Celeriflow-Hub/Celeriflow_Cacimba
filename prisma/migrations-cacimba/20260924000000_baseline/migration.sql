-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProcurementOriginPolicy" AS ENUM ('NONE', 'PROCUREMENT_SOURCE', 'CONTRACT');

-- CreateEnum
CREATE TYPE "RevenueStage" AS ENUM ('LANCADA', 'ARRECADADA', 'ESTORNADA');

-- CreateEnum
CREATE TYPE "RevenueClassification" AS ENUM ('ORCAMENTARIA', 'INTRAORCAMENTARIA', 'REDUTORA');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "organization" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "moduleInterest" TEXT,
    "message" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "legalName" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "mayorName" TEXT,
    "managerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Secretariat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acronym" TEXT,
    "managerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Secretariat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "secretariatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdministrativeUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT,
    "managerName" TEXT,
    "secretariatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdministrativeUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT,
    "canSign" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "registration" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "salaryBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contractedHours" INTEGER NOT NULL DEFAULT 220,
    "roleId" TEXT,
    "secretariatId" TEXT,
    "departmentId" TEXT,
    "unitId" TEXT,
    "personId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalDemand" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aberta',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "deadline" TIMESTAMP(3),
    "secretariatId" TEXT,
    "departmentId" TEXT,
    "assigneeId" TEXT,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "socialName" TEXT,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "rgIssuer" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "raceColor" TEXT,
    "nationality" TEXT,
    "birthPlace" TEXT,
    "maritalStatus" TEXT,
    "profession" TEXT,
    "educationLevel" TEXT,
    "motherName" TEXT,
    "fatherName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "phonePrimary" TEXT,
    "phoneSecondary" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "emailSecondary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "corporateName" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT NOT NULL,
    "municipalInsc" TEXT,
    "stateInsc" TEXT,
    "companyType" TEXT,
    "legalNature" TEXT,
    "primaryCnae" TEXT,
    "secondaryCnaes" TEXT,
    "openingDate" TIMESTAMP(3),
    "taxRegime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "phone" TEXT,
    "whatsapp" TEXT,
    "emailPrimary" TEXT,
    "emailFiscal" TEXT,
    "website" TEXT,
    "contactPerson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Taxpayer" (
    "id" TEXT NOT NULL,
    "taxpayerType" TEXT NOT NULL,
    "municipalInsc" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "economicActivities" TEXT,
    "fiscalNotes" TEXT,
    "personId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Taxpayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "category" TEXT,
    "businessBranch" TEXT,
    "bankData" TEXT,
    "certificationsValidUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "notes" TEXT,
    "personId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalRepresentative" (
    "id" TEXT NOT NULL,
    "representationType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "grantedPowers" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "notes" TEXT,
    "representedPersonId" TEXT,
    "representedCompanyId" TEXT,
    "representativeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalRepresentative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "zipCode" TEXT,
    "streetName" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "referencePoint" TEXT,
    "addressType" TEXT,
    "zone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "neighborhoodId" TEXT,
    "canonicalAddressId" TEXT,
    "personId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Neighborhood" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "adminRegion" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Neighborhood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Street" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "zipCode" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "neighborhoodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Street_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealEstate" (
    "id" TEXT NOT NULL,
    "municipalInsc" TEXT,
    "registration" TEXT,
    "propertyType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Regular',
    "streetName" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "lot" TEXT,
    "block" TEXT,
    "landArea" DOUBLE PRECISION,
    "builtArea" DOUBLE PRECISION,
    "propertyUse" TEXT,
    "fiscalZone" TEXT,
    "neighborhoodId" TEXT,
    "taxpayerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealEstate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentClass" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "signaturePolicy" TEXT NOT NULL DEFAULT 'EXTERNAL_PROVIDER_REQUIRED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'VÃ¡lido',
    "notes" TEXT,
    "documentClassId" TEXT,
    "publicLabel" TEXT NOT NULL DEFAULT 'Documento autenticado',
    "retentionMonths" INTEGER NOT NULL DEFAULT 60,
    "personId" TEXT,
    "companyId" TEXT,
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FINAL',
    "lockedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicValidationCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSignature" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "signerUsuarioId" TEXT NOT NULL,
    "signerEmployeeId" TEXT,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signatureType" TEXT NOT NULL DEFAULT 'SIGN',
    "provider" TEXT NOT NULL DEFAULT 'INTERNAL',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "requestedByUsuarioId" TEXT,
    "authenticationMethod" TEXT NOT NULL,
    "reauthenticatedAt" TIMESTAMP(3),
    "documentHash" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "initialDepartmentId" TEXT,
    "defaultSlaDays" INTEGER,
    "defaultPriority" TEXT,
    "requiresInterested" BOOLEAN NOT NULL DEFAULT false,
    "allowsInternalOpening" BOOLEAN NOT NULL DEFAULT true,
    "genericWorkflowEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "processTypeId" TEXT NOT NULL,
    "slaDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "initialDepartmentId" TEXT,
    "defaultPriority" TEXT,
    "requiresInterested" BOOLEAN NOT NULL DEFAULT false,
    "allowsInternalOpening" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL,
    "protocolNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aberto',
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "processTypeId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "personId" TEXT,
    "companyId" TEXT,
    "currentDepartmentId" TEXT,
    "currentResponsibleEmployeeId" TEXT,
    "expectedCompletionAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "archiveReason" TEXT,
    "archivedByEmployeeId" TEXT,
    "currentWorkflowStageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessMovement" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "fromDepartmentId" TEXT,
    "toDepartmentId" TEXT NOT NULL,
    "employeeId" TEXT,
    "destinationEmployeeId" TEXT,
    "receivedByEmployeeId" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_RECEIPT',
    "receivedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessWorkflowStage" (
    "id" TEXT NOT NULL,
    "processTypeId" TEXT NOT NULL,
    "subjectId" TEXT,
    "departmentId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "slaDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessWorkflowStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenericProcessWorkflowDefinition" (
    "id" TEXT NOT NULL,
    "processTypeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedByUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenericProcessWorkflowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenericProcessWorkflowStage" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "slaCalendarDays" INTEGER NOT NULL,
    "requiresSignedDocument" BOOLEAN NOT NULL DEFAULT false,
    "requiredDocumentClassId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenericProcessWorkflowStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenericProcessWorkflowInstance" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "definitionVersion" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentPosition" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3),
    "instanceTimeZone" TEXT NOT NULL,
    "openedByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenericProcessWorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenericProcessWorkflowEvent" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromPosition" INTEGER,
    "toPosition" INTEGER,
    "actorUsuarioId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenericProcessWorkflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessDocument" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "title" TEXT,
    "fileUrl" TEXT,
    "documentType" TEXT,
    "documentId" TEXT,
    "purpose" TEXT,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessDispatch" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "dispatchType" TEXT NOT NULL DEFAULT 'Despacho',
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessEvent" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "departmentId" TEXT,
    "employeeId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "processId" TEXT,
    "sourceModule" TEXT NOT NULL DEFAULT 'PROCESSOS',
    "entityType" TEXT NOT NULL DEFAULT 'PROCESS',
    "entityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocolNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessSequence" (
    "year" INTEGER NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessSequence_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSubject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultDepartmentId" TEXT,
    "defaultPriority" TEXT NOT NULL DEFAULT 'Normal',
    "defaultDueDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aberto',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "solution" TEXT,
    "concludedAt" TIMESTAMP(3),
    "channelId" TEXT NOT NULL,
    "personId" TEXT,
    "companyId" TEXT,
    "departmentId" TEXT,
    "assigneeId" TEXT,
    "serviceSubjectId" TEXT,
    "resolvedById" TEXT,
    "concludedById" TEXT,
    "processId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ombudsman" (
    "id" TEXT NOT NULL,
    "protocolNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Recebida',
    "channelId" TEXT NOT NULL,
    "personId" TEXT,
    "departmentId" TEXT,
    "assigneeId" TEXT,
    "processId" TEXT,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "concludedAt" TIMESTAMP(3),
    "concludedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ombudsman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketInteraction" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Registro',
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketDocument" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "employeeId" TEXT,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMovement" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fromDepartmentId" TEXT,
    "toDepartmentId" TEXT NOT NULL,
    "fromAssigneeId" TEXT,
    "toAssigneeId" TEXT,
    "employeeId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAuditLog" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmbudsmanAccess" (
    "id" TEXT NOT NULL,
    "ombudsmanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "canViewIdentity" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OmbudsmanAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmbudsmanIdentity" (
    "id" TEXT NOT NULL,
    "ombudsmanId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OmbudsmanIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmbudsmanMovement" (
    "id" TEXT NOT NULL,
    "ombudsmanId" TEXT NOT NULL,
    "fromDepartmentId" TEXT,
    "toDepartmentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OmbudsmanMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmbudsmanInteraction" (
    "id" TEXT NOT NULL,
    "ombudsmanId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OmbudsmanInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmbudsmanDocument" (
    "id" TEXT NOT NULL,
    "ombudsmanId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "employeeId" TEXT,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OmbudsmanDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmbudsmanAuditLog" (
    "id" TEXT NOT NULL,
    "ombudsmanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OmbudsmanAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatisfactionSurvey" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SatisfactionSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalMenu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalNews" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "secretariatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalNews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "position" TEXT NOT NULL DEFAULT 'Principal',
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialPublication" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "linkUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Publicado',
    "publishDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialDiary" (
    "id" TEXT NOT NULL,
    "editionNumber" INTEGER NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialDiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "requirements" TEXT,
    "steps" TEXT,
    "deadline" TEXT,
    "cost" TEXT,
    "linkUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformationRequest" (
    "id" TEXT NOT NULL,
    "protocolNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Recebido',
    "answer" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterDoc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InformationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomicRegistration" (
    "id" TEXT NOT NULL,
    "municipalInsc" TEXT NOT NULL,
    "primaryCnae" TEXT,
    "taxRegime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "startDate" TIMESTAMP(3),
    "taxpayerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EconomicRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tax" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxAssessment" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "originalValue" DOUBLE PRECISION NOT NULL,
    "originalValueDecimal" DECIMAL(18,2),
    "assessmentNumber" TEXT,
    "competence" TIMESTAMP(3),
    "taxableBaseDecimal" DECIMAL(18,2),
    "rate" DECIMAL(9,6),
    "discountValueDecimal" DECIMAL(18,2),
    "interestValueDecimal" DECIMAL(18,2),
    "penaltyValueDecimal" DECIMAL(18,2),
    "correctionValueDecimal" DECIMAL(18,2),
    "finalValueDecimal" DECIMAL(18,2),
    "calculationSnapshot" JSONB,
    "status" TEXT NOT NULL DEFAULT 'LanÃ§ado',
    "taxId" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "realEstateId" TEXT,
    "economicRegistrationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxGuide" (
    "id" TEXT NOT NULL,
    "barcode" TEXT,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "totalValueDecimal" DECIMAL(18,2),
    "guideNumber" TEXT,
    "calculationSnapshot" JSONB,
    "documentId" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Emitida',
    "assessmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPayment" (
    "id" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "amountPaidDecimal" DECIMAL(18,2),
    "status" TEXT NOT NULL DEFAULT 'Confirmado',
    "idempotencyKey" TEXT,
    "sourceModule" TEXT NOT NULL DEFAULT 'TRIBUTARIO',
    "sourceType" TEXT NOT NULL DEFAULT 'TAX_PAYMENT',
    "sourceId" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'TAX_PAYMENT_CONFIRMED',
    "proofDocumentId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "clearanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Solicitado',
    "issueDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "qrCode" TEXT,
    "taxpayerId" TEXT NOT NULL,
    "economicRegistrationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtInstallment" (
    "id" TEXT NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "totalValueDecimal" DECIMAL(18,2),
    "downPayment" DOUBLE PRECISION,
    "downPaymentDecimal" DECIMAL(18,2),
    "installmentsCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "taxpayerId" TEXT NOT NULL,
    "activeDebtId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveDebt" (
    "id" TEXT NOT NULL,
    "originDebtType" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "originalValue" DOUBLE PRECISION NOT NULL,
    "originalValueDecimal" DECIMAL(18,2),
    "updatedValue" DOUBLE PRECISION NOT NULL,
    "updatedValueDecimal" DECIMAL(18,2),
    "cdaNumber" TEXT,
    "sourceKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Inscrita',
    "taxpayerId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "bankTransactionId" TEXT,
    "integrationEventId" TEXT,
    "collectionReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxActiveDebtEvent" (
    "id" TEXT NOT NULL,
    "activeDebtId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxActiveDebtEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCdaVersion" (
    "id" TEXT NOT NULL,
    "activeDebtId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "cdaNumber" TEXT NOT NULL,
    "contentSnapshot" JSONB NOT NULL,
    "annotation" TEXT,
    "signatureStatus" TEXT NOT NULL DEFAULT 'NAO_ASSINADA',
    "signedByUsuarioId" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCdaVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDebtSuspension" (
    "id" TEXT NOT NULL,
    "activeDebtId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "legalGround" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'VIGENTE',
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxDebtSuspension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDaPortfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDaPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDaPortfolioItem" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "activeDebtId" TEXT NOT NULL,
    "outstandingDecimal" DECIMAL(18,2) NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxDaPortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxProtestBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREPARADA',
    "fileContent" JSONB NOT NULL,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxProtestBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxProtestItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "activeDebtId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SELECIONADA',
    "returnCode" TEXT,
    "returnMessage" TEXT,
    "consentIssuedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxProtestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxExecutionBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "internalProtocol" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'MONTADO',
    "prosecutor" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxExecutionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxExecutionCase" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "activeDebtId" TEXT NOT NULL,
    "internalProtocol" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_PREPARO',
    "prosecutor" TEXT,
    "attorneyReference" TEXT,
    "mniStatus" TEXT NOT NULL DEFAULT 'NAO_ENVIADO',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "caseSnapshot" JSONB NOT NULL,
    "nextHearingAt" TIMESTAMP(3),
    "hearingNotes" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxExecutionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxExecutionEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxExecutionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCemetery" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "wakePlace" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCemetery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCemeterySector" (
    "id" TEXT NOT NULL,
    "cemeteryId" TEXT NOT NULL,
    "parentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TaxCemeterySector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxGrave" (
    "id" TEXT NOT NULL,
    "cemeteryId" TEXT NOT NULL,
    "sectorId" TEXT,
    "code" TEXT NOT NULL,
    "graveType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "occupantCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'LIVRE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxGrave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCemeteryEmployee" (
    "id" TEXT NOT NULL,
    "cemeteryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCemeteryEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxFuneralHome" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxFuneralHome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeathCause" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxDeathCause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeceased" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "deathDate" TIMESTAMP(3) NOT NULL,
    "deathTime" TEXT,
    "gender" TEXT,
    "document" TEXT,
    "maritalStatus" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "address" TEXT,
    "cemeteryId" TEXT NOT NULL,
    "graveId" TEXT,
    "funeralHomeId" TEXT,
    "funeralHomeName" TEXT,
    "causeId" TEXT,
    "causeText" TEXT,
    "doctorName" TEXT NOT NULL,
    "doctorCrm" TEXT NOT NULL,
    "groups" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SEPULTADO',
    "taxpayerId" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDeceased_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxBurialMovement" (
    "id" TEXT NOT NULL,
    "deceasedId" TEXT,
    "graveId" TEXT NOT NULL,
    "fromGraveId" TEXT,
    "toGraveId" TEXT,
    "movementType" TEXT NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feeAssessmentId" TEXT,
    "notes" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxBurialMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxGraveConcession" (
    "id" TEXT NOT NULL,
    "graveId" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "taxpayerId" TEXT,
    "concessionType" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'VIGENTE',
    "feeAssessmentId" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxGraveConcession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafExercise" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafRule" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "cfop" TEXT NOT NULL,
    "cfopDescription" TEXT,
    "composesVaf" BOOLEAN NOT NULL DEFAULT true,
    "formula" TEXT NOT NULL,
    "formulaVersion" TEXT NOT NULL DEFAULT '1',
    "contrapartidaCfop" TEXT,
    "contrapartidaRule" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "situation" TEXT NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafCompany" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "corporateName" TEXT NOT NULL,
    "tradeName" TEXT,
    "stateInsc" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "cnae" TEXT,
    "taxRegime" TEXT,
    "accountantId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafAccountant" (
    "id" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafAccountant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafEfdImport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "parsedData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'IMPORTADO',
    "importedBy" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "parentImportId" TEXT,

    CONSTRAINT "VafEfdImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafGiaImport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "parsedData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'IMPORTADO',
    "importedBy" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "parentImportId" TEXT,

    CONSTRAINT "VafGiaImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafMonthlySummary" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "cfop" TEXT NOT NULL,
    "cfopDescription" TEXT,
    "efdSaida" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "efdEntrada" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "giaSaida" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "giaEntrada" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "composesVaf" BOOLEAN NOT NULL DEFAULT true,
    "vafCalculated" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "formulaApplied" TEXT,
    "divergences" JSONB,
    "sourcePriority" TEXT NOT NULL DEFAULT 'EFD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafMonthlySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafResult" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "saidaElegivel" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "entradaElegivel" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "vafValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "participation" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "isSimples" BOOLEAN NOT NULL DEFAULT false,
    "simplesData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafCompanyIndex" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "indexProvisorio" DECIMAL(9,6),
    "indexDefinitivo" DECIMAL(9,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafCompanyIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafMunicipalIndex" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "indexProvisorio" DECIMAL(9,6),
    "indexDefinitivo" DECIMAL(9,6),
    "totalVafProvisorio" DECIMAL(18,2),
    "totalVafDefinitivo" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VafMunicipalIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafRepasse" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "weekNumber" INTEGER,
    "municipalValue" DECIMAL(18,2) NOT NULL,
    "stateTotalValue" DECIMAL(18,2) NOT NULL,
    "sourceFile" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL DEFAULT '1',
    "parentRepasseId" TEXT,

    CONSTRAINT "VafRepasse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafProtocol" (
    "id" TEXT NOT NULL,
    "protocolNumber" TEXT NOT NULL,
    "companyId" TEXT,
    "accountantId" TEXT,
    "documentType" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "VafProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafNotification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "accountantId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "competency" TEXT,
    "exerciseId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENVIADA',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "VafNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafActivity" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "assignedTo" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forwardedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "analyzedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "VafActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafEstimate" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT,
    "competency" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "realizedMonths" INTEGER NOT NULL,
    "realizedValue" DECIMAL(18,2) NOT NULL,
    "estimatedValue" DECIMAL(18,2) NOT NULL,
    "hypothesis" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VafEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafCrossCheck" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "cfop" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'ALERTA',
    "efdValue" DECIMAL(18,2),
    "giaValue" DECIMAL(18,2),
    "expectedValue" DECIMAL(18,2),
    "difference" DECIMAL(18,2),
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VafCrossCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VafCfopEntry" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "cfop" TEXT NOT NULL,
    "cfopDescription" TEXT,
    "operationType" TEXT NOT NULL,
    "efdValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "giaValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "composesVaf" BOOLEAN NOT NULL DEFAULT true,
    "onlyContabil" BOOLEAN NOT NULL DEFAULT false,
    "divergence" JSONB,
    "formulaDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VafCfopEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCertificate" (
    "id" TEXT NOT NULL,
    "certificateType" TEXT NOT NULL,
    "authCode" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Emitida',
    "taxpayerId" TEXT NOT NULL,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Infraction" (
    "id" TEXT NOT NULL,
    "infractionType" TEXT NOT NULL,
    "penaltyValue" DOUBLE PRECISION NOT NULL,
    "penaltyValueDecimal" DECIMAL(18,2),
    "defenseDeadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Emitido',
    "taxpayerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Infraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" SERIAL NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "serviceValue" DOUBLE PRECISION NOT NULL,
    "serviceValueDecimal" DECIMAL(18,2),
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionsDecimal" DECIMAL(18,2),
    "issRetained" BOOLEAN NOT NULL DEFAULT false,
    "issValue" DOUBLE PRECISION NOT NULL,
    "issValueDecimal" DECIMAL(18,2),
    "competence" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Emitida',
    "providerId" TEXT NOT NULL,
    "takerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxParameter" (
    "id" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyValuation" (
    "id" TEXT NOT NULL,
    "realEstateId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "landUnitValue" DECIMAL(18,6),
    "constructionUnitValue" DECIMAL(18,6),
    "venalValueDecimal" DECIMAL(18,2) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'INTERNA',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyValuation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxServiceActivity" (
    "id" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issRate" DECIMAL(9,6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxServiceActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeclaration" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "economicRegistrationId" TEXT,
    "activityId" TEXT NOT NULL,
    "competence" TIMESTAMP(3) NOT NULL,
    "serviceValueDecimal" DECIMAL(18,2) NOT NULL,
    "deductionValueDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "issValueDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APURADA_INTERNA',
    "calculationSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "realEstateId" TEXT,

    CONSTRAINT "TaxDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxServiceRequest" (
    "id" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_ANALISE_INTERNA',
    "taxpayerId" TEXT NOT NULL,
    "processId" TEXT,
    "documentId" TEXT,
    "assessmentId" TEXT,
    "licenseId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCaseLink" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "processId" TEXT,
    "documentId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCaseLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRegistryEntry" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "source" TEXT NOT NULL DEFAULT 'INTERNO',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "processId" TEXT,
    "documentId" TEXT,
    "actorUsuarioId" TEXT,
    "reviewedByUsuarioId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRegistryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxIntegrationEvent" (
    "id" TEXT NOT NULL,
    "integrationCode" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "protocol" TEXT,
    "externalReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "evidenceLevel" TEXT NOT NULL DEFAULT 'L0',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "taxpayerId" TEXT,
    "economicRegistrationId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxIntegrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtInstallmentSchedule" (
    "id" TEXT NOT NULL,
    "debtInstallmentId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtInstallmentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCertificateEvaluation" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "certificateId" TEXT,
    "result" TEXT NOT NULL,
    "pendingCount" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCertificateEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialYear" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PreparaÃ§Ã£o',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultiYearPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "draftedById" TEXT,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sanctionedById" TEXT,
    "sanctionedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "legalActNumber" TEXT,
    "legalActDate" TIMESTAMP(3),
    "legalDocumentId" TEXT,
    "publicationDate" TIMESTAMP(3),
    "publicationReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ElaboraÃ§Ã£o',
    "version" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultiYearPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "ProgramPPA" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FinalÃ­stico',
    "multiYearPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramPPA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectivePPA" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObjectivePPA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorPPA" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "baselineValue" DOUBLE PRECISION NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "objectiveId" TEXT NOT NULL,

    CONSTRAINT "IndicatorPPA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionPPA" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Projeto',
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionPPA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalPPA" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "physical" DOUBLE PRECISION NOT NULL,
    "financial" DECIMAL(18,2) NOT NULL,
    "actionId" TEXT NOT NULL,

    CONSTRAINT "GoalPPA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetGuideline" (
    "id" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "multiYearPlanId" TEXT,
    "draftedById" TEXT,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sanctionedById" TEXT,
    "sanctionedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "legalActNumber" TEXT,
    "legalActDate" TIMESTAMP(3),
    "legalDocumentId" TEXT,
    "publicationDate" TIMESTAMP(3),
    "publicationReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Vigente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetGuideline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetGuidelinePriority" (
    "id" TEXT NOT NULL,
    "budgetGuidelineId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetValue" DECIMAL(18,2),

    CONSTRAINT "BudgetGuidelinePriority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetGuidelineRisk" (
    "id" TEXT NOT NULL,
    "budgetGuidelineId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedImpact" DECIMAL(18,2) NOT NULL,
    "mitigation" TEXT NOT NULL,

    CONSTRAINT "BudgetGuidelineRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualBudgetLaw" (
    "id" TEXT NOT NULL,
    "lawNumber" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3),
    "financialYearId" TEXT NOT NULL,
    "budgetGuidelineId" TEXT,
    "draftedById" TEXT,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sanctionedById" TEXT,
    "sanctionedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "legalActNumber" TEXT,
    "legalActDate" TIMESTAMP(3),
    "legalDocumentId" TEXT,
    "publicationReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Sancionada',
    "totalRevenue" DECIMAL(18,2) NOT NULL,
    "totalExpense" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnualBudgetLaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualBudgetRevenueForecast" (
    "id" TEXT NOT NULL,
    "annualBudgetLawId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "estimatedValue" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "AnnualBudgetRevenueForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualBudgetExpenseFixation" (
    "id" TEXT NOT NULL,
    "annualBudgetLawId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fixedValue" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "AnnualBudgetExpenseFixation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyDisbursementSchedule" (
    "id" TEXT NOT NULL,
    "annualBudgetLawId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "budgetUnitId" TEXT NOT NULL,
    "limitValue" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "MonthlyDisbursementSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BimonthlyRevenueTarget" (
    "id" TEXT NOT NULL,
    "annualBudgetLawId" TEXT NOT NULL,
    "bimonth" INTEGER NOT NULL,
    "targetValue" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "BimonthlyRevenueTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditRequest" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "legalActNumber" TEXT,
    "legalActDate" TIMESTAMP(3),
    "legalDocumentId" TEXT,
    "fundingSourceId" TEXT,
    "publicationDate" TIMESTAMP(3),
    "publicationReference" TEXT,
    "type" TEXT NOT NULL,
    "lawNumber" TEXT,
    "justification" TEXT NOT NULL,
    "totalValue" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requestedById" TEXT NOT NULL,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sanctionedById" TEXT,
    "sanctionedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "executedById" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditRequestItem" (
    "id" TEXT NOT NULL,
    "creditRequestId" TEXT NOT NULL,
    "appropriationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "CreditRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetUnit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "secretariatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceSource" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueNature" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueNature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseNature" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "procurementOriginPolicy" "ProcurementOriginPolicy" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseNature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAppropriation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "budgetUnitId" TEXT NOT NULL,
    "expenseNatureId" TEXT NOT NULL,
    "resourceSourceId" TEXT NOT NULL,
    "annualBudgetExpenseFixationId" TEXT,
    "programPPAId" TEXT,
    "actionPPAId" TEXT,
    "initialValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "initialValueDecimal" DECIMAL(18,2),
    "updatedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedValueDecimal" DECIMAL(18,2),
    "committedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "committedValueDecimal" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetAppropriation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revenue" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,
    "valueDecimal" DECIMAL(18,2),
    "financialYearId" TEXT,
    "revenueNatureId" TEXT NOT NULL,
    "resourceSourceId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "secretariatId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Arrecadada',
    "stage" "RevenueStage" NOT NULL DEFAULT 'ARRECADADA',
    "classification" "RevenueClassification" NOT NULL DEFAULT 'ORCAMENTARIA',
    "launchDate" TIMESTAMP(3),
    "collectionDate" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "history" TEXT,
    "sourceModule" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceType" TEXT NOT NULL DEFAULT 'REVENUE',
    "sourceId" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'REVENUE_CONFIRMED',
    "idempotencyKey" TEXT,
    "integrationEventId" TEXT,
    "bankTransactionId" TEXT,
    "bankAccountExternalId" TEXT,
    "collectionReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "valueDecimal" DECIMAL(18,2),
    "appropriationId" TEXT NOT NULL,
    "secretariatId" TEXT NOT NULL,
    "supplierId" TEXT,
    "requestedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Solicitada',
    "sourceModule" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceType" TEXT NOT NULL DEFAULT 'EXPENSE_REQUEST',
    "sourceId" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'EXPENSE_REQUEST',
    "idempotencyKey" TEXT,
    "purchaseReceiptId" TEXT,
    "socialProgramId" TEXT,
    "socialBenefitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetReservation" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,
    "valueDecimal" DECIMAL(18,2),
    "appropriationId" TEXT NOT NULL,
    "expenseId" TEXT,
    "justification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetMovement" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "justification" TEXT NOT NULL,
    "appropriationId" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceType" TEXT NOT NULL DEFAULT 'BUDGET_MOVEMENT',
    "sourceId" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'BUDGET_MOVEMENT',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creditor" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Fornecedor',
    "name" TEXT NOT NULL,
    "document" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "personId" TEXT,
    "companyId" TEXT,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creditor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,
    "valueDecimal" DECIMAL(18,2),
    "type" TEXT NOT NULL DEFAULT 'OrdinÃ¡rio',
    "history" TEXT NOT NULL,
    "appropriationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "creditorId" TEXT,
    "processId" TEXT,
    "contractId" TEXT,
    "purchaseProcessId" TEXT,
    "purchaseReceiptId" TEXT,
    "covenantId" TEXT,
    "publicityCampaignId" TEXT,
    "fundedDebtId" TEXT,
    "covenantNumber" TEXT,
    "publicityCampaignName" TEXT,
    "fundedDebtName" TEXT,
    "reservationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Emitido',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitmentMovement" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "justification" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitmentMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,
    "valueDecimal" DECIMAL(18,2),
    "documentRef" TEXT,
    "fiscalDocumentNumber" TEXT,
    "fiscalDocumentSeries" TEXT,
    "fiscalDocumentIssueDate" TIMESTAMP(3),
    "fiscalDocumentAccessKey" TEXT,
    "documentId" TEXT,
    "commitmentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Liquidado',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,
    "valueDecimal" DECIMAL(18,2),
    "commitmentId" TEXT NOT NULL,
    "settlementId" TEXT,
    "bankAccountId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "creditorId" TEXT,
    "isExceptional" BOOLEAN NOT NULL DEFAULT false,
    "exceptionJustification" TEXT,
    "netValueDecimal" DECIMAL(18,2),
    "paymentMethod" TEXT NOT NULL DEFAULT 'TransferÃªncia',
    "status" TEXT NOT NULL DEFAULT 'Pago',
    "paymentOrderExternalId" TEXT,
    "integrationEventId" TEXT,
    "bankAccountExternalId" TEXT,
    "bankTransactionId" TEXT,
    "bankStatus" TEXT DEFAULT 'PENDING_SUBMISSION',
    "bankSubmittedAt" TIMESTAMP(3),
    "bankProcessedAt" TIMESTAMP(3),
    "bankRejectionCode" TEXT,
    "bankRejectionMessage" TEXT,
    "reversalOfBankTransactionId" TEXT,
    "reversalBankTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialDocument" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SYSTEM',
    "generatedByUsuarioId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commitmentId" TEXT,
    "settlementId" TEXT,
    "paymentId" TEXT,
    "withholdingPayableId" TEXT,

    CONSTRAINT "FinancialDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRetention" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "settlementRetentionId" TEXT,
    "retentionRuleId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "beneficiaryDocument" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRetention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementRetention" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "retentionRuleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "calculationBaseDecimal" DECIMAL(18,2) NOT NULL,
    "ratePercentage" DECIMAL(7,4) NOT NULL,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "beneficiaryDocument" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementRetention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "calculationBasePercentage" DECIMAL(7,4) NOT NULL,
    "ratePercentage" DECIMAL(7,4) NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "beneficiaryDocument" TEXT,
    "serviceCode" TEXT,
    "financialYearId" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "dueDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithholdingPayable" (
    "id" TEXT NOT NULL,
    "retentionId" TEXT NOT NULL,
    "creditorId" TEXT,
    "receiptDocumentId" TEXT,
    "dueDate" TIMESTAMP(3),
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithholdingPayable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'Movimento',
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentBalanceDecimal" DECIMAL(18,2),
    "resourceSourceId" TEXT,
    "budgetUnitId" TEXT,
    "accountingPlanId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "externalId" TEXT,
    "purpose" TEXT,
    "linkedInvestmentAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryMovement" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "history" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Confirmado',
    "bankAccountId" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "revenueId" TEXT,
    "sourceModule" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceType" TEXT NOT NULL DEFAULT 'TREASURY_MOVEMENT',
    "sourceId" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'TREASURY_MOVEMENT',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueReversal" (
    "id" TEXT NOT NULL,
    "revenueId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "justification" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "treasuryMovementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueReversal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueResourceRedistribution" (
    "id" TEXT NOT NULL,
    "revenueId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "sourceResourceSourceId" TEXT NOT NULL,
    "destinationResourceSourceId" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "history" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueResourceRedistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryTransfer" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "history" TEXT,
    "sourceBankAccountId" TEXT NOT NULL,
    "destinationBankAccountId" TEXT NOT NULL,
    "sourceMovementId" TEXT NOT NULL,
    "destinationMovementId" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatementImport" (
    "id" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "fileName" TEXT,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Importado',
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankStatementImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatementItem" (
    "id" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "statementImportId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "direction" TEXT NOT NULL,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "treasuryMovementId" TEXT,
    "downloadId" TEXT,
    "banco" TEXT,
    "agencia" TEXT,
    "contaNumero" TEXT,
    "tipoConta" TEXT,
    "codigoTransacao" TEXT,
    "sinal" TEXT,
    "saldoResultanteDecimal" DECIMAL(18,2),
    "categoriaClassificada" TEXT,
    "reciboMunicipal" TEXT,
    "lancamentoContabilId" TEXT,
    "bankTransactionId" TEXT,
    "integrationEventId" TEXT,
    "transactionType" TEXT,
    "clientReference" TEXT,
    "collectionReference" TEXT,
    "reversalOfBankTransactionId" TEXT,

    CONSTRAINT "BankStatementItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxFinancialMapping" (
    "id" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "revenueNatureId" TEXT NOT NULL,
    "resourceSourceId" TEXT NOT NULL,
    "defaultBankAccountId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxFinancialMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDocumentSequence" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDocumentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRevenueIntegrationEvent" (
    "id" TEXT NOT NULL,
    "taxPaymentId" TEXT NOT NULL,
    "revenueId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Confirmado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxRevenueIntegrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankReconciliation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "systemBalance" DOUBLE PRECISION NOT NULL,
    "systemBalanceDecimal" DECIMAL(18,2),
    "bankBalance" DOUBLE PRECISION NOT NULL,
    "bankBalanceDecimal" DECIMAL(18,2),
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentAllocation" (
    "id" TEXT NOT NULL,
    "originBankAccountId" TEXT NOT NULL,
    "investmentBankAccountId" TEXT NOT NULL,
    "treasuryTransferId" TEXT,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,
    "valueDecimal" DECIMAL(18,2),
    "type" TEXT NOT NULL,
    "history" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingTransaction" (
    "id" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "history" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "sourceModule" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceType" TEXT NOT NULL DEFAULT 'ACCOUNTING_TRANSACTION',
    "sourceId" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'MANUAL_POSTING',
    "idempotencyKey" TEXT,
    "authorUsuarioId" TEXT NOT NULL,
    "authorEmployeeId" TEXT,
    "postedAt" TIMESTAMP(3),
    "reversalOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingEventCatalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingEventCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingPostingRule" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "debitAccountId" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isReference" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingPostingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyAccountingClose" (
    "id" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "competence" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "pendingSummary" JSONB,
    "closedByUsuarioId" TEXT,
    "closedByEmployeeId" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyAccountingClose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyAccountingCloseEvent" (
    "id" TEXT NOT NULL,
    "monthlyAccountingCloseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "justification" TEXT,
    "pendingSummary" JSONB,
    "closureEvidence" JSONB,
    "requestedByUsuarioId" TEXT NOT NULL,
    "authorizedByUsuarioId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyAccountingCloseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualAccountingClose" (
    "id" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_PREPARACAO',
    "pendingSummary" JSONB,
    "preparedByUsuarioId" TEXT,
    "preparedAt" TIMESTAMP(3),
    "closedByUsuarioId" TEXT,
    "closedByEmployeeId" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnualAccountingClose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayableCarryForward" (
    "id" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "originFinancialYearId" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "previousPayableCarryForwardId" TEXT,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "notes" TEXT,
    "bankTransactionId" TEXT,
    "integrationEventId" TEXT,
    "paymentOrderExternalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayableCarryForward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayableCarryForwardEvent" (
    "id" TEXT NOT NULL,
    "payableCarryForwardId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "justification" TEXT,
    "valueDecimal" DECIMAL(18,2),
    "paymentId" TEXT,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayableCarryForwardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "category" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "object" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "estimatedValue" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "secretariatId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "approvedByEmployeeId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequestItem" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "customName" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "estimatedUnitValue" DOUBLE PRECISION,
    "materialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchasePlanning" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "catalogItemId" TEXT,
    "originPurchaseRequestId" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "expectedPeriodStart" DATE NOT NULL,
    "expectedPeriodEnd" DATE NOT NULL,
    "estimatedValueDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchasePlanning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseProcess" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "object" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modality" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Em Planejamento',
    "secretariatId" TEXT NOT NULL,
    "purchaseRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseProcessItem" (
    "id" TEXT NOT NULL,
    "purchaseProcessId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "customName" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "estimatedUnitValue" DOUBLE PRECISION,
    "materialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseProcessItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreliminaryTechnicalStudy" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "estimatedValue" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Em ElaboraÃ§Ã£o',
    "processId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreliminaryTechnicalStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermOfReference" (
    "id" TEXT NOT NULL,
    "object" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "estimatedValue" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Em ElaboraÃ§Ã£o',
    "processId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermOfReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceResearch" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedValue" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Em Andamento',
    "processId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceQuote" (
    "id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "researchId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bidding" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Em ElaboraÃ§Ã£o',
    "publicationDate" TIMESTAMP(3),
    "sessionDate" TIMESTAMP(3),
    "processId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bidding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectContracting" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Em ElaboraÃ§Ã£o',
    "processId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectContracting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "object" TEXT NOT NULL,
    "initialValue" DOUBLE PRECISION NOT NULL,
    "updatedValue" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Minuta',
    "processId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "secretariatId" TEXT NOT NULL,
    "sourceBudgetUnitId" TEXT,
    "managerId" TEXT,
    "inspectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAmendment" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "previousValue" DOUBLE PRECISION,
    "newValue" DOUBLE PRECISION,
    "previousEndDate" TIMESTAMP(3),
    "newEndDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Minuta',
    "contractId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "PurchaseReceiptItem" (
    "id" TEXT NOT NULL,
    "purchaseReceiptId" TEXT NOT NULL,
    "purchaseProcessItemId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "quantityIncorporated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "batchNumber" TEXT NOT NULL DEFAULT '',
    "expirationDate" TIMESTAMP(3),
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "stockMovementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequestItemBudgetAllocation" (
    "id" TEXT NOT NULL,
    "purchaseRequestItemId" TEXT NOT NULL,
    "budgetAppropriationId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequestItemBudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseProcessRequestOrigin" (
    "id" TEXT NOT NULL,
    "purchaseProcessId" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseProcessRequestOrigin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseProcessItemOrigin" (
    "id" TEXT NOT NULL,
    "purchaseProcessItemId" TEXT NOT NULL,
    "purchaseRequestItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseProcessItemOrigin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPortalIdentity" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPortalIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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
    "preliminaryTechnicalStudyId" TEXT,

    CONSTRAINT "BiddingAppointmentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "preliminaryTechnicalStudyId" TEXT,

    CONSTRAINT "BiddingPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "preliminaryTechnicalStudyId" TEXT,

    CONSTRAINT "BiddingAct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "preliminaryTechnicalStudyId" TEXT,

    CONSTRAINT "BiddingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiddingLot" (
    "id" TEXT NOT NULL,
    "biddingId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "estimatedValueDecimal" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "preliminaryTechnicalStudyId" TEXT,

    CONSTRAINT "BiddingLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiddingLotItem" (
    "id" TEXT NOT NULL,
    "biddingLotId" TEXT NOT NULL,
    "purchaseProcessItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiddingLotItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiddingBid" (
    "id" TEXT NOT NULL,
    "biddingLotId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "supplierPortalIdentityId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Lance',
    "unitValueDecimal" DECIMAL(18,2),
    "totalValueDecimal" DECIMAL(18,2) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Aceito',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiddingBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "BiddingResult" (
    "id" TEXT NOT NULL,
    "biddingLotId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "biddingBidId" TEXT,
    "biddingActId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Arrematado',
    "reason" TEXT,
    "unitValueDecimal" DECIMAL(18,2),
    "totalValueDecimal" DECIMAL(18,2) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "decidedByUsuarioId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiddingResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstrumentResponsibilityGroup" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "covenantId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstrumentResponsibilityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "InstrumentParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstrumentMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstrumentMeasurementItem" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "purchaseProcessItemId" TEXT,
    "purchaseReceiptItemId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitValueDecimal" DECIMAL(18,2),
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstrumentMeasurementItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "valueDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Programada',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstrumentInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Mensal',
    "status" TEXT NOT NULL DEFAULT 'Aberta',
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEvent" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "formula" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollItem" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacation" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "acquisitionStart" TIMESTAMP(3) NOT NULL,
    "acquisitionEnd" TIMESTAMP(3) NOT NULL,
    "enjoymentStart" TIMESTAMP(3),
    "enjoymentEnd" TIMESTAMP(3),
    "days" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'A vencer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vacation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "entryTime" TIMESTAMP(3),
    "exitTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Presente',
    "hoursWorked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contractedHours" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependent" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "personId" TEXT,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "birthDate" TIMESTAMP(3),
    "relationship" TEXT NOT NULL,
    "irrfDependent" BOOLEAN NOT NULL DEFAULT false,
    "familyWage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dependent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplierId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BenefitConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollBenefit" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "benefitConfigId" TEXT NOT NULL,
    "customValue" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonnelAct" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actNumber" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonnelAct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrPayrollRuleSet" (
    "id" TEXT NOT NULL,
    "configuracaoInstanciaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "scope" TEXT NOT NULL DEFAULT 'DEMONSTRACAO',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "legalReference" TEXT,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPayrollRuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrPayrollRule" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "valueType" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "legalReference" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPayrollRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrPayrollRubric" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "esocialNatureCode" TEXT,
    "calculationMethod" TEXT NOT NULL DEFAULT 'MANUAL',
    "formulaExpression" TEXT,
    "calculationBaseCode" TEXT,
    "fixedValue" DECIMAL(18,2),
    "percentageRate" DECIMAL(9,6),
    "priority" INTEGER NOT NULL DEFAULT 100,
    "legalReference" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPayrollRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrPayrollRubricIncidence" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "incidenceType" TEXT NOT NULL,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPayrollRubricIncidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrSocialSecurityScheme" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regime" TEXT NOT NULL,
    "employeeCalculationMethod" TEXT NOT NULL DEFAULT 'PROGRESSIVA',
    "ceilingValue" DECIMAL(18,2),
    "employerContributionRate" DECIMAL(9,6),
    "actuarialContributionRate" DECIMAL(9,6),
    "legalReference" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrSocialSecurityScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrSocialSecurityBand" (
    "id" TEXT NOT NULL,
    "socialSecuritySchemeId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "lowerLimit" DECIMAL(18,2) NOT NULL,
    "upperLimit" DECIMAL(18,2),
    "employeeRate" DECIMAL(9,6) NOT NULL,
    "employerRate" DECIMAL(9,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrSocialSecurityBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrVacationPolicy" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employmentNature" TEXT NOT NULL,
    "acquisitionMonths" INTEGER NOT NULL DEFAULT 12,
    "concessionMonths" INTEGER NOT NULL DEFAULT 12,
    "entitlementDays" INTEGER NOT NULL DEFAULT 30,
    "maxSplits" INTEGER NOT NULL DEFAULT 3,
    "minFirstSplitDays" INTEGER NOT NULL DEFAULT 14,
    "minOtherSplitDays" INTEGER NOT NULL DEFAULT 5,
    "additionalPayRate" DECIMAL(9,6) NOT NULL DEFAULT 33.333333,
    "allowsCashAbono" BOOLEAN NOT NULL DEFAULT false,
    "maxCashAbonoDays" INTEGER NOT NULL DEFAULT 0,
    "allowsAdvanceThirteenth" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "legalReference" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrVacationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrCalculationPolicy" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "roundingMode" TEXT NOT NULL DEFAULT 'HALF_UP',
    "roundingScale" INTEGER NOT NULL DEFAULT 2,
    "movementCutoffDay" INTEGER NOT NULL DEFAULT 20,
    "paymentDay" INTEGER,
    "negativeNetPayPolicy" TEXT NOT NULL DEFAULT 'BLOQUEAR',
    "maxConsignmentMarginRate" DECIMAL(9,6),
    "remunerationCeiling" DECIMAL(18,2),
    "freezeOnClose" BOOLEAN NOT NULL DEFAULT true,
    "legalReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrCalculationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrEmploymentRegime" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employmentNature" TEXT NOT NULL,
    "esocialCategory" TEXT,
    "defaultMonthlyHours" INTEGER,
    "socialSecuritySchemeId" TEXT,
    "vacationPolicyId" TEXT,
    "legalReference" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrEmploymentRegime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrPayrollConfigurationChange" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrPayrollConfigurationChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lifeSpan" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "patrimonyNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "acquisitionValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "incorporationDate" TIMESTAMP(3),
    "categoryId" TEXT NOT NULL,
    "departmentId" TEXT,
    "realEstateId" TEXT,
    "responsibleId" TEXT,
    "supplierId" TEXT,
    "invoiceNumber" TEXT,
    "purchaseReceiptItemId" TEXT,
    "stockMovementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "AssetValueHistory" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "referenceMonth" TIMESTAMP(3) NOT NULL,
    "openingValue" DOUBLE PRECISION NOT NULL,
    "depreciation" DOUBLE PRECISION NOT NULL,
    "closingValue" DOUBLE PRECISION NOT NULL,
    "lifeSpanMonths" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetValueHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTransfer" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aprovada',
    "assetId" TEXT NOT NULL,
    "fromDepartmentId" TEXT,
    "toDepartmentId" TEXT,
    "fromResponsibleId" TEXT,
    "toResponsibleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMaintenance" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Solicitada',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "fleetPreviousStatus" TEXT,
    "assetId" TEXT NOT NULL,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetWriteOff" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'Baixa',
    "reason" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aprovada',
    "disposalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bookValue" DOUBLE PRECISION NOT NULL,
    "gainLoss" DOUBLE PRECISION NOT NULL,
    "accountingTransactionId" TEXT,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetWriteOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetValueAdjustment" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "openingValue" DOUBLE PRECISION NOT NULL,
    "adjustmentValue" DOUBLE PRECISION NOT NULL,
    "closingValue" DOUBLE PRECISION NOT NULL,
    "justification" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetValueAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetIntegrationPendingConfiguration" (
    "id" TEXT NOT NULL,
    "assetWriteOffId" TEXT NOT NULL,
    "expectedEventCode" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_CONFIGURATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetIntegrationPendingConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Central',
    "address" TEXT,
    "zipCode" TEXT,
    "streetName" TEXT,
    "number" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "managerId" TEXT,
    "costCenterId" TEXT,
    "healthUnitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MATERIAL',
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'UN',
    "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPerishable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialStock" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "batchNumber" TEXT NOT NULL DEFAULT '',
    "expirationDate" TIMESTAMP(3),
    "unitCost" DOUBLE PRECISION,
    "productionDate" TIMESTAMP(3),
    "blockedAt" TIMESTAMP(3),
    "blockReason" TEXT,
    "warehouseId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialMovement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitValue" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "warehouseId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "stockId" TEXT,
    "supplierId" TEXT,
    "departmentId" TEXT,
    "obrasServicoId" TEXT,
    "settlementId" TEXT,
    "materialRequestItemId" TEXT,
    "actorUsuarioId" TEXT,
    "actorEmployeeId" TEXT,
    "inventorySessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "InventorySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "InventorySessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequest" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "justification" TEXT,
    "departmentId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "approvedByEmployeeId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "issuedByEmployeeId" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequestItem" (
    "id" TEXT NOT NULL,
    "quantityRequested" DOUBLE PRECISION NOT NULL,
    "quantityApproved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityDelivered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requestId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inepCode" TEXT,
    "cnpj" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "directorId" TEXT,
    "addressId" TEXT,
    "realEstateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL,
    "specialNeeds" TEXT,
    "usesSchoolTransport" BOOLEAN NOT NULL DEFAULT false,
    "needsSpecialMeal" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationalGuardian" (
    "id" TEXT NOT NULL,
    "kinship" TEXT NOT NULL,
    "isFinancial" BOOLEAN NOT NULL DEFAULT false,
    "isAcademic" BOOLEAN NOT NULL DEFAULT true,
    "canPickUp" BOOLEAN NOT NULL DEFAULT true,
    "studentId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationalGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "room" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'Aberta',
    "classType" TEXT NOT NULL DEFAULT 'Regular',
    "groupingType" TEXT NOT NULL DEFAULT 'Disciplina',
    "enrollmentOrder" TEXT NOT NULL DEFAULT 'Nome',
    "annualWorkload" INTEGER,
    "annualLessons" INTEGER,
    "lessonMinutes" INTEGER,
    "schoolId" TEXT NOT NULL,
    "teacherId" TEXT,
    "periodId" TEXT,
    "matrixId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSubject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreEnrollment" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "protocol" TEXT,
    "rankingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" INTEGER,
    "history" JSONB,
    "allocatedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "processId" TEXT,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreEnrollmentProcess" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "shift" TEXT,
    "capacity" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planejado',
    "criteria" JSONB,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreEnrollmentProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicDocumentIssue" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filters" JSONB,
    "generatedContent" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT,

    CONSTRAINT "AcademicDocumentIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Matriculado',
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "supportCode" TEXT,
    "details" JSONB,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT,
    "periodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicPeriod" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "modality" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planejado',
    "resolution" TEXT,
    "useHours" BOOLEAN NOT NULL DEFAULT true,
    "minimumSchoolDays" INTEGER NOT NULL DEFAULT 200,
    "settings" JSONB,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumMatrix" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "annualWorkload" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "schoolId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumMatrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumMatrixSubject" (
    "id" TEXT NOT NULL,
    "workload" INTEGER NOT NULL,
    "weeklyLessons" INTEGER NOT NULL DEFAULT 1,
    "evaluationType" TEXT NOT NULL DEFAULT 'Nota',
    "failsByGrade" BOOLEAN NOT NULL DEFAULT true,
    "appearsOnTranscript" BOOLEAN NOT NULL DEFAULT true,
    "matrixId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumMatrixSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolShift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "weekdays" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherClassAssignment" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Docente',
    "employmentRegime" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherClassAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentMovement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "destinationMunicipality" TEXT,
    "notes" TEXT,
    "actorName" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "sourceClassId" TEXT,
    "targetClassId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassScheduleBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "classId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassScheduleBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassScheduleEntry" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "lessonOrder" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassScheduleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducacensoOperation" (
    "id" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "layoutVersion" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsRead" INTEGER NOT NULL DEFAULT 0,
    "validRecords" INTEGER NOT NULL DEFAULT 0,
    "updatedRecords" INTEGER NOT NULL DEFAULT 0,
    "inconsistentRecords" INTEGER NOT NULL DEFAULT 0,
    "ignoredRecords" INTEGER NOT NULL DEFAULT 0,
    "issues" JSONB,
    "generatedContent" TEXT,
    "actorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EducacensoOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassDiary" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "contentTaught" TEXT,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aberto',
    "stage" TEXT NOT NULL DEFAULT '1º Bimestre',
    "lessonCount" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassDiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,
    "justification" TEXT,
    "absenceGroup" TEXT,
    "diaryId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "concept" TEXT,
    "type" TEXT NOT NULL DEFAULT 'AvaliaÃ§Ã£o',
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "recoveryValue" DOUBLE PRECISION,
    "feedback" TEXT,
    "publishedAt" TIMESTAMP(3),
    "assessmentId" TEXT,
    "classId" TEXT,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationAssessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "evaluationMode" TEXT NOT NULL DEFAULT 'Nota',
    "date" TIMESTAMP(3) NOT NULL,
    "maxScore" DOUBLE PRECISION,
    "averageScore" DOUBLE PRECISION,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "publishedAt" TIMESTAMP(3),
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAcademicRecord" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stage" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "content" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "publishedAt" TIMESTAMP(3),
    "pedagogicalFeedback" TEXT,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherAcademicRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningActivity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "materialUrl" TEXT,
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "publishedAt" TIMESTAMP(3),
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningQuestion" (
    "id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Discursiva',
    "options" JSONB,
    "answerKey" TEXT,
    "points" DOUBLE PRECISION,
    "position" INTEGER NOT NULL DEFAULT 1,
    "activityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSubmission" (
    "id" TEXT NOT NULL,
    "answer" TEXT,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Entregue',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "activityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationLibraryTitle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Disponível',
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationLibraryTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationLibraryCopy" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Disponível',
    "titleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationLibraryCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationLibraryLoan" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Emprestado',
    "loanedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "renewals" INTEGER NOT NULL DEFAULT 0,
    "copyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationLibraryLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationLibraryReservation" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aguardando',
    "position" INTEGER NOT NULL DEFAULT 1,
    "titleId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationLibraryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationSchoolMenu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "shift" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planejado',
    "servingsPlanned" INTEGER NOT NULL DEFAULT 0,
    "items" JSONB NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationSchoolMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationFoodMovement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DECIMAL(18,2),
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "schoolId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EducationFoodMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationFinancialAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "schoolId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationFinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationFinancialMovement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Confirmado',
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EducationFinancialMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationApplicationPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "items" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "schoolId" TEXT NOT NULL,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationApplicationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationTransportRoute" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "schoolId" TEXT NOT NULL,
    "fleetRouteId" TEXT,
    "fleetUnitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationTransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationTransportStop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "routeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EducationTransportStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationTransportStudent" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "boardingStop" TEXT,
    "routeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EducationTransportStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationTransportJourney" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Em andamento',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "routeId" TEXT NOT NULL,
    "fleetUnitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationTransportJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationTransportEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "journeyId" TEXT NOT NULL,

    CONSTRAINT "EducationTransportEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedagogicalCatalogItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "instructions" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "durationSeconds" INTEGER,
    "subjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedagogicalCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedagogicalRelease" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Publicado',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "catalogItemId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedagogicalRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedagogicalAttempt" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB NOT NULL,
    "releaseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "PedagogicalAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationSupportRequest" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aberto',
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationSupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolMeal" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "menu" TEXT NOT NULL,
    "servedQuantity" INTEGER NOT NULL,
    "totalCost" DOUBLE PRECISION,
    "notes" TEXT,
    "schoolId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolBus" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capacity" INTEGER,
    "value" DOUBLE PRECISION,
    "maintenanceDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolBus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolCalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "type" TEXT NOT NULL,
    "isSchoolDay" BOOLEAN NOT NULL DEFAULT false,
    "periodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cnes" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isThirdParty" BOOLEAN NOT NULL DEFAULT false,
    "inactivatedAt" TIMESTAMP(3),
    "inactivationReason" TEXT,
    "addressId" TEXT,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "cns" TEXT,
    "bloodType" TEXT,
    "bloodDonor" BOOLEAN,
    "knownAllergies" TEXT,
    "specialNeeds" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "personId" TEXT NOT NULL,
    "referenceUnitId" TEXT,
    "teamId" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProfessional" (
    "id" TEXT NOT NULL,
    "cbo" TEXT,
    "cns" TEXT,
    "councilName" TEXT,
    "councilNumber" TEXT,
    "specialty" TEXT,
    "treatment" TEXT,
    "isAuditor" BOOLEAN NOT NULL DEFAULT false,
    "consultationIntervalMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "inactivatedAt" TIMESTAMP(3),
    "inactivationReason" TEXT,
    "employeeId" TEXT NOT NULL,
    "unitId" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthProfessional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "microarea" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthAppointment" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "specialty" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'Agendado',
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "triagedAt" TIMESTAMP(3),
    "calledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "arrivalNotes" TEXT,
    "municipalitySnapshot" TEXT,
    "stateSnapshot" TEXT,
    "outcome" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "patientId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "professionalId" TEXT,
    "schedulingGroupId" TEXT,
    "specialtyId" TEXT,
    "serviceId" TEXT,
    "scheduleId" TEXT,
    "visitType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthAppointmentEvent" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "notes" TEXT,
    "actorUsuarioId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthAppointmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthTriage" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "bloodPressure" TEXT,
    "temperature" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "oxygenSaturation" DOUBLE PRECISION,
    "bloodGlucose" DOUBLE PRECISION,
    "observedConditions" TEXT,
    "riskClassification" TEXT NOT NULL,
    "priorityLabel" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthTriage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'Consulta',
    "bloodPressure" TEXT,
    "temperature" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "oxygenSaturation" DOUBLE PRECISION,
    "bloodGlucose" DOUBLE PRECISION,
    "chiefComplaint" TEXT,
    "anamnesis" TEXT,
    "assessment" TEXT,
    "evolution" TEXT,
    "conduct" TEXT,
    "observations" TEXT,
    "outcome" TEXT,
    "completedAt" TIMESTAMP(3),
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthClinicalEvolution" (
    "id" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthClinicalEvolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthDiagnosis" (
    "id" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "cidReferenceId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthPerformedProcedure" (
    "id" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthPerformedProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthClinicalDocument" (
    "id" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "addedByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthClinicalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activePrinciple" TEXT,
    "presentation" TEXT,
    "concentration" TEXT,
    "isControlled" BOOLEAN NOT NULL DEFAULT false,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "materialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineInteraction" (
    "id" TEXT NOT NULL,
    "originMedicineId" TEXT NOT NULL,
    "targetMedicineId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT,
    "source" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineDosageTemplate" (
    "id" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "route" TEXT,
    "frequency" TEXT NOT NULL,
    "duration" TEXT,
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineDosageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthPrescription" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "unitId" TEXT,
    "medicalRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthPrescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthPrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicineId" TEXT,
    "medicineName" TEXT NOT NULL,
    "presentation" TEXT,
    "dose" TEXT NOT NULL,
    "route" TEXT,
    "frequency" TEXT NOT NULL,
    "duration" TEXT,
    "quantity" DOUBLE PRECISION,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthPrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineDispensation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DOUBLE PRECISION NOT NULL,
    "medicineId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "batchId" TEXT,
    "prescriptionItemId" TEXT,
    "warehouseId" TEXT,
    "stockId" TEXT,
    "movementId" TEXT,
    "dispensedByProfessionalId" TEXT,
    "dosageSnapshot" TEXT,
    "observation" TEXT,
    "nextWithdrawalAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "specializedPlanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineDispensation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "disease" TEXT,
    "dosesRequired" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "materialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vaccine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccinationRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doseNumber" INTEGER NOT NULL DEFAULT 1,
    "lotNumber" TEXT,
    "manufacturer" TEXT,
    "citizenCondition" TEXT,
    "strategy" TEXT,
    "applicationSite" TEXT,
    "applicationReason" TEXT,
    "administrationRoute" TEXT,
    "shift" TEXT,
    "teamSnapshot" TEXT,
    "idempotencyKey" TEXT,
    "vaccineId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "stockId" TEXT,
    "movementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaccinationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "medicineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthExamRequest" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examName" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Solicitado',
    "resultDate" TIMESTAMP(3),
    "resultUrl" TEXT,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "unitId" TEXT,
    "medicalRecordId" TEXT,
    "procedureId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Rotina',
    "indication" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthExamRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthReferral" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "specialty" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "medicalRecordId" TEXT,
    "specialtyId" TEXT,
    "serviceId" TEXT,
    "destinationUnitId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCbo" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthCbo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSpecialty" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthSpecialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSpecialtyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthSpecialtyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSpecialtyGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthSpecialtyGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthService" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classification" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSpecialtyGroupService" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthSpecialtyGroupService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthUnitShift" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthUnitShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthUnitSpecialty" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthUnitSpecialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProfessionalAssignment" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "specialtyId" TEXT,
    "weeklyHours" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthProfessionalAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthServiceAssignment" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "unitId" TEXT,
    "professionalId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthServiceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthHabilitation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unitId" TEXT,
    "professionalId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthHabilitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSchedulingGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "specialtyGroupId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthSchedulingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRegistrationStatusHistory" (
    "id" TEXT NOT NULL,
    "unitId" TEXT,
    "professionalId" TEXT,
    "isActive" BOOLEAN NOT NULL,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthRegistrationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthUserAccessScope" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "validFrom" TEXT,
    "validUntil" TEXT,
    "weekdays" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthUserAccessScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSusImportBatch" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "contractVersion" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "insertedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "ignoredCount" INTEGER NOT NULL DEFAULT 0,
    "issueCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "actorUsuarioId" TEXT NOT NULL,

    CONSTRAINT "HealthSusImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSusImportIssue" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthSusImportIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSusProcedure" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "groupCode" TEXT,
    "groupName" TEXT,
    "subgroupCode" TEXT,
    "subgroupName" TEXT,
    "complexity" TEXT,
    "registrationInstrument" TEXT,
    "unitValue" DECIMAL(14,2),
    "minimumAge" INTEGER,
    "maximumAge" INTEGER,
    "allowedSex" TEXT,
    "financing" TEXT,
    "cidCodes" TEXT,
    "cboCodes" TEXT,
    "serviceCodes" TEXT,
    "classificationCodes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "sourceBatchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthSusProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSusReference" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "classification" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "sourceBatchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthSusReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSusProcedureReference" (
    "id" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthSusProcedureReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "HealthLaboratoryConfiguration" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "laboratoryName" TEXT NOT NULL,
    "collectionStartTime" TEXT NOT NULL,
    "collectionEndTime" TEXT NOT NULL,
    "resultReleaseDays" INTEGER NOT NULL,
    "allowsExternalProcessing" BOOLEAN NOT NULL DEFAULT false,
    "requiresTechnicalReview" BOOLEAN NOT NULL DEFAULT true,
    "usesDigitalSignature" BOOLEAN NOT NULL DEFAULT false,
    "publishesPatientPortal" BOOLEAN NOT NULL DEFAULT false,
    "resultFooterMessage" TEXT,
    "effectiveFrom" TEXT NOT NULL,
    "effectiveUntil" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthLaboratoryConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthMaterialProfile" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthMaterialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthStockPolicy" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "minQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthStockPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthStockReceipt" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthStockReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthStockReceiptItem" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "productionDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "movementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthStockReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthStockTransfer" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthStockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthStockTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "quantity" DOUBLE PRECISION NOT NULL,
    "departureMovementId" TEXT,
    "arrivalMovementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthStockTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "destinationWarehouseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "requestedQuantity" DOUBLE PRECISION NOT NULL,
    "fulfilledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacyRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlledMedicineBook" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openedByUsuarioId" TEXT NOT NULL,
    "closedByUsuarioId" TEXT,
    "closingEvidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlledMedicineBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthAssistentialDevice" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthAssistentialDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthDeviceMessage" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "sanitizedData" JSONB,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthDeviceMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLabExamModel" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthLabExamModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLabExamMaterial" (
    "id" TEXT NOT NULL,
    "examModelId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "warehouseId" TEXT,

    CONSTRAINT "HealthLabExamMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLabSchedule" (
    "id" TEXT NOT NULL,
    "examModelId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "weekday" INTEGER,
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthLabSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLabProviderQuota" (
    "id" TEXT NOT NULL,
    "providerSupplierId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "examModelId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "allowedQuantity" INTEGER NOT NULL,
    "consumedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthLabProviderQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLabQuestionnaire" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthLabQuestionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLabQuestionGroup" (
    "id" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "pageBreak" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HealthLabQuestionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLabQuestionItem" (
    "id" TEXT NOT NULL,
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
    "references" JSONB,

    CONSTRAINT "HealthLabQuestionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLabOrder" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthLabOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLabResult" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PARTIAL',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "values" JSONB NOT NULL,
    "interpretation" TEXT,
    "deviceCorrelationId" TEXT,
    "enteredByUsuarioId" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthLabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLabOrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthLabOrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLabReport" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthLabReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecializedCatalogItem" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "referenceValue" DOUBLE PRECISION,
    "materialId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecializedCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecializedTeamSchedule" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "patientCapacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecializedTeamSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecializedTherapeuticPlan" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecializedTherapeuticPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecializedPlanEntry" (
    "id" TEXT NOT NULL,
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
    "healthServiceId" TEXT,

    CONSTRAINT "SpecializedPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecializedQuota" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "allowedQuantity" DOUBLE PRECISION NOT NULL,
    "consumedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecializedQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecializedDistribution" (
    "id" TEXT NOT NULL,
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
    "notes" TEXT,

    CONSTRAINT "SpecializedDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRegulationQuota" (
    "id" TEXT NOT NULL,
    "providerSupplierId" TEXT NOT NULL,
    "unitId" TEXT,
    "specialtyId" TEXT,
    "serviceId" TEXT,
    "procedureId" TEXT,
    "period" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "realizedQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitValue" DECIMAL(14,2),
    "convenioId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthRegulationQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRegulationRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestUnitId" TEXT,
    "professionalId" TEXT,
    "specialtyId" TEXT,
    "serviceId" TEXT,
    "procedureId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'RECEBIDA',
    "origin" TEXT NOT NULL DEFAULT 'DIRECT',
    "referralId" TEXT,
    "examRequestId" TEXT,
    "description" TEXT,
    "quotaId" TEXT,
    "sectorId" TEXT,
    "protocolNumber" TEXT,
    "validationCode" TEXT,
    "cidReferenceId" TEXT,
    "patientCondition" TEXT,
    "executorNotes" TEXT,
    "transportNotes" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "preparation" TEXT,
    "contactPhone" TEXT,
    "feedback" TEXT,
    "guideNumber" TEXT,
    "guideIssuedAt" TIMESTAMP(3),
    "guideDocumentId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthRegulationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRegulationEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "notes" TEXT,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthRegulationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthTfdRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "regulationRequestId" TEXT,
    "originUnitId" TEXT,
    "destination" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'SOLICITADA',
    "companionName" TEXT,
    "companionDocument" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthTfdRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthTfdTrip" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "fleetUnitId" TEXT NOT NULL,
    "driverEmployeeId" TEXT,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "departureAt" TIMESTAMP(3),
    "returnAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthTfdTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthTfdPassenger" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "tfdRequestId" TEXT,
    "companionName" TEXT,
    "companionDocument" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'PACIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthTfdPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProductionCompetence" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthProductionCompetence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProductionFact" (
    "id" TEXT NOT NULL,
    "originType" TEXT NOT NULL,
    "originId" TEXT NOT NULL,
    "patientId" TEXT,
    "unitId" TEXT,
    "professionalId" TEXT,
    "procedureId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "value" DECIMAL(14,2),
    "cidReferenceId" TEXT,
    "municipality" TEXT,
    "state" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "competenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VALIDO',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthProductionFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProductionCriticism" (
    "id" TEXT NOT NULL,
    "factId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionNeeded" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthProductionCriticism_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSusFile" (
    "id" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "unitId" TEXT,
    "content" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalValue" DECIMAL(14,2),
    "status" TEXT NOT NULL DEFAULT 'GERADO',
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthSusFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProductionTarget" (
    "id" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "contractedQuantity" DOUBLE PRECISION NOT NULL,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthProductionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthUnitCeiling" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthUnitCeiling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRiskProtocol" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL DEFAULT '#64748b',
    "maxWaitMinutes" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthRiskProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthDestination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRoom" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Atendimento',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthReception" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "unidentifiedName" TEXT,
    "unitId" TEXT NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priorityFlags" TEXT,
    "companionName" TEXT,
    "companionKinship" TEXT,
    "companionPhone" TEXT,
    "transportMode" TEXT,
    "agreement" TEXT,
    "roomId" TEXT,
    "destinationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aguardando',
    "outcome" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthReception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthBed" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "room" TEXT,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Livre',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthBed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthBedOccupancy" (
    "id" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dischargedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "HealthBedOccupancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthObservation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "bedId" TEXT,
    "responsible" TEXT,
    "solicitedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Em observação',
    "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dischargedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRegulationSector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthRegulationSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRegulationAttachment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "uploadedByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthRegulationAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthTfdPassengerRemoval" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "requestedByUsuarioId" TEXT NOT NULL,
    "confirmedByUsuarioId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthTfdPassengerRemoval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthTerritoryArea" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitId" TEXT,
    "teamId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthTerritoryArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthMicroarea" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "agentProfessionalId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthMicroarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthHousehold" (
    "id" TEXT NOT NULL,
    "householdCode" TEXT,
    "microareaId" TEXT,
    "addressId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthHousehold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthFamily" (
    "id" TEXT NOT NULL,
    "familyCode" TEXT,
    "householdId" TEXT,
    "responsiblePersonId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthFamilyMember" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "kinship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthFamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthHomeVisit" (
    "id" TEXT NOT NULL,
    "householdId" TEXT,
    "familyId" TEXT,
    "teamId" TEXT,
    "professionalId" TEXT NOT NULL,
    "areaId" TEXT,
    "microareaId" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL,
    "actions" TEXT NOT NULL,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REALIZADA',
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthHomeVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthHomeVisitParticipant" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "patientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthHomeVisitParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthEsusForm" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "householdId" TEXT,
    "familyId" TEXT,
    "personId" TEXT,
    "patientId" TEXT,
    "professionalId" TEXT,
    "teamId" TEXT,
    "unitId" TEXT,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "payload" JSONB,
    "originMedicalRecordId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthEsusForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthEsusBatch" (
    "id" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GERADO',
    "fileContent" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "accepted" INTEGER NOT NULL DEFAULT 0,
    "rejected" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthEsusBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthEsusBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthEsusBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCareSchedule" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'FIXO',
    "unitId" TEXT NOT NULL,
    "specialtyId" TEXT,
    "professionalId" TEXT,
    "groupId" TEXT,
    "providerSupplierId" TEXT,
    "weekday" INTEGER,
    "date" DATE,
    "startTime" TEXT,
    "endTime" TEXT,
    "totalSlots" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "blockReason" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthCareSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthWaitlist" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "specialtyId" TEXT,
    "scheduleId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'Aguardando',
    "notes" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProviderAccess" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthProviderAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthVigilanceEstablishment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "companyId" TEXT,
    "personId" TEXT,
    "addressId" TEXT,
    "cnae" TEXT,
    "activity" TEXT,
    "riskLevel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthVigilanceEstablishment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthVigilanceComplaint" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT,
    "place" TEXT,
    "description" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "reporterPersonId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Recebida',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthVigilanceComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthVigilanceInspection" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "complaintId" TEXT,
    "professionalId" TEXT,
    "inspectedAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "findings" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Agendada',
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthVigilanceInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthVigilanceInspectionItem" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'Não avaliado',
    "notes" TEXT,

    CONSTRAINT "HealthVigilanceInspectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthVigilanceLicense" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Válido',
    "documentId" TEXT,
    "issuedByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthVigilanceLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addressId" TEXT,
    "realEstateId" TEXT,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialFamily" (
    "id" TEXT NOT NULL,
    "familyCode" TEXT,
    "nis" TEXT,
    "income" DOUBLE PRECISION,
    "perCapitaIncome" DOUBLE PRECISION,
    "vulnerabilities" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "representativeId" TEXT NOT NULL,
    "addressId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialFamilyMember" (
    "id" TEXT NOT NULL,
    "kinship" TEXT NOT NULL,
    "isDependent" BOOLEAN NOT NULL DEFAULT true,
    "familyId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialFamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialRecord" (
    "id" TEXT NOT NULL,
    "history" TEXT NOT NULL,
    "secrecyLevel" TEXT NOT NULL DEFAULT 'Normal',
    "familyId" TEXT NOT NULL,
    "unitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAttendance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "referrals" TEXT,
    "secrecyLevel" TEXT NOT NULL DEFAULT 'Normal',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "familyId" TEXT NOT NULL,
    "personId" TEXT,
    "unitId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialVisit" (
    "id" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "realizedDate" TIMESTAMP(3),
    "objective" TEXT NOT NULL,
    "report" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Agendada',
    "familyId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialBenefit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRecurrent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialBenefitConcession" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "value" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Concedido',
    "benefitId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "personId" TEXT,
    "professionalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialBenefitConcession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sphere" TEXT NOT NULL DEFAULT 'Municipal',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProgramParticipation" (
    "id" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "programId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialProgramParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvEnterprise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpjCpf" TEXT,
    "activityType" TEXT,
    "potentialRisk" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvEnterprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvLicense" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Emitida',
    "enterpriseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvRequest" (
    "id" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT,
    "requesterName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Solicitado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvComplaint" (
    "id" TEXT NOT NULL,
    "complaintType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'Recebida',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvInspection" (
    "id" TEXT NOT NULL,
    "dateScheduled" TIMESTAMP(3),
    "dateExecuted" TIMESTAMP(3),
    "inspector" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Agendada',
    "enterpriseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvInfraction" (
    "id" TEXT NOT NULL,
    "infractionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fineAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Emitido',
    "enterpriseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvInfraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvGreenArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaType" TEXT NOT NULL,
    "sizeSqm" DOUBLE PRECISION,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Preservado',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvGreenArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvWaste" (
    "id" TEXT NOT NULL,
    "generatorName" TEXT NOT NULL,
    "wasteType" TEXT NOT NULL,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "destination" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "enterpriseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvWaste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvEduProgram" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetAudience" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "participantsCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Planejado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvEduProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fileUrl" TEXT,
    "enterpriseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanConsumerUnit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Residencial',
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "ownerName" TEXT,
    "ownerDocument" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanConsumerUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanWaterMeter" (
    "id" TEXT NOT NULL,
    "meterNumber" TEXT NOT NULL,
    "installation" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Instalado',
    "unitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanWaterMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanMeterReading" (
    "id" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "previousValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "consumption" DOUBLE PRECISION NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Registrada',
    "unitId" TEXT NOT NULL,
    "meterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanMeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Emitida',
    "unitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanServiceOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'Aberta',
    "technician" TEXT,
    "unitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanWaterQualityAnalysis" (
    "id" TEXT NOT NULL,
    "collectionPoint" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "parameter" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "limit" TEXT NOT NULL,
    "compliance" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanWaterQualityAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanPortalRequest" (
    "id" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanPortalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanSavedReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanSavedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamLegislatura" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "descricao" TEXT,
    "secretariatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamLegislatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamVereador" (
    "id" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "nomeParlamentar" TEXT NOT NULL,
    "cpf" TEXT,
    "partido" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "foto" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Em ExercÃ­cio',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "personId" TEXT,
    "employeeId" TEXT,
    "legislaturaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamVereador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamSessao" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'OrdinÃ¡ria',
    "data" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL DEFAULT 'PlenÃ¡rio',
    "status" TEXT NOT NULL DEFAULT 'Agendada',
    "quorum" INTEGER,
    "legislaturaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamSessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamProposicao" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ementa" TEXT NOT NULL,
    "texto" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Protocolada',
    "dataProtocolo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "autorId" TEXT NOT NULL,
    "sessaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamProposicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamComissao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'Permanente',
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "legislaturaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamComissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamComissaoMembro" (
    "id" TEXT NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT 'Membro',
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "comissaoId" TEXT NOT NULL,
    "vereadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CamComissaoMembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamMesaDiretora" (
    "id" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "legislaturaId" TEXT NOT NULL,
    "vereadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamMesaDiretora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamGabinete" (
    "id" TEXT NOT NULL,
    "sala" TEXT NOT NULL,
    "andar" TEXT,
    "telefone" TEXT,
    "ramal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "vereadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamGabinete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamPauta" (
    "id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'Deliberativo',
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "sessaoId" TEXT NOT NULL,
    "proposicaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CamPauta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamVotacao" (
    "id" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL DEFAULT 'Nominal',
    "resultado" TEXT NOT NULL,
    "votosSim" INTEGER NOT NULL DEFAULT 0,
    "votosNao" INTEGER NOT NULL DEFAULT 0,
    "abstencoes" INTEGER NOT NULL DEFAULT 0,
    "observacao" TEXT,
    "proposicaoId" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CamVotacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamAta" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Rascunho',
    "dataAprovacao" TIMESTAMP(3),
    "sessaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamAta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamLei" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ementa" TEXT NOT NULL,
    "texto" TEXT,
    "dataPublicacao" TIMESTAMP(3),
    "dataVigor" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Vigente',
    "proposicaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamLei_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamParecer" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'ComissÃ£o',
    "conteudo" TEXT NOT NULL,
    "resultado" TEXT NOT NULL DEFAULT 'FavorÃ¡vel',
    "status" TEXT NOT NULL DEFAULT 'Emitido',
    "proposicaoId" TEXT NOT NULL,
    "comissaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamParecer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamAudiencia" (
    "id" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PÃºblica',
    "status" TEXT NOT NULL DEFAULT 'Agendada',
    "ata" TEXT,
    "sessaoId" TEXT,
    "legislaturaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamAudiencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamPresencaSessao" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Presente',
    "sessaoId" TEXT NOT NULL,
    "vereadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CamPresencaSessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamVoto" (
    "id" TEXT NOT NULL,
    "voto" TEXT NOT NULL,
    "votacaoId" TEXT NOT NULL,
    "vereadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CamVoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamDocumentoLegislativo" (
    "id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'PublicaÃ§Ã£o',
    "documentId" TEXT NOT NULL,
    "proposicaoId" TEXT,
    "sessaoId" TEXT,
    "ataId" TEXT,
    "leiId" TEXT,
    "parecerId" TEXT,
    "audienciaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CamDocumentoLegislativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObrasObra" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "local" TEXT,
    "tipo" TEXT NOT NULL,
    "valorEstimado" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Em Planejamento',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObrasObra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObrasMedicao" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "valorMedido" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Em AnÃ¡lise',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "obraId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObrasMedicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObrasServico" (
    "id" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aberto',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedCost" DOUBLE PRECISION,
    "departmentId" TEXT,
    "targetAssetId" TEXT,
    "budgetAppropriationId" TEXT,
    "commitmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObrasServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObrasEquipe" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObrasEquipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObrasEquipeMembro" (
    "id" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObrasEquipeMembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObrasServicoEmployee" (
    "id" TEXT NOT NULL,
    "obrasServicoId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Executor',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "ObrasServicoEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObrasServicoEquipe" (
    "id" TEXT NOT NULL,
    "obrasServicoId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "ObrasServicoEquipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObrasServicoEquipamento" (
    "id" TEXT NOT NULL,
    "obrasServicoId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "operatingHours" DOUBLE PRECISION,

    CONSTRAINT "ObrasServicoEquipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObrasServicoMaterial" (
    "id" TEXT NOT NULL,
    "obrasServicoId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "stockId" TEXT,
    "quantityPlanned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityIssued" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObrasServicoMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObrasServicoDocumento" (
    "id" TEXT NOT NULL,
    "obrasServicoId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'Comprovante',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObrasServicoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObrasServicoCompra" (
    "id" TEXT NOT NULL,
    "obrasServicoId" TEXT NOT NULL,
    "purchaseRequestId" TEXT,
    "purchaseProcessId" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'Material',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObrasServicoCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaAgente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "segmento" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "personId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturaAgente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaEspaco" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "endereco" TEXT,
    "capacidade" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DisponÃ­vel',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assetId" TEXT,
    "realEstateId" TEXT,
    "responsibleEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturaEspaco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaEvento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "publicoAlvo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Programado',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "spaceId" TEXT,
    "responsibleEmployeeId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturaEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaProjeto" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Em AnÃ¡lise',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "valorSolicitado" DOUBLE PRECISION,
    "agenteId" TEXT NOT NULL,
    "appropriationId" TEXT,
    "commitmentId" TEXT,
    "purchaseProcessId" TEXT,
    "contractId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturaProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaAtividade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "publicoAlvo" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "spaceId" TEXT,
    "instructorEmployeeId" TEXT,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturaAtividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaReserva" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Solicitada',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "spaceId" TEXT NOT NULL,
    "personId" TEXT,
    "companyId" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturaReserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaPatrimonio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "relevanciaCultural" TEXT,
    "situacaoProtecao" TEXT,
    "estadoConservacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assetId" TEXT,
    "realEstateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturaPatrimonio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaConselho" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "responsavel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturaConselho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaFundo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "descricao" TEXT,
    "appropriationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturaFundo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaEventoDocumento" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'Comprovante',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CulturaEventoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaProjetoDocumento" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'PrestaÃ§Ã£o de contas',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CulturaProjetoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaReservaDocumento" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'Termo de uso',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CulturaReservaDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturaConselhoDocumento" (
    "id" TEXT NOT NULL,
    "councilId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'Ata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CulturaConselhoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegurancaGuarda" (
    "id" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "equipe" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SegurancaGuarda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegurancaOcorrencia" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "local" TEXT,
    "bairro" TEXT,
    "prioridade" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'Registrada',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "responsavelGuardaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SegurancaOcorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegurancaInfracao" (
    "id" TEXT NOT NULL,
    "auto" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "valor" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Registrado',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SegurancaInfracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegurancaMobilidadeRegistro" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "local" TEXT,
    "bairro" TEXT,
    "responsavel" TEXT,
    "prioridade" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "valor" DOUBLE PRECISION,
    "placa" TEXT,
    "relatedModule" TEXT,
    "relatedId" TEXT,
    "assetId" TEXT,
    "obrasServicoId" TEXT,
    "documentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SegurancaMobilidadeRegistro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SequenceCounter" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SequenceCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoInstancia" (
    "id" TEXT NOT NULL,
    "nomePrefeitura" TEXT NOT NULL,
    "cnpj" TEXT,
    "municipio" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "dominio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoInstancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoParametroInstancia" (
    "id" TEXT NOT NULL,
    "configuracaoInstanciaId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoParametroInstancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoModulo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "dataAtivacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoModulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'MOCK',
    "status" TEXT NOT NULL DEFAULT 'CONFIGURANDO',
    "baseUrl" TEXT,
    "credentialReference" TEXT,
    "configuration" JSONB,
    "mockScenario" JSONB,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "lastTestMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationRun" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "externalId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiaficEntityVersion" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiaficEntityVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiaficOutboxEvent" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "actorUsuarioId" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "sourceInstanceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityVersion" INTEGER NOT NULL,
    "deliveryRevision" INTEGER NOT NULL DEFAULT 1,
    "eventType" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "destinationSnapshot" JSONB NOT NULL,
    "replacesEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiaficOutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiaficDelivery" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseToken" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "lastError" TEXT,
    "remoteEntityId" TEXT,
    "receiptId" TEXT,
    "processedAt" TIMESTAMP(3),
    "receipt" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiaficDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiaficDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "errorCode" TEXT,
    "message" TEXT,
    "durationMs" INTEGER,
    "outcome" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "SiaficDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiaficExternalLink" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "remoteEntityId" TEXT NOT NULL,
    "latestVersion" INTEGER NOT NULL,
    "latestPayloadHash" TEXT NOT NULL,
    "lastEventId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiaficExternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoPerfil" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "permissoes" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoPerfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL DEFAULT 'LEGACY_CREDENTIAL_DISABLED',
    "firebaseUid" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "perfilId" TEXT NOT NULL,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicNotice" (
    "id" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validationCode" TEXT NOT NULL,
    "publishedByUsuarioId" TEXT NOT NULL,

    CONSTRAINT "PublicNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonMergeRequest" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "sourcePersonId" TEXT NOT NULL,
    "targetPersonId" TEXT NOT NULL,
    "proposedByUsuarioId" TEXT NOT NULL,
    "approvedByUsuarioId" TEXT,
    "reversedByUsuarioId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonMergeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonMergeLedger" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sourcePersonId" TEXT NOT NULL,
    "targetPersonId" TEXT NOT NULL,
    "actorUsuarioId" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonMergeLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "financialYearId" TEXT,
    "budgetUnitId" TEXT,
    "payload" JSONB,
    "authorUsuarioId" TEXT NOT NULL,
    "authorEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB,
    "authorUsuarioId" TEXT NOT NULL,
    "authorEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioModulo" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UsuarioModulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioUnidadeGestora" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "budgetUnitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioUnidadeGestora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Covenant" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "grantor" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "totalValueDecimal" DECIMAL(18,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "bankTransactionId" TEXT,
    "integrationEventId" TEXT,
    "bankAccountExternalId" TEXT,
    "bankAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Covenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicityCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "contractNumber" TEXT,
    "approvedBudgetDecimal" DECIMAL(18,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicityCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundedDebt" (
    "id" TEXT NOT NULL,
    "creditorName" TEXT NOT NULL,
    "lawNumber" TEXT NOT NULL,
    "contractNumber" TEXT,
    "principalValueDecimal" DECIMAL(18,2) NOT NULL,
    "amortizationSchedule" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundedDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomatedBankDownload" (
    "id" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "agencia" TEXT NOT NULL,
    "contaNumero" TEXT NOT NULL,
    "tipoConta" TEXT NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3) NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoDestino" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "hashSHA256" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONCLUIDO',
    "logsExecucao" TEXT NOT NULL,
    "auditLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomatedBankDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassificationRule" (
    "id" TEXT NOT NULL,
    "bancoCodigo" TEXT,
    "textoProcurado" TEXT NOT NULL,
    "codigoTransacao" TEXT,
    "sinalEsperado" TEXT,
    "tipoMovimento" TEXT NOT NULL,
    "bancoContaFiltro" TEXT,
    "bankAccountId" TEXT,
    "tipoReceita" TEXT,
    "naturezaReceita" TEXT,
    "fonteRecurso" TEXT,
    "eventoContabil" TEXT,
    "deducaoAplicavel" BOOLEAN NOT NULL DEFAULT false,
    "prioridade" INTEGER NOT NULL DEFAULT 10,
    "exigeConfirmacao" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YieldTransaction" (
    "id" TEXT NOT NULL,
    "statementItemId" TEXT,
    "contaNumero" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "valorBrutoDecimal" DECIMAL(18,2) NOT NULL,
    "irrfDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "iofDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "correcaoDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valorLiquidoDecimal" DECIMAL(18,2) NOT NULL,
    "saldoAcumuladoDecimal" DECIMAL(18,2),
    "tipoRendimento" TEXT NOT NULL,
    "reciboMunicipal" TEXT,
    "lancamentoContabilId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YieldTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExceptionQueueItem" (
    "id" TEXT NOT NULL,
    "statementItemId" TEXT,
    "descricao" TEXT NOT NULL,
    "valorDecimal" DECIMAL(18,2) NOT NULL,
    "dataMovimento" TIMESTAMP(3) NOT NULL,
    "banco" TEXT NOT NULL,
    "contaNumero" TEXT NOT NULL,
    "sinal" TEXT NOT NULL,
    "scoreConfianca" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "sugestaoTipo" TEXT,
    "motivoExcecao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "resolvidoPor" TEXT,
    "resolvidoEm" TIMESTAMP(3),
    "regraGeradaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExceptionQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankReconciliationSession" (
    "id" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "agencia" TEXT NOT NULL,
    "contaNumero" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "saldoInicialDecimal" DECIMAL(18,2) NOT NULL,
    "totalDebitosDecimal" DECIMAL(18,2) NOT NULL,
    "totalCreditosDecimal" DECIMAL(18,2) NOT NULL,
    "saldoFinalDecimal" DECIMAL(18,2) NOT NULL,
    "saldoRazaoDecimal" DECIMAL(18,2) NOT NULL,
    "diferencaDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "totalItensBanco" INTEGER NOT NULL DEFAULT 0,
    "totalItensContabeis" INTEGER NOT NULL DEFAULT 0,
    "itensConciliados" INTEGER NOT NULL DEFAULT 0,
    "itensDivergentes" INTEGER NOT NULL DEFAULT 0,
    "confirmadoPor" TEXT,
    "confirmadoEm" TIMESTAMP(3),
    "reciboIntegracao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankReconciliationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankReconciliationMatch" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "statementItemId" TEXT,
    "treasuryMovementId" TEXT,
    "tipoMatch" TEXT NOT NULL,
    "percentualConfianca" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "observacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AUTOMATICO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankReconciliationMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadUnicoRecord" (
    "id" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "rendaPerCapita" DECIMAL(18,2) NOT NULL,
    "composicaoFamiliar" INTEGER NOT NULL DEFAULT 1,
    "endereco" TEXT,
    "municipio" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "statusCadastral" TEXT NOT NULL DEFAULT 'ATUALIZADO',
    "dataAtualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CadUnicoRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuasProntuarioRma" (
    "id" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "nomeCidadao" TEXT NOT NULL,
    "unidadeAtendimento" TEXT NOT NULL,
    "tipoAtendimento" TEXT NOT NULL,
    "detalhesRma" TEXT NOT NULL,
    "tecnicoResponsavel" TEXT NOT NULL,
    "dataAtendimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'FINALIZADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuasProntuarioRma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturalIncentiveProject" (
    "id" TEXT NOT NULL,
    "codigoEdital" TEXT NOT NULL,
    "nomeEdital" TEXT NOT NULL,
    "tituloProjeto" TEXT NOT NULL,
    "proponenteNome" TEXT NOT NULL,
    "proponenteCpfCnpj" TEXT NOT NULL,
    "categoriaCultural" TEXT NOT NULL,
    "valorSolicitado" DECIMAL(18,2) NOT NULL,
    "valorAprovado" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_ANALISE',
    "prestacaoContasStatus" TEXT NOT NULL DEFAULT 'PENDENTE',
    "reciboPrestacaoContas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CulturalIncentiveProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentalLicense" (
    "id" TEXT NOT NULL,
    "numeroProcesso" TEXT NOT NULL,
    "numeroLicenca" TEXT NOT NULL,
    "tipoLicenca" TEXT NOT NULL,
    "requerenteNome" TEXT NOT NULL,
    "requerenteCnpjCpf" TEXT NOT NULL,
    "atividade" TEXT NOT NULL,
    "enderecoEmpreendimento" TEXT NOT NULL,
    "validadeData" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EMITIDA',
    "hashSHA256" TEXT NOT NULL,
    "qrCodeValidationUrl" TEXT NOT NULL,
    "emissaoData" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnvironmentalLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficInfractionTicket" (
    "id" TEXT NOT NULL,
    "numeroAit" TEXT NOT NULL,
    "placaVeiculo" TEXT NOT NULL,
    "chassi" TEXT,
    "codigoCtb" TEXT NOT NULL,
    "descricaoInfracao" TEXT NOT NULL,
    "valorMulta" DECIMAL(18,2) NOT NULL,
    "geolocalizacao" TEXT NOT NULL,
    "agenteMatricula" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AUTUADO',
    "qrCodePix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficInfractionTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterMeterReading" (
    "id" TEXT NOT NULL,
    "codigoMatricula" TEXT NOT NULL,
    "nomeConsumidor" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "numeroHidrometro" TEXT NOT NULL,
    "leituraAnterior" DOUBLE PRECISION NOT NULL,
    "leituraAtual" DOUBLE PRECISION NOT NULL,
    "consumoM3" DOUBLE PRECISION NOT NULL,
    "valorFatura" DECIMAL(18,2) NOT NULL,
    "tipoTarifa" TEXT NOT NULL DEFAULT 'RESIDENCIAL',
    "dataLeitura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusFatura" TEXT NOT NULL DEFAULT 'EMITIDA',
    "linhaDigitavel" TEXT,
    "qrCodePix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterMeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxAuditCrossCheck" (
    "id" TEXT NOT NULL,
    "cnpjCpfContribuinte" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "origemCruzamento" TEXT NOT NULL,
    "valorDeclarado" DECIMAL(18,2) NOT NULL,
    "valorApuradoBancos" DECIMAL(18,2) NOT NULL,
    "divergenciaImposto" DECIMAL(18,2) NOT NULL,
    "statusMalha" TEXT NOT NULL DEFAULT 'MALHA_FINA',
    "numeroAutoInfracao" TEXT,
    "dataCruzamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxAuditCrossCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetUnit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "operationalStatus" TEXT NOT NULL DEFAULT 'ATIVO',
    "patrimonyStatus" TEXT,
    "plate" TEXT,
    "renavam" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "notes" TEXT,
    "departmentId" TEXT,
    "assetId" TEXT,
    "responsibleId" TEXT,
    "parentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetRoute" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "itinerary" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetUsage" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "routeId" TEXT,
    "routeSnapshot" TEXT,
    "employeeId" TEXT,
    "employeeName" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "initialReading" DECIMAL(14,3),
    "finalReading" DECIMAL(14,3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetPlan" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "firstDueAt" DATE NOT NULL,
    "nextDueAt" DATE NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "estimatedCost" DECIMAL(18,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetWorkOrder" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "scheduledAt" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "estimatedCost" DECIMAL(18,2),
    "status" TEXT NOT NULL DEFAULT 'EMITIDA',
    "startedAt" TIMESTAMP(3),
    "completedAt" DATE,
    "performed" TEXT,
    "result" TEXT,
    "actualCost" DECIMAL(18,2),
    "assetMaintenanceId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetWorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetConsumption" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "occurredAt" DATE NOT NULL,
    "material" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "measurementUnit" TEXT NOT NULL,
    "cost" DECIMAL(18,2),
    "supplierId" TEXT,
    "supplierName" TEXT,
    "reference" TEXT,
    "workOrderId" TEXT,
    "stockMovementId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetExpense" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "nature" TEXT NOT NULL,
    "occurredAt" DATE NOT NULL,
    "amount" DECIMAL(18,2),
    "description" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "reference" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetDocument" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "insurerId" TEXT,
    "insurerName" TEXT,
    "startsAt" DATE,
    "scheduledAt" DATE,
    "dueAt" DATE NOT NULL,
    "fulfilledAt" DATE,
    "fulfillmentNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "value" DECIMAL(18,2),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetOccurrence" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "involvedValue" DECIMAL(18,2),
    "reference" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetMutation" (
    "requestId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetMutation_pkey" PRIMARY KEY ("requestId")
);

-- CreateTable
CREATE TABLE "FleetAssetEvent" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromDepartmentId" TEXT,
    "toDepartmentId" TEXT,
    "fromResponsibleId" TEXT,
    "toResponsibleId" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetAssetEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "DteMailbox" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "establishmentCnpj" TEXT,
    "accessMode" TEXT NOT NULL DEFAULT 'LOGIN_PASSWORD',
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "emailNoticeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsNoticeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "confirmationTokenHash" TEXT,
    "confirmationExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DteMailbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DteAccessGrant" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "authorizedTaxpayerId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "codeLast4" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "validUntil" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DteAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "DteMessageEvent" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DteMessageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "DtePowerOfAttorneyEvent" (
    "id" TEXT NOT NULL,
    "powerOfAttorneyId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DtePowerOfAttorneyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseCredentialRequest" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "economicRegistrationId" TEXT NOT NULL,
    "serviceActivityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADO',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analyzedAt" TIMESTAMP(3),
    "enabledAt" TIMESTAMP(3),
    "decisionReason" TEXT,
    "termsVersion" TEXT NOT NULL DEFAULT 'DEMO-1',
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "createdByUsuarioId" TEXT NOT NULL,
    "analyzedByUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NfseCredentialRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseCredentialEvent" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NfseCredentialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseInvoiceData" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "economicRegistrationId" TEXT NOT NULL,
    "serviceActivityId" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "serviceDescription" TEXT NOT NULL,
    "serviceLocation" TEXT,
    "taxableBaseDecimal" DECIMAL(18,2) NOT NULL,
    "rate" DECIMAL(9,6) NOT NULL,
    "ownIssDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "retainedIssDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "retentionType" TEXT NOT NULL DEFAULT 'PROPRIO',
    "calculationSnapshot" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "authenticityUrl" TEXT NOT NULL,
    "qrPayload" TEXT NOT NULL,
    "replacedInvoiceId" TEXT,
    "replacementInvoiceId" TEXT,
    "rpsItemId" TEXT,
    "occasionalRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NfseInvoiceData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseEvent" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NfseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseCorrectionLetter" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTRADA',
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NfseCorrectionLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseRpsBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "providerTaxpayerId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "signaturePolicy" TEXT NOT NULL DEFAULT 'INTERNAL_ALLOWED',
    "signatureStatus" TEXT NOT NULL DEFAULT 'NAO_EXIGIDA',
    "documentId" TEXT,
    "payloadHash" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NfseRpsBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseRpsItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rpsNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "payload" JSONB NOT NULL,
    "invoiceId" TEXT,
    "replacedRpsNumber" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NfseRpsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseDmsDeclaration" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "economicRegistrationId" TEXT,
    "competence" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "detailMode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROTOCOLADA',
    "noMovement" BOOLEAN NOT NULL DEFAULT false,
    "rectifiesDeclarationId" TEXT,
    "serviceValueDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "deductionValueDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ownIssDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "retainedIssDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "createdByUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NfseDmsDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseOccasionalRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "providerTaxpayerId" TEXT NOT NULL,
    "takerTaxpayerId" TEXT,
    "serviceActivityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADA',
    "serviceDescription" TEXT NOT NULL,
    "serviceValueDecimal" DECIMAL(18,2) NOT NULL,
    "deductionValueDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxAmountDecimal" DECIMAL(18,2) NOT NULL,
    "paymentRequired" BOOLEAN NOT NULL DEFAULT true,
    "assessmentId" TEXT,
    "guideId" TEXT,
    "invoiceId" TEXT,
    "decisionReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NfseOccasionalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseDeductionCredit" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "economicRegistrationId" TEXT,
    "creditType" TEXT NOT NULL,
    "originDocument" TEXT NOT NULL,
    "constructionReference" TEXT,
    "originalAmountDecimal" DECIMAL(18,2) NOT NULL,
    "availableAmountDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "documentId" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NfseDeductionCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseDeductionConsumption" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountDecimal" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NfseDeductionConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimplesImportBatch" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "originMode" TEXT NOT NULL DEFAULT 'CONTROLLED_INTERNAL',
    "fileName" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "competence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSADO',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "acceptedRows" INTEGER NOT NULL DEFAULT 0,
    "rejectedRows" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "errorSummary" JSONB,
    "createdByUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimplesImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimplesFiscalRecord" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "nationalRevenueDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "declaredServiceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxableBaseDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "rate" DECIMAL(9,6),
    "municipalIssDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "confirmedPaymentDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "activityCode" TEXT,
    "paymentCode" TEXT,
    "isEstimate" BOOLEAN NOT NULL DEFAULT false,
    "rawData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VALIDO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimplesFiscalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimplesOptionPeriod" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "regime" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "sourceBatchId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimplesOptionPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimplesDivergence" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "divergenceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "nfseServiceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "declaredServiceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "revenueDifferenceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "municipalIssDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "confirmedPaymentDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paymentDifferenceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "details" JSONB NOT NULL,
    "dteMessageId" TEXT,
    "lastProcessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimplesDivergence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimplesRegularizationEvent" (
    "id" TEXT NOT NULL,
    "divergenceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimplesRegularizationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimplesExclusionCase" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "calendarRevenueDecimal" DECIMAL(18,2) NOT NULL,
    "legalLimitDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREPARADA',
    "documentId" TEXT,
    "dteMessageId" TEXT,
    "exportContent" TEXT,
    "externalReceipt" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimplesExclusionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimplesPaymentAllocation" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "revenueCode" TEXT NOT NULL,
    "taxpayerRegime" TEXT NOT NULL,
    "nationalDasDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "municipalComponentDecimal" DECIMAL(18,2) NOT NULL,
    "confirmedDecimal" DECIMAL(18,2) NOT NULL,
    "differenceDecimal" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimplesPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifFinancialInstitution" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT,
    "name" TEXT NOT NULL,
    "baseCnpj" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifFinancialInstitution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifAgency" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "economicRegistrationId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullCnpj" TEXT NOT NULL,
    "municipalRegistration" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifAgency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifCosifAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "nature" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifCosifAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPgccPlan" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "source" TEXT NOT NULL DEFAULT 'INSTITUICAO',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifPgccPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPgccAccount" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "desifTaxCode" TEXT,
    "serviceItem" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifPgccAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPgccCosifLink" (
    "id" TEXT NOT NULL,
    "pgccAccountId" TEXT NOT NULL,
    "cosifAccountId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesifPgccCosifLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifSubtitle" (
    "id" TEXT NOT NULL,
    "pgccAccountId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceItem" TEXT,
    "taxRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifSubtitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifTariff" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amountDecimal" DECIMAL(18,2) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifTariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPackage" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "tariffId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesifPackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifImportBatch" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "agencyId" TEXT,
    "competence" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "abrasfVersion" TEXT NOT NULL,
    "originMode" TEXT NOT NULL DEFAULT 'CONTROLLED_INTERNAL',
    "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "signaturePolicy" TEXT NOT NULL DEFAULT 'NAO_CONFIGURADA',
    "signatureStatus" TEXT NOT NULL DEFAULT 'NAO_VERIFICADA',
    "payload" JSONB NOT NULL,
    "inconsistencies" JSONB,
    "validationSummary" JSONB,
    "receiptNumber" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdByUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifAssessment" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subtitleId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "revenueDecimal" DECIMAL(18,2) NOT NULL,
    "deductionDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxableBaseDecimal" DECIMAL(18,2) NOT NULL,
    "rate" DECIMAL(9,6) NOT NULL,
    "grossTaxDecimal" DECIMAL(18,2) NOT NULL,
    "creditDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "debitAdjustmentDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxDueDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APURADA',
    "calculationSnapshot" JSONB NOT NULL,
    "taxAssessmentId" TEXT,
    "guideId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifTrialBalance" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "pgccAccountId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "openingBalanceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "creditsDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "debitsDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "calculatedCloseDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "declaredCloseDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "differenceDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "inconsistency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesifTrialBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifPackageMovement" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "accountHolderQuantity" INTEGER NOT NULL,
    "potentialRevenueDecimal" DECIMAL(18,2) NOT NULL,
    "collectedRevenueDecimal" DECIMAL(18,2) NOT NULL,
    "differenceDecimal" DECIMAL(18,2) NOT NULL,
    "assessmentImpactDecimal" DECIMAL(18,2) NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesifPackageMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifFiscalCase" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "agencyId" TEXT,
    "assessmentId" TEXT,
    "competence" TEXT NOT NULL,
    "findingType" TEXT NOT NULL,
    "findingDescription" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "processId" TEXT,
    "serviceOrderNumber" TEXT,
    "tiafDocumentId" TEXT,
    "mapDocumentId" TEXT,
    "infractionId" TEXT,
    "dteMessageId" TEXT,
    "guideId" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesifFiscalCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesifFiscalEvent" (
    "id" TEXT NOT NULL,
    "fiscalCaseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesifFiscalEvent_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "TaxCollectionProfile" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCollectionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCollectionPortfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileId" TEXT,
    "selectionMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "selectionSnapshot" JSONB NOT NULL,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCollectionPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCollectionPortfolioItem" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "originalDecimal" DECIMAL(18,2) NOT NULL,
    "outstandingDecimal" DECIMAL(18,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCollectionPortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCollectionRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileCode" TEXT,
    "steps" JSONB NOT NULL,
    "allowedChannels" JSONB NOT NULL,
    "allowedModalities" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCollectionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCollectionAction" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "portfolioItemId" TEXT,
    "taxpayerId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "performedAt" TIMESTAMP(3),
    "resultCode" TEXT,
    "resultDescription" TEXT,
    "nextActionAt" TIMESTAMP(3),
    "evidenceDocumentId" TEXT,
    "dteMessageId" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCollectionAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCollectionActionEvent" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCollectionActionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalReference" TEXT NOT NULL,
    "minInstallments" INTEGER NOT NULL DEFAULT 1,
    "maxInstallments" INTEGER NOT NULL,
    "minQuotaDecimal" DECIMAL(18,2) NOT NULL,
    "discountConfiguration" JSONB NOT NULL,
    "feeConfiguration" JSONB NOT NULL,
    "breakConfiguration" JSONB NOT NULL,
    "dueDayOptions" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInstallmentRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentAgreement" (
    "id" TEXT NOT NULL,
    "agreementNumber" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "parentAgreementId" TEXT,
    "agreementType" TEXT NOT NULL DEFAULT 'ORIGINAL',
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "installmentCount" INTEGER NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "originalDebtDecimal" DECIMAL(18,2) NOT NULL,
    "discountDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "feesDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalAgreementDecimal" DECIMAL(18,2) NOT NULL,
    "paidDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "balanceDecimal" DECIMAL(18,2) NOT NULL,
    "simulationSnapshot" JSONB NOT NULL,
    "termDocumentId" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "adheredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brokenAt" TIMESTAMP(3),
    "reactivatedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInstallmentAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentDebt" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "originLabel" TEXT NOT NULL,
    "originalAmountDecimal" DECIMAL(18,2) NOT NULL,
    "revisedAmountDecimal" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxInstallmentDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentQuota" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "quotaNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "originalDecimal" DECIMAL(18,2) NOT NULL,
    "paidDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "balanceDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "guideId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInstallmentQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentPaymentAllocation" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "quotaId" TEXT NOT NULL,
    "paymentKey" TEXT NOT NULL,
    "amountDecimal" DECIMAL(18,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMode" TEXT NOT NULL DEFAULT 'FORA_DA_PARCELA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxInstallmentPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInstallmentEvent" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "actorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxInstallmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxpayerPortalAccess" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "accessType" TEXT NOT NULL DEFAULT 'TITULAR',
    "scopes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "grantedByUsuarioId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "TaxpayerPortalAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxBenefitRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "benefitType" TEXT NOT NULL,
    "legalReference" TEXT NOT NULL,
    "eligibility" JSONB NOT NULL,
    "calculation" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxBenefitRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxBenefitGrant" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "originalAmountDecimal" DECIMAL(18,2) NOT NULL,
    "creditDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "reductionDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "renunciationDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "finalAmountDecimal" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONCEDIDO',
    "calculationSnapshot" JSONB NOT NULL,
    "grantedByUsuarioId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxBenefitGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPrizeDraw" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "drawNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "eligibilityRules" JSONB NOT NULL,
    "requiresPayment" BOOLEAN NOT NULL DEFAULT false,
    "taxpayerTypes" JSONB NOT NULL,
    "winnerCount" INTEGER NOT NULL DEFAULT 1,
    "technicalSeed" TEXT NOT NULL,
    "officialActReference" TEXT,
    "createdByUsuarioId" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxPrizeDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPrizeCoupon" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "couponNumber" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "sourceDocumentType" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "eligibilitySnapshot" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ELEGIVEL',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxPrizeCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPrizeExecution" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "executionNumber" INTEGER NOT NULL,
    "algorithm" TEXT NOT NULL,
    "seedHash" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "resultHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONCLUIDA',
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedByUsuarioId" TEXT NOT NULL,

    CONSTRAINT "TaxPrizeExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPrizeWinner" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "resultKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxPrizeWinner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SchoolToSchoolBus" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SchoolToSchoolBus_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_scope_key" ON "ReportTemplate"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_fingerprint_key" ON "ReportTemplate"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_cpf_key" ON "Employee"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_personId_key" ON "Employee"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_cpf_key" ON "Person"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Company_cnpj_key" ON "Company"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Taxpayer_municipalInsc_key" ON "Taxpayer"("municipalInsc");

-- CreateIndex
CREATE UNIQUE INDEX "Taxpayer_personId_key" ON "Taxpayer"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Taxpayer_companyId_key" ON "Taxpayer"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_personId_key" ON "Supplier"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_companyId_key" ON "Supplier"("companyId");

-- CreateIndex
CREATE INDEX "Address_canonicalAddressId_idx" ON "Address"("canonicalAddressId");

-- CreateIndex
CREATE UNIQUE INDEX "RealEstate_municipalInsc_key" ON "RealEstate"("municipalInsc");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentClass_code_key" ON "DocumentClass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_publicValidationCode_key" ON "DocumentVersion"("publicValidationCode");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_status_idx" ON "DocumentVersion"("documentId", "status");

-- CreateIndex
CREATE INDEX "DocumentVersion_hashSha256_idx" ON "DocumentVersion"("hashSha256");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_versionNumber_key" ON "DocumentVersion"("documentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSignature_verificationCode_key" ON "DocumentSignature"("verificationCode");

-- CreateIndex
CREATE INDEX "DocumentSignature_documentId_status_idx" ON "DocumentSignature"("documentId", "status");

-- CreateIndex
CREATE INDEX "DocumentSignature_signerUsuarioId_createdAt_idx" ON "DocumentSignature"("signerUsuarioId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSignature_documentVersionId_signerUsuarioId_key" ON "DocumentSignature"("documentVersionId", "signerUsuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Process_protocolNumber_key" ON "Process"("protocolNumber");

-- CreateIndex
CREATE INDEX "ProcessWorkflowStage_processTypeId_subjectId_isActive_posit_idx" ON "ProcessWorkflowStage"("processTypeId", "subjectId", "isActive", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessWorkflowStage_processTypeId_subjectId_position_key" ON "ProcessWorkflowStage"("processTypeId", "subjectId", "position");

-- CreateIndex
CREATE INDEX "GenericProcessWorkflowDefinition_processTypeId_status_idx" ON "GenericProcessWorkflowDefinition"("processTypeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GenericProcessWorkflowDefinition_processTypeId_version_key" ON "GenericProcessWorkflowDefinition"("processTypeId", "version");

-- CreateIndex
CREATE INDEX "GenericProcessWorkflowStage_definitionId_position_idx" ON "GenericProcessWorkflowStage"("definitionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "GenericProcessWorkflowStage_definitionId_position_key" ON "GenericProcessWorkflowStage"("definitionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "GenericProcessWorkflowInstance_processId_key" ON "GenericProcessWorkflowInstance"("processId");

-- CreateIndex
CREATE INDEX "GenericProcessWorkflowInstance_definitionId_idx" ON "GenericProcessWorkflowInstance"("definitionId");

-- CreateIndex
CREATE INDEX "GenericProcessWorkflowInstance_status_dueAt_idx" ON "GenericProcessWorkflowInstance"("status", "dueAt");

-- CreateIndex
CREATE INDEX "GenericProcessWorkflowEvent_instanceId_createdAt_idx" ON "GenericProcessWorkflowEvent"("instanceId", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessDocument_documentId_idx" ON "ProcessDocument"("documentId");

-- CreateIndex
CREATE INDEX "ProcessEvent_processId_createdAt_idx" ON "ProcessEvent"("processId", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessEvent_departmentId_createdAt_idx" ON "ProcessEvent"("departmentId", "createdAt");

-- CreateIndex
CREATE INDEX "ProtocolNotification_userId_readAt_createdAt_idx" ON "ProtocolNotification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "ProtocolNotification_sourceModule_entityType_entityId_creat_idx" ON "ProtocolNotification"("sourceModule", "entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "ProtocolNotification_processId_createdAt_idx" ON "ProtocolNotification"("processId", "createdAt");

-- CreateIndex
CREATE INDEX "ProtocolNotification_userId_dedupeKey_idx" ON "ProtocolNotification"("userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "SupportChannel_isActive_sortOrder_idx" ON "SupportChannel"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSubject_name_key" ON "ServiceSubject"("name");

-- CreateIndex
CREATE INDEX "ServiceSubject_isActive_name_idx" ON "ServiceSubject"("isActive", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_processId_key" ON "Ticket"("processId");

-- CreateIndex
CREATE INDEX "Ticket_departmentId_status_dueAt_idx" ON "Ticket"("departmentId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "Ticket_assigneeId_status_idx" ON "Ticket"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "Ticket_serviceSubjectId_idx" ON "Ticket"("serviceSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Ombudsman_protocolNumber_key" ON "Ombudsman"("protocolNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Ombudsman_processId_key" ON "Ombudsman"("processId");

-- CreateIndex
CREATE INDEX "Ombudsman_departmentId_status_idx" ON "Ombudsman"("departmentId", "status");

-- CreateIndex
CREATE INDEX "Ombudsman_isConfidential_createdAt_idx" ON "Ombudsman"("isConfidential", "createdAt");

-- CreateIndex
CREATE INDEX "TicketInteraction_ticketId_createdAt_idx" ON "TicketInteraction"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketDocument_documentId_idx" ON "TicketDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketDocument_ticketId_documentId_key" ON "TicketDocument"("ticketId", "documentId");

-- CreateIndex
CREATE INDEX "TicketMovement_ticketId_createdAt_idx" ON "TicketMovement"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketMovement_toDepartmentId_createdAt_idx" ON "TicketMovement"("toDepartmentId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketAuditLog_ticketId_createdAt_idx" ON "TicketAuditLog"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "OmbudsmanAccess_userId_idx" ON "OmbudsmanAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OmbudsmanAccess_ombudsmanId_userId_key" ON "OmbudsmanAccess"("ombudsmanId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OmbudsmanIdentity_ombudsmanId_key" ON "OmbudsmanIdentity"("ombudsmanId");

-- CreateIndex
CREATE INDEX "OmbudsmanMovement_ombudsmanId_createdAt_idx" ON "OmbudsmanMovement"("ombudsmanId", "createdAt");

-- CreateIndex
CREATE INDEX "OmbudsmanMovement_toDepartmentId_createdAt_idx" ON "OmbudsmanMovement"("toDepartmentId", "createdAt");

-- CreateIndex
CREATE INDEX "OmbudsmanInteraction_ombudsmanId_createdAt_idx" ON "OmbudsmanInteraction"("ombudsmanId", "createdAt");

-- CreateIndex
CREATE INDEX "OmbudsmanDocument_documentId_idx" ON "OmbudsmanDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "OmbudsmanDocument_ombudsmanId_documentId_key" ON "OmbudsmanDocument"("ombudsmanId", "documentId");

-- CreateIndex
CREATE INDEX "OmbudsmanAuditLog_ombudsmanId_createdAt_idx" ON "OmbudsmanAuditLog"("ombudsmanId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SatisfactionSurvey_ticketId_key" ON "SatisfactionSurvey"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "PortalPage_slug_key" ON "PortalPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PortalNews_slug_key" ON "PortalNews"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialDiary_editionNumber_key" ON "OfficialDiary"("editionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InformationRequest_protocolNumber_key" ON "InformationRequest"("protocolNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EconomicRegistration_municipalInsc_key" ON "EconomicRegistration"("municipalInsc");

-- CreateIndex
CREATE UNIQUE INDEX "TaxAssessment_assessmentNumber_key" ON "TaxAssessment"("assessmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TaxGuide_barcode_key" ON "TaxGuide"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "TaxGuide_guideNumber_key" ON "TaxGuide"("guideNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPayment_idempotencyKey_key" ON "TaxPayment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveDebt_cdaNumber_key" ON "ActiveDebt"("cdaNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveDebt_sourceKey_key" ON "ActiveDebt"("sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveDebt_assessmentId_key" ON "ActiveDebt"("assessmentId");

-- CreateIndex
CREATE INDEX "TaxActiveDebtEvent_activeDebtId_createdAt_idx" ON "TaxActiveDebtEvent"("activeDebtId", "createdAt");

-- CreateIndex
CREATE INDEX "TaxCdaVersion_cdaNumber_idx" ON "TaxCdaVersion"("cdaNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCdaVersion_activeDebtId_versionNumber_key" ON "TaxCdaVersion"("activeDebtId", "versionNumber");

-- CreateIndex
CREATE INDEX "TaxDebtSuspension_activeDebtId_status_idx" ON "TaxDebtSuspension"("activeDebtId", "status");

-- CreateIndex
CREATE INDEX "TaxDaPortfolioItem_activeDebtId_idx" ON "TaxDaPortfolioItem"("activeDebtId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxDaPortfolioItem_portfolioId_activeDebtId_key" ON "TaxDaPortfolioItem"("portfolioId", "activeDebtId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxProtestBatch_batchNumber_key" ON "TaxProtestBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "TaxProtestItem_activeDebtId_status_idx" ON "TaxProtestItem"("activeDebtId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxProtestItem_batchId_activeDebtId_key" ON "TaxProtestItem"("batchId", "activeDebtId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxExecutionBatch_batchNumber_key" ON "TaxExecutionBatch"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TaxExecutionBatch_internalProtocol_key" ON "TaxExecutionBatch"("internalProtocol");

-- CreateIndex
CREATE UNIQUE INDEX "TaxExecutionCase_internalProtocol_key" ON "TaxExecutionCase"("internalProtocol");

-- CreateIndex
CREATE INDEX "TaxExecutionCase_activeDebtId_status_idx" ON "TaxExecutionCase"("activeDebtId", "status");

-- CreateIndex
CREATE INDEX "TaxExecutionEvent_caseId_createdAt_idx" ON "TaxExecutionEvent"("caseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCemetery_code_key" ON "TaxCemetery"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCemeterySector_cemeteryId_code_key" ON "TaxCemeterySector"("cemeteryId", "code");

-- CreateIndex
CREATE INDEX "TaxGrave_sectorId_status_idx" ON "TaxGrave"("sectorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxGrave_cemeteryId_code_key" ON "TaxGrave"("cemeteryId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "TaxDeathCause_code_key" ON "TaxDeathCause"("code");

-- CreateIndex
CREATE INDEX "TaxDeceased_cemeteryId_deathDate_idx" ON "TaxDeceased"("cemeteryId", "deathDate");

-- CreateIndex
CREATE INDEX "TaxDeceased_graveId_idx" ON "TaxDeceased"("graveId");

-- CreateIndex
CREATE INDEX "TaxBurialMovement_graveId_movementType_idx" ON "TaxBurialMovement"("graveId", "movementType");

-- CreateIndex
CREATE INDEX "TaxGraveConcession_graveId_status_idx" ON "TaxGraveConcession"("graveId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VafExercise_year_key" ON "VafExercise"("year");

-- CreateIndex
CREATE INDEX "VafRule_exerciseId_cfop_idx" ON "VafRule"("exerciseId", "cfop");

-- CreateIndex
CREATE INDEX "VafRule_effectiveFrom_effectiveUntil_idx" ON "VafRule"("effectiveFrom", "effectiveUntil");

-- CreateIndex
CREATE UNIQUE INDEX "VafCompany_cnpj_key" ON "VafCompany"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "VafAccountant_cpfCnpj_key" ON "VafAccountant"("cpfCnpj");

-- CreateIndex
CREATE INDEX "VafEfdImport_exerciseId_competency_idx" ON "VafEfdImport"("exerciseId", "competency");

-- CreateIndex
CREATE UNIQUE INDEX "VafEfdImport_companyId_exerciseId_competency_version_key" ON "VafEfdImport"("companyId", "exerciseId", "competency", "version");

-- CreateIndex
CREATE INDEX "VafGiaImport_exerciseId_competency_idx" ON "VafGiaImport"("exerciseId", "competency");

-- CreateIndex
CREATE UNIQUE INDEX "VafGiaImport_companyId_exerciseId_competency_version_key" ON "VafGiaImport"("companyId", "exerciseId", "competency", "version");

-- CreateIndex
CREATE INDEX "VafMonthlySummary_exerciseId_competency_idx" ON "VafMonthlySummary"("exerciseId", "competency");

-- CreateIndex
CREATE INDEX "VafMonthlySummary_companyId_competency_idx" ON "VafMonthlySummary"("companyId", "competency");

-- CreateIndex
CREATE UNIQUE INDEX "VafMonthlySummary_exerciseId_companyId_competency_cfop_key" ON "VafMonthlySummary"("exerciseId", "companyId", "competency", "cfop");

-- CreateIndex
CREATE INDEX "VafResult_exerciseId_competency_idx" ON "VafResult"("exerciseId", "competency");

-- CreateIndex
CREATE INDEX "VafResult_exerciseId_vafValue_idx" ON "VafResult"("exerciseId", "vafValue");

-- CreateIndex
CREATE UNIQUE INDEX "VafResult_exerciseId_companyId_competency_sourceType_key" ON "VafResult"("exerciseId", "companyId", "competency", "sourceType");

-- CreateIndex
CREATE INDEX "VafCompanyIndex_exerciseId_competency_idx" ON "VafCompanyIndex"("exerciseId", "competency");

-- CreateIndex
CREATE UNIQUE INDEX "VafCompanyIndex_exerciseId_companyId_competency_key" ON "VafCompanyIndex"("exerciseId", "companyId", "competency");

-- CreateIndex
CREATE INDEX "VafMunicipalIndex_exerciseId_competency_idx" ON "VafMunicipalIndex"("exerciseId", "competency");

-- CreateIndex
CREATE UNIQUE INDEX "VafMunicipalIndex_exerciseId_competency_key" ON "VafMunicipalIndex"("exerciseId", "competency");

-- CreateIndex
CREATE INDEX "VafRepasse_exerciseId_competency_idx" ON "VafRepasse"("exerciseId", "competency");

-- CreateIndex
CREATE UNIQUE INDEX "VafRepasse_exerciseId_competency_weekNumber_version_key" ON "VafRepasse"("exerciseId", "competency", "weekNumber", "version");

-- CreateIndex
CREATE UNIQUE INDEX "VafProtocol_protocolNumber_key" ON "VafProtocol"("protocolNumber");

-- CreateIndex
CREATE INDEX "VafProtocol_companyId_competency_idx" ON "VafProtocol"("companyId", "competency");

-- CreateIndex
CREATE INDEX "VafProtocol_accountantId_competency_idx" ON "VafProtocol"("accountantId", "competency");

-- CreateIndex
CREATE INDEX "VafProtocol_exerciseId_competency_idx" ON "VafProtocol"("exerciseId", "competency");

-- CreateIndex
CREATE INDEX "VafNotification_companyId_status_idx" ON "VafNotification"("companyId", "status");

-- CreateIndex
CREATE INDEX "VafNotification_accountantId_status_idx" ON "VafNotification"("accountantId", "status");

-- CreateIndex
CREATE INDEX "VafNotification_exerciseId_competency_idx" ON "VafNotification"("exerciseId", "competency");

-- CreateIndex
CREATE INDEX "VafActivity_exerciseId_competency_status_idx" ON "VafActivity"("exerciseId", "competency", "status");

-- CreateIndex
CREATE INDEX "VafActivity_assignedTo_status_idx" ON "VafActivity"("assignedTo", "status");

-- CreateIndex
CREATE INDEX "VafEstimate_exerciseId_competency_idx" ON "VafEstimate"("exerciseId", "competency");

-- CreateIndex
CREATE INDEX "VafCrossCheck_exerciseId_competency_status_idx" ON "VafCrossCheck"("exerciseId", "competency", "status");

-- CreateIndex
CREATE INDEX "VafCrossCheck_companyId_competency_idx" ON "VafCrossCheck"("companyId", "competency");

-- CreateIndex
CREATE INDEX "VafCfopEntry_exerciseId_companyId_competency_cfop_idx" ON "VafCfopEntry"("exerciseId", "companyId", "competency", "cfop");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCertificate_authCode_key" ON "TaxCertificate"("authCode");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_verificationCode_key" ON "Invoice"("verificationCode");

-- CreateIndex
CREATE INDEX "TaxParameter_taxId_isActive_effectiveFrom_idx" ON "TaxParameter"("taxId", "isActive", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaxParameter_taxId_code_effectiveFrom_key" ON "TaxParameter"("taxId", "code", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyValuation_realEstateId_year_key" ON "PropertyValuation"("realEstateId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "TaxServiceActivity_taxId_code_key" ON "TaxServiceActivity"("taxId", "code");

-- CreateIndex
CREATE INDEX "TaxDeclaration_taxpayerId_competence_idx" ON "TaxDeclaration"("taxpayerId", "competence");

-- CreateIndex
CREATE INDEX "TaxDeclaration_activityId_competence_idx" ON "TaxDeclaration"("activityId", "competence");

-- CreateIndex
CREATE INDEX "TaxServiceRequest_taxpayerId_serviceType_status_idx" ON "TaxServiceRequest"("taxpayerId", "serviceType", "status");

-- CreateIndex
CREATE INDEX "TaxServiceRequest_processId_idx" ON "TaxServiceRequest"("processId");

-- CreateIndex
CREATE INDEX "TaxServiceRequest_documentId_idx" ON "TaxServiceRequest"("documentId");

-- CreateIndex
CREATE INDEX "TaxCaseLink_entityType_entityId_idx" ON "TaxCaseLink"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "TaxCaseLink_processId_idx" ON "TaxCaseLink"("processId");

-- CreateIndex
CREATE INDEX "TaxCaseLink_documentId_idx" ON "TaxCaseLink"("documentId");

-- CreateIndex
CREATE INDEX "TaxRegistryEntry_entityType_entityId_category_status_idx" ON "TaxRegistryEntry"("entityType", "entityId", "category", "status");

-- CreateIndex
CREATE INDEX "TaxRegistryEntry_processId_idx" ON "TaxRegistryEntry"("processId");

-- CreateIndex
CREATE INDEX "TaxRegistryEntry_documentId_idx" ON "TaxRegistryEntry"("documentId");

-- CreateIndex
CREATE INDEX "TaxRegistryEntry_effectiveFrom_effectiveUntil_idx" ON "TaxRegistryEntry"("effectiveFrom", "effectiveUntil");

-- CreateIndex
CREATE UNIQUE INDEX "TaxIntegrationEvent_idempotencyKey_key" ON "TaxIntegrationEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "TaxIntegrationEvent_integrationCode_eventType_status_idx" ON "TaxIntegrationEvent"("integrationCode", "eventType", "status");

-- CreateIndex
CREATE INDEX "TaxIntegrationEvent_taxpayerId_idx" ON "TaxIntegrationEvent"("taxpayerId");

-- CreateIndex
CREATE INDEX "TaxIntegrationEvent_economicRegistrationId_idx" ON "TaxIntegrationEvent"("economicRegistrationId");

-- CreateIndex
CREATE INDEX "TaxIntegrationEvent_receivedAt_idx" ON "TaxIntegrationEvent"("receivedAt");

-- CreateIndex
CREATE INDEX "DebtInstallmentSchedule_status_dueDate_idx" ON "DebtInstallmentSchedule"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "DebtInstallmentSchedule_debtInstallmentId_installmentNumber_key" ON "DebtInstallmentSchedule"("debtInstallmentId", "installmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCertificateEvaluation_certificateId_key" ON "TaxCertificateEvaluation"("certificateId");

-- CreateIndex
CREATE INDEX "TaxCertificateEvaluation_taxpayerId_evaluatedAt_idx" ON "TaxCertificateEvaluation"("taxpayerId", "evaluatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialYear_year_key" ON "FinancialYear"("year");

-- CreateIndex
CREATE UNIQUE INDEX "MultiYearPlan_code_key" ON "MultiYearPlan"("code");

-- CreateIndex
CREATE INDEX "PlanningAmendment_entityType_entityId_createdAt_idx" ON "PlanningAmendment"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningAmendment_entityType_entityId_version_key" ON "PlanningAmendment"("entityType", "entityId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramPPA_multiYearPlanId_code_key" ON "ProgramPPA"("multiYearPlanId", "code");

-- CreateIndex
CREATE INDEX "BudgetGuideline_multiYearPlanId_idx" ON "BudgetGuideline"("multiYearPlanId");

-- CreateIndex
CREATE INDEX "AnnualBudgetLaw_budgetGuidelineId_idx" ON "AnnualBudgetLaw"("budgetGuidelineId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyDisbursementSchedule_annualBudgetLawId_month_budgetU_key" ON "MonthlyDisbursementSchedule"("annualBudgetLawId", "month", "budgetUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "BimonthlyRevenueTarget_annualBudgetLawId_bimonth_key" ON "BimonthlyRevenueTarget"("annualBudgetLawId", "bimonth");

-- CreateIndex
CREATE UNIQUE INDEX "CreditRequest_number_key" ON "CreditRequest"("number");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetUnit_code_key" ON "BudgetUnit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceSource_code_key" ON "ResourceSource"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueNature_code_key" ON "RevenueNature"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseNature_code_key" ON "ExpenseNature"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAppropriation_code_key" ON "BudgetAppropriation"("code");

-- CreateIndex
CREATE INDEX "BudgetAppropriation_annualBudgetExpenseFixationId_idx" ON "BudgetAppropriation"("annualBudgetExpenseFixationId");

-- CreateIndex
CREATE INDEX "BudgetAppropriation_programPPAId_actionPPAId_idx" ON "BudgetAppropriation"("programPPAId", "actionPPAId");

-- CreateIndex
CREATE UNIQUE INDEX "Revenue_idempotencyKey_key" ON "Revenue"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Revenue_financialYearId_stage_date_idx" ON "Revenue"("financialYearId", "stage", "date");

-- CreateIndex
CREATE INDEX "Revenue_resourceSourceId_stage_idx" ON "Revenue"("resourceSourceId", "stage");

-- CreateIndex
CREATE INDEX "Revenue_bankTransactionId_idx" ON "Revenue"("bankTransactionId");

-- CreateIndex
CREATE INDEX "Revenue_integrationEventId_idx" ON "Revenue"("integrationEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_idempotencyKey_key" ON "Expense"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_purchaseReceiptId_key" ON "Expense"("purchaseReceiptId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetReservation_number_key" ON "BudgetReservation"("number");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetMovement_idempotencyKey_key" ON "BudgetMovement"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Creditor_document_key" ON "Creditor"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Creditor_personId_key" ON "Creditor"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Creditor_companyId_key" ON "Creditor"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Creditor_supplierId_key" ON "Creditor"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Commitment_number_key" ON "Commitment"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Commitment_purchaseReceiptId_key" ON "Commitment"("purchaseReceiptId");

-- CreateIndex
CREATE UNIQUE INDEX "Commitment_reservationId_key" ON "Commitment"("reservationId");

-- CreateIndex
CREATE INDEX "CommitmentMovement_commitmentId_date_idx" ON "CommitmentMovement"("commitmentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_fiscalDocumentAccessKey_key" ON "Settlement"("fiscalDocumentAccessKey");

-- CreateIndex
CREATE INDEX "Settlement_documentId_idx" ON "Settlement"("documentId");

-- CreateIndex
CREATE INDEX "Settlement_fiscalDocumentNumber_fiscalDocumentSeries_idx" ON "Settlement"("fiscalDocumentNumber", "fiscalDocumentSeries");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderNumber_key" ON "Payment"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentOrderExternalId_key" ON "Payment"("paymentOrderExternalId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_integrationEventId_key" ON "Payment"("integrationEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bankTransactionId_key" ON "Payment"("bankTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reversalBankTransactionId_key" ON "Payment"("reversalBankTransactionId");

-- CreateIndex
CREATE INDEX "Payment_bankAccountExternalId_bankStatus_idx" ON "Payment"("bankAccountExternalId", "bankStatus");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialDocument_number_key" ON "FinancialDocument"("number");

-- CreateIndex
CREATE INDEX "FinancialDocument_documentType_generatedAt_idx" ON "FinancialDocument"("documentType", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialDocument_commitmentId_key" ON "FinancialDocument"("commitmentId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialDocument_settlementId_key" ON "FinancialDocument"("settlementId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialDocument_paymentId_key" ON "FinancialDocument"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialDocument_withholdingPayableId_key" ON "FinancialDocument"("withholdingPayableId");

-- CreateIndex
CREATE INDEX "PaymentRetention_paymentId_idx" ON "PaymentRetention"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentRetention_settlementRetentionId_idx" ON "PaymentRetention"("settlementRetentionId");

-- CreateIndex
CREATE INDEX "PaymentRetention_retentionRuleId_idx" ON "PaymentRetention"("retentionRuleId");

-- CreateIndex
CREATE INDEX "SettlementRetention_retentionRuleId_idx" ON "SettlementRetention"("retentionRuleId");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementRetention_settlementId_retentionRuleId_key" ON "SettlementRetention"("settlementId", "retentionRuleId");

-- CreateIndex
CREATE UNIQUE INDEX "RetentionRule_code_key" ON "RetentionRule"("code");

-- CreateIndex
CREATE INDEX "RetentionRule_isActive_effectiveFrom_effectiveTo_idx" ON "RetentionRule"("isActive", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "RetentionRule_financialYearId_serviceCode_idx" ON "RetentionRule"("financialYearId", "serviceCode");

-- CreateIndex
CREATE UNIQUE INDEX "WithholdingPayable_retentionId_key" ON "WithholdingPayable"("retentionId");

-- CreateIndex
CREATE INDEX "WithholdingPayable_status_dueDate_idx" ON "WithholdingPayable"("status", "dueDate");

-- CreateIndex
CREATE INDEX "WithholdingPayable_receiptDocumentId_idx" ON "WithholdingPayable"("receiptDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_accountingPlanId_key" ON "BankAccount"("accountingPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_externalId_key" ON "BankAccount"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryMovement_revenueId_key" ON "TreasuryMovement"("revenueId");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryMovement_idempotencyKey_key" ON "TreasuryMovement"("idempotencyKey");

-- CreateIndex
CREATE INDEX "TreasuryMovement_bankAccountId_date_idx" ON "TreasuryMovement"("bankAccountId", "date");

-- CreateIndex
CREATE INDEX "TreasuryMovement_financialYearId_date_idx" ON "TreasuryMovement"("financialYearId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueReversal_revenueId_key" ON "RevenueReversal"("revenueId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueReversal_treasuryMovementId_key" ON "RevenueReversal"("treasuryMovementId");

-- CreateIndex
CREATE INDEX "RevenueReversal_financialYearId_date_idx" ON "RevenueReversal"("financialYearId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueResourceRedistribution_idempotencyKey_key" ON "RevenueResourceRedistribution"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RevenueResourceRedistribution_revenueId_date_idx" ON "RevenueResourceRedistribution"("revenueId", "date");

-- CreateIndex
CREATE INDEX "RevenueResourceRedistribution_sourceResourceSourceId_destin_idx" ON "RevenueResourceRedistribution"("sourceResourceSourceId", "destinationResourceSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryTransfer_sourceMovementId_key" ON "TreasuryTransfer"("sourceMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryTransfer_destinationMovementId_key" ON "TreasuryTransfer"("destinationMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryTransfer_idempotencyKey_key" ON "TreasuryTransfer"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "BankStatementImport_bankAccountId_checksum_key" ON "BankStatementImport"("bankAccountId", "checksum");

-- CreateIndex
CREATE UNIQUE INDEX "BankStatementItem_treasuryMovementId_key" ON "BankStatementItem"("treasuryMovementId");

-- CreateIndex
CREATE INDEX "BankStatementItem_statementImportId_date_idx" ON "BankStatementItem"("statementImportId", "date");

-- CreateIndex
CREATE INDEX "BankStatementItem_treasuryMovementId_idx" ON "BankStatementItem"("treasuryMovementId");

-- CreateIndex
CREATE INDEX "BankStatementItem_downloadId_idx" ON "BankStatementItem"("downloadId");

-- CreateIndex
CREATE INDEX "BankStatementItem_contaNumero_date_idx" ON "BankStatementItem"("contaNumero", "date");

-- CreateIndex
CREATE INDEX "BankStatementItem_bankAccountId_bankTransactionId_idx" ON "BankStatementItem"("bankAccountId", "bankTransactionId");

-- CreateIndex
CREATE INDEX "BankStatementItem_integrationEventId_idx" ON "BankStatementItem"("integrationEventId");

-- CreateIndex
CREATE UNIQUE INDEX "BankStatementItem_banco_agencia_contaNumero_codigoTransacao_key" ON "BankStatementItem"("banco", "agencia", "contaNumero", "codigoTransacao");

-- CreateIndex
CREATE UNIQUE INDEX "TaxFinancialMapping_taxId_key" ON "TaxFinancialMapping"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxDocumentSequence_year_documentType_key" ON "TaxDocumentSequence"("year", "documentType");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRevenueIntegrationEvent_taxPaymentId_key" ON "TaxRevenueIntegrationEvent"("taxPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRevenueIntegrationEvent_revenueId_key" ON "TaxRevenueIntegrationEvent"("revenueId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRevenueIntegrationEvent_idempotencyKey_key" ON "TaxRevenueIntegrationEvent"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentAllocation_treasuryTransferId_key" ON "InvestmentAllocation"("treasuryTransferId");

-- CreateIndex
CREATE INDEX "InvestmentAllocation_investmentBankAccountId_originBankAcco_idx" ON "InvestmentAllocation"("investmentBankAccountId", "originBankAccountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingPlan_code_key" ON "AccountingPlan"("code");

-- CreateIndex
CREATE INDEX "AccountingEntry_transactionId_accountId_idx" ON "AccountingEntry"("transactionId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingTransaction_idempotencyKey_key" ON "AccountingTransaction"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingTransaction_reversalOfId_key" ON "AccountingTransaction"("reversalOfId");

-- CreateIndex
CREATE INDEX "AccountingTransaction_financialYearId_date_status_idx" ON "AccountingTransaction"("financialYearId", "date", "status");

-- CreateIndex
CREATE INDEX "AccountingTransaction_sourceModule_sourceType_sourceId_idx" ON "AccountingTransaction"("sourceModule", "sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingEventCatalog_code_key" ON "AccountingEventCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingPostingRule_eventId_debitAccountId_creditAccountI_key" ON "AccountingPostingRule"("eventId", "debitAccountId", "creditAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyAccountingClose_financialYearId_competence_key" ON "MonthlyAccountingClose"("financialYearId", "competence");

-- CreateIndex
CREATE INDEX "MonthlyAccountingCloseEvent_monthlyAccountingCloseId_create_idx" ON "MonthlyAccountingCloseEvent"("monthlyAccountingCloseId", "createdAt");

-- CreateIndex
CREATE INDEX "MonthlyAccountingCloseEvent_requestedByUsuarioId_idx" ON "MonthlyAccountingCloseEvent"("requestedByUsuarioId");

-- CreateIndex
CREATE INDEX "MonthlyAccountingCloseEvent_authorizedByUsuarioId_idx" ON "MonthlyAccountingCloseEvent"("authorizedByUsuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualAccountingClose_financialYearId_key" ON "AnnualAccountingClose"("financialYearId");

-- CreateIndex
CREATE UNIQUE INDEX "PayableCarryForward_previousPayableCarryForwardId_key" ON "PayableCarryForward"("previousPayableCarryForwardId");

-- CreateIndex
CREATE INDEX "PayableCarryForward_originFinancialYearId_type_idx" ON "PayableCarryForward"("originFinancialYearId", "type");

-- CreateIndex
CREATE INDEX "PayableCarryForward_status_idx" ON "PayableCarryForward"("status");

-- CreateIndex
CREATE INDEX "PayableCarryForward_bankTransactionId_idx" ON "PayableCarryForward"("bankTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PayableCarryForward_financialYearId_commitmentId_type_key" ON "PayableCarryForward"("financialYearId", "commitmentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PayableCarryForwardEvent_paymentId_key" ON "PayableCarryForwardEvent"("paymentId");

-- CreateIndex
CREATE INDEX "PayableCarryForwardEvent_payableCarryForwardId_createdAt_idx" ON "PayableCarryForwardEvent"("payableCarryForwardId", "createdAt");

-- CreateIndex
CREATE INDEX "PayableCarryForwardEvent_actorUsuarioId_idx" ON "PayableCarryForwardEvent"("actorUsuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_code_key" ON "CatalogItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_number_key" ON "PurchaseRequest"("number");

-- CreateIndex
CREATE INDEX "PurchasePlanning_status_expectedPeriodStart_idx" ON "PurchasePlanning"("status", "expectedPeriodStart");

-- CreateIndex
CREATE INDEX "PurchasePlanning_catalogItemId_idx" ON "PurchasePlanning"("catalogItemId");

-- CreateIndex
CREATE INDEX "PurchasePlanning_originPurchaseRequestId_idx" ON "PurchasePlanning"("originPurchaseRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseProcess_number_key" ON "PurchaseProcess"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Bidding_number_key" ON "Bidding"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_number_key" ON "Contract"("number");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementLifecycleEvent_idempotencyKey_key" ON "ProcurementLifecycleEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ProcurementLifecycleEvent_entityType_entityId_createdAt_idx" ON "ProcurementLifecycleEvent"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "ProcurementLifecycleEvent_sourceType_sourceId_idx" ON "ProcurementLifecycleEvent"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReceipt_number_key" ON "PurchaseReceipt"("number");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReceipt_idempotencyKey_key" ON "PurchaseReceipt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PurchaseReceipt_purchaseProcessId_receivedAt_idx" ON "PurchaseReceipt"("purchaseProcessId", "receivedAt");

-- CreateIndex
CREATE INDEX "PurchaseReceipt_contractId_receivedAt_idx" ON "PurchaseReceipt"("contractId", "receivedAt");

-- CreateIndex
CREATE INDEX "PurchaseReceipt_sourceType_sourceId_idx" ON "PurchaseReceipt"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReceiptItem_stockMovementId_key" ON "PurchaseReceiptItem"("stockMovementId");

-- CreateIndex
CREATE INDEX "PurchaseReceiptItem_purchaseProcessItemId_idx" ON "PurchaseReceiptItem"("purchaseProcessItemId");

-- CreateIndex
CREATE INDEX "PurchaseReceiptItem_materialId_warehouseId_idx" ON "PurchaseReceiptItem"("materialId", "warehouseId");

-- CreateIndex
CREATE INDEX "PurchaseRequestItemBudgetAllocation_budgetAppropriationId_idx" ON "PurchaseRequestItemBudgetAllocation"("budgetAppropriationId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequestItemBudgetAllocation_purchaseRequestItemId_b_key" ON "PurchaseRequestItemBudgetAllocation"("purchaseRequestItemId", "budgetAppropriationId");

-- CreateIndex
CREATE INDEX "PurchaseProcessRequestOrigin_purchaseRequestId_idx" ON "PurchaseProcessRequestOrigin"("purchaseRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseProcessRequestOrigin_purchaseProcessId_purchaseRequ_key" ON "PurchaseProcessRequestOrigin"("purchaseProcessId", "purchaseRequestId");

-- CreateIndex
CREATE INDEX "PurchaseProcessItemOrigin_purchaseRequestItemId_idx" ON "PurchaseProcessItemOrigin"("purchaseRequestItemId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseProcessItemOrigin_purchaseProcessItemId_purchaseReq_key" ON "PurchaseProcessItemOrigin"("purchaseProcessItemId", "purchaseRequestItemId");

-- CreateIndex
CREATE INDEX "SupplierPortalIdentity_usuarioId_status_idx" ON "SupplierPortalIdentity"("usuarioId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPortalIdentity_supplierId_usuarioId_key" ON "SupplierPortalIdentity"("supplierId", "usuarioId");

-- CreateIndex
CREATE INDEX "BiddingAppointment_kind_status_idx" ON "BiddingAppointment"("kind", "status");

-- CreateIndex
CREATE INDEX "BiddingAppointment_appointmentDocumentId_idx" ON "BiddingAppointment"("appointmentDocumentId");

-- CreateIndex
CREATE INDEX "BiddingAppointmentMember_employeeId_status_idx" ON "BiddingAppointmentMember"("employeeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingAppointmentMember_appointmentId_employeeId_role_key" ON "BiddingAppointmentMember"("appointmentId", "employeeId", "role");

-- CreateIndex
CREATE INDEX "BiddingAppointmentAssignment_appointmentId_status_idx" ON "BiddingAppointmentAssignment"("appointmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingAppointmentAssignment_biddingId_appointmentId_key" ON "BiddingAppointmentAssignment"("biddingId", "appointmentId");

-- CreateIndex
CREATE INDEX "BiddingPhase_biddingId_isCurrent_sequence_idx" ON "BiddingPhase"("biddingId", "isCurrent", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingPhase_biddingId_code_version_key" ON "BiddingPhase"("biddingId", "code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingPhase_biddingId_sequence_version_key" ON "BiddingPhase"("biddingId", "sequence", "version");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingAct_idempotencyKey_key" ON "BiddingAct"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BiddingAct_biddingId_occurredAt_idx" ON "BiddingAct"("biddingId", "occurredAt");

-- CreateIndex
CREATE INDEX "BiddingAct_phaseId_idx" ON "BiddingAct"("phaseId");

-- CreateIndex
CREATE INDEX "BiddingAct_biddingLotId_occurredAt_idx" ON "BiddingAct"("biddingLotId", "occurredAt");

-- CreateIndex
CREATE INDEX "BiddingAct_actorUsuarioId_idx" ON "BiddingAct"("actorUsuarioId");

-- CreateIndex
CREATE INDEX "BiddingParticipant_supplierId_status_idx" ON "BiddingParticipant"("supplierId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingParticipant_biddingId_supplierId_key" ON "BiddingParticipant"("biddingId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingParticipant_biddingId_displayCode_key" ON "BiddingParticipant"("biddingId", "displayCode");

-- CreateIndex
CREATE INDEX "BiddingLot_biddingId_status_idx" ON "BiddingLot"("biddingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingLot_biddingId_number_key" ON "BiddingLot"("biddingId", "number");

-- CreateIndex
CREATE INDEX "BiddingLotItem_purchaseProcessItemId_idx" ON "BiddingLotItem"("purchaseProcessItemId");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingLotItem_biddingLotId_purchaseProcessItemId_key" ON "BiddingLotItem"("biddingLotId", "purchaseProcessItemId");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingBid_idempotencyKey_key" ON "BiddingBid"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BiddingBid_participantId_submittedAt_idx" ON "BiddingBid"("participantId", "submittedAt");

-- CreateIndex
CREATE INDEX "BiddingBid_supplierPortalIdentityId_idx" ON "BiddingBid"("supplierPortalIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingBid_biddingLotId_sequence_key" ON "BiddingBid"("biddingLotId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingEligibility_idempotencyKey_key" ON "BiddingEligibility"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BiddingEligibility_biddingLotId_participantId_decidedAt_idx" ON "BiddingEligibility"("biddingLotId", "participantId", "decidedAt");

-- CreateIndex
CREATE INDEX "BiddingEligibility_decidedByUsuarioId_idx" ON "BiddingEligibility"("decidedByUsuarioId");

-- CreateIndex
CREATE INDEX "BiddingEligibility_documentId_idx" ON "BiddingEligibility"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingResult_biddingActId_key" ON "BiddingResult"("biddingActId");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingResult_idempotencyKey_key" ON "BiddingResult"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BiddingResult_biddingLotId_isCurrent_decidedAt_idx" ON "BiddingResult"("biddingLotId", "isCurrent", "decidedAt");

-- CreateIndex
CREATE INDEX "BiddingResult_participantId_idx" ON "BiddingResult"("participantId");

-- CreateIndex
CREATE INDEX "BiddingResult_biddingBidId_idx" ON "BiddingResult"("biddingBidId");

-- CreateIndex
CREATE INDEX "BiddingResult_decidedByUsuarioId_idx" ON "BiddingResult"("decidedByUsuarioId");

-- CreateIndex
CREATE INDEX "InstrumentResponsibilityGroup_contractId_status_idx" ON "InstrumentResponsibilityGroup"("contractId", "status");

-- CreateIndex
CREATE INDEX "InstrumentResponsibilityGroup_covenantId_status_idx" ON "InstrumentResponsibilityGroup"("covenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentResponsibilityGroup_contractId_name_key" ON "InstrumentResponsibilityGroup"("contractId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentResponsibilityGroup_covenantId_name_key" ON "InstrumentResponsibilityGroup"("covenantId", "name");

-- CreateIndex
CREATE INDEX "InstrumentParty_contractId_role_idx" ON "InstrumentParty"("contractId", "role");

-- CreateIndex
CREATE INDEX "InstrumentParty_covenantId_role_idx" ON "InstrumentParty"("covenantId", "role");

-- CreateIndex
CREATE INDEX "InstrumentParty_supplierId_idx" ON "InstrumentParty"("supplierId");

-- CreateIndex
CREATE INDEX "InstrumentParty_personId_idx" ON "InstrumentParty"("personId");

-- CreateIndex
CREATE INDEX "InstrumentParty_companyId_idx" ON "InstrumentParty"("companyId");

-- CreateIndex
CREATE INDEX "InstrumentParty_employeeId_idx" ON "InstrumentParty"("employeeId");

-- CreateIndex
CREATE INDEX "InstrumentParty_responsibilityGroupId_idx" ON "InstrumentParty"("responsibilityGroupId");

-- CreateIndex
CREATE INDEX "InstrumentMeasurement_contractId_measuredAt_idx" ON "InstrumentMeasurement"("contractId", "measuredAt");

-- CreateIndex
CREATE INDEX "InstrumentMeasurement_covenantId_measuredAt_idx" ON "InstrumentMeasurement"("covenantId", "measuredAt");

-- CreateIndex
CREATE INDEX "InstrumentMeasurement_documentId_idx" ON "InstrumentMeasurement"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentMeasurement_contractId_number_key" ON "InstrumentMeasurement"("contractId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentMeasurement_covenantId_number_key" ON "InstrumentMeasurement"("covenantId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentMeasurementItem_purchaseReceiptItemId_key" ON "InstrumentMeasurementItem"("purchaseReceiptItemId");

-- CreateIndex
CREATE INDEX "InstrumentMeasurementItem_purchaseProcessItemId_idx" ON "InstrumentMeasurementItem"("purchaseProcessItemId");

-- CreateIndex
CREATE INDEX "InstrumentInstallment_contractId_dueDate_idx" ON "InstrumentInstallment"("contractId", "dueDate");

-- CreateIndex
CREATE INDEX "InstrumentInstallment_covenantId_dueDate_idx" ON "InstrumentInstallment"("covenantId", "dueDate");

-- CreateIndex
CREATE INDEX "InstrumentInstallment_paymentId_idx" ON "InstrumentInstallment"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentInstallment_contractId_number_key" ON "InstrumentInstallment"("contractId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentInstallment_covenantId_number_key" ON "InstrumentInstallment"("covenantId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEvent_code_key" ON "PayrollEvent"("code");

-- CreateIndex
CREATE INDEX "HrPayrollRuleSet_configuracaoInstanciaId_status_effectiveFr_idx" ON "HrPayrollRuleSet"("configuracaoInstanciaId", "status", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "HrPayrollRuleSet_configuracaoInstanciaId_code_effectiveFrom_key" ON "HrPayrollRuleSet"("configuracaoInstanciaId", "code", "effectiveFrom");

-- CreateIndex
CREATE INDEX "HrPayrollRule_ruleSetId_category_sortOrder_idx" ON "HrPayrollRule"("ruleSetId", "category", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "HrPayrollRule_ruleSetId_code_key" ON "HrPayrollRule"("ruleSetId", "code");

-- CreateIndex
CREATE INDEX "HrPayrollRubric_ruleSetId_type_priority_idx" ON "HrPayrollRubric"("ruleSetId", "type", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "HrPayrollRubric_ruleSetId_code_key" ON "HrPayrollRubric"("ruleSetId", "code");

-- CreateIndex
CREATE INDEX "HrPayrollRubricIncidence_incidenceType_idx" ON "HrPayrollRubricIncidence"("incidenceType");

-- CreateIndex
CREATE UNIQUE INDEX "HrPayrollRubricIncidence_rubricId_incidenceType_key" ON "HrPayrollRubricIncidence"("rubricId", "incidenceType");

-- CreateIndex
CREATE INDEX "HrSocialSecurityScheme_ruleSetId_regime_isActive_idx" ON "HrSocialSecurityScheme"("ruleSetId", "regime", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HrSocialSecurityScheme_ruleSetId_code_key" ON "HrSocialSecurityScheme"("ruleSetId", "code");

-- CreateIndex
CREATE INDEX "HrSocialSecurityBand_socialSecuritySchemeId_lowerLimit_idx" ON "HrSocialSecurityBand"("socialSecuritySchemeId", "lowerLimit");

-- CreateIndex
CREATE UNIQUE INDEX "HrSocialSecurityBand_socialSecuritySchemeId_sequence_key" ON "HrSocialSecurityBand"("socialSecuritySchemeId", "sequence");

-- CreateIndex
CREATE INDEX "HrVacationPolicy_ruleSetId_employmentNature_isActive_idx" ON "HrVacationPolicy"("ruleSetId", "employmentNature", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HrVacationPolicy_ruleSetId_code_key" ON "HrVacationPolicy"("ruleSetId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "HrCalculationPolicy_ruleSetId_key" ON "HrCalculationPolicy"("ruleSetId");

-- CreateIndex
CREATE INDEX "HrEmploymentRegime_ruleSetId_employmentNature_isActive_idx" ON "HrEmploymentRegime"("ruleSetId", "employmentNature", "isActive");

-- CreateIndex
CREATE INDEX "HrEmploymentRegime_socialSecuritySchemeId_idx" ON "HrEmploymentRegime"("socialSecuritySchemeId");

-- CreateIndex
CREATE INDEX "HrEmploymentRegime_vacationPolicyId_idx" ON "HrEmploymentRegime"("vacationPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "HrEmploymentRegime_ruleSetId_code_key" ON "HrEmploymentRegime"("ruleSetId", "code");

-- CreateIndex
CREATE INDEX "HrPayrollConfigurationChange_ruleSetId_createdAt_idx" ON "HrPayrollConfigurationChange"("ruleSetId", "createdAt");

-- CreateIndex
CREATE INDEX "HrPayrollConfigurationChange_entityType_entityId_createdAt_idx" ON "HrPayrollConfigurationChange"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "HrPayrollConfigurationChange_actorUsuarioId_createdAt_idx" ON "HrPayrollConfigurationChange"("actorUsuarioId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCategory_code_key" ON "AssetCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_patrimonyNumber_key" ON "Asset"("patrimonyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_stockMovementId_key" ON "Asset"("stockMovementId");

-- CreateIndex
CREATE INDEX "InternalControlPlan_status_dueAt_idx" ON "InternalControlPlan"("status", "dueAt");

-- CreateIndex
CREATE INDEX "InternalControlFinding_planId_status_idx" ON "InternalControlFinding"("planId", "status");

-- CreateIndex
CREATE INDEX "InternalControlFinding_responsibleId_dueAt_idx" ON "InternalControlFinding"("responsibleId", "dueAt");

-- CreateIndex
CREATE INDEX "FleetOperation_assetId_occurredAt_idx" ON "FleetOperation"("assetId", "occurredAt");

-- CreateIndex
CREATE INDEX "FleetOperation_type_occurredAt_idx" ON "FleetOperation"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "AssetValueHistory_referenceMonth_idx" ON "AssetValueHistory"("referenceMonth");

-- CreateIndex
CREATE UNIQUE INDEX "AssetValueHistory_assetId_referenceMonth_key" ON "AssetValueHistory"("assetId", "referenceMonth");

-- CreateIndex
CREATE UNIQUE INDEX "AssetWriteOff_accountingTransactionId_key" ON "AssetWriteOff"("accountingTransactionId");

-- CreateIndex
CREATE INDEX "AssetValueAdjustment_assetId_date_idx" ON "AssetValueAdjustment"("assetId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AssetIntegrationPendingConfiguration_assetWriteOffId_key" ON "AssetIntegrationPendingConfiguration"("assetWriteOffId");

-- CreateIndex
CREATE INDEX "Warehouse_costCenterId_idx" ON "Warehouse"("costCenterId");

-- CreateIndex
CREATE INDEX "Warehouse_healthUnitId_isActive_idx" ON "Warehouse"("healthUnitId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_code_key" ON "CostCenter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialCategory_code_key" ON "MaterialCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialStock_warehouseId_materialId_batchNumber_key" ON "MaterialStock"("warehouseId", "materialId", "batchNumber");

-- CreateIndex
CREATE INDEX "MaterialMovement_stockId_idx" ON "MaterialMovement"("stockId");

-- CreateIndex
CREATE INDEX "MaterialMovement_actorUsuarioId_idx" ON "MaterialMovement"("actorUsuarioId");

-- CreateIndex
CREATE INDEX "MaterialMovement_actorEmployeeId_idx" ON "MaterialMovement"("actorEmployeeId");

-- CreateIndex
CREATE INDEX "MaterialMovement_inventorySessionId_idx" ON "MaterialMovement"("inventorySessionId");

-- CreateIndex
CREATE INDEX "MaterialMovement_settlementId_idx" ON "MaterialMovement"("settlementId");

-- CreateIndex
CREATE INDEX "MaterialMovement_materialRequestItemId_idx" ON "MaterialMovement"("materialRequestItemId");

-- CreateIndex
CREATE INDEX "InventorySession_warehouseId_status_idx" ON "InventorySession"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "InventorySession_createdByUsuarioId_idx" ON "InventorySession"("createdByUsuarioId");

-- CreateIndex
CREATE INDEX "InventorySession_approvedByUsuarioId_idx" ON "InventorySession"("approvedByUsuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySessionItem_adjustmentMovementId_key" ON "InventorySessionItem"("adjustmentMovementId");

-- CreateIndex
CREATE INDEX "InventorySessionItem_stockId_idx" ON "InventorySessionItem"("stockId");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySessionItem_sessionId_stockId_key" ON "InventorySessionItem"("sessionId", "stockId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRequest_number_key" ON "MaterialRequest"("number");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRequest_idempotencyKey_key" ON "MaterialRequest"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "School_inepCode_key" ON "School"("inepCode");

-- CreateIndex
CREATE UNIQUE INDEX "School_addressId_key" ON "School"("addressId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentCode_key" ON "Student"("studentCode");

-- CreateIndex
CREATE UNIQUE INDEX "Student_personId_key" ON "Student"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_employeeId_key" ON "Teacher"("employeeId");

-- CreateIndex
CREATE INDEX "SchoolClass_schoolId_year_status_idx" ON "SchoolClass"("schoolId", "year", "status");

-- CreateIndex
CREATE INDEX "SchoolClass_periodId_idx" ON "SchoolClass"("periodId");

-- CreateIndex
CREATE INDEX "SchoolClass_matrixId_idx" ON "SchoolClass"("matrixId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSubject_code_key" ON "SchoolSubject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PreEnrollment_protocol_key" ON "PreEnrollment"("protocol");

-- CreateIndex
CREATE INDEX "PreEnrollment_processId_status_rankingScore_idx" ON "PreEnrollment"("processId", "status", "rankingScore");

-- CreateIndex
CREATE INDEX "PreEnrollmentProcess_year_status_idx" ON "PreEnrollmentProcess"("year", "status");

-- CreateIndex
CREATE INDEX "PreEnrollmentProcess_schoolId_stage_idx" ON "PreEnrollmentProcess"("schoolId", "stage");

-- CreateIndex
CREATE INDEX "AcademicDocumentIssue_type_createdAt_idx" ON "AcademicDocumentIssue"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AcademicDocumentIssue_studentId_createdAt_idx" ON "AcademicDocumentIssue"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_year_status_idx" ON "Enrollment"("studentId", "year", "status");

-- CreateIndex
CREATE INDEX "Enrollment_periodId_idx" ON "Enrollment"("periodId");

-- CreateIndex
CREATE INDEX "AcademicPeriod_schoolId_year_status_idx" ON "AcademicPeriod"("schoolId", "year", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicPeriod_schoolId_code_key" ON "AcademicPeriod"("schoolId", "code");

-- CreateIndex
CREATE INDEX "CurriculumMatrix_periodId_status_idx" ON "CurriculumMatrix"("periodId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumMatrix_schoolId_periodId_name_version_key" ON "CurriculumMatrix"("schoolId", "periodId", "name", "version");

-- CreateIndex
CREATE INDEX "CurriculumMatrixSubject_subjectId_idx" ON "CurriculumMatrixSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumMatrixSubject_matrixId_subjectId_key" ON "CurriculumMatrixSubject"("matrixId", "subjectId");

-- CreateIndex
CREATE INDEX "SchoolShift_schoolId_isActive_idx" ON "SchoolShift"("schoolId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolShift_schoolId_name_key" ON "SchoolShift"("schoolId", "name");

-- CreateIndex
CREATE INDEX "TeacherClassAssignment_teacherId_isActive_idx" ON "TeacherClassAssignment"("teacherId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherClassAssignment_classId_teacherId_subjectId_startDat_key" ON "TeacherClassAssignment"("classId", "teacherId", "subjectId", "startDate");

-- CreateIndex
CREATE INDEX "EnrollmentMovement_enrollmentId_effectiveDate_idx" ON "EnrollmentMovement"("enrollmentId", "effectiveDate");

-- CreateIndex
CREATE INDEX "ClassScheduleBoard_classId_startDate_idx" ON "ClassScheduleBoard"("classId", "startDate");

-- CreateIndex
CREATE INDEX "ClassScheduleEntry_teacherId_weekday_idx" ON "ClassScheduleEntry"("teacherId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "ClassScheduleEntry_boardId_weekday_lessonOrder_key" ON "ClassScheduleEntry"("boardId", "weekday", "lessonOrder");

-- CreateIndex
CREATE INDEX "EducacensoOperation_operationType_createdAt_idx" ON "EducacensoOperation"("operationType", "createdAt");

-- CreateIndex
CREATE INDEX "EducacensoOperation_competence_status_idx" ON "EducacensoOperation"("competence", "status");

-- CreateIndex
CREATE INDEX "ClassDiary_classId_subjectId_date_idx" ON "ClassDiary"("classId", "subjectId", "date");

-- CreateIndex
CREATE INDEX "ClassDiary_teacherId_status_idx" ON "ClassDiary"("teacherId", "status");

-- CreateIndex
CREATE INDEX "Grade_classId_period_idx" ON "Grade"("classId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_assessmentId_studentId_key" ON "Grade"("assessmentId", "studentId");

-- CreateIndex
CREATE INDEX "EducationAssessment_classId_subjectId_stage_idx" ON "EducationAssessment"("classId", "subjectId", "stage");

-- CreateIndex
CREATE INDEX "EducationAssessment_teacherId_date_idx" ON "EducationAssessment"("teacherId", "date");

-- CreateIndex
CREATE INDEX "TeacherAcademicRecord_teacherId_type_status_idx" ON "TeacherAcademicRecord"("teacherId", "type", "status");

-- CreateIndex
CREATE INDEX "TeacherAcademicRecord_classId_stage_idx" ON "TeacherAcademicRecord"("classId", "stage");

-- CreateIndex
CREATE INDEX "LearningActivity_teacherId_status_dueAt_idx" ON "LearningActivity"("teacherId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "LearningActivity_classId_subjectId_idx" ON "LearningActivity"("classId", "subjectId");

-- CreateIndex
CREATE INDEX "LearningQuestion_activityId_position_idx" ON "LearningQuestion"("activityId", "position");

-- CreateIndex
CREATE INDEX "LearningSubmission_status_submittedAt_idx" ON "LearningSubmission"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningSubmission_activityId_studentId_key" ON "LearningSubmission"("activityId", "studentId");

-- CreateIndex
CREATE INDEX "EducationLibraryTitle_schoolId_title_idx" ON "EducationLibraryTitle"("schoolId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "EducationLibraryCopy_assetCode_key" ON "EducationLibraryCopy"("assetCode");

-- CreateIndex
CREATE INDEX "EducationLibraryCopy_titleId_status_idx" ON "EducationLibraryCopy"("titleId", "status");

-- CreateIndex
CREATE INDEX "EducationLibraryLoan_studentId_status_dueAt_idx" ON "EducationLibraryLoan"("studentId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "EducationLibraryReservation_titleId_status_position_idx" ON "EducationLibraryReservation"("titleId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "EducationLibraryReservation_titleId_studentId_key" ON "EducationLibraryReservation"("titleId", "studentId");

-- CreateIndex
CREATE INDEX "EducationSchoolMenu_schoolId_weekStart_status_idx" ON "EducationSchoolMenu"("schoolId", "weekStart", "status");

-- CreateIndex
CREATE INDEX "EducationFoodMovement_schoolId_materialId_occurredAt_idx" ON "EducationFoodMovement"("schoolId", "materialId", "occurredAt");

-- CreateIndex
CREATE INDEX "EducationFinancialAccount_schoolId_status_idx" ON "EducationFinancialAccount"("schoolId", "status");

-- CreateIndex
CREATE INDEX "EducationFinancialMovement_accountId_occurredAt_idx" ON "EducationFinancialMovement"("accountId", "occurredAt");

-- CreateIndex
CREATE INDEX "EducationApplicationPlan_schoolId_status_idx" ON "EducationApplicationPlan"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EducationTransportRoute_code_key" ON "EducationTransportRoute"("code");

-- CreateIndex
CREATE INDEX "EducationTransportRoute_schoolId_status_idx" ON "EducationTransportRoute"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EducationTransportStop_routeId_sequence_key" ON "EducationTransportStop"("routeId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "EducationTransportStudent_routeId_studentId_key" ON "EducationTransportStudent"("routeId", "studentId");

-- CreateIndex
CREATE INDEX "EducationTransportJourney_routeId_startedAt_idx" ON "EducationTransportJourney"("routeId", "startedAt");

-- CreateIndex
CREATE INDEX "EducationTransportEvent_journeyId_occurredAt_idx" ON "EducationTransportEvent"("journeyId", "occurredAt");

-- CreateIndex
CREATE INDEX "PedagogicalCatalogItem_schoolYear_type_status_idx" ON "PedagogicalCatalogItem"("schoolYear", "type", "status");

-- CreateIndex
CREATE INDEX "PedagogicalRelease_classId_studentId_status_idx" ON "PedagogicalRelease"("classId", "studentId", "status");

-- CreateIndex
CREATE INDEX "PedagogicalAttempt_releaseId_score_idx" ON "PedagogicalAttempt"("releaseId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "EducationSupportRequest_protocol_key" ON "EducationSupportRequest"("protocol");

-- CreateIndex
CREATE INDEX "EducationSupportRequest_requesterEmail_status_createdAt_idx" ON "EducationSupportRequest"("requesterEmail", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolBus_code_key" ON "SchoolBus"("code");

-- CreateIndex
CREATE INDEX "SchoolCalendarEvent_periodId_date_idx" ON "SchoolCalendarEvent"("periodId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HealthUnit_cnes_key" ON "HealthUnit"("cnes");

-- CreateIndex
CREATE UNIQUE INDEX "HealthUnit_addressId_key" ON "HealthUnit"("addressId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cns_key" ON "Patient"("cns");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_personId_key" ON "Patient"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_usuarioId_key" ON "Patient"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProfessional_employeeId_key" ON "HealthProfessional"("employeeId");

-- CreateIndex
CREATE INDEX "HealthProfessional_cns_idx" ON "HealthProfessional"("cns");

-- CreateIndex
CREATE UNIQUE INDEX "HealthTeam_code_key" ON "HealthTeam"("code");

-- CreateIndex
CREATE INDEX "HealthAppointment_unitId_date_idx" ON "HealthAppointment"("unitId", "date");

-- CreateIndex
CREATE INDEX "HealthAppointment_professionalId_date_idx" ON "HealthAppointment"("professionalId", "date");

-- CreateIndex
CREATE INDEX "HealthAppointment_patientId_date_idx" ON "HealthAppointment"("patientId", "date");

-- CreateIndex
CREATE INDEX "HealthAppointment_origin_status_date_idx" ON "HealthAppointment"("origin", "status", "date");

-- CreateIndex
CREATE INDEX "HealthAppointment_schedulingGroupId_date_idx" ON "HealthAppointment"("schedulingGroupId", "date");

-- CreateIndex
CREATE INDEX "HealthAppointment_specialtyId_date_idx" ON "HealthAppointment"("specialtyId", "date");

-- CreateIndex
CREATE INDEX "HealthAppointmentEvent_appointmentId_occurredAt_idx" ON "HealthAppointmentEvent"("appointmentId", "occurredAt");

-- CreateIndex
CREATE INDEX "HealthAppointmentEvent_eventType_occurredAt_idx" ON "HealthAppointmentEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "HealthTriage_appointmentId_key" ON "HealthTriage"("appointmentId");

-- CreateIndex
CREATE INDEX "HealthTriage_riskClassification_createdAt_idx" ON "HealthTriage"("riskClassification", "createdAt");

-- CreateIndex
CREATE INDEX "HealthTriage_professionalId_createdAt_idx" ON "HealthTriage"("professionalId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_appointmentId_key" ON "MedicalRecord"("appointmentId");

-- CreateIndex
CREATE INDEX "HealthClinicalEvolution_medicalRecordId_createdAt_idx" ON "HealthClinicalEvolution"("medicalRecordId", "createdAt");

-- CreateIndex
CREATE INDEX "HealthDiagnosis_cidReferenceId_createdAt_idx" ON "HealthDiagnosis"("cidReferenceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HealthDiagnosis_medicalRecordId_cidReferenceId_key" ON "HealthDiagnosis"("medicalRecordId", "cidReferenceId");

-- CreateIndex
CREATE INDEX "HealthPerformedProcedure_medicalRecordId_performedAt_idx" ON "HealthPerformedProcedure"("medicalRecordId", "performedAt");

-- CreateIndex
CREATE INDEX "HealthPerformedProcedure_procedureId_performedAt_idx" ON "HealthPerformedProcedure"("procedureId", "performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HealthClinicalDocument_documentId_key" ON "HealthClinicalDocument"("documentId");

-- CreateIndex
CREATE INDEX "HealthClinicalDocument_medicalRecordId_kind_createdAt_idx" ON "HealthClinicalDocument"("medicalRecordId", "kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_materialId_key" ON "Medicine"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineInteraction_originMedicineId_targetMedicineId_key" ON "MedicineInteraction"("originMedicineId", "targetMedicineId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineDosageTemplate_medicineId_name_key" ON "MedicineDosageTemplate"("medicineId", "name");

-- CreateIndex
CREATE INDEX "HealthPrescriptionItem_prescriptionId_idx" ON "HealthPrescriptionItem"("prescriptionId");

-- CreateIndex
CREATE INDEX "HealthPrescriptionItem_medicineId_idx" ON "HealthPrescriptionItem"("medicineId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineDispensation_movementId_key" ON "MedicineDispensation"("movementId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineDispensation_idempotencyKey_key" ON "MedicineDispensation"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Vaccine_materialId_key" ON "Vaccine"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "VaccinationRecord_idempotencyKey_key" ON "VaccinationRecord"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "VaccinationRecord_movementId_key" ON "VaccinationRecord"("movementId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthCbo_code_key" ON "HealthCbo"("code");

-- CreateIndex
CREATE INDEX "HealthCbo_isActive_description_idx" ON "HealthCbo"("isActive", "description");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSpecialty_code_key" ON "HealthSpecialty"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSpecialty_name_key" ON "HealthSpecialty"("name");

-- CreateIndex
CREATE INDEX "HealthSpecialty_isActive_name_idx" ON "HealthSpecialty"("isActive", "name");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSpecialtyGroup_name_key" ON "HealthSpecialtyGroup"("name");

-- CreateIndex
CREATE INDEX "HealthSpecialtyGroup_isActive_name_idx" ON "HealthSpecialtyGroup"("isActive", "name");

-- CreateIndex
CREATE INDEX "HealthSpecialtyGroupMember_specialtyId_idx" ON "HealthSpecialtyGroupMember"("specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSpecialtyGroupMember_groupId_specialtyId_key" ON "HealthSpecialtyGroupMember"("groupId", "specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthService_code_key" ON "HealthService"("code");

-- CreateIndex
CREATE INDEX "HealthService_isActive_name_idx" ON "HealthService"("isActive", "name");

-- CreateIndex
CREATE INDEX "HealthSpecialtyGroupService_serviceId_idx" ON "HealthSpecialtyGroupService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSpecialtyGroupService_groupId_serviceId_key" ON "HealthSpecialtyGroupService"("groupId", "serviceId");

-- CreateIndex
CREATE INDEX "HealthUnitShift_unitId_isActive_idx" ON "HealthUnitShift"("unitId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthUnitShift_unitId_dayOfWeek_startTime_endTime_key" ON "HealthUnitShift"("unitId", "dayOfWeek", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "HealthUnitSpecialty_specialtyId_isActive_idx" ON "HealthUnitSpecialty"("specialtyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthUnitSpecialty_unitId_specialtyId_key" ON "HealthUnitSpecialty"("unitId", "specialtyId");

-- CreateIndex
CREATE INDEX "HealthProfessionalAssignment_unitId_isActive_idx" ON "HealthProfessionalAssignment"("unitId", "isActive");

-- CreateIndex
CREATE INDEX "HealthProfessionalAssignment_specialtyId_isActive_idx" ON "HealthProfessionalAssignment"("specialtyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProfessionalAssignment_professionalId_unitId_specialt_key" ON "HealthProfessionalAssignment"("professionalId", "unitId", "specialtyId");

-- CreateIndex
CREATE INDEX "HealthServiceAssignment_unitId_isActive_idx" ON "HealthServiceAssignment"("unitId", "isActive");

-- CreateIndex
CREATE INDEX "HealthServiceAssignment_professionalId_isActive_idx" ON "HealthServiceAssignment"("professionalId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthServiceAssignment_serviceId_unitId_key" ON "HealthServiceAssignment"("serviceId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthServiceAssignment_serviceId_professionalId_key" ON "HealthServiceAssignment"("serviceId", "professionalId");

-- CreateIndex
CREATE INDEX "HealthHabilitation_unitId_isActive_idx" ON "HealthHabilitation"("unitId", "isActive");

-- CreateIndex
CREATE INDEX "HealthHabilitation_professionalId_isActive_idx" ON "HealthHabilitation"("professionalId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthHabilitation_code_unitId_key" ON "HealthHabilitation"("code", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthHabilitation_code_professionalId_key" ON "HealthHabilitation"("code", "professionalId");

-- CreateIndex
CREATE INDEX "HealthSchedulingGroup_specialtyGroupId_isActive_idx" ON "HealthSchedulingGroup"("specialtyGroupId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSchedulingGroup_name_unitId_key" ON "HealthSchedulingGroup"("name", "unitId");

-- CreateIndex
CREATE INDEX "HealthRegistrationStatusHistory_unitId_occurredAt_idx" ON "HealthRegistrationStatusHistory"("unitId", "occurredAt");

-- CreateIndex
CREATE INDEX "HealthRegistrationStatusHistory_professionalId_occurredAt_idx" ON "HealthRegistrationStatusHistory"("professionalId", "occurredAt");

-- CreateIndex
CREATE INDEX "HealthUserAccessScope_unitId_isActive_idx" ON "HealthUserAccessScope"("unitId", "isActive");

-- CreateIndex
CREATE INDEX "HealthUserAccessScope_usuarioId_isActive_idx" ON "HealthUserAccessScope"("usuarioId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthUserAccessScope_usuarioId_unitId_key" ON "HealthUserAccessScope"("usuarioId", "unitId");

-- CreateIndex
CREATE INDEX "HealthSusImportBatch_source_competence_startedAt_idx" ON "HealthSusImportBatch"("source", "competence", "startedAt");

-- CreateIndex
CREATE INDEX "HealthSusImportBatch_status_startedAt_idx" ON "HealthSusImportBatch"("status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSusImportBatch_source_competence_checksum_key" ON "HealthSusImportBatch"("source", "competence", "checksum");

-- CreateIndex
CREATE INDEX "HealthSusImportIssue_batchId_rowNumber_idx" ON "HealthSusImportIssue"("batchId", "rowNumber");

-- CreateIndex
CREATE INDEX "HealthSusProcedure_code_idx" ON "HealthSusProcedure"("code");

-- CreateIndex
CREATE INDEX "HealthSusProcedure_description_idx" ON "HealthSusProcedure"("description");

-- CreateIndex
CREATE INDEX "HealthSusProcedure_source_competence_code_isCurrent_idx" ON "HealthSusProcedure"("source", "competence", "code", "isCurrent");

-- CreateIndex
CREATE INDEX "HealthSusProcedure_competence_isActive_isCurrent_idx" ON "HealthSusProcedure"("competence", "isActive", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSusProcedure_sourceBatchId_code_key" ON "HealthSusProcedure"("sourceBatchId", "code");

-- CreateIndex
CREATE INDEX "HealthSusReference_source_competence_kind_code_isCurrent_idx" ON "HealthSusReference"("source", "competence", "kind", "code", "isCurrent");

-- CreateIndex
CREATE INDEX "HealthSusReference_description_idx" ON "HealthSusReference"("description");

-- CreateIndex
CREATE INDEX "HealthSusReference_competence_isActive_isCurrent_idx" ON "HealthSusReference"("competence", "isActive", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSusReference_sourceBatchId_kind_code_key" ON "HealthSusReference"("sourceBatchId", "kind", "code");

-- CreateIndex
CREATE INDEX "HealthSusProcedureReference_referenceId_relationType_idx" ON "HealthSusProcedureReference"("referenceId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSusProcedureReference_procedureId_referenceId_relatio_key" ON "HealthSusProcedureReference"("procedureId", "referenceId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStandardDocument_documentId_key" ON "HealthStandardDocument"("documentId");

-- CreateIndex
CREATE INDEX "HealthStandardDocument_moduleCode_category_isActive_idx" ON "HealthStandardDocument"("moduleCode", "category", "isActive");

-- CreateIndex
CREATE INDEX "HealthStandardDocument_createdAt_idx" ON "HealthStandardDocument"("createdAt");

-- CreateIndex
CREATE INDEX "HealthAdministrativeMerge_kind_createdAt_idx" ON "HealthAdministrativeMerge"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "HealthAdministrativeMerge_targetId_createdAt_idx" ON "HealthAdministrativeMerge"("targetId", "createdAt");

-- CreateIndex
CREATE INDEX "HealthLaboratoryConfiguration_unitId_isActive_effectiveFrom_idx" ON "HealthLaboratoryConfiguration"("unitId", "isActive", "effectiveFrom");

-- CreateIndex
CREATE INDEX "HealthLaboratoryConfiguration_createdAt_idx" ON "HealthLaboratoryConfiguration"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HealthMaterialProfile_materialId_key" ON "HealthMaterialProfile"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthMaterialProfile_barcode_key" ON "HealthMaterialProfile"("barcode");

-- CreateIndex
CREATE INDEX "HealthMaterialProfile_productKind_isActive_idx" ON "HealthMaterialProfile"("productKind", "isActive");

-- CreateIndex
CREATE INDEX "HealthMaterialProfile_sourceCatalog_sourceCode_idx" ON "HealthMaterialProfile"("sourceCatalog", "sourceCode");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStockPolicy_warehouseId_materialId_key" ON "HealthStockPolicy"("warehouseId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStockReceipt_documentId_key" ON "HealthStockReceipt"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStockReceipt_idempotencyKey_key" ON "HealthStockReceipt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "HealthStockReceipt_warehouseId_receivedAt_idx" ON "HealthStockReceipt"("warehouseId", "receivedAt");

-- CreateIndex
CREATE INDEX "HealthStockReceipt_invoiceKey_idx" ON "HealthStockReceipt"("invoiceKey");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStockReceiptItem_movementId_key" ON "HealthStockReceiptItem"("movementId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStockReceiptItem_receiptId_materialId_batchNumber_key" ON "HealthStockReceiptItem"("receiptId", "materialId", "batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStockTransfer_requestNumber_key" ON "HealthStockTransfer"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStockTransfer_idempotencyKey_key" ON "HealthStockTransfer"("idempotencyKey");

-- CreateIndex
CREATE INDEX "HealthStockTransfer_originWarehouseId_status_createdAt_idx" ON "HealthStockTransfer"("originWarehouseId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "HealthStockTransfer_destinationWarehouseId_status_createdAt_idx" ON "HealthStockTransfer"("destinationWarehouseId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStockTransferItem_departureMovementId_key" ON "HealthStockTransferItem"("departureMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStockTransferItem_arrivalMovementId_key" ON "HealthStockTransferItem"("arrivalMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStockTransferItem_transferId_materialId_batchNumber_key" ON "HealthStockTransferItem"("transferId", "materialId", "batchNumber");

-- CreateIndex
CREATE INDEX "PharmacyRequest_destinationWarehouseId_status_requestedAt_idx" ON "PharmacyRequest"("destinationWarehouseId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "PharmacyRequest_patientId_requestedAt_idx" ON "PharmacyRequest"("patientId", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyRequestItem_requestId_materialId_key" ON "PharmacyRequestItem"("requestId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "ControlledMedicineBook_warehouseId_period_key" ON "ControlledMedicineBook"("warehouseId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "HealthAssistentialDevice_code_key" ON "HealthAssistentialDevice"("code");

-- CreateIndex
CREATE INDEX "HealthAssistentialDevice_domain_isActive_idx" ON "HealthAssistentialDevice"("domain", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthDeviceMessage_idempotencyKey_key" ON "HealthDeviceMessage"("idempotencyKey");

-- CreateIndex
CREATE INDEX "HealthDeviceMessage_deviceId_createdAt_idx" ON "HealthDeviceMessage"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "HealthDeviceMessage_correlationId_idx" ON "HealthDeviceMessage"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabExamModel_code_key" ON "HealthLabExamModel"("code");

-- CreateIndex
CREATE INDEX "HealthLabExamModel_isActive_name_idx" ON "HealthLabExamModel"("isActive", "name");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabExamMaterial_examModelId_materialId_key" ON "HealthLabExamMaterial"("examModelId", "materialId");

-- CreateIndex
CREATE INDEX "HealthLabSchedule_unitId_examModelId_isActive_idx" ON "HealthLabSchedule"("unitId", "examModelId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabProviderQuota_providerSupplierId_unitId_examModelI_key" ON "HealthLabProviderQuota"("providerSupplierId", "unitId", "examModelId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabQuestionnaire_code_key" ON "HealthLabQuestionnaire"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabQuestionGroup_questionnaireId_displayOrder_key" ON "HealthLabQuestionGroup"("questionnaireId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabQuestionItem_groupId_code_key" ON "HealthLabQuestionItem"("groupId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabQuestionItem_groupId_displayOrder_key" ON "HealthLabQuestionItem"("groupId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabOrder_examRequestId_key" ON "HealthLabOrder"("examRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabOrder_sampleBarcode_key" ON "HealthLabOrder"("sampleBarcode");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabOrder_authorizationKey_key" ON "HealthLabOrder"("authorizationKey");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabOrder_idempotencyKey_key" ON "HealthLabOrder"("idempotencyKey");

-- CreateIndex
CREATE INDEX "HealthLabOrder_status_priority_createdAt_idx" ON "HealthLabOrder"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "HealthLabOrder_patientId_createdAt_idx" ON "HealthLabOrder"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "HealthLabOrder_collectionUnitId_scheduledAt_idx" ON "HealthLabOrder"("collectionUnitId", "scheduledAt");

-- CreateIndex
CREATE INDEX "HealthLabResult_deviceCorrelationId_idx" ON "HealthLabResult"("deviceCorrelationId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabResult_orderId_version_key" ON "HealthLabResult"("orderId", "version");

-- CreateIndex
CREATE INDEX "HealthLabOrderEvent_orderId_createdAt_idx" ON "HealthLabOrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLabReport_documentId_key" ON "HealthLabReport"("documentId");

-- CreateIndex
CREATE INDEX "HealthLabReport_orderId_status_idx" ON "HealthLabReport"("orderId", "status");

-- CreateIndex
CREATE INDEX "SpecializedCatalogItem_category_isActive_name_idx" ON "SpecializedCatalogItem"("category", "isActive", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SpecializedCatalogItem_category_code_key" ON "SpecializedCatalogItem"("category", "code");

-- CreateIndex
CREATE UNIQUE INDEX "SpecializedTeamSchedule_teamId_unitId_month_key" ON "SpecializedTeamSchedule"("teamId", "unitId", "month");

-- CreateIndex
CREATE INDEX "SpecializedTherapeuticPlan_patientId_status_startedAt_idx" ON "SpecializedTherapeuticPlan"("patientId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "SpecializedTherapeuticPlan_teamId_status_idx" ON "SpecializedTherapeuticPlan"("teamId", "status");

-- CreateIndex
CREATE INDEX "SpecializedPlanEntry_planId_createdAt_idx" ON "SpecializedPlanEntry"("planId", "createdAt");

-- CreateIndex
CREATE INDEX "SpecializedPlanEntry_professionalId_createdAt_idx" ON "SpecializedPlanEntry"("professionalId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SpecializedQuota_patientId_materialId_period_key" ON "SpecializedQuota"("patientId", "materialId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "SpecializedDistribution_movementId_key" ON "SpecializedDistribution"("movementId");

-- CreateIndex
CREATE INDEX "SpecializedDistribution_patientId_deliveredAt_idx" ON "SpecializedDistribution"("patientId", "deliveredAt");

-- CreateIndex
CREATE INDEX "SpecializedDistribution_planId_deliveredAt_idx" ON "SpecializedDistribution"("planId", "deliveredAt");

-- CreateIndex
CREATE INDEX "HealthRegulationQuota_providerSupplierId_period_idx" ON "HealthRegulationQuota"("providerSupplierId", "period");

-- CreateIndex
CREATE INDEX "HealthRegulationQuota_unitId_period_idx" ON "HealthRegulationQuota"("unitId", "period");

-- CreateIndex
CREATE INDEX "HealthRegulationQuota_period_isActive_idx" ON "HealthRegulationQuota"("period", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRegulationRequest_referralId_key" ON "HealthRegulationRequest"("referralId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRegulationRequest_examRequestId_key" ON "HealthRegulationRequest"("examRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRegulationRequest_protocolNumber_key" ON "HealthRegulationRequest"("protocolNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRegulationRequest_validationCode_key" ON "HealthRegulationRequest"("validationCode");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRegulationRequest_guideNumber_key" ON "HealthRegulationRequest"("guideNumber");

-- CreateIndex
CREATE INDEX "HealthRegulationRequest_status_priority_createdAt_idx" ON "HealthRegulationRequest"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "HealthRegulationRequest_patientId_status_idx" ON "HealthRegulationRequest"("patientId", "status");

-- CreateIndex
CREATE INDEX "HealthRegulationRequest_requestUnitId_status_idx" ON "HealthRegulationRequest"("requestUnitId", "status");

-- CreateIndex
CREATE INDEX "HealthRegulationRequest_quotaId_idx" ON "HealthRegulationRequest"("quotaId");

-- CreateIndex
CREATE INDEX "HealthRegulationRequest_sectorId_status_idx" ON "HealthRegulationRequest"("sectorId", "status");

-- CreateIndex
CREATE INDEX "HealthRegulationEvent_requestId_createdAt_idx" ON "HealthRegulationEvent"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "HealthTfdRequest_status_createdAt_idx" ON "HealthTfdRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "HealthTfdRequest_patientId_status_idx" ON "HealthTfdRequest"("patientId", "status");

-- CreateIndex
CREATE INDEX "HealthTfdTrip_date_status_idx" ON "HealthTfdTrip"("date", "status");

-- CreateIndex
CREATE INDEX "HealthTfdTrip_fleetUnitId_date_idx" ON "HealthTfdTrip"("fleetUnitId", "date");

-- CreateIndex
CREATE INDEX "HealthTfdPassenger_patientId_idx" ON "HealthTfdPassenger"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthTfdPassenger_tripId_patientId_kind_key" ON "HealthTfdPassenger"("tripId", "patientId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProductionCompetence_period_key" ON "HealthProductionCompetence"("period");

-- CreateIndex
CREATE INDEX "HealthProductionCompetence_status_idx" ON "HealthProductionCompetence"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProductionFact_idempotencyKey_key" ON "HealthProductionFact"("idempotencyKey");

-- CreateIndex
CREATE INDEX "HealthProductionFact_period_status_idx" ON "HealthProductionFact"("period", "status");

-- CreateIndex
CREATE INDEX "HealthProductionFact_competenceId_status_idx" ON "HealthProductionFact"("competenceId", "status");

-- CreateIndex
CREATE INDEX "HealthProductionFact_unitId_period_idx" ON "HealthProductionFact"("unitId", "period");

-- CreateIndex
CREATE INDEX "HealthProductionFact_cidReferenceId_idx" ON "HealthProductionFact"("cidReferenceId");

-- CreateIndex
CREATE INDEX "HealthProductionFact_municipality_state_idx" ON "HealthProductionFact"("municipality", "state");

-- CreateIndex
CREATE INDEX "HealthProductionCriticism_factId_status_idx" ON "HealthProductionCriticism"("factId", "status");

-- CreateIndex
CREATE INDEX "HealthSusFile_competenceId_fileType_idx" ON "HealthSusFile"("competenceId", "fileType");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProductionTarget_competenceId_procedureId_key" ON "HealthProductionTarget"("competenceId", "procedureId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthUnitCeiling_unitId_period_key" ON "HealthUnitCeiling"("unitId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRiskProtocol_level_key" ON "HealthRiskProtocol"("level");

-- CreateIndex
CREATE UNIQUE INDEX "HealthDestination_name_key" ON "HealthDestination"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRoom_unitId_name_key" ON "HealthRoom"("unitId", "name");

-- CreateIndex
CREATE INDEX "HealthReception_unitId_status_arrivalAt_idx" ON "HealthReception"("unitId", "status", "arrivalAt");

-- CreateIndex
CREATE INDEX "HealthReception_patientId_idx" ON "HealthReception"("patientId");

-- CreateIndex
CREATE INDEX "HealthBed_unitId_status_idx" ON "HealthBed"("unitId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HealthBed_unitId_code_key" ON "HealthBed"("unitId", "code");

-- CreateIndex
CREATE INDEX "HealthBedOccupancy_bedId_dischargedAt_idx" ON "HealthBedOccupancy"("bedId", "dischargedAt");

-- CreateIndex
CREATE INDEX "HealthBedOccupancy_patientId_idx" ON "HealthBedOccupancy"("patientId");

-- CreateIndex
CREATE INDEX "HealthObservation_unitId_status_idx" ON "HealthObservation"("unitId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRegulationSector_name_key" ON "HealthRegulationSector"("name");

-- CreateIndex
CREATE INDEX "HealthRegulationAttachment_requestId_idx" ON "HealthRegulationAttachment"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthTfdPassengerRemoval_passengerId_key" ON "HealthTfdPassengerRemoval"("passengerId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthTerritoryArea_code_key" ON "HealthTerritoryArea"("code");

-- CreateIndex
CREATE INDEX "HealthTerritoryArea_unitId_isActive_idx" ON "HealthTerritoryArea"("unitId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthMicroarea_areaId_code_key" ON "HealthMicroarea"("areaId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "HealthHousehold_householdCode_key" ON "HealthHousehold"("householdCode");

-- CreateIndex
CREATE INDEX "HealthFamily_householdId_isActive_idx" ON "HealthFamily"("householdId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthFamilyMember_personId_key" ON "HealthFamilyMember"("personId");

-- CreateIndex
CREATE INDEX "HealthFamilyMember_familyId_idx" ON "HealthFamilyMember"("familyId");

-- CreateIndex
CREATE INDEX "HealthHomeVisit_visitedAt_status_idx" ON "HealthHomeVisit"("visitedAt", "status");

-- CreateIndex
CREATE INDEX "HealthHomeVisit_familyId_visitedAt_idx" ON "HealthHomeVisit"("familyId", "visitedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HealthHomeVisitParticipant_visitId_personId_key" ON "HealthHomeVisitParticipant"("visitId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthEsusForm_idempotencyKey_key" ON "HealthEsusForm"("idempotencyKey");

-- CreateIndex
CREATE INDEX "HealthEsusForm_kind_period_status_idx" ON "HealthEsusForm"("kind", "period", "status");

-- CreateIndex
CREATE INDEX "HealthEsusForm_unitId_period_idx" ON "HealthEsusForm"("unitId", "period");

-- CreateIndex
CREATE INDEX "HealthEsusBatch_competence_status_idx" ON "HealthEsusBatch"("competence", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HealthEsusBatchItem_batchId_formId_key" ON "HealthEsusBatchItem"("batchId", "formId");

-- CreateIndex
CREATE INDEX "HealthCareSchedule_unitId_status_idx" ON "HealthCareSchedule"("unitId", "status");

-- CreateIndex
CREATE INDEX "HealthCareSchedule_professionalId_date_idx" ON "HealthCareSchedule"("professionalId", "date");

-- CreateIndex
CREATE INDEX "HealthCareSchedule_kind_status_idx" ON "HealthCareSchedule"("kind", "status");

-- CreateIndex
CREATE INDEX "HealthWaitlist_status_priority_createdAt_idx" ON "HealthWaitlist"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "HealthWaitlist_patientId_status_idx" ON "HealthWaitlist"("patientId", "status");

-- CreateIndex
CREATE INDEX "HealthProviderAccess_usuarioId_isActive_idx" ON "HealthProviderAccess"("usuarioId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProviderAccess_supplierId_usuarioId_key" ON "HealthProviderAccess"("supplierId", "usuarioId");

-- CreateIndex
CREATE INDEX "HealthVigilanceEstablishment_status_idx" ON "HealthVigilanceEstablishment"("status");

-- CreateIndex
CREATE INDEX "HealthVigilanceEstablishment_cnae_idx" ON "HealthVigilanceEstablishment"("cnae");

-- CreateIndex
CREATE INDEX "HealthVigilanceComplaint_status_createdAt_idx" ON "HealthVigilanceComplaint"("status", "createdAt");

-- CreateIndex
CREATE INDEX "HealthVigilanceInspection_establishmentId_inspectedAt_idx" ON "HealthVigilanceInspection"("establishmentId", "inspectedAt");

-- CreateIndex
CREATE INDEX "HealthVigilanceInspection_status_idx" ON "HealthVigilanceInspection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HealthVigilanceLicense_licenseNumber_key" ON "HealthVigilanceLicense"("licenseNumber");

-- CreateIndex
CREATE INDEX "HealthVigilanceLicense_status_validUntil_idx" ON "HealthVigilanceLicense"("status", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "SocialUnit_addressId_key" ON "SocialUnit"("addressId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialFamily_familyCode_key" ON "SocialFamily"("familyCode");

-- CreateIndex
CREATE UNIQUE INDEX "SocialFamily_representativeId_key" ON "SocialFamily"("representativeId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialFamilyMember_personId_key" ON "SocialFamilyMember"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "EnvLicense_licenseNumber_key" ON "EnvLicense"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SanConsumerUnit_code_key" ON "SanConsumerUnit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SanWaterMeter_meterNumber_key" ON "SanWaterMeter"("meterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SanMeterReading_unitId_competence_key" ON "SanMeterReading"("unitId", "competence");

-- CreateIndex
CREATE UNIQUE INDEX "SanInvoice_invoiceNumber_key" ON "SanInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SanServiceOrder_orderNumber_key" ON "SanServiceOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "SanWaterQualityAnalysis_active_collectedAt_idx" ON "SanWaterQualityAnalysis"("active", "collectedAt");

-- CreateIndex
CREATE INDEX "SanPortalRequest_active_requestedAt_idx" ON "SanPortalRequest"("active", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CamLegislatura_numero_key" ON "CamLegislatura"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "CamVereador_cpf_key" ON "CamVereador"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "CamSessao_numero_key" ON "CamSessao"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "CamProposicao_numero_key" ON "CamProposicao"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "CamGabinete_vereadorId_key" ON "CamGabinete"("vereadorId");

-- CreateIndex
CREATE UNIQUE INDEX "CamVotacao_proposicaoId_key" ON "CamVotacao"("proposicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "CamAta_numero_key" ON "CamAta"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "CamAta_sessaoId_key" ON "CamAta"("sessaoId");

-- CreateIndex
CREATE UNIQUE INDEX "CamLei_numero_key" ON "CamLei"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "CamLei_proposicaoId_key" ON "CamLei"("proposicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "CamPresencaSessao_sessaoId_vereadorId_key" ON "CamPresencaSessao"("sessaoId", "vereadorId");

-- CreateIndex
CREATE UNIQUE INDEX "CamVoto_votacaoId_vereadorId_key" ON "CamVoto"("votacaoId", "vereadorId");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasObra_numero_key" ON "ObrasObra"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasMedicao_obraId_numero_key" ON "ObrasMedicao"("obraId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasServico_protocolo_key" ON "ObrasServico"("protocolo");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasEquipe_code_key" ON "ObrasEquipe"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasEquipeMembro_equipeId_employeeId_key" ON "ObrasEquipeMembro"("equipeId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasServicoEmployee_obrasServicoId_employeeId_key" ON "ObrasServicoEmployee"("obrasServicoId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasServicoEquipe_obrasServicoId_equipeId_key" ON "ObrasServicoEquipe"("obrasServicoId", "equipeId");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasServicoEquipamento_obrasServicoId_assetId_key" ON "ObrasServicoEquipamento"("obrasServicoId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasServicoMaterial_obrasServicoId_materialId_key" ON "ObrasServicoMaterial"("obrasServicoId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasServicoDocumento_obrasServicoId_documentId_key" ON "ObrasServicoDocumento"("obrasServicoId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasServicoCompra_obrasServicoId_purchaseRequestId_key" ON "ObrasServicoCompra"("obrasServicoId", "purchaseRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ObrasServicoCompra_obrasServicoId_purchaseProcessId_key" ON "ObrasServicoCompra"("obrasServicoId", "purchaseProcessId");

-- CreateIndex
CREATE UNIQUE INDEX "CulturaAgente_cpfCnpj_key" ON "CulturaAgente"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "CulturaProjeto_numero_key" ON "CulturaProjeto"("numero");

-- CreateIndex
CREATE INDEX "CulturaReserva_spaceId_startsAt_endsAt_idx" ON "CulturaReserva"("spaceId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "CulturaFundo_nome_key" ON "CulturaFundo"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "CulturaEventoDocumento_eventId_documentId_key" ON "CulturaEventoDocumento"("eventId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "CulturaProjetoDocumento_projectId_documentId_key" ON "CulturaProjetoDocumento"("projectId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "CulturaReservaDocumento_reservationId_documentId_key" ON "CulturaReservaDocumento"("reservationId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "CulturaConselhoDocumento_councilId_documentId_key" ON "CulturaConselhoDocumento"("councilId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "SegurancaGuarda_matricula_key" ON "SegurancaGuarda"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "SegurancaOcorrencia_numero_key" ON "SegurancaOcorrencia"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "SegurancaInfracao_auto_key" ON "SegurancaInfracao"("auto");

-- CreateIndex
CREATE UNIQUE INDEX "SegurancaMobilidadeRegistro_codigo_key" ON "SegurancaMobilidadeRegistro"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "SequenceCounter_key_key" ON "SequenceCounter"("key");

-- CreateIndex
CREATE INDEX "ConfiguracaoParametroInstancia_configuracaoInstanciaId_idx" ON "ConfiguracaoParametroInstancia"("configuracaoInstanciaId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoParametroInstancia_configuracaoInstanciaId_chav_key" ON "ConfiguracaoParametroInstancia"("configuracaoInstanciaId", "chave");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoModulo_codigo_key" ON "ConfiguracaoModulo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_code_key" ON "IntegrationConnection"("code");

-- CreateIndex
CREATE INDEX "IntegrationConnection_category_environment_status_idx" ON "IntegrationConnection"("category", "environment", "status");

-- CreateIndex
CREATE INDEX "IntegrationRun_connectionId_createdAt_idx" ON "IntegrationRun"("connectionId", "createdAt");

-- CreateIndex
CREATE INDEX "SiaficEntityVersion_entityType_entityId_idx" ON "SiaficEntityVersion"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "SiaficEntityVersion_connectionId_datasetId_entityType_entit_key" ON "SiaficEntityVersion"("connectionId", "datasetId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "SiaficOutboxEvent_connectionId_datasetId_entityType_entityI_idx" ON "SiaficOutboxEvent"("connectionId", "datasetId", "entityType", "entityId", "entityVersion");

-- CreateIndex
CREATE INDEX "SiaficOutboxEvent_actorUsuarioId_createdAt_idx" ON "SiaficOutboxEvent"("actorUsuarioId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiaficOutboxEvent_connectionId_datasetId_idempotencyKey_key" ON "SiaficOutboxEvent"("connectionId", "datasetId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "SiaficOutboxEvent_connectionId_datasetId_entityType_entityI_key" ON "SiaficOutboxEvent"("connectionId", "datasetId", "entityType", "entityId", "entityVersion", "deliveryRevision");

-- CreateIndex
CREATE UNIQUE INDEX "SiaficDelivery_eventId_key" ON "SiaficDelivery"("eventId");

-- CreateIndex
CREATE INDEX "SiaficDelivery_status_nextAttemptAt_idx" ON "SiaficDelivery"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "SiaficDelivery_leaseExpiresAt_idx" ON "SiaficDelivery"("leaseExpiresAt");

-- CreateIndex
CREATE INDEX "SiaficDeliveryAttempt_deliveryId_startedAt_idx" ON "SiaficDeliveryAttempt"("deliveryId", "startedAt");

-- CreateIndex
CREATE INDEX "SiaficDeliveryAttempt_correlationId_idx" ON "SiaficDeliveryAttempt"("correlationId");

-- CreateIndex
CREATE INDEX "SiaficExternalLink_connectionId_datasetId_remoteEntityId_idx" ON "SiaficExternalLink"("connectionId", "datasetId", "remoteEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "SiaficExternalLink_connectionId_datasetId_entityType_entity_key" ON "SiaficExternalLink"("connectionId", "datasetId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoPerfil_codigo_key" ON "ConfiguracaoPerfil"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_firebaseUid_key" ON "Usuario"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_employeeId_key" ON "Usuario"("employeeId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUsuarioId_createdAt_idx" ON "AuditEvent"("actorUsuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_createdAt_idx" ON "AuditEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_targetType_targetId_createdAt_idx" ON "AuditEvent"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicNotice_validationCode_key" ON "PublicNotice"("validationCode");

-- CreateIndex
CREATE INDEX "PublicNotice_publishedAt_idx" ON "PublicNotice"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicNotice_sourceModule_sourceEntityId_key" ON "PublicNotice"("sourceModule", "sourceEntityId");

-- CreateIndex
CREATE INDEX "PersonMergeRequest_status_createdAt_idx" ON "PersonMergeRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PersonMergeRequest_sourcePersonId_idx" ON "PersonMergeRequest"("sourcePersonId");

-- CreateIndex
CREATE INDEX "PersonMergeRequest_targetPersonId_idx" ON "PersonMergeRequest"("targetPersonId");

-- CreateIndex
CREATE INDEX "PersonMergeLedger_requestId_createdAt_idx" ON "PersonMergeLedger"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "PersonMergeLedger_sourcePersonId_createdAt_idx" ON "PersonMergeLedger"("sourcePersonId", "createdAt");

-- CreateIndex
CREATE INDEX "PersonMergeLedger_targetPersonId_createdAt_idx" ON "PersonMergeLedger"("targetPersonId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialAuditLog_entityType_entityId_idx" ON "FinancialAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FinancialAuditLog_financialYearId_createdAt_idx" ON "FinancialAuditLog"("financialYearId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialAuditLog_budgetUnitId_idx" ON "FinancialAuditLog"("budgetUnitId");

-- CreateIndex
CREATE INDEX "TaxAuditLog_entityType_entityId_idx" ON "TaxAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioModulo_usuarioId_moduloId_key" ON "UsuarioModulo"("usuarioId", "moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioUnidadeGestora_usuarioId_budgetUnitId_key" ON "UsuarioUnidadeGestora"("usuarioId", "budgetUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Covenant_number_key" ON "Covenant"("number");

-- CreateIndex
CREATE INDEX "Covenant_bankTransactionId_idx" ON "Covenant"("bankTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicityCampaign_name_key" ON "PublicityCampaign"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FundedDebt_lawNumber_key" ON "FundedDebt"("lawNumber");

-- CreateIndex
CREATE INDEX "AutomatedBankDownload_banco_agencia_contaNumero_createdAt_idx" ON "AutomatedBankDownload"("banco", "agencia", "contaNumero", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AutomatedBankDownload_banco_agencia_contaNumero_hashSHA256_key" ON "AutomatedBankDownload"("banco", "agencia", "contaNumero", "hashSHA256");

-- CreateIndex
CREATE INDEX "ClassificationRule_ativo_prioridade_idx" ON "ClassificationRule"("ativo", "prioridade");

-- CreateIndex
CREATE INDEX "ClassificationRule_bankAccountId_idx" ON "ClassificationRule"("bankAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "YieldTransaction_idempotencyKey_key" ON "YieldTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "YieldTransaction_contaNumero_data_idx" ON "YieldTransaction"("contaNumero", "data");

-- CreateIndex
CREATE INDEX "ExceptionQueueItem_status_createdAt_idx" ON "ExceptionQueueItem"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BankReconciliationSession_banco_agencia_contaNumero_periodo_key" ON "BankReconciliationSession"("banco", "agencia", "contaNumero", "periodo");

-- CreateIndex
CREATE INDEX "BankReconciliationMatch_sessionId_idx" ON "BankReconciliationMatch"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CadUnicoRecord_nis_key" ON "CadUnicoRecord"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "EnvironmentalLicense_numeroProcesso_key" ON "EnvironmentalLicense"("numeroProcesso");

-- CreateIndex
CREATE UNIQUE INDEX "EnvironmentalLicense_numeroLicenca_key" ON "EnvironmentalLicense"("numeroLicenca");

-- CreateIndex
CREATE UNIQUE INDEX "TrafficInfractionTicket_numeroAit_key" ON "TrafficInfractionTicket"("numeroAit");

-- CreateIndex
CREATE UNIQUE INDEX "FleetUnit_code_key" ON "FleetUnit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FleetUnit_plate_key" ON "FleetUnit"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "FleetUnit_assetId_key" ON "FleetUnit"("assetId");

-- CreateIndex
CREATE INDEX "FleetUnit_departmentId_category_status_code_idx" ON "FleetUnit"("departmentId", "category", "status", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FleetRoute_code_key" ON "FleetRoute"("code");

-- CreateIndex
CREATE INDEX "FleetRoute_departmentId_active_code_idx" ON "FleetRoute"("departmentId", "active", "code");

-- CreateIndex
CREATE INDEX "FleetUsage_unitId_startedAt_id_idx" ON "FleetUsage"("unitId", "startedAt", "id");

-- CreateIndex
CREATE INDEX "FleetPlan_unitId_nextDueAt_id_idx" ON "FleetPlan"("unitId", "nextDueAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FleetWorkOrder_assetMaintenanceId_key" ON "FleetWorkOrder"("assetMaintenanceId");

-- CreateIndex
CREATE INDEX "FleetWorkOrder_unitId_status_scheduledAt_id_idx" ON "FleetWorkOrder"("unitId", "status", "scheduledAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FleetWorkOrder_planId_scheduledAt_key" ON "FleetWorkOrder"("planId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "FleetConsumption_stockMovementId_key" ON "FleetConsumption"("stockMovementId");

-- CreateIndex
CREATE INDEX "FleetConsumption_unitId_type_occurredAt_id_idx" ON "FleetConsumption"("unitId", "type", "occurredAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FleetExpense_sourceKey_key" ON "FleetExpense"("sourceKey");

-- CreateIndex
CREATE INDEX "FleetExpense_unitId_nature_occurredAt_id_idx" ON "FleetExpense"("unitId", "nature", "occurredAt", "id");

-- CreateIndex
CREATE INDEX "FleetDocument_unitId_dueAt_status_id_idx" ON "FleetDocument"("unitId", "dueAt", "status", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FleetDocument_unitId_kind_type_reference_key" ON "FleetDocument"("unitId", "kind", "type", "reference");

-- CreateIndex
CREATE INDEX "FleetOccurrence_unitId_occurredAt_id_idx" ON "FleetOccurrence"("unitId", "occurredAt", "id");

-- CreateIndex
CREATE INDEX "FleetMutation_actorId_createdAt_idx" ON "FleetMutation"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "FleetAssetEvent_unitId_createdAt_id_idx" ON "FleetAssetEvent"("unitId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ItbiTransactionType_code_key" ON "ItbiTransactionType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ItbiDeclaration_declarationNumber_key" ON "ItbiDeclaration"("declarationNumber");

-- CreateIndex
CREATE INDEX "ItbiDeclaration_realEstateId_status_idx" ON "ItbiDeclaration"("realEstateId", "status");

-- CreateIndex
CREATE INDEX "ItbiDeclaration_processId_idx" ON "ItbiDeclaration"("processId");

-- CreateIndex
CREATE INDEX "ItbiDeclaration_assessmentId_idx" ON "ItbiDeclaration"("assessmentId");

-- CreateIndex
CREATE INDEX "ItbiDeclaration_guideId_idx" ON "ItbiDeclaration"("guideId");

-- CreateIndex
CREATE INDEX "ItbiParty_declarationId_role_sortOrder_idx" ON "ItbiParty"("declarationId", "role", "sortOrder");

-- CreateIndex
CREATE INDEX "ItbiParty_taxpayerId_idx" ON "ItbiParty"("taxpayerId");

-- CreateIndex
CREATE INDEX "ItbiEvent_declarationId_createdAt_idx" ON "ItbiEvent"("declarationId", "createdAt");

-- CreateIndex
CREATE INDEX "DteMailbox_status_idx" ON "DteMailbox"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DteMailbox_taxpayerId_establishmentCnpj_key" ON "DteMailbox"("taxpayerId", "establishmentCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "DteAccessGrant_codeHash_key" ON "DteAccessGrant"("codeHash");

-- CreateIndex
CREATE INDEX "DteAccessGrant_mailboxId_status_idx" ON "DteAccessGrant"("mailboxId", "status");

-- CreateIndex
CREATE INDEX "DteAccessGrant_authorizedTaxpayerId_status_idx" ON "DteAccessGrant"("authorizedTaxpayerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DteCategory_code_key" ON "DteCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DteMessage_idempotencyKey_key" ON "DteMessage"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DteMessage_mailboxId_status_availableAt_idx" ON "DteMessage"("mailboxId", "status", "availableAt");

-- CreateIndex
CREATE INDEX "DteMessage_batchKey_idx" ON "DteMessage"("batchKey");

-- CreateIndex
CREATE INDEX "DteMessage_documentId_idx" ON "DteMessage"("documentId");

-- CreateIndex
CREATE INDEX "DteMessageEvent_messageId_createdAt_idx" ON "DteMessageEvent"("messageId", "createdAt");

-- CreateIndex
CREATE INDEX "DtePowerOfAttorney_grantorTaxpayerId_status_idx" ON "DtePowerOfAttorney"("grantorTaxpayerId", "status");

-- CreateIndex
CREATE INDEX "DtePowerOfAttorney_attorneyTaxpayerId_status_idx" ON "DtePowerOfAttorney"("attorneyTaxpayerId", "status");

-- CreateIndex
CREATE INDEX "DtePowerOfAttorneyEvent_powerOfAttorneyId_createdAt_idx" ON "DtePowerOfAttorneyEvent"("powerOfAttorneyId", "createdAt");

-- CreateIndex
CREATE INDEX "NfseCredentialRequest_taxpayerId_status_idx" ON "NfseCredentialRequest"("taxpayerId", "status");

-- CreateIndex
CREATE INDEX "NfseCredentialRequest_economicRegistrationId_status_idx" ON "NfseCredentialRequest"("economicRegistrationId", "status");

-- CreateIndex
CREATE INDEX "NfseCredentialEvent_credentialId_createdAt_idx" ON "NfseCredentialEvent"("credentialId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NfseInvoiceData_invoiceId_key" ON "NfseInvoiceData"("invoiceId");

-- CreateIndex
CREATE INDEX "NfseInvoiceData_economicRegistrationId_createdAt_idx" ON "NfseInvoiceData"("economicRegistrationId", "createdAt");

-- CreateIndex
CREATE INDEX "NfseInvoiceData_serviceActivityId_createdAt_idx" ON "NfseInvoiceData"("serviceActivityId", "createdAt");

-- CreateIndex
CREATE INDEX "NfseInvoiceData_replacedInvoiceId_idx" ON "NfseInvoiceData"("replacedInvoiceId");

-- CreateIndex
CREATE INDEX "NfseEvent_invoiceId_createdAt_idx" ON "NfseEvent"("invoiceId", "createdAt");

-- CreateIndex
CREATE INDEX "NfseCorrectionLetter_invoiceId_createdAt_idx" ON "NfseCorrectionLetter"("invoiceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NfseRpsBatch_batchNumber_key" ON "NfseRpsBatch"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NfseRpsBatch_protocol_key" ON "NfseRpsBatch"("protocol");

-- CreateIndex
CREATE INDEX "NfseRpsBatch_providerTaxpayerId_status_idx" ON "NfseRpsBatch"("providerTaxpayerId", "status");

-- CreateIndex
CREATE INDEX "NfseRpsItem_invoiceId_idx" ON "NfseRpsItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "NfseRpsItem_batchId_rpsNumber_key" ON "NfseRpsItem"("batchId", "rpsNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NfseDmsDeclaration_protocol_key" ON "NfseDmsDeclaration"("protocol");

-- CreateIndex
CREATE INDEX "NfseDmsDeclaration_taxpayerId_competence_idx" ON "NfseDmsDeclaration"("taxpayerId", "competence");

-- CreateIndex
CREATE INDEX "NfseDmsDeclaration_rectifiesDeclarationId_idx" ON "NfseDmsDeclaration"("rectifiesDeclarationId");

-- CreateIndex
CREATE UNIQUE INDEX "NfseOccasionalRequest_requestNumber_key" ON "NfseOccasionalRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "NfseOccasionalRequest_providerTaxpayerId_status_idx" ON "NfseOccasionalRequest"("providerTaxpayerId", "status");

-- CreateIndex
CREATE INDEX "NfseOccasionalRequest_guideId_idx" ON "NfseOccasionalRequest"("guideId");

-- CreateIndex
CREATE INDEX "NfseDeductionCredit_taxpayerId_status_idx" ON "NfseDeductionCredit"("taxpayerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NfseDeductionCredit_taxpayerId_originDocument_key" ON "NfseDeductionCredit"("taxpayerId", "originDocument");

-- CreateIndex
CREATE INDEX "NfseDeductionConsumption_invoiceId_idx" ON "NfseDeductionConsumption"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "NfseDeductionConsumption_creditId_invoiceId_key" ON "NfseDeductionConsumption"("creditId", "invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "SimplesImportBatch_checksum_key" ON "SimplesImportBatch"("checksum");

-- CreateIndex
CREATE INDEX "SimplesImportBatch_sourceType_competence_createdAt_idx" ON "SimplesImportBatch"("sourceType", "competence", "createdAt");

-- CreateIndex
CREATE INDEX "SimplesFiscalRecord_taxpayerId_competence_recordType_idx" ON "SimplesFiscalRecord"("taxpayerId", "competence", "recordType");

-- CreateIndex
CREATE INDEX "SimplesFiscalRecord_importBatchId_status_idx" ON "SimplesFiscalRecord"("importBatchId", "status");

-- CreateIndex
CREATE INDEX "SimplesOptionPeriod_taxpayerId_status_idx" ON "SimplesOptionPeriod"("taxpayerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SimplesOptionPeriod_taxpayerId_regime_startDate_key" ON "SimplesOptionPeriod"("taxpayerId", "regime", "startDate");

-- CreateIndex
CREATE INDEX "SimplesDivergence_status_competence_idx" ON "SimplesDivergence"("status", "competence");

-- CreateIndex
CREATE INDEX "SimplesDivergence_taxpayerId_status_idx" ON "SimplesDivergence"("taxpayerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SimplesDivergence_taxpayerId_competence_divergenceType_key" ON "SimplesDivergence"("taxpayerId", "competence", "divergenceType");

-- CreateIndex
CREATE INDEX "SimplesRegularizationEvent_divergenceId_createdAt_idx" ON "SimplesRegularizationEvent"("divergenceId", "createdAt");

-- CreateIndex
CREATE INDEX "SimplesExclusionCase_taxpayerId_status_idx" ON "SimplesExclusionCase"("taxpayerId", "status");

-- CreateIndex
CREATE INDEX "SimplesExclusionCase_competence_idx" ON "SimplesExclusionCase"("competence");

-- CreateIndex
CREATE INDEX "SimplesPaymentAllocation_taxpayerId_competence_idx" ON "SimplesPaymentAllocation"("taxpayerId", "competence");

-- CreateIndex
CREATE INDEX "SimplesPaymentAllocation_revenueCode_competence_idx" ON "SimplesPaymentAllocation"("revenueCode", "competence");

-- CreateIndex
CREATE UNIQUE INDEX "DesifFinancialInstitution_baseCnpj_key" ON "DesifFinancialInstitution"("baseCnpj");

-- CreateIndex
CREATE INDEX "DesifFinancialInstitution_status_validFrom_idx" ON "DesifFinancialInstitution"("status", "validFrom");

-- CreateIndex
CREATE INDEX "DesifFinancialInstitution_taxpayerId_idx" ON "DesifFinancialInstitution"("taxpayerId");

-- CreateIndex
CREATE UNIQUE INDEX "DesifAgency_fullCnpj_key" ON "DesifAgency"("fullCnpj");

-- CreateIndex
CREATE INDEX "DesifAgency_institutionId_status_idx" ON "DesifAgency"("institutionId", "status");

-- CreateIndex
CREATE INDEX "DesifAgency_economicRegistrationId_idx" ON "DesifAgency"("economicRegistrationId");

-- CreateIndex
CREATE UNIQUE INDEX "DesifAgency_institutionId_code_key" ON "DesifAgency"("institutionId", "code");

-- CreateIndex
CREATE INDEX "DesifCosifAccount_active_validFrom_idx" ON "DesifCosifAccount"("active", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "DesifCosifAccount_code_validFrom_key" ON "DesifCosifAccount"("code", "validFrom");

-- CreateIndex
CREATE INDEX "DesifPgccPlan_institutionId_status_validFrom_idx" ON "DesifPgccPlan"("institutionId", "status", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPgccPlan_institutionId_version_key" ON "DesifPgccPlan"("institutionId", "version");

-- CreateIndex
CREATE INDEX "DesifPgccAccount_planId_active_idx" ON "DesifPgccAccount"("planId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPgccAccount_planId_code_key" ON "DesifPgccAccount"("planId", "code");

-- CreateIndex
CREATE INDEX "DesifPgccCosifLink_cosifAccountId_validFrom_idx" ON "DesifPgccCosifLink"("cosifAccountId", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPgccCosifLink_pgccAccountId_cosifAccountId_validFrom_key" ON "DesifPgccCosifLink"("pgccAccountId", "cosifAccountId", "validFrom");

-- CreateIndex
CREATE INDEX "DesifSubtitle_active_validFrom_idx" ON "DesifSubtitle"("active", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "DesifSubtitle_pgccAccountId_code_validFrom_key" ON "DesifSubtitle"("pgccAccountId", "code", "validFrom");

-- CreateIndex
CREATE INDEX "DesifTariff_institutionId_active_idx" ON "DesifTariff"("institutionId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DesifTariff_institutionId_code_validFrom_key" ON "DesifTariff"("institutionId", "code", "validFrom");

-- CreateIndex
CREATE INDEX "DesifPackage_institutionId_active_idx" ON "DesifPackage"("institutionId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPackage_institutionId_code_validFrom_key" ON "DesifPackage"("institutionId", "code", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPackageItem_packageId_tariffId_key" ON "DesifPackageItem"("packageId", "tariffId");

-- CreateIndex
CREATE UNIQUE INDEX "DesifImportBatch_checksum_key" ON "DesifImportBatch"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "DesifImportBatch_receiptNumber_key" ON "DesifImportBatch"("receiptNumber");

-- CreateIndex
CREATE INDEX "DesifImportBatch_institutionId_competence_status_idx" ON "DesifImportBatch"("institutionId", "competence", "status");

-- CreateIndex
CREATE INDEX "DesifImportBatch_agencyId_competence_idx" ON "DesifImportBatch"("agencyId", "competence");

-- CreateIndex
CREATE INDEX "DesifAssessment_agencyId_competence_status_idx" ON "DesifAssessment"("agencyId", "competence", "status");

-- CreateIndex
CREATE INDEX "DesifAssessment_taxAssessmentId_idx" ON "DesifAssessment"("taxAssessmentId");

-- CreateIndex
CREATE INDEX "DesifAssessment_guideId_idx" ON "DesifAssessment"("guideId");

-- CreateIndex
CREATE UNIQUE INDEX "DesifAssessment_importBatchId_agencyId_subtitleId_key" ON "DesifAssessment"("importBatchId", "agencyId", "subtitleId");

-- CreateIndex
CREATE INDEX "DesifTrialBalance_agencyId_competence_idx" ON "DesifTrialBalance"("agencyId", "competence");

-- CreateIndex
CREATE UNIQUE INDEX "DesifTrialBalance_importBatchId_agencyId_pgccAccountId_key" ON "DesifTrialBalance"("importBatchId", "agencyId", "pgccAccountId");

-- CreateIndex
CREATE INDEX "DesifPackageMovement_agencyId_competence_idx" ON "DesifPackageMovement"("agencyId", "competence");

-- CreateIndex
CREATE UNIQUE INDEX "DesifPackageMovement_importBatchId_agencyId_packageId_key" ON "DesifPackageMovement"("importBatchId", "agencyId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "DesifFiscalCase_serviceOrderNumber_key" ON "DesifFiscalCase"("serviceOrderNumber");

-- CreateIndex
CREATE INDEX "DesifFiscalCase_institutionId_competence_status_idx" ON "DesifFiscalCase"("institutionId", "competence", "status");

-- CreateIndex
CREATE INDEX "DesifFiscalCase_agencyId_findingType_idx" ON "DesifFiscalCase"("agencyId", "findingType");

-- CreateIndex
CREATE INDEX "DesifFiscalCase_processId_idx" ON "DesifFiscalCase"("processId");

-- CreateIndex
CREATE INDEX "DesifFiscalEvent_fiscalCaseId_createdAt_idx" ON "DesifFiscalEvent"("fiscalCaseId", "createdAt");

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

-- CreateIndex
CREATE UNIQUE INDEX "TaxCollectionProfile_code_key" ON "TaxCollectionProfile"("code");

-- CreateIndex
CREATE INDEX "TaxCollectionPortfolio_profileId_status_idx" ON "TaxCollectionPortfolio"("profileId", "status");

-- CreateIndex
CREATE INDEX "TaxCollectionPortfolioItem_taxpayerId_status_idx" ON "TaxCollectionPortfolioItem"("taxpayerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCollectionPortfolioItem_portfolioId_sourceType_sourceId_key" ON "TaxCollectionPortfolioItem"("portfolioId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "TaxCollectionRule_active_effectiveFrom_idx" ON "TaxCollectionRule"("active", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCollectionRule_code_effectiveFrom_key" ON "TaxCollectionRule"("code", "effectiveFrom");

-- CreateIndex
CREATE INDEX "TaxCollectionAction_portfolioId_scheduledAt_status_idx" ON "TaxCollectionAction"("portfolioId", "scheduledAt", "status");

-- CreateIndex
CREATE INDEX "TaxCollectionAction_taxpayerId_createdAt_idx" ON "TaxCollectionAction"("taxpayerId", "createdAt");

-- CreateIndex
CREATE INDEX "TaxCollectionActionEvent_actionId_createdAt_idx" ON "TaxCollectionActionEvent"("actionId", "createdAt");

-- CreateIndex
CREATE INDEX "TaxInstallmentRule_active_effectiveFrom_idx" ON "TaxInstallmentRule"("active", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInstallmentRule_code_effectiveFrom_key" ON "TaxInstallmentRule"("code", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInstallmentAgreement_agreementNumber_key" ON "TaxInstallmentAgreement"("agreementNumber");

-- CreateIndex
CREATE INDEX "TaxInstallmentAgreement_taxpayerId_status_idx" ON "TaxInstallmentAgreement"("taxpayerId", "status");

-- CreateIndex
CREATE INDEX "TaxInstallmentAgreement_parentAgreementId_idx" ON "TaxInstallmentAgreement"("parentAgreementId");

-- CreateIndex
CREATE INDEX "TaxInstallmentDebt_sourceType_sourceId_idx" ON "TaxInstallmentDebt"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInstallmentDebt_agreementId_sourceType_sourceId_key" ON "TaxInstallmentDebt"("agreementId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "TaxInstallmentQuota_dueDate_status_idx" ON "TaxInstallmentQuota"("dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInstallmentQuota_agreementId_quotaNumber_key" ON "TaxInstallmentQuota"("agreementId", "quotaNumber");

-- CreateIndex
CREATE INDEX "TaxInstallmentPaymentAllocation_agreementId_paymentDate_idx" ON "TaxInstallmentPaymentAllocation"("agreementId", "paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInstallmentPaymentAllocation_paymentKey_quotaId_key" ON "TaxInstallmentPaymentAllocation"("paymentKey", "quotaId");

-- CreateIndex
CREATE INDEX "TaxInstallmentEvent_agreementId_createdAt_idx" ON "TaxInstallmentEvent"("agreementId", "createdAt");

-- CreateIndex
CREATE INDEX "TaxpayerPortalAccess_taxpayerId_status_idx" ON "TaxpayerPortalAccess"("taxpayerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxpayerPortalAccess_usuarioId_taxpayerId_key" ON "TaxpayerPortalAccess"("usuarioId", "taxpayerId");

-- CreateIndex
CREATE INDEX "TaxBenefitRule_active_effectiveFrom_idx" ON "TaxBenefitRule"("active", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaxBenefitRule_code_effectiveFrom_key" ON "TaxBenefitRule"("code", "effectiveFrom");

-- CreateIndex
CREATE INDEX "TaxBenefitGrant_taxpayerId_status_idx" ON "TaxBenefitGrant"("taxpayerId", "status");

-- CreateIndex
CREATE INDEX "TaxBenefitGrant_grantedAt_idx" ON "TaxBenefitGrant"("grantedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaxBenefitGrant_ruleId_taxpayerId_sourceType_sourceId_key" ON "TaxBenefitGrant"("ruleId", "taxpayerId", "sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeDraw_slug_key" ON "TaxPrizeDraw"("slug");

-- CreateIndex
CREATE INDEX "TaxPrizeDraw_status_scheduledAt_idx" ON "TaxPrizeDraw"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeDraw_year_drawNumber_key" ON "TaxPrizeDraw"("year", "drawNumber");

-- CreateIndex
CREATE INDEX "TaxPrizeCoupon_taxpayerId_status_idx" ON "TaxPrizeCoupon"("taxpayerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeCoupon_drawId_couponNumber_key" ON "TaxPrizeCoupon"("drawId", "couponNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeCoupon_drawId_sourceDocumentType_sourceDocumentId_key" ON "TaxPrizeCoupon"("drawId", "sourceDocumentType", "sourceDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeExecution_drawId_executionNumber_key" ON "TaxPrizeExecution"("drawId", "executionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeWinner_executionId_position_key" ON "TaxPrizeWinner"("executionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPrizeWinner_executionId_couponId_key" ON "TaxPrizeWinner"("executionId", "couponId");

-- CreateIndex
CREATE INDEX "_SchoolToSchoolBus_B_index" ON "_SchoolToSchoolBus"("B");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministrativeUnit" ADD CONSTRAINT "AdministrativeUnit_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AdministrativeUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalDemand" ADD CONSTRAINT "InternalDemand_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalDemand" ADD CONSTRAINT "InternalDemand_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalDemand" ADD CONSTRAINT "InternalDemand_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalDemand" ADD CONSTRAINT "InternalDemand_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Taxpayer" ADD CONSTRAINT "Taxpayer_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Taxpayer" ADD CONSTRAINT "Taxpayer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalRepresentative" ADD CONSTRAINT "LegalRepresentative_representedPersonId_fkey" FOREIGN KEY ("representedPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalRepresentative" ADD CONSTRAINT "LegalRepresentative_representedCompanyId_fkey" FOREIGN KEY ("representedCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalRepresentative" ADD CONSTRAINT "LegalRepresentative_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_canonicalAddressId_fkey" FOREIGN KEY ("canonicalAddressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Street" ADD CONSTRAINT "Street_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealEstate" ADD CONSTRAINT "RealEstate_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealEstate" ADD CONSTRAINT "RealEstate_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_documentClassId_fkey" FOREIGN KEY ("documentClassId") REFERENCES "DocumentClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_signerUsuarioId_fkey" FOREIGN KEY ("signerUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_signerEmployeeId_fkey" FOREIGN KEY ("signerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_requestedByUsuarioId_fkey" FOREIGN KEY ("requestedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessType" ADD CONSTRAINT "ProcessType_initialDepartmentId_fkey" FOREIGN KEY ("initialDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_processTypeId_fkey" FOREIGN KEY ("processTypeId") REFERENCES "ProcessType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_initialDepartmentId_fkey" FOREIGN KEY ("initialDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_processTypeId_fkey" FOREIGN KEY ("processTypeId") REFERENCES "ProcessType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_currentDepartmentId_fkey" FOREIGN KEY ("currentDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_currentResponsibleEmployeeId_fkey" FOREIGN KEY ("currentResponsibleEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_archivedByEmployeeId_fkey" FOREIGN KEY ("archivedByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_currentWorkflowStageId_fkey" FOREIGN KEY ("currentWorkflowStageId") REFERENCES "ProcessWorkflowStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessMovement" ADD CONSTRAINT "ProcessMovement_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessMovement" ADD CONSTRAINT "ProcessMovement_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessMovement" ADD CONSTRAINT "ProcessMovement_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessMovement" ADD CONSTRAINT "ProcessMovement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessMovement" ADD CONSTRAINT "ProcessMovement_destinationEmployeeId_fkey" FOREIGN KEY ("destinationEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessMovement" ADD CONSTRAINT "ProcessMovement_receivedByEmployeeId_fkey" FOREIGN KEY ("receivedByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessWorkflowStage" ADD CONSTRAINT "ProcessWorkflowStage_processTypeId_fkey" FOREIGN KEY ("processTypeId") REFERENCES "ProcessType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessWorkflowStage" ADD CONSTRAINT "ProcessWorkflowStage_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessWorkflowStage" ADD CONSTRAINT "ProcessWorkflowStage_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenericProcessWorkflowDefinition" ADD CONSTRAINT "GenericProcessWorkflowDefinition_processTypeId_fkey" FOREIGN KEY ("processTypeId") REFERENCES "ProcessType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenericProcessWorkflowDefinition" ADD CONSTRAINT "GenericProcessWorkflowDefinition_publishedByUsuarioId_fkey" FOREIGN KEY ("publishedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenericProcessWorkflowStage" ADD CONSTRAINT "GenericProcessWorkflowStage_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "GenericProcessWorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenericProcessWorkflowStage" ADD CONSTRAINT "GenericProcessWorkflowStage_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenericProcessWorkflowStage" ADD CONSTRAINT "GenericProcessWorkflowStage_requiredDocumentClassId_fkey" FOREIGN KEY ("requiredDocumentClassId") REFERENCES "DocumentClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenericProcessWorkflowInstance" ADD CONSTRAINT "GenericProcessWorkflowInstance_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenericProcessWorkflowInstance" ADD CONSTRAINT "GenericProcessWorkflowInstance_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "GenericProcessWorkflowDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenericProcessWorkflowInstance" ADD CONSTRAINT "GenericProcessWorkflowInstance_openedByUsuarioId_fkey" FOREIGN KEY ("openedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenericProcessWorkflowEvent" ADD CONSTRAINT "GenericProcessWorkflowEvent_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "GenericProcessWorkflowInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenericProcessWorkflowEvent" ADD CONSTRAINT "GenericProcessWorkflowEvent_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessDocument" ADD CONSTRAINT "ProcessDocument_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessDocument" ADD CONSTRAINT "ProcessDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessDocument" ADD CONSTRAINT "ProcessDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessDispatch" ADD CONSTRAINT "ProcessDispatch_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessDispatch" ADD CONSTRAINT "ProcessDispatch_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessDispatch" ADD CONSTRAINT "ProcessDispatch_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessEvent" ADD CONSTRAINT "ProcessEvent_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessEvent" ADD CONSTRAINT "ProcessEvent_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessEvent" ADD CONSTRAINT "ProcessEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolNotification" ADD CONSTRAINT "ProtocolNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolNotification" ADD CONSTRAINT "ProtocolNotification_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSubject" ADD CONSTRAINT "ServiceSubject_defaultDepartmentId_fkey" FOREIGN KEY ("defaultDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "SupportChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_serviceSubjectId_fkey" FOREIGN KEY ("serviceSubjectId") REFERENCES "ServiceSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_concludedById_fkey" FOREIGN KEY ("concludedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ombudsman" ADD CONSTRAINT "Ombudsman_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "SupportChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ombudsman" ADD CONSTRAINT "Ombudsman_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ombudsman" ADD CONSTRAINT "Ombudsman_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ombudsman" ADD CONSTRAINT "Ombudsman_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ombudsman" ADD CONSTRAINT "Ombudsman_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ombudsman" ADD CONSTRAINT "Ombudsman_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ombudsman" ADD CONSTRAINT "Ombudsman_concludedById_fkey" FOREIGN KEY ("concludedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketInteraction" ADD CONSTRAINT "TicketInteraction_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketInteraction" ADD CONSTRAINT "TicketInteraction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketDocument" ADD CONSTRAINT "TicketDocument_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketDocument" ADD CONSTRAINT "TicketDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketDocument" ADD CONSTRAINT "TicketDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMovement" ADD CONSTRAINT "TicketMovement_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMovement" ADD CONSTRAINT "TicketMovement_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMovement" ADD CONSTRAINT "TicketMovement_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMovement" ADD CONSTRAINT "TicketMovement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAuditLog" ADD CONSTRAINT "TicketAuditLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAuditLog" ADD CONSTRAINT "TicketAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAuditLog" ADD CONSTRAINT "TicketAuditLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanAccess" ADD CONSTRAINT "OmbudsmanAccess_ombudsmanId_fkey" FOREIGN KEY ("ombudsmanId") REFERENCES "Ombudsman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanAccess" ADD CONSTRAINT "OmbudsmanAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanAccess" ADD CONSTRAINT "OmbudsmanAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanIdentity" ADD CONSTRAINT "OmbudsmanIdentity_ombudsmanId_fkey" FOREIGN KEY ("ombudsmanId") REFERENCES "Ombudsman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanIdentity" ADD CONSTRAINT "OmbudsmanIdentity_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanMovement" ADD CONSTRAINT "OmbudsmanMovement_ombudsmanId_fkey" FOREIGN KEY ("ombudsmanId") REFERENCES "Ombudsman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanMovement" ADD CONSTRAINT "OmbudsmanMovement_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanMovement" ADD CONSTRAINT "OmbudsmanMovement_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanMovement" ADD CONSTRAINT "OmbudsmanMovement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanInteraction" ADD CONSTRAINT "OmbudsmanInteraction_ombudsmanId_fkey" FOREIGN KEY ("ombudsmanId") REFERENCES "Ombudsman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanInteraction" ADD CONSTRAINT "OmbudsmanInteraction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanDocument" ADD CONSTRAINT "OmbudsmanDocument_ombudsmanId_fkey" FOREIGN KEY ("ombudsmanId") REFERENCES "Ombudsman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanDocument" ADD CONSTRAINT "OmbudsmanDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanDocument" ADD CONSTRAINT "OmbudsmanDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanAuditLog" ADD CONSTRAINT "OmbudsmanAuditLog_ombudsmanId_fkey" FOREIGN KEY ("ombudsmanId") REFERENCES "Ombudsman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanAuditLog" ADD CONSTRAINT "OmbudsmanAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmbudsmanAuditLog" ADD CONSTRAINT "OmbudsmanAuditLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatisfactionSurvey" ADD CONSTRAINT "SatisfactionSurvey_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalPage" ADD CONSTRAINT "PortalPage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalMenu" ADD CONSTRAINT "PortalMenu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PortalMenu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalNews" ADD CONSTRAINT "PortalNews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalNews" ADD CONSTRAINT "PortalNews_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialDiary" ADD CONSTRAINT "OfficialDiary_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EconomicRegistration" ADD CONSTRAINT "EconomicRegistration_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxAssessment" ADD CONSTRAINT "TaxAssessment_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxAssessment" ADD CONSTRAINT "TaxAssessment_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxAssessment" ADD CONSTRAINT "TaxAssessment_realEstateId_fkey" FOREIGN KEY ("realEstateId") REFERENCES "RealEstate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxAssessment" ADD CONSTRAINT "TaxAssessment_economicRegistrationId_fkey" FOREIGN KEY ("economicRegistrationId") REFERENCES "EconomicRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxGuide" ADD CONSTRAINT "TaxGuide_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxGuide" ADD CONSTRAINT "TaxGuide_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "TaxAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPayment" ADD CONSTRAINT "TaxPayment_proofDocumentId_fkey" FOREIGN KEY ("proofDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPayment" ADD CONSTRAINT "TaxPayment_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "TaxGuide"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPayment" ADD CONSTRAINT "TaxPayment_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_economicRegistrationId_fkey" FOREIGN KEY ("economicRegistrationId") REFERENCES "EconomicRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtInstallment" ADD CONSTRAINT "DebtInstallment_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtInstallment" ADD CONSTRAINT "DebtInstallment_activeDebtId_fkey" FOREIGN KEY ("activeDebtId") REFERENCES "ActiveDebt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveDebt" ADD CONSTRAINT "ActiveDebt_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveDebt" ADD CONSTRAINT "ActiveDebt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "TaxAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDaPortfolioItem" ADD CONSTRAINT "TaxDaPortfolioItem_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "TaxDaPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxProtestItem" ADD CONSTRAINT "TaxProtestItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "TaxProtestBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxExecutionCase" ADD CONSTRAINT "TaxExecutionCase_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "TaxExecutionBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxExecutionEvent" ADD CONSTRAINT "TaxExecutionEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "TaxExecutionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCemeterySector" ADD CONSTRAINT "TaxCemeterySector_cemeteryId_fkey" FOREIGN KEY ("cemeteryId") REFERENCES "TaxCemetery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCemeterySector" ADD CONSTRAINT "TaxCemeterySector_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TaxCemeterySector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxGrave" ADD CONSTRAINT "TaxGrave_cemeteryId_fkey" FOREIGN KEY ("cemeteryId") REFERENCES "TaxCemetery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxGrave" ADD CONSTRAINT "TaxGrave_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "TaxCemeterySector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCemeteryEmployee" ADD CONSTRAINT "TaxCemeteryEmployee_cemeteryId_fkey" FOREIGN KEY ("cemeteryId") REFERENCES "TaxCemetery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeceased" ADD CONSTRAINT "TaxDeceased_cemeteryId_fkey" FOREIGN KEY ("cemeteryId") REFERENCES "TaxCemetery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeceased" ADD CONSTRAINT "TaxDeceased_graveId_fkey" FOREIGN KEY ("graveId") REFERENCES "TaxGrave"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeceased" ADD CONSTRAINT "TaxDeceased_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "TaxFuneralHome"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeceased" ADD CONSTRAINT "TaxDeceased_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "TaxDeathCause"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxBurialMovement" ADD CONSTRAINT "TaxBurialMovement_deceasedId_fkey" FOREIGN KEY ("deceasedId") REFERENCES "TaxDeceased"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxBurialMovement" ADD CONSTRAINT "TaxBurialMovement_graveId_fkey" FOREIGN KEY ("graveId") REFERENCES "TaxGrave"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxGraveConcession" ADD CONSTRAINT "TaxGraveConcession_graveId_fkey" FOREIGN KEY ("graveId") REFERENCES "TaxGrave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafRule" ADD CONSTRAINT "VafRule_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafCompany" ADD CONSTRAINT "VafCompany_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "VafAccountant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafEfdImport" ADD CONSTRAINT "VafEfdImport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafEfdImport" ADD CONSTRAINT "VafEfdImport_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafEfdImport" ADD CONSTRAINT "VafEfdImport_parentImportId_fkey" FOREIGN KEY ("parentImportId") REFERENCES "VafEfdImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafGiaImport" ADD CONSTRAINT "VafGiaImport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafGiaImport" ADD CONSTRAINT "VafGiaImport_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafGiaImport" ADD CONSTRAINT "VafGiaImport_parentImportId_fkey" FOREIGN KEY ("parentImportId") REFERENCES "VafGiaImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafMonthlySummary" ADD CONSTRAINT "VafMonthlySummary_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafMonthlySummary" ADD CONSTRAINT "VafMonthlySummary_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafResult" ADD CONSTRAINT "VafResult_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafResult" ADD CONSTRAINT "VafResult_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafCompanyIndex" ADD CONSTRAINT "VafCompanyIndex_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafCompanyIndex" ADD CONSTRAINT "VafCompanyIndex_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafMunicipalIndex" ADD CONSTRAINT "VafMunicipalIndex_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafRepasse" ADD CONSTRAINT "VafRepasse_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafRepasse" ADD CONSTRAINT "VafRepasse_parentRepasseId_fkey" FOREIGN KEY ("parentRepasseId") REFERENCES "VafRepasse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafProtocol" ADD CONSTRAINT "VafProtocol_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafProtocol" ADD CONSTRAINT "VafProtocol_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "VafAccountant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafProtocol" ADD CONSTRAINT "VafProtocol_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafNotification" ADD CONSTRAINT "VafNotification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafNotification" ADD CONSTRAINT "VafNotification_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "VafAccountant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafNotification" ADD CONSTRAINT "VafNotification_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafActivity" ADD CONSTRAINT "VafActivity_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafActivity" ADD CONSTRAINT "VafActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafEstimate" ADD CONSTRAINT "VafEstimate_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafEstimate" ADD CONSTRAINT "VafEstimate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafCrossCheck" ADD CONSTRAINT "VafCrossCheck_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafCrossCheck" ADD CONSTRAINT "VafCrossCheck_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafCfopEntry" ADD CONSTRAINT "VafCfopEntry_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "VafExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VafCfopEntry" ADD CONSTRAINT "VafCfopEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "VafCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCertificate" ADD CONSTRAINT "TaxCertificate_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCertificate" ADD CONSTRAINT "TaxCertificate_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Infraction" ADD CONSTRAINT "Infraction_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_takerId_fkey" FOREIGN KEY ("takerId") REFERENCES "Taxpayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxParameter" ADD CONSTRAINT "TaxParameter_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyValuation" ADD CONSTRAINT "PropertyValuation_realEstateId_fkey" FOREIGN KEY ("realEstateId") REFERENCES "RealEstate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxServiceActivity" ADD CONSTRAINT "TaxServiceActivity_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeclaration" ADD CONSTRAINT "TaxDeclaration_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeclaration" ADD CONSTRAINT "TaxDeclaration_economicRegistrationId_fkey" FOREIGN KEY ("economicRegistrationId") REFERENCES "EconomicRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeclaration" ADD CONSTRAINT "TaxDeclaration_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "TaxServiceActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeclaration" ADD CONSTRAINT "TaxDeclaration_realEstateId_fkey" FOREIGN KEY ("realEstateId") REFERENCES "RealEstate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxServiceRequest" ADD CONSTRAINT "TaxServiceRequest_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxServiceRequest" ADD CONSTRAINT "TaxServiceRequest_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxServiceRequest" ADD CONSTRAINT "TaxServiceRequest_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxServiceRequest" ADD CONSTRAINT "TaxServiceRequest_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "TaxAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxServiceRequest" ADD CONSTRAINT "TaxServiceRequest_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCaseLink" ADD CONSTRAINT "TaxCaseLink_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCaseLink" ADD CONSTRAINT "TaxCaseLink_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCaseLink" ADD CONSTRAINT "TaxCaseLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtInstallmentSchedule" ADD CONSTRAINT "DebtInstallmentSchedule_debtInstallmentId_fkey" FOREIGN KEY ("debtInstallmentId") REFERENCES "DebtInstallment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCertificateEvaluation" ADD CONSTRAINT "TaxCertificateEvaluation_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "Taxpayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCertificateEvaluation" ADD CONSTRAINT "TaxCertificateEvaluation_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "TaxCertificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultiYearPlan" ADD CONSTRAINT "MultiYearPlan_draftedById_fkey" FOREIGN KEY ("draftedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultiYearPlan" ADD CONSTRAINT "MultiYearPlan_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultiYearPlan" ADD CONSTRAINT "MultiYearPlan_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultiYearPlan" ADD CONSTRAINT "MultiYearPlan_sanctionedById_fkey" FOREIGN KEY ("sanctionedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultiYearPlan" ADD CONSTRAINT "MultiYearPlan_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultiYearPlan" ADD CONSTRAINT "MultiYearPlan_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramPPA" ADD CONSTRAINT "ProgramPPA_multiYearPlanId_fkey" FOREIGN KEY ("multiYearPlanId") REFERENCES "MultiYearPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectivePPA" ADD CONSTRAINT "ObjectivePPA_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ProgramPPA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorPPA" ADD CONSTRAINT "IndicatorPPA_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "ObjectivePPA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPPA" ADD CONSTRAINT "ActionPPA_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ProgramPPA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalPPA" ADD CONSTRAINT "GoalPPA_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ActionPPA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGuideline" ADD CONSTRAINT "BudgetGuideline_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGuideline" ADD CONSTRAINT "BudgetGuideline_multiYearPlanId_fkey" FOREIGN KEY ("multiYearPlanId") REFERENCES "MultiYearPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGuideline" ADD CONSTRAINT "BudgetGuideline_draftedById_fkey" FOREIGN KEY ("draftedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGuideline" ADD CONSTRAINT "BudgetGuideline_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGuideline" ADD CONSTRAINT "BudgetGuideline_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGuideline" ADD CONSTRAINT "BudgetGuideline_sanctionedById_fkey" FOREIGN KEY ("sanctionedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGuideline" ADD CONSTRAINT "BudgetGuideline_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGuideline" ADD CONSTRAINT "BudgetGuideline_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGuidelinePriority" ADD CONSTRAINT "BudgetGuidelinePriority_budgetGuidelineId_fkey" FOREIGN KEY ("budgetGuidelineId") REFERENCES "BudgetGuideline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGuidelineRisk" ADD CONSTRAINT "BudgetGuidelineRisk_budgetGuidelineId_fkey" FOREIGN KEY ("budgetGuidelineId") REFERENCES "BudgetGuideline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualBudgetLaw" ADD CONSTRAINT "AnnualBudgetLaw_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualBudgetLaw" ADD CONSTRAINT "AnnualBudgetLaw_budgetGuidelineId_fkey" FOREIGN KEY ("budgetGuidelineId") REFERENCES "BudgetGuideline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualBudgetLaw" ADD CONSTRAINT "AnnualBudgetLaw_draftedById_fkey" FOREIGN KEY ("draftedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualBudgetLaw" ADD CONSTRAINT "AnnualBudgetLaw_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualBudgetLaw" ADD CONSTRAINT "AnnualBudgetLaw_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualBudgetLaw" ADD CONSTRAINT "AnnualBudgetLaw_sanctionedById_fkey" FOREIGN KEY ("sanctionedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualBudgetLaw" ADD CONSTRAINT "AnnualBudgetLaw_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualBudgetLaw" ADD CONSTRAINT "AnnualBudgetLaw_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualBudgetRevenueForecast" ADD CONSTRAINT "AnnualBudgetRevenueForecast_annualBudgetLawId_fkey" FOREIGN KEY ("annualBudgetLawId") REFERENCES "AnnualBudgetLaw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualBudgetExpenseFixation" ADD CONSTRAINT "AnnualBudgetExpenseFixation_annualBudgetLawId_fkey" FOREIGN KEY ("annualBudgetLawId") REFERENCES "AnnualBudgetLaw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyDisbursementSchedule" ADD CONSTRAINT "MonthlyDisbursementSchedule_annualBudgetLawId_fkey" FOREIGN KEY ("annualBudgetLawId") REFERENCES "AnnualBudgetLaw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimonthlyRevenueTarget" ADD CONSTRAINT "BimonthlyRevenueTarget_annualBudgetLawId_fkey" FOREIGN KEY ("annualBudgetLawId") REFERENCES "AnnualBudgetLaw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequest" ADD CONSTRAINT "CreditRequest_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequest" ADD CONSTRAINT "CreditRequest_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequest" ADD CONSTRAINT "CreditRequest_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "ResourceSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequest" ADD CONSTRAINT "CreditRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequest" ADD CONSTRAINT "CreditRequest_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequest" ADD CONSTRAINT "CreditRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequest" ADD CONSTRAINT "CreditRequest_sanctionedById_fkey" FOREIGN KEY ("sanctionedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequest" ADD CONSTRAINT "CreditRequest_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequest" ADD CONSTRAINT "CreditRequest_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequestItem" ADD CONSTRAINT "CreditRequestItem_creditRequestId_fkey" FOREIGN KEY ("creditRequestId") REFERENCES "CreditRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequestItem" ADD CONSTRAINT "CreditRequestItem_appropriationId_fkey" FOREIGN KEY ("appropriationId") REFERENCES "BudgetAppropriation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetUnit" ADD CONSTRAINT "BudgetUnit_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAppropriation" ADD CONSTRAINT "BudgetAppropriation_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAppropriation" ADD CONSTRAINT "BudgetAppropriation_budgetUnitId_fkey" FOREIGN KEY ("budgetUnitId") REFERENCES "BudgetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAppropriation" ADD CONSTRAINT "BudgetAppropriation_expenseNatureId_fkey" FOREIGN KEY ("expenseNatureId") REFERENCES "ExpenseNature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAppropriation" ADD CONSTRAINT "BudgetAppropriation_resourceSourceId_fkey" FOREIGN KEY ("resourceSourceId") REFERENCES "ResourceSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAppropriation" ADD CONSTRAINT "BudgetAppropriation_annualBudgetExpenseFixationId_fkey" FOREIGN KEY ("annualBudgetExpenseFixationId") REFERENCES "AnnualBudgetExpenseFixation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAppropriation" ADD CONSTRAINT "BudgetAppropriation_programPPAId_fkey" FOREIGN KEY ("programPPAId") REFERENCES "ProgramPPA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAppropriation" ADD CONSTRAINT "BudgetAppropriation_actionPPAId_fkey" FOREIGN KEY ("actionPPAId") REFERENCES "ActionPPA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_revenueNatureId_fkey" FOREIGN KEY ("revenueNatureId") REFERENCES "RevenueNature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_resourceSourceId_fkey" FOREIGN KEY ("resourceSourceId") REFERENCES "ResourceSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_appropriationId_fkey" FOREIGN KEY ("appropriationId") REFERENCES "BudgetAppropriation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_purchaseReceiptId_fkey" FOREIGN KEY ("purchaseReceiptId") REFERENCES "PurchaseReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_socialProgramId_fkey" FOREIGN KEY ("socialProgramId") REFERENCES "SocialProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_socialBenefitId_fkey" FOREIGN KEY ("socialBenefitId") REFERENCES "SocialBenefit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetReservation" ADD CONSTRAINT "BudgetReservation_appropriationId_fkey" FOREIGN KEY ("appropriationId") REFERENCES "BudgetAppropriation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetReservation" ADD CONSTRAINT "BudgetReservation_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetMovement" ADD CONSTRAINT "BudgetMovement_appropriationId_fkey" FOREIGN KEY ("appropriationId") REFERENCES "BudgetAppropriation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creditor" ADD CONSTRAINT "Creditor_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creditor" ADD CONSTRAINT "Creditor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creditor" ADD CONSTRAINT "Creditor_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_appropriationId_fkey" FOREIGN KEY ("appropriationId") REFERENCES "BudgetAppropriation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "Creditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_purchaseProcessId_fkey" FOREIGN KEY ("purchaseProcessId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_purchaseReceiptId_fkey" FOREIGN KEY ("purchaseReceiptId") REFERENCES "PurchaseReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_covenantId_fkey" FOREIGN KEY ("covenantId") REFERENCES "Covenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_publicityCampaignId_fkey" FOREIGN KEY ("publicityCampaignId") REFERENCES "PublicityCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_fundedDebtId_fkey" FOREIGN KEY ("fundedDebtId") REFERENCES "FundedDebt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "BudgetReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentMovement" ADD CONSTRAINT "CommitmentMovement_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "Creditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialDocument" ADD CONSTRAINT "FinancialDocument_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialDocument" ADD CONSTRAINT "FinancialDocument_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialDocument" ADD CONSTRAINT "FinancialDocument_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialDocument" ADD CONSTRAINT "FinancialDocument_withholdingPayableId_fkey" FOREIGN KEY ("withholdingPayableId") REFERENCES "WithholdingPayable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRetention" ADD CONSTRAINT "PaymentRetention_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRetention" ADD CONSTRAINT "PaymentRetention_settlementRetentionId_fkey" FOREIGN KEY ("settlementRetentionId") REFERENCES "SettlementRetention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRetention" ADD CONSTRAINT "PaymentRetention_retentionRuleId_fkey" FOREIGN KEY ("retentionRuleId") REFERENCES "RetentionRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRetention" ADD CONSTRAINT "SettlementRetention_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRetention" ADD CONSTRAINT "SettlementRetention_retentionRuleId_fkey" FOREIGN KEY ("retentionRuleId") REFERENCES "RetentionRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionRule" ADD CONSTRAINT "RetentionRule_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithholdingPayable" ADD CONSTRAINT "WithholdingPayable_retentionId_fkey" FOREIGN KEY ("retentionId") REFERENCES "PaymentRetention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithholdingPayable" ADD CONSTRAINT "WithholdingPayable_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "Creditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithholdingPayable" ADD CONSTRAINT "WithholdingPayable_receiptDocumentId_fkey" FOREIGN KEY ("receiptDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_resourceSourceId_fkey" FOREIGN KEY ("resourceSourceId") REFERENCES "ResourceSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_budgetUnitId_fkey" FOREIGN KEY ("budgetUnitId") REFERENCES "BudgetUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_accountingPlanId_fkey" FOREIGN KEY ("accountingPlanId") REFERENCES "AccountingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_linkedInvestmentAccountId_fkey" FOREIGN KEY ("linkedInvestmentAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryMovement" ADD CONSTRAINT "TreasuryMovement_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryMovement" ADD CONSTRAINT "TreasuryMovement_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryMovement" ADD CONSTRAINT "TreasuryMovement_revenueId_fkey" FOREIGN KEY ("revenueId") REFERENCES "Revenue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueReversal" ADD CONSTRAINT "RevenueReversal_revenueId_fkey" FOREIGN KEY ("revenueId") REFERENCES "Revenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueReversal" ADD CONSTRAINT "RevenueReversal_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueReversal" ADD CONSTRAINT "RevenueReversal_treasuryMovementId_fkey" FOREIGN KEY ("treasuryMovementId") REFERENCES "TreasuryMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueResourceRedistribution" ADD CONSTRAINT "RevenueResourceRedistribution_revenueId_fkey" FOREIGN KEY ("revenueId") REFERENCES "Revenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueResourceRedistribution" ADD CONSTRAINT "RevenueResourceRedistribution_sourceResourceSourceId_fkey" FOREIGN KEY ("sourceResourceSourceId") REFERENCES "ResourceSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueResourceRedistribution" ADD CONSTRAINT "RevenueResourceRedistribution_destinationResourceSourceId_fkey" FOREIGN KEY ("destinationResourceSourceId") REFERENCES "ResourceSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueResourceRedistribution" ADD CONSTRAINT "RevenueResourceRedistribution_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryTransfer" ADD CONSTRAINT "TreasuryTransfer_sourceBankAccountId_fkey" FOREIGN KEY ("sourceBankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryTransfer" ADD CONSTRAINT "TreasuryTransfer_destinationBankAccountId_fkey" FOREIGN KEY ("destinationBankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryTransfer" ADD CONSTRAINT "TreasuryTransfer_sourceMovementId_fkey" FOREIGN KEY ("sourceMovementId") REFERENCES "TreasuryMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryTransfer" ADD CONSTRAINT "TreasuryTransfer_destinationMovementId_fkey" FOREIGN KEY ("destinationMovementId") REFERENCES "TreasuryMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatementImport" ADD CONSTRAINT "BankStatementImport_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatementItem" ADD CONSTRAINT "BankStatementItem_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatementItem" ADD CONSTRAINT "BankStatementItem_statementImportId_fkey" FOREIGN KEY ("statementImportId") REFERENCES "BankStatementImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatementItem" ADD CONSTRAINT "BankStatementItem_treasuryMovementId_fkey" FOREIGN KEY ("treasuryMovementId") REFERENCES "TreasuryMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxFinancialMapping" ADD CONSTRAINT "TaxFinancialMapping_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxFinancialMapping" ADD CONSTRAINT "TaxFinancialMapping_revenueNatureId_fkey" FOREIGN KEY ("revenueNatureId") REFERENCES "RevenueNature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxFinancialMapping" ADD CONSTRAINT "TaxFinancialMapping_resourceSourceId_fkey" FOREIGN KEY ("resourceSourceId") REFERENCES "ResourceSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxFinancialMapping" ADD CONSTRAINT "TaxFinancialMapping_defaultBankAccountId_fkey" FOREIGN KEY ("defaultBankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxRevenueIntegrationEvent" ADD CONSTRAINT "TaxRevenueIntegrationEvent_taxPaymentId_fkey" FOREIGN KEY ("taxPaymentId") REFERENCES "TaxPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxRevenueIntegrationEvent" ADD CONSTRAINT "TaxRevenueIntegrationEvent_revenueId_fkey" FOREIGN KEY ("revenueId") REFERENCES "Revenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliation" ADD CONSTRAINT "BankReconciliation_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentAllocation" ADD CONSTRAINT "InvestmentAllocation_originBankAccountId_fkey" FOREIGN KEY ("originBankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentAllocation" ADD CONSTRAINT "InvestmentAllocation_investmentBankAccountId_fkey" FOREIGN KEY ("investmentBankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentAllocation" ADD CONSTRAINT "InvestmentAllocation_treasuryTransferId_fkey" FOREIGN KEY ("treasuryTransferId") REFERENCES "TreasuryTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccountingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "AccountingTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransaction" ADD CONSTRAINT "AccountingTransaction_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransaction" ADD CONSTRAINT "AccountingTransaction_authorUsuarioId_fkey" FOREIGN KEY ("authorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransaction" ADD CONSTRAINT "AccountingTransaction_authorEmployeeId_fkey" FOREIGN KEY ("authorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransaction" ADD CONSTRAINT "AccountingTransaction_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "AccountingTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingPostingRule" ADD CONSTRAINT "AccountingPostingRule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "AccountingEventCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingPostingRule" ADD CONSTRAINT "AccountingPostingRule_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "AccountingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingPostingRule" ADD CONSTRAINT "AccountingPostingRule_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "AccountingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAccountingClose" ADD CONSTRAINT "MonthlyAccountingClose_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAccountingClose" ADD CONSTRAINT "MonthlyAccountingClose_closedByUsuarioId_fkey" FOREIGN KEY ("closedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAccountingClose" ADD CONSTRAINT "MonthlyAccountingClose_closedByEmployeeId_fkey" FOREIGN KEY ("closedByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAccountingCloseEvent" ADD CONSTRAINT "MonthlyAccountingCloseEvent_monthlyAccountingCloseId_fkey" FOREIGN KEY ("monthlyAccountingCloseId") REFERENCES "MonthlyAccountingClose"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAccountingCloseEvent" ADD CONSTRAINT "MonthlyAccountingCloseEvent_requestedByUsuarioId_fkey" FOREIGN KEY ("requestedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAccountingCloseEvent" ADD CONSTRAINT "MonthlyAccountingCloseEvent_authorizedByUsuarioId_fkey" FOREIGN KEY ("authorizedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualAccountingClose" ADD CONSTRAINT "AnnualAccountingClose_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualAccountingClose" ADD CONSTRAINT "AnnualAccountingClose_closedByUsuarioId_fkey" FOREIGN KEY ("closedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualAccountingClose" ADD CONSTRAINT "AnnualAccountingClose_closedByEmployeeId_fkey" FOREIGN KEY ("closedByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayableCarryForward" ADD CONSTRAINT "PayableCarryForward_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayableCarryForward" ADD CONSTRAINT "PayableCarryForward_originFinancialYearId_fkey" FOREIGN KEY ("originFinancialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayableCarryForward" ADD CONSTRAINT "PayableCarryForward_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayableCarryForward" ADD CONSTRAINT "PayableCarryForward_previousPayableCarryForwardId_fkey" FOREIGN KEY ("previousPayableCarryForwardId") REFERENCES "PayableCarryForward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayableCarryForwardEvent" ADD CONSTRAINT "PayableCarryForwardEvent_payableCarryForwardId_fkey" FOREIGN KEY ("payableCarryForwardId") REFERENCES "PayableCarryForward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayableCarryForwardEvent" ADD CONSTRAINT "PayableCarryForwardEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayableCarryForwardEvent" ADD CONSTRAINT "PayableCarryForwardEvent_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_approvedByEmployeeId_fkey" FOREIGN KEY ("approvedByEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePlanning" ADD CONSTRAINT "PurchasePlanning_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePlanning" ADD CONSTRAINT "PurchasePlanning_originPurchaseRequestId_fkey" FOREIGN KEY ("originPurchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseProcess" ADD CONSTRAINT "PurchaseProcess_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseProcess" ADD CONSTRAINT "PurchaseProcess_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseProcessItem" ADD CONSTRAINT "PurchaseProcessItem_purchaseProcessId_fkey" FOREIGN KEY ("purchaseProcessId") REFERENCES "PurchaseProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseProcessItem" ADD CONSTRAINT "PurchaseProcessItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseProcessItem" ADD CONSTRAINT "PurchaseProcessItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreliminaryTechnicalStudy" ADD CONSTRAINT "PreliminaryTechnicalStudy_processId_fkey" FOREIGN KEY ("processId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermOfReference" ADD CONSTRAINT "TermOfReference_processId_fkey" FOREIGN KEY ("processId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceResearch" ADD CONSTRAINT "PriceResearch_processId_fkey" FOREIGN KEY ("processId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "PriceResearch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bidding" ADD CONSTRAINT "Bidding_processId_fkey" FOREIGN KEY ("processId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectContracting" ADD CONSTRAINT "DirectContracting_processId_fkey" FOREIGN KEY ("processId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectContracting" ADD CONSTRAINT "DirectContracting_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_processId_fkey" FOREIGN KEY ("processId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_sourceBudgetUnitId_fkey" FOREIGN KEY ("sourceBudgetUnitId") REFERENCES "BudgetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAmendment" ADD CONSTRAINT "ContractAmendment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementLifecycleEvent" ADD CONSTRAINT "ProcurementLifecycleEvent_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_purchaseProcessId_fkey" FOREIGN KEY ("purchaseProcessId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_attesterId_fkey" FOREIGN KEY ("attesterId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceiptItem" ADD CONSTRAINT "PurchaseReceiptItem_purchaseReceiptId_fkey" FOREIGN KEY ("purchaseReceiptId") REFERENCES "PurchaseReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceiptItem" ADD CONSTRAINT "PurchaseReceiptItem_purchaseProcessItemId_fkey" FOREIGN KEY ("purchaseProcessItemId") REFERENCES "PurchaseProcessItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceiptItem" ADD CONSTRAINT "PurchaseReceiptItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceiptItem" ADD CONSTRAINT "PurchaseReceiptItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceiptItem" ADD CONSTRAINT "PurchaseReceiptItem_stockMovementId_fkey" FOREIGN KEY ("stockMovementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItemBudgetAllocation" ADD CONSTRAINT "PurchaseRequestItemBudgetAllocation_purchaseRequestItemId_fkey" FOREIGN KEY ("purchaseRequestItemId") REFERENCES "PurchaseRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItemBudgetAllocation" ADD CONSTRAINT "PurchaseRequestItemBudgetAllocation_budgetAppropriationId_fkey" FOREIGN KEY ("budgetAppropriationId") REFERENCES "BudgetAppropriation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseProcessRequestOrigin" ADD CONSTRAINT "PurchaseProcessRequestOrigin_purchaseProcessId_fkey" FOREIGN KEY ("purchaseProcessId") REFERENCES "PurchaseProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseProcessRequestOrigin" ADD CONSTRAINT "PurchaseProcessRequestOrigin_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseProcessItemOrigin" ADD CONSTRAINT "PurchaseProcessItemOrigin_purchaseProcessItemId_fkey" FOREIGN KEY ("purchaseProcessItemId") REFERENCES "PurchaseProcessItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseProcessItemOrigin" ADD CONSTRAINT "PurchaseProcessItemOrigin_purchaseRequestItemId_fkey" FOREIGN KEY ("purchaseRequestItemId") REFERENCES "PurchaseRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPortalIdentity" ADD CONSTRAINT "SupplierPortalIdentity_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPortalIdentity" ADD CONSTRAINT "SupplierPortalIdentity_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAppointment" ADD CONSTRAINT "BiddingAppointment_appointmentDocumentId_fkey" FOREIGN KEY ("appointmentDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAppointmentMember" ADD CONSTRAINT "BiddingAppointmentMember_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "BiddingAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAppointmentMember" ADD CONSTRAINT "BiddingAppointmentMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAppointmentAssignment" ADD CONSTRAINT "BiddingAppointmentAssignment_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES "Bidding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAppointmentAssignment" ADD CONSTRAINT "BiddingAppointmentAssignment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "BiddingAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAppointmentAssignment" ADD CONSTRAINT "BiddingAppointmentAssignment_preliminaryTechnicalStudyId_fkey" FOREIGN KEY ("preliminaryTechnicalStudyId") REFERENCES "PreliminaryTechnicalStudy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingPhase" ADD CONSTRAINT "BiddingPhase_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES "Bidding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingPhase" ADD CONSTRAINT "BiddingPhase_preliminaryTechnicalStudyId_fkey" FOREIGN KEY ("preliminaryTechnicalStudyId") REFERENCES "PreliminaryTechnicalStudy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAct" ADD CONSTRAINT "BiddingAct_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES "Bidding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAct" ADD CONSTRAINT "BiddingAct_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "BiddingPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAct" ADD CONSTRAINT "BiddingAct_biddingLotId_fkey" FOREIGN KEY ("biddingLotId") REFERENCES "BiddingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAct" ADD CONSTRAINT "BiddingAct_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAct" ADD CONSTRAINT "BiddingAct_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingAct" ADD CONSTRAINT "BiddingAct_preliminaryTechnicalStudyId_fkey" FOREIGN KEY ("preliminaryTechnicalStudyId") REFERENCES "PreliminaryTechnicalStudy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingParticipant" ADD CONSTRAINT "BiddingParticipant_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES "Bidding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingParticipant" ADD CONSTRAINT "BiddingParticipant_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingParticipant" ADD CONSTRAINT "BiddingParticipant_preliminaryTechnicalStudyId_fkey" FOREIGN KEY ("preliminaryTechnicalStudyId") REFERENCES "PreliminaryTechnicalStudy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingLot" ADD CONSTRAINT "BiddingLot_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES "Bidding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingLot" ADD CONSTRAINT "BiddingLot_preliminaryTechnicalStudyId_fkey" FOREIGN KEY ("preliminaryTechnicalStudyId") REFERENCES "PreliminaryTechnicalStudy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingLotItem" ADD CONSTRAINT "BiddingLotItem_biddingLotId_fkey" FOREIGN KEY ("biddingLotId") REFERENCES "BiddingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingLotItem" ADD CONSTRAINT "BiddingLotItem_purchaseProcessItemId_fkey" FOREIGN KEY ("purchaseProcessItemId") REFERENCES "PurchaseProcessItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingBid" ADD CONSTRAINT "BiddingBid_biddingLotId_fkey" FOREIGN KEY ("biddingLotId") REFERENCES "BiddingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingBid" ADD CONSTRAINT "BiddingBid_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "BiddingParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingBid" ADD CONSTRAINT "BiddingBid_supplierPortalIdentityId_fkey" FOREIGN KEY ("supplierPortalIdentityId") REFERENCES "SupplierPortalIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingEligibility" ADD CONSTRAINT "BiddingEligibility_biddingLotId_fkey" FOREIGN KEY ("biddingLotId") REFERENCES "BiddingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingEligibility" ADD CONSTRAINT "BiddingEligibility_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "BiddingParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingEligibility" ADD CONSTRAINT "BiddingEligibility_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingEligibility" ADD CONSTRAINT "BiddingEligibility_decidedByUsuarioId_fkey" FOREIGN KEY ("decidedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingResult" ADD CONSTRAINT "BiddingResult_biddingLotId_fkey" FOREIGN KEY ("biddingLotId") REFERENCES "BiddingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingResult" ADD CONSTRAINT "BiddingResult_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "BiddingParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingResult" ADD CONSTRAINT "BiddingResult_biddingBidId_fkey" FOREIGN KEY ("biddingBidId") REFERENCES "BiddingBid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingResult" ADD CONSTRAINT "BiddingResult_biddingActId_fkey" FOREIGN KEY ("biddingActId") REFERENCES "BiddingAct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingResult" ADD CONSTRAINT "BiddingResult_decidedByUsuarioId_fkey" FOREIGN KEY ("decidedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentResponsibilityGroup" ADD CONSTRAINT "InstrumentResponsibilityGroup_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentResponsibilityGroup" ADD CONSTRAINT "InstrumentResponsibilityGroup_covenantId_fkey" FOREIGN KEY ("covenantId") REFERENCES "Covenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentParty" ADD CONSTRAINT "InstrumentParty_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentParty" ADD CONSTRAINT "InstrumentParty_covenantId_fkey" FOREIGN KEY ("covenantId") REFERENCES "Covenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentParty" ADD CONSTRAINT "InstrumentParty_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentParty" ADD CONSTRAINT "InstrumentParty_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentParty" ADD CONSTRAINT "InstrumentParty_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentParty" ADD CONSTRAINT "InstrumentParty_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentParty" ADD CONSTRAINT "InstrumentParty_responsibilityGroupId_fkey" FOREIGN KEY ("responsibilityGroupId") REFERENCES "InstrumentResponsibilityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentMeasurement" ADD CONSTRAINT "InstrumentMeasurement_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentMeasurement" ADD CONSTRAINT "InstrumentMeasurement_covenantId_fkey" FOREIGN KEY ("covenantId") REFERENCES "Covenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentMeasurement" ADD CONSTRAINT "InstrumentMeasurement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentMeasurementItem" ADD CONSTRAINT "InstrumentMeasurementItem_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "InstrumentMeasurement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentMeasurementItem" ADD CONSTRAINT "InstrumentMeasurementItem_purchaseProcessItemId_fkey" FOREIGN KEY ("purchaseProcessItemId") REFERENCES "PurchaseProcessItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentMeasurementItem" ADD CONSTRAINT "InstrumentMeasurementItem_purchaseReceiptItemId_fkey" FOREIGN KEY ("purchaseReceiptItemId") REFERENCES "PurchaseReceiptItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentInstallment" ADD CONSTRAINT "InstrumentInstallment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentInstallment" ADD CONSTRAINT "InstrumentInstallment_covenantId_fkey" FOREIGN KEY ("covenantId") REFERENCES "Covenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentInstallment" ADD CONSTRAINT "InstrumentInstallment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PayrollEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacation" ADD CONSTRAINT "Vacation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependent" ADD CONSTRAINT "Dependent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependent" ADD CONSTRAINT "Dependent_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitConfig" ADD CONSTRAINT "BenefitConfig_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBenefit" ADD CONSTRAINT "PayrollBenefit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBenefit" ADD CONSTRAINT "PayrollBenefit_benefitConfigId_fkey" FOREIGN KEY ("benefitConfigId") REFERENCES "BenefitConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnelAct" ADD CONSTRAINT "PersonnelAct_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrPayrollRuleSet" ADD CONSTRAINT "HrPayrollRuleSet_configuracaoInstanciaId_fkey" FOREIGN KEY ("configuracaoInstanciaId") REFERENCES "ConfiguracaoInstancia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrPayrollRule" ADD CONSTRAINT "HrPayrollRule_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrPayrollRubric" ADD CONSTRAINT "HrPayrollRubric_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrPayrollRubricIncidence" ADD CONSTRAINT "HrPayrollRubricIncidence_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "HrPayrollRubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrSocialSecurityScheme" ADD CONSTRAINT "HrSocialSecurityScheme_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrSocialSecurityBand" ADD CONSTRAINT "HrSocialSecurityBand_socialSecuritySchemeId_fkey" FOREIGN KEY ("socialSecuritySchemeId") REFERENCES "HrSocialSecurityScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrVacationPolicy" ADD CONSTRAINT "HrVacationPolicy_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrCalculationPolicy" ADD CONSTRAINT "HrCalculationPolicy_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrEmploymentRegime" ADD CONSTRAINT "HrEmploymentRegime_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrEmploymentRegime" ADD CONSTRAINT "HrEmploymentRegime_socialSecuritySchemeId_fkey" FOREIGN KEY ("socialSecuritySchemeId") REFERENCES "HrSocialSecurityScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrEmploymentRegime" ADD CONSTRAINT "HrEmploymentRegime_vacationPolicyId_fkey" FOREIGN KEY ("vacationPolicyId") REFERENCES "HrVacationPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrPayrollConfigurationChange" ADD CONSTRAINT "HrPayrollConfigurationChange_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrPayrollConfigurationChange" ADD CONSTRAINT "HrPayrollConfigurationChange_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_realEstateId_fkey" FOREIGN KEY ("realEstateId") REFERENCES "RealEstate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_purchaseReceiptItemId_fkey" FOREIGN KEY ("purchaseReceiptItemId") REFERENCES "PurchaseReceiptItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_stockMovementId_fkey" FOREIGN KEY ("stockMovementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalControlFinding" ADD CONSTRAINT "InternalControlFinding_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InternalControlPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetOperation" ADD CONSTRAINT "FleetOperation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetValueHistory" ADD CONSTRAINT "AssetValueHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransfer" ADD CONSTRAINT "AssetTransfer_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransfer" ADD CONSTRAINT "AssetTransfer_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransfer" ADD CONSTRAINT "AssetTransfer_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransfer" ADD CONSTRAINT "AssetTransfer_fromResponsibleId_fkey" FOREIGN KEY ("fromResponsibleId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransfer" ADD CONSTRAINT "AssetTransfer_toResponsibleId_fkey" FOREIGN KEY ("toResponsibleId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetWriteOff" ADD CONSTRAINT "AssetWriteOff_accountingTransactionId_fkey" FOREIGN KEY ("accountingTransactionId") REFERENCES "AccountingTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetWriteOff" ADD CONSTRAINT "AssetWriteOff_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetValueAdjustment" ADD CONSTRAINT "AssetValueAdjustment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetIntegrationPendingConfiguration" ADD CONSTRAINT "AssetIntegrationPendingConfiguration_assetWriteOffId_fkey" FOREIGN KEY ("assetWriteOffId") REFERENCES "AssetWriteOff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_healthUnitId_fkey" FOREIGN KEY ("healthUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MaterialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialStock" ADD CONSTRAINT "MaterialStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialStock" ADD CONSTRAINT "MaterialStock_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MaterialStock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_obrasServicoId_fkey" FOREIGN KEY ("obrasServicoId") REFERENCES "ObrasServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_materialRequestItemId_fkey" FOREIGN KEY ("materialRequestItemId") REFERENCES "MaterialRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_actorEmployeeId_fkey" FOREIGN KEY ("actorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_inventorySessionId_fkey" FOREIGN KEY ("inventorySessionId") REFERENCES "InventorySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySession" ADD CONSTRAINT "InventorySession_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySession" ADD CONSTRAINT "InventorySession_createdByUsuarioId_fkey" FOREIGN KEY ("createdByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySession" ADD CONSTRAINT "InventorySession_approvedByUsuarioId_fkey" FOREIGN KEY ("approvedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySessionItem" ADD CONSTRAINT "InventorySessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InventorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySessionItem" ADD CONSTRAINT "InventorySessionItem_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MaterialStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySessionItem" ADD CONSTRAINT "InventorySessionItem_adjustmentMovementId_fkey" FOREIGN KEY ("adjustmentMovementId") REFERENCES "MaterialMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_approvedByEmployeeId_fkey" FOREIGN KEY ("approvedByEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_issuedByEmployeeId_fkey" FOREIGN KEY ("issuedByEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaterialRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_realEstateId_fkey" FOREIGN KEY ("realEstateId") REFERENCES "RealEstate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationalGuardian" ADD CONSTRAINT "EducationalGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationalGuardian" ADD CONSTRAINT "EducationalGuardian_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_matrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "CurriculumMatrix"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreEnrollment" ADD CONSTRAINT "PreEnrollment_processId_fkey" FOREIGN KEY ("processId") REFERENCES "PreEnrollmentProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreEnrollment" ADD CONSTRAINT "PreEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreEnrollment" ADD CONSTRAINT "PreEnrollment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreEnrollmentProcess" ADD CONSTRAINT "PreEnrollmentProcess_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicDocumentIssue" ADD CONSTRAINT "AcademicDocumentIssue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicPeriod" ADD CONSTRAINT "AcademicPeriod_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumMatrix" ADD CONSTRAINT "CurriculumMatrix_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumMatrix" ADD CONSTRAINT "CurriculumMatrix_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumMatrixSubject" ADD CONSTRAINT "CurriculumMatrixSubject_matrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "CurriculumMatrix"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumMatrixSubject" ADD CONSTRAINT "CurriculumMatrixSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolShift" ADD CONSTRAINT "SchoolShift_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentMovement" ADD CONSTRAINT "EnrollmentMovement_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentMovement" ADD CONSTRAINT "EnrollmentMovement_sourceClassId_fkey" FOREIGN KEY ("sourceClassId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentMovement" ADD CONSTRAINT "EnrollmentMovement_targetClassId_fkey" FOREIGN KEY ("targetClassId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassScheduleBoard" ADD CONSTRAINT "ClassScheduleBoard_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassScheduleBoard" ADD CONSTRAINT "ClassScheduleBoard_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassScheduleEntry" ADD CONSTRAINT "ClassScheduleEntry_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ClassScheduleBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassScheduleEntry" ADD CONSTRAINT "ClassScheduleEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassScheduleEntry" ADD CONSTRAINT "ClassScheduleEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassDiary" ADD CONSTRAINT "ClassDiary_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassDiary" ADD CONSTRAINT "ClassDiary_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassDiary" ADD CONSTRAINT "ClassDiary_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_diaryId_fkey" FOREIGN KEY ("diaryId") REFERENCES "ClassDiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "EducationAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationAssessment" ADD CONSTRAINT "EducationAssessment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationAssessment" ADD CONSTRAINT "EducationAssessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationAssessment" ADD CONSTRAINT "EducationAssessment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAcademicRecord" ADD CONSTRAINT "TeacherAcademicRecord_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAcademicRecord" ADD CONSTRAINT "TeacherAcademicRecord_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAcademicRecord" ADD CONSTRAINT "TeacherAcademicRecord_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningQuestion" ADD CONSTRAINT "LearningQuestion_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "LearningActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSubmission" ADD CONSTRAINT "LearningSubmission_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "LearningActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSubmission" ADD CONSTRAINT "LearningSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationLibraryTitle" ADD CONSTRAINT "EducationLibraryTitle_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationLibraryCopy" ADD CONSTRAINT "EducationLibraryCopy_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "EducationLibraryTitle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationLibraryLoan" ADD CONSTRAINT "EducationLibraryLoan_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "EducationLibraryCopy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationLibraryLoan" ADD CONSTRAINT "EducationLibraryLoan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationLibraryReservation" ADD CONSTRAINT "EducationLibraryReservation_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "EducationLibraryTitle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationLibraryReservation" ADD CONSTRAINT "EducationLibraryReservation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationSchoolMenu" ADD CONSTRAINT "EducationSchoolMenu_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationFoodMovement" ADD CONSTRAINT "EducationFoodMovement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationFoodMovement" ADD CONSTRAINT "EducationFoodMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationFoodMovement" ADD CONSTRAINT "EducationFoodMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationFinancialAccount" ADD CONSTRAINT "EducationFinancialAccount_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationFinancialAccount" ADD CONSTRAINT "EducationFinancialAccount_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationFinancialMovement" ADD CONSTRAINT "EducationFinancialMovement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "EducationFinancialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationApplicationPlan" ADD CONSTRAINT "EducationApplicationPlan_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationApplicationPlan" ADD CONSTRAINT "EducationApplicationPlan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "EducationFinancialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTransportRoute" ADD CONSTRAINT "EducationTransportRoute_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTransportRoute" ADD CONSTRAINT "EducationTransportRoute_fleetRouteId_fkey" FOREIGN KEY ("fleetRouteId") REFERENCES "FleetRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTransportRoute" ADD CONSTRAINT "EducationTransportRoute_fleetUnitId_fkey" FOREIGN KEY ("fleetUnitId") REFERENCES "FleetUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTransportStop" ADD CONSTRAINT "EducationTransportStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "EducationTransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTransportStudent" ADD CONSTRAINT "EducationTransportStudent_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "EducationTransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTransportStudent" ADD CONSTRAINT "EducationTransportStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTransportJourney" ADD CONSTRAINT "EducationTransportJourney_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "EducationTransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTransportJourney" ADD CONSTRAINT "EducationTransportJourney_fleetUnitId_fkey" FOREIGN KEY ("fleetUnitId") REFERENCES "FleetUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTransportEvent" ADD CONSTRAINT "EducationTransportEvent_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "EducationTransportJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedagogicalCatalogItem" ADD CONSTRAINT "PedagogicalCatalogItem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedagogicalRelease" ADD CONSTRAINT "PedagogicalRelease_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "PedagogicalCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedagogicalRelease" ADD CONSTRAINT "PedagogicalRelease_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedagogicalRelease" ADD CONSTRAINT "PedagogicalRelease_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedagogicalRelease" ADD CONSTRAINT "PedagogicalRelease_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedagogicalAttempt" ADD CONSTRAINT "PedagogicalAttempt_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "PedagogicalRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedagogicalAttempt" ADD CONSTRAINT "PedagogicalAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolMeal" ADD CONSTRAINT "SchoolMeal_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolMeal" ADD CONSTRAINT "SchoolMeal_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolCalendarEvent" ADD CONSTRAINT "SchoolCalendarEvent_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthUnit" ADD CONSTRAINT "HealthUnit_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthUnit" ADD CONSTRAINT "HealthUnit_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_referenceUnitId_fkey" FOREIGN KEY ("referenceUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfessional" ADD CONSTRAINT "HealthProfessional_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfessional" ADD CONSTRAINT "HealthProfessional_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfessional" ADD CONSTRAINT "HealthProfessional_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTeam" ADD CONSTRAINT "HealthTeam_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_schedulingGroupId_fkey" FOREIGN KEY ("schedulingGroupId") REFERENCES "HealthSchedulingGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAppointment" ADD CONSTRAINT "HealthAppointment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "HealthCareSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAppointmentEvent" ADD CONSTRAINT "HealthAppointmentEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "HealthAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAppointmentEvent" ADD CONSTRAINT "HealthAppointmentEvent_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTriage" ADD CONSTRAINT "HealthTriage_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "HealthAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTriage" ADD CONSTRAINT "HealthTriage_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "HealthAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthClinicalEvolution" ADD CONSTRAINT "HealthClinicalEvolution_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthClinicalEvolution" ADD CONSTRAINT "HealthClinicalEvolution_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthDiagnosis" ADD CONSTRAINT "HealthDiagnosis_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthDiagnosis" ADD CONSTRAINT "HealthDiagnosis_cidReferenceId_fkey" FOREIGN KEY ("cidReferenceId") REFERENCES "HealthSusReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthPerformedProcedure" ADD CONSTRAINT "HealthPerformedProcedure_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthPerformedProcedure" ADD CONSTRAINT "HealthPerformedProcedure_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthPerformedProcedure" ADD CONSTRAINT "HealthPerformedProcedure_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthClinicalDocument" ADD CONSTRAINT "HealthClinicalDocument_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthClinicalDocument" ADD CONSTRAINT "HealthClinicalDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthClinicalDocument" ADD CONSTRAINT "HealthClinicalDocument_addedByUsuarioId_fkey" FOREIGN KEY ("addedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineInteraction" ADD CONSTRAINT "MedicineInteraction_originMedicineId_fkey" FOREIGN KEY ("originMedicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineInteraction" ADD CONSTRAINT "MedicineInteraction_targetMedicineId_fkey" FOREIGN KEY ("targetMedicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDosageTemplate" ADD CONSTRAINT "MedicineDosageTemplate_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthPrescription" ADD CONSTRAINT "HealthPrescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthPrescription" ADD CONSTRAINT "HealthPrescription_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthPrescription" ADD CONSTRAINT "HealthPrescription_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthPrescription" ADD CONSTRAINT "HealthPrescription_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthPrescriptionItem" ADD CONSTRAINT "HealthPrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "HealthPrescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthPrescriptionItem" ADD CONSTRAINT "HealthPrescriptionItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MedicineBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "HealthPrescriptionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MaterialStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_dispensedByProfessionalId_fkey" FOREIGN KEY ("dispensedByProfessionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDispensation" ADD CONSTRAINT "MedicineDispensation_specializedPlanId_fkey" FOREIGN KEY ("specializedPlanId") REFERENCES "SpecializedTherapeuticPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccine" ADD CONSTRAINT "Vaccine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MaterialStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineBatch" ADD CONSTRAINT "MedicineBatch_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthExamRequest" ADD CONSTRAINT "HealthExamRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthExamRequest" ADD CONSTRAINT "HealthExamRequest_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthExamRequest" ADD CONSTRAINT "HealthExamRequest_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthExamRequest" ADD CONSTRAINT "HealthExamRequest_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthExamRequest" ADD CONSTRAINT "HealthExamRequest_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthReferral" ADD CONSTRAINT "HealthReferral_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthReferral" ADD CONSTRAINT "HealthReferral_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthReferral" ADD CONSTRAINT "HealthReferral_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthReferral" ADD CONSTRAINT "HealthReferral_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthReferral" ADD CONSTRAINT "HealthReferral_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthReferral" ADD CONSTRAINT "HealthReferral_destinationUnitId_fkey" FOREIGN KEY ("destinationUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSpecialtyGroupMember" ADD CONSTRAINT "HealthSpecialtyGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "HealthSpecialtyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSpecialtyGroupMember" ADD CONSTRAINT "HealthSpecialtyGroupMember_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSpecialtyGroupService" ADD CONSTRAINT "HealthSpecialtyGroupService_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "HealthSpecialtyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSpecialtyGroupService" ADD CONSTRAINT "HealthSpecialtyGroupService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthUnitShift" ADD CONSTRAINT "HealthUnitShift_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthUnitSpecialty" ADD CONSTRAINT "HealthUnitSpecialty_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthUnitSpecialty" ADD CONSTRAINT "HealthUnitSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfessionalAssignment" ADD CONSTRAINT "HealthProfessionalAssignment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfessionalAssignment" ADD CONSTRAINT "HealthProfessionalAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfessionalAssignment" ADD CONSTRAINT "HealthProfessionalAssignment_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthServiceAssignment" ADD CONSTRAINT "HealthServiceAssignment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthServiceAssignment" ADD CONSTRAINT "HealthServiceAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthServiceAssignment" ADD CONSTRAINT "HealthServiceAssignment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHabilitation" ADD CONSTRAINT "HealthHabilitation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHabilitation" ADD CONSTRAINT "HealthHabilitation_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSchedulingGroup" ADD CONSTRAINT "HealthSchedulingGroup_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSchedulingGroup" ADD CONSTRAINT "HealthSchedulingGroup_specialtyGroupId_fkey" FOREIGN KEY ("specialtyGroupId") REFERENCES "HealthSpecialtyGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegistrationStatusHistory" ADD CONSTRAINT "HealthRegistrationStatusHistory_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegistrationStatusHistory" ADD CONSTRAINT "HealthRegistrationStatusHistory_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthUserAccessScope" ADD CONSTRAINT "HealthUserAccessScope_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthUserAccessScope" ADD CONSTRAINT "HealthUserAccessScope_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSusImportBatch" ADD CONSTRAINT "HealthSusImportBatch_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSusImportIssue" ADD CONSTRAINT "HealthSusImportIssue_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "HealthSusImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSusProcedure" ADD CONSTRAINT "HealthSusProcedure_sourceBatchId_fkey" FOREIGN KEY ("sourceBatchId") REFERENCES "HealthSusImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSusReference" ADD CONSTRAINT "HealthSusReference_sourceBatchId_fkey" FOREIGN KEY ("sourceBatchId") REFERENCES "HealthSusImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSusProcedureReference" ADD CONSTRAINT "HealthSusProcedureReference_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSusProcedureReference" ADD CONSTRAINT "HealthSusProcedureReference_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "HealthSusReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStandardDocument" ADD CONSTRAINT "HealthStandardDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStandardDocument" ADD CONSTRAINT "HealthStandardDocument_addedByUsuarioId_fkey" FOREIGN KEY ("addedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAdministrativeMerge" ADD CONSTRAINT "HealthAdministrativeMerge_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLaboratoryConfiguration" ADD CONSTRAINT "HealthLaboratoryConfiguration_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLaboratoryConfiguration" ADD CONSTRAINT "HealthLaboratoryConfiguration_createdByUsuarioId_fkey" FOREIGN KEY ("createdByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthMaterialProfile" ADD CONSTRAINT "HealthMaterialProfile_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthMaterialProfile" ADD CONSTRAINT "HealthMaterialProfile_manufacturerSupplierId_fkey" FOREIGN KEY ("manufacturerSupplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockPolicy" ADD CONSTRAINT "HealthStockPolicy_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockPolicy" ADD CONSTRAINT "HealthStockPolicy_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockReceipt" ADD CONSTRAINT "HealthStockReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockReceipt" ADD CONSTRAINT "HealthStockReceipt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockReceipt" ADD CONSTRAINT "HealthStockReceipt_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockReceiptItem" ADD CONSTRAINT "HealthStockReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "HealthStockReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockReceiptItem" ADD CONSTRAINT "HealthStockReceiptItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockReceiptItem" ADD CONSTRAINT "HealthStockReceiptItem_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockTransfer" ADD CONSTRAINT "HealthStockTransfer_originWarehouseId_fkey" FOREIGN KEY ("originWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockTransfer" ADD CONSTRAINT "HealthStockTransfer_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockTransferItem" ADD CONSTRAINT "HealthStockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "HealthStockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockTransferItem" ADD CONSTRAINT "HealthStockTransferItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockTransferItem" ADD CONSTRAINT "HealthStockTransferItem_departureMovementId_fkey" FOREIGN KEY ("departureMovementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthStockTransferItem" ADD CONSTRAINT "HealthStockTransferItem_arrivalMovementId_fkey" FOREIGN KEY ("arrivalMovementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyRequest" ADD CONSTRAINT "PharmacyRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyRequest" ADD CONSTRAINT "PharmacyRequest_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyRequestItem" ADD CONSTRAINT "PharmacyRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PharmacyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyRequestItem" ADD CONSTRAINT "PharmacyRequestItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlledMedicineBook" ADD CONSTRAINT "ControlledMedicineBook_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAssistentialDevice" ADD CONSTRAINT "HealthAssistentialDevice_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthDeviceMessage" ADD CONSTRAINT "HealthDeviceMessage_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "HealthAssistentialDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabExamModel" ADD CONSTRAINT "HealthLabExamModel_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabExamModel" ADD CONSTRAINT "HealthLabExamModel_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "HealthLabQuestionnaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabExamMaterial" ADD CONSTRAINT "HealthLabExamMaterial_examModelId_fkey" FOREIGN KEY ("examModelId") REFERENCES "HealthLabExamModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabExamMaterial" ADD CONSTRAINT "HealthLabExamMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabExamMaterial" ADD CONSTRAINT "HealthLabExamMaterial_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabSchedule" ADD CONSTRAINT "HealthLabSchedule_examModelId_fkey" FOREIGN KEY ("examModelId") REFERENCES "HealthLabExamModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabSchedule" ADD CONSTRAINT "HealthLabSchedule_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabProviderQuota" ADD CONSTRAINT "HealthLabProviderQuota_providerSupplierId_fkey" FOREIGN KEY ("providerSupplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabProviderQuota" ADD CONSTRAINT "HealthLabProviderQuota_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabProviderQuota" ADD CONSTRAINT "HealthLabProviderQuota_examModelId_fkey" FOREIGN KEY ("examModelId") REFERENCES "HealthLabExamModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabQuestionGroup" ADD CONSTRAINT "HealthLabQuestionGroup_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "HealthLabQuestionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabQuestionItem" ADD CONSTRAINT "HealthLabQuestionItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "HealthLabQuestionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_examRequestId_fkey" FOREIGN KEY ("examRequestId") REFERENCES "HealthExamRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_examModelId_fkey" FOREIGN KEY ("examModelId") REFERENCES "HealthLabExamModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_requestUnitId_fkey" FOREIGN KEY ("requestUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_collectionUnitId_fkey" FOREIGN KEY ("collectionUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_collectorProfessionalId_fkey" FOREIGN KEY ("collectorProfessionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabOrder" ADD CONSTRAINT "HealthLabOrder_providerSupplierId_fkey" FOREIGN KEY ("providerSupplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabResult" ADD CONSTRAINT "HealthLabResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HealthLabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabOrderEvent" ADD CONSTRAINT "HealthLabOrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HealthLabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabReport" ADD CONSTRAINT "HealthLabReport_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HealthLabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabReport" ADD CONSTRAINT "HealthLabReport_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLabReport" ADD CONSTRAINT "HealthLabReport_reviewerProfessionalId_fkey" FOREIGN KEY ("reviewerProfessionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedCatalogItem" ADD CONSTRAINT "SpecializedCatalogItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedTeamSchedule" ADD CONSTRAINT "SpecializedTeamSchedule_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedTeamSchedule" ADD CONSTRAINT "SpecializedTeamSchedule_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedTherapeuticPlan" ADD CONSTRAINT "SpecializedTherapeuticPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedTherapeuticPlan" ADD CONSTRAINT "SpecializedTherapeuticPlan_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedTherapeuticPlan" ADD CONSTRAINT "SpecializedTherapeuticPlan_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedTherapeuticPlan" ADD CONSTRAINT "SpecializedTherapeuticPlan_initialMedicalRecordId_fkey" FOREIGN KEY ("initialMedicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedPlanEntry" ADD CONSTRAINT "SpecializedPlanEntry_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SpecializedTherapeuticPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedPlanEntry" ADD CONSTRAINT "SpecializedPlanEntry_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedPlanEntry" ADD CONSTRAINT "SpecializedPlanEntry_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedPlanEntry" ADD CONSTRAINT "SpecializedPlanEntry_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedPlanEntry" ADD CONSTRAINT "SpecializedPlanEntry_healthServiceId_fkey" FOREIGN KEY ("healthServiceId") REFERENCES "HealthService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedQuota" ADD CONSTRAINT "SpecializedQuota_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedQuota" ADD CONSTRAINT "SpecializedQuota_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SpecializedTherapeuticPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "SpecializedQuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MaterialStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializedDistribution" ADD CONSTRAINT "SpecializedDistribution_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_providerSupplierId_fkey" FOREIGN KEY ("providerSupplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationQuota" ADD CONSTRAINT "HealthRegulationQuota_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "Covenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_requestUnitId_fkey" FOREIGN KEY ("requestUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "HealthReferral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_examRequestId_fkey" FOREIGN KEY ("examRequestId") REFERENCES "HealthExamRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "HealthRegulationQuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "HealthRegulationSector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_cidReferenceId_fkey" FOREIGN KEY ("cidReferenceId") REFERENCES "HealthSusReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationRequest" ADD CONSTRAINT "HealthRegulationRequest_guideDocumentId_fkey" FOREIGN KEY ("guideDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationEvent" ADD CONSTRAINT "HealthRegulationEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HealthRegulationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTfdRequest" ADD CONSTRAINT "HealthTfdRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTfdRequest" ADD CONSTRAINT "HealthTfdRequest_regulationRequestId_fkey" FOREIGN KEY ("regulationRequestId") REFERENCES "HealthRegulationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTfdRequest" ADD CONSTRAINT "HealthTfdRequest_originUnitId_fkey" FOREIGN KEY ("originUnitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTfdTrip" ADD CONSTRAINT "HealthTfdTrip_fleetUnitId_fkey" FOREIGN KEY ("fleetUnitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTfdTrip" ADD CONSTRAINT "HealthTfdTrip_driverEmployeeId_fkey" FOREIGN KEY ("driverEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTfdPassenger" ADD CONSTRAINT "HealthTfdPassenger_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "HealthTfdTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTfdPassenger" ADD CONSTRAINT "HealthTfdPassenger_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTfdPassenger" ADD CONSTRAINT "HealthTfdPassenger_tfdRequestId_fkey" FOREIGN KEY ("tfdRequestId") REFERENCES "HealthTfdRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_cidReferenceId_fkey" FOREIGN KEY ("cidReferenceId") REFERENCES "HealthSusReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProductionFact" ADD CONSTRAINT "HealthProductionFact_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "HealthProductionCompetence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProductionCriticism" ADD CONSTRAINT "HealthProductionCriticism_factId_fkey" FOREIGN KEY ("factId") REFERENCES "HealthProductionFact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSusFile" ADD CONSTRAINT "HealthSusFile_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "HealthProductionCompetence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSusFile" ADD CONSTRAINT "HealthSusFile_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProductionTarget" ADD CONSTRAINT "HealthProductionTarget_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "HealthProductionCompetence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProductionTarget" ADD CONSTRAINT "HealthProductionTarget_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "HealthSusProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthUnitCeiling" ADD CONSTRAINT "HealthUnitCeiling_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRoom" ADD CONSTRAINT "HealthRoom_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthReception" ADD CONSTRAINT "HealthReception_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthReception" ADD CONSTRAINT "HealthReception_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthReception" ADD CONSTRAINT "HealthReception_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HealthRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthReception" ADD CONSTRAINT "HealthReception_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "HealthDestination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthBed" ADD CONSTRAINT "HealthBed_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthBedOccupancy" ADD CONSTRAINT "HealthBedOccupancy_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "HealthBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthBedOccupancy" ADD CONSTRAINT "HealthBedOccupancy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthObservation" ADD CONSTRAINT "HealthObservation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthObservation" ADD CONSTRAINT "HealthObservation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthObservation" ADD CONSTRAINT "HealthObservation_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "HealthBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationAttachment" ADD CONSTRAINT "HealthRegulationAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HealthRegulationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRegulationAttachment" ADD CONSTRAINT "HealthRegulationAttachment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTfdPassengerRemoval" ADD CONSTRAINT "HealthTfdPassengerRemoval_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "HealthTfdPassenger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTerritoryArea" ADD CONSTRAINT "HealthTerritoryArea_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTerritoryArea" ADD CONSTRAINT "HealthTerritoryArea_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthMicroarea" ADD CONSTRAINT "HealthMicroarea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "HealthTerritoryArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthMicroarea" ADD CONSTRAINT "HealthMicroarea_agentProfessionalId_fkey" FOREIGN KEY ("agentProfessionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHousehold" ADD CONSTRAINT "HealthHousehold_microareaId_fkey" FOREIGN KEY ("microareaId") REFERENCES "HealthMicroarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHousehold" ADD CONSTRAINT "HealthHousehold_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthFamily" ADD CONSTRAINT "HealthFamily_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HealthHousehold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthFamily" ADD CONSTRAINT "HealthFamily_responsiblePersonId_fkey" FOREIGN KEY ("responsiblePersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthFamilyMember" ADD CONSTRAINT "HealthFamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "HealthFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthFamilyMember" ADD CONSTRAINT "HealthFamilyMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HealthHousehold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "HealthFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "HealthTerritoryArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHomeVisit" ADD CONSTRAINT "HealthHomeVisit_microareaId_fkey" FOREIGN KEY ("microareaId") REFERENCES "HealthMicroarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHomeVisitParticipant" ADD CONSTRAINT "HealthHomeVisitParticipant_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "HealthHomeVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHomeVisitParticipant" ADD CONSTRAINT "HealthHomeVisitParticipant_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHomeVisitParticipant" ADD CONSTRAINT "HealthHomeVisitParticipant_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "HealthHousehold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "HealthFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HealthTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEsusForm" ADD CONSTRAINT "HealthEsusForm_originMedicalRecordId_fkey" FOREIGN KEY ("originMedicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEsusBatchItem" ADD CONSTRAINT "HealthEsusBatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "HealthEsusBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEsusBatchItem" ADD CONSTRAINT "HealthEsusBatchItem_formId_fkey" FOREIGN KEY ("formId") REFERENCES "HealthEsusForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCareSchedule" ADD CONSTRAINT "HealthCareSchedule_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCareSchedule" ADD CONSTRAINT "HealthCareSchedule_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCareSchedule" ADD CONSTRAINT "HealthCareSchedule_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCareSchedule" ADD CONSTRAINT "HealthCareSchedule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "HealthSchedulingGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCareSchedule" ADD CONSTRAINT "HealthCareSchedule_providerSupplierId_fkey" FOREIGN KEY ("providerSupplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthWaitlist" ADD CONSTRAINT "HealthWaitlist_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthWaitlist" ADD CONSTRAINT "HealthWaitlist_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthWaitlist" ADD CONSTRAINT "HealthWaitlist_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "HealthCareSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProviderAccess" ADD CONSTRAINT "HealthProviderAccess_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProviderAccess" ADD CONSTRAINT "HealthProviderAccess_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthVigilanceEstablishment" ADD CONSTRAINT "HealthVigilanceEstablishment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthVigilanceEstablishment" ADD CONSTRAINT "HealthVigilanceEstablishment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthVigilanceEstablishment" ADD CONSTRAINT "HealthVigilanceEstablishment_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthVigilanceComplaint" ADD CONSTRAINT "HealthVigilanceComplaint_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "HealthVigilanceEstablishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthVigilanceComplaint" ADD CONSTRAINT "HealthVigilanceComplaint_reporterPersonId_fkey" FOREIGN KEY ("reporterPersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthVigilanceInspection" ADD CONSTRAINT "HealthVigilanceInspection_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "HealthVigilanceEstablishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthVigilanceInspection" ADD CONSTRAINT "HealthVigilanceInspection_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "HealthVigilanceComplaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthVigilanceInspection" ADD CONSTRAINT "HealthVigilanceInspection_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthVigilanceInspectionItem" ADD CONSTRAINT "HealthVigilanceInspectionItem_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "HealthVigilanceInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthVigilanceLicense" ADD CONSTRAINT "HealthVigilanceLicense_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "HealthVigilanceEstablishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthVigilanceLicense" ADD CONSTRAINT "HealthVigilanceLicense_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialUnit" ADD CONSTRAINT "SocialUnit_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialUnit" ADD CONSTRAINT "SocialUnit_realEstateId_fkey" FOREIGN KEY ("realEstateId") REFERENCES "RealEstate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialUnit" ADD CONSTRAINT "SocialUnit_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFamily" ADD CONSTRAINT "SocialFamily_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFamily" ADD CONSTRAINT "SocialFamily_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFamilyMember" ADD CONSTRAINT "SocialFamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "SocialFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFamilyMember" ADD CONSTRAINT "SocialFamilyMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialRecord" ADD CONSTRAINT "SocialRecord_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "SocialFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialRecord" ADD CONSTRAINT "SocialRecord_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SocialUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttendance" ADD CONSTRAINT "SocialAttendance_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "SocialFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttendance" ADD CONSTRAINT "SocialAttendance_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttendance" ADD CONSTRAINT "SocialAttendance_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SocialUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttendance" ADD CONSTRAINT "SocialAttendance_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialVisit" ADD CONSTRAINT "SocialVisit_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "SocialFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialVisit" ADD CONSTRAINT "SocialVisit_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialBenefitConcession" ADD CONSTRAINT "SocialBenefitConcession_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "SocialBenefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialBenefitConcession" ADD CONSTRAINT "SocialBenefitConcession_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "SocialFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialBenefitConcession" ADD CONSTRAINT "SocialBenefitConcession_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialBenefitConcession" ADD CONSTRAINT "SocialBenefitConcession_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialProgramParticipation" ADD CONSTRAINT "SocialProgramParticipation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "SocialProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialProgramParticipation" ADD CONSTRAINT "SocialProgramParticipation_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "SocialFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvLicense" ADD CONSTRAINT "EnvLicense_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "EnvEnterprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvInspection" ADD CONSTRAINT "EnvInspection_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "EnvEnterprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvInfraction" ADD CONSTRAINT "EnvInfraction_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "EnvEnterprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvWaste" ADD CONSTRAINT "EnvWaste_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "EnvEnterprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvDocument" ADD CONSTRAINT "EnvDocument_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "EnvEnterprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SanWaterMeter" ADD CONSTRAINT "SanWaterMeter_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SanConsumerUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SanMeterReading" ADD CONSTRAINT "SanMeterReading_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SanConsumerUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SanMeterReading" ADD CONSTRAINT "SanMeterReading_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "SanWaterMeter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SanInvoice" ADD CONSTRAINT "SanInvoice_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SanConsumerUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SanServiceOrder" ADD CONSTRAINT "SanServiceOrder_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SanConsumerUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamLegislatura" ADD CONSTRAINT "CamLegislatura_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamVereador" ADD CONSTRAINT "CamVereador_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamVereador" ADD CONSTRAINT "CamVereador_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamVereador" ADD CONSTRAINT "CamVereador_legislaturaId_fkey" FOREIGN KEY ("legislaturaId") REFERENCES "CamLegislatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamSessao" ADD CONSTRAINT "CamSessao_legislaturaId_fkey" FOREIGN KEY ("legislaturaId") REFERENCES "CamLegislatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamProposicao" ADD CONSTRAINT "CamProposicao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "CamVereador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamProposicao" ADD CONSTRAINT "CamProposicao_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "CamSessao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamComissao" ADD CONSTRAINT "CamComissao_legislaturaId_fkey" FOREIGN KEY ("legislaturaId") REFERENCES "CamLegislatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamComissaoMembro" ADD CONSTRAINT "CamComissaoMembro_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "CamComissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamComissaoMembro" ADD CONSTRAINT "CamComissaoMembro_vereadorId_fkey" FOREIGN KEY ("vereadorId") REFERENCES "CamVereador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamMesaDiretora" ADD CONSTRAINT "CamMesaDiretora_legislaturaId_fkey" FOREIGN KEY ("legislaturaId") REFERENCES "CamLegislatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamMesaDiretora" ADD CONSTRAINT "CamMesaDiretora_vereadorId_fkey" FOREIGN KEY ("vereadorId") REFERENCES "CamVereador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamGabinete" ADD CONSTRAINT "CamGabinete_vereadorId_fkey" FOREIGN KEY ("vereadorId") REFERENCES "CamVereador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamPauta" ADD CONSTRAINT "CamPauta_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "CamSessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamPauta" ADD CONSTRAINT "CamPauta_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "CamProposicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamVotacao" ADD CONSTRAINT "CamVotacao_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "CamProposicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamVotacao" ADD CONSTRAINT "CamVotacao_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "CamSessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamAta" ADD CONSTRAINT "CamAta_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "CamSessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamLei" ADD CONSTRAINT "CamLei_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "CamProposicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamParecer" ADD CONSTRAINT "CamParecer_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "CamProposicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamParecer" ADD CONSTRAINT "CamParecer_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "CamComissao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamAudiencia" ADD CONSTRAINT "CamAudiencia_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "CamSessao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamAudiencia" ADD CONSTRAINT "CamAudiencia_legislaturaId_fkey" FOREIGN KEY ("legislaturaId") REFERENCES "CamLegislatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamPresencaSessao" ADD CONSTRAINT "CamPresencaSessao_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "CamSessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamPresencaSessao" ADD CONSTRAINT "CamPresencaSessao_vereadorId_fkey" FOREIGN KEY ("vereadorId") REFERENCES "CamVereador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamVoto" ADD CONSTRAINT "CamVoto_votacaoId_fkey" FOREIGN KEY ("votacaoId") REFERENCES "CamVotacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamVoto" ADD CONSTRAINT "CamVoto_vereadorId_fkey" FOREIGN KEY ("vereadorId") REFERENCES "CamVereador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamDocumentoLegislativo" ADD CONSTRAINT "CamDocumentoLegislativo_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamDocumentoLegislativo" ADD CONSTRAINT "CamDocumentoLegislativo_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "CamProposicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamDocumentoLegislativo" ADD CONSTRAINT "CamDocumentoLegislativo_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "CamSessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamDocumentoLegislativo" ADD CONSTRAINT "CamDocumentoLegislativo_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "CamAta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamDocumentoLegislativo" ADD CONSTRAINT "CamDocumentoLegislativo_leiId_fkey" FOREIGN KEY ("leiId") REFERENCES "CamLei"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamDocumentoLegislativo" ADD CONSTRAINT "CamDocumentoLegislativo_parecerId_fkey" FOREIGN KEY ("parecerId") REFERENCES "CamParecer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamDocumentoLegislativo" ADD CONSTRAINT "CamDocumentoLegislativo_audienciaId_fkey" FOREIGN KEY ("audienciaId") REFERENCES "CamAudiencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasMedicao" ADD CONSTRAINT "ObrasMedicao_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "ObrasObra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServico" ADD CONSTRAINT "ObrasServico_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServico" ADD CONSTRAINT "ObrasServico_targetAssetId_fkey" FOREIGN KEY ("targetAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServico" ADD CONSTRAINT "ObrasServico_budgetAppropriationId_fkey" FOREIGN KEY ("budgetAppropriationId") REFERENCES "BudgetAppropriation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServico" ADD CONSTRAINT "ObrasServico_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasEquipe" ADD CONSTRAINT "ObrasEquipe_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasEquipeMembro" ADD CONSTRAINT "ObrasEquipeMembro_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "ObrasEquipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasEquipeMembro" ADD CONSTRAINT "ObrasEquipeMembro_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoEmployee" ADD CONSTRAINT "ObrasServicoEmployee_obrasServicoId_fkey" FOREIGN KEY ("obrasServicoId") REFERENCES "ObrasServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoEmployee" ADD CONSTRAINT "ObrasServicoEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoEquipe" ADD CONSTRAINT "ObrasServicoEquipe_obrasServicoId_fkey" FOREIGN KEY ("obrasServicoId") REFERENCES "ObrasServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoEquipe" ADD CONSTRAINT "ObrasServicoEquipe_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "ObrasEquipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoEquipamento" ADD CONSTRAINT "ObrasServicoEquipamento_obrasServicoId_fkey" FOREIGN KEY ("obrasServicoId") REFERENCES "ObrasServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoEquipamento" ADD CONSTRAINT "ObrasServicoEquipamento_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoMaterial" ADD CONSTRAINT "ObrasServicoMaterial_obrasServicoId_fkey" FOREIGN KEY ("obrasServicoId") REFERENCES "ObrasServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoMaterial" ADD CONSTRAINT "ObrasServicoMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoMaterial" ADD CONSTRAINT "ObrasServicoMaterial_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MaterialStock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoDocumento" ADD CONSTRAINT "ObrasServicoDocumento_obrasServicoId_fkey" FOREIGN KEY ("obrasServicoId") REFERENCES "ObrasServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoDocumento" ADD CONSTRAINT "ObrasServicoDocumento_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoCompra" ADD CONSTRAINT "ObrasServicoCompra_obrasServicoId_fkey" FOREIGN KEY ("obrasServicoId") REFERENCES "ObrasServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoCompra" ADD CONSTRAINT "ObrasServicoCompra_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObrasServicoCompra" ADD CONSTRAINT "ObrasServicoCompra_purchaseProcessId_fkey" FOREIGN KEY ("purchaseProcessId") REFERENCES "PurchaseProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaAgente" ADD CONSTRAINT "CulturaAgente_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaAgente" ADD CONSTRAINT "CulturaAgente_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaEspaco" ADD CONSTRAINT "CulturaEspaco_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaEspaco" ADD CONSTRAINT "CulturaEspaco_realEstateId_fkey" FOREIGN KEY ("realEstateId") REFERENCES "RealEstate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaEspaco" ADD CONSTRAINT "CulturaEspaco_responsibleEmployeeId_fkey" FOREIGN KEY ("responsibleEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaEvento" ADD CONSTRAINT "CulturaEvento_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CulturaEspaco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaEvento" ADD CONSTRAINT "CulturaEvento_responsibleEmployeeId_fkey" FOREIGN KEY ("responsibleEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaEvento" ADD CONSTRAINT "CulturaEvento_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CulturaProjeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaProjeto" ADD CONSTRAINT "CulturaProjeto_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "CulturaAgente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaProjeto" ADD CONSTRAINT "CulturaProjeto_appropriationId_fkey" FOREIGN KEY ("appropriationId") REFERENCES "BudgetAppropriation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaProjeto" ADD CONSTRAINT "CulturaProjeto_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaProjeto" ADD CONSTRAINT "CulturaProjeto_purchaseProcessId_fkey" FOREIGN KEY ("purchaseProcessId") REFERENCES "PurchaseProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaProjeto" ADD CONSTRAINT "CulturaProjeto_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaAtividade" ADD CONSTRAINT "CulturaAtividade_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CulturaEspaco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaAtividade" ADD CONSTRAINT "CulturaAtividade_instructorEmployeeId_fkey" FOREIGN KEY ("instructorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaAtividade" ADD CONSTRAINT "CulturaAtividade_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "CulturaAgente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaReserva" ADD CONSTRAINT "CulturaReserva_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CulturaEspaco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaReserva" ADD CONSTRAINT "CulturaReserva_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaReserva" ADD CONSTRAINT "CulturaReserva_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaReserva" ADD CONSTRAINT "CulturaReserva_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CulturaEvento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaPatrimonio" ADD CONSTRAINT "CulturaPatrimonio_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaPatrimonio" ADD CONSTRAINT "CulturaPatrimonio_realEstateId_fkey" FOREIGN KEY ("realEstateId") REFERENCES "RealEstate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaFundo" ADD CONSTRAINT "CulturaFundo_appropriationId_fkey" FOREIGN KEY ("appropriationId") REFERENCES "BudgetAppropriation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaEventoDocumento" ADD CONSTRAINT "CulturaEventoDocumento_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CulturaEvento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaEventoDocumento" ADD CONSTRAINT "CulturaEventoDocumento_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaProjetoDocumento" ADD CONSTRAINT "CulturaProjetoDocumento_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CulturaProjeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaProjetoDocumento" ADD CONSTRAINT "CulturaProjetoDocumento_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaReservaDocumento" ADD CONSTRAINT "CulturaReservaDocumento_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "CulturaReserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaReservaDocumento" ADD CONSTRAINT "CulturaReservaDocumento_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaConselhoDocumento" ADD CONSTRAINT "CulturaConselhoDocumento_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "CulturaConselho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturaConselhoDocumento" ADD CONSTRAINT "CulturaConselhoDocumento_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegurancaGuarda" ADD CONSTRAINT "SegurancaGuarda_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegurancaOcorrencia" ADD CONSTRAINT "SegurancaOcorrencia_responsavelGuardaId_fkey" FOREIGN KEY ("responsavelGuardaId") REFERENCES "SegurancaGuarda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegurancaMobilidadeRegistro" ADD CONSTRAINT "SegurancaMobilidadeRegistro_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegurancaMobilidadeRegistro" ADD CONSTRAINT "SegurancaMobilidadeRegistro_obrasServicoId_fkey" FOREIGN KEY ("obrasServicoId") REFERENCES "ObrasServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegurancaMobilidadeRegistro" ADD CONSTRAINT "SegurancaMobilidadeRegistro_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoParametroInstancia" ADD CONSTRAINT "ConfiguracaoParametroInstancia_configuracaoInstanciaId_fkey" FOREIGN KEY ("configuracaoInstanciaId") REFERENCES "ConfiguracaoInstancia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationRun" ADD CONSTRAINT "IntegrationRun_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiaficEntityVersion" ADD CONSTRAINT "SiaficEntityVersion_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiaficOutboxEvent" ADD CONSTRAINT "SiaficOutboxEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiaficOutboxEvent" ADD CONSTRAINT "SiaficOutboxEvent_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiaficDelivery" ADD CONSTRAINT "SiaficDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SiaficOutboxEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiaficDeliveryAttempt" ADD CONSTRAINT "SiaficDeliveryAttempt_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "SiaficDelivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiaficExternalLink" ADD CONSTRAINT "SiaficExternalLink_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "ConfiguracaoPerfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicNotice" ADD CONSTRAINT "PublicNotice_publishedByUsuarioId_fkey" FOREIGN KEY ("publishedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonMergeRequest" ADD CONSTRAINT "PersonMergeRequest_sourcePersonId_fkey" FOREIGN KEY ("sourcePersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonMergeRequest" ADD CONSTRAINT "PersonMergeRequest_targetPersonId_fkey" FOREIGN KEY ("targetPersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonMergeRequest" ADD CONSTRAINT "PersonMergeRequest_proposedByUsuarioId_fkey" FOREIGN KEY ("proposedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonMergeRequest" ADD CONSTRAINT "PersonMergeRequest_approvedByUsuarioId_fkey" FOREIGN KEY ("approvedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonMergeRequest" ADD CONSTRAINT "PersonMergeRequest_reversedByUsuarioId_fkey" FOREIGN KEY ("reversedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonMergeLedger" ADD CONSTRAINT "PersonMergeLedger_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PersonMergeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonMergeLedger" ADD CONSTRAINT "PersonMergeLedger_sourcePersonId_fkey" FOREIGN KEY ("sourcePersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonMergeLedger" ADD CONSTRAINT "PersonMergeLedger_targetPersonId_fkey" FOREIGN KEY ("targetPersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonMergeLedger" ADD CONSTRAINT "PersonMergeLedger_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAuditLog" ADD CONSTRAINT "FinancialAuditLog_authorUsuarioId_fkey" FOREIGN KEY ("authorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAuditLog" ADD CONSTRAINT "FinancialAuditLog_authorEmployeeId_fkey" FOREIGN KEY ("authorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxAuditLog" ADD CONSTRAINT "TaxAuditLog_authorUsuarioId_fkey" FOREIGN KEY ("authorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxAuditLog" ADD CONSTRAINT "TaxAuditLog_authorEmployeeId_fkey" FOREIGN KEY ("authorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioModulo" ADD CONSTRAINT "UsuarioModulo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioModulo" ADD CONSTRAINT "UsuarioModulo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ConfiguracaoModulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioUnidadeGestora" ADD CONSTRAINT "UsuarioUnidadeGestora_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioUnidadeGestora" ADD CONSTRAINT "UsuarioUnidadeGestora_budgetUnitId_fkey" FOREIGN KEY ("budgetUnitId") REFERENCES "BudgetUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Covenant" ADD CONSTRAINT "Covenant_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassificationRule" ADD CONSTRAINT "ClassificationRule_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetUnit" ADD CONSTRAINT "FleetUnit_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetUnit" ADD CONSTRAINT "FleetUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetUsage" ADD CONSTRAINT "FleetUsage_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetUsage" ADD CONSTRAINT "FleetUsage_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "FleetRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetPlan" ADD CONSTRAINT "FleetPlan_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetWorkOrder" ADD CONSTRAINT "FleetWorkOrder_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetWorkOrder" ADD CONSTRAINT "FleetWorkOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FleetPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetWorkOrder" ADD CONSTRAINT "FleetWorkOrder_assetMaintenanceId_fkey" FOREIGN KEY ("assetMaintenanceId") REFERENCES "AssetMaintenance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetConsumption" ADD CONSTRAINT "FleetConsumption_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetConsumption" ADD CONSTRAINT "FleetConsumption_stockMovementId_fkey" FOREIGN KEY ("stockMovementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetExpense" ADD CONSTRAINT "FleetExpense_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetDocument" ADD CONSTRAINT "FleetDocument_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetOccurrence" ADD CONSTRAINT "FleetOccurrence_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetAssetEvent" ADD CONSTRAINT "FleetAssetEvent_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItbiDeclaration" ADD CONSTRAINT "ItbiDeclaration_transactionTypeId_fkey" FOREIGN KEY ("transactionTypeId") REFERENCES "ItbiTransactionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItbiParty" ADD CONSTRAINT "ItbiParty_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "ItbiDeclaration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItbiEvent" ADD CONSTRAINT "ItbiEvent_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "ItbiDeclaration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DteAccessGrant" ADD CONSTRAINT "DteAccessGrant_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "DteMailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DteMessage" ADD CONSTRAINT "DteMessage_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "DteMailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DteMessage" ADD CONSTRAINT "DteMessage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DteCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DteMessageEvent" ADD CONSTRAINT "DteMessageEvent_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DteMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DtePowerOfAttorneyEvent" ADD CONSTRAINT "DtePowerOfAttorneyEvent_powerOfAttorneyId_fkey" FOREIGN KEY ("powerOfAttorneyId") REFERENCES "DtePowerOfAttorney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfseCredentialEvent" ADD CONSTRAINT "NfseCredentialEvent_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "NfseCredentialRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfseRpsItem" ADD CONSTRAINT "NfseRpsItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "NfseRpsBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfseDeductionConsumption" ADD CONSTRAINT "NfseDeductionConsumption_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "NfseDeductionCredit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimplesFiscalRecord" ADD CONSTRAINT "SimplesFiscalRecord_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "SimplesImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimplesRegularizationEvent" ADD CONSTRAINT "SimplesRegularizationEvent_divergenceId_fkey" FOREIGN KEY ("divergenceId") REFERENCES "SimplesDivergence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimplesPaymentAllocation" ADD CONSTRAINT "SimplesPaymentAllocation_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "SimplesImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifAgency" ADD CONSTRAINT "DesifAgency_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPgccPlan" ADD CONSTRAINT "DesifPgccPlan_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPgccAccount" ADD CONSTRAINT "DesifPgccAccount_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DesifPgccPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPgccCosifLink" ADD CONSTRAINT "DesifPgccCosifLink_pgccAccountId_fkey" FOREIGN KEY ("pgccAccountId") REFERENCES "DesifPgccAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPgccCosifLink" ADD CONSTRAINT "DesifPgccCosifLink_cosifAccountId_fkey" FOREIGN KEY ("cosifAccountId") REFERENCES "DesifCosifAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifSubtitle" ADD CONSTRAINT "DesifSubtitle_pgccAccountId_fkey" FOREIGN KEY ("pgccAccountId") REFERENCES "DesifPgccAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifTariff" ADD CONSTRAINT "DesifTariff_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackage" ADD CONSTRAINT "DesifPackage_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackageItem" ADD CONSTRAINT "DesifPackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "DesifPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackageItem" ADD CONSTRAINT "DesifPackageItem_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "DesifTariff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifImportBatch" ADD CONSTRAINT "DesifImportBatch_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifImportBatch" ADD CONSTRAINT "DesifImportBatch_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "DesifAgency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifAssessment" ADD CONSTRAINT "DesifAssessment_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "DesifImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifAssessment" ADD CONSTRAINT "DesifAssessment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "DesifAgency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifAssessment" ADD CONSTRAINT "DesifAssessment_subtitleId_fkey" FOREIGN KEY ("subtitleId") REFERENCES "DesifSubtitle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifTrialBalance" ADD CONSTRAINT "DesifTrialBalance_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "DesifImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifTrialBalance" ADD CONSTRAINT "DesifTrialBalance_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "DesifAgency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifTrialBalance" ADD CONSTRAINT "DesifTrialBalance_pgccAccountId_fkey" FOREIGN KEY ("pgccAccountId") REFERENCES "DesifPgccAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackageMovement" ADD CONSTRAINT "DesifPackageMovement_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "DesifImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackageMovement" ADD CONSTRAINT "DesifPackageMovement_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "DesifAgency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifPackageMovement" ADD CONSTRAINT "DesifPackageMovement_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "DesifPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifFiscalCase" ADD CONSTRAINT "DesifFiscalCase_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "DesifFinancialInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifFiscalCase" ADD CONSTRAINT "DesifFiscalCase_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "DesifAgency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifFiscalCase" ADD CONSTRAINT "DesifFiscalCase_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "DesifAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesifFiscalEvent" ADD CONSTRAINT "DesifFiscalEvent_fiscalCaseId_fkey" FOREIGN KEY ("fiscalCaseId") REFERENCES "DesifFiscalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "TaxCollectionPortfolio" ADD CONSTRAINT "TaxCollectionPortfolio_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TaxCollectionProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCollectionPortfolioItem" ADD CONSTRAINT "TaxCollectionPortfolioItem_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "TaxCollectionPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCollectionAction" ADD CONSTRAINT "TaxCollectionAction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "TaxCollectionPortfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCollectionAction" ADD CONSTRAINT "TaxCollectionAction_portfolioItemId_fkey" FOREIGN KEY ("portfolioItemId") REFERENCES "TaxCollectionPortfolioItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCollectionActionEvent" ADD CONSTRAINT "TaxCollectionActionEvent_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "TaxCollectionAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentAgreement" ADD CONSTRAINT "TaxInstallmentAgreement_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "TaxInstallmentRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentDebt" ADD CONSTRAINT "TaxInstallmentDebt_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "TaxInstallmentAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentQuota" ADD CONSTRAINT "TaxInstallmentQuota_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "TaxInstallmentAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentPaymentAllocation" ADD CONSTRAINT "TaxInstallmentPaymentAllocation_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "TaxInstallmentAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentPaymentAllocation" ADD CONSTRAINT "TaxInstallmentPaymentAllocation_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "TaxInstallmentQuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInstallmentEvent" ADD CONSTRAINT "TaxInstallmentEvent_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "TaxInstallmentAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxBenefitGrant" ADD CONSTRAINT "TaxBenefitGrant_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "TaxBenefitRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPrizeCoupon" ADD CONSTRAINT "TaxPrizeCoupon_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "TaxPrizeDraw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPrizeExecution" ADD CONSTRAINT "TaxPrizeExecution_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "TaxPrizeDraw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPrizeWinner" ADD CONSTRAINT "TaxPrizeWinner_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "TaxPrizeExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPrizeWinner" ADD CONSTRAINT "TaxPrizeWinner_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "TaxPrizeCoupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SchoolToSchoolBus" ADD CONSTRAINT "_SchoolToSchoolBus_A_fkey" FOREIGN KEY ("A") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SchoolToSchoolBus" ADD CONSTRAINT "_SchoolToSchoolBus_B_fkey" FOREIGN KEY ("B") REFERENCES "SchoolBus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
