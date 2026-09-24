import { spawnSync } from "node:child_process";
import { join } from "node:path";

const minimumHeapMegabytes = 4096;
const heapOptionPattern = /--max[-_]old[-_]space[-_]size(?:=(\d+)|\s+(\d+))?/g;
const inheritedNodeOptions = process.env.NODE_OPTIONS?.trim() ?? "";
let containsHeapOption = false;
const nodeOptions = inheritedNodeOptions.replace(
  heapOptionPattern,
  (option, equalsValue, spacedValue) => {
    containsHeapOption = true;
    const configuredHeap = Number(equalsValue ?? spacedValue ?? 0);
    return configuredHeap >= minimumHeapMegabytes
      ? option
      : `--max-old-space-size=${minimumHeapMegabytes}`;
  },
);

const normalizedNodeOptions = containsHeapOption
  ? nodeOptions
  : [nodeOptions, `--max-old-space-size=${minimumHeapMegabytes}`].filter(Boolean).join(" ");

const environment = { ...process.env, NODE_OPTIONS: normalizedNodeOptions };
const commands = {
  prisma: join(process.cwd(), "node_modules", "prisma", "build", "index.js"),
  next: join(process.cwd(), "node_modules", "next", "dist", "bin", "next"),
};

function run(command, args) {
  const result = spawnSync(process.execPath, [commands[command], ...args], {
    stdio: "inherit",
    env: environment,
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
  if (process.exitCode !== 0) process.exit(process.exitCode);
}

// Production builds use the production database, so deploy committed schema
// migrations before compiling code that depends on their columns.
if (process.env.VERCEL_ENV === "production") run("prisma", ["migrate", "deploy"]);
run("prisma", ["generate"]);
run("next", ["build"]);
