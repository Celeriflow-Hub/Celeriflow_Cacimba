"use client";

import { useState } from "react";
import { FileText, Plus, FileEdit, Trash2, X, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { updateModelo, deleteModelo, createModelo } from "./actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Modelo = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  updatedAt: Date | string;
};

export default function ModelosClient({ initialModelos }: { initialModelos: Modelo[] }) {
  const [modelos, setModelos] = useState<Modelo[]>(initialModelos);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", notes: "" });
  const [newForm, setNewForm] = useState({ title: "", notes: "" });
  const [loading, setLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredModels = modelos.filter((modelo) => [modelo.title, modelo.notes, modelo.status].some((value) => value?.toLowerCase().includes(normalizedSearch)));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredModels.length / PAGE_SIZE)));
  const pageModels = filteredModels.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const openEdit = (m: Modelo) => {
    setEditingId(m.id);
    setEditForm({ title: m.title, notes: m.notes || "" });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.title.trim()) return;
    setLoading(id);
    try {
      await updateModelo(id, { title: editForm.title.trim(), notes: editForm.notes || null });
      setModelos((prev) =>
        prev.map((m) => (m.id === id ? { ...m, title: editForm.title.trim(), notes: editForm.notes || null, updatedAt: new Date() } : m))
      );
      setEditingId(null);
    } catch {
      alert("Erro ao salvar");
    } finally {
      setLoading(null);
    }
  };

  const handleToggleStatus = async (m: Modelo) => {
    const newStatus = m.status === "Ativo" ? "Inativo" : "Ativo";
    setLoading(m.id);
    try {
      await updateModelo(m.id, { status: newStatus });
      setModelos((prev) => prev.map((item) => (item.id === m.id ? { ...item, status: newStatus } : item)));
    } catch {
      alert("Erro ao alterar status");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir o modelo "${title}"?`)) return;
    setLoading(id);
    try {
      await deleteModelo(id);
      setModelos((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Erro ao excluir");
    } finally {
      setLoading(null);
    }
  };

  const handleCreateNew = async () => {
    if (!newForm.title.trim()) return;
    setLoading("new");
    try {
      await createModelo(newForm.title, newForm.notes);
      setNewForm({ title: "", notes: "" });
      setShowNewModal(false);
      // Reload from server (revalidatePath will handle)
    } catch {
      alert("Erro ao criar modelo");
    } finally {
      setLoading(null);
    }
  };

  return (
    <PageFrame className="flex h-full min-h-0 max-w-6xl flex-col">
      <PageHeader title="Modelos de Documentos" icon={<FileText className="size-4 shrink-0 text-indigo-600" />} action={<button onClick={() => setShowNewModal(true)} className="inline-flex h-7 items-center gap-1 rounded-md bg-indigo-600 px-2 text-xs font-semibold text-white hover:bg-indigo-700"><Plus className="size-3.5" /><span className="hidden sm:inline">Novo Modelo</span></button>} />
      <ErpListFrame toolbar={<input type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="Buscar por nome, categoria ou situação" aria-label="Buscar modelos" className="h-7 w-full max-w-md rounded border border-slate-300 px-2.5 text-xs outline-none focus:border-indigo-600" />} pagination={<ErpPagination page={activePage} total={filteredModels.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="modelos" onPageChange={setPage} />}>
          {modelos.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nenhum modelo encontrado.</p>
              <button onClick={() => setShowNewModal(true)} className="mt-2 text-indigo-600 text-xs font-semibold hover:underline">
                Criar o primeiro modelo
              </button>
            </div>
          ) : (
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Nome do Modelo</th>
                  <th className="px-6 py-3">Notas / Descrição</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Atualizado em</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageModels.map((modelo) => (
                  <tr key={modelo.id} className="group h-[38px] transition-colors hover:bg-slate-50">
                    <td className="max-w-0 truncate px-2.5 py-1.5 font-bold text-slate-800" title={modelo.title}>
                      {editingId === modelo.id ? (
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                          className="w-full border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                          {modelo.title}
                        </div>
                      )}
                    </td>
                    <td className="max-w-0 truncate px-2.5 py-1.5 text-slate-500" title={modelo.notes || undefined}>
                      {editingId === modelo.id ? (
                        <input
                          type="text"
                          value={editForm.notes}
                          onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                          placeholder="Descrição (opcional)"
                          className="w-full border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                        />
                      ) : (
                        modelo.notes || <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          modelo.status === "Ativo"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {modelo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(modelo.updatedAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === modelo.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(modelo.id)}
                              disabled={loading === modelo.id}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Salvar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => openEdit(modelo)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(modelo)}
                              disabled={loading === modelo.id}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title={modelo.status === "Ativo" ? "Inativar" : "Ativar"}
                            >
                              {modelo.status === "Ativo" ? (
                                <ToggleRight className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(modelo.id, modelo.title)}
                              disabled={loading === modelo.id}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </ErpListFrame>

      {/* New Modelo Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowNewModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Novo Modelo
              </h2>
              <button onClick={() => setShowNewModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Modelo *</label>
                <input
                  type="text"
                  placeholder="Ex: Ofício de Resposta"
                  value={newForm.title}
                  onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  placeholder="Descrição ou observações"
                  value={newForm.notes}
                  onChange={(e) => setNewForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleCreateNew}
                disabled={!newForm.title.trim() || loading === "new"}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading === "new" ? "Criando..." : <><Check className="w-4 h-4" /> Criar Modelo</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
