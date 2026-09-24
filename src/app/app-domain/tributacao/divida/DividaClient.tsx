"use client";

import { useState } from "react";
import { Search, Plus, Banknote, Pencil, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { createActiveDebt, updateActiveDebt, cancelActiveDebt, reactivateActiveDebt } from "./actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import {
  ErpTableContainer,
  ErpTableThead,
  ErpTableTh,
  ErpTableTr,
  ErpTableTd,
  ErpStatusBadge,
  type ErpStatusVariant,
} from "@/components/app-ui/erp/ErpTable";

type ActiveDebt = {
  id: string;
  cdaNumber: string | null;
  year: number;
  originDebtType: string;
  originalValue: number;
  updatedValue: number;
  status: string;
  taxpayer: {
    id: string;
    person: { fullName: string; cpf: string } | null;
    company: { corporateName: string; cnpj: string } | null;
  };
};

type Taxpayer = {
  id: string;
  name: string;
};

function debtVariant(status: string): ErpStatusVariant {
  if (status === "Inscrita") return "danger";
  if (status === "Parcelada") return "info";
  if (status === "Paga") return "success";
  return "neutral";
}

export default function DividaClient({
  activeDebts,
  taxpayers
}: {
  activeDebts: ActiveDebt[];
  taxpayers: Taxpayer[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ActiveDebt>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    cdaNumber: "",
    year: new Date().getFullYear(),
    originDebtType: "IPTU",
    originalValue: 0,
    updatedValue: 0,
    taxpayerId: taxpayers[0]?.id || ""
  });

  const filtered = activeDebts.filter((debt) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const cda = (debt.cdaNumber || "").toLowerCase();
    const orig = debt.originDebtType.toLowerCase();
    const name = (debt.taxpayer.company?.corporateName || debt.taxpayer.person?.fullName || "").toLowerCase();
    return cda.includes(term) || orig.includes(term) || name.includes(term);
  });
  const pageSize = 20;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleEditClick = (debt: ActiveDebt) => {
    setEditingId(debt.id);
    setEditForm({
      cdaNumber: debt.cdaNumber,
      year: debt.year,
      originDebtType: debt.originDebtType,
      updatedValue: debt.updatedValue
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (confirm("Deseja salvar as alterações?")) {
      try {
        await updateActiveDebt(editingId, editForm);
        setEditingId(null);
      } catch (e) {
        console.error(e);
        alert("Erro ao salvar alterações.");
      }
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm("Deseja cancelar esta dívida ativa?")) {
      await cancelActiveDebt(id);
    }
  };

  const handleReactivate = async (id: string) => {
    if (confirm("Deseja reativar esta dívida ativa?")) {
      await reactivateActiveDebt(id);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.taxpayerId) {
      alert("Selecione um contribuinte válido.");
      return;
    }
    try {
      await createActiveDebt(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        cdaNumber: "",
        year: new Date().getFullYear(),
        originDebtType: "IPTU",
        originalValue: 0,
        updatedValue: 0,
        taxpayerId: taxpayers[0]?.id || ""
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao inscrever em dívida ativa.");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-2.5 overflow-hidden">
      <ErpPageTitle
        title="Dívida Ativa"
        icon={<Banknote className="size-4 text-rose-600" />}
        action={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600"
          >
            <Plus className="size-3.5" />
            Nova Inscrição CDA
          </button>
        }
      />

      <ErpListFrame
        pagination={<ErpPagination page={page} total={filtered.length} pageSize={pageSize} previousHref="#" nextHref="#" label="inscrições" onPageChange={setPage} />}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
              <span className="sr-only">Buscar dívida</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Buscar por CDA, contribuinte ou origem"
                className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          </div>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[16%]">Número CDA</ErpTableTh>
              <ErpTableTh className="w-[34%]">Contribuinte</ErpTableTh>
              <ErpTableTh className="w-[16%]">Origem / Exercício</ErpTableTh>
              <ErpTableTh className="w-[16%] text-right">Valor Atualizado</ErpTableTh>
              <ErpTableTh className="w-[8%]">Status</ErpTableTh>
              <ErpTableTh className="w-[10%] text-right">Ações</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  Nenhum registro de dívida ativa encontrado.
                </td>
              </tr>
            ) : (
              paged.map((debt) => (
                <ErpTableTr key={debt.id}>
                  <ErpTableTd className="font-semibold text-slate-900 dark:text-slate-100">
                    {editingId === debt.id ? (
                      <input
                        type="text"
                        value={editForm.cdaNumber || ""}
                        onChange={(e) => setEditForm({ ...editForm, cdaNumber: e.target.value })}
                        className="h-6 w-full rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                      />
                    ) : (
                      debt.cdaNumber || "—"
                    )}
                  </ErpTableTd>
                  <ErpTableTd>
                    {debt.taxpayer?.company?.corporateName || debt.taxpayer?.person?.fullName || "Não Informado"}
                  </ErpTableTd>
                  <ErpTableTd>
                    {editingId === debt.id ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={editForm.originDebtType || ""}
                          onChange={(e) => setEditForm({ ...editForm, originDebtType: e.target.value })}
                          className="h-6 w-2/3 rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                        />
                        <input
                          type="number"
                          value={editForm.year || ""}
                          onChange={(e) => setEditForm({ ...editForm, year: Number(e.target.value) })}
                          className="h-6 w-1/3 rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                        />
                      </div>
                    ) : (
                      `${debt.originDebtType} / ${debt.year}`
                    )}
                  </ErpTableTd>
                  <ErpTableTd className="text-right font-bold tabular-nums text-rose-600 dark:text-rose-400">
                    {editingId === debt.id ? (
                      <input
                        type="number"
                        value={editForm.updatedValue || 0}
                        onChange={(e) => setEditForm({ ...editForm, updatedValue: Number(e.target.value) })}
                        className="h-6 w-24 rounded border border-slate-200 px-1 text-right text-[11px] outline-none focus:border-amber-500"
                      />
                    ) : (
                      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(debt.updatedValue)
                    )}
                  </ErpTableTd>
                  <ErpTableTd>
                    <ErpStatusBadge variant={debtVariant(debt.status)}>{debt.status}</ErpStatusBadge>
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    {editingId === debt.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={handleSaveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Salvar">
                          <CheckCircle className="size-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded" title="Cancelar">
                          <XCircle className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEditClick(debt)} className="p-1 text-slate-400 hover:text-indigo-600 rounded" title="Editar">
                          <Pencil className="size-3.5" />
                        </button>
                        {debt.status === "Inscrita" || debt.status === "Parcelada" ? (
                          <button onClick={() => handleCancel(debt.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded" title="Cancelar">
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => handleReactivate(debt.id)} className="p-1 text-slate-400 hover:text-emerald-600 rounded" title="Reativar">
                            <RefreshCw className="size-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </ErpTableTd>
                </ErpTableTr>
              ))
            )}
          </tbody>
        </ErpTableContainer>
      </ErpListFrame>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-bold text-slate-800">Inscrever em Dívida Ativa</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contribuinte</label>
                <select
                  required
                  value={createForm.taxpayerId}
                  onChange={(e) => setCreateForm({...createForm, taxpayerId: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                >
                  <option value="">Selecione um contribuinte...</option>
                  {taxpayers.map(tp => (
                    <option key={tp.id} value={tp.id}>{tp.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Número CDA</label>
                  <input
                    type="text"
                    required
                    value={createForm.cdaNumber}
                    onChange={(e) => setCreateForm({...createForm, cdaNumber: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Exercício</label>
                  <input
                    type="number"
                    required
                    value={createForm.year}
                    onChange={(e) => setCreateForm({...createForm, year: Number(e.target.value)})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Origem (Ex: IPTU, ISS)</label>
                <input
                  type="text"
                  required
                  value={createForm.originDebtType}
                  onChange={(e) => setCreateForm({...createForm, originDebtType: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Original (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={createForm.originalValue}
                    onChange={(e) => setCreateForm({...createForm, originalValue: Number(e.target.value)})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Atualizado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={createForm.updatedValue}
                    onChange={(e) => setCreateForm({...createForm, updatedValue: Number(e.target.value)})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-600 transition-colors shadow-xs"
                >
                  Inscrever
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
