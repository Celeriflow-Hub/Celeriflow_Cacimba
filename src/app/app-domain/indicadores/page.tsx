import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function IndicadoresPage({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }> }) {
  const { prisma } = await getTenantContextForModule("ADMINISTRACAO");
  const params = await searchParams;
  const start = params.start ? new Date(`${params.start}T00:00:00.000Z`) : new Date(new Date().getFullYear(), 0, 1);
  const end = params.end ? new Date(`${params.end}T23:59:59.999Z`) : new Date();
  const [plans, pendingFindings, fleetCost, payments, socialBenefits, licenses] = await Promise.all([
    prisma.internalControlPlan.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.internalControlFinding.count({ where: { status: { not: "RESOLVIDO" } } }),
    prisma.fleetOperation.aggregate({ where: { occurredAt: { gte: start, lte: end } }, _sum: { cost: true } }),
    prisma.payment.aggregate({ where: { date: { gte: start, lte: end }, status: { in: ["Emitida", "Paga"] } }, _sum: { valueDecimal: true } }),
    prisma.socialBenefitConcession.count({ where: { createdAt: { gte: start, lte: end } } }).catch(() => 0),
    prisma.environmentalLicense.count({ where: { createdAt: { gte: start, lte: end } } }).catch(() => 0),
  ]);
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const cards = [
    ["Planos de controle", plans.toString(), "Planos registrados no período"],
    ["Apontamentos pendentes", pendingFindings.toString(), "Demandam tratamento e evidência"],
    ["Custo de frotas", money.format(Number(fleetCost._sum.cost ?? 0)), "Operações de abastecimento, manutenção e OS"],
    ["Pagamentos emitidos", money.format(Number(payments._sum.valueDecimal ?? 0)), "Execução financeira no período"],
    ["Benefícios sociais", socialBenefits.toString(), "Concessões registradas"],
    ["Licenças ambientais", licenses.toString(), "Licenças emitidas ou em análise"],
  ];
  return (
    <PageFrame className="space-y-2">
      <PageHeader title="Indicadores" />
      <form className="flex flex-wrap items-end gap-2 rounded border border-slate-300 bg-white p-2.5 shadow-sm">
        <label className="text-xs font-semibold text-slate-600">Início<input className="ml-1.5 h-8 rounded border border-slate-300 px-2 text-xs" name="start" type="date" defaultValue={params.start} /></label>
        <label className="text-xs font-semibold text-slate-600">Fim<input className="ml-1.5 h-8 rounded border border-slate-300 px-2 text-xs" name="end" type="date" defaultValue={params.end} /></label>
        <button className="h-8 rounded bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-900">Aplicar</button>
      </form>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([title, value, description]) => <section key={title} className="rounded border border-slate-300 bg-white p-3 shadow-sm"><p className="text-xs font-medium text-slate-500">{title}</p><p className="mt-1 text-2xl font-bold text-slate-800">{value}</p><p className="mt-1 text-[11px] text-slate-500">{description}</p></section>)}</div>
    </PageFrame>
  );
}
