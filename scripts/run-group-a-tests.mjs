import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { findCommittedGroupATests } from "./group-a-tests.mjs";

config({ path: ".env.local", quiet: true });
config({ path: ".env.test", quiet: true });

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
if (!testDatabaseUrl) {
  console.error("TEST_DATABASE_URL must point to an isolated test database. DATABASE_URL is never used as a test fallback.");
  process.exit(1);
}

for (const name of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
  if (process.env[name]?.trim() === testDatabaseUrl) {
    console.error(`TEST_DATABASE_URL must not match ${name}. Refusing to run destructive tests against an application database.`);
    process.exit(1);
  }
}

const tests = findCommittedGroupATests().filter((file) => file !== "tests/siafic.e2e.test.ts");
if (!tests.length) {
  console.error("No committed Group A test files were found.");
  process.exit(1);
}

console.log(`Running ${tests.length} committed Group A test file(s).`);
const result = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--test", "--test-concurrency=1", ...tests], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "test",
    DATABASE_URL: testDatabaseUrl,
    DATABASE_URL_UNPOOLED: testDatabaseUrl,
  },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
