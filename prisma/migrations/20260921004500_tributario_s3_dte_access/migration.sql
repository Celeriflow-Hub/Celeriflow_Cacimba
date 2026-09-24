ALTER TABLE "DteMailbox"
  ADD COLUMN "confirmationTokenHash" TEXT,
  ADD COLUMN "confirmationExpiresAt" TIMESTAMP(3);

CREATE TABLE "DteAccessGrant" (
  "id" TEXT NOT NULL,
  "mailboxId" TEXT NOT NULL,
  "authorizedTaxpayerId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "codeLast4" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ATIVO',
  "validUntil" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdByUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DteAccessGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DteAccessGrant_codeHash_key" ON "DteAccessGrant"("codeHash");
CREATE INDEX "DteAccessGrant_mailboxId_status_idx" ON "DteAccessGrant"("mailboxId", "status");
CREATE INDEX "DteAccessGrant_authorizedTaxpayerId_status_idx" ON "DteAccessGrant"("authorizedTaxpayerId", "status");
ALTER TABLE "DteAccessGrant" ADD CONSTRAINT "DteAccessGrant_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "DteMailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;
