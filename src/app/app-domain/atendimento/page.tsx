import { AlertTriangle, CheckCircle2, Clock3, Headphones, Timer } from "lucide-react";
import Link from "next/link";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { getAttendanceContext, ombudsmanScope, ticketScope } from "@/lib/attendance/access";

export const dynamic = "force-dynamic";

export default async function AtendimentoDashboardPage() {
  const context = await getAttendanceContext();
  const { prisma } = context;
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const deadlineWarning = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const activeTicketStatuses = { notIn: ["Concluído", "Cancelado"] };
  const [openedToday, inProgressTicketsCount, awaitingInformationCount, resolvedTicketsCount, overdueTicketsCount, upcomingTicketsCount, pendingOmbudsmanCount, investigatingOmbudsmanCount, concludedOmbudsmanCount, ombudsmanTypes, ticketsByDepartment, ticketsByChannel, ticketsByPriority, tickets] = await Promise.all([
    prisma.ticket.count({ where: { AND: [ticketScope(context), { createdAt: { gte: today } }] } }),
    prisma.ticket.count({ where: { AND: [ticketScope(context), { status: "Em Atendimento" }] } }),
    prisma.ticket.count({ where: { AND: [ticketScope(context), { status: "Aguardando Informação" }] } }),
    prisma.ticket.count({ where: { AND: [ticketScope(context), { status: "Resolvido" }] } }),
    prisma.ticket.count({ where: { AND: [ticketScope(context), { dueAt: { lt: now }, status: activeTicketStatuses }] } }),
    prisma.ticket.count({ where: { AND: [ticketScope(context), { dueAt: { gte: now, lte: deadlineWarning }, status: activeTicketStatuses }] } }),
    prisma.ombudsman.count({ where: { AND: [ombudsmanScope(context), { status: { not: "Concluída" } }] } }),
    prisma.ombudsman.count({ where: { AND: [ombudsmanScope(context), { status: "Em Apuração" }] } }),
    prisma.ombudsman.count({ where: { AND: [ombudsmanScope(context), { status: "Concluída" }] } }),
    prisma.ombudsman.groupBy({ by: ["type"], where: ombudsmanScope(context), _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ["departmentId"], where: ticketScope(context), _count: { _all: true }, orderBy: { _count: { departmentId: "desc" } }, take: 5 }),
    prisma.ticket.groupBy({ by: ["channelId"], where: ticketScope(context), _count: { _all: true }, orderBy: { _count: { channelId: "desc" } }, take: 5 }),
    prisma.ticket.groupBy({ by: ["priority"], where: ticketScope(context), _count: { _all: true }, orderBy: { _count: { priority: "desc" } } }),
    prisma.ticket.findMany({
      where: ticketScope(context),
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        person: { select: { fullName: true } },
        company: { select: { corporateName: true } },
        channel: { select: { name: true } },
      },
    }),
  ]);
  const departmentIds = ticketsByDepartment.flatMap((row) => row.departmentId ? [row.departmentId] : []);
  const channelIds = ticketsByChannel.map((row) => row.channelId);
  const [departments, channels] = await Promise.all([
    prisma.department.findMany({ where: { id: { in: departmentIds } }, select: { id: true, name: true } }),
    prisma.supportChannel.findMany({ where: { id: { in: channelIds } }, select: { id: true, name: true } }),
  ]);
  const departmentNames = new Map(departments.map((department) => [department.id, department.name]));
  const channelNames = new Map(channels.map((channel) => [channel.id, channel.name]));
  const typeCounts = new Map(ombudsmanTypes.map((row) => [row.type, row._count._all]));

  const stats = [
    { title: "Abertos hoje", value: openedToday.toString(), icon: Headphones, href: "/atendimento/central", color: "text-violet-600", bg: "bg-violet-100" },
    { title: "Em Atendimento", value: inProgressTicketsCount.toString(), icon: CheckCircle2, href: "/atendimento/fila?status=Em%20Atendimento", color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Aguardando informação", value: awaitingInformationCount.toString(), icon: Clock3, href: "/atendimento/fila?status=Aguardando%20Informa%C3%A7%C3%A3o", color: "text-sky-600", bg: "bg-sky-100" },
    { title: "Resolvidos", value: resolvedTicketsCount.toString(), icon: CheckCircle2, href: "/atendimento/central?status=Resolvido", color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Atrasados", value: overdueTicketsCount.toString(), icon: AlertTriangle, href: "/atendimento/central?overdue=1", color: "text-red-600", bg: "bg-red-100" },
    { title: "Próximos do prazo", value: upcomingTicketsCount.toString(), icon: Timer, href: "/atendimento/central?deadline=upcoming", color: "text-amber-600", bg: "bg-amber-100" },
  ];
  const table = (title: string, rows: Array<[string, number]>) => (
    <section className="rounded-md border border-slate-200 bg-white">
      <h2 className="border-b border-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">{title}</h2>
      <div className="divide-y divide-slate-100">
        {rows.length ? rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="text-slate-600">{label}</span>
            <span className="font-semibold text-slate-900">{value}</span>
          </div>
        )) : <p className="px-3 py-4 text-sm text-slate-500">Sem dados no escopo autorizado.</p>}
      </div>
    </section>
  );

  return (
    <PageFrame className="space-y-2">
      <PageHeader
        title="Painel de Atendimento"
        icon={<Headphones className="size-4 shrink-0 text-violet-600" />}
        action={(
          <Link href="/atendimento/novo" aria-label="Novo Chamado Rápido" className="inline-flex h-7 items-center rounded-md bg-violet-600 px-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-700">
            <span className="hidden sm:inline">Novo Chamado Rápido</span>
            <span className="sm:hidden">Novo</span>
          </Link>
        )}
      />

       <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
         {stats.map((stat) => (
           <Link key={stat.title} href={stat.href} className="block group">
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="mt-0.5 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`flex size-9 items-center justify-center rounded-md ${stat.bg} ${stat.color} transition-transform duration-200 group-hover:scale-105`}>
                <stat.icon className="size-5" strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        ))}
       </div>

       <section className="rounded-md border border-amber-200 bg-amber-50 p-3">
         <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-bold text-amber-950">Ouvidoria</h2><p className="mt-0.5 text-xs text-amber-800">Indicadores agregados, sem identidade, contato ou narrativa de manifestantes.</p></div><Link href="/atendimento/ouvidoria" className="text-xs font-semibold text-amber-800">Ver manifestações</Link></div>
         <div className="mt-3 grid gap-2 sm:grid-cols-3"><div className="rounded-md bg-white p-3"><p className="text-sm text-slate-500">Manifestações Pendentes</p><p className="mt-0.5 text-xl font-bold text-slate-900">{pendingOmbudsmanCount}</p></div><div className="rounded-md bg-white p-3"><p className="text-sm text-slate-500">Em apuração</p><p className="mt-0.5 text-xl font-bold text-slate-900">{investigatingOmbudsmanCount}</p></div><div className="rounded-md bg-white p-3"><p className="text-sm text-slate-500">Concluídas</p><p className="mt-0.5 text-xl font-bold text-slate-900">{concludedOmbudsmanCount}</p></div></div>
         <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{["Denúncia", "Reclamação", "Sugestão", "Elogio"].map((type) => <div key={type} className="rounded-md border border-amber-100 bg-white px-3 py-2 text-sm"><span className="text-slate-600">{type}</span><strong className="float-right text-slate-900">{typeCounts.get(type) || 0}</strong></div>)}</div>
       </section>

       <div className="grid gap-2 lg:grid-cols-3">{table("Atendimentos por setor", ticketsByDepartment.map((row) => [row.departmentId ? departmentNames.get(row.departmentId) || "Setor removido" : "Sem setor", row._count._all]))}{table("Atendimentos por canal", ticketsByChannel.map((row) => [channelNames.get(row.channelId) || "Canal removido", row._count._all]))}{table("Atendimentos por prioridade", ticketsByPriority.map((row) => [row.priority, row._count._all]))}</div>

         <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
           <div className="flex justify-between border-b p-3"><h2 className="text-sm font-semibold">Chamados recentes</h2><Link href="/atendimento/central" className="text-xs font-semibold text-violet-700">Ver central</Link></div>
           <div className="divide-y">{tickets.map((ticket) => <Link key={ticket.id} href={`/atendimento/chamados/${ticket.id}`} className="block p-3 hover:bg-slate-50"><strong>{ticket.ticketNumber}</strong><span className="ml-3">{ticket.subject}</span><small className="mt-0.5 block text-slate-500">{ticket.isAnonymous ? "Anônimo" : ticket.person?.fullName || ticket.company?.corporateName || "Não informado"} · {ticket.channel.name} · {ticket.status}</small></Link>)}{tickets.length === 0 && <p className="p-5 text-center text-slate-500">Nenhum chamado no escopo autorizado.</p>}</div>
        </div>
    </PageFrame>
  );
}
