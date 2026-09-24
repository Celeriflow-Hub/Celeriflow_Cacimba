CREATE TYPE "ProcurementOriginPolicy" AS ENUM ('NONE', 'PROCUREMENT_SOURCE', 'CONTRACT');

ALTER TABLE "ExpenseNature"
    ADD COLUMN "procurementOriginPolicy" "ProcurementOriginPolicy" NOT NULL DEFAULT 'NONE';
