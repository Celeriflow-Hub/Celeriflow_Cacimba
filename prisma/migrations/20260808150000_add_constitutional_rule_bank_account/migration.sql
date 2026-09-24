ALTER TABLE "ClassificationRule" ADD COLUMN IF NOT EXISTS "bankAccountId" TEXT;

CREATE INDEX IF NOT EXISTS "ClassificationRule_bankAccountId_idx" ON "ClassificationRule"("bankAccountId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ClassificationRule_bankAccountId_fkey'
  ) THEN
    ALTER TABLE "ClassificationRule"
      ADD CONSTRAINT "ClassificationRule_bankAccountId_fkey"
      FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
