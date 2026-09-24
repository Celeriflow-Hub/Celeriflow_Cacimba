import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Edit, FileText, Handshake, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { calculateInclusiveContractTermDays } from "@/lib/compras/contract-lifecycle";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { InstrumentLifecyclePanel } from "../../contratos/InstrumentLifecyclePanel";

export default async function ConvenioDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const { id } = await params;
  const covenant = await prisma.covenant.findUnique({
    where: { id },
    include: {
      responsibilityGroups: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, description: true, status: true, _count: { select: { members: true } } },
      },
      instrumentParties: {
        orderBy: { createdAt: "asc" },
        include: {
          responsibilityGroup: { select: { id: true, name: true } },
          supplier: { select: { id: true, company: { select: { corporateName: true, tradeName: true } }, person: { select: { fullName: true } } } },
          person: { select: { id: true, fullName: true } },
          company: { select: { id: true, corporateName: true, tradeName: true } },
          employee: { select: { id: true, name: true, registration: true } },
        },
      },
      measurements: {
        orderBy: { number: "asc" },
        include: {
          document: { select: { id: true, title: true } },
          items: {
            orderBy: { createdAt: "asc" },
            include: {
              purchaseProcessItem: { select: { id: true, customName: true, catalogItem: { select: { name: true } }, material: { select: { name: true } } } },
              purchaseReceiptItem: { select: { id: true, purchaseReceipt: { select: { number: true } } } },
            },
          },
        },
      },
      installments: {
        orderBy: { number: "asc" },
        include: { payment: { select: { orderNumber: true, date: true, value: true, valueDecimal: true, status: true } } },
      },
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
  if (!covenant) notFound();

  const [events, employees, suppliers, people, companies, documents] = await Promise.all([
    prisma.procurementLifecycleEvent.findMany({
      where: { sourceType: "COVENANT", sourceId: covenant.id },
      include: { actorUsuario: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.employee.findMany({ where: { isActive: true }, select: { id: true, name: true, registration: true, role: { select: { name: true } } }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { status: "Ativo" }, select: { id: true, company: { select: { corporateName: true, tradeName: true } }, person: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.person.findMany({ where: { status: "Ativo" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
    prisma.company.findMany({ where: { status: "Ativo" }, select: { id: true, corporateName: true, tradeName: true }, orderBy: { corporateName: "asc" } }),
    prisma.document.findMany({ where: { status: "Válido", documentType: { not: "Modelo" } }, select: { id: true, title: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const termDays = calculateInclusiveContractTermDays(covenant.startDate, covenant.endDate);
  const committed = covenant.commitments.reduce((total, commitment) => total + commitment.movements.reduce((value, movement) => value + (movement.type === "Reforço" ? Number(movement.valueDecimal) : -Number(movement.valueDecimal)), Number(commitment.valueDecimal ?? commitment.value)), 0);
  const settled = covenant.commitments.reduce((total, commitment) => total + commitment.settlements.reduce((value, settlement) => value + Number(settlement.valueDecimal ?? settlement.value), 0), 0);
  const paid = covenant.commitments.reduce((total, commitment) => total + commitment.payments.reduce((value, payment) => value + Number(payment.valueDecimal ?? payment.value), 0), 0);
  const partyOptions = [
    ...suppliers.map((supplier) => ({ value: `SUPPLIER:${supplier.id}`, type: "Fornecedor", label: supplier.company?.corporateName || supplier.company?.tradeName || supplier.person?.fullName || "Fornecedor sem nome" })),
    ...people.map((person) => ({ value: `PERSON:${person.id}`, type: "Pessoa", label: person.fullName })),
    ...companies.map((company) => ({ value: `COMPANY:${company.id}`, type: "Empresa", label: company.corporateName || company.tradeName || "Empresa sem nome" })),
    ...employees.map((employee) => ({ value: `EMPLOYEE:${employee.id}`, type: "Servidor", label: `${employee.name}${employee.registration ? ` · ${employee.registration}` : ""}` })),
  ];
  const lifecycleParties = covenant.instrumentParties.map((party) => {
    const identity = party.supplier
      ? { identityReference: `SUPPLIER:${party.supplier.id}`, identityLabel: party.supplier.company?.corporateName || party.supplier.company?.tradeName || party.supplier.person?.fullName || "Fornecedor sem nome", identityType: "Fornecedor" }
      : party.person
        ? { identityReference: `PERSON:${party.person.id}`, identityLabel: party.person.fullName, identityType: "Pessoa" }
        : party.company
          ? { identityReference: `COMPANY:${party.company.id}`, identityLabel: party.company.corporateName || party.company.tradeName || "Empresa sem nome", identityType: "Empresa" }
          : { identityReference: `EMPLOYEE:${party.employee?.id ?? ""}`, identityLabel: party.employee ? `${party.employee.name}${party.employee.registration ? ` · ${party.employee.registration}` : ""}` : "Servidor não disponível", identityType: "Servidor" };
    return {
      id: party.id,
      role: party.role,
      ...identity,
      responsibilityGroupId: party.responsibilityGroupId,
      responsibilityGroupName: party.responsibilityGroup?.name ?? null,
      status: party.status,
      activeFrom: party.activeFrom?.toISOString() ?? null,
      activeTo: party.activeTo?.toISOString() ?? null,
      notes: party.notes,
    };
  });
  const eventLabel: Record<string, string> = {
    COVENANT_CREATED: "Convênio criado",
    COVENANT_UPDATED: "Convênio atualizado",
    COVENANT_STATUS_UPDATED: "Situação do convênio atualizada",
    COVENANT_DELETED: "Convênio excluído",
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

  return (
    <PageFrame className="space-y-2">
      <PageHeader title="Detalhes do Convênio" icon={<Handshake className="size-4 shrink-0 text-indigo-600" />} action={<><Link href="/compras/convenios" aria-label="Voltar"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link><Link href={`/compras/convenios/${covenant.id}/relatorio`}><Button variant="outline" size="sm"><FileText className="size-3.5" /><span className="hidden sm:inline">Relatório</span></Button></Link><Link href={`/compras/convenios/${covenant.id}/editar`}><Button variant="outline" size="sm"><Edit className="size-3.5" /><span className="hidden sm:inline">Editar</span></Button></Link></>} />

      <Card className="rounded-md"><CardHeader className="border-b p-3"><CardTitle className="text-sm">Informações Gerais</CardTitle></CardHeader><CardContent className="space-y-3 p-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-medium text-muted-foreground">Número</p><p className="text-lg">{covenant.number}</p></div><div><p className="text-xs font-medium text-muted-foreground">Situação</p><Badge variant="secondary">{covenant.status}</Badge></div></div>
        <div><p className="text-xs font-medium text-muted-foreground">Concedente</p><p>{covenant.grantor}</p></div>
        <div><p className="text-xs font-medium text-muted-foreground">Objeto</p><p>{covenant.description}</p></div>
        <div className="grid gap-4 border-t pt-3 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Valor total</p><p>{money(Number(covenant.totalValueDecimal))}</p></div><div><p className="text-xs text-muted-foreground">Vigência</p><p>{format(covenant.startDate, "dd/MM/yyyy", { locale: ptBR })} a {format(covenant.endDate, "dd/MM/yyyy", { locale: ptBR })}</p></div><div><p className="text-xs text-muted-foreground">Prazo calculado</p><p>{termDays} dias corridos (inclusiva)</p></div></div>
      </CardContent></Card>

      <Card className="rounded-md"><CardHeader className="border-b p-3"><CardTitle className="text-sm">Responsabilidades, Medições e Cronograma</CardTitle></CardHeader><CardContent className="p-3">
        <InstrumentLifecyclePanel
          instrument={{ id: covenant.id, kind: "COVENANT", status: covenant.status }}
          responsibilityGroups={covenant.responsibilityGroups.map((group) => ({ id: group.id, name: group.name, description: group.description, status: group.status, memberCount: group._count.members }))}
          parties={lifecycleParties}
          partyOptions={partyOptions}
          measurements={covenant.measurements.map((measurement) => ({
            id: measurement.id,
            number: measurement.number,
            description: measurement.description,
            periodStart: measurement.periodStart?.toISOString() ?? null,
            periodEnd: measurement.periodEnd?.toISOString() ?? null,
            measuredAt: measurement.measuredAt.toISOString(),
            status: measurement.status,
            quantity: measurement.quantity,
            unit: measurement.unit,
            valueDecimal: Number(measurement.valueDecimal),
            documentId: measurement.documentId,
            documentTitle: measurement.document?.title ?? null,
            items: measurement.items.map((item) => ({
              id: item.id,
              purchaseProcessItemId: item.purchaseProcessItemId,
              purchaseProcessItemLabel: item.purchaseProcessItem ? item.purchaseProcessItem.catalogItem?.name ?? item.purchaseProcessItem.material?.name ?? item.purchaseProcessItem.customName ?? "Item sem descrição" : null,
              purchaseReceiptItemLabel: item.purchaseReceiptItem?.purchaseReceipt.number ?? null,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitValueDecimal: item.unitValueDecimal === null ? null : Number(item.unitValueDecimal),
              valueDecimal: Number(item.valueDecimal),
            })),
          }))}
          processItems={[]}
          documents={documents}
          installments={covenant.installments.map((installment) => ({
            id: installment.id,
            number: installment.number,
            dueDate: installment.dueDate?.toISOString() ?? null,
            periodStart: installment.periodStart?.toISOString() ?? null,
            periodEnd: installment.periodEnd?.toISOString() ?? null,
            quantity: installment.quantity,
            unit: installment.unit,
            valueDecimal: Number(installment.valueDecimal),
            status: installment.status,
            payment: installment.payment ? { orderNumber: installment.payment.orderNumber, date: installment.payment.date.toISOString(), value: Number(installment.payment.valueDecimal ?? installment.payment.value), status: installment.payment.status } : null,
          }))}
        />
      </CardContent></Card>

      <Card className="rounded-md"><CardHeader className="border-b p-3"><CardTitle className="text-sm">Execução Financeira Existente</CardTitle></CardHeader><CardContent className="space-y-3 p-3 text-sm">
        <p className="text-xs text-muted-foreground">Os valores financeiros abaixo são atos reais já vinculados ao convênio. Medições e parcelas administrativas não geram esses registros.</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4"><div><p className="text-xs text-muted-foreground">Empenhado</p><p>{money(committed)}</p></div><div><p className="text-xs text-muted-foreground">Liquidado</p><p>{money(settled)}</p></div><div><p className="text-xs text-muted-foreground">Pago</p><p>{money(paid)}</p></div><div><p className="text-xs text-muted-foreground">Saldo frente ao pago real</p><p>{money(Number(covenant.totalValueDecimal) - paid)}</p></div></div>
        {covenant.commitments.length ? <div className="space-y-2 border-t pt-3">{covenant.commitments.map((commitment) => <div key={commitment.number} className="flex flex-wrap justify-between gap-2 rounded-md border p-3 text-xs"><span className="font-medium">Empenho {commitment.number}</span><span>{format(commitment.date, "dd/MM/yyyy", { locale: ptBR })}</span><span>{commitment.status}</span><span>{money(Number(commitment.valueDecimal ?? commitment.value))}</span></div>)}</div> : <p className="text-xs text-muted-foreground">Nenhum empenho vinculado ao convênio.</p>}
      </CardContent></Card>

      <Card className="rounded-md"><CardHeader className="border-b p-3"><CardTitle className="text-sm">Trilha de Auditoria</CardTitle></CardHeader><CardContent className="space-y-2 p-3 text-sm">
        {events.length ? events.map((event) => <div key={event.id} className="flex flex-wrap justify-between gap-2 rounded-md border p-3 text-xs"><span className="font-medium">{eventLabel[event.eventType] ?? event.eventType.replaceAll("_", " ")}</span><span>{event.actorUsuario.nome ?? "Usuário não informado"}</span><span className="text-muted-foreground">{format(event.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span></div>) : <p className="text-xs text-muted-foreground">Nenhum evento de compras registrado para este convênio.</p>}
      </CardContent></Card>
      <p className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600"><Landmark className="size-4 text-slate-500" />O instrumento não possui Unidade Gestora de origem no schema vigente; o acesso é controlado pela permissão do módulo Compras.</p>
    </PageFrame>
  );
}
