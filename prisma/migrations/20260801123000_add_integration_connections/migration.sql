CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'MOCK',
    "status" TEXT NOT NULL DEFAULT 'CONFIGURANDO',
    "baseUrl" TEXT,
    "credentialReference" TEXT,
    "configuration" JSONB,
    "mockScenario" JSONB,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "lastTestMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationRun" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "externalId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationConnection_code_key" ON "IntegrationConnection"("code");
CREATE INDEX "IntegrationConnection_category_environment_status_idx" ON "IntegrationConnection"("category", "environment", "status");
CREATE INDEX "IntegrationRun_connectionId_createdAt_idx" ON "IntegrationRun"("connectionId", "createdAt");

ALTER TABLE "IntegrationRun" ADD CONSTRAINT "IntegrationRun_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
