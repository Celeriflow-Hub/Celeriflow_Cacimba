import { Prisma } from "@prisma/client";

export type FiscalFormula = "PERCENTUAL_BASE" | "VALOR_FIXO" | "UNIDADE_FISCAL";

export type FiscalRuleConfiguration = {
  formula: FiscalFormula;
  rate?: string | number;
  fixedValue?: string | number;
  fiscalUnitValue?: string | number;
  fiscalUnits?: string | number;
  indexFactor?: string | number;
  minimumValue?: string | number;
  installments?: number;
  dueDay?: number;
  calendar?: string[];
  version?: number;
  status?: string;
  reference?: string;
  legalBasis?: string;
};

function decimal(value: string | number | Prisma.Decimal | undefined, label: string, allowZero = true) {
  const parsed = new Prisma.Decimal(String(value ?? 0));
  if (!parsed.isFinite() || (allowZero ? parsed.lessThan(0) : parsed.lessThanOrEqualTo(0))) {
    throw new Error(`${label} deve ser ${allowZero ? "não negativo" : "maior que zero"}.`);
  }
  return parsed;
}

export function parseFiscalRuleConfiguration(value: unknown): FiscalRuleConfiguration {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("A configuração fiscal deve ser um objeto.");
  const rule = value as Partial<FiscalRuleConfiguration>;
  if (!rule.formula || !["PERCENTUAL_BASE", "VALOR_FIXO", "UNIDADE_FISCAL"].includes(rule.formula)) {
    throw new Error("A fórmula fiscal informada não é permitida.");
  }
  if (rule.installments !== undefined && (!Number.isInteger(rule.installments) || rule.installments < 1 || rule.installments > 120)) {
    throw new Error("A quantidade de parcelas deve estar entre 1 e 120.");
  }
  if (rule.dueDay !== undefined && (!Number.isInteger(rule.dueDay) || rule.dueDay < 1 || rule.dueDay > 28)) {
    throw new Error("O dia de vencimento deve estar entre 1 e 28.");
  }
  return rule as FiscalRuleConfiguration;
}

export function evaluateFiscalRule(input: {
  taxableBase: string | number | Prisma.Decimal;
  configuration: FiscalRuleConfiguration;
}) {
  const base = decimal(input.taxableBase, "Base de cálculo");
  const rule = parseFiscalRuleConfiguration(input.configuration);
  const indexFactor = decimal(rule.indexFactor ?? 1, "Índice", false);
  const indexedBase = base.mul(indexFactor).toDecimalPlaces(2);
  let calculated: Prisma.Decimal;
  if (rule.formula === "PERCENTUAL_BASE") {
    calculated = indexedBase.mul(decimal(rule.rate, "Alíquota")).div(100);
  } else if (rule.formula === "VALOR_FIXO") {
    calculated = decimal(rule.fixedValue, "Valor fixo").mul(indexFactor);
  } else {
    calculated = decimal(rule.fiscalUnitValue, "Unidade fiscal").mul(decimal(rule.fiscalUnits, "Quantidade de unidades"));
  }
  const minimumValue = decimal(rule.minimumValue ?? 0, "Valor mínimo");
  const principal = Prisma.Decimal.max(calculated.toDecimalPlaces(2), minimumValue).toDecimalPlaces(2);
  const installments = rule.installments ?? 1;
  const installmentBase = principal.div(installments).toDecimalPlaces(2);
  const remainder = principal.minus(installmentBase.mul(installments));
  const schedule = Array.from({ length: installments }, (_, index) => ({
    number: index + 1,
    amount: (index === installments - 1 ? installmentBase.plus(remainder) : installmentBase).toDecimalPlaces(2),
    dueDate: rule.calendar?.[index] ?? null,
  }));
  return {
    principal,
    schedule,
    memory: {
      formula: rule.formula,
      taxableBase: base.toFixed(2),
      indexFactor: indexFactor.toString(),
      indexedBase: indexedBase.toFixed(2),
      rate: rule.rate === undefined ? null : String(rule.rate),
      fixedValue: rule.fixedValue === undefined ? null : String(rule.fixedValue),
      fiscalUnitValue: rule.fiscalUnitValue === undefined ? null : String(rule.fiscalUnitValue),
      fiscalUnits: rule.fiscalUnits === undefined ? null : String(rule.fiscalUnits),
      minimumValue: minimumValue.toFixed(2),
      principal: principal.toFixed(2),
      installments,
      version: rule.version ?? 1,
      reference: rule.reference ?? null,
      legalBasis: rule.legalBasis ?? null,
    },
  };
}

export function calculateSimpleAccruals(input: {
  principal: string | number | Prisma.Decimal;
  correctionFactor?: string | number | Prisma.Decimal;
  monthlyInterestRate?: string | number | Prisma.Decimal;
  monthsLate?: number;
  penaltyRate?: string | number | Prisma.Decimal;
}) {
  const principal = decimal(input.principal, "Principal");
  const correctionFactor = decimal(input.correctionFactor ?? 1, "Índice de correção", false);
  const correctedPrincipal = principal.mul(correctionFactor).toDecimalPlaces(2);
  const correction = correctedPrincipal.minus(principal).toDecimalPlaces(2);
  const monthsLate = input.monthsLate ?? 0;
  if (!Number.isInteger(monthsLate) || monthsLate < 0) throw new Error("O período de atraso deve ser informado em meses inteiros.");
  const monthlyRate = decimal(input.monthlyInterestRate ?? 0, "Juros mensais");
  const interest = principal.mul(monthlyRate).div(100).mul(monthsLate).toDecimalPlaces(2);
  const penalty = principal.mul(decimal(input.penaltyRate ?? 0, "Multa")).div(100).toDecimalPlaces(2);
  return { principal, correction, interest, penalty, total: principal.plus(correction).plus(interest).plus(penalty).toDecimalPlaces(2) };
}

export function calculateAccountBalance(input: {
  constituted: string | number | Prisma.Decimal;
  revisions?: Array<string | number | Prisma.Decimal>;
  payments?: Array<{ idempotencyKey: string; amount: string | number | Prisma.Decimal }>;
  nonFinancialExtinctions?: Array<string | number | Prisma.Decimal>;
}) {
  const constituted = decimal(input.constituted, "Crédito constituído");
  const revisions = (input.revisions ?? []).reduce<Prisma.Decimal>((sum, value) => sum.plus(new Prisma.Decimal(String(value))), new Prisma.Decimal(0));
  const uniquePayments = new Map<string, Prisma.Decimal>();
  for (const payment of input.payments ?? []) {
    if (!uniquePayments.has(payment.idempotencyKey)) uniquePayments.set(payment.idempotencyKey, decimal(payment.amount, "Pagamento"));
  }
  const paid = [...uniquePayments.values()].reduce<Prisma.Decimal>((sum, value) => sum.plus(value), new Prisma.Decimal(0));
  const extinct = (input.nonFinancialExtinctions ?? []).reduce<Prisma.Decimal>((sum, value) => sum.plus(decimal(value, "Extinção")), new Prisma.Decimal(0));
  const total = constituted.plus(revisions).toDecimalPlaces(2);
  const balance = Prisma.Decimal.max(total.minus(paid).minus(extinct), 0).toDecimalPlaces(2);
  return { constituted, revisions: revisions.toDecimalPlaces(2), total, paid: paid.toDecimalPlaces(2), extinct: extinct.toDecimalPlaces(2), balance };
}
