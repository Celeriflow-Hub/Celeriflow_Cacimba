import type { Prisma, PrismaClient } from "@prisma/client";

type ExistingCode = { code: string };

export async function nextYearlyCode({ prisma, key, prefix, existingCodes, padding = 4 }: { prisma: PrismaClient | Prisma.TransactionClient; key: string; prefix: string; existingCodes: ExistingCode[]; padding?: number }) {
  const year = new Date().getFullYear();
  const expression = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const currentMax = existingCodes.reduce((max, { code }) => Math.max(max, Number(expression.exec(code)?.[1]) || 0), 0);
  const counter = await prisma.sequenceCounter.upsert({
    where: { key: `${key}:${year}` },
    create: { key: `${key}:${year}`, value: currentMax + 1 },
    update: { value: { increment: 1 } },
  });
  return `${prefix}-${year}-${String(counter.value).padStart(padding, "0")}`;
}
