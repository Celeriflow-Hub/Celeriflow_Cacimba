-- The self-service portal has its own access boundary and never grants RH.
INSERT INTO "ConfiguracaoModulo" ("id", "nome", "codigo", "ativo", "dataAtivacao", "createdAt", "updatedAt")
VALUES (
  'celeriflow-module-portal-servidor',
  'Portal do Servidor',
  'PORTAL_SERVIDOR',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("codigo") DO UPDATE
SET "nome" = EXCLUDED."nome";
