import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertInternalSigningAllowed,
  documentSignaturePolicies,
  getVersionSignatureStatus,
  hashDocumentContent,
  snapshotRetentionMonths,
  toPublicValidationResponse,
} from "@/lib/documents/document-flow-policy";

test("internal signing only accepts explicitly internal document classes", () => {
  assert.doesNotThrow(() => assertInternalSigningAllowed(documentSignaturePolicies.internalAllowed));
  assert.throws(() => assertInternalSigningAllowed(documentSignaturePolicies.icpRequired), /ICP/);
  assert.throws(() => assertInternalSigningAllowed(documentSignaturePolicies.externalProviderRequired), /provedor externo/);
  assert.throws(() => assertInternalSigningAllowed(undefined), /provedor externo/);
});

test("ingestion hashes the immutable version bytes", () => {
  assert.equal(hashDocumentContent("document bytes"), "5a855430e6b6a41750a0928768920a774a02f00d02d79d2880a4204a2f1f22f5");
  assert.notEqual(hashDocumentContent("document bytes"), hashDocumentContent("document bytes changed"));
  assert.equal(hashDocumentContent(new Uint8Array([1, 2, 3])), hashDocumentContent(new Uint8Array([1, 2, 3])));
});

test("a version completes only when every required signer has signed", () => {
  assert.equal(getVersionSignatureStatus([{ status: "SIGNED", isRequired: true }, { status: "PENDING", isRequired: true }]), "PENDING_SIGNATURE");
  assert.equal(getVersionSignatureStatus([{ status: "SIGNED", isRequired: true }, { status: "SIGNED", isRequired: true }]), "SIGNED");
  assert.equal(getVersionSignatureStatus([{ status: "PENDING", isRequired: false }]), "FINAL");
});

test("public validation response is an explicit metadata allowlist", () => {
  const response = toPublicValidationResponse({
    publicLabel: "Authenticated document",
    versionNumber: 3,
    hashSha256: "abc123",
    status: "SIGNED",
  });
  assert.deepEqual(response, {
    publicLabel: "Authenticated document",
    version: 3,
    hashSha256: "abc123",
    status: "SIGNED",
  });
  assert.deepEqual(Object.keys(response).sort(), ["hashSha256", "publicLabel", "status", "version"]);
});

test("retention is snapshotted from a valid configured default", () => {
  assert.equal(snapshotRetentionMonths(60), 60);
  assert.equal(snapshotRetentionMonths(1_200), 1_200);
  assert.throws(() => snapshotRetentionMonths(0));
  assert.throws(() => snapshotRetentionMonths(60.5));
});

test("C2 migration protects locked versions and signatures at the database boundary", async () => {
  const migration = await readFile(
    new URL("../prisma/migrations/20260817110000_add_c2_document_flow/migration.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /"retentionMonths" INTEGER NOT NULL DEFAULT 60/);
  assert.match(migration, /"DocumentVersion_protect_integrity"/);
  assert.match(migration, /"DocumentSignature_protect_integrity"/);
  assert.match(migration, /Locked or signed document versions cannot be deleted/);
  assert.match(migration, /Document signatures are append-only/);
  assert.match(migration, /Every required signature must be signed before version completion/);
});
