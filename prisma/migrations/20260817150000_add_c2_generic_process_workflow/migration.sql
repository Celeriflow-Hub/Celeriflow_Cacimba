-- C2-004 is additive and disabled by default. No legacy process is enrolled.
ALTER TABLE "ProcessType" ADD COLUMN "genericWorkflowEnabled" BOOLEAN NOT NULL DEFAULT false;

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

CREATE UNIQUE INDEX "GenericProcessWorkflowDefinition_processTypeId_version_key" ON "GenericProcessWorkflowDefinition"("processTypeId", "version");
CREATE INDEX "GenericProcessWorkflowDefinition_processTypeId_status_idx" ON "GenericProcessWorkflowDefinition"("processTypeId", "status");
CREATE UNIQUE INDEX "GenericProcessWorkflowStage_definitionId_position_key" ON "GenericProcessWorkflowStage"("definitionId", "position");
CREATE INDEX "GenericProcessWorkflowStage_definitionId_position_idx" ON "GenericProcessWorkflowStage"("definitionId", "position");
CREATE UNIQUE INDEX "GenericProcessWorkflowInstance_processId_key" ON "GenericProcessWorkflowInstance"("processId");
CREATE INDEX "GenericProcessWorkflowInstance_definitionId_idx" ON "GenericProcessWorkflowInstance"("definitionId");
CREATE INDEX "GenericProcessWorkflowInstance_status_dueAt_idx" ON "GenericProcessWorkflowInstance"("status", "dueAt");
CREATE INDEX "GenericProcessWorkflowEvent_instanceId_createdAt_idx" ON "GenericProcessWorkflowEvent"("instanceId", "createdAt");

ALTER TABLE "GenericProcessWorkflowDefinition" ADD CONSTRAINT "GenericProcessWorkflowDefinition_processTypeId_fkey" FOREIGN KEY ("processTypeId") REFERENCES "ProcessType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GenericProcessWorkflowDefinition" ADD CONSTRAINT "GenericProcessWorkflowDefinition_publishedByUsuarioId_fkey" FOREIGN KEY ("publishedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GenericProcessWorkflowStage" ADD CONSTRAINT "GenericProcessWorkflowStage_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "GenericProcessWorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GenericProcessWorkflowStage" ADD CONSTRAINT "GenericProcessWorkflowStage_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GenericProcessWorkflowStage" ADD CONSTRAINT "GenericProcessWorkflowStage_requiredDocumentClassId_fkey" FOREIGN KEY ("requiredDocumentClassId") REFERENCES "DocumentClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GenericProcessWorkflowInstance" ADD CONSTRAINT "GenericProcessWorkflowInstance_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GenericProcessWorkflowInstance" ADD CONSTRAINT "GenericProcessWorkflowInstance_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "GenericProcessWorkflowDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GenericProcessWorkflowInstance" ADD CONSTRAINT "GenericProcessWorkflowInstance_openedByUsuarioId_fkey" FOREIGN KEY ("openedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GenericProcessWorkflowEvent" ADD CONSTRAINT "GenericProcessWorkflowEvent_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "GenericProcessWorkflowInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GenericProcessWorkflowEvent" ADD CONSTRAINT "GenericProcessWorkflowEvent_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GenericProcessWorkflowDefinition" ADD CONSTRAINT "GenericProcessWorkflowDefinition_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED'));
ALTER TABLE "GenericProcessWorkflowStage" ADD CONSTRAINT "GenericProcessWorkflowStage_position_check" CHECK ("position" > 0), ADD CONSTRAINT "GenericProcessWorkflowStage_slaCalendarDays_check" CHECK ("slaCalendarDays" > 0), ADD CONSTRAINT "GenericProcessWorkflowStage_requiredDocument_check" CHECK (NOT "requiresSignedDocument" OR "requiredDocumentClassId" IS NOT NULL);
ALTER TABLE "GenericProcessWorkflowInstance" ADD CONSTRAINT "GenericProcessWorkflowInstance_status_check" CHECK ("status" IN ('ACTIVE', 'REJECTED', 'CONCLUDED')), ADD CONSTRAINT "GenericProcessWorkflowInstance_currentPosition_check" CHECK ("currentPosition" > 0);

-- A publication is a one-way state transition. Published definitions and their stages are immutable.
CREATE OR REPLACE FUNCTION protect_generic_process_workflow_definition() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.status = 'PUBLISHED' THEN RAISE EXCEPTION 'Published generic process workflow definitions cannot be deleted'; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'PUBLISHED' THEN RAISE EXCEPTION 'Published generic process workflow definitions are immutable'; END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'PUBLISHED' AND (NEW."publishedAt" IS NULL OR NEW."publishedByUsuarioId" IS NULL) THEN RAISE EXCEPTION 'Published generic process workflow definitions require publication evidence'; END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "GenericProcessWorkflowDefinition_protect_published" BEFORE UPDATE OR DELETE ON "GenericProcessWorkflowDefinition" FOR EACH ROW EXECUTE FUNCTION protect_generic_process_workflow_definition();

CREATE OR REPLACE FUNCTION protect_generic_process_workflow_stage() RETURNS TRIGGER AS $$
DECLARE definition_status TEXT;
BEGIN
  SELECT status INTO definition_status FROM "GenericProcessWorkflowDefinition" WHERE id = COALESCE(NEW."definitionId", OLD."definitionId");
  IF definition_status = 'PUBLISHED' THEN RAISE EXCEPTION 'Published generic process workflow stages are immutable'; END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "GenericProcessWorkflowStage_protect_published" BEFORE INSERT OR UPDATE OR DELETE ON "GenericProcessWorkflowStage" FOR EACH ROW EXECUTE FUNCTION protect_generic_process_workflow_stage();

-- Execution history is evidence and must never be rewritten or removed.
CREATE OR REPLACE FUNCTION prevent_generic_process_workflow_event_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Generic process workflow execution history is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "GenericProcessWorkflowEvent_append_only" BEFORE UPDATE OR DELETE ON "GenericProcessWorkflowEvent" FOR EACH ROW EXECUTE FUNCTION prevent_generic_process_workflow_event_mutation();
