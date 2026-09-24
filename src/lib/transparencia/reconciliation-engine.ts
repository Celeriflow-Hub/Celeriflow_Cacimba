/**
 * reconciliation-engine.ts
 * 
 * Motor de Reconciliação entre o Portal da Transparência Pública 
 * e a Contabilidade Interna (1:1), garantindo divergência R$ 0,00 
 * antes e depois da publicação de demonstrativos orçamentários e fiscais.
 */

import type { PrismaClient } from "@prisma/client";
import { generateRREO } from "@/lib/financeiro/relatorios-legais";

export type ReconciliationResult = {
  financialYearId: string;
  year: number;
  reconciledAt: string;
  isReconciled: boolean;
  divergenceTotal: number;
  checks: {
    name: string;
    internalValue: number;
    publicValue: number;
    difference: number;
    status: "MATCH" | "DIVERGENCE";
  }[];
};

export async function reconcilePublicAndInternalData(
  db: PrismaClient,
  financialYearId: string,
): Promise<ReconciliationResult> {
  const financialYear = await db.financialYear.findUnique({
    where: { id: financialYearId },
    select: { id: true, year: true },
  });

  if (!financialYear) {
    throw new Error("Exercício financeiro não encontrado para reconciliação.");
  }

  // 1. Apuração Contábil Interna
  const internalRREO = await generateRREO(db, { financialYearId });
  const internalTotalCommitted = internalRREO.expenseSummary.reduce((s, e) => s + e.committedValue, 0);
  const internalTotalSettled = internalRREO.expenseSummary.reduce((s, e) => s + e.settledValue, 0);
  const internalTotalPaid = internalRREO.expenseSummary.reduce((s, e) => s + e.paidValue, 0);
  const internalTotalRevenueCollected = internalRREO.revenueSummary.reduce((s, r) => s + r.realizedValue, 0);

  // 2. Apuração Portal Público (soma dos fatos expostos publicamente)
  const [publicCommitments, publicSettlements, publicPayments, publicRevenues] = await Promise.all([
    db.commitment.findMany({
      where: {
        appropriation: { financialYearId },
        status: { in: ["Emitido", "Liquidado", "Pago"] },
      },
      select: { valueDecimal: true, value: true },
    }),
    db.settlement.findMany({
      where: {
        commitment: { appropriation: { financialYearId } },
        status: "Liquidado",
      },
      select: { valueDecimal: true, value: true },
    }),
    db.payment.findMany({
      where: {
        commitment: { appropriation: { financialYearId } },
        status: { in: ["Pago", "Paga"] },
      },
      select: { valueDecimal: true, value: true },
    }),
    db.revenue.findMany({
      where: {
        financialYearId,
        stage: "ARRECADADA",
      },
      select: { valueDecimal: true, value: true, classification: true },
    }),
  ]);

  const publicTotalCommitted = publicCommitments.reduce((s, c) => s + Number(c.valueDecimal ?? c.value), 0);
  const publicTotalSettled = publicSettlements.reduce((s, st) => s + Number(st.valueDecimal ?? st.value), 0);
  const publicTotalPaid = publicPayments.reduce((s, p) => s + Number(p.valueDecimal ?? p.value), 0);
  const publicTotalRevenueCollected = publicRevenues.reduce(
    (s, r) => s + Number(r.valueDecimal ?? r.value) * (r.classification === "REDUTORA" ? -1 : 1),
    0,
  );

  const diffCommitted = Math.abs(internalTotalCommitted - publicTotalCommitted);
  const diffSettled = Math.abs(internalTotalSettled - publicTotalSettled);
  const diffPaid = Math.abs(internalTotalPaid - publicTotalPaid);
  const diffRevenue = Math.abs(internalTotalRevenueCollected - publicTotalRevenueCollected);

  const totalDivergence = diffCommitted + diffSettled + diffPaid + diffRevenue;
  const isReconciled = totalDivergence < 0.01;

  const checks: ReconciliationResult["checks"] = [
    {
      name: "Total de Despesa Empenhada",
      internalValue: internalTotalCommitted,
      publicValue: publicTotalCommitted,
      difference: diffCommitted,
      status: diffCommitted < 0.01 ? "MATCH" : "DIVERGENCE",
    },
    {
      name: "Total de Despesa Liquidada",
      internalValue: internalTotalSettled,
      publicValue: publicTotalSettled,
      difference: diffSettled,
      status: diffSettled < 0.01 ? "MATCH" : "DIVERGENCE",
    },
    {
      name: "Total de Despesa Paga",
      internalValue: internalTotalPaid,
      publicValue: publicTotalPaid,
      difference: diffPaid,
      status: diffPaid < 0.01 ? "MATCH" : "DIVERGENCE",
    },
    {
      name: "Total de Receita Arrecadada",
      internalValue: internalTotalRevenueCollected,
      publicValue: publicTotalRevenueCollected,
      difference: diffRevenue,
      status: diffRevenue < 0.01 ? "MATCH" : "DIVERGENCE",
    },
  ];

  return {
    financialYearId,
    year: financialYear.year,
    reconciledAt: new Date().toISOString(),
    isReconciled,
    divergenceTotal: totalDivergence,
    checks,
  };
}
