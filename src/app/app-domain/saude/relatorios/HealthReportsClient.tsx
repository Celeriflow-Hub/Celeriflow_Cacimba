"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { BarChart3, Download, Eye, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { ErpTableContainer, ErpTableTd, ErpTableTh, ErpTableThead, ErpTableTr } from "@/components/app-ui/erp/ErpTable";
import { getHealthReportOption, healthAdministrativeReportOptions, type HealthAdministrativeReportType, type HealthReportFilter } from "@/lib/saude/health-report-catalog";

type Option = { id: string; name: string };
type Filters = { from: string; to: string; unitId: string; professionalId: string; specialtyId: string; teamId: string; municipality: string; status: string; cid: string; procedure: string; financing: string; covenant: string; query: string; recordId: string };
type ReportRow = Record<string, string | number>;
type Preview = { reportType: HealthAdministrativeReportType; requirement: string; report: { title: string; warnings: string[]; metadata: { scope: string; referencePeriod: string }; sections: { title: string; rows: ReportRow[] }[] }; chart?: { label: string; value: number; percentage: number }[] };
type ReferenceOptions = { units: Option[]; specialties: Option[]; professionals: Option[]; teams: Option[]; financing: string[]; municipalities: { value: string; label: string }[]; covenantStatuses: string[]; appointmentStatuses: string[] };
const PAGE_SIZE = 20;
const initialFilters: Filters = { from: "", to: "", unitId: "", professionalId: "", specialtyId: "", teamId: "", municipality: "", status: "", cid: "", procedure: "", financing: "", covenant: "", query: "", recordId: "" };

function queryString(reportType: HealthAdministrativeReportType, filters: Filters, format: string) {
  return new URLSearchParams({ reportType, format, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) }).toString();
}

function compactValue(value: string | number) {
  const text = String(value);
  return text.length > 52 ? `${text.slice(0, 49)}...` : text;
}

export function HealthReportsClient({ canIssue, options }: { canIssue: boolean; options: ReferenceOptions }) {
  const [reportType, setReportType] = useState<HealthAdministrativeReportType>("CID_LIST");
  const [filters, setFilters] = useState(initialFilters);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<ReportRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const deferredPreview = useDeferredValue(preview);
  const definition = getHealthReportOption(reportType);
  const rows = deferredPreview?.report.sections.flatMap(section => section.rows) || [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allHeaders = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const headers = allHeaders.slice(0, 7);
  const hasMoreDetails = allHeaders.length > headers.length;
  const filterSet = new Set<HealthReportFilter>(definition.filters);

  function update(name: keyof Filters, value: string) { setFilters(current => ({ ...current, [name]: value })); }
  function changeReport(value: HealthAdministrativeReportType) { setReportType(value); setFilters(initialFilters); setPreview(null); setPage(1); setError(""); }

  async function generate() {
    setPending(true); setError("");
    try {
      const response = await fetch(`/api/saude/relatorios?${queryString(reportType, filters, "preview")}`, { cache: "no-store" });
      const body = await response.json() as { dataset?: Preview; error?: string };
      if (!response.ok || !body.dataset) throw new Error(body.error || "Não foi possível gerar o relatório.");
      startTransition(() => { setPreview(body.dataset!); setPage(1); });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível gerar o relatório."); }
    finally { setPending(false); }
  }

  function exportUrl(format: string) { return `/api/saude/relatorios?${queryString(reportType, filters, format)}`; }

  return <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
    <section className="shrink-0 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(230px,1.4fr)_repeat(4,minmax(130px,1fr))_auto]">
        <label className="grid gap-1 text-[11px] font-bold text-slate-600">Relatório<select value={reportType} onChange={event => changeReport(event.target.value as HealthAdministrativeReportType)} className="h-8 min-w-0 rounded border bg-white px-2 text-xs">{healthAdministrativeReportOptions.map(option => <option key={option.type} value={option.type}>{option.requirement} · {option.label}</option>)}</select></label>
        {filterSet.has("period") && <><label className="grid gap-1 text-[11px] font-bold text-slate-600">De<input type="date" value={filters.from} onChange={event => update("from", event.target.value)} className="h-8 rounded border px-2 text-xs" /></label><label className="grid gap-1 text-[11px] font-bold text-slate-600">Até<input type="date" value={filters.to} onChange={event => update("to", event.target.value)} className="h-8 rounded border px-2 text-xs" /></label></>}
        {filterSet.has("unit") && <FilterSelect label="Unidade" value={filters.unitId} onChange={value => update("unitId", value)} options={options.units} />}
        {filterSet.has("professional") && <FilterSelect label="Profissional" value={filters.professionalId} onChange={value => update("professionalId", value)} options={options.professionals} />}
        {filterSet.has("specialty") && <FilterSelect label="Especialidade" value={filters.specialtyId} onChange={value => update("specialtyId", value)} options={options.specialties} />}
        {filterSet.has("team") && <FilterSelect label="Equipe" value={filters.teamId} onChange={value => update("teamId", value)} options={options.teams} />}
        {filterSet.has("municipality") && <label className="grid gap-1 text-[11px] font-bold text-slate-600">Município<select value={filters.municipality} onChange={event => update("municipality", event.target.value)} className="h-8 rounded border bg-white px-2 text-xs"><option value="">Todos</option>{options.municipalities.map(option => <option key={option.label} value={option.value}>{option.label}</option>)}</select></label>}
        {filterSet.has("financing") && <label className="grid gap-1 text-[11px] font-bold text-slate-600">Financiamento<select value={filters.financing} onChange={event => update("financing", event.target.value)} className="h-8 rounded border bg-white px-2 text-xs"><option value="">Todos</option>{options.financing.map(value => <option key={value}>{value}</option>)}</select></label>}
        {filterSet.has("status") && <StatusFilter reportType={reportType} value={filters.status} onChange={value => update("status", value)} covenantStatuses={options.covenantStatuses} appointmentStatuses={options.appointmentStatuses} />}
        {filterSet.has("cid") && <TextFilter label="CID" value={filters.cid} onChange={value => update("cid", value)} />}
        {filterSet.has("procedure") && <TextFilter label="Procedimento" value={filters.procedure} onChange={value => update("procedure", value)} />}
        {filterSet.has("covenant") && <TextFilter label="Convênio" value={filters.covenant} onChange={value => update("covenant", value)} />}
        {filterSet.has("query") && <TextFilter label="Busca" value={filters.query} onChange={value => update("query", value)} />}
        {filterSet.has("record") && <TextFilter label="Registro (ID ou protocolo)" value={filters.recordId} onChange={value => update("recordId", value)} />}
        <div className="flex items-end"><Button className="h-8 w-full" onClick={generate} disabled={!canIssue || pending}>{pending ? "Gerando..." : "Gerar"}</Button></div>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">{error}</p>}
      {!canIssue && <p className="mt-2 text-xs font-semibold text-amber-700">Seu perfil não possui permissão para emitir relatórios.</p>}
    </section>

    {preview ? <>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{preview.requirement} · {preview.report.title}</p><p className="truncate text-[10px] text-slate-500">{preview.report.metadata.scope} · {preview.report.metadata.referencePeriod}</p></div><div className="flex flex-wrap gap-1"><ExportButton href={exportUrl("pdf")} label="PDF" icon={<FileText className="size-3" />} /><ExportButton href={exportUrl("xlsx")} label="Excel" icon={<FileSpreadsheet className="size-3" />} /><ExportButton href={exportUrl("csv")} label="CSV" icon={<Download className="size-3" />} /><button type="button" onClick={() => window.open(exportUrl("print"), "_blank", "noopener,noreferrer")} className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-[11px] font-bold"><Printer className="size-3" />Imprimir</button></div></div>
      {preview.report.warnings.map(warning => <p key={warning} className="shrink-0 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-800">{warning}</p>)}
      {preview.chart && <PercentageChart rows={preview.chart} />}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm"><ErpTableContainer className="overflow-y-auto overflow-x-hidden"><table className="w-full table-fixed border-collapse"><ErpTableThead><ErpTableTr>{headers.map(header => <ErpTableTh key={header}>{header}</ErpTableTh>)}{hasMoreDetails && <ErpTableTh className="w-[58px] text-center">Ação</ErpTableTh>}</ErpTableTr></ErpTableThead><tbody>{visibleRows.map((row, index) => <ErpTableTr key={`${page}-${index}`}>{headers.map(header => <ErpTableTd key={header} className="truncate" title={String(row[header] ?? "")}>{compactValue(row[header] ?? "")}</ErpTableTd>)}{hasMoreDetails && <ErpTableTd className="text-center"><button type="button" onClick={() => setSelectedRow(row)} className="inline-flex size-7 items-center justify-center rounded border" aria-label="Visualizar detalhes"><Eye className="size-3.5" /></button></ErpTableTd>}</ErpTableTr>)}</tbody></table>{!rows.length && <div className="p-8 text-center text-xs text-slate-500">Nenhum registro encontrado para os filtros informados.</div>}</ErpTableContainer></div>
      <div className="shrink-0"><ErpPagination page={page} total={rows.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" onPageChange={next => setPage(Math.min(Math.max(1, next), pageCount))} label="registros" /></div>
    </> : <div className="grid min-h-0 flex-1 place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50"><div className="text-center text-slate-500"><BarChart3 className="mx-auto mb-2 size-8" /><p className="text-xs font-semibold">Selecione os filtros e gere o relatório.</p></div></div>}

    <Dialog open={Boolean(selectedRow)} onOpenChange={open => !open && setSelectedRow(null)}><DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Detalhes do registro</DialogTitle><DialogDescription>{preview?.report.title}</DialogDescription></DialogHeader>{selectedRow && <div className="grid gap-2 sm:grid-cols-2">{Object.entries(selectedRow).map(([label, value]) => <div key={label} className="rounded border border-slate-200 p-2"><p className="text-[10px] font-bold uppercase text-slate-500">{label}</p><p className="break-words text-xs text-slate-800">{value}</p></div>)}</div>}<DialogFooter><Button onClick={() => setSelectedRow(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Option[] }) { return <label className="grid gap-1 text-[11px] font-bold text-slate-600">{label}<select value={value} onChange={event => onChange(event.target.value)} className="h-8 min-w-0 rounded border bg-white px-2 text-xs"><option value="">Todos</option>{options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>; }
function TextFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1 text-[11px] font-bold text-slate-600">{label}<input value={value} onChange={event => onChange(event.target.value)} className="h-8 min-w-0 rounded border px-2 text-xs" /></label>; }
function StatusFilter({ reportType, value, onChange, covenantStatuses, appointmentStatuses }: { reportType: HealthAdministrativeReportType; value: string; onChange: (value: string) => void; covenantStatuses: string[]; appointmentStatuses: string[] }) { const values = reportType === "COVENANT_LIST" ? covenantStatuses : reportType === "EXTERNAL_DEMAND_BY_SPECIALTY" ? appointmentStatuses : ["active", "inactive"]; return <label className="grid gap-1 text-[11px] font-bold text-slate-600">Situação<select value={value} onChange={event => onChange(event.target.value)} className="h-8 rounded border bg-white px-2 text-xs"><option value="">Todas</option>{values.map(item => <option key={item} value={item}>{item === "active" ? "Ativo" : item === "inactive" ? "Inativo" : item}</option>)}</select></label>; }
function ExportButton({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) { return <a href={href} className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-[11px] font-bold">{icon}{label}</a>; }
function PercentageChart({ rows }: { rows: { label: string; value: number; percentage: number }[] }) { const total = rows.reduce((sum, row) => sum + row.value, 0); return <section className="max-h-44 shrink-0 overflow-y-auto rounded-md border border-slate-200 bg-white p-2"><div className="mb-2 flex justify-between text-[11px] font-bold"><span>Distribuição por município</span><span>{total} atendimento(s) · 100,00%</span></div><div className="space-y-1.5">{rows.map(row => <div key={row.label} className="grid grid-cols-[minmax(100px,180px)_1fr_72px] items-center gap-2 text-[10px]"><span className="truncate" title={row.label}>{row.label}</span><div className="h-3 overflow-hidden rounded bg-slate-100"><div className="h-full rounded bg-emerald-600" style={{ width: `${Math.min(100, row.percentage)}%` }} /></div><span className="text-right font-bold">{row.value} · {row.percentage.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%</span></div>)}</div></section>; }
