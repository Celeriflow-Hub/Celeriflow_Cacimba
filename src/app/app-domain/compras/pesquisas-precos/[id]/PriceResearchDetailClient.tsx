"use client";

import { useDeferredValue, useState, useTransition, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  closePriceResearchAction,
  deletePriceResearchAction,
  getSupplierInvitationLinkAction,
  inviteSupplierToPriceResearchAction,
  updatePriceResearchDeadlineAction,
} from "../actions";
import { CompactItemsTable, type PriceResearchItemRow } from "../CompactItemsTable";

type SupplierOption = { id: string; name: string };

type Invitation = {
  id: string;
  supplierId: string;
  supplierName: string;
  status: string;
  value: number;
  createdAt: string;
  presentedAt: string | null;
};

type ResearchDetail = {
  id: string;
  status: string;
  deadlineAt: string;
  process: { number: string; object: string; purchaseRequestNumber: string | null; items: PriceResearchItemRow[] };
  comparison: { referenceValue: number | null; minimumValue: number | null; quoteIdsAtMinimum: string[] };
  invitations: Invitation[];
};

type AccessLink = { supplierName: string; accessKey: string; accessUrl: string };

const pageSize = 8;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function dateTimeLocal(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function quoteStatusLabel(status: string) {
  if (status === "CONVITE_PENDENTE") return "Convite pendente";
  if (status === "CONVITE_RASCUNHO") return "Rascunho";
  if (status === "CONVITE_APRESENTADA" || status === "Ativa") return "Apresentada";
  if (status === "CONVITE_CANCELADO") return "Cancelada";
  return status;
}

function quoteStatusVariant(status: string) {
  if (status === "CONVITE_APRESENTADA" || status === "Ativa") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "CONVITE_RASCUNHO") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "CONVITE_CANCELADO") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function PriceResearchDetailClient({ research, suppliers }: { research: ResearchDetail; suppliers: SupplierOption[] }) {
  const router = useRouter();
  const [deadlineAt, setDeadlineAt] = useState(() => dateTimeLocal(research.deadlineAt));
  const [supplierId, setSupplierId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [accessLink, setAccessLink] = useState<AccessLink | null>(null);
  const [quoteQuery, setQuoteQuery] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("ALL");
  const [quotePage, setQuotePage] = useState(1);
  const [pending, startTransition] = useTransition();
  const isInProgress = research.status === "Em Andamento";
  const deferredQuoteQuery = useDeferredValue(quoteQuery);
  const normalizedQuoteQuery = deferredQuoteQuery.trim().toLocaleLowerCase("pt-BR");
  const filteredInvitations = research.invitations.filter((invitation) => {
    const matchesQuery = !normalizedQuoteQuery || `${invitation.supplierName} ${quoteStatusLabel(invitation.status)}`.toLocaleLowerCase("pt-BR").includes(normalizedQuoteQuery);
    return matchesQuery && (quoteStatus === "ALL" || invitation.status === quoteStatus);
  });
  const quotePageCount = Math.max(1, Math.ceil(filteredInvitations.length / pageSize));
  const currentQuotePage = Math.min(quotePage, quotePageCount);
  const visibleInvitations = filteredInvitations.slice((currentQuotePage - 1) * pageSize, currentQuotePage * pageSize);

  function run(operation: () => Promise<{ error?: string }>, success: string, after?: () => void) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await operation();
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice(success);
      after?.();
    });
  }

  function updateDeadline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const deadline = new Date(deadlineAt);
    if (!deadlineAt || !Number.isFinite(deadline.getTime())) {
      setError("Informe um prazo de encerramento válido.");
      return;
    }
    run(
      () => updatePriceResearchDeadlineAction({ researchId: research.id, deadlineAt: deadline.toISOString() }),
      "Prazo da pesquisa atualizado.",
      () => router.refresh(),
    );
  }

  function inviteSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supplierId) {
      setError("Selecione um fornecedor ativo.");
      return;
    }
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await inviteSupplierToPriceResearchAction({ researchId: research.id, supplierId });
      if (result.error || !result.accessKey || !result.accessUrl) {
        setError(result.error ?? "Não foi possível gerar o acesso do fornecedor.");
        return;
      }
      const supplier = suppliers.find((item) => item.id === supplierId);
      setAccessLink({ supplierName: supplier?.name ?? "Fornecedor", accessKey: result.accessKey, accessUrl: result.accessUrl });
      setNotice(result.created ? "Convite registrado como pendente de entrega manual." : "O convite pendente existente foi recuperado.");
      router.refresh();
    });
  }

  function recoverAccess(invitation: Invitation) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await getSupplierInvitationLinkAction({ researchId: research.id, invitationId: invitation.id });
      if (result.error || !result.accessKey || !result.accessUrl) {
        setError(result.error ?? "Não foi possível gerar o acesso do fornecedor.");
        return;
      }
      setAccessLink({ supplierName: invitation.supplierName, accessKey: result.accessKey, accessUrl: result.accessUrl });
      setNotice("Acesso do fornecedor gerado para entrega manual.");
    });
  }

  function closeResearch() {
    if (!confirm("Encerrar esta pesquisa? O portal deixará de aceitar respostas imediatamente.")) return;
    run(() => closePriceResearchAction(research.id), "Pesquisa encerrada.", () => router.refresh());
  }

  function removeResearch() {
    if (!confirm("Excluir esta pesquisa sem convites ou cotações?")) return;
    run(() => deletePriceResearchAction(research.id), "Pesquisa excluída.", () => router.push("/compras/pesquisas-precos"));
  }

  function updateQuoteQuery(value: string) {
    setQuoteQuery(value);
    setQuotePage(1);
  }

  function updateQuoteStatus(value: string) {
    setQuoteStatus(value);
    setQuotePage(1);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
      {error ? <p role="alert" className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {notice ? <p role="status" className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p> : null}

      {accessLink ? (
        <section className="shrink-0 space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3" aria-label="Entrega manual do convite">
          <div><h2 className="text-sm font-semibold text-amber-950">Acesso de {accessLink.supplierName}</h2><p className="mt-1 text-xs leading-5 text-amber-900">Não houve envio de e-mail: o convite pendente está registrado no histórico interno. Registre a entrega manual do link e da chave em canal autorizado.</p></div>
          <div className="grid gap-2 lg:grid-cols-2"><label className="block text-[11px] font-semibold text-amber-950">Link do portal<input readOnly value={accessLink.accessUrl} className="mt-1 h-8 w-full rounded-md border border-amber-300 bg-white px-2 font-mono text-[10px] font-normal text-slate-800" /></label><label className="block text-[11px] font-semibold text-amber-950">Chave de acesso<input readOnly value={accessLink.accessKey} className="mt-1 h-8 w-full rounded-md border border-amber-300 bg-white px-2 font-mono text-[10px] font-normal text-slate-800" /></label></div>
        </section>
      ) : null}

      <section className="grid shrink-0 gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[minmax(12rem,0.7fr)_minmax(0,1.6fr)_auto]">
        <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Processo / solicitação</p><p className="mt-1 text-sm font-semibold text-slate-900">{research.process.number}</p><p className="text-[11px] text-slate-500">Solicitação {research.process.purchaseRequestNumber ?? "não vinculada"}</p></div>
        <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Objeto</p><p className="mt-1 text-sm leading-5 text-slate-800">{research.process.object}</p></div>
        <span className={`h-fit w-fit rounded border px-2 py-0.5 text-[10px] font-semibold ${isInProgress ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-700"}`}>{isInProgress ? "Em andamento" : research.status}</span>
      </section>

      <section className="shrink-0 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-3 py-2.5"><div><h2 className="text-sm font-semibold text-slate-900">Janela e referência</h2><p className="mt-0.5 text-[11px] text-slate-500">Média aritmética dos valores globais apresentados. Não representa reserva ou disponibilidade orçamentária.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={closeResearch} disabled={!isInProgress || pending} className="h-8 rounded-md border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60">Encerrar</button><button type="button" onClick={removeResearch} disabled={research.invitations.length > 0 || pending} className="h-8 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">Excluir sem histórico</button></div></div>
        <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Menor cotação</p><p className="mt-1 text-base font-semibold tabular-nums text-slate-900">{research.comparison.minimumValue === null ? "Sem proposta" : money.format(research.comparison.minimumValue)}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Preço de referência</p><p className="mt-1 text-base font-semibold tabular-nums text-slate-900">{research.comparison.referenceValue === null ? "Sem proposta" : money.format(research.comparison.referenceValue)}</p></div><form onSubmit={updateDeadline} className="sm:col-span-2"><label className="block text-[11px] font-semibold text-slate-700">Encerramento<div className="mt-1 flex flex-col gap-2 sm:flex-row"><input type="datetime-local" value={deadlineAt} onChange={(event) => setDeadlineAt(event.target.value)} disabled={!isInProgress || pending} className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-normal outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 disabled:bg-slate-100" /><button type="submit" disabled={!isInProgress || pending} className="h-8 shrink-0 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">Atualizar prazo</button></div></label></form></div>
      </section>

      <div className="grid shrink-0 gap-2 xl:grid-cols-[minmax(19rem,0.85fr)_minmax(0,1.15fr)]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-3 py-2.5"><h2 className="text-sm font-semibold text-slate-900">Convidar fornecedor</h2><p className="mt-0.5 text-[11px] leading-4 text-slate-500">Fornecedores ativos com e-mail cadastrado recebem acesso autenticado ao próprio convite.</p></div><form onSubmit={inviteSupplier} className="flex gap-2 p-3"><label className="sr-only" htmlFor="supplier">Fornecedor</label><select id="supplier" value={supplierId} onChange={(event) => setSupplierId(event.target.value)} disabled={!isInProgress || pending} className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 disabled:bg-slate-100"><option value="">Selecione um fornecedor ativo</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><button type="submit" disabled={!isInProgress || !supplierId || pending} className="h-8 shrink-0 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">Registrar convite</button></form></section>
        <CompactItemsTable items={research.process.items} title="Itens abrangidos" description="Itens e quantidades herdados do processo; não podem ser alterados pelo fornecedor." className="h-[19rem]" />
      </div>

      <section className="flex min-h-[24rem] flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="shrink-0 border-b border-slate-200 px-3 py-2.5"><h2 className="text-sm font-semibold text-slate-900">Convites e quadro comparativo</h2><p className="mt-0.5 text-[11px] text-slate-500">Todos os menores valores empatados são destacados. Convites pendentes não entram no cálculo.</p></div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-2.5"><div className="flex min-w-0 flex-1 flex-wrap items-center gap-2"><label className="relative min-w-[13rem] flex-1 sm:max-w-xs"><span className="sr-only">Buscar fornecedor</span><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><input type="search" value={quoteQuery} onChange={(event) => updateQuoteQuery(event.target.value)} placeholder="Buscar fornecedor ou situação" className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20" /></label><label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">Situação<select value={quoteStatus} onChange={(event) => updateQuoteStatus(event.target.value)} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"><option value="ALL">Todas</option><option value="CONVITE_PENDENTE">Pendentes</option><option value="CONVITE_RASCUNHO">Rascunhos</option><option value="CONVITE_APRESENTADA">Apresentadas</option><option value="CONVITE_CANCELADO">Canceladas</option></select></label></div><span className="text-[11px] tabular-nums text-slate-500">{filteredInvitations.length} {filteredInvitations.length === 1 ? "registro" : "registros"}</span></div>
        <div className="min-h-0 flex-1 overflow-auto">
          {!visibleInvitations.length ? <div className="flex h-full min-h-32 items-center justify-center p-4 text-center text-xs text-slate-500">Nenhum convite encontrado para este filtro.</div> : <><div className="space-y-2 p-2 md:hidden">{visibleInvitations.map((invitation) => { const presentedAt = invitation.presentedAt; const isMinimum = research.comparison.quoteIdsAtMinimum.includes(invitation.id); return <article key={invitation.id} className={`rounded-md border p-3 ${isMinimum ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-white"}`}><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{invitation.supplierName}</p><span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold ${quoteStatusVariant(invitation.status)}`}>{quoteStatusLabel(invitation.status)}</span></div><dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><div><dt className="text-slate-500">Valor global</dt><dd className="mt-0.5 font-semibold tabular-nums text-slate-800">{presentedAt ? money.format(invitation.value) : "-"}</dd></div><div><dt className="text-slate-500">Apresentada em</dt><dd className="mt-0.5 tabular-nums text-slate-700">{presentedAt ? new Date(presentedAt).toLocaleString("pt-BR") : "-"}</dd></div></dl><div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-slate-500">Convite: {new Date(invitation.createdAt).toLocaleString("pt-BR")}</span><button type="button" onClick={() => recoverAccess(invitation)} disabled={pending} className="text-xs font-semibold text-emerald-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60">Gerar acesso</button></div></article>; })}</div><table className="hidden min-w-[760px] w-full border-collapse text-left text-[11px] md:table"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-600"><tr><th className="px-3 py-2">Fornecedor</th><th className="w-32 px-3 py-2">Convite</th><th className="w-28 px-3 py-2">Situação</th><th className="w-28 px-3 py-2 text-right">Valor global</th><th className="w-36 px-3 py-2">Apresentada em</th><th className="w-24 px-3 py-2 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleInvitations.map((invitation) => { const presentedAt = invitation.presentedAt; const isMinimum = research.comparison.quoteIdsAtMinimum.includes(invitation.id); return <tr key={invitation.id} className={`h-10 hover:bg-slate-50 ${isMinimum ? "bg-emerald-50/70" : ""}`}><td className="px-3 py-1.5 font-semibold text-slate-900">{invitation.supplierName}{isMinimum ? <span className="ml-2 rounded border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">Menor valor</span> : null}</td><td className="px-3 py-1.5 tabular-nums text-slate-600">{new Date(invitation.createdAt).toLocaleString("pt-BR")}</td><td className="px-3 py-1.5"><span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${quoteStatusVariant(invitation.status)}`}>{quoteStatusLabel(invitation.status)}</span></td><td className="px-3 py-1.5 text-right font-medium tabular-nums text-slate-800">{presentedAt ? money.format(invitation.value) : "-"}</td><td className="px-3 py-1.5 tabular-nums text-slate-600">{presentedAt ? new Date(presentedAt).toLocaleString("pt-BR") : "-"}</td><td className="px-3 py-1.5 text-right"><button type="button" onClick={() => recoverAccess(invitation)} disabled={pending} className="text-[11px] font-semibold text-emerald-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60">Gerar acesso</button></td></tr>; })}</tbody></table></>}
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-500"><span>{filteredInvitations.length} {filteredInvitations.length === 1 ? "registro" : "registros"}</span><div className="flex items-center gap-1.5"><button type="button" onClick={() => setQuotePage((current) => Math.max(1, current - 1))} disabled={currentQuotePage === 1} aria-label="Página anterior" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-3.5" /></button><span className="min-w-14 text-center text-[11px] font-medium tabular-nums text-slate-600">{currentQuotePage} de {quotePageCount}</span><button type="button" onClick={() => setQuotePage((current) => Math.min(quotePageCount, current + 1))} disabled={currentQuotePage === quotePageCount} aria-label="Próxima página" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-3.5" /></button></div></footer>
      </section>
    </div>
  );
}
