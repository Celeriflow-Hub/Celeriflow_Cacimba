"use client";

import { useState } from "react";
import { Users, Pencil, Trash2, CheckCircle, XCircle, Plus, Search, AlertCircle } from "lucide-react";
import { createPatient, updatePatient, togglePatientStatus, deletePatient } from "./actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Person = {
  id: string;
  fullName: string;
  cpf: string | null;
  birthDate: Date | null;
};

type HealthUnit = {
  id: string;
  name: string;
};

type HealthTeam = {
  id: string;
  name: string;
  unitId: string;
};

type Patient = {
  id: string;
  personId: string;
  person: Person;
  cns: string | null;
  bloodType: string | null;
  bloodDonor: boolean | null;
  referenceUnitId: string | null;
  teamId: string | null;
  status: string;
};

type PatientFormData = {
  personId: string;
  cns: string;
  bloodType: string;
  bloodDonor: boolean | null;
  referenceUnitId: string;
  teamId: string;
  fullName: string;
  cpf: string;
  birthDate: string;
};

function formatCPF(cpf: string | null | undefined) {
  if (!cpf) return '-';
  let clean = cpf.replace(/\D/g, '');
  if (clean.length > 0 && clean.length <= 11) {
    clean = clean.padStart(11, '0');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

function formatCNS(cns: string | null | undefined) {
  if (!cns) return '-';
  let clean = cns.replace(/\D/g, '');
  if (clean.length > 0 && clean.length <= 15) {
    clean = clean.padStart(15, '0');
    return clean.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  }
  return cns;
}

export default function PacientesClient({ 
  patients, 
  people, 
  units, 
  teams 
}: { 
  patients: Patient[], 
  people: Person[], 
  units: HealthUnit[], 
  teams: HealthTeam[] 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNewPerson, setIsNewPerson] = useState(false);
  const [formData, setFormData] = useState<PatientFormData>({
    personId: "", cns: "", bloodType: "", bloodDonor: null, referenceUnitId: "", teamId: "", fullName: "", cpf: "", birthDate: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [page, setPage] = useState(1);

  const filteredPatients = patients.filter(p => 
    p.person?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.person?.cpf && p.person.cpf.includes(searchTerm)) ||
    (p.cns && p.cns.includes(searchTerm))
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE)));
  const visiblePatients = filteredPatients.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const availablePeople = people.filter(p => !patients.some(pat => pat.personId === p.id));

  // Filtra as equipes baseadas na unidade selecionada no form
  const availableTeams = formData.referenceUnitId 
    ? teams.filter(t => t.unitId === formData.referenceUnitId)
    : teams;

  const openCreateModal = () => {
    setEditingId(null);
    setIsNewPerson(false);
    setFormData({
      personId: availablePeople[0]?.id || "",
      cns: "",
      bloodType: "",
      bloodDonor: null,
      referenceUnitId: "",
      teamId: "",
      fullName: "",
      cpf: "",
      birthDate: ""
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingId(patient.id);
    setIsNewPerson(false);
    setFormData({
      personId: patient.personId, // Na edição, não vamos mudar a pessoa
      cns: patient.cns || "",
      bloodType: patient.bloodType || "",
      bloodDonor: patient.bloodDonor,
      referenceUnitId: patient.referenceUnitId || "",
      teamId: patient.teamId || "",
      fullName: "",
      cpf: "",
      birthDate: ""
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
      res = await updatePatient(editingId, formData);
    } else {
      const dataToSubmit = { ...formData };
      if (isNewPerson) {
        dataToSubmit.personId = "";
      }
      res = await createPatient(dataToSubmit);
    }

    setIsSaving(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsModalOpen(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (confirm(`Deseja realmente alterar o status deste paciente?`)) {
      const res = await togglePatientStatus(id, currentStatus);
      if (res.error) alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja EXCLUIR definitivamente este registro de paciente?")) {
      const res = await deletePatient(id);
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
            placeholder="Pesquisar por nome, CPF ou CNS..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-emerald-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </button>
      </div>

      {/* Tabela */}
      <ErpListFrame pagination={<ErpPagination page={activePage} total={filteredPatients.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="pacientes" onPageChange={setPage} />}>
        <table className="w-full table-fixed text-left text-xs">
          <thead className="sticky top-0 z-10 border-b bg-slate-100 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="p-2 font-semibold text-gray-600">Nome</th>
              <th className="p-2 font-semibold text-gray-600">CPF</th>
              <th className="p-2 font-semibold text-gray-600">CNS</th>
              <th className="p-2 font-semibold text-gray-600">Data Nasc.</th>
              <th className="p-2 font-semibold text-gray-600">Status</th>
              <th className="p-2 text-right font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visiblePatients.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="h-10 w-10 text-gray-300 mb-2" />
                    <p>Nenhum paciente encontrado.</p>
                  </div>
                </td>
              </tr>
            ) : (
              visiblePatients.map(item => (
                <tr key={item.id} className="h-9 hover:bg-slate-50">
                  <td className="truncate p-2 font-medium text-gray-900">{item.person?.fullName}</td>
                  <td className="truncate p-2 text-gray-600">{formatCPF(item.person?.cpf)}</td>
                  <td className="truncate p-2 text-gray-600">{formatCNS(item.cns)}</td>
                  <td className="truncate p-2 text-gray-600">{item.person?.birthDate ? new Date(item.person.birthDate).toLocaleDateString() : '-'}</td>
                  <td className="p-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-2 text-right"><div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEditModal(item)} className="text-gray-400 hover:text-emerald-600 p-1 rounded hover:bg-emerald-50" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {item.status === 'Ativo' ? (
                      <button onClick={() => handleToggleStatus(item.id, item.status)} className="text-gray-400 hover:text-orange-600 p-1 rounded hover:bg-orange-50" title="Inativar">
                        <XCircle className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleToggleStatus(item.id, item.status)} className="text-gray-400 hover:text-green-600 p-1 rounded hover:bg-green-50" title="Reativar">
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
          <div className="my-4 w-full max-w-2xl overflow-hidden rounded-md bg-white shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {editingId ? "Editar Paciente" : "Novo Paciente"}
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
                {/* Seleção de Pessoa (Somente na criação) */}
                {!editingId && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm font-medium text-gray-700">Dados do Paciente</span>
                      <label className="flex items-center text-sm text-emerald-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mr-2 rounded text-emerald-600 focus:ring-emerald-500"
                          checked={isNewPerson}
                          onChange={(e) => setIsNewPerson(e.target.checked)}
                        />
                        Cadastrar nova Pessoa Física
                      </label>
                    </div>

                    {!isNewPerson ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vincular a uma Pessoa Cadastrada *</label>
                        <select
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
                          value={formData.personId}
                          onChange={e => setFormData({...formData, personId: e.target.value})}
                        >
                          <option value="" disabled>Selecione um Cidadão do Cadastro Base...</option>
                          {availablePeople.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.fullName} {p.cpf ? `(CPF: ${formatCPF(p.cpf)})` : ''}
                            </option>
                          ))}
                        </select>
                        {availablePeople.length === 0 && (
                          <p className="mt-1 text-xs text-red-500">Não há cidadãos disponíveis no cadastro que já não sejam pacientes.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            value={formData.fullName || ''}
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">CPF</label>
                            <input
                              type="text"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                              value={formData.cpf || ''}
                              onChange={e => setFormData({...formData, cpf: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                            <input
                              type="date"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                              value={formData.birthDate || ''}
                              onChange={e => setFormData({...formData, birthDate: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CNS (Cartão SUS)</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      value={formData.cns || ''}
                      onChange={e => setFormData({...formData, cns: e.target.value})}
                      placeholder="000 0000 0000 0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo Sanguíneo</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
                      value={formData.bloodType || ''}
                      onChange={e => setFormData({...formData, bloodType: e.target.value})}
                    >
                      <option value="">Não informado</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.bloodDonor === true}
                      onChange={e => setFormData({ ...formData, bloodDonor: e.target.checked })}
                    />
                    Doador de sangue
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unidade de Saúde Referência</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
                      value={formData.referenceUnitId || ''}
                      onChange={e => {
                        setFormData({
                          ...formData, 
                          referenceUnitId: e.target.value,
                          teamId: "" // resetar equipe ao mudar unidade
                        })
                      }}
                    >
                      <option value="">Selecione...</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Equipe ESF Referência</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
                      value={formData.teamId || ''}
                      onChange={e => setFormData({...formData, teamId: e.target.value})}
                      disabled={!formData.referenceUnitId}
                    >
                      <option value="">Selecione...</option>
                      {availableTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
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
                  disabled={isSaving || (!editingId && !isNewPerson && availablePeople.length === 0)}
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
