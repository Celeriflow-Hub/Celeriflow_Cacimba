"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Network, Plus, Search, X } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { ErpStatusBadge, ErpTableContainer, ErpTableTd, ErpTableTh, ErpTableThead, ErpTableTr } from "@/components/app-ui/erp/ErpTable";
import { registerRedesimEvent } from "../cadastros-fiscais/actions";

type EventRow = { id: string; eventType: string; status: string; evidenceLevel: string; protocol: string | null; externalReference: string | null; taxpayerId: string | null; economicRegistrationId: string | null; receivedAt: string; result: unknown };
type TaxpayerOption = { id: string; name: string; cnpj: string; municipalInsc: string };

export default function RedesimClient({ events, taxpayers }: { events: EventRow[]; taxpayers: TaxpayerOption[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => events.filter((event) => `${event.eventType} ${event.status} ${event.protocol ?? ""} ${event.externalReference ?? ""}`.toLowerCase().includes(search.toLowerCase())), [events, search]);
  const pageSize = 20;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const result = await registerRedesimEvent({
      eventType: String(form.get("eventType") ?? ""), taxpayerId: String(form.get("taxpayerId") ?? ""), municipalInsc: String(form.get("municipalInsc") ?? ""), primaryCnae: String(form.get("primaryCnae") ?? ""), taxRegime: String(form.get("taxRegime") ?? ""), riskLevel: String(form.get("riskLevel") ?? ""), externalReference: String(form.get("externalReference") ?? ""), protocol: String(form.get("protocol") ?? ""), eventDate: String(form.get("eventDate") ?? ""), serviceActivity: form.get("serviceActivity") === "on",
    });
    if (result.error) return setMessage(result.error);
    setOpen(false);
    setMessage(result.duplicate ? "O evento já havia sido processado; a inscrição existente foi preservada." : "Evento registrado e processado no ambiente interno controlado.");
  }

  return <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-2.5">
    <ErpPageTitle title="REDESIM · solicitações" description="Eventos internos vinculados ao cadastro municipal" icon={<Network className="size-4 text-emerald-600" />} action={<button onClick={() => setOpen(true)} className="inline-flex h-8 items-center gap-1 rounded bg-amber-500 px-3 text-xs font-bold text-slate-950"><Plus className="size-3.5" />Registrar evento</button>} />
    <p className="rounded border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] text-sky-900">Sem contrato configurado, os eventos permanecem no nível L0 e não representam confirmação oficial da Junta Comercial.</p>
    {message && <p className="rounded border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-900">{message}</p>}
    <ErpListFrame toolbar={<label className="relative block"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar evento, situação ou referência" className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs" /></label>} pagination={<ErpPagination page={page} total={filtered.length} pageSize={pageSize} previousHref="#" nextHref="#" label="eventos REDESIM" onPageChange={setPage} />}>
      <ErpTableContainer><ErpTableThead><tr><ErpTableTh className="w-[18%]">Evento</ErpTableTh><ErpTableTh className="w-[20%]">Referência</ErpTableTh><ErpTableTh className="w-[15%]">Data</ErpTableTh><ErpTableTh className="w-[18%]">Situação</ErpTableTh><ErpTableTh className="w-[14%]">Evidência</ErpTableTh><ErpTableTh className="w-[15%] text-right">Cadastro</ErpTableTh></tr></ErpTableThead><tbody>{paged.map((event) => <ErpTableTr key={event.id}><ErpTableTd className="font-semibold">{event.eventType}</ErpTableTd><ErpTableTd className="truncate" title={event.protocol ?? event.externalReference ?? "Referência interna"}>{event.protocol ?? event.externalReference ?? "Referência interna"}</ErpTableTd><ErpTableTd>{new Date(event.receivedAt).toLocaleDateString("pt-BR")}</ErpTableTd><ErpTableTd><ErpStatusBadge variant={event.status === "PROCESSADO_INTERNO" ? "success" : "warning"}>{event.status.replaceAll("_", " ")}</ErpStatusBadge></ErpTableTd><ErpTableTd>{event.evidenceLevel} · interno</ErpTableTd><ErpTableTd className="text-right">{event.economicRegistrationId ? <Link href={`/tributacao/economico/${event.economicRegistrationId}`} className="font-semibold text-emerald-700 hover:underline">Abrir inscrição</Link> : "—"}</ErpTableTd></ErpTableTr>)}{!paged.length && <tr><td colSpan={6} className="p-8 text-center text-xs text-slate-400">Nenhum evento encontrado.</td></tr>}</tbody></ErpTableContainer>
    </ErpListFrame>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-md bg-white shadow-xl"><div className="sticky top-0 flex justify-between border-b bg-white px-4 py-3"><h2 className="text-sm font-bold">Registrar evento recebido ou preparado</h2><button type="button" onClick={() => setOpen(false)}><X className="size-4" /></button></div><div className="grid gap-3 p-4 sm:grid-cols-2">
      <label className="text-xs font-semibold">Evento<select name="eventType" required className="input mt-1"><option>VIABILIDADE</option><option>FORMALIZACAO</option><option>ABERTURA</option><option>ALTERACAO</option><option>BAIXA</option><option>MEI</option><option>LICENCIAMENTO</option></select></label>
      <label className="text-xs font-semibold">Pessoa jurídica<select name="taxpayerId" required className="input mt-1"><option value="">Selecione</option>{taxpayers.map((taxpayer) => <option key={taxpayer.id} value={taxpayer.id}>{taxpayer.name} · {taxpayer.cnpj}</option>)}</select></label>
      <label className="text-xs font-semibold">Inscrição municipal<input name="municipalInsc" className="input mt-1" /></label>
      <label className="text-xs font-semibold">CNAE principal<input name="primaryCnae" className="input mt-1" /></label>
      <label className="text-xs font-semibold">Regime<select name="taxRegime" className="input mt-1"><option value="">Não alterar</option><option>Simples Nacional</option><option>SIMEI</option><option>Lucro Presumido</option><option>Lucro Real</option></select></label>
      <label className="text-xs font-semibold">Risco da atividade<select name="riskLevel" className="input mt-1"><option value="">Regra não informada</option><option>Baixo</option><option>Médio</option><option>Alto</option></select></label>
      <label className="text-xs font-semibold">Data do evento<input name="eventDate" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input mt-1" /></label>
      <label className="text-xs font-semibold">Referência externa recebida<input name="externalReference" className="input mt-1" /></label>
      <label className="text-xs font-semibold sm:col-span-2">Protocolo retornado pela contraparte<input name="protocol" className="input mt-1" /><span className="mt-1 block text-[10px] font-normal text-slate-500">Deixe vazio quando não houver retorno real.</span></label>
      <label className="flex items-center gap-2 text-xs sm:col-span-2"><input name="serviceActivity" type="checkbox" />A atividade é de serviço e deve seguir para validação de habilitação NFS-e</label>
      {message && <p className="text-xs text-rose-700 sm:col-span-2">{message}</p>}
    </div><div className="flex justify-end gap-2 border-t bg-slate-50 px-4 py-3"><button type="button" onClick={() => setOpen(false)} className="h-7 rounded border bg-white px-3 text-xs font-semibold">Cancelar</button><button className="h-7 rounded bg-emerald-700 px-3 text-xs font-semibold text-white">Processar evento</button></div></form></div>}
  </div>;
}
