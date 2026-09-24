"use client";

import { useState } from "react";
import { Building2, Pencil, Trash2, CheckCircle, XCircle, Plus, Search, AlertCircle } from "lucide-react";
import { createHealthUnit, updateHealthUnit, toggleHealthUnitStatus, deleteHealthUnit } from "./actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type HealthUnit = {
  id: string;
  name: string;
  type: string;
  cnes: string | null;
  phone: string | null;
  isActive: boolean;
};

type HealthUnitFormData = {
  name: string;
  type: string;
  cnes: string;
  phone: string;
};

const UNIT_TYPES = [
  "UBS",
  "UPA",
  "Hospital",
  "Farmácia",
  "CAPS",
  "Centro de Especialidades",
  "Maternidade",
  "Outros"
];

export default function UnidadesClient({ units }: { units: HealthUnit[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<HealthUnitFormData>({
    name: "", type: "UBS", cnes: "", phone: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [page, setPage] = useState(1);

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.cnes && u.cnes.includes(searchTerm))
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredUnits.length / PAGE_SIZE)));
  const visibleUnits = filteredUnits.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: "", type: "UBS", cnes: "", phone: "" });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (unit: HealthUnit) => {
    setEditingId(unit.id);
    setFormData({
      name: unit.name,
      type: unit.type,
      cnes: unit.cnes || "",
      phone: unit.phone || ""
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");

    let res;
    if (editingId) {
      res = await updateHealthUnit(editingId, formData);
    } else {
      res = await createHealthUnit(formData);
    }

    setIsSaving(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsModalOpen(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (confirm(`Deseja realmente ${currentStatus ? 'inativar' : 'reativar'} esta unidade?`)) {
      const res = await toggleHealthUnitStatus(id, !currentStatus);
      if (res.error) alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja EXCLUIR definitivamente esta unidade?")) {
      const res = await deleteHealthUnit(id);
      if (res.error) alert(res.error);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      {/* Barra de Ações e Busca */}
      <div className="flex shrink-0 flex-col gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
          className="block h-9 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm leading-5 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-gray-900 dark:text-white"
            placeholder="Pesquisar por nome ou CNES..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-emerald-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Unidade
        </button>
      </div>

      {/* Tabela */}
      <ErpListFrame pagination={<ErpPagination page={activePage} total={filteredUnits.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="unidades" onPageChange={setPage} />}>
        <table className="w-full table-fixed text-left text-xs">
          <thead className="sticky top-0 z-10 border-b bg-slate-100 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="p-2 font-semibold text-gray-600">Nome</th>
              <th className="p-2 font-semibold text-gray-600">Tipo</th>
              <th className="p-2 font-semibold text-gray-600">CNES</th>
              <th className="p-2 font-semibold text-gray-600">Telefone</th>
              <th className="p-2 font-semibold text-gray-600">Status</th>
              <th className="p-2 text-right font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleUnits.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Building2 className="h-10 w-10 text-gray-300 mb-2" />
                    <p>Nenhuma unidade de saúde encontrada.</p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleUnits.map(item => (
                <tr key={item.id} className="h-9 hover:bg-slate-50">
                  <td className="truncate p-2 font-medium text-gray-900">{item.name}</td>
                  <td className="truncate p-2 text-gray-600">{item.type}</td>
                  <td className="truncate p-2 text-gray-600">{item.cnes || '-'}</td>
                  <td className="truncate p-2 text-gray-600">{item.phone || '-'}</td>
                  <td className="p-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="p-2 text-right"><div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEditModal(item)} className="text-gray-400 hover:text-emerald-600 p-1 rounded hover:bg-emerald-50" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {item.isActive ? (
                      <button onClick={() => handleToggleStatus(item.id, true)} className="text-gray-400 hover:text-orange-600 p-1 rounded hover:bg-orange-50" title="Inativar">
                        <XCircle className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleToggleStatus(item.id, false)} className="text-gray-400 hover:text-green-600 p-1 rounded hover:bg-green-50" title="Reativar">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50" title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ErpListFrame>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 p-4">
          <div className="my-4 w-full max-w-md overflow-hidden rounded-md bg-white shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {editingId ? "Editar Unidade" : "Nova Unidade de Saúde"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Fechar</span>
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome da Unidade *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Unidade *</label>
                  <select
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    {UNIT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CNES</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      value={formData.cnes || ''}
                      onChange={e => setFormData({...formData, cnes: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      value={formData.phone || ''}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none disabled:opacity-50"
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
