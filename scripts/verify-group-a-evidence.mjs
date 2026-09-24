import { readFileSync } from "node:fs";
import { findCommittedGroupATests } from "./group-a-tests.mjs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const reportDelivery = readFileSync(new URL("../src/lib/financeiro/report-delivery.ts", import.meta.url), "utf8");
const tests = findCommittedGroupATests();

const failures = [];
if (packageJson.scripts?.["test:unit"] !== "node scripts/run-group-a-tests.mjs") {
  failures.push('test:unit must use the committed Group A test runner.');
}
if (!tests.length) failures.push("No committed Group A test files were found.");
if (!reportDelivery.includes('statutoryCompleteness: "NOT_STATUTORY"')) {
  failures.push("Report delivery no longer declares its output NOT_STATUTORY.");
}
if (!reportDelivery.includes('status: "INTERNAL_PARTIAL"')) {
  failures.push("Report delivery no longer declares partial internal reports.");
}

if (failures.length) {
  for (const failure of failures) console.error(`FALHA: ${failure}`);
  process.exit(1);
}

console.log(`OK: ${tests.length} committed Group A test file(s) will run; report delivery remains NOT_STATUTORY/internal partial.`);
