-- AlterTable
ALTER TABLE "AssetMaintenance" ADD COLUMN     "fleetPreviousStatus" TEXT;

-- AlterTable
ALTER TABLE "FleetUnit" ADD COLUMN     "operationalStatus" TEXT NOT NULL DEFAULT 'ATIVO',
ADD COLUMN     "patrimonyStatus" TEXT,
ALTER COLUMN "departmentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FleetWorkOrder" ADD COLUMN     "assetMaintenanceId" TEXT;

-- AlterTable
ALTER TABLE "FleetConsumption" ADD COLUMN     "stockMovementId" TEXT;

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

-- CreateIndex
CREATE INDEX "FleetAssetEvent_unitId_createdAt_id_idx" ON "FleetAssetEvent"("unitId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FleetWorkOrder_assetMaintenanceId_key" ON "FleetWorkOrder"("assetMaintenanceId");

-- CreateIndex
CREATE UNIQUE INDEX "FleetConsumption_stockMovementId_key" ON "FleetConsumption"("stockMovementId");

-- AddForeignKey
ALTER TABLE "FleetUnit" ADD CONSTRAINT "FleetUnit_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetWorkOrder" ADD CONSTRAINT "FleetWorkOrder_assetMaintenanceId_fkey" FOREIGN KEY ("assetMaintenanceId") REFERENCES "AssetMaintenance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetConsumption" ADD CONSTRAINT "FleetConsumption_stockMovementId_fkey" FOREIGN KEY ("stockMovementId") REFERENCES "MaterialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetAssetEvent" ADD CONSTRAINT "FleetAssetEvent_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FleetUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve local availability; status/department/responsible become projections for linked assets.
UPDATE "FleetUnit" SET "operationalStatus" = "status";

CREATE FUNCTION fleet_unit_projection() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a "Asset"%ROWTYPE;
BEGIN
  IF NEW."assetId" IS NOT NULL THEN
    SELECT * INTO STRICT a FROM "Asset" WHERE "id" = NEW."assetId";
    NEW."departmentId" := a."departmentId";
    NEW."responsibleId" := a."responsibleId";
    NEW."patrimonyStatus" := a."status";
  ELSE
    NEW."patrimonyStatus" := NULL;
  END IF;
  NEW."status" := CASE
    WHEN NEW."patrimonyStatus" = 'Baixado' OR NEW."departmentId" IS NULL THEN 'INATIVO'
    WHEN NEW."patrimonyStatus" = 'Em manutenção' OR EXISTS (SELECT 1 FROM "FleetWorkOrder" WHERE "unitId" = NEW."id" AND "status" = 'EM_EXECUCAO') THEN 'EM_MANUTENCAO'
    ELSE NEW."operationalStatus" END;
  IF NEW."parentId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "FleetUnit" WHERE "id" = NEW."parentId" AND "departmentId" IS NOT DISTINCT FROM NEW."departmentId") THEN
    NEW."parentId" := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fleet_unit_projection BEFORE INSERT OR UPDATE ON "FleetUnit" FOR EACH ROW EXECUTE FUNCTION fleet_unit_projection();

CREATE FUNCTION fleet_asset_changed() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(OLD."departmentId", OLD."responsibleId", OLD."status") IS DISTINCT FROM ROW(NEW."departmentId", NEW."responsibleId", NEW."status") THEN
    INSERT INTO "FleetAssetEvent" ("id", "unitId", "assetId", "type", "fromDepartmentId", "toDepartmentId", "fromResponsibleId", "toResponsibleId", "fromStatus", "toStatus")
    SELECT md5(random()::text || clock_timestamp()::text || u."id"), u."id", NEW."id", 'PATRIMONIO_ALTERADO', OLD."departmentId", NEW."departmentId", OLD."responsibleId", NEW."responsibleId", OLD."status", NEW."status"
    FROM "FleetUnit" u WHERE u."assetId" = NEW."id";
    UPDATE "FleetUnit" SET "updatedAt" = clock_timestamp() WHERE "assetId" = NEW."id";
    -- A transfer never carries an unrelated aggregate silently into another department.
    UPDATE "FleetUnit" child SET "parentId" = NULL, "updatedAt" = clock_timestamp()
    FROM "FleetUnit" parent WHERE child."parentId" = parent."id" AND parent."assetId" = NEW."id" AND child."departmentId" IS DISTINCT FROM NEW."departmentId";
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fleet_asset_changed AFTER UPDATE OF "departmentId", "responsibleId", "status" ON "Asset" FOR EACH ROW EXECUTE FUNCTION fleet_asset_changed();

CREATE FUNCTION fleet_import_asset_maintenance(maintenance_id text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE m "AssetMaintenance"%ROWTYPE; u "FleetUnit"%ROWTYPE; order_id text;
BEGIN
  SELECT * INTO m FROM "AssetMaintenance" WHERE "id" = maintenance_id;
  SELECT * INTO u FROM "FleetUnit" WHERE "assetId" = m."assetId";
  IF u."id" IS NULL OR m."status" <> 'Concluída' OR m."endDate" IS NULL THEN RETURN; END IF;
  SELECT "id" INTO order_id FROM "FleetWorkOrder" WHERE "assetMaintenanceId" = m."id";
  INSERT INTO "FleetExpense" ("id", "unitId", "nature", "occurredAt", "amount", "description", "sourceType", "sourceId", "sourceKey", "reference", "createdById")
  VALUES (md5(random()::text || clock_timestamp()::text), u."id", 'MANUTENCAO', m."endDate"::date, round(m."cost"::numeric, 2), m."description", CASE WHEN order_id IS NULL THEN 'PATRIMONIO' ELSE 'OS' END, coalesce(order_id, m."id"), 'asset-maintenance:' || m."id", 'Manutenção patrimonial ' || m."id", u."createdById")
  ON CONFLICT ("sourceKey") DO UPDATE SET "amount" = EXCLUDED."amount", "occurredAt" = EXCLUDED."occurredAt", "description" = EXCLUDED."description", "sourceType" = EXCLUDED."sourceType", "sourceId" = EXCLUDED."sourceId";
END $$;

CREATE FUNCTION fleet_asset_maintenance_changed() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" = 'Em manutenção' AND NEW."fleetPreviousStatus" IS NULL THEN
    NEW."fleetPreviousStatus" := coalesce((SELECT "fleetPreviousStatus" FROM "AssetMaintenance" WHERE "assetId" = NEW."assetId" AND "status" = 'Em manutenção' AND "fleetPreviousStatus" IS NOT NULL ORDER BY "createdAt" LIMIT 1), (SELECT "status" FROM "Asset" WHERE "id" = NEW."assetId"));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fleet_asset_maintenance_before BEFORE INSERT OR UPDATE ON "AssetMaintenance" FOR EACH ROW EXECUTE FUNCTION fleet_asset_maintenance_changed();

CREATE FUNCTION fleet_asset_maintenance_after() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" = 'Concluída' AND NEW."endDate" IS NOT NULL THEN
    UPDATE "FleetWorkOrder" SET "status" = 'CONCLUIDA', "completedAt" = NEW."endDate"::date, "performed" = NEW."description", "result" = 'Concluída em Patrimônio', "actualCost" = round(NEW."cost"::numeric, 2), "updatedAt" = clock_timestamp()
    WHERE "assetMaintenanceId" = NEW."id" AND "status" <> 'CONCLUIDA';
    UPDATE "FleetPlan" p SET "nextDueAt" = o."scheduledAt" + o."intervalDays", "updatedAt" = clock_timestamp()
    FROM "FleetWorkOrder" o WHERE o."assetMaintenanceId" = NEW."id" AND p."id" = o."planId" AND p."nextDueAt" <= o."scheduledAt";
  END IF;
  PERFORM fleet_import_asset_maintenance(NEW."id");
  IF NEW."status" = 'Em manutenção' THEN
    UPDATE "Asset" SET "status" = 'Em manutenção', "updatedAt" = clock_timestamp() WHERE "id" = NEW."assetId" AND "status" <> 'Baixado' AND "status" <> 'Em manutenção';
  ELSIF TG_OP = 'UPDATE' AND OLD."status" = 'Em manutenção' AND NOT EXISTS (SELECT 1 FROM "AssetMaintenance" WHERE "assetId" = NEW."assetId" AND "status" = 'Em manutenção') THEN
    UPDATE "Asset" SET "status" = coalesce(nullif(NEW."fleetPreviousStatus", 'Em manutenção'), 'Ativo'), "updatedAt" = clock_timestamp() WHERE "id" = NEW."assetId" AND "status" = 'Em manutenção';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fleet_asset_maintenance_after AFTER INSERT OR UPDATE ON "AssetMaintenance" FOR EACH ROW EXECUTE FUNCTION fleet_asset_maintenance_after();

CREATE FUNCTION fleet_unit_linked() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."assetId" IS NOT NULL THEN
    PERFORM fleet_import_asset_maintenance("id") FROM "AssetMaintenance" WHERE "assetId" = NEW."assetId" AND "status" = 'Concluída';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fleet_unit_linked AFTER INSERT OR UPDATE OF "assetId" ON "FleetUnit" FOR EACH ROW EXECUTE FUNCTION fleet_unit_linked();

CREATE FUNCTION fleet_order_changed() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE "FleetUnit" SET "updatedAt" = clock_timestamp() WHERE "id" = NEW."unitId";
  RETURN NEW;
END $$;
CREATE TRIGGER fleet_order_changed AFTER INSERT OR UPDATE ON "FleetWorkOrder" FOR EACH ROW EXECUTE FUNCTION fleet_order_changed();

CREATE FUNCTION fleet_asset_writeoff_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" = 'Baixado' AND OLD."status" <> 'Baixado' AND EXISTS (SELECT 1 FROM "AssetMaintenance" WHERE "assetId" = NEW."id" AND "status" IN ('Solicitada', 'Em manutenção')) THEN
    RAISE EXCEPTION 'Conclua as manutenções abertas antes da baixa patrimonial.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fleet_asset_writeoff_guard BEFORE UPDATE OF "status" ON "Asset" FOR EACH ROW EXECUTE FUNCTION fleet_asset_writeoff_guard();

UPDATE "FleetUnit" SET "updatedAt" = clock_timestamp();
SELECT fleet_import_asset_maintenance("id") FROM "AssetMaintenance" WHERE "status" = 'Concluída';

