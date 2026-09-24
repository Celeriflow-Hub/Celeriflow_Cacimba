"use client";

import { useState } from "react";
import { Search, Plus, FileCheck, Pencil, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { createLicense, updateLicense, deactivateLicense, activateLicense } from "./actions";
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

type License = {
  id: string;
  licenseType: string;
  issueDate: Date | null;
  validUntil: Date | null;
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

function licenseVariant(status: string): ErpStatusVariant {
  if (status === "Emitido") return "info";
  if (status === "Vencido") return "danger";
  if (status === "Cancelado") return "neutral";
  return "neutral";
}

export default function AlvarasClient({
  licenses,
  taxpayers,
}: {
  licenses: License[];
  taxpayers: Taxpayer[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ licenseType?: string; validUntil?: string }>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    licenseType: "Funcionamento",
    taxpayerId: taxpayers[0]?.id || "",
    validUntil: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filtered = licenses.filter((lic) => {
    if (!searchTerm) return true;
    const name = lic.taxpayer.company?.corporateName || lic.taxpayer.person?.fullName || "";
    return lic.licenseType.toLowerCase().includes(searchTerm.toLowerCase()) || name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  const pageSize = 20;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleEditClick = (lic: License) => {
    setEditingId(lic.id);
    setEditForm({
      licenseType: lic.licenseType,
      validUntil: lic.validUntil ? new Date(lic.validUntil).toISOString().split("T")[0] : "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (confirm("Deseja salvar as alterações?")) {
      try {
        await updateLicense(editingId, editForm);
        setEditingId(null);
      } catch (e) {
        console.error(e);
        alert("Erro ao salvar alterações.");
      }
    }
  };

  const handleDeactivate = async (id: string) => {
    if (confirm("Deseja cancelar este alvará?")) await deactivateLicense(id);
  };

  const handleActivate = async (id: string) => {
    if (confirm("Deseja reativar este alvará?")) await activateLicense(id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.taxpayerId) { alert("Selecione um contribuinte válido."); return; }
    if (!createForm.validUntil) { alert("Informe a data de validade."); return; }
    try {
      await createLicense(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({ licenseType: "Funcionamento", taxpayerId: taxpayers[0]?.id || "", validUntil: "" });
    } catch (err) {
      console.error(err);
      alert("Erro ao emitir alvará.");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-2.5 overflow-hidden">
      <ErpPageTitle
        title="Alvarás e Licenças"
        icon={<FileCheck className="size-4 text-indigo-600" />}
        action={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600"
          >
            <Plus className="size-3.5" />
            Novo Alvará
          </button>
        }
      />

      <ErpListFrame
        pagination={<ErpPagination page={page} total={filtered.length} pageSize={pageSize} previousHref="#" nextHref="#" label="alvarás" onPageChange={setPage} />}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
              <span className="sr-only">Buscar alvará</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Buscar por tipo ou contribuinte"
                className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          </div>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[20%]">Tipo de Alvará</ErpTableTh>
              <ErpTableTh className="w-[30%]">Contribuinte</ErpTableTh>
              <ErpTableTh className="w-[13%]">Emissão</ErpTableTh>
              <ErpTableTh className="w-[14%]">Validade</ErpTableTh>
              <ErpTableTh className="w-[12%]">Status</ErpTableTh>
              <ErpTableTh className="w-[11%] text-right">Ações</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  Nenhum alvará emitido.
                </td>
              </tr>
            ) : (
              paged.map((license) => (
                <ErpTableTr key={license.id}>
                  <ErpTableTd className="font-semibold">
                    {editingId === license.id ? (
                      <select
                        value={editForm.licenseType || ""}
                        onChange={(e) => setEditForm({ ...editForm, licenseType: e.target.value })}
                        className="h-6 w-full rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                      >
                        <option value="Funcionamento">Funcionamento</option>
                        <option value="Sanitária">Sanitária</option>
                        <option value="Obra">Obra</option>
                        <option value="Ambiental">Ambiental</option>
                      </select>
                    ) : (
                      license.licenseType
                    )}
                  </ErpTableTd>
                  <ErpTableTd>
                    {license.taxpayer.company?.corporateName || license.taxpayer.person?.fullName || "Não informado"}
                  </ErpTableTd>
                  <ErpTableTd>{license.issueDate ? new Date(license.issueDate).toLocaleDateString("pt-BR") : "—"}</ErpTableTd>
                  <ErpTableTd>
                    {editingId === license.id ? (
                      <input
                        type="date"
                        value={editForm.validUntil || ""}
                        onChange={(e) => setEditForm({ ...editForm, validUntil: e.target.value })}
                        className="h-6 rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                      />
                    ) : (
                      license.validUntil ? new Date(license.validUntil).toLocaleDateString("pt-BR") : "—"
                    )}
                  </ErpTableTd>
                  <ErpTableTd>
                    <ErpStatusBadge variant={licenseVariant(license.status)}>{license.status}</ErpStatusBadge>
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    {editingId === license.id ? (
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
                        <button onClick={() => handleEditClick(license)} className="p-1 text-slate-400 hover:text-indigo-600 rounded" title="Editar">
                          <Pencil className="size-3.5" />
                        </button>
                        {license.status === "Emitido" ? (
                          <button onClick={() => handleDeactivate(license.id)} className="p-1 text-slate-400 hover:text-red-600 rounded" title="Cancelar">
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => handleActivate(license.id)} className="p-1 text-slate-400 hover:text-emerald-600 rounded" title="Reativar">
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
              <h2 className="text-base font-bold text-slate-800">Emitir Alvará / Licença</h2>
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
                  onChange={(e) => setCreateForm({ ...createForm, taxpayerId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                >
                  <option value="">Selecione um contribuinte...</option>
                  {taxpayers.map((tp) => (
                    <option key={tp.id} value={tp.id}>{tp.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo</label>
                  <select
                    value={createForm.licenseType}
                    onChange={(e) => setCreateForm({ ...createForm, licenseType: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  >
                    <option value="Funcionamento">Funcionamento</option>
                    <option value="Sanitária">Sanitária</option>
                    <option value="Obra">Obra</option>
                    <option value="Ambiental">Ambiental</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Validade</label>
                  <input
                    type="date"
                    required
                    value={createForm.validUntil}
                    onChange={(e) => setCreateForm({ ...createForm, validUntil: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-sm font-bold transition-colors"
                >
                  Emitir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
