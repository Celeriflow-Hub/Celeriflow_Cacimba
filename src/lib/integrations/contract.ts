import crypto from "crypto";
import type { IntegrationEnvironment, IntegrationOperation } from "./registry";

export type SanitizedEnvelope = {
  contractVersion: "C1-005";
  idempotencyKey: string;
  operation: IntegrationOperation;
  environment: IntegrationEnvironment;
  phase: "STARTED" | "COMPLETED" | "FAILED";
  input: unknown;
  outcome?: {
    status: string;
    externalId?: string;
    evidence?: unknown;
  };
};

const sensitiveKey = /(secret|senha|password|token|api.?key|private.?key|certificate|certificado|authorization|credential|bearer|body|request|response|raw|content)/i;

export function sanitizeIntegrationValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeIntegrationValue);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, nestedValue]) => {
    if (sensitiveKey.test(key)) return [];
    return [[key, sanitizeIntegrationValue(nestedValue)]];
  }));
}

export function buildRunStartEnvelope(input: {
  code: string;
  operation: IntegrationOperation;
  environment: IntegrationEnvironment;
  payload?: unknown;
}): SanitizedEnvelope {
  const sanitizedInput = sanitizeIntegrationValue(input.payload ?? {});
  return {
    contractVersion: "C1-005",
    idempotencyKey: createIdempotencyKey({ ...input, payload: sanitizedInput }),
    operation: input.operation,
    environment: input.environment,
    phase: "STARTED",
    input: sanitizedInput,
  };
}

export function buildRunCompletionEnvelope(
  started: SanitizedEnvelope,
  outcome: { status: string; externalId?: string; evidence?: unknown },
): SanitizedEnvelope {
  return {
    ...started,
    phase: outcome.status === "SUCESSO" ? "COMPLETED" : "FAILED",
    outcome: {
      status: outcome.status,
      ...(outcome.externalId ? { externalId: outcome.externalId } : {}),
      ...(outcome.evidence === undefined ? {} : { evidence: sanitizeIntegrationValue(outcome.evidence) }),
    },
  };
}

export function createIdempotencyKey(value: unknown) {
  return crypto.createHash("sha256").update(stableJson(value)).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (!value || typeof value !== "object") return JSON.stringify(value) ?? "null";
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableJson(nestedValue)}`)
    .join(",")}}`;
}
