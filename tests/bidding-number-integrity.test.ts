import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import {
  BIDDING_NUMBER_DUPLICATE_ERROR,
  biddingNumberDuplicateError,
} from "../src/lib/compras/bidding-number-integrity";

const migrationPath = "prisma/migrations/20260919220000_add_bidding_number_uniqueness/migration.sql";

test("Bidding number conflicts return a client-safe error", () => {
  assert.deepEqual(biddingNumberDuplicateError({ code: "P2002" }), {
    error: BIDDING_NUMBER_DUPLICATE_ERROR,
  });
  assert.equal(biddingNumberDuplicateError({ code: "P2025" }), null);
});

test("Bidding number migration creates a unique public identifier", async () => {
  const memory = await PGlite.create();
  try {
    await memory.exec('CREATE TABLE "Bidding" ("id" TEXT PRIMARY KEY, "number" TEXT NOT NULL);');
    await memory.exec(readFileSync(migrationPath, "utf8"));
    await memory.exec('INSERT INTO "Bidding" ("id", "number") VALUES (\'bidding-1\', \'PE-2026-001\');');

    await assert.rejects(
      memory.exec('INSERT INTO "Bidding" ("id", "number") VALUES (\'bidding-2\', \'PE-2026-001\');'),
      /unique constraint/i,
    );
    assert.match(
      readFileSync("prisma/schema.prisma", "utf8"),
      /model Bidding \{[\s\S]*?\n\s+number\s+String\s+@unique/,
    );
  } finally {
    await memory.close();
  }
});
