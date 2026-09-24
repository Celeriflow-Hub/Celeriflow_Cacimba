import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PrintInstrumentReportButton } from "./PrintInstrumentReportButton";

type ReportMeasurement = {
  number: number;
  description: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  measuredAt: string;
  status: string;
  quantity: number | null;
  unit: string | null;
  value: number;
  items: Array<{ description: string; quantity: number; unit: string; value: number }>;
};

type InstrumentLifecycleReportProps = {
  title: string;
  number: string;
  backHref: string;
  generatedAt: string;
  facts: Array<{ label: string; value: string }>;
  groups: Array<{ name: string; description: string | null; status: string; memberCount: number }>;
  parties: Array<{ role: string; name: string; type: string; groupName: string | null; status: string; activeFrom: string | null; activeTo: string | null }>;
  measurements: ReportMeasurement[];
  installments: Array<{ number: number; dueDate: string | null; status: string; value: number; paymentLabel: string | null }>;
  financialSummary: Array<{ label: string; value: number }>;
  financialRecords: Array<{ number: string; date: string; status: string; value: number }>;
  events: Array<{ eventType: string; label: string; actorName: string | null; createdAt: string }>;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value)) : "Não informado";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function InstrumentLifecycleReport({ title, number, backHref, generatedAt, facts, groups, parties, measurements, installments, financialSummary, financialRecords, events }: InstrumentLifecycleReportProps) {
  return (
    <PageFrame className="mx-auto max-w-5xl space-y-3 p-3 print:max-w-none print:p-0">
      <header className="flex flex-wrap items-center justify-between gap-2 print:hidden"><Link href={backHref}><Button variant="outline" size="sm"><ArrowLeft className="size-3.5" />Voltar</Button></Link><PrintInstrumentReportButton /></header>
      <article className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm print:border-0 print:shadow-none">
        <header className="border-b border-slate-200 pb-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Relatório do instrumento</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title} {number}</h1><p className="mt-1 text-xs text-slate-500">Gerado em {formatDateTime(generatedAt)}. Dados de execução física, cronograma e atos financeiros existentes.</p></header>

        <section><h2 className="text-sm font-semibold text-slate-900">Identificação e vigência</h2><dl className="mt-2 grid gap-x-6 gap-y-3 sm:grid-cols-2">{facts.map((fact) => <div key={fact.label}><dt className="text-xs text-slate-500">{fact.label}</dt><dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">{fact.value}</dd></div>)}</dl></section>

        <section className="border-t pt-4"><h2 className="text-sm font-semibold text-slate-900">Responsabilidades e partes</h2>{groups.length ? <div className="mt-2 grid gap-2 sm:grid-cols-2">{groups.map((group) => <div key={group.name} className="rounded border border-slate-200 p-2 text-xs"><p className="font-semibold">{group.name} <span className="font-normal text-slate-500">· {group.status}</span></p><p className="mt-1 text-slate-600">{group.description || "Sem descrição"}</p><p className="mt-1 text-slate-500">{group.memberCount} membro{group.memberCount === 1 ? "" : "s"}</p></div>)}</div> : <p className="mt-2 text-xs text-slate-500">Nenhum grupo de responsabilidade registrado.</p>}{parties.length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-2 py-1.5">Papel</th><th className="px-2 py-1.5">Parte</th><th className="px-2 py-1.5">Grupo</th><th className="px-2 py-1.5">Vigência</th><th className="px-2 py-1.5">Situação</th></tr></thead><tbody className="divide-y divide-slate-100">{parties.map((party, index) => <tr key={`${party.role}-${party.name}-${index}`}><td className="px-2 py-1.5 font-medium">{party.role}</td><td className="px-2 py-1.5">{party.name}<span className="block text-[10px] text-slate-500">{party.type}</span></td><td className="px-2 py-1.5">{party.groupName || "Sem grupo"}</td><td className="px-2 py-1.5">{formatDate(party.activeFrom)} a {formatDate(party.activeTo)}</td><td className="px-2 py-1.5">{party.status}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-xs text-slate-500">Nenhuma parte adicional registrada.</p>}</section>

        <section className="border-t pt-4"><h2 className="text-sm font-semibold text-slate-900">Medições e execução física</h2><p className="mt-1 text-xs text-slate-500">Medições não constituem liquidação ou pagamento.</p>{measurements.length ? <div className="mt-2 space-y-2">{measurements.map((measurement) => <div key={measurement.number} className="rounded border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2 text-xs"><p className="font-semibold">Medição {measurement.number} · {measurement.status}</p><p>{formatDate(measurement.measuredAt)} · {money.format(measurement.value)}</p></div><p className="mt-1 text-xs text-slate-700">{measurement.description || "Sem descrição"}</p><p className="mt-1 text-xs text-slate-500">Período: {formatDate(measurement.periodStart)} a {formatDate(measurement.periodEnd)}{measurement.quantity !== null && measurement.unit ? ` · ${measurement.quantity} ${measurement.unit}` : ""}</p>{measurement.items.length ? <ul className="mt-2 space-y-1 border-t pt-2 text-xs text-slate-600">{measurement.items.map((item, index) => <li key={`${item.description}-${index}`}>{item.description}: {item.quantity} {item.unit} · {money.format(item.value)}</li>)}</ul> : null}</div>)}</div> : <p className="mt-2 text-xs text-slate-500">Nenhuma medição registrada.</p>}</section>

        <section className="border-t pt-4"><h2 className="text-sm font-semibold text-slate-900">Parcelas programadas</h2><p className="mt-1 text-xs text-slate-500">Cronograma administrativo; pagamento somente aparece quando há vínculo financeiro real.</p>{installments.length ? <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-2 py-1.5">Parcela</th><th className="px-2 py-1.5">Vencimento</th><th className="px-2 py-1.5 text-right">Valor</th><th className="px-2 py-1.5">Situação</th><th className="px-2 py-1.5">Pagamento real</th></tr></thead><tbody className="divide-y divide-slate-100">{installments.map((installment) => <tr key={installment.number}><td className="px-2 py-1.5">{installment.number}</td><td className="px-2 py-1.5">{formatDate(installment.dueDate)}</td><td className="px-2 py-1.5 text-right tabular-nums">{money.format(installment.value)}</td><td className="px-2 py-1.5">{installment.status}</td><td className="px-2 py-1.5">{installment.paymentLabel || "Não vinculado"}</td></tr>)}</tbody></table></div> : <p className="mt-2 text-xs text-slate-500">Nenhuma parcela programada.</p>}</section>

        <section className="border-t pt-4"><h2 className="text-sm font-semibold text-slate-900">Execução financeira existente</h2>{financialSummary.length ? <div className="mt-2 grid gap-3 sm:grid-cols-3">{financialSummary.map((summary) => <div key={summary.label} className="rounded border border-slate-200 p-2"><p className="text-xs text-slate-500">{summary.label}</p><p className="mt-1 font-semibold tabular-nums text-slate-800">{money.format(summary.value)}</p></div>)}</div> : null}{financialRecords.length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-2 py-1.5">Registro</th><th className="px-2 py-1.5">Data</th><th className="px-2 py-1.5">Situação</th><th className="px-2 py-1.5 text-right">Valor</th></tr></thead><tbody className="divide-y divide-slate-100">{financialRecords.map((record) => <tr key={record.number}><td className="px-2 py-1.5">{record.number}</td><td className="px-2 py-1.5">{formatDate(record.date)}</td><td className="px-2 py-1.5">{record.status}</td><td className="px-2 py-1.5 text-right tabular-nums">{money.format(record.value)}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-xs text-slate-500">Nenhum ato financeiro vinculado.</p>}</section>

        <section className="border-t pt-4"><h2 className="text-sm font-semibold text-slate-900">Trilha de auditoria</h2>{events.length ? <div className="mt-2 space-y-1.5">{events.map((event) => <div key={event.eventType + event.createdAt} className="flex flex-wrap justify-between gap-2 rounded border border-slate-200 px-2 py-1.5 text-xs"><span className="font-medium">{event.label}</span><span>{event.actorName || "Usuário não informado"}</span><span className="text-slate-500">{formatDateTime(event.createdAt)}</span></div>)}</div> : <p className="mt-2 text-xs text-slate-500">Nenhum evento de auditoria registrado.</p>}</section>
      </article>
    </PageFrame>
  );
}
