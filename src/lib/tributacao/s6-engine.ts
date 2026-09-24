import { Prisma } from "@prisma/client";

export class TributarioS6Error extends Error {}

function decimal(value: Prisma.Decimal | string | number, label: string) {
  const result = new Prisma.Decimal(String(value));
  if (!result.isFinite() || result.lessThan(0)) throw new TributarioS6Error(`${label} deve ser um número não negativo.`);
  return result.toDecimalPlaces(2);
}

export function calculateDesifAssessment(input: {
  revenue: Prisma.Decimal | string | number;
  deduction?: Prisma.Decimal | string | number;
  rate: Prisma.Decimal | string | number;
  credit?: Prisma.Decimal | string | number;
  debitAdjustment?: Prisma.Decimal | string | number;
}) {
  const revenue = decimal(input.revenue, "Receita");
  const deduction = decimal(input.deduction ?? 0, "Dedução");
  const rate = decimal(input.rate, "Alíquota");
  const credit = decimal(input.credit ?? 0, "Crédito");
  const debitAdjustment = decimal(input.debitAdjustment ?? 0, "Ajuste de débito");
  if (deduction.greaterThan(revenue)) throw new TributarioS6Error("A dedução não pode superar a receita.");
  const taxableBase = revenue.minus(deduction).toDecimalPlaces(2);
  const grossTax = taxableBase.mul(rate).div(100).toDecimalPlaces(2);
  const taxDue = grossTax.plus(debitAdjustment).minus(credit).toDecimalPlaces(2);
  if (taxDue.lessThan(0)) throw new TributarioS6Error("O crédito não pode gerar imposto negativo nesta apuração.");
  return { revenue, deduction, taxableBase, rate, grossTax, credit, debitAdjustment, taxDue };
}

export function calculateTrialBalance(input: {
  openingBalance: Prisma.Decimal | string | number;
  credits: Prisma.Decimal | string | number;
  debits: Prisma.Decimal | string | number;
  declaredClose: Prisma.Decimal | string | number;
  nature: "CREDORA" | "DEVEDORA";
}) {
  const openingBalance = decimal(input.openingBalance, "Saldo inicial");
  const credits = decimal(input.credits, "Créditos");
  const debits = decimal(input.debits, "Débitos");
  const declaredClose = decimal(input.declaredClose, "Saldo final declarado");
  const calculatedClose = (input.nature === "CREDORA" ? openingBalance.plus(credits).minus(debits) : openingBalance.plus(debits).minus(credits)).toDecimalPlaces(2);
  const difference = declaredClose.minus(calculatedClose).abs().toDecimalPlaces(2);
  return { openingBalance, credits, debits, calculatedClose, declaredClose, difference, consistent: difference.isZero() };
}

export function calculatePackageMovement(input: {
  accountHolders: number;
  tariffAmount: Prisma.Decimal | string | number;
  quantity?: number;
  collectedRevenue: Prisma.Decimal | string | number;
  rate: Prisma.Decimal | string | number;
}) {
  if (!Number.isInteger(input.accountHolders) || input.accountHolders < 0) throw new TributarioS6Error("A quantidade de correntistas deve ser inteira e não negativa.");
  const quantity = input.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1) throw new TributarioS6Error("A quantidade da tarifa deve ser inteira e positiva.");
  const tariffAmount = decimal(input.tariffAmount, "Tarifa");
  const collectedRevenue = decimal(input.collectedRevenue, "Receita arrecadada");
  const rate = decimal(input.rate, "Alíquota");
  const potentialRevenue = tariffAmount.mul(quantity).mul(input.accountHolders).toDecimalPlaces(2);
  const difference = Prisma.Decimal.max(potentialRevenue.minus(collectedRevenue), 0).toDecimalPlaces(2);
  const assessmentImpact = difference.mul(rate).div(100).toDecimalPlaces(2);
  return { potentialRevenue, collectedRevenue, difference, assessmentImpact };
}

export function canIssueDesifReceipt(status: string, processedAt?: Date | null) {
  return status === "PROCESSADO" && Boolean(processedAt);
}
