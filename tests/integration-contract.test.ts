import assert from "node:assert/strict";
import test from "node:test";
import { buildRunCompletionEnvelope, buildRunStartEnvelope, sanitizeIntegrationValue } from "@/lib/integrations/contract";
import { assertIntegrationEnvironmentPolicy, runMockIntegration } from "@/lib/integrations/registry";

test("integration policy keeps Banco Virtual in SANDBOX and other connectors in MOCK", () => {
  assert.doesNotThrow(() => assertIntegrationEnvironmentPolicy("BANCO_API", "SANDBOX"));
  assert.doesNotThrow(() => assertIntegrationEnvironmentPolicy("SICONFI", "MOCK"));
  assert.throws(() => assertIntegrationEnvironmentPolicy("BANCO_API", "MOCK"));
  assert.throws(() => assertIntegrationEnvironmentPolicy("SICONFI", "SANDBOX"));
  assert.throws(() => assertIntegrationEnvironmentPolicy("BANCO_API", "PRODUCAO"));
});

test("sanitized envelopes exclude secrets and raw request or response bodies", () => {
  const sanitized = sanitizeIntegrationValue({
    account: "20001-1",
    token: "do-not-store",
    requestBody: { content: "raw request" },
    response: { rawContent: "raw response" },
    nested: { authorization: "Bearer do-not-store", value: "retained" },
  });

  assert.deepEqual(sanitized, { account: "20001-1", nested: { value: "retained" } });
});

test("named MOCK scenarios are deterministic and default to success", () => {
  const first = runMockIntegration("SICONFI", "HEALTH_CHECK", { scenario: "success" });
  const second = runMockIntegration("SICONFI", "HEALTH_CHECK", { scenario: "success" });
  const fallback = runMockIntegration("SICONFI", "HEALTH_CHECK", {});

  assert.deepEqual(first, second);
  assert.equal(first.externalId, "MOCK-SICONFI-HEALTH_CHECK-success");
  assert.equal(fallback.externalId, "MOCK-SICONFI-HEALTH_CHECK-success");
  assert.equal(runMockIntegration("SICONFI", "HEALTH_CHECK", { scenario: "failure" }).status, "FALHA");
});

test("run lifecycle preserves one deterministic key and only sanitized evidence", () => {
  const started = buildRunStartEnvelope({
    code: "BANCO_API",
    operation: "DOWNLOAD_STATEMENT",
    environment: "SANDBOX",
    payload: { account: "20001-1", secret: "do-not-store" },
  });
  const completed = buildRunCompletionEnvelope(started, {
    status: "SUCESSO",
    externalId: "sha256",
    evidence: { itemCount: 3, responseBody: "do-not-store" },
  });

  assert.equal(started.phase, "STARTED");
  assert.equal(completed.phase, "COMPLETED");
  assert.equal(completed.idempotencyKey, started.idempotencyKey);
  assert.deepEqual(completed.input, { account: "20001-1" });
  assert.deepEqual(completed.outcome?.evidence, { itemCount: 3 });
});
