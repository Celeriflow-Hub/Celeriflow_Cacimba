CREATE OR REPLACE FUNCTION fleet_unit_projection() RETURNS trigger LANGUAGE plpgsql AS $$
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
    WHEN NEW."patrimonyStatus" IN ('Baixado', 'Inativo') OR NEW."departmentId" IS NULL THEN 'INATIVO'
    WHEN NEW."patrimonyStatus" = 'Em manutenção' OR EXISTS (SELECT 1 FROM "FleetWorkOrder" WHERE "unitId" = NEW."id" AND "status" = 'EM_EXECUCAO') THEN 'EM_MANUTENCAO'
    ELSE NEW."operationalStatus"
  END;
  IF NEW."parentId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "FleetUnit" WHERE "id" = NEW."parentId" AND "departmentId" IS NOT DISTINCT FROM NEW."departmentId") THEN
    NEW."parentId" := NULL;
  END IF;
  RETURN NEW;
END $$;
