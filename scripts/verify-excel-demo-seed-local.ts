import assert from "node:assert/strict";
import path from "node:path";
import { loadExcelDemoSource } from "../src/lib/demo-seed/excel-source";
import { seedExcelDemo } from "../src/lib/demo-seed/seed";
import { createSiaficTestDatabase } from "../tests/helpers/siafic-test-environment";

async function main() {
  const source = await loadExcelDemoSource(path.join(process.cwd(), "docs", "POC"));
  assert.deepEqual(source.issues, []);

  const database = await createSiaficTestDatabase();
  try {
    const first = await seedExcelDemo(database.prisma, source);
    const second = await seedExcelDemo(database.prisma, source);
    const firstInserted = first.reports.reduce((total, report) => total + report.inserted, 0);
    const secondInserted = second.reports.reduce((total, report) => total + report.inserted, 0);

    assert.equal(firstInserted, 46_474, "A quantidade importada divergiu do mapeamento homologado.");
    assert.equal(secondInserted, 0, "A segunda execução não pode duplicar registros.");
    assert.equal(first.reports.length, 78, "A cobertura de modelos do seed mudou sem revisão.");

    console.log(JSON.stringify({
      checksum: source.checksum,
      sourceRows: source.totalRows,
      firstInserted,
      secondInserted,
      models: first.reports.length,
    }, null, 2));
  } finally {
    await database.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
