"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, RefreshCw, Search, Trash2 } from "lucide-react";
import { updateSecretariat, deactivateSecretariat, activateSecretariat } from "../actions";

const PAGE_SIZE = 20;
const tableRowHeightClassName = "h-[clamp(1.5rem,3vh,2rem)]";

type Secretariat = {
  id: string;
  name: string;
  acronym: string | null;
  managerName: string | null;
  isActive: boolean;
  _count: { departments: number };
};

export default function SecretariasClient({ secretariats }: { secretariats: Secretariat[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", acronym: "", managerName: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredSecretariats = secretariats.filter((secretariat) => (
    secretariat.name.toLowerCase().includes(normalizedSearchTerm)
    || secretariat.acronym?.toLowerCase().includes(normalizedSearchTerm)
    || secretariat.managerName?.toLowerCase().includes(normalizedSearchTerm)
  ));
  const totalPages = Math.max(1, Math.ceil(filteredSecretariats.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const firstRecord = filteredSecretariats.length === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1;
  const pageSecretariats = filteredSecretariats.slice(firstRecord - 1, firstRecord - 1 + PAGE_SIZE);
  const lastRecord = firstRecord === 0 ? 0 : firstRecord + pageSecretariats.length - 1;
  const messageRowCount = pageSecretariats.length === 0 ? 1 : 0;
  const emptyRows = Math.max(0, PAGE_SIZE - pageSecretariats.length - messageRowCount);

  const handleEditClick = (secretariat: Secretariat) => {
    setEditingId(secretariat.id);
    setEditForm({
      name: secretariat.name,
      acronym: secretariat.acronym || "",
      managerName: secretariat.managerName || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !window.confirm("Tem certeza que deseja salvar estas alterações?")) return;
    const result = await updateSecretariat(editingId, editForm);
    if (result.error) alert(result.error);
    else setEditingId(null);
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja inativar esta secretaria? Ela não será excluída do sistema.")) return;
    const result = await deactivateSecretariat(id);
    if (result.error) alert(result.error);
  };

  const handleActivate = async (id: string) => {
    if (!window.confirm("Deseja reativar esta secretaria?")) return;
    const result = await activateSecretariat(id);
    if (result.error) alert(result.error);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-slate-300 bg-white shadow-sm" aria-label="Listagem de secretarias">
      <div className="flex min-h-9 flex-col gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xs font-bold text-slate-800">Secretarias cadastradas</h2>
        <label className="relative block w-full sm:w-80">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <span className="sr-only">Buscar secretaria</span>
          <input
            type="search"
            placeholder="Buscar por nome, sigla ou responsável"
            className="h-7 w-full rounded border border-slate-300 bg-white py-1 pl-7 pr-2 text-xs outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
      <table className="w-full table-fixed text-left text-xs">
        <colgroup>
          <col className="w-[28%]" />
          <col className="hidden md:table-column md:w-[10%]" />
          <col className="hidden md:table-column md:w-[24%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
          <tr>
            <th scope="col" className={`${tableRowHeightClassName} px-3`}>Nome</th>
            <th scope="col" className={`hidden ${tableRowHeightClassName} px-3 md:table-cell`}>Sigla</th>
            <th scope="col" className={`hidden ${tableRowHeightClassName} px-3 md:table-cell`}>Responsável</th>
            <th scope="col" className={`${tableRowHeightClassName} px-3 text-center`}>Departamentos</th>
            <th scope="col" className={`${tableRowHeightClassName} px-3 text-center`}>Status</th>
            <th scope="col" className={`${tableRowHeightClassName} px-3 text-right`}>Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {pageSecretariats.map((secretariat) => (
            <tr key={secretariat.id} className={`${tableRowHeightClassName} hover:bg-slate-50`}>
              <td className="px-3 font-medium text-slate-800">
                {editingId === secretariat.id ? (
                  <input className="h-6 w-full rounded border border-slate-300 px-2 text-xs outline-none focus:border-blue-600" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
                ) : <span className="block truncate" title={secretariat.name}>{secretariat.name}</span>}
              </td>
              <td className="hidden px-3 text-slate-600 md:table-cell">
                {editingId === secretariat.id ? (
                  <input className="h-6 w-full rounded border border-slate-300 px-2 text-xs outline-none focus:border-blue-600" value={editForm.acronym} onChange={(event) => setEditForm({ ...editForm, acronym: event.target.value })} />
                ) : <span className="block truncate">{secretariat.acronym || "-"}</span>}
              </td>
              <td className="hidden px-3 text-slate-600 md:table-cell">
                {editingId === secretariat.id ? (
                  <input className="h-6 w-full rounded border border-slate-300 px-2 text-xs outline-none focus:border-blue-600" value={editForm.managerName} onChange={(event) => setEditForm({ ...editForm, managerName: event.target.value })} />
                ) : <span className="block truncate" title={secretariat.managerName || undefined}>{secretariat.managerName || "-"}</span>}
              </td>
              <td className="px-3 text-center text-slate-600">{secretariat._count.departments}</td>
              <td className="px-3 text-center">
                <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${secretariat.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {secretariat.isActive ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="px-3">
                {editingId === secretariat.id ? (
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={handleSaveEdit} className="h-6 rounded bg-emerald-700 px-2 text-[10px] font-semibold text-white hover:bg-emerald-800">Salvar</button>
                    <button type="button" onClick={() => setEditingId(null)} className="h-6 rounded border border-slate-300 px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => handleEditClick(secretariat)} className="flex size-6 items-center justify-center rounded text-blue-700 hover:bg-blue-50" title="Editar secretaria" aria-label={`Editar ${secretariat.name}`}><Pencil className="size-3.5" /></button>
                    {secretariat.isActive ? (
                      <button type="button" onClick={() => handleDeactivate(secretariat.id)} className="flex size-6 items-center justify-center rounded text-red-700 hover:bg-red-50" title="Inativar secretaria" aria-label={`Inativar ${secretariat.name}`}><Trash2 className="size-3.5" /></button>
                    ) : (
                      <button type="button" onClick={() => handleActivate(secretariat.id)} className="flex size-6 items-center justify-center rounded text-emerald-700 hover:bg-emerald-50" title="Reativar secretaria" aria-label={`Reativar ${secretariat.name}`}><RefreshCw className="size-3.5" /></button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
          {pageSecretariats.length === 0 && (
            <tr className={tableRowHeightClassName}>
              <td colSpan={6} className="px-3 text-center text-xs text-slate-500">
                {secretariats.length === 0 ? "Nenhuma secretaria cadastrada." : `Nenhuma secretaria encontrada para "${searchTerm}".`}
              </td>
            </tr>
          )}
          {Array.from({ length: emptyRows }, (_, index) => (
            <tr key={`empty-${index}`} aria-hidden="true" className={tableRowHeightClassName}>
              <td colSpan={6} className="px-3">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <footer className="flex min-h-8 shrink-0 flex-col gap-1 border-t border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>{firstRecord === 0 ? "0 registros" : `Exibindo ${firstRecord}-${lastRecord} de ${filteredSecretariats.length} registros`}{normalizedSearchTerm && ` encontrados (${secretariats.length} cadastrados)`}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Página {activePage} de {totalPages}</span>
          <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={activePage === 1} className="flex size-6 items-center justify-center rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página anterior"><ChevronLeft className="size-3.5" /></button>
          <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={activePage === totalPages} className="flex size-6 items-center justify-center rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Próxima página"><ChevronRight className="size-3.5" /></button>
        </div>
      </footer>
    </section>
  );
}
