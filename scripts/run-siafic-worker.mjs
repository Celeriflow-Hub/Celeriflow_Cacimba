import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const workerUrl = process.env.SIAFIC_WORKER_URL?.trim();
const workerToken = process.env.SIAFIC_WORKER_TOKEN?.trim();
const intervalMs = Number(process.env.SIAFIC_WORKER_INTERVAL_MS || 2_000);

if (!workerUrl || !workerToken) {
  console.error("SIAFIC_WORKER_URL and SIAFIC_WORKER_TOKEN must be configured.");
  process.exitCode = 1;
} else if (!Number.isInteger(intervalMs) || intervalMs < 500 || intervalMs > 60_000) {
  console.error("SIAFIC_WORKER_INTERVAL_MS must be an integer between 500 and 60000.");
  process.exitCode = 1;
} else {
  let stopping = false;
  const stop = () => { stopping = true; };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  while (!stopping) {
    try {
      const response = await fetch(workerUrl, {
        headers: { Authorization: `Bearer ${workerToken}` },
        redirect: "error",
        cache: "no-store",
      });
      if (!response.ok) console.error(`SIAFIC worker route returned HTTP ${response.status}.`);
    } catch {
      console.error("SIAFIC worker route could not be reached.");
    }
    if (!stopping) await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
