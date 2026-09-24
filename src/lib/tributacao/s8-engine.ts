import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";

export class TributarioS8Error extends Error {}

const money = (value: Prisma.Decimal | string | number, label: string) => {
  const result = new Prisma.Decimal(String(value));
  if (!result.isFinite() || result.lessThan(0)) throw new TributarioS8Error(`${label} inválido.`);
  return result.toDecimalPlaces(2);
};

const cents = (value: Prisma.Decimal | string | number, label: string) => Number(money(value, label).mul(100).toFixed(0));
const fromCents = (value: number) => new Prisma.Decimal(value).div(100).toDecimalPlaces(2);

export function splitInstallmentAmount(total: Prisma.Decimal | string | number, count: number) {
  if (!Number.isInteger(count) || count < 1) throw new TributarioS8Error("Quantidade de cotas inválida.");
  const totalCents = cents(total, "Total");
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, index) => fromCents(base + (index === count - 1 ? remainder : 0)));
}

export function allocateInstallmentPayment(
  quotas: { id?: string; quotaNumber: number; balance: Prisma.Decimal | string | number }[],
  payment: Prisma.Decimal | string | number,
) {
  let remaining = cents(payment, "Pagamento");
  const allocations = [...quotas].sort((a, b) => a.quotaNumber - b.quotaNumber).map((quota) => {
    const balance = cents(quota.balance, "Saldo da cota");
    const allocated = Math.min(balance, remaining);
    remaining -= allocated;
    return { ...quota, allocated: fromCents(allocated), balanceAfter: fromCents(balance - allocated), status: balance - allocated === 0 ? "QUITADA" : "ABERTA" };
  });
  if (remaining > 0) throw new TributarioS8Error("O pagamento excede o saldo do parcelamento.");
  return { allocations, paid: money(payment, "Pagamento"), totalBalance: allocations.reduce((sum, row) => sum.plus(row.balanceAfter), new Prisma.Decimal(0)).toDecimalPlaces(2) };
}

export function calculateBenefit(input: { amount: Prisma.Decimal | string | number; type: "CREDITO" | "REDUCAO" | "RENUNCIA"; value: Prisma.Decimal | string | number; valueMode?: "PERCENT" | "FIXED" }) {
  const amount = money(input.amount, "Valor original");
  const requested = money(input.value, "Valor do benefício");
  const applied = Prisma.Decimal.min(input.valueMode === "PERCENT" ? amount.mul(requested).div(100) : requested, amount).toDecimalPlaces(2);
  return { amount, credit: input.type === "CREDITO" ? applied : new Prisma.Decimal(0), reduction: input.type === "REDUCAO" ? applied : new Prisma.Decimal(0), renunciation: input.type === "RENUNCIA" ? applied : new Prisma.Decimal(0), finalAmount: amount.minus(applied).toDecimalPlaces(2) };
}

export type PrizeCouponCandidate = { id: string; couponNumber: string; sourceDocumentId: string };
export function executeDeterministicDraw(coupons: PrizeCouponCandidate[], seed: string, winnerCount: number) {
  if (!seed.trim()) throw new TributarioS8Error("A semente técnica é obrigatória.");
  const eligible = [...coupons].sort((a, b) => a.couponNumber.localeCompare(b.couponNumber));
  if (!Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount > eligible.length) throw new TributarioS8Error("Quantidade de ganhadores incompatível com os cupons elegíveis.");
  const inputHash = createHash("sha256").update(JSON.stringify(eligible)).digest("hex");
  const seedHash = createHash("sha256").update(seed).digest("hex");
  const ranked = eligible.map((coupon) => ({ coupon, resultKey: createHash("sha256").update(`${seed}:${coupon.couponNumber}:${coupon.sourceDocumentId}`).digest("hex") })).sort((a, b) => a.resultKey.localeCompare(b.resultKey) || a.coupon.couponNumber.localeCompare(b.coupon.couponNumber));
  const winners = ranked.slice(0, winnerCount);
  const resultHash = createHash("sha256").update(JSON.stringify(winners)).digest("hex");
  return { algorithm: "SHA-256/LEXICOGRAPHIC/V1", seedHash, inputHash, resultHash, winners };
}

export function collectionRanking(input: { taxpayerId: string; outstanding: number; overdueDays: number; successfulContacts: number }[]) {
  return input.map((row) => ({ ...row, score: Math.round(row.outstanding * 100) + Math.max(0, row.overdueDays) * 10 - row.successfulContacts * 1000 })).sort((a, b) => b.score - a.score || a.taxpayerId.localeCompare(b.taxpayerId));
}
