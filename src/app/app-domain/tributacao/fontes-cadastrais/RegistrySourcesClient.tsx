"use client";

import { useState } from "react";
import { DatabaseZap } from "lucide-react";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpTableContainer, ErpTableTd, ErpTableTh, ErpTableThead, ErpTableTr } from "@/components/app-ui/erp/ErpTable";
import { requestRegistrySourceLookup } from "../cadastros-fiscais/actions";

type Row = { id: string; source: string; status: string; evidenceLevel: string; payload: unknown; createdAt: string };

function identifier(payload: unknown) {
  return payload && typeof payload === "object" && !Array.isArray(payload) ? String((payload as Record<string, unknown>).identifier ?? "") : "";
}

export default function RegistrySourcesClient({ events }: { events: Row[] }) {
  const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    const result = await requestRegistrySourceLookup({ source: String(formData.get("source") ?? ""), identifier: String(formData.get("identifier") ?? "") });
    setMessage(result.error ?? (result.duplicate ? "A mesma consulta já está registrada." : "Consulta registrada; o cadastro manual continua liberado."));
  }
  return <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-2.5"><ErpPageTitle title="Fontes cadastrais" description="CPF, CNPJ e endereçamento" icon={<DatabaseZap className="size-4 text-emerald-600" />} />
    <form action={submit} className="grid shrink-0 gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-[180px_1fr_auto]"><select name="source" className="input"><option value="SERPRO_CPF">Consulta CPF</option><option value="SERPRO_CNPJ">Consulta CNPJ</option><option value="CORREIOS_DNE">Endereçamento/CEP</option></select><input name="identifier" required placeholder="CPF, CNPJ, CEP ou referência do arquivo autorizado" className="input" /><button className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white">Registrar consulta</button></form>
    <p className="rounded border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] text-sky-900">A ausência de credencial não bloqueia o cadastro. Nenhum retorno é preenchido como oficial sem execução do adaptador contratado.</p>{message && <p className="rounded border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-900">{message}</p>}
    <section className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200 bg-white"><ErpTableContainer><ErpTableThead><tr><ErpTableTh className="w-[22%]">Fonte</ErpTableTh><ErpTableTh>Identificador</ErpTableTh><ErpTableTh className="w-[20%]">Situação</ErpTableTh><ErpTableTh className="w-[13%]">Evidência</ErpTableTh><ErpTableTh className="w-[16%]">Solicitada em</ErpTableTh></tr></ErpTableThead><tbody>{events.map((event) => <ErpTableTr key={event.id}><ErpTableTd className="font-semibold">{event.source.replaceAll("_", " ")}</ErpTableTd><ErpTableTd>{identifier(event.payload)}</ErpTableTd><ErpTableTd>{event.status.replaceAll("_", " ")}</ErpTableTd><ErpTableTd>{event.evidenceLevel}</ErpTableTd><ErpTableTd>{new Date(event.createdAt).toLocaleString("pt-BR")}</ErpTableTd></ErpTableTr>)}{!events.length && <tr><td colSpan={5} className="p-8 text-center text-xs text-slate-400">Nenhuma consulta registrada.</td></tr>}</tbody></ErpTableContainer></section>
  </div>;
}
