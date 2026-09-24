import type { AppContext } from "@/lib/platform/tenant-context";
import { registerRequestedInternalDocumentSignature } from "@/lib/documents/document-flow-service";

type SignatureAudit = {
  ipAddress: string | null;
  userAgent: string | null;
};

export async function registerInternalDocumentSignature(
  context: AppContext,
  documentId: string,
  audit: SignatureAudit,
  reauthenticatedAt: Date,
) {
  return registerRequestedInternalDocumentSignature(context, documentId, audit, reauthenticatedAt);
}
