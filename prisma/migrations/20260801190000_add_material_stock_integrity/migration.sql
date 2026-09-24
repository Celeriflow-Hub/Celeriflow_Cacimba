-- Empty batchNumber represents stock that is not batch-controlled. Consolidate
-- legacy duplicates before enforcing that a warehouse/material/batch has one row.
UPDATE "MaterialStock" SET "batchNumber" = '' WHERE "batchNumber" IS NULL;

DO $$
DECLARE
  duplicate RECORD;
  retained_id TEXT;
BEGIN
  FOR duplicate IN
    SELECT "warehouseId", "materialId", "batchNumber", array_agg("id" ORDER BY "createdAt", "id") AS ids
    FROM "MaterialStock"
    GROUP BY "warehouseId", "materialId", "batchNumber"
    HAVING count(*) > 1
  LOOP
    retained_id := duplicate.ids[1];

    UPDATE "MaterialStock"
    SET "quantity" = (
          SELECT COALESCE(sum("quantity"), 0)
          FROM "MaterialStock"
          WHERE "id" = ANY(duplicate.ids)
        ),
        "unitCost" = (
          SELECT CASE
            WHEN COALESCE(sum("quantity") FILTER (WHERE "unitCost" IS NOT NULL), 0) = 0 THEN max("unitCost")
            ELSE sum("quantity" * "unitCost") FILTER (WHERE "unitCost" IS NOT NULL)
              / sum("quantity") FILTER (WHERE "unitCost" IS NOT NULL)
          END
          FROM "MaterialStock"
          WHERE "id" = ANY(duplicate.ids)
        )
    WHERE "id" = retained_id;

    UPDATE "ObrasServicoMaterial"
    SET "stockId" = retained_id
    WHERE "stockId" = ANY(duplicate.ids);

    DELETE FROM "MaterialStock"
    WHERE "id" = ANY(duplicate.ids[2:]);
  END LOOP;
END $$;

ALTER TABLE "MaterialStock"
  ALTER COLUMN "batchNumber" SET DEFAULT '',
  ALTER COLUMN "batchNumber" SET NOT NULL;

ALTER TABLE "MaterialMovement"
  ADD COLUMN "stockId" TEXT,
  ADD COLUMN "actorUsuarioId" TEXT,
  ADD COLUMN "actorEmployeeId" TEXT;

UPDATE "MaterialMovement" AS movement
SET "stockId" = stock."id"
FROM "MaterialStock" AS stock
WHERE movement."stockId" IS NULL
  AND movement."warehouseId" = stock."warehouseId"
  AND movement."materialId" = stock."materialId";

CREATE UNIQUE INDEX "MaterialStock_warehouseId_materialId_batchNumber_key"
  ON "MaterialStock"("warehouseId", "materialId", "batchNumber");
CREATE INDEX "MaterialMovement_stockId_idx" ON "MaterialMovement"("stockId");
CREATE INDEX "MaterialMovement_actorUsuarioId_idx" ON "MaterialMovement"("actorUsuarioId");
CREATE INDEX "MaterialMovement_actorEmployeeId_idx" ON "MaterialMovement"("actorEmployeeId");

ALTER TABLE "MaterialMovement"
  ADD CONSTRAINT "MaterialMovement_stockId_fkey"
  FOREIGN KEY ("stockId") REFERENCES "MaterialStock"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "MaterialMovement_actorUsuarioId_fkey"
  FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "MaterialMovement_actorEmployeeId_fkey"
  FOREIGN KEY ("actorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
