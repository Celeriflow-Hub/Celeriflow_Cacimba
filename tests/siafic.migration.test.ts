import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("SIAFIC DEMO · migration aditiva aplica em banco existente", { timeout: 120000 }, async () => {
  const memory = await PGlite.create();
  try {
    const generated = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    assert.equal(generated.status, 0, generated.stderr);
    await memory.exec(generated.stdout);

    // Reconstruct the immediately preceding schema without touching a shared database.
    await memory.exec(`
      DROP TABLE "SiaficDeliveryAttempt", "SiaficDelivery", "SiaficExternalLink", "SiaficOutboxEvent", "SiaficEntityVersion" CASCADE;
      ALTER TABLE "Contract" DROP COLUMN "sourceBudgetUnitId";
    `);
    await memory.exec(readFileSync("prisma/migrations/20260919100000_add_siafic_demo_outbox/migration.sql", "utf8"));

    const tables = await memory.query<{ table_name: string }>(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('SiaficEntityVersion', 'SiaficOutboxEvent', 'SiaficDelivery', 'SiaficDeliveryAttempt', 'SiaficExternalLink')
      ORDER BY table_name
    `);
    assert.deepEqual(tables.rows.map((row) => row.table_name), [
      "SiaficDelivery",
      "SiaficDeliveryAttempt",
      "SiaficEntityVersion",
      "SiaficExternalLink",
      "SiaficOutboxEvent",
    ]);
    const sourceUnit = await memory.query<{ column_name: string }>(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Contract' AND column_name = 'sourceBudgetUnitId'
    `);
    assert.equal(sourceUnit.rows.length, 1);
  } finally {
    await memory.close();
  }
});
