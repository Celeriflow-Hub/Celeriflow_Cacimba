"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, PowerOff, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createObra, inactivateObra, updateObra } from "../actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

type Obra = {
  id: string;
  numero: string;
  nome: string;
  descricao: string | null;
  local: string | null;
  tipo: string;
  valorEstimado: number | null;
  status: string;
  active: boolean;
};

const tipos = ["Construção", "Reforma", "Pavimentação", "Drenagem", "Iluminação"];
const statusOptions = ["Em Planejamento", "Em Execução", "Concluída", "Paralisada"];
const fieldClass = "w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white";
const PAGE_SIZE = 20;

function ObraSheet({ obra, open, onOpenChange }: { obra?: Obra; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const valorEstimadoValue = String(formData.get("valorEstimado") ?? "");
    const valorEstimado = Number(valorEstimadoValue);
    if (!valorEstimadoValue || !Number.isFinite(valorEstimado) || valorEstimado < 0) {
      setError("Informe um valor estimado válido.");
      return;
    }

    setSaving(true);
    const data = {
      numero: String(formData.get("numero") ?? ""),
      nome: String(formData.get("nome") ?? ""),
      descricao: String(formData.get("descricao") ?? ""),
      local: String(formData.get("local") ?? ""),
      tipo: String(formData.get("tipo") ?? ""),
      valorEstimado,
    };
    const result = obra
      ? await updateObra(obra.id, { ...data, status: String(formData.get("status") ?? "") })
      : await createObra(data);

    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
      router.refresh();
    }
    setSaving(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setError("");
    onOpenChange(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>{obra ? "Editar obra" : "Nova obra"}</SheetTitle>
          <SheetDescription>{obra ? "Atualize os dados e o status da obra." : "Cadastre uma nova obra ou projeto."}</SheetDescription>
        </SheetHeader>
        <form key={`${obra?.id ?? "new"}-${open}`} onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="rounded-md bg-red-100 p-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Número"><input name="numero" required defaultValue={obra?.numero} className={fieldClass} /></Field>
            <Field label="Tipo"><select name="tipo" required defaultValue={obra?.tipo ?? ""} className={fieldClass}><option value="">Selecione...</option>{tipos.map((tipo) => <option key={tipo}>{tipo}</option>)}</select></Field>
          </div>
          <Field label="Nome"><input name="nome" required defaultValue={obra?.nome} className={fieldClass} /></Field>
          <Field label="Local"><input name="local" defaultValue={obra?.local ?? ""} className={fieldClass} /></Field>
          <Field label="Descrição"><textarea name="descricao" defaultValue={obra?.descricao ?? ""} rows={3} className={`${fieldClass} resize-none`} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor estimado (R$)"><input name="valorEstimado" type="number" min="0" step="0.01" required defaultValue={obra?.valorEstimado ?? ""} className={fieldClass} /></Field>
            {obra && <Field label="Status"><select name="status" required defaultValue={obra.status} className={fieldClass}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></Field>}
          </div>
          <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => handleOpenChange(false)} className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200"><span>{label}</span>{children}</label>;
}

export function ObrasProjetosClient({ obras }: { obras: Obra[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [active, setActive] = useState("Todos");
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<Obra | null>(null);
  const [actionError, setActionError] = useState("");
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const query = search.trim().toLocaleLowerCase("pt-BR");
  const filteredObras = obras.filter((obra) => {
    const matchesSearch = !query || [obra.numero, obra.nome, obra.descricao, obra.local].some((value) => value?.toLocaleLowerCase("pt-BR").includes(query));
    return matchesSearch && (tipo === "Todos" || obra.tipo === tipo) && (status === "Todos" || obra.status === status) && (active === "Todos" || obra.active === (active === "Ativas"));
  });
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredObras.length / PAGE_SIZE)));
  const visibleObras = filteredObras.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  const resetPage = (callback: () => void) => { callback(); setPage(1); };

  async function handleInactivate(obra: Obra) {
    if (!confirm(`Inativar a obra ${obra.numero}?`)) return;
    setActionError("");
    setInactivatingId(obra.id);
    const result = await inactivateObra(obra.id);
    if (result.error) {
      setActionError(result.error);
    } else {
      router.refresh();
    }
    setInactivatingId(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 justify-end"><button type="button" onClick={() => setNewOpen(true)} className="flex h-7 items-center gap-1 rounded-md bg-amber-600 px-2.5 text-xs font-medium text-white hover:bg-amber-700"><Plus className="size-3.5" />Nova obra</button></div>
      <ErpListFrame toolbar={<div className="grid gap-2 lg:grid-cols-[minmax(12rem,1fr)_9rem_9rem_8rem]">
          <div className="relative"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => resetPage(() => setSearch(event.target.value))} placeholder="Buscar número, obra ou local..." className="h-8 w-full rounded border border-slate-200 bg-white pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-amber-600" /></div>
          <Filter value={tipo} onChange={(value) => resetPage(() => setTipo(value))} options={["Todos", ...tipos]} label="Tipo" /><Filter value={status} onChange={(value) => resetPage(() => setStatus(value))} options={["Todos", ...statusOptions]} label="Status" /><Filter value={active} onChange={(value) => resetPage(() => setActive(value))} options={["Todos", "Ativas", "Inativas"]} label="Situação" />
        </div>} summary={<p className="text-[11px] text-slate-500">{filteredObras.length} obras encontradas</p>} pagination={<ErpPagination page={activePage} total={filteredObras.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="obras" onPageChange={setPage} />}>
        {actionError && <div className="mx-4 mt-4 rounded-md bg-red-100 p-3 text-sm text-red-700 md:mx-6">{actionError}</div>}
        <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">Código</th><th className="p-2">Obra/projeto</th><th className="hidden p-2 md:table-cell">Local</th><th className="hidden p-2 lg:table-cell">Tipo</th><th className="p-2">Situação</th><th className="p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {visibleObras.map((obra) => <tr key={obra.id} className="h-9 hover:bg-slate-50"><td className="truncate p-2 font-medium">{obra.numero}</td><td className="truncate p-2 font-semibold text-slate-900" title={obra.nome}>{obra.nome}</td><td className="hidden truncate p-2 md:table-cell" title={obra.local || undefined}>{obra.local || "-"}</td><td className="hidden truncate p-2 lg:table-cell">{obra.tipo}</td><td className="p-2"><StatusBadge status={obra.active ? obra.status : "Inativa"} /></td><td className="p-2"><div className="flex justify-end gap-0.5"><button type="button" onClick={() => setEditing(obra)} className="rounded p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600" title="Editar e ver detalhes"><Pencil className="size-3.5" /></button><button type="button" onClick={() => handleInactivate(obra)} disabled={!obra.active || inactivatingId === obra.id} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40" title="Inativar">{inactivatingId === obra.id ? "..." : <PowerOff className="size-3.5" />}</button></div></td></tr>)}
          {filteredObras.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Nenhuma obra encontrada.</td></tr>}
        </tbody></table>
      </ErpListFrame>
      <ObraSheet open={newOpen} onOpenChange={setNewOpen} />
      {editing && <ObraSheet obra={editing} open onOpenChange={(open) => { if (!open) setEditing(null); }} />}
    </div>
  );
}

function Filter({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: string[]; label: string }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select>;
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "Concluída" ? "bg-emerald-500" : status === "Em Execução" ? "bg-amber-500" : status === "Paralisada" ? "bg-red-500" : "bg-blue-500";
  return <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300"><span className={`h-2 w-2 rounded-full ${color}`} />{status}</span>;
}
