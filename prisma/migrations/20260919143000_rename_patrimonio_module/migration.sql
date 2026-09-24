-- Rename only the former default labels. Tenant-specific custom names remain untouched.
UPDATE "ConfiguracaoModulo"
SET "nome" = 'Almoxarifado e Patrimônio',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "codigo" = 'PATRIMONIO'
  AND "nome" IN (
    'Patrimônio e Almoxarifado',
    'Patrimônio, Almoxarifado & Estoque',
    'Patrimônio, Almoxarifado e Estoque'
  );
