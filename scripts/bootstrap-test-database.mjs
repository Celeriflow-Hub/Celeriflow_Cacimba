import { spawnSync } from "node:child_process";
import { config } from "dotenv";

const isWindows = process.platform === "win32";
config({ path: ".env.local", quiet: true });
config({ path: ".env.test", quiet: true });

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
if (!testDatabaseUrl) {
  console.error("TEST_DATABASE_URL must point to an isolated test database. DATABASE_URL is never used as a test fallback.");
  process.exit(1);
}

for (const name of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
  if (process.env[name]?.trim() === testDatabaseUrl) {
    console.error(`TEST_DATABASE_URL must not match ${name}. Refusing to reset an application database.`);
    process.exit(1);
  }
}

const testEnvironment = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: testDatabaseUrl,
  DATABASE_URL_UNPOOLED: testDatabaseUrl,
};

function run(...args) {
  console.log(`$ npx ${args.join(" ")}`);
  const result = isWindows
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", `npx ${args.join(" ")}`], { stdio: "inherit", env: testEnvironment })
    : spawnSync("npx", args, { stdio: "inherit", env: testEnvironment });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("prisma", "db", "push", "--accept-data-loss");
run("prisma", "db", "execute", "--file", "prisma/bootstrap-test/audit-immutability.sql");
run("tsx", "prisma/seed-poc-completo.ts");
run("tsx", "prisma/seed-lagoa-seca.ts");
testEnvironment.SKIP_BANK_SANDBOX_HEALTH_CHECK = "true";
run("tsx", "scripts/provision-bank-sandbox-poc.ts");
