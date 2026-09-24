import type { Prisma, PrismaClient } from "@prisma/client";

export const auditEventTypes = {
  sessionLogin: "SESSION_LOGIN",
  sessionLogout: "SESSION_LOGOUT",
  documentDownload: "DOCUMENT_DOWNLOAD",
  financialReportExport: "FINANCIAL_REPORT_EXPORT",
  reportIssued: "REPORT_ISSUED",
  pageView: "PAGE_VIEW",
  uiInteraction: "UI_INTERACTION",
  formSubmit: "FORM_SUBMIT",
  instanceConfigurationChanged: "INSTANCE_CONFIGURATION_CHANGED",
  internalNotificationCreated: "INTERNAL_NOTIFICATION_CREATED",
  internalNotificationRead: "INTERNAL_NOTIFICATION_READ",
  personMergeProposed: "PERSON_MERGE_PROPOSED",
  personMergeExecuted: "PERSON_MERGE_EXECUTED",
  personMergeReversed: "PERSON_MERGE_REVERSED",
  administrativeMutation: "ADMINISTRATIVE_MUTATION",
  processOpened: "PROCESS_OPENED",
  processUpdated: "PROCESS_UPDATED",
  processDocumentLinked: "PROCESS_DOCUMENT_LINKED",
  gedDocumentIngested: "GED_DOCUMENT_INGESTED",
  documentSignatureRequested: "DOCUMENT_SIGNATURE_REQUESTED",
  documentSignatureRegistered: "DOCUMENT_SIGNATURE_REGISTERED",
  publicNoticePublished: "PUBLIC_NOTICE_PUBLISHED",
  stockManuallyAdjusted: "STOCK_MANUALLY_ADJUSTED",
  assetAcquiredFromReceipt: "ASSET_ACQUIRED_FROM_RECEIPT",
  internalControlFindingRegistered: "INTERNAL_CONTROL_FINDING_REGISTERED",
  fleetOperationRegistered: "FLEET_OPERATION_REGISTERED",
  siaficOutboxQueued: "SIAFIC_OUTBOX_QUEUED",
  siaficDeliveryConfirmed: "SIAFIC_DELIVERY_CONFIRMED",
  siaficDeliveryFailed: "SIAFIC_DELIVERY_FAILED",
  siaficDeliveryRetryRequested: "SIAFIC_DELIVERY_RETRY_REQUESTED",
} as const;

export type AuditEventType = (typeof auditEventTypes)[keyof typeof auditEventTypes];

export type AuditEventInput = {
  actorUsuarioId: string;
  eventType: AuditEventType;
  targetType: string;
  targetId: string;
};

// Deliberately persist only stable identifiers; request bodies, URLs, IPs, and report data are excluded.
export async function writeAuditEvent(prisma: PrismaClient | Prisma.TransactionClient, input: AuditEventInput) {
  await prisma.auditEvent.create({
    data: {
      actorUsuarioId: input.actorUsuarioId,
      eventType: input.eventType,
      targetType: input.targetType,
      targetId: input.targetId,
    },
  });
}
