-- Pre-service movements have no batch evidence. Do not retain an arbitrary
-- stock link when a warehouse/material currently has more than one batch.
UPDATE "MaterialMovement" AS movement
SET "stockId" = NULL
WHERE movement."actorUsuarioId" IS NULL
  AND movement."stockId" IS NOT NULL
  AND (
    SELECT count(*)
    FROM "MaterialStock" AS stock
    WHERE stock."warehouseId" = movement."warehouseId"
      AND stock."materialId" = movement."materialId"
  ) > 1;
