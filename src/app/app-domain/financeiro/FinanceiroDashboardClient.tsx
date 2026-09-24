"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  ArrowUpCircle, 
  ArrowDownCircle,
  Landmark,
  WalletCards,
  FileText,
  Receipt,
  Scale,
  BadgeDollarSign,
  Activity
} from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFinanceiroDashboardStats } from "./dashboard-actions"

interface FinanceiroDashboardStats {
  totalReceita: number
  totalDespesa: number
  resultadoOperacional: number
}

export default function FinanceiroDashboardClient({ initialStats }: { initialStats: FinanceiroDashboardStats }) {
  const [stats, setStats] = useState(initialStats)
  const [month, setMonth] = useState("")
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [isLoading, setIsLoading] = useState(false)

  async function fetchStats(nextMonth: string, nextYear: string) {
    setIsLoading(true)
    try {
      const data = await getFinanceiroDashboardStats(nextMonth, nextYear)
      setStats(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <h2 className="sr-only">Painel Financeiro</h2>
        <div className="flex items-center space-x-2">
          <Select value={month} onValueChange={(value) => {
            if (value === null) return
            setMonth(value)
            void fetchStats(value, year)
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Todos os Meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Meses</SelectItem>
              <SelectItem value="1">Janeiro</SelectItem>
              <SelectItem value="2">Fevereiro</SelectItem>
              <SelectItem value="3">Março</SelectItem>
              <SelectItem value="4">Abril</SelectItem>
              <SelectItem value="5">Maio</SelectItem>
              <SelectItem value="6">Junho</SelectItem>
              <SelectItem value="7">Julho</SelectItem>
              <SelectItem value="8">Agosto</SelectItem>
              <SelectItem value="9">Setembro</SelectItem>
              <SelectItem value="10">Outubro</SelectItem>
              <SelectItem value="11">Novembro</SelectItem>
              <SelectItem value="12">Dezembro</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={year} onValueChange={(value) => {
            if (value === null) return
            setYear(value)
            void fetchStats(month, value)
          }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value=" ">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <Card size="sm" className={`rounded-md shadow-none ${isLoading ? 'opacity-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalReceita)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Receitas arrecadadas no período
            </p>
          </CardContent>
        </Card>
        
        <Card size="sm" className={`rounded-md shadow-none ${isLoading ? 'opacity-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{formatCurrency(stats.totalDespesa)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Despesas empenhadas/pagas no período
            </p>
          </CardContent>
        </Card>

        <Card size="sm" className={`rounded-md shadow-none ${isLoading ? 'opacity-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado Operacional</CardTitle>
            <Activity className={`h-4 w-4 ${stats.resultadoOperacional >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.resultadoOperacional >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(stats.resultadoOperacional)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receitas - Despesas (Superávit/Déficit)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-7">
        <Card size="sm" className="rounded-md shadow-none md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
            <CardDescription>
              Navegue pelos submódulos financeiros e contábeis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link href="/financeiro/orcamento" className="flex items-center rounded-md border p-2.5 transition-colors hover:bg-muted">
                <Scale className="h-6 w-6 mr-4 text-slate-500" />
                <div>
                  <div className="font-semibold">Orçamento e Plano de Contas</div>
                  <div className="text-sm text-muted-foreground">Dotações e natureza</div>
                </div>
              </Link>
              <Link href="/financeiro/contas-bancarias" className="flex items-center rounded-md border p-2.5 transition-colors hover:bg-muted">
                <Landmark className="h-6 w-6 mr-4 text-emerald-500" />
                <div>
                  <div className="font-semibold">Tesouraria</div>
                  <div className="text-sm text-muted-foreground">Contas bancárias</div>
                </div>
              </Link>
              <Link href="/financeiro/empenhos" className="flex items-center rounded-md border p-2.5 transition-colors hover:bg-muted">
                <FileText className="h-6 w-6 mr-4 text-blue-500" />
                <div>
                  <div className="font-semibold">Gestão de Empenhos</div>
                  <div className="text-sm text-muted-foreground">Emitir e consultar empenhos</div>
                </div>
              </Link>
              <Link href="/financeiro/liquidacoes" className="flex items-center rounded-md border p-2.5 transition-colors hover:bg-muted">
                <Receipt className="h-6 w-6 mr-4 text-indigo-500" />
                <div>
                  <div className="font-semibold">Liquidações</div>
                  <div className="text-sm text-muted-foreground">Atestar notas e serviços</div>
                </div>
              </Link>
              <Link href="/financeiro/pagamentos" className="flex items-center rounded-md border p-2.5 transition-colors hover:bg-muted">
                <WalletCards className="h-6 w-6 mr-4 text-amber-500" />
                <div>
                  <div className="font-semibold">Pagamentos</div>
                  <div className="text-sm text-muted-foreground">Ordens de pagamento</div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="rounded-md shadow-none md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas movimentações financeiras registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-40 flex-col items-center justify-center p-4 text-center text-muted-foreground">
                <BadgeDollarSign className="h-8 w-8 mb-4 opacity-20" />
                <p>Nenhuma movimentação encontrada.</p>
                <p className="text-sm">Os lançamentos aparecerão aqui automaticamente.</p>
              </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
