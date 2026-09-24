import { createHash, randomUUID } from "node:crypto";

export const documentSignaturePolicies = {
  internalAllowed: "INTERNAL_ALLOWED",
  icpRequired: "ICP_REQUIRED",
  externalProviderRequired: "EXTERNAL_PROVIDER_REQUIRED",
} as const;

export type DocumentSignaturePolicy = typeof documentSignaturePolicies[keyof typeof documentSignaturePolicies];

export type SignatureProgress = { status: string; isRequired: boolean };

export function assertInternalSigningAllowed(policy: string | null | undefined) {
  if (policy === documentSignaturePolicies.internalAllowed) return;
  if (policy === documentSignaturePolicies.icpRequired) {
    throw new Error("Esta classe documental exige assinatura ICP; nenhum adaptador ICP esta configurado.");
  }
  throw new Error("Esta classe documental exige provedor externo; nenhum adaptador esta configurado.");
}

export function hashDocumentContent(content: string | Uint8Array) {
  return createHash("sha256").update(content).digest("hex");
}

export function snapshotRetentionMonths(configuredRetentionMonths: number) {
  if (!Number.isInteger(configuredRetentionMonths) || configuredRetentionMonths < 1 || configuredRetentionMonths > 1_200) {
    throw new Error("A retencao padrao de documentos configurada e invalida.");
  }
  return configuredRetentionMonths;
}

export function getVersionSignatureStatus(signatures: SignatureProgress[]) {
  const requiredSignatures = signatures.filter((signature) => signature.isRequired);
  if (requiredSignatures.length === 0) return "FINAL";
  return requiredSignatures.every((signature) => signature.status === "SIGNED") ? "SIGNED" : "PENDING_SIGNATURE";
}

export function createPublicValidationCode() {
  return `CFV-${randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;
}

export function toPublicValidationResponse(input: {
  publicLabel: string;
  versionNumber: number;
  hashSha256: string;
  status: string;
}) {
  return {
    publicLabel: input.publicLabel,
    version: input.versionNumber,
    hashSha256: input.hashSha256,
    status: input.status,
  };
}
