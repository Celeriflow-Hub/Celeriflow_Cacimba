import { Prisma } from "@prisma/client";

export class TributarioS3Error extends Error {}

function decimal(value: Prisma.Decimal | string | number, label: string) {
  const parsed = new Prisma.Decimal(String(value));
  if (!parsed.isFinite()) throw new TributarioS3Error(`${label} inválido.`);
  return parsed;
}

export function calculateItbi(input: {
  propertyValue: Prisma.Decimal | string | number;
  transmittedFractionPercent: Prisma.Decimal | string | number;
  ratePercent: Prisma.Decimal | string | number;
  buyerSharesPercent: Array<Prisma.Decimal | string | number>;
}) {
  const propertyValue = decimal(input.propertyValue, "Valor do imóvel").toDecimalPlaces(2);
  const fraction = decimal(input.transmittedFractionPercent, "Fração transmitida");
  const rate = decimal(input.ratePercent, "Alíquota");
  const shares = input.buyerSharesPercent.map((value) => decimal(value, "Participação do adquirente"));

  if (propertyValue.lessThanOrEqualTo(0)) throw new TributarioS3Error("O valor do imóvel deve ser maior que zero.");
  if (fraction.lessThanOrEqualTo(0) || fraction.greaterThan(100)) throw new TributarioS3Error("A fração transmitida deve estar entre 0 e 100%.");
  if (rate.lessThanOrEqualTo(0)) throw new TributarioS3Error("A alíquota deve ser maior que zero.");
  if (!shares.length) throw new TributarioS3Error("Informe ao menos um adquirente.");
  if (shares.some((share) => share.lessThanOrEqualTo(0))) throw new TributarioS3Error("Cada participação deve ser maior que zero.");
  const sharesTotal = shares.reduce((total, share) => total.plus(share), new Prisma.Decimal(0));
  if (!sharesTotal.equals(100)) throw new TributarioS3Error("As participações dos adquirentes devem totalizar exatamente 100%.");

  const taxableBase = propertyValue.mul(fraction).div(100).toDecimalPlaces(2);
  const taxAmount = taxableBase.mul(rate).div(100).toDecimalPlaces(2);
  const allocations = shares.map((share) => ({
    sharePercent: share.toDecimalPlaces(6),
    transmittedValue: taxableBase.mul(share).div(100).toDecimalPlaces(2),
    taxAmount: taxAmount.mul(share).div(100).toDecimalPlaces(2),
  }));

  return { propertyValue, fraction, rate, sharesTotal, taxableBase, taxAmount, allocations };
}

export function dteDeadline(availableAt: Date, days: number) {
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new TributarioS3Error("O prazo deve estar entre 1 e 365 dias.");
  const result = new Date(availableAt);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function resolveDteAcknowledgement(input: {
  availableAt: Date;
  deadlineAt: Date;
  readAt?: Date | null;
  acknowledgedAt?: Date | null;
  tacitAcknowledgedAt?: Date | null;
  now: Date;
}) {
  if (input.acknowledgedAt) return { state: "CIENCIA_EXPRESSA" as const, occurredAt: input.acknowledgedAt };
  if (input.tacitAcknowledgedAt) return { state: "CIENCIA_TACITA" as const, occurredAt: input.tacitAcknowledgedAt };
  if (input.readAt) return { state: "LIDA" as const, occurredAt: input.readAt };
  if (input.now >= input.deadlineAt) return { state: "CIENCIA_TACITA" as const, occurredAt: input.deadlineAt };
  return { state: "PENDENTE" as const, occurredAt: input.availableAt };
}

export function canDeleteDteMessage(input: { retentionRequired: boolean; acknowledged: boolean; signatureRequired: boolean }) {
  return !input.retentionRequired && !input.acknowledged && !input.signatureRequired;
}

export function nextPowerOfAttorneyStatus(current: string, action: "ACEITAR" | "RECUSAR" | "REVOGAR") {
  if (action === "ACEITAR" && current === "PENDENTE_ACEITE") return "ATIVA";
  if (action === "RECUSAR" && current === "PENDENTE_ACEITE") return "RECUSADA";
  if (action === "REVOGAR" && current === "ATIVA") return "REVOGADA";
  throw new TributarioS3Error("A procuração não permite esta transição de situação.");
}
