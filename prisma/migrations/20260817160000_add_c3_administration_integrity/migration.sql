-- C3 administration is additive. This migration is intentionally not applied by the codebase.
ALTER TABLE "AdministrativeUnit" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "ConfiguracaoPerfil" ADD COLUMN "codigo" TEXT;
UPDATE "ConfiguracaoPerfil" SET "codigo" = 'LEGACY_' || "id" WHERE "codigo" IS NULL;
UPDATE "ConfiguracaoPerfil" SET "codigo" = 'SYSTEM_ADMINISTRATOR' WHERE "nome" = 'Administrador';
ALTER TABLE "ConfiguracaoPerfil" ALTER COLUMN "codigo" SET NOT NULL;
CREATE UNIQUE INDEX "ConfiguracaoPerfil_codigo_key" ON "ConfiguracaoPerfil"("codigo");

ALTER TABLE "Usuario" ADD COLUMN "firebaseUid" TEXT;
CREATE UNIQUE INDEX "Usuario_firebaseUid_key" ON "Usuario"("firebaseUid");
ALTER TABLE "Usuario" ALTER COLUMN "senha" SET DEFAULT 'LEGACY_CREDENTIAL_DISABLED';
