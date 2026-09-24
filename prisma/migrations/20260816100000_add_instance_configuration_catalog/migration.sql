CREATE TABLE "ConfiguracaoParametroInstancia" (
    "id" TEXT NOT NULL,
    "configuracaoInstanciaId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoParametroInstancia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConfiguracaoParametroInstancia_configuracaoInstanciaId_chave_key" ON "ConfiguracaoParametroInstancia"("configuracaoInstanciaId", "chave");
CREATE INDEX "ConfiguracaoParametroInstancia_configuracaoInstanciaId_idx" ON "ConfiguracaoParametroInstancia"("configuracaoInstanciaId");

ALTER TABLE "ConfiguracaoParametroInstancia" ADD CONSTRAINT "ConfiguracaoParametroInstancia_configuracaoInstanciaId_fkey" FOREIGN KEY ("configuracaoInstanciaId") REFERENCES "ConfiguracaoInstancia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
