import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { notFound } from "next/navigation";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { calculateInclusiveContractTermDays } from "@/lib/compras/contract-lifecycle";
import { InstrumentLifecycleReport } from "../../InstrumentLifecycleReport";

const eventLabels: Record<string, string> = {
  CONTRACT_AMENDMENT_APPLIED: "Aditivo aplicado",
  CONTRACT_SUSPENSION_REGISTERED: "Suspensão registrada",
  CONTRACT_RESCISSION_REGISTERED: "Rescisão registrada",
  CONTRACT_RESPONSIBLES_UPDATED: "Responsáveis atualizados",
  PURCHASE_RECEIPT_APPROVED: "Recebimento aprovado",
  INSTRUMENT_RESPONSIBILITY_GROUP_CREATED: "Grupo de responsabilidade criado",
  INSTRUMENT_RESPONSIBILITY_GROUP_UPDATED: "Grupo de responsabilidade atualizado",
  INSTRUMENT_RESPONSIBILITY_GROUP_DELETED: "Grupo de responsabilidade excluído",
  INSTRUMENT_PARTY_CREATED: "Parte do instrumento incluída",
  INSTRUMENT_PARTY_UPDATED: "Parte do instrumento atualizada",
  INSTRUMENT_PARTY_DELETED: "Parte do instrumento excluída",
  INSTRUMENT_MEASUREMENT_CREATED: "Medição criada",
  INSTRUMENT_MEASUREMENT_UPDATED: "Medição atualizada",
  INSTRUMENT_MEASUREMENT_CANCELLED: "Medição cancelada",
  INSTRUMENT_MEASUREMENT_DELETED: "Medição excluída",
  INSTRUMENT_MEASUREMENT_ITEM_CREATED: "Item de medição incluído",
  INSTRUMENT_MEASUREMENT_ITEM_UPDATED: "Item de medição atualizado",
  INSTRUMENT_MEASUREMENT_ITEM_DELETED: "Item de medição excluído",
  INSTRUMENT_INSTALLMENT_CREATED: "Parcela programada criada",
  INSTRUMENT_INSTALLMENT_UPDATED: "Parcela programada atualizada",
  INSTRUMENT_INSTALLMENT_DELETED: "Parcela programada excluída",
  PROCUREMENT_EXPENSE_AUTHORIZATION_CREATED: "AE derivada do contrato",
  PROCUREMENT_SUPPLY_AUTHORIZATION_CREATED: "AF gerada",
  PROCUREMENT_SUPPLY_AUTHORIZATION_CANCELLED: "AF anulada",
  PROCUREMENT_LIQUIDATION_AUTHORIZATION_CREATED: "AL gerada",
  PROCUREMENT_LIQUIDATION_AUTHORIZATION_CANCELLED: "AL anulada",
  PROCUREMENT_COMMITMENT_CREATED: "Empenho financeiro confirmado",
  PROCUREMENT_COMMITMENT_CANCELLED: "Empenho financeiro anulado",
  PROCUREMENT_SETTLEMENT_CREATED: "Liquidação financeira confirmada",
  PROCUREMENT_SETTLEMENT_CANCELLED: "Liquidação financeira anulada",
};

export default async function ContratoRelatorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      process: { select: { number: true } },
      supplier: { select: { company: { select: { corporateName: true, tradeName: true } }, person: { select: { fullName: true } } } },
      secretariat: { select: { name: true } },
      sourceBudgetUnit: { select: { code: true, name: true } },
      responsibilityGroups: { orderBy: { createdAt: "asc" }, select: { name: true, description: true, status: true, _count: { select: { members: true } } } },
      instrumentParties: {
        orderBy: { createdAt: "asc" },
        include: {
          responsibilityGroup: { select: { name: true } },
          supplier: { select: { company: { select: { corporateName: true, tradeName: true } }, person: { select: { fullName: true } } } },
          person: { select: { fullName: true } },
          company: { select: { corporateName: true, tradeName: true } },
          employee: { select: { name: true, registration: true } },
        },
      },
      measurements: {
        orderBy: { number: "asc" },
        include: { items: { orderBy: { createdAt: "asc" }, select: { description: true, quantity: true, unit: true, valueDecimal: true } } },
      },
      installments: { orderBy: { number: "asc" }, include: { payment: { select: { orderNumber: true, status: true } } } },
      commitments: {
        where: { status: { in: ["Emitido", "Liquidado", "Pago"] } },
        select: {
          number: true,
          date: true,
          status: true,
          value: true,
          valueDecimal: true,
          movements: { select: { type: true, valueDecimal: true } },
          settlements: { where: { status: "Liquidado" }, select: { value: true, valueDecimal: true } },
          payments: { where: { status: { in: ["Pago", "Paga"] } }, select: { value: true, valueDecimal: true } },
        },
      },
    },
  });
  if (!contract) notFound();

  const events = await prisma.procurementLifecycleEvent.findMany({
    where: { sourceType: "CONTRACT", sourceId: contract.id },
    include: { actorUsuario: { select: { nome: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const supplierName = contract.supplier?.company?.corporateName || contract.supplier?.company?.tradeName || contract.supplier?.person?.fullName || "Não informado";
  const committed = contract.commitments.reduce((total, commitment) => total + commitment.movements.reduce((value, movement) => value + (movement.type === "Reforço" ? Number(movement.valueDecimal) : -Number(movement.valueDecimal)), Number(commitment.valueDecimal ?? commitment.value)), 0);
  const settled = contract.commitments.reduce((total, commitment) => total + commitment.settlements.reduce((value, settlement) => value + Number(settlement.valueDecimal ?? settlement.value), 0), 0);
  const paid = contract.commitments.reduce((total, commitment) => total + commitment.payments.reduce((value, payment) => value + Number(payment.valueDecimal ?? payment.value), 0), 0);
  const parties = contract.instrumentParties.map((party) => {
    const identity = party.supplier
      ? { name: party.supplier.company?.corporateName || party.supplier.company?.tradeName || party.supplier.person?.fullName || "Fornecedor sem nome", type: "Fornecedor" }
      : party.person
        ? { name: party.person.fullName, type: "Pessoa" }
        : party.company
          ? { name: party.company.corporateName || party.company.tradeName || "Empresa sem nome", type: "Empresa" }
          : { name: party.employee ? `${party.employee.name}${party.employee.registration ? ` · ${party.employee.registration}` : ""}` : "Servidor não disponível", type: "Servidor" };
    return { role: party.role, ...identity, groupName: party.responsibilityGroup?.name ?? null, status: party.status, activeFrom: party.activeFrom?.toISOString() ?? null, activeTo: party.activeTo?.toISOString() ?? null };
  });

  return <InstrumentLifecycleReport
    title="Contrato"
    number={contract.number}
    backHref={`/compras/contratos/${contract.id}`}
    generatedAt={new Date().toISOString()}
    facts={[
      { label: "Situação", value: contract.status },
      { label: "Objeto", value: contract.object },
      { label: "Fornecedor", value: supplierName },
      { label: "Processo vinculado", value: contract.process.number },
      { label: "Secretaria", value: contract.secretariat.name },
      { label: "Unidade Gestora de origem", value: contract.sourceBudgetUnit ? `${contract.sourceBudgetUnit.code} - ${contract.sourceBudgetUnit.name}` : "Pendente de regularização" },
      { label: "Valor inicial", value: money(contract.initialValue) },
      { label: "Valor atualizado", value: money(contract.updatedValue) },
      { label: "Vigência", value: `${format(contract.startDate, "dd/MM/yyyy", { locale: ptBR })} a ${format(contract.endDate, "dd/MM/yyyy", { locale: ptBR })} · ${calculateInclusiveContractTermDays(contract.startDate, contract.endDate)} dias inclusivos` },
    ]}
    groups={contract.responsibilityGroups.map((group) => ({ name: group.name, description: group.description, status: group.status, memberCount: group._count.members }))}
    parties={parties}
    measurements={contract.measurements.map((measurement) => ({ number: measurement.number, description: measurement.description, periodStart: measurement.periodStart?.toISOString() ?? null, periodEnd: measurement.periodEnd?.toISOString() ?? null, measuredAt: measurement.measuredAt.toISOString(), status: measurement.status, quantity: measurement.quantity, unit: measurement.unit, value: Number(measurement.valueDecimal), items: measurement.items.map((item) => ({ description: item.description, quantity: item.quantity, unit: item.unit, value: Number(item.valueDecimal) })) }))}
    installments={contract.installments.map((installment) => ({ number: installment.number, dueDate: installment.dueDate?.toISOString() ?? null, status: installment.status, value: Number(installment.valueDecimal), paymentLabel: installment.payment ? `${installment.payment.orderNumber} · ${installment.payment.status}` : null }))}
    financialSummary={[
      { label: "Contratado", value: contract.updatedValue },
      { label: "Empenhado", value: committed },
      { label: "Liquidado", value: settled },
      { label: "Pago", value: paid },
      { label: "Saldo frente ao pago real", value: contract.updatedValue - paid },
    ]}
    financialRecords={contract.commitments.map((commitment) => ({ number: `Empenho ${commitment.number}`, date: commitment.date.toISOString(), status: commitment.status, value: Number(commitment.valueDecimal ?? commitment.value) }))}
    events={events.map((event) => ({ eventType: event.eventType, label: eventLabels[event.eventType] ?? event.eventType.replaceAll("_", " "), actorName: event.actorUsuario.nome ?? null, createdAt: event.createdAt.toISOString() }))}
  />;
}
