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
