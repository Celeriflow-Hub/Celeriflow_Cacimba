import { createIdempotencyKey } from "./contract";
import type { ProcurementExportLayout, ProcurementExportOperation, ProcurementExportPackageCode } from "./procurement-export-contract";

export function procurementExportConfigurationFingerprint(input: {
  connectionId: string;
  connectionStatus: string;
  environment: string;
  credentialReference?: string | null;
  layout: ProcurementExportLayout | null;
  operations: readonly ProcurementExportOperation[];
}) {
  return createIdempotencyKey({
    connectionId: input.connectionId,
    connectionStatus: input.connectionStatus,
    environment: input.environment,
    credentialReferenceFingerprint: input.credentialReference ? createIdempotencyKey(input.credentialReference) : null,
    layout: input.layout,
    operations: [...input.operations].sort(),
  });
}

export function createProcurementExportIdempotencyKey(input: {
  packageCode: ProcurementExportPackageCode;
  connectionId: string | null;
  configurationFingerprint: string;
  sourceFingerprint: string;
}) {
  return createIdempotencyKey({
    contractVersion: "CLC-P8-POC-1",
    packageCode: input.packageCode,
    connectionId: input.connectionId,
    configurationFingerprint: input.configurationFingerprint,
    sourceFingerprint: input.sourceFingerprint,
  });
}
