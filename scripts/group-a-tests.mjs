import { execFileSync } from "node:child_process";

const groupATestRoots = [
  "tests",
  "src/lib/financeiro/__tests__",
  "src/lib/patrimonio/__tests__",
];

const groupATestPattern = /^(?:tests|src\/lib\/(?:financeiro|patrimonio)\/__tests__)\/.*\.(?:test|spec)\.(?:[cm]?[jt]sx?)$/;

export function findCommittedGroupATests() {
  const files = execFileSync("git", ["ls-files", "--", ...groupATestRoots], { encoding: "utf8" });
  return files.split(/\r?\n/).filter((file) => groupATestPattern.test(file));
}
