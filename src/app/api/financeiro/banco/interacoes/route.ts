import { NextRequest, NextResponse } from "next/server";
import { updatePaymentStatus, reversePayment } from "@/lib/financeiro";
import { bankIntegrationClient } from "@/lib/financeiro/bank-integration-client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stringField(payload: Record<string, unknown>, field: string) {
  const value = payload[field];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function moneyField(payload: Record<string, unknown>, field: string) {
  const value = payload[field];
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) ? number : null;
}

export async function POST(request: NextRequest) {
  const secret = process.env.BANK_SYNC_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const actor = await prisma.usuario.findFirst({
    where: { ativo: true, employeeId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, employeeId: true },
  });
  if (!actor?.employeeId) return NextResponse.json({ error: "Usuário técnico financeiro não configurado." }, { status: 503 });

  const interactions = await bankIntegrationClient.fetchPendingInteractions();
  let completed = 0;
  for (const interaction of interactions) {
    if (interaction.interactionType !== "PAYMENT_ORDER_STATUS_CHANGED") continue;
    const paymentOrderExternalId = stringField(interaction.payload, "payment_order_external_id");
    const status = stringField(interaction.payload, "status");
    if (!paymentOrderExternalId || !status) {
      await bankIntegrationClient.acknowledgeInteraction(interaction.externalId, "FAILED", "Retorno de pagamento sem identificadores obrigatórios.");
      continue;
    }

    try {
      const payment = await prisma.payment.findUnique({
        where: { paymentOrderExternalId },
        select: { id: true, status: true, bankTransactionId: true, integrationEventId: true, bankAccountExternalId: true, netValueDecimal: true },
      });
      if (!payment) throw new Error("Ordem de pagamento não encontrada no CeleriFlow.");
      const bankTransactionId = stringField(interaction.payload, "bank_transaction_id");
      const processedAt = stringField(interaction.payload, "processed_at");
      const integrationEventId = stringField(interaction.payload, "integration_event_id");
      const bankAccountExternalId = stringField(interaction.payload, "bank_account_external_id");
      const amount = moneyField(interaction.payload, "amount");
      if (integrationEventId !== payment.integrationEventId || bankAccountExternalId !== payment.bankAccountExternalId) {
        throw new Error("Retorno bancário não corresponde à ordem de pagamento emitida.");
      }
      if (amount === null || Number(payment.netValueDecimal) !== amount) throw new Error("Valor do retorno bancário não corresponde ao valor líquido da ordem.");

      if (status === "SETTLED") {
        if (payment.status !== "Paga") await updatePaymentStatus(prisma, { usuarioId: actor.id, employeeId: actor.employeeId }, payment.id, "Paga");
        await prisma.payment.update({ where: { id: payment.id }, data: { bankStatus: status, bankTransactionId: bankTransactionId ?? payment.bankTransactionId, bankProcessedAt: processedAt ? new Date(processedAt) : new Date() } });
      } else if (status === "REJECTED" || status === "PENDING" || status === "RECEIVED") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            bankStatus: status,
            bankRejectionCode: stringField(interaction.payload, "rejection_code") ?? undefined,
            bankRejectionMessage: stringField(interaction.payload, "rejection_message") ?? undefined,
          },
        });
      } else if (status === "REVERSED") {
        if (payment.status !== "Paga") throw new Error("O estorno bancário não possui pagamento liquidado correspondente.");
        if (!bankTransactionId || bankTransactionId !== payment.bankTransactionId) throw new Error("O estorno bancário não referencia a transação original liquidada.");
        const reversalBankTransactionId = stringField(interaction.payload, "reversal_bank_transaction_id");
        if (!reversalBankTransactionId) throw new Error("O estorno bancário não informou a nova transação de crédito.");
        await reversePayment(prisma, { usuarioId: actor.id, employeeId: actor.employeeId }, payment.id, `Estorno confirmado pelo Banco Virtual: ${bankTransactionId ?? interaction.externalId}`);
        await prisma.payment.update({ where: { id: payment.id }, data: { bankStatus: status, reversalOfBankTransactionId: bankTransactionId, reversalBankTransactionId, bankProcessedAt: processedAt ? new Date(processedAt) : new Date() } });
      } else {
        throw new Error(`Status bancário não suportado: ${status}.`);
      }

      await bankIntegrationClient.acknowledgeInteraction(interaction.externalId, "COMPLETED");
      completed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao processar retorno bancário.";
      await bankIntegrationClient.acknowledgeInteraction(interaction.externalId, "FAILED", message);
    }
  }
  return NextResponse.json({ completed });
}
