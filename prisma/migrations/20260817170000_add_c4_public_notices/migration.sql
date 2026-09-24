-- C4 keeps all source records private and publishes only this redacted projection.
CREATE TABLE "PublicNotice" (
    "id" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validationCode" TEXT NOT NULL,
    "publishedByUsuarioId" TEXT NOT NULL,
    CONSTRAINT "PublicNotice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicNotice_validationCode_key" ON "PublicNotice"("validationCode");
CREATE UNIQUE INDEX "PublicNotice_sourceModule_sourceEntityId_key" ON "PublicNotice"("sourceModule", "sourceEntityId");
CREATE INDEX "PublicNotice_publishedAt_idx" ON "PublicNotice"("publishedAt");

ALTER TABLE "PublicNotice" ADD CONSTRAINT "PublicNotice_publishedByUsuarioId_fkey"
  FOREIGN KEY ("publishedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
