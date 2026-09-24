import type { Prisma, PrismaClient } from "@prisma/client";

type Database = PrismaClient | Prisma.TransactionClient;

export type CatalogMaterialType = "MATERIAL" | "PATRIMONIO";

export function isCatalogMaterialType(value: string): value is CatalogMaterialType {
  return value === "MATERIAL" || value === "PATRIMONIO";
}

export function materialTypeLabel(type: CatalogMaterialType | string) {
  return type === "PATRIMONIO" ? "Patrimônio" : "Material";
}

function formatCode(prefix: string, value: number) {
  return `${prefix}${String(value).padStart(5, "0")}`;
}

function maximumCode(codes: string[], prefix: string) {
  const expression = new RegExp(`^${prefix}(\\d+)$`);
  return codes.reduce((maximum, code) => Math.max(maximum, Number(expression.exec(code)?.[1]) || 0), 0);
}

async function nextSequentialCode(db: Database, key: string, prefix: string, existingCodes: string[]) {
  const currentMaximum = maximumCode(existingCodes, prefix);
  const counter = await db.sequenceCounter.upsert({
    where: { key },
    create: { key, value: currentMaximum + 1 },
    update: { value: { increment: 1 } },
    select: { value: true },
  });
  return formatCode(prefix, counter.value);
}

export async function nextMaterialCode(db: Database, type: CatalogMaterialType) {
  const prefix = type === "PATRIMONIO" ? "PAT" : "MAT";
  const materials = await db.material.findMany({ where: { code: { startsWith: prefix } }, select: { code: true } });
  return nextSequentialCode(db, `patrimonio-material-${type.toLowerCase()}`, prefix, materials.map((material) => material.code));
}

export async function nextAssetPatrimonyNumber(db: Database) {
  const assets = await db.asset.findMany({ select: { patrimonyNumber: true } });
  return nextSequentialCode(db, "patrimonio-asset", "PAT", assets.map((asset) => asset.patrimonyNumber));
}

export async function previewNextAssetPatrimonyNumber(db: Database) {
  const assets = await db.asset.findMany({ select: { patrimonyNumber: true } });
  return formatCode("PAT", maximumCode(assets.map((asset) => asset.patrimonyNumber), "PAT") + 1);
}
