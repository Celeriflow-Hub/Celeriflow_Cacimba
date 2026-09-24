import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, FileText, PackageCheck, Scale } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { calculateInclusiveContractTermDays } from "@/lib/compras/contract-lifecycle";
import { ContratoLifecyclePanel } from "../ContratoLifecyclePanel";
import { InstrumentLifecyclePanel } from "../InstrumentLifecyclePanel";

export default async function ContratoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const resolvedParams = await params;
  const contrato = await prisma.contract.findUnique({
    where: { id: resolvedParams.id },
    include: {
      process: {
        include: {
          items: {
            select: {
              id: true,
              customName: true,
              quantity: true,
              estimatedUnitValue: true,
              catalogItem: { select: { name: true, unit: true } },
              material: { select: { name: true, unitOfMeasure: true } },
            },
          },
        },
      },
      supplier: {
        include: {
          company: {
            include: {
              representatives: {
                where: { status: "Ativo" },
                select: { id: true, representationType: true, representative: { select: { fullName: true } } },
              },
            },
          },
          person: {
            include: {
              legalRepresentations: {
                where: { status: "Ativo" },
                select: { id: true, representationType: true, representative: { select: { fullName: true } } },
              },
            },
          },
        },
      },
      secretariat: true,
      sourceBudgetUnit: true,
      manager: { select: { id: true, name: true, registration: true } },
      inspector: { select: { id: true, name: true, registration: true } },
      amendments: { orderBy: { createdAt: "desc" } },
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
              purchaseProcessItem: { select: { id: true, customName: true, catalogItem: { select: { name: true, unit: true } }, material: { select: { name: true, unitOfMeasure: true } } } },
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
      receipts: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          number: true,
          receivedAt: true,
          items: { select: { quantity: true, unitCost: true, material: { select: { name: true, unitOfMeasure: true } } } },
        },
        orderBy: { receivedAt: "desc" },
      },
    },
  });

  if (!contrato) notFound();

  const [lifecycleEvents, employees, suppliers, people, companies, documents] = await Promise.all([
    prisma.procurementLifecycleEvent.findMany({
      where: { sourceType: "CONTRACT", sourceId: contrato.id },
      include: { actorUsuario: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, name: true, registration: true, role: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      where: { status: "Ativo" },
      select: { id: true, company: { select: { corporateName: true, tradeName: true } }, person: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.person.findMany({ where: { status: "Ativo" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
    prisma.company.findMany({ where: { status: "Ativo" }, select: { id: true, corporateName: true, tradeName: true }, orderBy: { corporateName: "asc" } }),
    prisma.document.findMany({ where: { status: "Válido", documentType: { not: "Modelo" } }, select: { id: true, title: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const contracted = contrato.updatedValue;
  const committed = contrato.commitments.reduce((total, commitment) => (
    total + commitment.movements.reduce(
      (value, movement) => value + (movement.type === "Reforço" ? Number(movement.valueDecimal) : -Number(movement.valueDecimal)),
      Number(commitment.valueDecimal ?? commitment.value),
    )
  ), 0);
  const settled = contrato.commitments.reduce((total, commitment) => (
    total + commitment.settlements.reduce((value, settlement) => value + Number(settlement.valueDecimal ?? settlement.value), 0)
  ), 0);
  const paid = contrato.commitments.reduce((total, commitment) => (
    total + commitment.payments.reduce((value, payment) => value + Number(payment.valueDecimal ?? payment.value), 0)
  ), 0);
  const received = contrato.receipts.reduce((total, receipt) => total + receipt.items.reduce((itemTotal, item) => itemTotal + item.quantity * item.unitCost, 0), 0);
  const contractedQuantity = contrato.process.items.reduce((total, item) => total + item.quantity, 0);
  const termDays = calculateInclusiveContractTermDays(contrato.startDate, contrato.endDate);
  const formatMoney = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const formatQuantity = (value: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(value);
  const supplierName = contrato.supplier?.company?.corporateName || contrato.supplier?.company?.tradeName || contrato.supplier?.person?.fullName || "Não informado";
  const representatives = [
    ...(contrato.supplier?.company?.representatives ?? []).map((representative) => ({ id: representative.id, name: representative.representative.fullName, representationType: representative.representationType })),
    ...(contrato.supplier?.person?.legalRepresentations ?? []).map((representative) => ({ id: representative.id, name: representative.representative.fullName, representationType: representative.representationType })),
  ];
  const partyOptions = [
    ...suppliers.map((supplier) => ({
      value: `SUPPLIER:${supplier.id}`,
      type: "Fornecedor",
      label: supplier.company?.corporateName || supplier.company?.tradeName || supplier.person?.fullName || "Fornecedor sem nome",
    })),
    ...people.map((person) => ({ value: `PERSON:${person.id}`, type: "Pessoa", label: person.fullName })),
    ...companies.map((company) => ({ value: `COMPANY:${company.id}`, type: "Empresa", label: company.corporateName || company.tradeName || "Empresa sem nome" })),
    ...employees.map((employee) => ({ value: `EMPLOYEE:${employee.id}`, type: "Servidor", label: `${employee.name}${employee.registration ? ` · ${employee.registration}` : ""}` })),
  ];
  const lifecycleParties = contrato.instrumentParties.map((party) => {
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
  const processItems = contrato.process.items.map((item) => {
    const description = item.catalogItem?.name ?? item.material?.name ?? item.customName ?? "Item sem descrição";
    const unit = item.catalogItem?.unit ?? item.material?.unitOfMeasure ?? "UN";
    return { id: item.id, label: `${description} · ${formatQuantity(item.quantity)} ${unit}` };
  });

  return (
    <PageFrame className="space-y-2">
      <PageHeader title="Detalhes do Contrato" icon={<Scale className="size-4 shrink-0 text-indigo-600" />} action={<><Link href="/compras/contratos" aria-label="Voltar"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link><Link href={`/compras/contratos/${contrato.id}/relatorio`}><Button variant="outline" size="sm"><FileText className="size-3.5" /><span className="hidden sm:inline">Relatório</span></Button></Link><Link href={`/compras/contratos/${contrato.id}/editar`}><Button variant="outline" size="sm"><Edit className="size-3.5" /><span className="hidden sm:inline">Editar</span></Button></Link></>} />

      {!contrato.sourceBudgetUnit && <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Contrato legado sem Unidade Gestora de origem. Apenas administrador do sistema pode alterá-lo ou excluí-lo até a regularização.</p>}

      <Card className="rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-sm">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Número do Contrato</p>
              <p className="text-lg">{contrato.number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant="secondary">{contrato.status}</Badge>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Objeto</p>
            <p>{contrato.object}</p>
          </div>
          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Inicial</p>
              <p>{formatMoney(contrato.initialValue)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Atualizado</p>
              <p>{formatMoney(contrato.updatedValue)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quantidade vinculada</p>
              <p>{formatQuantity(contractedQuantity)}</p>
            </div>
          </div>
          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
              <p>{format(contrato.startDate, "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Fim</p>
              <p>{format(contrato.endDate, "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vigência calculada</p>
              <p>{termDays} dia{termDays === 1 ? "" : "s"} corrido{termDays === 1 ? "" : "s"} (inclusiva)</p>
            </div>
          </div>
          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fornecedor</p>
              <p>{supplierName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Processo Vinculado</p>
              <p>{contrato.process.number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unidade Gestora de origem</p>
              <p>{contrato.sourceBudgetUnit ? `${contrato.sourceBudgetUnit.code} - ${contrato.sourceBudgetUnit.name}` : "Pendente de regularização"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-sm">Itens e Quantidades Contratadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3 text-sm">
          {contrato.process.items.length ? contrato.process.items.map((item) => {
            const description = item.catalogItem?.name ?? item.material?.name ?? item.customName ?? "Item sem descrição";
            const unit = item.catalogItem?.unit ?? item.material?.unitOfMeasure ?? "UN";
            const itemValue = item.estimatedUnitValue === null ? null : item.quantity * item.estimatedUnitValue;
            return <div key={item.id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><span>{description}</span><span>{formatQuantity(item.quantity)} {unit}</span><span>{itemValue === null ? "Valor não informado" : formatMoney(itemValue)}</span></div>;
          }) : <p className="text-muted-foreground">O processo vinculado não possui itens cadastrados.</p>}
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-sm">Ciclo de Vida e Razão do Contrato</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <ContratoLifecyclePanel
            contract={{
              id: contrato.id,
              status: contrato.status,
              startDate: contrato.startDate.toISOString(),
              managerId: contrato.managerId,
              inspectorId: contrato.inspectorId,
              supplierName,
            }}
            employees={employees.map((employee) => ({ id: employee.id, name: employee.name, registration: employee.registration, roleName: employee.role?.name ?? null }))}
            representatives={representatives}
            amendments={contrato.amendments.map((amendment) => ({
              id: amendment.id,
              type: amendment.type,
              justification: amendment.justification,
              previousValue: amendment.previousValue,
              newValue: amendment.newValue,
              previousEndDate: amendment.previousEndDate?.toISOString() ?? null,
              newEndDate: amendment.newEndDate?.toISOString() ?? null,
              status: amendment.status,
              createdAt: amendment.createdAt.toISOString(),
            }))}
            events={lifecycleEvents.map((event) => ({ id: event.id, eventType: event.eventType, createdAt: event.createdAt.toISOString(), actorName: event.actorUsuario.nome ?? null }))}
          />
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-sm">Responsabilidades, Medições e Cronograma</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <InstrumentLifecyclePanel
            instrument={{ id: contrato.id, kind: "CONTRACT", status: contrato.status }}
            responsibilityGroups={contrato.responsibilityGroups.map((group) => ({ id: group.id, name: group.name, description: group.description, status: group.status, memberCount: group._count.members }))}
            parties={lifecycleParties}
            partyOptions={partyOptions}
            measurements={contrato.measurements.map((measurement) => ({
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
            processItems={processItems}
            documents={documents}
            installments={contrato.installments.map((installment) => ({
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
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="flex items-center gap-2 text-sm"><PackageCheck className="size-4 text-emerald-600" />Recebimentos Materiais Existentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground">Recebimentos aprovados são a execução física já registrada. Eles não são duplicados como nova medição.</p>
            <Link href="/compras/recebimentos"><Button variant="outline" size="sm">Registrar recebimento material</Button></Link>
          </div>
          {contrato.receipts.length ? <div className="space-y-2">{contrato.receipts.map((receipt) => <div key={receipt.id} className="space-y-2 rounded-md border p-3"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{receipt.number}</span><span>{format(receipt.receivedAt, "dd/MM/yyyy", { locale: ptBR })}</span><span>{formatMoney(receipt.items.reduce((total, item) => total + item.quantity * item.unitCost, 0))}</span></div>{receipt.items.map((item, index) => <p key={`${receipt.id}-${index}`} className="text-xs text-muted-foreground">{item.material.name}: {formatQuantity(item.quantity)} {item.material.unitOfMeasure} · {formatMoney(item.unitCost)} por unidade</p>)}</div>)}</div> : <p className="text-muted-foreground">Nenhum recebimento aprovado para este contrato.</p>}
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-sm">Execução Financeira Existente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Valores abaixo vêm exclusivamente dos atos financeiros já registrados e permanecem separados de medições e parcelas.</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div><p className="text-sm text-muted-foreground">Contratado</p><p>{formatMoney(contracted)}</p></div>
            <div><p className="text-sm text-muted-foreground">Empenhado</p><p>{formatMoney(committed)}</p></div>
            <div><p className="text-sm text-muted-foreground">Liquidado</p><p>{formatMoney(settled)}</p></div>
            <div><p className="text-sm text-muted-foreground">Pago</p><p>{formatMoney(paid)}</p></div>
            <div><p className="text-sm text-muted-foreground">Saldo a Empenhar</p><p>{formatMoney(contracted - committed)}</p></div>
            <div><p className="text-sm text-muted-foreground">Saldo frente ao pago real</p><p>{formatMoney(contracted - paid)}</p></div>
            <div><p className="text-sm text-muted-foreground">Recebido e atestado</p><p>{formatMoney(received)}</p></div>
          </div>
          {contrato.commitments.length ? <div className="space-y-2 border-t pt-3">{contrato.commitments.map((commitment) => <div key={commitment.number} className="flex flex-wrap justify-between gap-2 rounded-md border p-3 text-xs"><span className="font-medium">Empenho {commitment.number}</span><span>{format(commitment.date, "dd/MM/yyyy", { locale: ptBR })}</span><span>{commitment.status}</span><span>{formatMoney(Number(commitment.valueDecimal ?? commitment.value))}</span></div>)}</div> : <p className="text-muted-foreground">Nenhum empenho vinculado ao contrato.</p>}
        </CardContent>
      </Card>
    </PageFrame>
  );
}
