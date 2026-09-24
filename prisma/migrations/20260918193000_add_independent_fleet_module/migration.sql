-- CreateTable
CREATE TABLE "FleetUnit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "plate" TEXT,
    "renavam" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "notes" TEXT,
    "departmentId" TEXT NOT NULL,
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
CREATE INDEX "FleetWorkOrder_unitId_status_scheduledAt_id_idx" ON "FleetWorkOrder"("unitId", "status", "scheduledAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FleetWorkOrder_planId_scheduledAt_key" ON "FleetWorkOrder"("planId", "scheduledAt");

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
ALTER TABLE "FleetConsumption" ADD CONSTRAINT "FleetConsumption_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetExpense" ADD CONSTRAINT "FleetExpense_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetDocument" ADD CONSTRAINT "FleetDocument_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetOccurrence" ADD CONSTRAINT "FleetOccurrence_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Registro do único módulo independente; permissões continuam sob gestão do núcleo.
INSERT INTO "ConfiguracaoModulo" ("id", "nome", "codigo", "ativo", "dataAtivacao", "createdAt", "updatedAt")
VALUES ('celeriflow-module-frotas', 'Frotas', 'FROTAS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("codigo") DO NOTHING;
