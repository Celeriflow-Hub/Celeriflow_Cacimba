import { FileText, Globe, Scale, Users } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function PortalLegislativoPage() {
  const { prisma } = await getTenantContextForModule("CAMARA");
  const [vereadores, proposicoes, leis, sessoes] = await Promise.all([
    prisma.camVereador.count({ where: { active: true, status: "Em Exercício" } }),
    prisma.camProposicao.count(),
    prisma.camLei.count({ where: { status: "Vigente" } }),
    prisma.camSessao.findMany({ where: { status: { in: ["Agendada", "Em Preparação"] } }, orderBy: { data: "asc" }, take: 3 }),
  ]);
  const cards = [{ label: "Vereadores em exercício", value: vereadores, icon: Users }, { label: "Proposições protocoladas", value: proposicoes, icon: FileText }, { label: "Normas vigentes", value: leis, icon: Scale }];

  return <PageFrame className="space-y-3 px-1 py-1 md:px-2"><PageHeader title="Transparência Legislativa" icon={<Globe className="size-4 shrink-0 text-[#9333EA]" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" /><div className="grid gap-3 md:grid-cols-3">{cards.map((card) => <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><card.icon className="mb-2 h-5 w-5 text-[#9333EA]" /><p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p><p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{card.label}</p></div>)}</div><section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Próximas sessões</h2>{sessoes.length ? <div className="space-y-3">{sessoes.map((sessao) => <div key={sessao.id} className="flex flex-col gap-1 border-b border-slate-100 pb-3 text-sm last:border-0 sm:flex-row sm:justify-between dark:border-gray-700"><span className="text-slate-900 dark:text-white">{sessao.numero}ª Sessão {sessao.tipo}</span><span className="text-slate-500 dark:text-gray-400">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(sessao.data)}</span></div>)}</div> : <p className="text-sm text-slate-500 dark:text-gray-400">Não há sessões agendadas.</p>}</section></PageFrame>;
}
