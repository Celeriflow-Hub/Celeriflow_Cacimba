import { getFinanceiroDashboardStats } from "./dashboard-actions"
import FinanceiroDashboardClient from "./FinanceiroDashboardClient"
import { PageFrame } from "@/components/app-ui/PageFrame"
import { PageHeader } from "@/components/app-ui/PageHeader"

export default async function FinanceiroDashboard() {
  const currentYear = new Date().getFullYear().toString()
  const initialStats = await getFinanceiroDashboardStats("", currentYear)

  return (
    <PageFrame className="space-y-2 px-1 py-1 md:px-2 [&>div]:space-y-2 [&>div]:p-0 [&>div>div:first-child]:justify-end [&>div>div:first-child>h2]:hidden">
      <PageHeader title="Painel Financeiro" />
      <FinanceiroDashboardClient initialStats={initialStats} />
    </PageFrame>
  )
}
