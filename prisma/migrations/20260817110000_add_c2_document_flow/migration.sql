-- C2-002 is additive: legacy documents remain unclassified and cannot use internal signing.
CREATE TABLE "DocumentClass" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "signaturePolicy" TEXT NOT NULL DEFAULT 'EXTERNAL_PROVIDER_REQUIRED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentClass_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DocumentClass_code_key" ON "DocumentClass"("code");

INSERT INTO "DocumentClass" ("id", "code", "label", "signaturePolicy", "updatedAt") VALUES
  ('c2docclassinternalallowed', 'GED_INTERNAL_ALLOWED', 'Documento interno permitido', 'INTERNAL_ALLOWED', CURRENT_TIMESTAMP),
  ('c2docclassicprequired', 'GED_ICP_REQUIRED', 'Documento com ICP obrigatoria', 'ICP_REQUIRED', CURRENT_TIMESTAMP),
  ('c2docclassexternalrequired', 'GED_EXTERNAL_PROVIDER_REQUIRED', 'Documento com provedor externo obrigatorio', 'EXTERNAL_PROVIDER_REQUIRED', CURRENT_TIMESTAMP);

ALTER TABLE "Document" ADD COLUMN "documentClassId" TEXT;
ALTER TABLE "Document" ADD COLUMN "publicLabel" TEXT NOT NULL DEFAULT 'Documento autenticado';
ALTER TABLE "Document" ADD COLUMN "retentionMonths" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "DocumentVersion" ADD COLUMN "publicValidationCode" TEXT;
ALTER TABLE "DocumentSignature" ADD COLUMN "isRequired" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "DocumentSignature" ADD COLUMN "requestedByUsuarioId" TEXT;

CREATE UNIQUE INDEX "DocumentVersion_publicValidationCode_key" ON "DocumentVersion"("publicValidationCode");
CREATE INDEX "Document_documentClassId_idx" ON "Document"("documentClassId");
CREATE INDEX "DocumentSignature_documentVersionId_status_idx" ON "DocumentSignature"("documentVersionId", "status");

ALTER TABLE "Document" ADD CONSTRAINT "Document_documentClassId_fkey" FOREIGN KEY ("documentClassId") REFERENCES "DocumentClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_requestedByUsuarioId_fkey" FOREIGN KEY ("requestedByUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION protect_document_version_integrity() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' AND (OLD."lockedAt" IS NOT NULL OR OLD.status IN ('PENDING_SIGNATURE', 'SIGNED')) THEN
    RAISE EXCEPTION 'Locked or signed document versions cannot be deleted';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW."documentId" IS DISTINCT FROM OLD."documentId"
      OR NEW."versionNumber" IS DISTINCT FROM OLD."versionNumber"
      OR NEW."fileUrl" IS DISTINCT FROM OLD."fileUrl"
      OR NEW."hashSha256" IS DISTINCT FROM OLD."hashSha256"
      OR NEW."publicValidationCode" IS DISTINCT FROM OLD."publicValidationCode"
      OR NEW."finalizedAt" IS DISTINCT FROM OLD."finalizedAt" THEN
      RAISE EXCEPTION 'Document version identity and evidence are immutable';
    END IF;
    IF OLD."lockedAt" IS NOT NULL AND NEW."lockedAt" IS DISTINCT FROM OLD."lockedAt" THEN
      RAISE EXCEPTION 'A locked document version cannot be unlocked or relocked';
    END IF;
    IF OLD.status = 'SIGNED' AND NEW IS DISTINCT FROM OLD THEN
      RAISE EXCEPTION 'Signed document versions cannot be changed';
    END IF;
    IF OLD.status = 'PENDING_SIGNATURE' AND NEW.status NOT IN ('PENDING_SIGNATURE', 'SIGNED') THEN
      RAISE EXCEPTION 'A locked document version can only complete signing';
    END IF;
    IF NEW.status IN ('PENDING_SIGNATURE', 'SIGNED') AND NEW."lockedAt" IS NULL THEN
      RAISE EXCEPTION 'Signing document versions must be locked';
    END IF;
    IF NEW.status = 'SIGNED' AND EXISTS (
      SELECT 1 FROM "DocumentSignature"
      WHERE "documentVersionId" = NEW.id AND "isRequired" = true AND status <> 'SIGNED'
    ) THEN
      RAISE EXCEPTION 'Every required signature must be signed before version completion';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "DocumentVersion_protect_integrity"
BEFORE UPDATE OR DELETE ON "DocumentVersion"
FOR EACH ROW EXECUTE FUNCTION protect_document_version_integrity();

CREATE OR REPLACE FUNCTION protect_document_signature_integrity() RETURNS TRIGGER AS $$
DECLARE version_hash TEXT;
DECLARE version_document_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Document signatures are append-only';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status <> 'PENDING' OR NEW.status <> 'SIGNED' THEN
      RAISE EXCEPTION 'A signature can only transition once from pending to signed';
    END IF;
    IF NEW."documentId" IS DISTINCT FROM OLD."documentId"
      OR NEW."documentVersionId" IS DISTINCT FROM OLD."documentVersionId"
      OR NEW."signerUsuarioId" IS DISTINCT FROM OLD."signerUsuarioId"
      OR NEW."signerEmployeeId" IS DISTINCT FROM OLD."signerEmployeeId"
      OR NEW."signerName" IS DISTINCT FROM OLD."signerName"
      OR NEW."signerEmail" IS DISTINCT FROM OLD."signerEmail"
      OR NEW."signatureType" IS DISTINCT FROM OLD."signatureType"
      OR NEW.provider IS DISTINCT FROM OLD.provider
      OR NEW."documentHash" IS DISTINCT FROM OLD."documentHash"
      OR NEW."verificationCode" IS DISTINCT FROM OLD."verificationCode"
      OR NEW."requestedByUsuarioId" IS DISTINCT FROM OLD."requestedByUsuarioId"
      OR NEW."isRequired" IS DISTINCT FROM OLD."isRequired"
      OR NEW."requestedAt" IS DISTINCT FROM OLD."requestedAt" THEN
      RAISE EXCEPTION 'Signature identity and evidence are immutable';
    END IF;
    IF NEW.status = 'SIGNED' AND NEW."signedAt" IS NULL THEN
      RAISE EXCEPTION 'A signed signature requires a signing timestamp';
    END IF;
  END IF;
  SELECT "hashSha256", "documentId" INTO version_hash, version_document_id FROM "DocumentVersion" WHERE id = NEW."documentVersionId";
  IF version_hash IS NULL OR version_document_id IS DISTINCT FROM NEW."documentId" OR version_hash IS DISTINCT FROM NEW."documentHash" THEN
    RAISE EXCEPTION 'Signature must match its document version and hash';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "DocumentSignature_protect_integrity"
BEFORE INSERT OR UPDATE OR DELETE ON "DocumentSignature"
FOR EACH ROW EXECUTE FUNCTION protect_document_signature_integrity();
