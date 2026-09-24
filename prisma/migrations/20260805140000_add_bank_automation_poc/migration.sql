-- Estruturas de automacao bancaria, classificacao e conciliacao da POC.
-- A baseline historica nao continha estes objetos apesar de eles ja existirem
-- no schema Prisma, portanto esta migracao tambem corrige o drift da base.

CREATE TABLE IF NOT EXISTS "AutomatedBankDownload" (
  "id" TEXT NOT NULL,
  "banco" TEXT NOT NULL,
  "agencia" TEXT NOT NULL,
  "contaNumero" TEXT NOT NULL,
  "tipoConta" TEXT NOT NULL,
  "periodoInicio" TIMESTAMP(3) NOT NULL,
  "periodoFim" TIMESTAMP(3) NOT NULL,
  "nomeArquivo" TEXT NOT NULL,
  "caminhoDestino" TEXT NOT NULL,
  "formato" TEXT NOT NULL,
  "hashSHA256" TEXT NOT NULL,
  "tamanhoBytes" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CONCLUIDO',
  "logsExecucao" TEXT NOT NULL,
  "auditLogId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomatedBankDownload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ClassificationRule" (
  "id" TEXT NOT NULL,
  "bancoCodigo" TEXT,
  "textoProcurado" TEXT NOT NULL,
  "codigoTransacao" TEXT,
  "sinalEsperado" TEXT,
  "tipoMovimento" TEXT NOT NULL,
  "bancoContaFiltro" TEXT,
  "tipoReceita" TEXT,
  "naturezaReceita" TEXT,
  "fonteRecurso" TEXT,
  "eventoContabil" TEXT,
  "deducaoAplicavel" BOOLEAN NOT NULL DEFAULT false,
  "prioridade" INTEGER NOT NULL DEFAULT 10,
  "exigeConfirmacao" BOOLEAN NOT NULL DEFAULT false,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassificationRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "YieldTransaction" (
  "id" TEXT NOT NULL,
  "statementItemId" TEXT,
  "contaNumero" TEXT NOT NULL,
  "data" TIMESTAMP(3) NOT NULL,
  "valorBrutoDecimal" DECIMAL(18,2) NOT NULL,
  "irrfDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "iofDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "correcaoDecimal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "valorLiquidoDecimal" DECIMAL(18,2) NOT NULL,
  "saldoAcumuladoDecimal" DECIMAL(18,2),
  "tipoRendimento" TEXT NOT NULL,
  "reciboMunicipal" TEXT,
  "lancamentoContabilId" TEXT,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "YieldTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExceptionQueueItem" (
  "id" TEXT NOT NULL,
  "statementItemId" TEXT,
  "descricao" TEXT NOT NULL,
  "valorDecimal" DECIMAL(18,2) NOT NULL,
  "dataMovimento" TIMESTAMP(3) NOT NULL,
  "banco" TEXT NOT NULL,
  "contaNumero" TEXT NOT NULL,
  "sinal" TEXT NOT NULL,
  "scoreConfianca" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sugestaoTipo" TEXT,
  "motivoExcecao" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "resolvidoPor" TEXT,
  "resolvidoEm" TIMESTAMP(3),
  "regraGeradaId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExceptionQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BankReconciliationSession" (
  "id" TEXT NOT NULL,
  "banco" TEXT NOT NULL,
  "agencia" TEXT NOT NULL,
  "contaNumero" TEXT NOT NULL,
  "periodo" TEXT NOT NULL,
  "dataInicio" TIMESTAMP(3) NOT NULL,
  "dataFim" TIMESTAMP(3) NOT NULL,
  "saldoInicialDecimal" DECIMAL(18,2) NOT NULL,
  "totalDebitosDecimal" DECIMAL(18,2) NOT NULL,
  "totalCreditosDecimal" DECIMAL(18,2) NOT NULL,
  "saldoFinalDecimal" DECIMAL(18,2) NOT NULL,
  "saldoRazaoDecimal" DECIMAL(18,2) NOT NULL,
  "diferencaDecimal" DECIMAL(18,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ABERTA',
  "totalItensBanco" INTEGER NOT NULL DEFAULT 0,
  "totalItensContabeis" INTEGER NOT NULL DEFAULT 0,
  "itensConciliados" INTEGER NOT NULL DEFAULT 0,
  "itensDivergentes" INTEGER NOT NULL DEFAULT 0,
  "confirmadoPor" TEXT,
  "confirmadoEm" TIMESTAMP(3),
  "reciboIntegracao" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankReconciliationSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BankReconciliationMatch" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "statementItemId" TEXT,
  "treasuryMovementId" TEXT,
  "tipoMatch" TEXT NOT NULL,
  "percentualConfianca" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "observacao" TEXT,
  "status" TEXT NOT NULL DEFAULT 'AUTOMATICO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BankReconciliationMatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BankStatementItem"
  ALTER COLUMN "statementImportId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "downloadId" TEXT,
  ADD COLUMN IF NOT EXISTS "banco" TEXT,
  ADD COLUMN IF NOT EXISTS "agencia" TEXT,
  ADD COLUMN IF NOT EXISTS "contaNumero" TEXT,
  ADD COLUMN IF NOT EXISTS "tipoConta" TEXT,
  ADD COLUMN IF NOT EXISTS "codigoTransacao" TEXT,
  ADD COLUMN IF NOT EXISTS "sinal" TEXT,
  ADD COLUMN IF NOT EXISTS "saldoResultanteDecimal" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "categoriaClassificada" TEXT,
  ADD COLUMN IF NOT EXISTS "reciboMunicipal" TEXT,
  ADD COLUMN IF NOT EXISTS "lancamentoContabilId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "AutomatedBankDownload_account_hash_key"
  ON "AutomatedBankDownload" ("banco", "agencia", "contaNumero", "hashSHA256");
CREATE INDEX IF NOT EXISTS "AutomatedBankDownload_account_createdAt_idx"
  ON "AutomatedBankDownload" ("banco", "agencia", "contaNumero", "createdAt");
CREATE INDEX IF NOT EXISTS "ClassificationRule_active_priority_idx"
  ON "ClassificationRule" ("ativo", "prioridade");
CREATE UNIQUE INDEX IF NOT EXISTS "YieldTransaction_idempotencyKey_key"
  ON "YieldTransaction" ("idempotencyKey");
CREATE INDEX IF NOT EXISTS "YieldTransaction_account_date_idx"
  ON "YieldTransaction" ("contaNumero", "data");
CREATE INDEX IF NOT EXISTS "ExceptionQueueItem_status_createdAt_idx"
  ON "ExceptionQueueItem" ("status", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "BankReconciliationSession_account_period_key"
  ON "BankReconciliationSession" ("banco", "agencia", "contaNumero", "periodo");
CREATE INDEX IF NOT EXISTS "BankReconciliationMatch_sessionId_idx"
  ON "BankReconciliationMatch" ("sessionId");
CREATE INDEX IF NOT EXISTS "BankStatementItem_downloadId_idx"
  ON "BankStatementItem" ("downloadId");
CREATE INDEX IF NOT EXISTS "BankStatementItem_account_date_idx"
  ON "BankStatementItem" ("contaNumero", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "BankStatementItem_account_externalTransaction_key"
  ON "BankStatementItem" ("banco", "agencia", "contaNumero", "codigoTransacao");
