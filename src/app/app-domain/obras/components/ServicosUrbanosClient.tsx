"use client";

import { useState, type FormEvent } from "react";
import type { ObrasServico } from "@prisma/client";
import { Pencil, Plus, Power, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createServico, inactivateServico, updateServico } from "../actions";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

type SheetMode = "create" | "edit" | null;

const serviceStatuses = ["Aberto", "Em Andamento", "Concluído", "Cancelado"];
const inputClassName = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white";
const PAGE_SIZE = 20;

function statusClassName(status: string) {
  if (status === "Concluído") return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800";
  if (status === "Em Andamento") return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800";
  if (status === "Cancelado") return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300";
}

export function ServicosUrbanosClient({ servicos }: { servicos: ObrasServico[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [editingServico, setEditingServico] = useState<ObrasServico | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const types = Array.from(new Set(servicos.map((servico) => servico.tipo))).sort();
  const statuses = Array.from(new Set(servicos.map((servico) => servico.status))).sort();
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filteredServicos = servicos.filter((servico) => {
    const matchesQuery = !normalizedQuery || [servico.protocolo, servico.tipo, servico.descricao, servico.local]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
    const matchesType = typeFilter === "all" || servico.tipo === typeFilter;
    const matchesStatus = statusFilter === "all" || servico.status === statusFilter;
    const matchesActive = activeFilter === "all" || (activeFilter === "active" ? servico.active : !servico.active);

    return matchesQuery && matchesType && matchesStatus && matchesActive;
  });
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredServicos.length / PAGE_SIZE)));
  const visibleServicos = filteredServicos.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  function closeSheet() {
    setSheetMode(null);
    setEditingServico(null);
    setFormError(null);
  }

  function openCreateSheet() {
    setEditingServico(null);
    setFormError(null);
    setSheetMode("create");
  }

  function openEditSheet(servico: ObrasServico) {
    setEditingServico(servico);
    setFormError(null);
    setSheetMode("edit");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      protocolo: formData.get("protocolo") as string,
      tipo: formData.get("tipo") as string,
      descricao: formData.get("descricao") as string,
      local: formData.get("local") as string,
    };

    try {
      const result = sheetMode === "edit" && editingServico
        ? await updateServico(editingServico.id, { ...data, status: formData.get("status") as string })
        : await createServico(data);

      if (result.error) {
        setFormError(result.error);
        return;
      }

      closeSheet();
      router.refresh();
    } catch {
      setFormError(sheetMode === "edit" ? "Não foi possível atualizar o serviço." : "Não foi possível cadastrar o serviço.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInactivate(servico: ObrasServico) {
    if (!window.confirm(`Inativar o serviço ${servico.protocolo}?`)) return;

    setActionError(null);
    setInactivatingId(servico.id);
    try {
      const result = await inactivateServico(servico.id);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setActionError("Não foi possível inativar o serviço.");
    } finally {
      setInactivatingId(null);
    }
  }

  const isEditing = sheetMode === "edit" && editingServico !== null;
  const formStatuses = isEditing && !serviceStatuses.includes(editingServico.status)
    ? [...serviceStatuses, editingServico.status]
    : serviceStatuses;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">Serviços Urbanos</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Zeladoria da cidade, vias, praças e cemitérios.</p>
        </div>
        <button type="button" onClick={openCreateSheet} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Novo Serviço
        </button>
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-label="Lista de serviços urbanos">
        <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} type="search" placeholder="Buscar protocolo, serviço ou local..." className="h-8 w-full rounded border border-slate-200 bg-white pl-9 pr-2 text-xs outline-none focus:ring-2 focus:ring-emerald-600" />
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
            <select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }} aria-label="Filtrar por tipo" className="h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none">
              <option value="all">Todos os tipos</option>
              {types.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filtrar por status" className="h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none">
              <option value="all">Todos os status</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(1); }} aria-label="Filtrar por situação" className="h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none">
              <option value="all">Ativos e inativos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>

        {actionError && <p role="alert" className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{actionError}</p>}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full table-fixed border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100">
              <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                <th className="p-2 font-medium">Protocolo</th><th className="p-2 font-medium">Serviço</th><th className="hidden p-2 font-medium md:table-cell">Local</th><th className="hidden p-2 font-medium lg:table-cell">Tipo</th><th className="p-2 font-medium">Situação</th><th className="p-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-700">
              {visibleServicos.map((servico) => (
                <tr key={servico.id} className="h-9 hover:bg-slate-50">
                  <td className="truncate p-2 font-medium text-slate-900">{servico.protocolo}</td><td className="truncate p-2 font-semibold text-slate-900" title={servico.descricao}>{servico.descricao}</td><td className="hidden truncate p-2 md:table-cell" title={servico.local}>{servico.local}</td><td className="hidden truncate p-2 lg:table-cell">{servico.tipo}</td><td className="p-2"><span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClassName(servico.status)}`}>{servico.active ? servico.status : "Inativo"}</span></td>
                  <td className="p-2 text-right"><div className="flex justify-end gap-0.5">
                      <button type="button" onClick={() => openEditSheet(servico)} className="rounded-md p-2 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/30" title="Editar serviço" aria-label={`Editar ${servico.protocolo}`}><Pencil className="h-4 w-4" /></button>
                      {servico.active && <button type="button" onClick={() => handleInactivate(servico)} disabled={inactivatingId === servico.id} className="rounded-md p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-rose-900/30" title="Inativar serviço" aria-label={`Inativar ${servico.protocolo}`}><Power className="h-4 w-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredServicos.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Nenhum serviço encontrado para os filtros selecionados.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="shrink-0 border-t border-slate-200 px-3 py-1.5"><ErpPagination page={activePage} total={filteredServicos.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="serviços" onPageChange={setPage} /></div>
      </section>

      <Sheet open={sheetMode !== null} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
          <SheetHeader>
            <SheetTitle>{isEditing ? "Editar Serviço" : "Novo Serviço"}</SheetTitle>
            <SheetDescription>{isEditing ? "Atualize os dados do serviço urbano." : "Registre uma nova solicitação de serviço urbano."}</SheetDescription>
          </SheetHeader>
          <form key={editingServico?.id ?? "new"} onSubmit={handleSubmit} className="space-y-3 p-1 pb-2">
            <div className="space-y-2"><label htmlFor="protocolo" className="text-sm font-medium">Protocolo</label><input id="protocolo" name="protocolo" required defaultValue={editingServico?.protocolo} className={inputClassName} placeholder="Ex.: SU-2026-001" /></div>
            <div className="space-y-2"><label htmlFor="tipo" className="text-sm font-medium">Tipo</label><input id="tipo" name="tipo" required defaultValue={editingServico?.tipo} className={inputClassName} placeholder="Ex.: Limpeza, Pavimentação ou Poda" /></div>
            <div className="space-y-2"><label htmlFor="descricao" className="text-sm font-medium">Descrição</label><textarea id="descricao" name="descricao" required rows={4} defaultValue={editingServico?.descricao} className={inputClassName} placeholder="Descreva o serviço solicitado" /></div>
            <div className="space-y-2"><label htmlFor="local" className="text-sm font-medium">Local</label><input id="local" name="local" required defaultValue={editingServico?.local} className={inputClassName} placeholder="Rua, bairro ou ponto de referência" /></div>
            {isEditing && <div className="space-y-2"><label htmlFor="status" className="text-sm font-medium">Status</label><select id="status" name="status" required defaultValue={editingServico.status} className={inputClassName}>{formStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>}
            {formError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{formError}</p>}
            <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeSheet} disabled={submitting} className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancelar</button>
              <button type="submit" disabled={submitting} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">{submitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar serviço"}</button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
