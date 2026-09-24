"use client";

import { useState } from "react";
import { Stethoscope, Pencil, Trash2, CheckCircle, XCircle, Plus, Search, AlertCircle } from "lucide-react";
import { createHealthProfessional, updateHealthProfessional, toggleHealthProfessionalStatus, deleteHealthProfessional } from "./actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Employee = {
  id: string;
  name: string;
  cpf: string | null;
  registration: string | null;
};

type HealthProfessional = {
  id: string;
  employeeId: string;
  employee: Employee;
  specialty: string | null;
  councilName: string | null;
  councilNumber: string | null;
  isActive: boolean;
};

type HealthProfessionalFormData = {
  employeeId: string;
  specialty: string;
  councilType: string;
  councilNumber: string;
};

const CONSELHOS = ["CRM", "COREN", "CRF", "CRO", "CRN", "CRP", "CREFITO", "CRAS", "Outro"];

export default function ProfissionaisClient({ 
  professionals, 
  employees 
}: { 
  professionals: HealthProfessional[], 
  employees: Employee[]
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<HealthProfessionalFormData>({
    employeeId: "", specialty: "", councilType: "", councilNumber: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [page, setPage] = useState(1);

  const filteredProfs = professionals.filter(p => 
    p.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.specialty && p.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.councilNumber && p.councilNumber.includes(searchTerm))
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredProfs.length / PAGE_SIZE)));
  const visibleProfs = filteredProfs.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const availableEmployees = employees.filter(e => !professionals.some(prof => prof.employeeId === e.id));

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ 
      employeeId: availableEmployees[0]?.id || "", 
      specialty: "", 
      councilType: "", 
      councilNumber: "" 
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (prof: HealthProfessional) => {
    setEditingId(prof.id);
    setFormData({
      employeeId: prof.employeeId,
      specialty: prof.specialty || "",
      councilType: prof.councilName || "",
      councilNumber: prof.councilNumber || ""
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
      res = await updateHealthProfessional(editingId, formData);
    } else {
      res = await createHealthProfessional(formData);
    }

    setIsSaving(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsModalOpen(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (confirm(`Deseja realmente ${currentStatus ? 'inativar' : 'reativar'} este profissional?`)) {
      const res = await toggleHealthProfessionalStatus(id, !currentStatus);
      if (res.error) alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja EXCLUIR definitivamente este registro profissional?")) {
      const res = await deleteHealthProfessional(id);
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
            placeholder="Pesquisar por nome, especialidade ou conselho..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-emerald-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Profissional
        </button>
      </div>

      {/* Tabela */}
      <ErpListFrame pagination={<ErpPagination page={activePage} total={filteredProfs.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="profissionais" onPageChange={setPage} />}>
        <table className="w-full table-fixed text-left text-xs">
          <thead className="sticky top-0 z-10 border-b bg-slate-100 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="p-2 font-semibold text-gray-600">Nome (Servidor)</th>
              <th className="p-2 font-semibold text-gray-600">Especialidade</th>
              <th className="p-2 font-semibold text-gray-600">Conselho</th>
              <th className="p-2 font-semibold text-gray-600">Nº Conselho</th>
              <th className="p-2 font-semibold text-gray-600">Status</th>
              <th className="p-2 text-right font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleProfs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Stethoscope className="h-10 w-10 text-gray-300 mb-2" />
                    <p>Nenhum profissional encontrado.</p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleProfs.map(item => (
                <tr key={item.id} className="h-9 hover:bg-slate-50">
                  <td className="truncate p-2 font-medium text-gray-900">{item.employee?.name}</td>
                  <td className="truncate p-2 text-gray-600">{item.specialty || '-'}</td>
                  <td className="truncate p-2 text-gray-600">{item.councilName || '-'}</td>
                  <td className="truncate p-2 text-gray-600">{item.councilNumber || '-'}</td>
                  <td className="p-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isActive ? 'Ativo' : 'Inativo'}
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
                {editingId ? "Editar Profissional" : "Novo Profissional de Saúde"}
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
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vincular a um Servidor (RH) *</label>
                    <select
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
                      value={formData.employeeId}
                      onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    >
                      <option value="" disabled>Selecione um Servidor Ativo...</option>
                      {availableEmployees.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name} {e.registration ? `(Mat: ${e.registration})` : ''}
                        </option>
                      ))}
                    </select>
                    {availableEmployees.length === 0 && (
                      <p className="mt-1 text-xs text-red-500">Não há servidores disponíveis no RH.</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Especialidade / Cargo na Saúde</label>
                  <input
                    type="text"
                    placeholder="Ex: Médico Clínico Geral"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    value={formData.specialty || ''}
                    onChange={e => setFormData({...formData, specialty: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo Conselho</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
                      value={formData.councilType || ''}
                      onChange={e => setFormData({...formData, councilType: e.target.value})}
                    >
                      <option value="">Nenhum</option>
                      {CONSELHOS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nº Conselho</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      value={formData.councilNumber || ''}
                      onChange={e => setFormData({...formData, councilNumber: e.target.value})}
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
                  disabled={isSaving || (!editingId && (!availableEmployees || availableEmployees.length === 0))}
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
