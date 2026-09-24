import { Prisma, type PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export type RetentionRuleInput = {
  type: string;
  description?: string;
  calculationBasePercentage: Prisma.Decimal | number;
  ratePercentage: Prisma.Decimal | number;
};

type RetentionRuleCriteria = {
  financialYearId: string;
  date: Date;
  serviceCode?: string;
  ruleIds?: string[];
};

function percentage(value: Prisma.Decimal | number, field: string) {
  const decimal = new Prisma.Decimal(value);
  if (!decimal.isFinite() || decimal.lessThan(0) || decimal.greaterThan(100)) {
    throw new Error(`${field} deve estar entre 0% e 100%.`);
  }
  return decimal;
}

export function calculateRetentions(
  grossValue: Prisma.Decimal | number,
  rules: RetentionRuleInput[],
) {
  const gross = new Prisma.Decimal(grossValue);
  if (!gross.isFinite() || gross.lessThanOrEqualTo(0)) {
    throw new Error("O valor bruto deve ser maior que zero para calcular retenções.");
  }

  return rules.map((rule) => {
    const calculationBasePercentage = percentage(rule.calculationBasePercentage, "A base de cálculo da retenção");
    const ratePercentage = percentage(rule.ratePercentage, "A alíquota da retenção");
    const base = gross.mul(calculationBasePercentage).div(100);
    const retainedValue = base.mul(ratePercentage).div(100).toDecimalPlaces(2);

    return {
      type: rule.type,
      baseValue: base.toDecimalPlaces(2),
      retainedValue,
      ratePercentage,
    };
  });
}

export async function getActiveRetentionRules(tx: Db, criteria: RetentionRuleCriteria) {
  if (Number.isNaN(criteria.date.getTime())) throw new Error("Data de referência inválida para cálculo de retenções.");

  const ruleIds = [...new Set(criteria.ruleIds ?? [])];
  const rules = await tx.retentionRule.findMany({
    where: {
      isActive: true,
      effectiveFrom: { lte: criteria.date },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: criteria.date } },
      ],
      AND: [
        {
          OR: [
            { financialYearId: null },
            { financialYearId: criteria.financialYearId },
          ],
        },
        criteria.serviceCode
          ? { OR: [{ serviceCode: null }, { serviceCode: criteria.serviceCode }] }
          : { serviceCode: null },
        ruleIds.length ? { id: { in: ruleIds } } : {},
      ],
    },
    orderBy: [{ serviceCode: "asc" }, { code: "asc" }],
  });

  if (ruleIds.length !== rules.length) {
    throw new Error("Uma ou mais regras de retenção estão inativas, vencidas ou não se aplicam ao serviço e exercício informados.");
  }
  return rules;
}

export function calculateRetentionDueDate(referenceDate: Date, dueDays: number | null) {
  if (!dueDays) return undefined;
  const dueDate = new Date(referenceDate);
  dueDate.setUTCDate(dueDate.getUTCDate() + dueDays);
  return dueDate;
}
