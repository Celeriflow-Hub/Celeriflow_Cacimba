import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";

function run(...args) {
  console.log(`$ npx ${args.join(" ")}`);
  const result = isWindows
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", `npx ${args.join(" ")}`], { stdio: "inherit" })
    : spawnSync("npx", args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const migrations = readdirSync("prisma/migrations", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

run("prisma", "db", "push", "--force-reset", "--accept-data-loss");
run("prisma", "db", "execute", "--file", "prisma/bootstrap-test/audit-immutability.sql");

for (const migration of migrations) {
  run("prisma", "migrate", "resolve", "--applied", migration);
}
