import "server-only";

import { z } from "zod";

export class SiaficConfigurationError extends Error {}

const sourceInstancePattern = /^[A-Z0-9][A-Z0-9_-]{2,99}$/;
const datasetPattern = /^[A-Z0-9][A-Z0-9_-]{2,119}$/;
const placeholderPattern = /(^$|__CONFIGURAR|CHANGE_ME|EXAMPLE|placeholder)/i;

export type SiaficDemoRuntimeConfig = {
  appEnvironment: "DEMO";
  enabled: boolean;
  sourceInstanceId: string;
  datasetId: string;
  receiverBaseUrl: string;
  allowedHosts: readonly string[];
  apiToken: string;
  protocolVersion: "1.0";
  httpTimeoutMs: number;
  workerBatchSize: number;
  workerLeaseSeconds: number;
};

export const siaficConnectionConfigurationSchema = z.object({
  defaultSourceUnitCode: z.string().trim().min(1).max(50),
  unitMappings: z.record(z.string().trim().min(1).max(50), z.string().trim().min(1).max(50)),
}).strict();

export type SiaficConnectionConfiguration = z.infer<typeof siaficConnectionConfigurationSchema>;

function strictBoolean(value: string | undefined) {
  return value === "true";
}

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value || placeholderPattern.test(value)) {
    throw new SiaficConfigurationError(`${name} deve ser configurada com um valor real no ambiente DEMO.`);
  }
  return value;
}

function boundedInteger(name: string, fallback: number, minimum: number, maximum: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new SiaficConfigurationError(`${name} deve ser um inteiro entre ${minimum} e ${maximum}.`);
  }
  return value;
}

function parseAllowedHosts(value: string) {
  const hosts = value.split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (!hosts.length || hosts.some((host) => /[/:?#@]/.test(host))) {
    throw new SiaficConfigurationError("SIAFIC_ALLOWED_HOSTS deve conter somente nomes de host separados por virgula.");
  }
  return [...new Set(hosts)];
}

function normalizedUrl(value: string) {
  const parsed = new URL(value);
  parsed.pathname = parsed.pathname.replace(/\/$/, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

export function assertSiaficDemoDestinationUrl(value: string, allowedHosts: readonly string[], appEnvironment = process.env.APP_ENV?.trim()) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new SiaficConfigurationError("A URL do receptor SIAFIC DEMO e invalida.");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new SiaficConfigurationError("A URL do receptor nao pode conter credenciais, query string ou fragmento.");
  }
  const host = parsed.hostname.toLowerCase();
  const loopback = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopback && appEnvironment === "DEMO")) {
    throw new SiaficConfigurationError("O receptor SIAFIC exige HTTPS; HTTP e permitido somente para loopback no ambiente DEMO.");
  }
  if (!allowedHosts.includes(host)) {
    throw new SiaficConfigurationError("O host do receptor SIAFIC nao pertence a allowlist configurada.");
  }
  if (appEnvironment === "PRODUCAO") {
    throw new SiaficConfigurationError("O adaptador robonuvem_demo e bloqueado em APP_ENV=PRODUCAO.");
  }
  return normalizedUrl(parsed.toString());
}

export function getSiaficDemoRuntimeConfig(options: { requireEnabled?: boolean } = {}): SiaficDemoRuntimeConfig | null {
  const requireEnabled = options.requireEnabled !== false;
  const enabled = strictBoolean(process.env.SIAFIC_ENABLED);
  if (requireEnabled && !enabled) return null;

  const appEnvironment = process.env.APP_ENV?.trim();
  if (appEnvironment === "PRODUCAO") {
    throw new SiaficConfigurationError("O adaptador robonuvem_demo e bloqueado em APP_ENV=PRODUCAO.");
  }
  if (appEnvironment !== "DEMO") {
    throw new SiaficConfigurationError("O adaptador robonuvem_demo exige APP_ENV=DEMO.");
  }
  if (process.env.SIAFIC_PROVIDER?.trim() !== "robonuvem_demo") {
    throw new SiaficConfigurationError("SIAFIC_PROVIDER deve ser robonuvem_demo para este adaptador.");
  }

  const sourceInstanceId = requiredEnvironment("SIAFIC_SOURCE_INSTANCE_ID");
  if (!sourceInstancePattern.test(sourceInstanceId)) {
    throw new SiaficConfigurationError("SIAFIC_SOURCE_INSTANCE_ID possui formato invalido.");
  }
  const datasetId = requiredEnvironment("SIAFIC_DATASET_ID");
  if (!datasetPattern.test(datasetId)) {
    throw new SiaficConfigurationError("SIAFIC_DATASET_ID possui formato invalido.");
  }
  const allowedHosts = parseAllowedHosts(requiredEnvironment("SIAFIC_ALLOWED_HOSTS"));
  const receiverBaseUrl = assertSiaficDemoDestinationUrl(requiredEnvironment("SIAFIC_RECEIVER_BASE_URL"), allowedHosts, appEnvironment);
  const protocolVersion = process.env.SIAFIC_PROTOCOL_VERSION?.trim() || "1.0";
  if (protocolVersion !== "1.0") {
    throw new SiaficConfigurationError("SIAFIC_PROTOCOL_VERSION deve ser 1.0 para o receptor DEMO atual.");
  }

  return {
    appEnvironment: "DEMO",
    enabled,
    sourceInstanceId,
    datasetId,
    receiverBaseUrl,
    allowedHosts,
    apiToken: requiredEnvironment("SIAFIC_API_TOKEN"),
    protocolVersion,
    httpTimeoutMs: boundedInteger("SIAFIC_HTTP_TIMEOUT_MS", 5_000, 100, 30_000),
    workerBatchSize: boundedInteger("SIAFIC_WORKER_BATCH_SIZE", 25, 1, 100),
    workerLeaseSeconds: boundedInteger("SIAFIC_WORKER_LEASE_SECONDS", 30, 6, 300),
  };
}

export function parseSiaficConnectionConfiguration(value: unknown) {
  const parsed = siaficConnectionConfigurationSchema.safeParse(value);
  if (!parsed.success) {
    throw new SiaficConfigurationError("A configuracao publica do SIAFIC deve informar defaultSourceUnitCode e unitMappings validos.");
  }
  return parsed.data;
}

export function assertSiaficConnectionMatchesRuntime(baseUrl: string | null | undefined) {
  const config = getSiaficDemoRuntimeConfig({ requireEnabled: false });
  if (!config) throw new SiaficConfigurationError("Configuracao SIAFIC DEMO indisponivel.");
  if (!baseUrl || normalizedUrl(baseUrl) !== config.receiverBaseUrl) {
    throw new SiaficConfigurationError("A URL salva do receptor deve coincidir com SIAFIC_RECEIVER_BASE_URL autorizada no servidor.");
  }
  assertSiaficDemoDestinationUrl(baseUrl, config.allowedHosts, config.appEnvironment);
  return config;
}
