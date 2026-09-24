import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { EXCEL_DEMO_CHECKSUM, loadExcelDemoSource } from "../src/lib/demo-seed/excel-source";
import { EXCEL_DEMO_IMPORT_MANIFEST, validateImportManifest } from "../src/lib/demo-seed/import-manifest";

test("os três Excel formam uma fonte determinística e íntegra", async () => {
  const source = await loadExcelDemoSource(path.join(process.cwd(), "docs", "POC"));
  assert.equal(source.tables.size, 69);
  assert.equal(source.totalRows, 47_961);
  assert.equal(source.foreignKeyChecks, 207);
  assert.deepEqual(source.issues, []);
  assert.equal(source.checksum, EXCEL_DEMO_CHECKSUM);
});

test("todas as tabelas possuem tratamento explícito no manifesto", async () => {
  const source = await loadExcelDemoSource(path.join(process.cwd(), "docs", "POC"));
  assert.deepEqual(validateImportManifest(source.tables.keys()), { missing: [], stale: [] });
  assert.equal(Object.keys(EXCEL_DEMO_IMPORT_MANIFEST).length, 69);
});

