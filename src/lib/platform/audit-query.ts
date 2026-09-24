import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { auditEventTypes, type AuditEventType } from "./audit-evidence";

export const auditEventPageSize = 20;

export type AuditEventFilters = {
  actorUsuarioId?: string;
  eventType?: AuditEventType;
  targetType?: string;
  targetId?: string;
  from?: string;
  to?: string;
};

export type AuditEventCursor = {
  id: string;
  createdAt: Date;
};

export type AuditEventQuery = {
  filters: AuditEventFilters;
  cursor?: AuditEventCursor;
  direction: "next" | "previous";
};

type AuditSearchParams = Record<string, string | string[] | undefined>;

const eventTypes = Object.values(auditEventTypes) as [AuditEventType, ...AuditEventType[]];
const identifierSchema = z.string().trim().min(1).max(191);
const targetTypeSchema = z.string().trim().min(1).max(100);
const targetIdSchema = z.string().trim().min(1).max(400);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function readSingleValue(searchParams: AuditSearchParams, name: string) {
  const value = searchParams[name];
  if (Array.isArray(value)) throw new Error(`Parâmetro ${name} inválido.`);
  return value?.trim() || undefined;
}

function parseOptionalValue<T extends string>(
  searchParams: AuditSearchParams,
  name: string,
  schema: z.ZodType<T>,
) {
  const value = readSingleValue(searchParams, name);
  if (!value) return undefined;
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error(`Parâmetro ${name} inválido.`);
  return parsed.data;
}

function parseDate(value: string, name: "from" | "to") {
  if (!dateSchema.safeParse(value).success) throw new Error(`Parâmetro ${name} inválido.`);

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Parâmetro ${name} inválido.`);
  }
  return date;
}

function parseCursor(value: string): AuditEventCursor {
  const separator = value.lastIndexOf("|");
  if (separator <= 0 || separator === value.length - 1) throw new Error("Parâmetro cursor inválido.");

  const createdAt = new Date(value.slice(0, separator));
  const id = value.slice(separator + 1);
  if (Number.isNaN(createdAt.getTime()) || createdAt.toISOString() !== value.slice(0, separator) || !identifierSchema.safeParse(id).success) {
    throw new Error("Parâmetro cursor inválido.");
  }
  return { createdAt, id };
}

export function encodeAuditEventCursor(cursor: AuditEventCursor) {
  return `${cursor.createdAt.toISOString()}|${cursor.id}`;
}

export function normalizeAuditEventFilters(searchParams: AuditSearchParams): AuditEventFilters {
  const eventType = parseOptionalValue(searchParams, "eventType", z.enum(eventTypes));
  const from = parseOptionalValue(searchParams, "from", dateSchema);
  const to = parseOptionalValue(searchParams, "to", dateSchema);
  if (from && to && parseDate(from, "from") > parseDate(to, "to")) {
    throw new Error("O período de auditoria é inválido.");
  }

  return {
    actorUsuarioId: parseOptionalValue(searchParams, "actorUsuarioId", identifierSchema),
    eventType,
    targetType: parseOptionalValue(searchParams, "targetType", targetTypeSchema),
    targetId: parseOptionalValue(searchParams, "targetId", targetIdSchema),
    from,
    to,
  };
}

export function parseAuditEventQuery(searchParams: AuditSearchParams): AuditEventQuery {
  const cursorValue = readSingleValue(searchParams, "cursor");
  const direction = readSingleValue(searchParams, "direction");
  if (direction && direction !== "previous") throw new Error("Parâmetro direction inválido.");

  return {
    filters: normalizeAuditEventFilters(searchParams),
    cursor: cursorValue ? parseCursor(cursorValue) : undefined,
    direction: direction === "previous" ? "previous" : "next",
  };
}

export function buildAuditEventWhere(filters: AuditEventFilters): Prisma.AuditEventWhereInput {
  const where: Prisma.AuditEventWhereInput = {};
  if (filters.actorUsuarioId) where.actorUsuarioId = filters.actorUsuarioId;
  if (filters.eventType) where.eventType = filters.eventType;
  if (filters.targetType) where.targetType = filters.targetType;
  if (filters.targetId) where.targetId = filters.targetId;
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: parseDate(filters.from, "from") } : {}),
      ...(filters.to ? { lte: new Date(parseDate(filters.to, "to").getTime() + 24 * 60 * 60 * 1000 - 1) } : {}),
    };
  }
  return where;
}

export function buildAuditEventPageQuery(query: AuditEventQuery): Prisma.AuditEventFindManyArgs {
  const baseWhere = buildAuditEventWhere(query.filters);
  const cursorWhere = query.cursor && {
    OR: query.direction === "previous"
      ? [
          { createdAt: { gt: query.cursor.createdAt } },
          { createdAt: query.cursor.createdAt, id: { gt: query.cursor.id } },
        ]
      : [
          { createdAt: { lt: query.cursor.createdAt } },
          { createdAt: query.cursor.createdAt, id: { lt: query.cursor.id } },
        ],
  };

  return {
    where: cursorWhere ? { AND: [baseWhere, cursorWhere] } : baseWhere,
    orderBy: query.direction === "previous"
      ? [{ createdAt: "asc" }, { id: "asc" }]
      : [{ createdAt: "desc" }, { id: "desc" }],
    take: auditEventPageSize + 1,
  };
}

type CursorRecord = AuditEventCursor;

export function createAuditEventPage<T extends CursorRecord>(records: T[], query: AuditEventQuery) {
  const hasAdjacentPage = records.length > auditEventPageSize;
  const events = records.slice(0, auditEventPageSize);
  if (query.direction === "previous") events.reverse();
  const firstEvent = events[0];
  const lastEvent = events.at(-1);

  const hasPrevious = query.direction === "previous" ? hasAdjacentPage : Boolean(query.cursor);
  const hasNext = query.direction === "previous" ? Boolean(query.cursor) : hasAdjacentPage;
  return {
    events,
    previousCursor: hasPrevious && firstEvent ? encodeAuditEventCursor(firstEvent) : undefined,
    nextCursor: hasNext && lastEvent ? encodeAuditEventCursor(lastEvent) : undefined,
  };
}

export function createAuditEventSearchParams(
  filters: AuditEventFilters,
  pagination?: { cursor?: AuditEventCursor | string; direction?: AuditEventQuery["direction"] },
) {
  const searchParams = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value) searchParams.set(name, value);
  }
  if (pagination?.cursor) {
    searchParams.set("cursor", typeof pagination.cursor === "string" ? pagination.cursor : encodeAuditEventCursor(pagination.cursor));
  }
  if (pagination?.direction === "previous") searchParams.set("direction", "previous");
  return searchParams;
}
