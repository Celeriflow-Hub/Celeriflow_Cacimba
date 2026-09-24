import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findCommittedGroupATests } from "./group-a-tests.mjs";

const tests = findCommittedGroupATests();
if (!tests.length) {
  console.error("No committed Group A test files were found.");
  process.exit(1);
}

console.log(`Running ${tests.length} committed Group A test file(s).`);
const tsxCli = fileURLToPath(new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url));
const result = spawnSync(process.execPath, ["--conditions=react-server", tsxCli, "--test", ...tests], { stdio: "inherit" });

if (result.error) throw result.error;
process.exit(result.status ?? 1);
