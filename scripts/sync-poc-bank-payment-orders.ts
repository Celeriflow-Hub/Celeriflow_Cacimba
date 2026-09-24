import "dotenv/config";
import { createHash } from "crypto";
import { pocBankAccountExternalId, isPocVirtualBank } from "../src/lib/poc/poc-config";

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

async function main() {
  const [{ prisma }, { BankIntegrationClient }, { updatePaymentStatus, reversePayment }] = await Promise.all([
    import("../src/lib/prisma"),
    import("../src/lib/financeiro/bank-integration-client"),
    import("../src/lib/financeiro"),
  ]);
  const actor = await prisma.usuario.findFirst({
    where: { ativo: true, employeeId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, employeeId: true },
  });
  if (!actor?.employeeId) throw new Error("A sincronizacao exige um usuario ativo vinculado a servidor.");

  const client = new BankIntegrationClient();
  const emittedPayments = await prisma.payment.findMany({
    where: { status: "Emitida", bankAccount: { isActive: true } },
    include: {
      bankAccount: { select: { bankName: true, agency: true, accountNumber: true } },
      supplier: { include: { company: { select: { corporateName: true, cnpj: true } } } },
    },
  });

  let submitted = 0;
  for (const payment of emittedPayments) {
    if (!isPocVirtualBank(payment.bankAccount.bankName)) continue;
    const externalAccountId = pocBankAccountExternalId(payment.bankAccount.accountNumber);
    if (!externalAccountId) throw new Error(`Conta ${payment.bankAccount.accountNumber} nao pertence a matriz bancária da POC.`);
    const paymentOrderExternalId = payment.orderNumber.startsWith("OP-") ? payment.orderNumber : `OP-${payment.orderNumber}`;
    const integrationEventId = `EVT-PAY-${payment.id}`;
    await client.submitPaymentOrder({
      paymentOrderExternalId,
      integrationEventId,
      bankAccountExternalId: externalAccountId,
      clientReference: paymentOrderExternalId,
      beneficiary: { name: payment.supplier.company?.corporateName ?? `FORNECEDOR-${payment.supplierId}`, document: payment.supplier.company?.cnpj },
      amount: Number(payment.netValueDecimal ?? payment.valueDecimal ?? payment.value),
      scheduledDate: payment.date,
      paymentMethod: payment.paymentMethod,
      purposeText: `Pagamento liquido da ordem ${paymentOrderExternalId}`,
      idempotencyKey: createHash("sha256").update(`celeriflow:payment:${payment.id}:v1`).digest("hex"),
    });
    submitted += 1;
    if (process.env.BANK_SANDBOX_PROCESS_PAYMENTS === "true") await client.processPaymentOrder(paymentOrderExternalId);
  }

  let settled = 0;
  let rejected = 0;
  let reversed = 0;
  const events = await client.fetchPendingInteractions();
  for (const event of events) {
    if (event.interactionType !== "PAYMENT_ORDER_STATUS_CHANGED") continue;
    const paymentOrderExternalId = stringValue(event.payload.payment_order_external_id);
    const bankStatus = stringValue(event.payload.status);
    if (!paymentOrderExternalId || !bankStatus) {
      await client.acknowledgeInteraction(event.externalId, "FAILED", "Retorno bancario sem ordem ou status.");
      continue;
    }
    const orderNumber = paymentOrderExternalId.replace(/^OP-/, "");
    const payment = await prisma.payment.findFirst({ where: { OR: [{ orderNumber }, { orderNumber: paymentOrderExternalId }] }, select: { id: true, status: true } });
    if (!payment) {
      await client.acknowledgeInteraction(event.externalId, "FAILED", `Pagamento ${paymentOrderExternalId} nao encontrado.`);
      continue;
    }
    if (bankStatus === "SETTLED" && payment.status === "Emitida") {
      await updatePaymentStatus(prisma, { usuarioId: actor.id, employeeId: actor.employeeId }, payment.id, "Paga");
      settled += 1;
    } else if (bankStatus === "REJECTED") {
      rejected += 1;
    } else if (bankStatus === "REVERSED") {
      if (payment.status === "Emitida") await updatePaymentStatus(prisma, { usuarioId: actor.id, employeeId: actor.employeeId }, payment.id, "Paga");
      const current = await prisma.payment.findUnique({ where: { id: payment.id }, select: { status: true } });
      if (current?.status === "Paga") {
        await reversePayment(prisma, { usuarioId: actor.id, employeeId: actor.employeeId }, payment.id, `Estorno confirmado pelo Banco Virtual: ${paymentOrderExternalId}`);
        reversed += 1;
      }
    }
    await client.acknowledgeInteraction(event.externalId, "COMPLETED");
  }

  console.log(JSON.stringify({ submitted, settled, rejected, reversed, pendingEvents: events.length }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
