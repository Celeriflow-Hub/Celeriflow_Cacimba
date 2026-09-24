import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export type OperationalSeedReport = { model: string; planned: number; inserted: number };

type CreateManyDelegate = {
  createMany(args: {
    data: Record<string, unknown>[];
    skipDuplicates: boolean;
  }): Promise<{ count: number }>;
};

export function operationalId(prefix: string, value: string) {
  return `${prefix}-${createHash("sha1").update(value).digest("hex").slice(0, 16)}`;
}

export function normalizeOperationalLabel(value: string) {
  return value
    .replace(/\b(?:de\s+)?(?:teste|demo(?:nstra(?:ç|c)[aã]o)?|mock|exemplo|fulano|lorem|sint[eé]tic[oa]s?|simulad[oa]s?|fict[ií]ci[oa]s?|artificial)\b/giu, "")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\s*[·—-]\s*(?=[,.;:]|$)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,.;:·—-]+|[\s,;:·—-]+$/g, "")
    .trim();
}

export async function insertOperationalRows(
  prisma: PrismaClient,
  model: string,
  rows: Record<string, unknown>[],
  reports: OperationalSeedReport[],
) {
  if (!rows.length) return;
  const delegate = (prisma as unknown as Record<string, CreateManyDelegate>)[model];
  if (!delegate?.createMany) throw new Error(`Delegate Prisma não encontrado: ${model}.`);
  const result = await delegate.createMany({ data: rows, skipDuplicates: true });
  reports.push({ model, planned: rows.length, inserted: result.count });
}
