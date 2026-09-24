import { Prisma } from "@prisma/client";

export class TributarioS4Error extends Error {}
const dec = (value: Prisma.Decimal | string | number, label: string) => { const parsed = new Prisma.Decimal(String(value)); if (!parsed.isFinite()) throw new TributarioS4Error(`${label} inválido.`); return parsed; };

export function calculateNfse(input: { serviceValue: Prisma.Decimal | string | number; deductions: Prisma.Decimal | string | number; ratePercent: Prisma.Decimal | string | number; retained: boolean }) {
  const serviceValue = dec(input.serviceValue, "Valor do serviço").toDecimalPlaces(2);
  const deductions = dec(input.deductions, "Deduções").toDecimalPlaces(2);
  const rate = dec(input.ratePercent, "Alíquota").toDecimalPlaces(6);
  if (serviceValue.lessThanOrEqualTo(0)) throw new TributarioS4Error("O valor do serviço deve ser maior que zero.");
  if (deductions.lessThan(0) || deductions.greaterThan(serviceValue)) throw new TributarioS4Error("As deduções devem estar entre zero e o valor do serviço.");
  if (rate.lessThanOrEqualTo(0) || rate.greaterThan(100)) throw new TributarioS4Error("A alíquota deve estar entre zero e 100%.");
  const taxableBase = serviceValue.minus(deductions).toDecimalPlaces(2);
  const iss = taxableBase.mul(rate).div(100).toDecimalPlaces(2);
  return { serviceValue, deductions, taxableBase, rate, iss, ownIss: input.retained ? new Prisma.Decimal(0) : iss, retainedIss: input.retained ? iss : new Prisma.Decimal(0) };
}

export function apportionIss(rows: { ownIss: Prisma.Decimal | string | number; retainedIss: Prisma.Decimal | string | number }[]) {
  return rows.reduce<{ ownIss: Prisma.Decimal; retainedIss: Prisma.Decimal }>((total, row) => ({ ownIss: total.ownIss.plus(row.ownIss), retainedIss: total.retainedIss.plus(row.retainedIss) }), { ownIss: new Prisma.Decimal(0), retainedIss: new Prisma.Decimal(0) });
}

const correctionFields = new Set(["serviceDescription", "contactEmail", "serviceAddress", "additionalInformation"]);
export function validateCorrectionChanges(changes: Record<string, string>) {
  const entries = Object.entries(changes).filter(([, value]) => value.trim());
  if (!entries.length) throw new TributarioS4Error("Informe ao menos uma correção.");
  const invalid = entries.filter(([key]) => !correctionFields.has(key)).map(([key]) => key);
  if (invalid.length) throw new TributarioS4Error(`Carta de correção não pode alterar: ${invalid.join(", ")}.`);
  return Object.fromEntries(entries);
}
