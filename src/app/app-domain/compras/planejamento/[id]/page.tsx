import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";

function formatDate(value: Date) {
  const [year, month, day] = value.toISOString().slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export default async function PlanejamentoComprasDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma, user } = await getTenantContextForModule("COMPRAS");
  const { id } = await params;
  const planning = await prisma.purchasePlanning.findUnique({
    where: { id },
    include: {
      catalogItem: { select: { code: true, name: true, unit: true } },
      originPurchaseRequest: { select: { id: true, number: true, object: true, status: true } },
    },
  });
  if (!planning) notFound();

  const canEdit = canPerformModuleOperation(user, "COMPRAS", "update");
  const itemName = planning.catalogItem?.name ?? planning.description ?? "Item sem especificação";
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <PageFrame className="space-y-2">
      <PageHeader
        title="Planejamento de Compra"
        icon={<ListTodo className="size-4 shrink-0 text-emerald-600" />}
        action={<><Link href="/compras/planejamento" aria-label="Voltar para planejamentos"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link>{canEdit ? <Link href={`/compras/planejamento/${planning.id}/editar`}><Button variant="outline" size="sm"><Edit className="size-3.5" />Editar</Button></Link> : null}</>}
      />
      <Card className="rounded-md">
        <CardHeader className="border-b p-3"><CardTitle className="text-sm">Necessidade futura</CardTitle></CardHeader>
        <CardContent className="space-y-4 p-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-xs font-medium text-muted-foreground">Item ou serviço</p><p className="mt-1 font-medium">{itemName}</p>{planning.catalogItem ? <p className="mt-1 text-xs text-muted-foreground">{planning.catalogItem.code ? `${planning.catalogItem.code} · ` : ""}Catálogo · {planning.catalogItem.unit}</p> : null}</div>
            <div><p className="text-xs font-medium text-muted-foreground">Situação</p><Badge className="mt-1" variant="secondary">{planning.status}</Badge></div>
          </div>
          {planning.catalogItem && planning.description ? <div><p className="text-xs font-medium text-muted-foreground">Especificação complementar</p><p className="mt-1 whitespace-pre-wrap">{planning.description}</p></div> : null}
          {!planning.catalogItem && planning.description ? <div><p className="text-xs font-medium text-muted-foreground">Especificação</p><p className="mt-1 whitespace-pre-wrap">{planning.description}</p></div> : null}
          <div className="grid gap-3 border-t pt-3 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Quantidade</p><p className="mt-1 font-medium tabular-nums">{planning.quantity} {planning.unit}</p></div><div><p className="text-xs text-muted-foreground">Período esperado</p><p className="mt-1 tabular-nums">{formatDate(planning.expectedPeriodStart)} a {formatDate(planning.expectedPeriodEnd)}</p></div><div><p className="text-xs text-muted-foreground">Valor estimado</p><p className="mt-1 font-medium tabular-nums">{money.format(Number(planning.estimatedValueDecimal))}</p></div></div>
          <div className="border-t pt-3"><p className="text-xs font-medium text-muted-foreground">Origem</p>{planning.originPurchaseRequest ? <p className="mt-1"><Link href={`/compras/solicitacoes/${planning.originPurchaseRequest.id}`} className="font-medium text-emerald-700 hover:underline">{planning.originPurchaseRequest.number}</Link> · {planning.originPurchaseRequest.object} <span className="text-muted-foreground">({planning.originPurchaseRequest.status})</span></p> : <p className="mt-1 text-muted-foreground">Necessidade registrada diretamente, sem solicitação de origem vinculada.</p>}</div>
        </CardContent>
      </Card>
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">O planejamento não criou processo de compra, contratação, reserva, empenho ou despesa. Esses atos dependem dos fluxos próprios.</p>
    </PageFrame>
  );
}
