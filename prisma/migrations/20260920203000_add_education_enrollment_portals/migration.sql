-- AlterTable
ALTER TABLE "PreEnrollment" ADD COLUMN     "allocatedAt" TIMESTAMP(3),
ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "history" JSONB,
ADD COLUMN     "position" INTEGER,
ADD COLUMN     "processId" TEXT,
ADD COLUMN     "protocol" TEXT,
ADD COLUMN     "rankingScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

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

-- CreateIndex
CREATE INDEX "PreEnrollmentProcess_year_status_idx" ON "PreEnrollmentProcess"("year", "status");

-- CreateIndex
CREATE INDEX "PreEnrollmentProcess_schoolId_stage_idx" ON "PreEnrollmentProcess"("schoolId", "stage");

-- CreateIndex
CREATE INDEX "AcademicDocumentIssue_type_createdAt_idx" ON "AcademicDocumentIssue"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AcademicDocumentIssue_studentId_createdAt_idx" ON "AcademicDocumentIssue"("studentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PreEnrollment_protocol_key" ON "PreEnrollment"("protocol");

-- CreateIndex
CREATE INDEX "PreEnrollment_processId_status_rankingScore_idx" ON "PreEnrollment"("processId", "status", "rankingScore");

-- AddForeignKey
ALTER TABLE "PreEnrollment" ADD CONSTRAINT "PreEnrollment_processId_fkey" FOREIGN KEY ("processId") REFERENCES "PreEnrollmentProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreEnrollmentProcess" ADD CONSTRAINT "PreEnrollmentProcess_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicDocumentIssue" ADD CONSTRAINT "AcademicDocumentIssue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
