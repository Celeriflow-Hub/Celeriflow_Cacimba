-- Legal lifecycle and evidentiary fields for PPA, LDO, LOA and additional credits.
-- Existing planning records remain available as drafts and must be legally reprocessed.

ALTER TABLE "MultiYearPlan"
  ADD COLUMN IF NOT EXISTS "draftedById" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedById" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sanctionedById" TEXT,
  ADD COLUMN IF NOT EXISTS "sanctionedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publishedById" TEXT,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legalActNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "legalActDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legalDocumentId" TEXT,
  ADD COLUMN IF NOT EXISTS "publicationDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publicationReference" TEXT;

ALTER TABLE "BudgetGuideline"
  ADD COLUMN IF NOT EXISTS "draftedById" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedById" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sanctionedById" TEXT,
  ADD COLUMN IF NOT EXISTS "sanctionedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publishedById" TEXT,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legalActNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "legalActDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legalDocumentId" TEXT,
  ADD COLUMN IF NOT EXISTS "publicationDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publicationReference" TEXT;

ALTER TABLE "AnnualBudgetLaw"
  ALTER COLUMN "publicationDate" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "draftedById" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedById" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sanctionedById" TEXT,
  ADD COLUMN IF NOT EXISTS "sanctionedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publishedById" TEXT,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legalActNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "legalActDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legalDocumentId" TEXT,
  ADD COLUMN IF NOT EXISTS "publicationReference" TEXT;

ALTER TABLE "CreditRequest"
  ADD COLUMN IF NOT EXISTS "legalActNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "legalActDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legalDocumentId" TEXT,
  ADD COLUMN IF NOT EXISTS "fundingSourceId" TEXT,
  ADD COLUMN IF NOT EXISTS "publicationDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publicationReference" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedById" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sanctionedById" TEXT,
  ADD COLUMN IF NOT EXISTS "sanctionedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publishedById" TEXT,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "executedById" TEXT,
  ADD COLUMN IF NOT EXISTS "executedAt" TIMESTAMP(3);

UPDATE "MultiYearPlan" SET "status" = 'DRAFT';
UPDATE "BudgetGuideline" SET "status" = 'DRAFT';
UPDATE "AnnualBudgetLaw" SET "status" = 'DRAFT';
UPDATE "CreditRequest" SET "status" = 'DRAFT';

ALTER TABLE "MultiYearPlan" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "BudgetGuideline" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "AnnualBudgetLaw" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "CreditRequest" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "MultiYearPlan"
  ADD CONSTRAINT "MultiYearPlan_draftedById_fkey" FOREIGN KEY ("draftedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "MultiYearPlan_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "MultiYearPlan_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "MultiYearPlan_sanctionedById_fkey" FOREIGN KEY ("sanctionedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "MultiYearPlan_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "MultiYearPlan_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT;

ALTER TABLE "BudgetGuideline"
  ADD CONSTRAINT "BudgetGuideline_draftedById_fkey" FOREIGN KEY ("draftedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "BudgetGuideline_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "BudgetGuideline_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "BudgetGuideline_sanctionedById_fkey" FOREIGN KEY ("sanctionedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "BudgetGuideline_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "BudgetGuideline_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT;

ALTER TABLE "AnnualBudgetLaw"
  ADD CONSTRAINT "AnnualBudgetLaw_draftedById_fkey" FOREIGN KEY ("draftedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "AnnualBudgetLaw_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "AnnualBudgetLaw_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "AnnualBudgetLaw_sanctionedById_fkey" FOREIGN KEY ("sanctionedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "AnnualBudgetLaw_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "AnnualBudgetLaw_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT;

ALTER TABLE "CreditRequest"
  ADD CONSTRAINT "CreditRequest_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "CreditRequest_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "ResourceSource"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "CreditRequest_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "CreditRequest_sanctionedById_fkey" FOREIGN KEY ("sanctionedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "CreditRequest_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "Usuario"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "CreditRequest_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "Usuario"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "MultiYearPlan_status_idx" ON "MultiYearPlan"("status");
CREATE INDEX IF NOT EXISTS "BudgetGuideline_status_idx" ON "BudgetGuideline"("status");
CREATE INDEX IF NOT EXISTS "AnnualBudgetLaw_status_idx" ON "AnnualBudgetLaw"("status");
CREATE INDEX IF NOT EXISTS "CreditRequest_status_idx" ON "CreditRequest"("status");
CREATE INDEX IF NOT EXISTS "CreditRequest_fundingSourceId_idx" ON "CreditRequest"("fundingSourceId");
