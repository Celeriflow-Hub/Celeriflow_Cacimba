ALTER TABLE "Person" ADD COLUMN "raceColor" TEXT;
ALTER TABLE "HealthUnit" ADD COLUMN "isThirdParty" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "HealthUserAccessScope" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "validFrom" TEXT,
    "validUntil" TEXT,
    "weekdays" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthUserAccessScope_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthUserAccessScope_usuarioId_unitId_key" ON "HealthUserAccessScope"("usuarioId", "unitId");
CREATE INDEX "HealthUserAccessScope_unitId_isActive_idx" ON "HealthUserAccessScope"("unitId", "isActive");
CREATE INDEX "HealthUserAccessScope_usuarioId_isActive_idx" ON "HealthUserAccessScope"("usuarioId", "isActive");

ALTER TABLE "HealthUserAccessScope"
    ADD CONSTRAINT "HealthUserAccessScope_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HealthUserAccessScope"
    ADD CONSTRAINT "HealthUserAccessScope_unitId_fkey"
    FOREIGN KEY ("unitId") REFERENCES "HealthUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
