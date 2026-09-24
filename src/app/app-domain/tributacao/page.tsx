import { Building2, Receipt, MapPin, Search, PlusCircle, BarChart3, Users } from "lucide-react";
import Link from "next/link";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";

export const dynamic = "force-dynamic";

export default async function TributacaoDashboardPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const taxpayersCount = await prisma.taxpayer.count();
  const guidesCount = await prisma.taxGuide.count();
  const economyCount = await prisma.economicRegistration.count();

  const paidPayments = await prisma.taxPayment.aggregate({
    where: { status: "Confirmado" },
    _sum: { amountPaidDecimal: true }
  });
  const totalArrecadado = Number(paidPayments._sum.amountPaidDecimal ?? 0);

  const stats = [
    { title: "Arrecadação do Mês", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalArrecadado), icon: BarChart3, href: "/tributacao/guias", color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Guias Emitidas", value: guidesCount.toString(), icon: Receipt, href: "/tributacao/guias", color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Inscrições Econômicas", value: economyCount.toString(), icon: Building2, href: "/tributacao/economico", color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Contribuintes Fiscais", value: taxpayersCount.toString(), icon: Users, href: "/cadastros/contribuintes", color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <PageFrame className="space-y-2">
      <PageHeader
        title="Painel Tributário"
        icon={<Receipt className="size-4 shrink-0 text-emerald-600" />}
        action={(
          <Link href="/tributacao/guias" aria-label="Consultar Guias" className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-600 px-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700">
            <PlusCircle className="size-3.5" />
            <span className="hidden sm:inline">Consultar Guias</span>
          </Link>
        )}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href} className="block group">
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
              </div>
              <div className={`flex size-9 items-center justify-center rounded-md ${stat.bg} ${stat.color} transition-transform duration-200 group-hover:scale-105`}>
                <stat.icon className="size-5" strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Receipt className="size-4 text-emerald-600" />
              Últimas Guias Emitidas
            </h3>
            <Link href="/tributacao/guias" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Ver Todas</Link>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center p-5 text-center">
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-slate-100">
              <Search className="size-5 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">Nenhuma guia recente encontrada.</p>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <MapPin className="size-4 text-indigo-600" />
              Atalhos Rápidos
            </h3>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2 p-3">
            <Link href="/tributacao/economico" className="group rounded-md border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors">
              <Building2 className="mb-2 size-5 text-indigo-500 transition-transform group-hover:scale-105" />
              <span className="font-semibold text-sm text-slate-800 block">Cadastro Econômico</span>
              <span className="text-xs text-slate-500">Empresas e Autônomos</span>
            </Link>
            <Link href="/tributacao/imoveis" className="group rounded-md border border-slate-200 p-3 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors">
              <MapPin className="mb-2 size-5 text-emerald-500 transition-transform group-hover:scale-105" />
              <span className="font-semibold text-sm text-slate-800 block">Imóveis Fiscais</span>
              <span className="text-xs text-slate-500">Consulta de IPTU</span>
            </Link>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
