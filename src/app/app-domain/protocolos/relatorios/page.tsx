import { BarChart3 } from "lucide-react";
import { getProtocolContext, protocolScope } from "@/lib/protocols/access";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function ProtocolReportsPage() {
  const context = await getProtocolContext();
  const processes = await context.prisma.process.findMany({
    where: protocolScope(context),
    select: { status: true, expectedCompletionAt: true, completedAt: true, processType: { select: { name: true } }, subject: { select: { name: true } }, currentDepartment: { select: { name: true } } },
    take: 1000,
  });
  const group = (values: string[]) => Object.entries(values.reduce<Record<string, number>>((result, value) => ({ ...result, [value]: (result[value] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const status = group(processes.map(process => process.status));
  const types = group(processes.map(process => process.processType.name));
  const departments = group(processes.map(process => process.currentDepartment?.name || "Sem setor"));
  const withDeadline = processes.filter(process => process.expectedCompletionAt);
  const onTime = withDeadline.filter(process => process.completedAt && process.completedAt <= process.expectedCompletionAt!).length;
  const overdue = withDeadline.filter(process => !process.completedAt && process.expectedCompletionAt! < new Date()).length;
  const compliance = withDeadline.length ? Math.round((onTime / withDeadline.length) * 100) : 0;
  const table = (title: string, rows: [string, number][]) => <section className="rounded-xl border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-800">{title}</h2><div className="divide-y divide-slate-100">{rows.length ? rows.map(([label, value]) => <div key={label} className="flex items-center justify-between px-5 py-3 text-sm"><span className="text-slate-600">{label}</span><span className="font-semibold text-slate-900">{value}</span></div>) : <p className="px-5 py-6 text-sm text-slate-500">Sem dados.</p>}</div></section>;

  return <PageFrame className="max-w-6xl space-y-2"><PageHeader title="Relatórios de Protocolos" icon={<BarChart3 className="size-4 shrink-0 text-emerald-600" />} /><p className="text-xs text-slate-500">Resumo operacional do escopo que você pode visualizar.</p><div className="grid gap-2 sm:grid-cols-3"><div className="rounded-md border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Processos analisados</p><p className="mt-1 text-2xl font-bold text-slate-900">{processes.length}</p></div><div className="rounded-md border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Concluídos no prazo</p><p className="mt-1 text-2xl font-bold text-emerald-700">{compliance}%</p></div><div className="rounded-md border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Atrasados em aberto</p><p className="mt-1 text-2xl font-bold text-red-700">{overdue}</p></div></div><div className="grid gap-2 lg:grid-cols-3">{table("Por status", status)}{table("Por tipo", types)}{table("Por setor atual", departments)}</div></PageFrame>;
}
