"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, FilePlus2, X } from "lucide-react";
import { reviewTaxRegistryEntry, saveTaxRegistryEntry, type FiscalEntityType } from "./actions";

export type FiscalRegistryEntryView = {
  id: string;
  category: string;
  title: string;
  data: unknown;
  status: string;
  source: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  processId: string | null;
  documentId: string | null;
  version: number;
  createdAt: string;
};

type LinkItem = { label: string; href: string; description?: string };
type OptionItem = { id: string; label: string };

const tabCategories: Record<FiscalEntityType, { key: string; label: string; categories: string[] }[]> = {
  TAXPAYER: [
    { key: "dados", label: "Dados", categories: ["SITUACAO", "ATRIBUTO", "OBSERVACAO"] },
    { key: "enderecos", label: "Endereços e contatos", categories: ["ENDERECO", "CONTATO"] },
    { key: "vinculos", label: "Vínculos", categories: ["RELACIONAMENTO", "SOCIO", "COOPERADO"] },
    { key: "historico", label: "Histórico", categories: ["HISTORICO", "PEDIDO_ALTERACAO"] },
    { key: "processos", label: "Processos e documentos", categories: ["PROCESSO", "DOCUMENTO"] },
  ],
  REAL_ESTATE: [
    { key: "dados", label: "Dados", categories: ["SITUACAO", "ATRIBUTO", "CARACTERISTICA", "OBSERVACAO"] },
    { key: "proprietarios", label: "Proprietários", categories: ["PROPRIETARIO", "PARTICIPACAO"] },
    { key: "areas", label: "BCI e áreas", categories: ["BCI", "AREA", "VALORACAO", "CONDOMINIO", "UNIDADE"] },
    { key: "historico", label: "Histórico", categories: ["HISTORICO", "RECADASTRAMENTO", "CAMPANHA_RECADASTRAMENTO", "PEDIDO_ALTERACAO"] },
    { key: "tributos", label: "Tributos e ITBI", categories: ["SITUACAO_FISCAL", "TRIBUTO", "ITBI"] },
    { key: "processos", label: "Processos e documentos", categories: ["PROCESSO", "DOCUMENTO"] },
  ],
  ECONOMIC_REGISTRATION: [
    { key: "dados", label: "Dados", categories: ["SITUACAO", "ATRIBUTO", "CNAE", "REGIME", "ESTRUTURA", "RISCO_ATIVIDADE", "CREDENCIAMENTO_NFSE"] },
    { key: "contatos", label: "Endereços e contatos", categories: ["ENDERECO", "CONTATO"] },
    { key: "socios", label: "Sócios e vínculos", categories: ["SOCIO", "COOPERADO", "IMOVEL", "MATRIZ_FILIAL"] },
    { key: "historico", label: "Histórico", categories: ["HISTORICO", "SIMPLES", "FATURAMENTO", "OBSERVACAO"] },
    { key: "processos", label: "Processos e documentos", categories: ["PROCESSO", "DOCUMENTO", "NOTIFICACAO"] },
  ],
};

const categoryOptions: Record<FiscalEntityType, string[]> = {
  TAXPAYER: ["SITUACAO", "ATRIBUTO", "OBSERVACAO", "ENDERECO", "CONTATO", "RELACIONAMENTO", "SOCIO", "COOPERADO", "HISTORICO", "PEDIDO_ALTERACAO", "PROCESSO", "DOCUMENTO"],
  REAL_ESTATE: ["SITUACAO", "ATRIBUTO", "CARACTERISTICA", "OBSERVACAO", "PROPRIETARIO", "PARTICIPACAO", "BCI", "AREA", "VALORACAO", "CONDOMINIO", "UNIDADE", "HISTORICO", "RECADASTRAMENTO", "PEDIDO_ALTERACAO", "SITUACAO_FISCAL", "TRIBUTO", "ITBI", "PROCESSO", "DOCUMENTO"],
  ECONOMIC_REGISTRATION: ["SITUACAO", "ATRIBUTO", "CNAE", "REGIME", "ESTRUTURA", "RISCO_ATIVIDADE", "CREDENCIAMENTO_NFSE", "ENDERECO", "CONTATO", "SOCIO", "COOPERADO", "IMOVEL", "MATRIZ_FILIAL", "HISTORICO", "SIMPLES", "FATURAMENTO", "OBSERVACAO", "PROCESSO", "DOCUMENTO", "NOTIFICACAO"],
};

function dataText(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return String(data ?? "");
  const record = data as Record<string, unknown>;
  return [record.details, record.value, record.percentage ? `${record.percentage}%` : null].filter(Boolean).join(" · ");
}

function statusStyle(status: string) {
  if (status === "ATIVO") return "bg-emerald-50 text-emerald-700";
  if (status === "PENDENTE_VALIDACAO") return "bg-amber-50 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

export function FiscalRecordWorkspace({ entityType, entityId, entries, links, processes, documents }: {
  entityType: FiscalEntityType;
  entityId: string;
  entries: FiscalRegistryEntryView[];
  links: LinkItem[];
  processes: OptionItem[];
  documents: OptionItem[];
}) {
  const tabs = tabCategories[entityType];
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const active = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
  const visible = useMemo(() => entries.filter((entry) => active.categories.includes(entry.category)), [active, entries]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const result = await saveTaxRegistryEntry({
      entityType,
      entityId,
      category: String(form.get("category") ?? ""),
      title: String(form.get("title") ?? ""),
      details: String(form.get("details") ?? ""),
      value: String(form.get("value") ?? ""),
      percentage: String(form.get("percentage") ?? ""),
      effectiveFrom: String(form.get("effectiveFrom") ?? ""),
      effectiveUntil: String(form.get("effectiveUntil") ?? ""),
      source: String(form.get("source") ?? "INTERNO"),
      processId: String(form.get("processId") ?? ""),
      documentId: String(form.get("documentId") ?? ""),
      requiresReview: form.get("requiresReview") === "on",
    });
    setSubmitting(false);
    if (result.error) return setMessage(result.error);
    setOpen(false);
    setMessage("Registro fiscal salvo com histórico e vigência.");
  }

  async function review(id: string, decision: "APPROVE" | "REJECT") {
    const result = await reviewTaxRegistryEntry(id, decision);
    setMessage(result.error ?? (decision === "APPROVE" ? "Registro aprovado." : "Registro rejeitado."));
  }

  return <div className="flex min-h-0 flex-1 flex-col gap-2">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-2">
      <div className="flex min-w-0 flex-wrap gap-1">
        {tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`h-7 rounded px-2.5 text-[11px] font-semibold ${activeTab === tab.key ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{tab.label}</button>)}
      </div>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-7 items-center gap-1 rounded bg-amber-500 px-2.5 text-[11px] font-bold text-slate-950 hover:bg-amber-600"><FilePlus2 className="size-3.5" />Adicionar registro</button>
    </div>

    {message && <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{message}</p>}

    {links.length > 0 && <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{links.map((link) => <Link key={link.href + link.label} href={link.href} className="rounded-md border border-slate-200 bg-white p-2 hover:border-emerald-300"><span className="block truncate text-xs font-semibold text-slate-800">{link.label}</span>{link.description && <span className="block truncate text-[10px] text-slate-500">{link.description}</span>}</Link>)}</div>}

    <section className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full table-fixed text-left text-[11px]">
        <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase text-slate-600"><tr><th className="w-[18%] px-3 py-2">Tipo</th><th className="w-[24%] px-3 py-2">Registro</th><th className="px-3 py-2">Detalhes</th><th className="w-[13%] px-3 py-2">Vigência</th><th className="w-[12%] px-3 py-2">Situação</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{visible.map((entry) => <tr key={entry.id} className="h-9 hover:bg-slate-50"><td className="truncate px-3 font-semibold text-slate-600">{entry.category.replaceAll("_", " ")}</td><td className="truncate px-3" title={entry.title}>{entry.title}<span className="block text-[9px] text-slate-400">v{entry.version} · {entry.source}</span></td><td className="truncate px-3" title={dataText(entry.data)}>{dataText(entry.data)}</td><td className="px-3 tabular-nums">{new Date(entry.effectiveFrom).toLocaleDateString("pt-BR")}</td><td className="px-3"><span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${statusStyle(entry.status)}`}>{entry.status.replaceAll("_", " ")}</span>{entry.status === "PENDENTE_VALIDACAO" && <span className="ml-1 inline-flex gap-1"><button onClick={() => review(entry.id, "APPROVE")} title="Aprovar" className="text-emerald-700"><Check className="size-3.5" /></button><button onClick={() => review(entry.id, "REJECT")} title="Rejeitar" className="text-rose-700"><X className="size-3.5" /></button></span>}</td></tr>)}{visible.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-xs text-slate-400">Nenhum registro nesta aba.</td></tr>}</tbody>
      </table>
    </section>

    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-md bg-white shadow-xl"><div className="sticky top-0 flex items-center justify-between border-b bg-white px-4 py-3"><h2 className="text-sm font-bold">Novo registro cadastral</h2><button type="button" onClick={() => setOpen(false)} aria-label="Fechar"><X className="size-4" /></button></div><div className="grid gap-3 p-4 sm:grid-cols-2">
      <label className="text-xs font-semibold">Categoria<select name="category" required className="input mt-1">{categoryOptions[entityType].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="text-xs font-semibold">Título<input name="title" required className="input mt-1" /></label>
      <label className="text-xs font-semibold sm:col-span-2">Detalhamento<textarea name="details" required rows={3} className="input mt-1 h-auto" /></label>
      <label className="text-xs font-semibold">Valor ou referência<input name="value" className="input mt-1" /></label>
      <label className="text-xs font-semibold">Participação percentual<input name="percentage" type="number" min="0" max="100" step="0.0001" className="input mt-1" /></label>
      <label className="text-xs font-semibold">Início da vigência<input name="effectiveFrom" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input mt-1" /></label>
      <label className="text-xs font-semibold">Fim da vigência<input name="effectiveUntil" type="date" className="input mt-1" /></label>
      <label className="text-xs font-semibold">Origem<select name="source" className="input mt-1"><option value="INTERNO">Cadastro interno</option><option value="CONTRIBUINTE">Solicitação do contribuinte</option><option value="IMPORTACAO">Importação autorizada</option><option value="REDESIM">REDESIM</option></select></label>
      <label className="text-xs font-semibold">Processo<select name="processId" className="input mt-1"><option value="">Sem processo</option>{processes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label className="text-xs font-semibold sm:col-span-2">Documento GED<select name="documentId" className="input mt-1"><option value="">Sem documento</option>{documents.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label className="flex items-center gap-2 text-xs sm:col-span-2"><input name="requiresReview" type="checkbox" />Enviar para validação do gestor antes de vigorar</label>
      {message && <p className="text-xs text-rose-700 sm:col-span-2">{message}</p>}
    </div><div className="flex justify-end gap-2 border-t bg-slate-50 px-4 py-3"><button type="button" onClick={() => setOpen(false)} className="h-7 rounded border bg-white px-3 text-xs font-semibold">Cancelar</button><button disabled={submitting} className="h-7 rounded bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-60">{submitting ? "Salvando..." : "Salvar registro"}</button></div></form></div>}
  </div>;
}
