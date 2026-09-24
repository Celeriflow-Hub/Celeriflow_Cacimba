"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Building2, Pencil, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { createEconomicRegistration, updateEconomicRegistration, deactivateEconomicRegistration, activateEconomicRegistration } from "./actions";
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

type Registration = {
  id: string;
  municipalInsc: string;
  primaryCnae: string | null;
  taxRegime: string | null;
  status: string;
  taxpayer: {
    id: string;
    person: { fullName: string; cpf: string } | null;
    company: { corporateName: string; cnpj: string } | null;
  };
};

type RegistrationUpdate = {
  municipalInsc?: string;
  primaryCnae?: string | null;
  taxRegime?: string | null;
};

type Taxpayer = {
  id: string;
  name: string;
};

function statusVariant(status: string): ErpStatusVariant {
  if (status === "Ativo") return "success";
  if (status === "Inativo" || status === "Baixado") return "neutral";
  if (status === "Suspenso") return "warning";
  return "neutral";
}

export default function EconomicoClient({
  registrations,
  taxpayers
}: {
  registrations: Registration[];
  taxpayers: Taxpayer[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RegistrationUpdate>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    municipalInsc: "",
    primaryCnae: "",
    taxRegime: "Simples Nacional",
    taxpayerId: taxpayers[0]?.id || ""
  });

  const filtered = registrations.filter((reg) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = reg.taxpayer.company?.corporateName || reg.taxpayer.person?.fullName || "";
    const doc = reg.taxpayer.company?.cnpj || reg.taxpayer.person?.cpf || "";
    return (
      reg.municipalInsc.toLowerCase().includes(term) ||
      name.toLowerCase().includes(term) ||
      doc.includes(term) ||
      (reg.primaryCnae && reg.primaryCnae.toLowerCase().includes(term))
    );
  });
  const pageSize = 20;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleEditClick = (reg: Registration) => {
    setEditingId(reg.id);
    setEditForm({
      municipalInsc: reg.municipalInsc,
      primaryCnae: reg.primaryCnae,
      taxRegime: reg.taxRegime
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (confirm("Deseja salvar as alterações?")) {
      try {
        await updateEconomicRegistration(editingId, editForm);
        setEditingId(null);
      } catch (e) {
        console.error(e);
        alert("Erro ao salvar alterações.");
      }
    }
  };

  const handleDeactivate = async (id: string) => {
    if (confirm("Deseja inativar esta inscrição?")) {
      await deactivateEconomicRegistration(id);
    }
  };

  const handleActivate = async (id: string) => {
    if (confirm("Deseja reativar esta inscrição?")) {
      await activateEconomicRegistration(id);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.taxpayerId) {
      alert("Selecione um contribuinte válido.");
      return;
    }
    try {
      await createEconomicRegistration(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        municipalInsc: "",
        primaryCnae: "",
        taxRegime: "Simples Nacional",
        taxpayerId: taxpayers[0]?.id || ""
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao criar inscrição.");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-2.5 overflow-hidden">
      <ErpPageTitle
        title="Cadastro Econômico"
        icon={<Building2 className="size-4 text-indigo-600" />}
        action={
          <div className="flex items-center gap-2"><Link href="/tributacao/economico/relatorio" className="inline-flex h-8 items-center rounded border border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700">Exportar CSV</Link><button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600"
          >
            <Plus className="size-3.5" />
            Nova Inscrição
          </button></div>
        }
      />

      <ErpListFrame
        pagination={<ErpPagination page={page} total={filtered.length} pageSize={pageSize} previousHref="#" nextHref="#" label="cadastros" onPageChange={setPage} />}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
              <span className="sr-only">Buscar inscrição</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Buscar por inscrição, contribuinte, CNPJ ou CNAE"
                className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          </div>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[18%]">Inscrição</ErpTableTh>
              <ErpTableTh className="w-[32%]">Contribuinte / Razão Social</ErpTableTh>
              <ErpTableTh className="w-[18%]">CNAE Principal</ErpTableTh>
              <ErpTableTh className="w-[16%]">Regime</ErpTableTh>
              <ErpTableTh className="w-[8%]">Status</ErpTableTh>
              <ErpTableTh className="w-[8%] text-right">Ações</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  Nenhum cadastro econômico encontrado.
                </td>
              </tr>
            ) : (
              paged.map((reg) => (
                <ErpTableTr key={reg.id}>
                  <ErpTableTd className="font-semibold text-slate-900 dark:text-slate-100">
                    {editingId === reg.id ? (
                      <input
                        type="text"
                        value={editForm.municipalInsc || ""}
                        onChange={(e) => setEditForm({ ...editForm, municipalInsc: e.target.value })}
                        className="h-6 w-full rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                      />
                    ) : (
                      <Link href={`/tributacao/economico/${reg.id}`} className="text-emerald-700 hover:underline">{reg.municipalInsc}</Link>
                    )}
                  </ErpTableTd>
                  <ErpTableTd>
                    <div className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {reg.taxpayer.company?.corporateName || reg.taxpayer.person?.fullName || "Não Identificado"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {reg.taxpayer.company?.cnpj || reg.taxpayer.person?.cpf || ""}
                    </div>
                  </ErpTableTd>
                  <ErpTableTd>
                    {editingId === reg.id ? (
                      <input
                        type="text"
                        value={editForm.primaryCnae || ""}
                        onChange={(e) => setEditForm({ ...editForm, primaryCnae: e.target.value })}
                        className="h-6 w-full rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                      />
                    ) : (
                      reg.primaryCnae || "—"
                    )}
                  </ErpTableTd>
                  <ErpTableTd>
                    {editingId === reg.id ? (
                      <select
                        value={editForm.taxRegime || ""}
                        onChange={(e) => setEditForm({ ...editForm, taxRegime: e.target.value })}
                        className="h-6 w-full rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                      >
                        <option value="Simples Nacional">Simples Nacional</option>
                        <option value="Lucro Presumido">Lucro Presumido</option>
                        <option value="Lucro Real">Lucro Real</option>
                      </select>
                    ) : (
                      reg.taxRegime || "—"
                    )}
                  </ErpTableTd>
                  <ErpTableTd>
                    <ErpStatusBadge variant={statusVariant(reg.status)}>{reg.status}</ErpStatusBadge>
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    {editingId === reg.id ? (
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
                        <button onClick={() => handleEditClick(reg)} className="p-1 text-slate-400 hover:text-indigo-600 rounded" title="Editar">
                          <Pencil className="size-3.5" />
                        </button>
                        {reg.status === "Ativo" ? (
                          <button onClick={() => handleDeactivate(reg.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded" title="Inativar">
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => handleActivate(reg.id)} className="p-1 text-slate-400 hover:text-emerald-600 rounded" title="Reativar">
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
              <h2 className="text-base font-bold text-slate-800">Nova Inscrição Econômica</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contribuinte (Proprietário)</label>
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inscrição Municipal</label>
                <input
                  type="text"
                  required
                  value={createForm.municipalInsc}
                  onChange={(e) => setCreateForm({...createForm, municipalInsc: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CNAE Principal</label>
                  <input
                    type="text"
                    required
                    value={createForm.primaryCnae}
                    onChange={(e) => setCreateForm({...createForm, primaryCnae: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Regime Tributário</label>
                  <select
                    value={createForm.taxRegime}
                    onChange={(e) => setCreateForm({...createForm, taxRegime: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  >
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                  </select>
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
