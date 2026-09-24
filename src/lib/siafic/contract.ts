import { createHash } from "node:crypto";
import { z } from "zod";

export const SIAFIC_DEMO_PROTOCOL = "ROBONUVEM-SIAFIC-DEMO" as const;
export const SIAFIC_DEMO_PROTOCOL_VERSION = "1.0" as const;
export const SIAFIC_DEMO_NOTICE = "SIMULADO - SEM VALIDADE OFICIAL" as const;

const positiveInteger = z.number().int().positive();
const decimalString = z.string().regex(/^\d+(?:\.\d{1,4})?$/, "Valor decimal invalido.");
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoInstant = z.string().datetime({ offset: true });
const personRole = z.enum(["SUPPLIER", "AGREEMENT_COUNTERPART"]);

const personPayloadSchema = z.object({
  personKind: z.enum(["PF", "PJ"]),
  identity: z.object({ type: z.literal("SYNTHETIC"), value: z.string().min(1).max(160) }),
  legalName: z.string().min(1).max(500),
  tradeName: z.string().max(500).nullable().optional(),
  roles: z.array(personRole).min(1),
  registrationStatus: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  businessActivity: z.string().max(500).nullable().optional(),
  companyType: z.string().max(100).nullable().optional(),
  cnaes: z.array(z.string().max(50)).default([]),
  email: z.string().email().nullable().optional(),
  sourceUnitCode: z.string().min(1).max(50),
  targetUnitCode: z.string().min(1).max(50),
}).strict();

const instrumentItemPayloadSchema = z.object({
  sourceItemId: z.string().min(1),
  description: z.string().min(1).max(2_000),
  unit: z.string().min(1).max(50),
  quantity: decimalString,
  unitPrice: decimalString.nullable(),
  totalAmount: decimalString.nullable(),
}).strict();

const commonInstrumentPayload = {
  number: z.string().min(1).max(120),
  year: z.number().int().min(2000).max(2200),
  sourceUnitCode: z.string().min(1).max(50),
  targetUnitCode: z.string().min(1).max(50),
  object: z.string().min(1).max(5_000),
  signedOn: dateOnly,
  validFrom: dateOnly,
  validUntil: dateOnly,
  status: z.string().min(1).max(100),
  currency: z.literal("BRL"),
  initialAmount: decimalString,
  currentAmount: decimalString,
  items: z.array(instrumentItemPayloadSchema),
  changes: z.array(z.unknown()).default([]),
  documentReferences: z.array(z.unknown()).default([]),
};

const contractInstrumentPayloadSchema = z.object({
  ...commonInstrumentPayload,
  instrumentType: z.literal("CONTRACT"),
  processReference: z.string().min(1).max(160),
  parties: z.array(z.object({ sourcePersonId: z.string().min(1), role: z.literal("SUPPLIER") }).strict()).min(1),
}).strict();

const agreementInstrumentPayloadSchema = z.object({
  ...commonInstrumentPayload,
  instrumentType: z.literal("AGREEMENT"),
  // Covenant has no mandatory purchase-process or grantor-unit relation in the canonical source.
  processReference: z.string().min(1).max(160).nullable().optional(),
  parties: z.array(z.object({ sourcePersonId: z.string().min(1), role: z.string().min(1).max(120) }).strict()),
  grantor: z.string().min(1).max(500).nullable().optional(),
  grantorUnitCode: z.string().min(1).max(50).nullable().optional(),
  transferAmount: decimalString.nullable().optional(),
  counterpartAmount: decimalString.nullable().optional(),
}).strict();

const instrumentPayloadSchema = z.discriminatedUnion("instrumentType", [
  contractInstrumentPayloadSchema,
  agreementInstrumentPayloadSchema,
]);

const commonEnvelope = {
  protocol: z.literal(SIAFIC_DEMO_PROTOCOL),
  protocolVersion: z.literal(SIAFIC_DEMO_PROTOCOL_VERSION),
  environment: z.literal("DEMO"),
  eventId: z.string().uuid(),
  sourceInstanceId: z.string().min(3).max(100),
  datasetId: z.string().min(3).max(120),
  entityId: z.string().min(1).max(200),
  entityVersion: positiveInteger,
  deliveryRevision: positiveInteger,
  operation: z.enum(["CREATE", "UPDATE", "BASELINE"]),
  occurredAt: isoInstant,
  dataClassification: z.literal("SYNTHETIC_DEMO"),
  replacesEventId: z.string().uuid().nullable(),
};

export const siaficDemoEnvelopeSchema = z.discriminatedUnion("eventType", [
  z.object({
    ...commonEnvelope,
    entityType: z.literal("PERSON"),
    eventType: z.literal("person.snapshot"),
    payload: personPayloadSchema,
  }).strict(),
  z.object({
    ...commonEnvelope,
    entityType: z.literal("INSTRUMENT"),
    eventType: z.literal("instrument.snapshot"),
    payload: instrumentPayloadSchema,
  }).strict(),
]);

export type SiaficDemoEnvelope = z.infer<typeof siaficDemoEnvelopeSchema>;

export const siaficReceiptSchema = z.object({
  protocol: z.literal(SIAFIC_DEMO_PROTOCOL),
  protocolVersion: z.literal(SIAFIC_DEMO_PROTOCOL_VERSION),
  receiverId: z.string().min(1),
  receiverEnvironment: z.literal("DEMO"),
  eventId: z.string().uuid(),
  sourceInstanceId: z.string().min(1),
  datasetId: z.string().min(1),
  entityType: z.enum(["PERSON", "INSTRUMENT"]),
  entityId: z.string().min(1),
  entityVersion: positiveInteger,
  remoteEntityId: z.string().min(1),
  receiptId: z.string().min(1),
  processingStatus: z.enum(["PROCESSED", "REJECTED", "RECEIVED_PENDING"]),
  processedAt: isoInstant,
  requestHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  simulation: z.literal(true),
  notice: z.literal(SIAFIC_DEMO_NOTICE),
}).strict();

export type SiaficReceipt = z.infer<typeof siaficReceiptSchema>;

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (!value || typeof value !== "object") return JSON.stringify(value) ?? "null";
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableJson(nestedValue)}`)
    .join(",")}}`;
}

export function createSiaficRequestHash(envelope: SiaficDemoEnvelope) {
  return `sha256:${createHash("sha256").update(stableJson(envelope), "utf8").digest("hex")}`;
}

export function createSiaficIdempotencyKey(input: {
  sourceInstanceId: string;
  connectionId: string;
  datasetId: string;
  entityType: "PERSON" | "INSTRUMENT";
  entityId: string;
  entityVersion: number;
  deliveryRevision: number;
}) {
  const hash = createHash("sha256")
    .update(`${input.sourceInstanceId}|${input.connectionId}|${input.datasetId}|${input.entityType}|${input.entityId}|${input.entityVersion}|${input.deliveryRevision}`, "utf8")
    .digest("hex");
  return `siafic-demo:${hash}`;
}

export function decimalText(value: number | null | undefined, scale = 2) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) throw new Error("Valor monetario invalido para o contrato SIAFIC.");
  return value.toFixed(scale);
}

export function calendarDate(value: Date) {
  if (!Number.isFinite(value.valueOf())) throw new Error("Data invalida para o contrato SIAFIC.");
  return value.toISOString().slice(0, 10);
}
