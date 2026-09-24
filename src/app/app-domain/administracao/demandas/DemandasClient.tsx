"use client";

import { useState } from "react";
import { ClipboardList, Pencil, CheckCircle, XCircle } from "lucide-react";
import { updateInternalDemand } from "../actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Demand = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
  secretariatId: string | null;
  departmentId: string | null;
  assignee: { name: string } | null;
  creator: { name: string } | null;
  secretariat: { name: string } | null;
  department: { name: string } | null;
};

export default function DemandasClient({ 
  demands,
  secretariats,
  departments,
  employees
}: { 
  demands: Demand[],
  secretariats: { id: string, name: string }[],
  departments: { id: string, name: string }[],
  employees: { id: string, name: string }[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    title: "", 
    status: "", 
    priority: "", 
    assigneeId: "",
    secretariatId: "",
    departmentId: ""
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [page, setPage] = useState(1);

  const filteredDemands = demands.filter(demand => {
    const matchesSearch = 
      demand.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (demand.description && demand.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (demand.assignee?.name && demand.assignee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (demand.creator?.name && demand.creator.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = statusFilter === "Todos" || demand.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredDemands.length / PAGE_SIZE)));
  const pageDemands = filteredDemands.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleEditClick = (demand: Demand) => {
    setEditingId(demand.id);
    setEditForm({ 
      title: demand.title, 
      status: demand.status,
      priority: demand.priority,
      assigneeId: demand.assigneeId || "",
      secretariatId: demand.secretariatId || "",
      departmentId: demand.departmentId || ""
    });
  };

  const handleSaveEdit = async () => {
    if (editingId && window.confirm("Tem certeza que deseja salvar estas alterações?")) {
      await updateInternalDemand(editingId, {
        ...editForm,
        assigneeId: editForm.assigneeId || null,
        secretariatId: editForm.secretariatId || null,
        departmentId: editForm.departmentId || null
      });
      setEditingId(null);
    }
  };

  const handleChangeStatus = async (id: string, newStatus: string) => {
    const demand = demands.find(d => d.id === id);
    if (!demand) return;
    
    const confirmMsg = newStatus === "Concluída" ? "Deseja concluir esta demanda?" : "Deseja inativar/cancelar esta demanda?";
    if (window.confirm(confirmMsg)) {
      await updateInternalDemand(id, {
        title: demand.title,
        status: newStatus,
        priority: demand.priority,
        assigneeId: demand.assigneeId,
        secretariatId: demand.secretariatId,
        departmentId: demand.departmentId
      });
    }
  };

  if (demands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mb-2 flex size-9 items-center justify-center rounded bg-slate-100">
          <ClipboardList className="size-5 text-slate-400" />
        </div>
        <h2 className="text-sm font-bold text-slate-700">Nenhum registro encontrado</h2>
        <p className="mt-0.5 text-xs text-slate-500">Comece adicionando o primeiro registro.</p>
      </div>
    );
  }

  return (
    <ErpListFrame toolbar={<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xs font-bold text-slate-800">Demandas cadastradas</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
        <select 
          className="h-7 rounded border border-slate-300 bg-white px-2.5 text-xs shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="Todos">Todos os Status</option>
          <option value="Aberta">Aberta</option>
          <option value="Em andamento">Em andamento</option>
          <option value="Concluída">Concluída</option>
          <option value="Cancelada">Cancelada</option>
        </select>
        <input 
          type="text" 
          placeholder="Buscar por título, responsável..." 
          aria-label="Buscar demanda"
          className="h-7 w-full rounded border border-slate-300 bg-white px-2.5 text-xs shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 sm:w-72"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
        </div>
      </div>} pagination={<ErpPagination page={activePage} total={filteredDemands.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="demandas" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
            <tr>
              <th className="h-8 px-3">Título</th>
              <th className="h-8 px-3">Status</th>
              <th className="h-8 px-3">Prioridade</th>
              <th className="h-8 px-3">Responsável/Criador</th>
              <th className="h-8 px-3">Setor/Secretaria</th>
              <th className="h-8 px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageDemands.map(demand => (
              <tr key={demand.id} className="hover:bg-slate-50">
                <td className="max-w-0 truncate px-3 py-1.5" title={demand.description || demand.title}>
                  {editingId === demand.id ? (
                    <input className="border rounded px-2 py-1 w-full" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                  ) : (
                    <span className="block truncate font-medium text-slate-800">{demand.title}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {editingId === demand.id ? (
                    <select className="border rounded px-2 py-1 w-full" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                      <option value="Aberta">Aberta</option>
                      <option value="Em andamento">Em andamento</option>
                      <option value="Concluída">Concluída</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      demand.status === 'Concluída' ? 'bg-green-100 text-green-700' :
                      demand.status === 'Em andamento' ? 'bg-blue-100 text-blue-700' :
                      demand.status === 'Cancelada' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {demand.status}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">
                   {editingId === demand.id ? (
                    <select className="border rounded px-2 py-1 w-full" value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value})}>
                      <option value="Baixa">Baixa</option>
                      <option value="Normal">Normal</option>
                      <option value="Alta">Alta</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      demand.priority === 'Alta' || demand.priority === 'Urgente' ? 'bg-red-100 text-red-700' :
                      demand.priority === 'Normal' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {demand.priority}
                    </span>
                  )}
                </td>
                <td className="max-w-0 truncate px-3 py-1.5" title={`${demand.assignee?.name || "Sem responsável"} · Criador: ${demand.creator?.name || "-"}`}>
                  {editingId === demand.id ? (
                    <select className="border rounded px-2 py-1 w-full text-xs" value={editForm.assigneeId} onChange={e => setEditForm({...editForm, assigneeId: e.target.value})}>
                      <option value="">Sem Responsável</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  ) : (
                    <span className="block truncate text-slate-700">{demand.assignee?.name || "Sem Responsável"}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {editingId === demand.id ? (
                    <div className="flex flex-col gap-1">
                      <select className="border rounded px-2 py-1 w-full text-xs" value={editForm.secretariatId} onChange={e => setEditForm({...editForm, secretariatId: e.target.value})}>
                        <option value="">Nenhuma Sec.</option>
                        {secretariats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <select className="border rounded px-2 py-1 w-full text-xs" value={editForm.departmentId} onChange={e => setEditForm({...editForm, departmentId: e.target.value})}>
                        <option value="">Nenhum Dept.</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  ) : (
                    demand.secretariat?.name || demand.department?.name || "-"
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {editingId === demand.id ? (
                    <>
                      <button onClick={handleSaveEdit} className="text-emerald-600 hover:text-emerald-700 font-medium text-xs bg-emerald-50 px-2 py-1 rounded">Salvar</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-700 font-medium text-xs bg-slate-100 px-2 py-1 rounded">Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditClick(demand)} className="text-amber-600 hover:text-amber-700 p-1" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {demand.status !== 'Concluída' && (
                        <button onClick={() => handleChangeStatus(demand.id, "Concluída")} className="text-emerald-600 hover:text-emerald-700 p-1" title="Concluir">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {demand.status !== 'Cancelada' && (
                        <button onClick={() => handleChangeStatus(demand.id, "Cancelada")} className="text-red-500 hover:text-red-700 p-1" title="Inativar/Cancelar">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filteredDemands.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-500">
                  Nenhuma demanda encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </ErpListFrame>
  );
}
