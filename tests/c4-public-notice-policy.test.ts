import assert from "node:assert/strict";
import test from "node:test";
import { assertProcessNoticeCanBePublished, createPublicNoticeValidationCode, createRedactedProcessNotice, projectPublicNotice } from "../src/lib/transparencia/public-notice-policy";
import { assertInternalSigningAllowed } from "../src/lib/documents/document-flow-policy";

test("public process notices are redacted to title, category, date, and validation link", () => {
  const source = {
    protocolNumber: "PROC-2026-000001",
    processTypeName: "Licenca",
    description: "private narrative",
    interested: "private person",
    attachmentUrl: "https://blob.example/private.pdf",
  };
  const notice = createRedactedProcessNotice(source);
  const projection = projectPublicNotice({ ...notice, sourceModule: "PROCESSOS", category: "Licenca", publishedAt: new Date("2026-08-17T00:00:00.000Z"), validationCode: "CFN-ABCDEFGHIJ1234567890" });

  assert.deepEqual(Object.keys(projection).sort(), ["category", "publishedAt", "title", "validationUrl"]);
  assert.equal(projection.validationUrl, "/validar-aviso/CFN-ABCDEFGHIJ1234567890");
  assert.equal(projection.category, "Processos e protocolos");
  assert.doesNotMatch(JSON.stringify(projection), /private narrative|private person|blob\.example/);
});

test("public notice validation codes are opaque and independently scoped", () => {
  assert.match(createPublicNoticeValidationCode(), /^CFN-[A-Z0-9]{20}$/);
});

test("public notices reject active and Ombudsman-originated processes", () => {
  assert.doesNotThrow(() => assertProcessNoticeCanBePublished({ status: "Concluido", isFromOmbudsman: false }));
  assert.throws(() => assertProcessNoticeCanBePublished({ status: "Recebido", isFromOmbudsman: false }));
  assert.throws(() => assertProcessNoticeCanBePublished({ status: "Arquivado", isFromOmbudsman: true }));
});

test("internal signature gate accepts only the explicitly allowed document class", () => {
  assert.doesNotThrow(() => assertInternalSigningAllowed("INTERNAL_ALLOWED"));
  assert.throws(() => assertInternalSigningAllowed("ICP_REQUIRED"));
  assert.throws(() => assertInternalSigningAllowed("EXTERNAL_PROVIDER_REQUIRED"));
});
