import { AlertTriangle, Archive, ClipboardList, FileBox, FileCheck2, FileText, MessageSquareWarning, Timer } from "lucide-react";
import Link from "next/link";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { getProtocolContext, protocolScope } from "@/lib/protocols/access";
import { getOmbudsmanContextForProtocols, ombudsmanScope } from "@/lib/attendance/access";

export const dynamic = "force-dynamic";

export default async function ProtocolosDashboardPage() {
  const context = await getProtocolContext();
  const { prisma } = context;
  const scope = protocolScope(context);
  const ombudsmanContext = await getOmbudsmanContextForProtocols();
  const now = new Date();
  const [totalProcesses, awaitingReceipt, inProgressProcesses, archivedProcesses, dueSoon, overdue, pendingOmbudsman, publishedProcessNotices] = await Promise.all([
    prisma.process.count({ where: scope }),
    prisma.process.count({ where: { ...scope, status: "Aguardando Recebimento" } }),
    prisma.process.count({ where: { ...scope, status: { in: ["Recebido", "Em Analise", "Reaberto"] } } }),
    prisma.process.count({ where: { ...scope, status: "Arquivado" } }),
    prisma.process.count({ where: { ...scope, expectedCompletionAt: { gte: now, lte: new Date(now.getTime() + 3 * 86_400_000) }, status: { notIn: ["Concluido", "Arquivado", "Cancelado"] } } }),
    prisma.process.count({ where: { ...scope, expectedCompletionAt: { lt: now }, status: { notIn: ["Concluido", "Arquivado", "Cancelado"] } } }),
    ombudsmanContext.prisma.ombudsman.count({ where: { AND: [ombudsmanScope(ombudsmanContext), { status: { not: "Concluída" } }] } }),
    prisma.publicNotice.count({ where: { sourceModule: "PROCESSOS" } }),
  ]);

  const stats = [
    { title: "Total de Processos", value: totalProcesses.toString(), icon: ClipboardList, href: "/protocolos/acompanhamento", color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Em andamento", value: inProgressProcesses.toString(), icon: FileBox, href: "/protocolos/acompanhamento?status=Recebido", color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Aguardando recebimento", value: awaitingReceipt.toString(), icon: FileText, href: "/protocolos/acompanhamento?status=Aguardando+Recebimento", color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Arquivados", value: archivedProcesses.toString(), icon: Archive, href: "/protocolos/arquivados", color: "text-slate-600", bg: "bg-slate-100" },
    { title: "Próximos do prazo", value: dueSoon.toString(), icon: Timer, href: "/protocolos/acompanhamento?deadline=soon", color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Atrasados", value: overdue.toString(), icon: AlertTriangle, href: "/protocolos/acompanhamento?deadline=overdue", color: "text-red-600", bg: "bg-red-100" },
    { title: "Ouvidoria em tratamento", value: pendingOmbudsman.toString(), icon: MessageSquareWarning, href: "/protocolos/ouvidoria", color: "text-amber-700", bg: "bg-amber-100" },
    { title: "Avisos públicos", value: publishedProcessNotices.toString(), icon: FileCheck2, href: "/portal-protocolos", color: "text-teal-700", bg: "bg-teal-100" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
      <ErpPageTitle
        title="Painel operacional"
        description="Visão consolidada de processos, prazos, ouvidoria e avisos públicos."
        icon={<ClipboardList className="size-5 shrink-0 text-emerald-700" />}
      />

      <section className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Indicadores de processos e protocolos">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="flex min-h-16 items-center gap-3 border border-slate-300 bg-white px-3 py-2 shadow-sm outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <div className={`flex size-8 shrink-0 items-center justify-center rounded ${stat.bg} ${stat.color}`}>
              <stat.icon className="size-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{stat.title}</p>
              <p className="text-xl font-semibold leading-tight tabular-nums text-slate-900">{stat.value}</p>
              <p className="truncate text-[10px] font-medium text-emerald-800">Abrir visão</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
