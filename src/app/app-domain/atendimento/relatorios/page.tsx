import Link from "next/link";
import { BarChart3, ShieldCheck } from "lucide-react";
import { getAttendanceContext, ombudsmanScope, ticketScope } from "@/lib/attendance/access";

export const dynamic = "force-dynamic";

function reportDate(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function averageHours(rows: Array<{ createdAt: Date; completedAt: Date | null }>) {
  const completed = rows.filter((row) => row.completedAt);
  if (!completed.length) return null;
  return Math.round(completed.reduce((total, row) => total + (row.completedAt!.getTime() - row.createdAt.getTime()) / 3600000, 0) / completed.length);
}

export default async function AtendimentoReportsPage({ searchParams }: { searchParams: Promise<{ start?: string; end?: string; departmentId?: string }> }) {
  const { start = "", end = "", departmentId = "" } = await searchParams;
  const context = await getAttendanceContext();
  const startDate = reportDate(start);
  const endDate = reportDate(end, true);
  const dateFilter = startDate || endDate ? { createdAt: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lt: endDate } : {}) } } : {};
  const departmentFilter = context.attendanceAccess.isManager && departmentId ? { departmentId } : {};
  const ticketsWhere = { AND: [ticketScope(context), dateFilter, departmentFilter] };
  const ombudsmanWhere = { AND: [ombudsmanScope(context), dateFilter, departmentFilter] };
  const now = new Date();
  const deadlineWarning = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const [ticketStatus, ticketDepartments, ticketChannels, ticketPriorities, ticketResponsibles, ticketDeadlines, ombudsmanTypes, ombudsmanStatus, ombudsmanDepartments, ombudsmanResponsibles, ombudsmanCompletions, departments, employees, channels] = await Promise.all([
    context.prisma.ticket.groupBy({ by: ["status"], where: ticketsWhere, _count: { _all: true }, orderBy: { _count: { status: "desc" } } }),
    context.prisma.ticket.groupBy({ by: ["departmentId"], where: ticketsWhere, _count: { _all: true }, orderBy: { _count: { departmentId: "desc" } } }),
    context.prisma.ticket.groupBy({ by: ["channelId"], where: ticketsWhere, _count: { _all: true }, orderBy: { _count: { channelId: "desc" } } }),
    context.prisma.ticket.groupBy({ by: ["priority"], where: ticketsWhere, _count: { _all: true }, orderBy: { _count: { priority: "desc" } } }),
    context.prisma.ticket.groupBy({ by: ["resolvedById"], where: { AND: [ticketsWhere, { resolvedAt: { not: null } }] }, _count: { _all: true }, orderBy: { _count: { resolvedById: "desc" } } }),
    context.prisma.ticket.findMany({ where: ticketsWhere, select: { createdAt: true, dueAt: true, resolvedAt: true, concludedAt: true } }),
    context.prisma.ombudsman.groupBy({ by: ["type"], where: ombudsmanWhere, _count: { _all: true }, orderBy: { _count: { type: "desc" } } }),
    context.prisma.ombudsman.groupBy({ by: ["status"], where: ombudsmanWhere, _count: { _all: true }, orderBy: { _count: { status: "desc" } } }),
    context.prisma.ombudsman.groupBy({ by: ["departmentId"], where: ombudsmanWhere, _count: { _all: true }, orderBy: { _count: { departmentId: "desc" } } }),
    context.prisma.ombudsman.groupBy({ by: ["concludedById"], where: { AND: [ombudsmanWhere, { concludedAt: { not: null } }] }, _count: { _all: true }, orderBy: { _count: { concludedById: "desc" } } }),
    context.prisma.ombudsman.findMany({ where: ombudsmanWhere, select: { createdAt: true, concludedAt: true } }),
    context.prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    context.prisma.employee.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    context.prisma.supportChannel.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ]);
  const departmentNames = new Map(departments.map((department) => [department.id, department.name]));
  const employeeNames = new Map(employees.map((employee) => [employee.id, employee.name]));
  const channelNames = new Map(channels.map((channel) => [channel.id, channel.name]));
  const openTicketDeadline = ticketDeadlines.filter((ticket) => ticket.dueAt && !ticket.concludedAt);
  const overdue = openTicketDeadline.filter((ticket) => ticket.dueAt! < now).length;
  const upcoming = openTicketDeadline.filter((ticket) => ticket.dueAt! >= now && ticket.dueAt! <= deadlineWarning).length;
  const completedOnTime = ticketDeadlines.filter((ticket) => ticket.dueAt && ticket.concludedAt && ticket.concludedAt <= ticket.dueAt!).length;
  const ticketAverage = averageHours(ticketDeadlines.map((ticket) => ({ createdAt: ticket.createdAt, completedAt: ticket.concludedAt || ticket.resolvedAt })));
  const ombudsmanAverage = averageHours(ombudsmanCompletions.map((item) => ({ createdAt: item.createdAt, completedAt: item.concludedAt })));
  const totalTickets = ticketStatus.reduce((total, item) => total + item._count._all, 0);
  const totalOmbudsman = ombudsmanStatus.reduce((total, item) => total + item._count._all, 0);
  const table = (title: string, rows: Array<[string, number]>) => <section className="rounded-xl border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-800">{title}</h2><div className="divide-y divide-slate-100">{rows.length ? rows.map(([label, value]) => <div key={label} className="flex items-center justify-between px-5 py-3 text-sm"><span className="text-slate-600">{label}</span><span className="font-semibold text-slate-900">{value}</span></div>) : <p className="px-5 py-6 text-sm text-slate-500">Sem dados no período e escopo selecionados.</p>}</div></section>;

  return <div className="max-w-7xl space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><BarChart3 className="h-6 w-6 text-violet-600" />Relatórios de Atendimento e Ouvidoria</h1><p className="mt-1 text-sm text-slate-500">Indicadores operacionais do escopo que você pode visualizar.</p></div><Link href="/atendimento" className="text-sm font-semibold text-violet-700">Voltar ao painel</Link></div><form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"><label className="text-sm text-slate-600">Início<input type="date" name="start" defaultValue={start} className="mt-1 block rounded-lg border p-2" /></label><label className="text-sm text-slate-600">Fim<input type="date" name="end" defaultValue={end} className="mt-1 block rounded-lg border p-2" /></label>{context.attendanceAccess.isManager && <label className="text-sm text-slate-600">Setor<select name="departmentId" defaultValue={departmentId} className="mt-1 block rounded-lg border p-2"><option value="">Todos os setores autorizados</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>}<button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Aplicar filtros</button><Link href="/atendimento/relatorios" className="rounded-lg border px-4 py-2 text-sm">Limpar</Link></form><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><ShieldCheck className="mr-2 inline h-5 w-5" /><strong>Relatório protegido:</strong> dados de identidade, CPF, contatos, assunto e narrativa de manifestações não são consultados nem exibidos.</div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Atendimentos</p><p className="mt-2 text-3xl font-bold">{totalTickets}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Atrasados</p><p className="mt-2 text-3xl font-bold text-red-700">{overdue}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Próximos do prazo</p><p className="mt-2 text-3xl font-bold text-amber-700">{upcoming}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Tempo médio de resolução</p><p className="mt-2 text-3xl font-bold">{ticketAverage === null ? "-" : `${ticketAverage}h`}</p></div></div><div className="grid gap-5 lg:grid-cols-3">{table("Atendimentos por status", ticketStatus.map((row) => [row.status, row._count._all]))}{table("Atendimentos por canal", ticketChannels.map((row) => [channelNames.get(row.channelId) || "Canal removido", row._count._all]))}{table("Atendimentos por prioridade", ticketPriorities.map((row) => [row.priority, row._count._all]))}{table("Atendimentos por setor", ticketDepartments.map((row) => [row.departmentId ? departmentNames.get(row.departmentId) || "Setor removido" : "Sem setor", row._count._all]))}{table("Produtividade por responsável", ticketResponsibles.map((row) => [row.resolvedById ? employeeNames.get(row.resolvedById) || "Servidor removido" : "Sem responsável registrado", row._count._all]))}<section className="rounded-xl border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-800">Conformidade de prazo</h2><div className="space-y-3 px-5 py-4 text-sm text-slate-600"><p>Com prazo definido: <strong className="float-right text-slate-900">{ticketDeadlines.filter((ticket) => ticket.dueAt).length}</strong></p><p>Concluídos no prazo: <strong className="float-right text-emerald-700">{completedOnTime}</strong></p><p>Sem prazo definido: <strong className="float-right text-slate-900">{ticketDeadlines.filter((ticket) => !ticket.dueAt).length}</strong></p></div></section></div><section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div><h2 className="font-bold text-amber-950">Ouvidoria</h2><p className="mt-1 text-sm text-amber-800">Métricas agregadas de manifestações acessíveis. O modelo atual não registra SLA de Ouvidoria, portanto não classifica manifestações como atrasadas.</p></div><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-white p-4"><p className="text-sm text-slate-500">Manifestações</p><p className="mt-1 text-2xl font-bold">{totalOmbudsman}</p></div><div className="rounded-xl bg-white p-4"><p className="text-sm text-slate-500">Em apuração</p><p className="mt-1 text-2xl font-bold">{ombudsmanStatus.find((row) => row.status === "Em Apuração")?._count._all || 0}</p></div><div className="rounded-xl bg-white p-4"><p className="text-sm text-slate-500">Tempo médio até conclusão</p><p className="mt-1 text-2xl font-bold">{ombudsmanAverage === null ? "-" : `${ombudsmanAverage}h`}</p></div></div><div className="grid gap-5 lg:grid-cols-3">{table("Manifestações por tipo", ombudsmanTypes.map((row) => [row.type, row._count._all]))}{table("Manifestações por status", ombudsmanStatus.map((row) => [row.status, row._count._all]))}{table("Manifestações por setor", ombudsmanDepartments.map((row) => [row.departmentId ? departmentNames.get(row.departmentId) || "Setor removido" : "Ouvidoria", row._count._all]))}{table("Conclusões por responsável", ombudsmanResponsibles.map((row) => [row.concludedById ? employeeNames.get(row.concludedById) || "Servidor removido" : "Sem responsável registrado", row._count._all]))}</div></section></div>;
}
