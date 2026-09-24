import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ShoppingCart, 
  FileText, 
  ClipboardList, 
  Scale,
  Gavel,
  Clock
} from "lucide-react"
import Link from "next/link"
import { PageFrame } from "@/components/app-ui/PageFrame"
import { PageHeader } from "@/components/app-ui/PageHeader"
import { getTenantContextForModule } from "@/lib/platform/tenant-context";

export default async function ComprasDashboard() {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const totalRequests = await prisma.purchaseRequest.count().catch(() => 0)
  const totalProcesses = await prisma.purchaseProcess.count().catch(() => 0)
  const totalBiddings = await prisma.bidding.count().catch(() => 0)
  const totalContracts = await prisma.contract.count().catch(() => 0)

  return (
    <PageFrame className="space-y-2">
      <PageHeader
        title="Compras e Contratos"
        icon={<ShoppingCart className="size-4 shrink-0 text-emerald-600" />}
        action={(
          <>
            <Link href="/compras/solicitacoes/novo" aria-label="Nova Solicitação" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ShoppingCart className="size-3.5" />
              <span className="hidden sm:inline">Nova Solicitação</span>
            </Link>
            <Link href="/compras/processos/novo" aria-label="Novo Processo" className={buttonVariants({ size: "sm" })}>
              <FileText className="size-3.5" />
              <span className="hidden sm:inline">Novo Processo</span>
            </Link>
          </>
        )}
      />

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <Card size="sm" className="rounded-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Solicitações Abertas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos aguardando processo
            </p>
          </CardContent>
        </Card>
        
        <Card size="sm" className="rounded-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Processos em Andamento</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcesses}</div>
            <p className="text-xs text-muted-foreground">
              Processos administrativos
            </p>
          </CardContent>
        </Card>
        
        <Card size="sm" className="rounded-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Licitações</CardTitle>
            <Gavel className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBiddings}</div>
            <p className="text-xs text-muted-foreground">
              Certames em andamento
            </p>
          </CardContent>
        </Card>
        
        <Card size="sm" className="rounded-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Contratos Vigentes</CardTitle>
            <Scale className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              Contratos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-7">
        <Card size="sm" className="rounded-md md:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Visão Geral</CardTitle>
            <CardDescription className="text-xs">
              Acesso rápido às rotinas do módulo de Compras e Contratos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/compras/solicitacoes" className="flex items-center rounded-md border p-3 hover:bg-muted transition-colors">
                <ShoppingCart className="mr-3 size-5 text-emerald-500" />
                <div>
                  <div className="font-semibold">Solicitações de Compra</div>
                  <div className="text-xs text-muted-foreground">Pedidos das secretarias</div>
                </div>
              </Link>
              <Link href="/compras/processos" className="flex items-center rounded-md border p-3 hover:bg-muted transition-colors">
                <ClipboardList className="mr-3 size-5 text-blue-500" />
                <div>
                  <div className="font-semibold">Processos de Compra</div>
                  <div className="text-xs text-muted-foreground">Gestão de ETP, TR e orçamentos</div>
                </div>
              </Link>
              <Link href="/compras/licitacoes" className="flex items-center rounded-md border p-3 hover:bg-muted transition-colors">
                <Gavel className="mr-3 size-5 text-amber-500" />
                <div>
                  <div className="font-semibold">Licitações e Dispensas</div>
                  <div className="text-xs text-muted-foreground">Pregão, Concorrência, Dispensa</div>
                </div>
              </Link>
              <Link href="/compras/contratos" className="flex items-center rounded-md border p-3 hover:bg-muted transition-colors">
                <Scale className="mr-3 size-5 text-indigo-500" />
                <div>
                  <div className="font-semibold">Gestão de Contratos</div>
                  <div className="text-xs text-muted-foreground">Contratos, Aditivos, Vigência</div>
                </div>
              </Link>
              <Link href="/compras/catalogo" className="flex items-center rounded-md border p-3 hover:bg-muted transition-colors">
                <FileText className="mr-3 size-5 text-slate-500" />
                <div>
                  <div className="font-semibold">Catálogo de Itens</div>
                  <div className="text-xs text-muted-foreground">Cadastro de materiais e serviços</div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="rounded-md md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Últimas Movimentações</CardTitle>
            <CardDescription className="text-xs">
              Acompanhamento do ciclo de compras.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[240px]">
              <div className="flex h-full flex-col items-center justify-center p-3 text-center text-muted-foreground">
                <Clock className="mb-2 size-7 opacity-20" />
                <p>Nenhum histórico recente encontrado.</p>
                <p className="text-xs">As movimentações de processos e contratos aparecerão aqui automaticamente.</p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  )
}
