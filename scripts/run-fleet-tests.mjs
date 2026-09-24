import { spawnSync } from "node:child_process";
// The suite creates its own in-memory PostgreSQL fixture; it never uses DATABASE_URL.
// The test worker prepares temporary Firebase parser data before importing the domain.
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-concurrency=1", "tests/frotas-opening.test.ts", "tests/frotas.integration.test.ts"], { stdio: "inherit" });
process.exit(result.status ?? 1);
