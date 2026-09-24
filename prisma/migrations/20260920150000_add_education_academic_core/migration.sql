-- EDU-S1: academic periods, curricula, assignments, enrollment history, schedules and Educacenso operations.
ALTER TABLE "SchoolClass"
  ADD COLUMN "classType" TEXT NOT NULL DEFAULT 'Regular',
  ADD COLUMN "groupingType" TEXT NOT NULL DEFAULT 'Disciplina',
  ADD COLUMN "enrollmentOrder" TEXT NOT NULL DEFAULT 'Nome',
  ADD COLUMN "annualWorkload" INTEGER,
  ADD COLUMN "annualLessons" INTEGER,
  ADD COLUMN "lessonMinutes" INTEGER,
  ADD COLUMN "periodId" TEXT,
  ADD COLUMN "matrixId" TEXT;

ALTER TABLE "Enrollment"
  ADD COLUMN "endDate" TIMESTAMP(3),
  ADD COLUMN "supportCode" TEXT,
  ADD COLUMN "details" JSONB,
  ADD COLUMN "periodId" TEXT;

ALTER TABLE "SchoolCalendarEvent"
  ADD COLUMN "isSchoolDay" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "periodId" TEXT;

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

CREATE UNIQUE INDEX "AcademicPeriod_schoolId_code_key" ON "AcademicPeriod"("schoolId", "code");
CREATE INDEX "AcademicPeriod_schoolId_year_status_idx" ON "AcademicPeriod"("schoolId", "year", "status");
CREATE UNIQUE INDEX "CurriculumMatrix_schoolId_periodId_name_version_key" ON "CurriculumMatrix"("schoolId", "periodId", "name", "version");
CREATE INDEX "CurriculumMatrix_periodId_status_idx" ON "CurriculumMatrix"("periodId", "status");
CREATE UNIQUE INDEX "CurriculumMatrixSubject_matrixId_subjectId_key" ON "CurriculumMatrixSubject"("matrixId", "subjectId");
CREATE INDEX "CurriculumMatrixSubject_subjectId_idx" ON "CurriculumMatrixSubject"("subjectId");
CREATE UNIQUE INDEX "SchoolShift_schoolId_name_key" ON "SchoolShift"("schoolId", "name");
CREATE INDEX "SchoolShift_schoolId_isActive_idx" ON "SchoolShift"("schoolId", "isActive");
CREATE UNIQUE INDEX "TeacherClassAssignment_classId_teacherId_subjectId_startDate_key" ON "TeacherClassAssignment"("classId", "teacherId", "subjectId", "startDate");
CREATE INDEX "TeacherClassAssignment_teacherId_isActive_idx" ON "TeacherClassAssignment"("teacherId", "isActive");
CREATE INDEX "EnrollmentMovement_enrollmentId_effectiveDate_idx" ON "EnrollmentMovement"("enrollmentId", "effectiveDate");
CREATE INDEX "ClassScheduleBoard_classId_startDate_idx" ON "ClassScheduleBoard"("classId", "startDate");
CREATE UNIQUE INDEX "ClassScheduleEntry_boardId_weekday_lessonOrder_key" ON "ClassScheduleEntry"("boardId", "weekday", "lessonOrder");
CREATE INDEX "ClassScheduleEntry_teacherId_weekday_idx" ON "ClassScheduleEntry"("teacherId", "weekday");
CREATE INDEX "EducacensoOperation_operationType_createdAt_idx" ON "EducacensoOperation"("operationType", "createdAt");
CREATE INDEX "EducacensoOperation_competence_status_idx" ON "EducacensoOperation"("competence", "status");
CREATE INDEX "SchoolClass_schoolId_year_status_idx" ON "SchoolClass"("schoolId", "year", "status");
CREATE INDEX "SchoolClass_periodId_idx" ON "SchoolClass"("periodId");
CREATE INDEX "SchoolClass_matrixId_idx" ON "SchoolClass"("matrixId");
CREATE INDEX "Enrollment_studentId_year_status_idx" ON "Enrollment"("studentId", "year", "status");
CREATE INDEX "Enrollment_periodId_idx" ON "Enrollment"("periodId");
CREATE INDEX "SchoolCalendarEvent_periodId_date_idx" ON "SchoolCalendarEvent"("periodId", "date");

ALTER TABLE "AcademicPeriod" ADD CONSTRAINT "AcademicPeriod_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumMatrix" ADD CONSTRAINT "CurriculumMatrix_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumMatrix" ADD CONSTRAINT "CurriculumMatrix_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumMatrixSubject" ADD CONSTRAINT "CurriculumMatrixSubject_matrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "CurriculumMatrix"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumMatrixSubject" ADD CONSTRAINT "CurriculumMatrixSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolShift" ADD CONSTRAINT "SchoolShift_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EnrollmentMovement" ADD CONSTRAINT "EnrollmentMovement_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnrollmentMovement" ADD CONSTRAINT "EnrollmentMovement_sourceClassId_fkey" FOREIGN KEY ("sourceClassId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EnrollmentMovement" ADD CONSTRAINT "EnrollmentMovement_targetClassId_fkey" FOREIGN KEY ("targetClassId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClassScheduleBoard" ADD CONSTRAINT "ClassScheduleBoard_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassScheduleBoard" ADD CONSTRAINT "ClassScheduleBoard_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassScheduleEntry" ADD CONSTRAINT "ClassScheduleEntry_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ClassScheduleBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassScheduleEntry" ADD CONSTRAINT "ClassScheduleEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClassScheduleEntry" ADD CONSTRAINT "ClassScheduleEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_matrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "CurriculumMatrix"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SchoolCalendarEvent" ADD CONSTRAINT "SchoolCalendarEvent_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
