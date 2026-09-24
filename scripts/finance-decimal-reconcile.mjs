import { config } from "dotenv";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

config({ path: ".env.local" });
config();

const backfill = process.argv.includes("--backfill");

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} nao configurada.`);
  return value;
}

// Fields are deliberately explicit so this audit remains tied to the Phase 0 schema.
const fields = [
  ["budgetAppropriation", "initialValue", "initialValueDecimal"],
  ["budgetAppropriation", "updatedValue", "updatedValueDecimal"],
  ["budgetAppropriation", "committedValue", "committedValueDecimal"],
  ["revenue", "value", "valueDecimal"],
  ["expense", "value", "valueDecimal"],
  ["budgetReservation", "value", "valueDecimal"],
  ["commitment", "value", "valueDecimal"],
  ["settlement", "value", "valueDecimal"],
  ["payment", "value", "valueDecimal"],
  ["bankAccount", "currentBalance", "currentBalanceDecimal"],
  ["bankReconciliation", "systemBalance", "systemBalanceDecimal"],
  ["bankReconciliation", "bankBalance", "bankBalanceDecimal"],
  ["accountingEntry", "value", "valueDecimal"],
  ["taxAssessment", "originalValue", "originalValueDecimal"],
  ["taxGuide", "totalValue", "totalValueDecimal"],
  ["taxPayment", "amountPaid", "amountPaidDecimal"],
  ["debtInstallment", "totalValue", "totalValueDecimal"],
  ["debtInstallment", "downPayment", "downPaymentDecimal"],
  ["activeDebt", "originalValue", "originalValueDecimal"],
  ["activeDebt", "updatedValue", "updatedValueDecimal"],
  ["infraction", "penaltyValue", "penaltyValueDecimal"],
  ["invoice", "serviceValue", "serviceValueDecimal"],
  ["invoice", "deductions", "deductionsDecimal"],
  ["invoice", "issValue", "issValueDecimal"],
];

function normalizedDecimal(value) {
  return new Prisma.Decimal(String(value)).toDecimalPlaces(2);
}

async function reconcileField(prisma, modelName, floatField, decimalField) {
  const model = prisma[modelName];
  const records = await model.findMany({
    select: { id: true, [floatField]: true, [decimalField]: true },
  });
  const report = { modelName, floatField, decimalField, total: records.length, backfilled: 0, missing: 0, mismatched: 0, rounded: 0 };

  for (const record of records) {
    const floatValue = record[floatField];
    const decimalValue = record[decimalField];
    if (floatValue === null) continue;

    const normalized = normalizedDecimal(floatValue);
    if (!normalized.equals(new Prisma.Decimal(String(floatValue)))) report.rounded += 1;

    if (decimalValue === null) {
      report.missing += 1;
      if (backfill) {
        const result = await model.updateMany({
          where: { id: record.id, [decimalField]: null },
          data: { [decimalField]: normalized },
        });
        if (result.count === 1) {
          report.backfilled += 1;
          report.missing -= 1;
        }
      }
      continue;
    }

    if (!new Prisma.Decimal(decimalValue).equals(normalized)) report.mismatched += 1;
  }

  return report;
}

async function main() {
  neonConfig.webSocketConstructor = ws;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: requiredEnvironment("DATABASE_URL") }),
  });

  try {
    const reports = [];
    for (const [modelName, floatField, decimalField] of fields) {
      reports.push(await reconcileField(prisma, modelName, floatField, decimalField));
    }

    console.table(reports);
    const totals = reports.reduce(
      (sum, report) => ({
        records: sum.records + report.total,
        backfilled: sum.backfilled + report.backfilled,
        missing: sum.missing + report.missing,
        mismatched: sum.mismatched + report.mismatched,
        rounded: sum.rounded + report.rounded,
      }),
      { records: 0, backfilled: 0, missing: 0, mismatched: 0, rounded: 0 },
    );
    console.log(JSON.stringify({ mode: backfill ? "backfill" : "read-only", ...totals }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
