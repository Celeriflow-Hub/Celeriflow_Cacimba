"use client";

import Link from "next/link";
import { useDeferredValue, useState, useTransition, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, FileDown, Send, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  notifyPendingPriceResearchInvitationsAction,
  queueProcurementExportAction,
  recordProcurementExportOutcomeAction,
} from "./actions";

type ExportStatus = "PENDING_CONFIGURATION" | "QUEUED" | "CONFIRMED" | "REJECTED";

type ExportPackageRow = {
  id: string;
  packageCode: string;
  packageName: string;
  requirementIds: string[];
  integrationCode: string;
  targetId: string;
  targetType: string;
  targetReference: string;
  targetSecondaryReference: string;
  state: ExportStatus | null;
  message: string | null;
  blockedReasons: string[];
  runId: string | null;
  hasExportPackage: boolean;
  externalId: string | null;
  createdAt: string | null;
};

const pageSize = 20;

function stateLabel(state: ExportStatus | null) {
  if (state === "PENDING_CONFIGURATION") return "Pendente de configuracao";
  if (state === "QUEUED") return "Enfileirado";
  if (state === "CONFIRMED") return "Confirmado";
  if (state === "REJECTED") return "Rejeitado";
  return "Sem pacote";
}

function stateClass(state: ExportStatus | null) {
  if (state === "CONFIRMED") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (state === "QUEUED") return "border-sky-200 bg-sky-50 text-sky-800";
  if (state === "REJECTED") return "border-rose-200 bg-rose-50 text-rose-800";
  if (state === "PENDING_CONFIGURATION") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("pt-BR") : "-";
}

export default function ProcurementExportsClient({ rows, pendingInvitationCount }: { rows: ExportPackageRow[]; pendingInvitationCount: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [integrationFilter, setIntegrationFilter] = useState("ALL");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [outcomeRow, setOutcomeRow] = useState<ExportPackageRow | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState<"CONFIRMED" | "REJECTED">("CONFIRMED");
  const [externalReference, setExternalReference] = useState("");
  const [pending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query).trim().toLocaleLowerCase("pt-BR");
  const filteredRows = rows.filter((row) => {
    const matchesQuery = !deferredQuery || [
      row.packageName,
      row.packageCode,
      row.targetReference,
      row.targetSecondaryReference,
      row.requirementIds.join(" "),
    ].join(" ").toLocaleLowerCase("pt-BR").includes(deferredQuery);
    const matchesIntegration = integrationFilter === "ALL" || row.integrationCode === integrationFilter;
    const matchesState = stateFilter === "ALL" || (stateFilter === "NONE" ? row.state === null : row.state === stateFilter);
    return matchesQuery && matchesIntegration && matchesState;
  });
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetPage() {
    setPage(1);
  }

  function prepare(row: ExportPackageRow) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await queueProcurementExportAction({ packageCode: row.packageCode, targetId: row.targetId });
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice(result.data?.message ?? "Pacote atualizado.");
      router.refresh();
    });
  }

  function notifyPendingInvitations() {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await notifyPendingPriceResearchInvitationsAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice(result.data?.message ?? "Lembretes internos atualizados.");
      router.refresh();
    });
  }

  function openOutcome(row: ExportPackageRow) {
    setOutcomeRow(row);
    setOutcomeStatus("CONFIRMED");
    setExternalReference("");
    setError("");
    setNotice("");
  }

  function submitOutcome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!outcomeRow?.runId) return;
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await recordProcurementExportOutcomeAction({
        runId: outcomeRow.runId,
        status: outcomeStatus,
        externalReference,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice(result.data?.message ?? "Retorno externo registrado.");
      setOutcomeRow(null);
      router.refresh();
    });
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-2 overflow-hidden bg-slate-50 p-3 dark:bg-slate-950">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Pacotes de Exportacao de Compras</h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">CLC-038, CLC-040, CLC-048 e CLC-079. O fluxo prepara pacotes e registra retornos; nao transmite automaticamente.</p>
        </div>
        <div className="flex basis-full flex-wrap items-center gap-2 sm:basis-auto">
          <Link href="/configuracoes/integracoes" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Settings2 className="size-4" /> Configuracoes
          </Link>
          <button type="button" onClick={notifyPendingInvitations} disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
            <Send className="size-4" /> <span className="sm:hidden">Lembretes ({pendingInvitationCount})</span><span className="hidden sm:inline">Lembretes internos ({pendingInvitationCount})</span>
          </button>
        </div>
      </div>

      {error ? <p role="alert" className="shrink-0 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p> : null}
      {notice ? <p role="status" className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p> : null}

      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-2.5 dark:border-slate-800">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <label className="min-w-[14rem] flex-1 sm:max-w-xl"><span className="sr-only">Buscar pacote</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Buscar pacote, CLC, licitacao ou contrato" className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" /></label>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">Destino<select value={integrationFilter} onChange={(event) => { setIntegrationFilter(event.target.value); resetPage(); }} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value="ALL">Todos</option><option value="TCE_PB_SAGRES">TCE</option><option value="PNCP">PNCP</option></select></label>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">Situacao<select value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); resetPage(); }} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value="ALL">Todas</option><option value="NONE">Sem pacote</option><option value="PENDING_CONFIGURATION">Pendente de configuracao</option><option value="QUEUED">Enfileirado</option><option value="CONFIRMED">Confirmado</option><option value="REJECTED">Rejeitado</option></select></label>
          </div>
          <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{filteredRows.length} {filteredRows.length === 1 ? "registro" : "registros"}</span>
        </div>

        {outcomeRow ? (
          <form onSubmit={submitOutcome} className="flex shrink-0 flex-wrap items-end gap-2 border-b border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="mr-auto min-w-48"><p className="text-sm font-semibold text-slate-900 dark:text-white">Registrar retorno externo: {outcomeRow.targetReference}</p><p className="mt-0.5 text-xs text-slate-500">Confirme somente com referencia recebida fora do sistema. Este registro nao comprova transmissao automatica.</p></div>
            <label className="text-sm text-slate-700 dark:text-slate-300">Resultado<select value={outcomeStatus} onChange={(event) => setOutcomeStatus(event.target.value as "CONFIRMED" | "REJECTED")} className="mt-1 block h-9 rounded-md border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="CONFIRMED">Confirmado</option><option value="REJECTED">Rejeitado</option></select></label>
            <label className="min-w-56 flex-1 text-sm text-slate-700 dark:text-slate-300">Referencia externa<input required value={externalReference} onChange={(event) => setExternalReference(event.target.value)} placeholder="recibo-ou-protocolo" className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
            <button type="submit" disabled={pending || !externalReference.trim()} className="h-9 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">Registrar</button>
            <button type="button" onClick={() => setOutcomeRow(null)} disabled={pending} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Cancelar</button>
          </form>
        ) : null}

        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed border-collapse text-left text-[11px] sm:text-xs">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><tr><th className="px-3 py-2.5">Pacote / requisito</th><th className="px-3 py-2.5">Origem</th><th className="px-3 py-2.5">Destino</th><th className="px-3 py-2.5">Situacao</th><th className="hidden px-3 py-2.5 lg:table-cell">Ultima evidencia</th><th className="px-3 py-2.5 text-right">Acoes</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleRows.map((row) => <tr key={row.id} className="h-[38px] hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                <td className="truncate px-3 py-1.5 font-semibold text-slate-900 dark:text-white" title={`${row.packageName} · ${row.requirementIds.join(" · ")}`}>{row.packageName}</td>
                <td className="truncate px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-100" title={`${row.targetReference} · ${row.targetSecondaryReference}`}>{row.targetReference}</td>
                <td className="px-3 py-2.5"><span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{row.integrationCode === "PNCP" ? "PNCP" : "TCE-PB / SAGRES"}</span></td>
                <td className="truncate px-3 py-1.5" title={row.blockedReasons[0] || row.message || stateLabel(row.state)}><span className={`inline-flex rounded border px-2 py-0.5 font-semibold ${stateClass(row.state)}`}>{stateLabel(row.state)}</span></td>
                <td className="hidden truncate px-3 py-1.5 text-slate-600 dark:text-slate-300 lg:table-cell" title={row.externalId || undefined}>{formatDate(row.createdAt)}</td>
                <td className="px-3 py-2.5 text-right"><div className="flex justify-end gap-1.5">{row.state === "PENDING_CONFIGURATION" ? <Link href="/configuracoes/integracoes" className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Configurar</Link> : row.state !== "QUEUED" && row.state !== "CONFIRMED" && row.state !== "REJECTED" ? <button type="button" onClick={() => prepare(row)} disabled={pending} className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Preparar</button> : null}{row.runId && row.hasExportPackage ? <a href={`/compras/exportacoes/${encodeURIComponent(row.runId)}/download`} className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><FileDown className="mr-1 size-3.5" />Baixar</a> : null}{row.runId && row.state === "QUEUED" ? <button type="button" onClick={() => openOutcome(row)} disabled={pending} className="inline-flex h-8 items-center rounded-md bg-emerald-700 px-2.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">Retorno</button> : null}</div></td>
              </tr>)}
              {!visibleRows.length ? <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500 dark:text-slate-400">Nenhum pacote encontrado para os filtros informados.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>{filteredRows.length} {filteredRows.length === 1 ? "registro" : "registros"}</span>
          <div className="flex items-center gap-1.5"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} aria-label="Pagina anterior" className="inline-flex h-8 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"><ChevronLeft className="size-4" /></button><span className="min-w-16 text-center tabular-nums">{currentPage} de {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={currentPage === pageCount} aria-label="Proxima pagina" className="inline-flex h-8 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"><ChevronRight className="size-4" /></button></div>
        </div>
      </div>
    </div>
  );
}
