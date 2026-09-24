-- AlterTable
ALTER TABLE "ClassDiary" ADD COLUMN     "lessonCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "reopenedAt" TIMESTAMP(3),
ADD COLUMN     "stage" TEXT NOT NULL DEFAULT '1º Bimestre';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "absenceGroup" TEXT;

-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "absent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "assessmentId" TEXT,
ADD COLUMN     "classId" TEXT,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "recoveryValue" DOUBLE PRECISION;

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
CREATE INDEX "ClassDiary_classId_subjectId_date_idx" ON "ClassDiary"("classId", "subjectId", "date");

-- CreateIndex
CREATE INDEX "ClassDiary_teacherId_status_idx" ON "ClassDiary"("teacherId", "status");

-- CreateIndex
CREATE INDEX "Grade_classId_period_idx" ON "Grade"("classId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_assessmentId_studentId_key" ON "Grade"("assessmentId", "studentId");

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "EducationAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
