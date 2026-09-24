import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { buttonVariants } from "@/components/ui/button";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import {
  Archive,
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  ClipboardList,
  Plus,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

const shortcutItems = [
  {
    href: "/patrimonio/almoxarifados",
    title: "Almoxarifados",
    description: "Depósitos, responsáveis e centros de distribuição.",
    icon: Warehouse,
    accent: "emerald",
  },
  {
    href: "/patrimonio/materiais",
    title: "Estoque",
    description: "Catálogo, saldos, lotes e movimentações.",
    icon: Boxes,
    accent: "blue",
  },
  {
    href: "/patrimonio/requisicoes",
    title: "Requisições internas",
    description: "Pedidos de materiais dos setores.",
    icon: ClipboardList,
    accent: "violet",
  },
  {
    href: "/patrimonio/inventarios",
    title: "Inventários",
    description: "Contagem, bloqueio e divergências de estoque.",
    icon: ClipboardList,
    accent: "amber",
  },
  {
    href: "/patrimonio/bens",
    title: "Bens patrimoniais",
    description: "Tombamento, localização e responsabilidade.",
    icon: Archive,
    accent: "rose",
  },
  {
    href: "/patrimonio/ciclo-vida",
    title: "Ciclo de vida",
    description: "Depreciação, baixas e ajustes contábeis.",
    icon: ChartNoAxesCombined,
    accent: "slate",
  },
];

export default async function PatrimonioDashboard() {
  const { prisma } = await getTenantContextForModule("PATRIMONIO");
  const [totalAssets, activeAssets, totalWarehouses, totalMaterials, pendingRequests] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { status: "Ativo" } }),
    prisma.warehouse.count(),
    prisma.material.count(),
    prisma.materialRequest.count({ where: { status: "Pendente" } }),
  ]);

  const kpis = [
    { label: "Bens ativos", value: activeAssets, detail: `de ${totalAssets} tombados`, icon: Archive },
    { label: "Materiais", value: totalMaterials, detail: "itens em catálogo", icon: Boxes },
    { label: "Requisições pendentes", value: pendingRequests, detail: "aguardando atendimento", icon: ClipboardList },
    { label: "Almoxarifados", value: totalWarehouses, detail: "locais cadastrados", icon: Warehouse },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-2 sm:p-3">
      <ErpPageTitle
        title="Almoxarifado e Patrimônio"
        action={
          <>
            <Link href="/patrimonio/bens/novo" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Archive className="size-3.5" />
              <span className="hidden sm:inline">Tombar bem</span>
              <span className="sm:hidden">Tombar</span>
            </Link>
            <Link href="/patrimonio/materiais?view=movimentar" className={buttonVariants({ size: "sm" })}>
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Movimentar estoque</span>
              <span className="sm:hidden">Movimentar</span>
            </Link>
          </>
        }
      />

      <section className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Indicadores operacionais">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <kpi.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
              <p className="text-2xl font-bold leading-tight tabular-nums text-slate-900">{kpi.value}</p>
              <p className="truncate text-[10px] text-slate-500">{kpi.detail}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="shrink-0" aria-labelledby="operacoes-title">
        <h2 id="operacoes-title" className="mb-2 px-1 text-sm font-semibold text-slate-900">Operações do módulo</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shortcutItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <div className="flex h-full min-h-40 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                <div>
                  <div className={`mb-3 flex size-9 items-center justify-center rounded-md transition-transform group-hover:scale-110 ${item.accent === "emerald" ? "bg-emerald-50 text-emerald-700" : item.accent === "blue" ? "bg-blue-50 text-blue-700" : item.accent === "violet" ? "bg-violet-50 text-violet-700" : item.accent === "amber" ? "bg-amber-50 text-amber-700" : item.accent === "rose" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                    <item.icon className="size-5" />
                  </div>
                  <h3 className="mb-1 text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:underline">
                  Acessar <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
