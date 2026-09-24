import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ApprovePurchaseRequestButton } from "../ApprovePurchaseRequestButton";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { canManagePurchaseRequest } from "@/lib/compras/purchase-request-policy";

export default async function SolicitacaoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma, user } = await getTenantContextForModule("COMPRAS");
  const resolvedParams = await params;
  const solicitacao = await prisma.purchaseRequest.findUnique({
    where: { id: resolvedParams.id },
    include: {
      secretariat: true,
      department: true,
      requester: true,
      items: {
        include: {
          catalogItem: true,
          budgetAllocations: {
            include: {
              budgetAppropriation: {
                include: {
                  budgetUnit: true,
                  expenseNature: true,
                  resourceSource: true,
                  financialYear: true,
                },
              },
            },
          },
          processItemOrigins: {
            include: {
              purchaseProcessItem: {
                include: { purchaseProcess: { select: { id: true, number: true, status: true } } },
              },
            },
          },
        },
      },
    }
  });

  if (!solicitacao) {
    notFound();
  }

  return (
    <PageFrame className="space-y-2">
      <PageHeader
        title="Detalhes da Solicitação"
        icon={<ShoppingCart className="size-4 shrink-0 text-emerald-600" />}
        action={<><Link href="/compras/solicitacoes" aria-label="Voltar"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link>{canManagePurchaseRequest(user, solicitacao) ? <Link href={`/compras/solicitacoes/${solicitacao.id}/editar`}><Button variant="outline" size="sm"><Edit className="size-3.5" /><span className="hidden sm:inline">Editar</span></Button></Link> : null}{solicitacao.status === "Rascunho" && <ApprovePurchaseRequestButton id={solicitacao.id} />}</>}
      />

      <Card className="rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-sm">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Número</p>
              <p className="text-lg">{solicitacao.number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={solicitacao.status === 'Rascunho' ? 'secondary' : 'default'}>{solicitacao.status}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prioridade do planejamento</p>
              <p>{solicitacao.priority}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Objeto</p>
            <p>{solicitacao.object}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Justificativa</p>
            <p>{solicitacao.justification}</p>
          </div>
          <div className="grid gap-3 border-t pt-3 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Secretaria</p>
              <p>{solicitacao.secretariat?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Departamento</p>
              <p>{solicitacao.department?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Solicitante</p>
              <p>{solicitacao.requester?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-sm">Itens ({solicitacao.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-[980px] text-sm divide-y">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Item / Serviço</th>
                  <th className="px-4 py-2 text-left">Quant.</th>
                  <th className="px-4 py-2 text-left">Valor Unit.</th>
                  <th className="px-4 py-2 text-left">Subtotal</th>
                  <th className="px-4 py-2 text-left">Alocação orçamentária</th>
                  <th className="px-4 py-2 text-left">Processo de origem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {solicitacao.items.map((item) => {
                  const name = item.catalogItem ? item.catalogItem.name : item.customName;
                  const unitVal = item.estimatedUnitValue ?? 0;
                  const subtotal = item.quantity * unitVal;
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-2">{name}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unitVal)}</td>
                      <td className="px-4 py-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</td>
                      <td className="px-4 py-2 align-top">
                        {item.budgetAllocations.length ? <ul className="space-y-1 text-xs">
                          {item.budgetAllocations.map((allocation) => {
                            const appropriation = allocation.budgetAppropriation;
                            return <li key={allocation.id}>
                              <span className="font-medium">{appropriation.code}</span> · {appropriation.expenseNature.code} · {appropriation.resourceSource.code}<br />
                              {appropriation.budgetUnit.name} · exercício {appropriation.financialYear.year}<br />
                              {allocation.quantity} un. · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(allocation.valueDecimal.toNumber())}
                            </li>;
                          })}
                        </ul> : <span className="text-muted-foreground">Sem alocação</span>}
                      </td>
                      <td className="px-4 py-2 align-top">
                        {item.processItemOrigins.length ? <ul className="space-y-1 text-xs">
                          {item.processItemOrigins.map((origin) => (
                            <li key={origin.id}>
                              <Link className="font-medium text-primary underline-offset-2 hover:underline" href={`/compras/processos/${origin.purchaseProcessItem.purchaseProcess.id}`}>
                                {origin.purchaseProcessItem.purchaseProcess.number}
                              </Link> · {origin.quantity} un. · {origin.purchaseProcessItem.purchaseProcess.status}
                            </li>
                          ))}
                        </ul> : <span className="text-muted-foreground">Ainda não agrupado</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <p className="text-lg font-bold">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(solicitacao.estimatedValue ?? 0)}</p>
          </div>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
