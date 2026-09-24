-- The pre-migration Prisma schema created this as a unique index, not a named constraint.
-- Keep the three-column RAP key introduced by the workflow migration.
DROP INDEX IF EXISTS "PayableCarryForward_financialYearId_commitmentId_key";
