import assert from "node:assert/strict";
import test from "node:test";
import { getBlobDocumentPrefix, isInstanceDocumentPath } from "../src/lib/platform/blob";

const originalInstanceId = process.env.CELERIFLOW_INSTANCE_ID;

test.after(() => {
  if (originalInstanceId === undefined) delete process.env.CELERIFLOW_INSTANCE_ID;
  else process.env.CELERIFLOW_INSTANCE_ID = originalInstanceId;
});

test("uses the configured instance as the only document namespace", () => {
  process.env.CELERIFLOW_INSTANCE_ID = "poc-nova-cidade";

  assert.equal(getBlobDocumentPrefix(), "instances/poc-nova-cidade/documents/");
  assert.equal(isInstanceDocumentPath("instances/poc-nova-cidade/documents/arquivo.pdf"), true);
  assert.equal(isInstanceDocumentPath("instances/outra-cidade/documents/arquivo.pdf"), false);
  assert.equal(isInstanceDocumentPath("documents/arquivo.pdf"), false);
});

test("rejects an invalid instance identifier", () => {
  process.env.CELERIFLOW_INSTANCE_ID = "Nova Cidade";

  assert.throws(() => getBlobDocumentPrefix(), /CELERIFLOW_INSTANCE_ID/);
});
