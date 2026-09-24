-- Health administration references and links are additive so existing clinical records remain untouched.
ALTER TABLE "HealthUnit"
  ADD COLUMN "inactivatedAt" TIMESTAMP(3),
  ADD COLUMN "inactivationReason" TEXT;

ALTER TABLE "HealthProfessional"
  ADD COLUMN "cns" TEXT,
  ADD COLUMN "treatment" TEXT,
  ADD COLUMN "isAuditor" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consultationIntervalMinutes" INTEGER,
  ADD COLUMN "inactivatedAt" TIMESTAMP(3),
  ADD COLUMN "inactivationReason" TEXT;

CREATE INDEX "HealthProfessional_cns_idx" ON "HealthProfessional"("cns");

CREATE TABLE "HealthCbo" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HealthCbo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthCbo_code_key" ON "HealthCbo"("code");
CREATE INDEX "HealthCbo_isActive_description_idx" ON "HealthCbo"("isActive", "description");

CREATE TABLE "HealthSpecialty" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HealthSpecialty_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthSpecialty_code_key" ON "HealthSpecialty"("code");
CREATE UNIQUE INDEX "HealthSpecialty_name_key" ON "HealthSpecialty"("name");
CREATE INDEX "HealthSpecialty_isActive_name_idx" ON "HealthSpecialty"("isActive", "name");

CREATE TABLE "HealthSpecialtyGroup" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HealthSpecialtyGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthSpecialtyGroup_name_key" ON "HealthSpecialtyGroup"("name");
CREATE INDEX "HealthSpecialtyGroup_isActive_name_idx" ON "HealthSpecialtyGroup"("isActive", "name");

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

CREATE UNIQUE INDEX "HealthService_code_key" ON "HealthService"("code");
CREATE INDEX "HealthService_isActive_name_idx" ON "HealthService"("isActive", "name");

CREATE TABLE "HealthSpecialtyGroupMember" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "specialtyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HealthSpecialtyGroupMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthSpecialtyGroupMember_groupId_specialtyId_key" ON "HealthSpecialtyGroupMember"("groupId", "specialtyId");
CREATE INDEX "HealthSpecialtyGroupMember_specialtyId_idx" ON "HealthSpecialtyGroupMember"("specialtyId");

CREATE TABLE "HealthSpecialtyGroupService" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HealthSpecialtyGroupService_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthSpecialtyGroupService_groupId_serviceId_key" ON "HealthSpecialtyGroupService"("groupId", "serviceId");
CREATE INDEX "HealthSpecialtyGroupService_serviceId_idx" ON "HealthSpecialtyGroupService"("serviceId");

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

CREATE UNIQUE INDEX "HealthUnitShift_unitId_dayOfWeek_startTime_endTime_key" ON "HealthUnitShift"("unitId", "dayOfWeek", "startTime", "endTime");
CREATE INDEX "HealthUnitShift_unitId_isActive_idx" ON "HealthUnitShift"("unitId", "isActive");

CREATE TABLE "HealthUnitSpecialty" (
  "id" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "specialtyId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HealthUnitSpecialty_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthUnitSpecialty_unitId_specialtyId_key" ON "HealthUnitSpecialty"("unitId", "specialtyId");
CREATE INDEX "HealthUnitSpecialty_specialtyId_isActive_idx" ON "HealthUnitSpecialty"("specialtyId", "isActive");

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

CREATE UNIQUE INDEX "HealthProfessionalAssignment_professionalId_unitId_specialtyId_key" ON "HealthProfessionalAssignment"("professionalId", "unitId", "specialtyId");
CREATE INDEX "HealthProfessionalAssignment_unitId_isActive_idx" ON "HealthProfessionalAssignment"("unitId", "isActive");
CREATE INDEX "HealthProfessionalAssignment_specialtyId_isActive_idx" ON "HealthProfessionalAssignment"("specialtyId", "isActive");

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

CREATE UNIQUE INDEX "HealthServiceAssignment_serviceId_unitId_key" ON "HealthServiceAssignment"("serviceId", "unitId");
CREATE UNIQUE INDEX "HealthServiceAssignment_serviceId_professionalId_key" ON "HealthServiceAssignment"("serviceId", "professionalId");
CREATE INDEX "HealthServiceAssignment_unitId_isActive_idx" ON "HealthServiceAssignment"("unitId", "isActive");
CREATE INDEX "HealthServiceAssignment_professionalId_isActive_idx" ON "HealthServiceAssignment"("professionalId", "isActive");

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

CREATE UNIQUE INDEX "HealthHabilitation_code_unitId_key" ON "HealthHabilitation"("code", "unitId");
CREATE UNIQUE INDEX "HealthHabilitation_code_professionalId_key" ON "HealthHabilitation"("code", "professionalId");
CREATE INDEX "HealthHabilitation_unitId_isActive_idx" ON "HealthHabilitation"("unitId", "isActive");
CREATE INDEX "HealthHabilitation_professionalId_isActive_idx" ON "HealthHabilitation"("professionalId", "isActive");

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

CREATE UNIQUE INDEX "HealthSchedulingGroup_name_unitId_key" ON "HealthSchedulingGroup"("name", "unitId");
CREATE INDEX "HealthSchedulingGroup_specialtyGroupId_isActive_idx" ON "HealthSchedulingGroup"("specialtyGroupId", "isActive");

CREATE TABLE "HealthRegistrationStatusHistory" (
  "id" TEXT NOT NULL,
  "unitId" TEXT,
  "professionalId" TEXT,
  "isActive" BOOLEAN NOT NULL,
  "reason" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HealthRegistrationStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HealthRegistrationStatusHistory_unitId_occurredAt_idx" ON "HealthRegistrationStatusHistory"("unitId", "occurredAt");
CREATE INDEX "HealthRegistrationStatusHistory_professionalId_occurredAt_idx" ON "HealthRegistrationStatusHistory"("professionalId", "occurredAt");

ALTER TABLE "HealthSpecialtyGroupMember" ADD CONSTRAINT "HealthSpecialtyGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "HealthSpecialtyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthSpecialtyGroupMember" ADD CONSTRAINT "HealthSpecialtyGroupMember_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthSpecialtyGroupService" ADD CONSTRAINT "HealthSpecialtyGroupService_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "HealthSpecialtyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthSpecialtyGroupService" ADD CONSTRAINT "HealthSpecialtyGroupService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthUnitShift" ADD CONSTRAINT "HealthUnitShift_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthUnitSpecialty" ADD CONSTRAINT "HealthUnitSpecialty_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthUnitSpecialty" ADD CONSTRAINT "HealthUnitSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthProfessionalAssignment" ADD CONSTRAINT "HealthProfessionalAssignment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthProfessionalAssignment" ADD CONSTRAINT "HealthProfessionalAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthProfessionalAssignment" ADD CONSTRAINT "HealthProfessionalAssignment_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "HealthSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthServiceAssignment" ADD CONSTRAINT "HealthServiceAssignment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthServiceAssignment" ADD CONSTRAINT "HealthServiceAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthServiceAssignment" ADD CONSTRAINT "HealthServiceAssignment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthHabilitation" ADD CONSTRAINT "HealthHabilitation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthHabilitation" ADD CONSTRAINT "HealthHabilitation_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthSchedulingGroup" ADD CONSTRAINT "HealthSchedulingGroup_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthSchedulingGroup" ADD CONSTRAINT "HealthSchedulingGroup_specialtyGroupId_fkey" FOREIGN KEY ("specialtyGroupId") REFERENCES "HealthSpecialtyGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HealthRegistrationStatusHistory" ADD CONSTRAINT "HealthRegistrationStatusHistory_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthRegistrationStatusHistory" ADD CONSTRAINT "HealthRegistrationStatusHistory_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "HealthProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
