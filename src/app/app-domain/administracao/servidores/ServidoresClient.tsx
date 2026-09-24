"use client";

import { useState, useMemo } from "react";
import { Users, Pencil, Trash2, RefreshCw } from "lucide-react";
import { updateEmployee, deactivateEmployee, activateEmployee } from "../actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Employee = {
  id: string;
  name: string;
  cpf: string | null;
  email: string | null;
  isActive: boolean;
  role: { name: string } | null;
  secretariat: { name: string, acronym: string | null } | null;
  department: { name: string } | null;
};

type Role = { id: string, name: string };
type Secretariat = { id: string, name: string };
type Department = { id: string, name: string, secretariatId: string | null };

export default function ServidoresClient({ 
  employees,
  roles,
  secretariats,
  departments
}: { 
  employees: Employee[],
  roles: Role[],
  secretariats: Secretariat[],
  departments: Department[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    name: "", 
    email: "", 
    cpf: "",
    roleId: "",
    secretariatId: "",
    departmentId: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (emp.cpf && emp.cpf.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE)));
  const pageEmployees = filteredEmployees.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const availableDepartments = useMemo(() => {
    if (!editForm.secretariatId) return departments;
    return departments.filter(d => d.secretariatId === editForm.secretariatId);
  }, [editForm.secretariatId, departments]);

  const handleEditClick = (emp: Employee) => {
    setEditingId(emp.id);
    
    // Find IDs by matching the names from the current relation
    const currentRoleId = roles.find(r => r.name === emp.role?.name)?.id || "";
    const currentSecId = secretariats.find(s => s.name === emp.secretariat?.name)?.id || "";
    const currentDepId = departments.find(d => d.name === emp.department?.name)?.id || "";

    setEditForm({ 
      name: emp.name, 
      email: emp.email || "", 
      cpf: emp.cpf || "",
      roleId: currentRoleId,
      secretariatId: currentSecId,
      departmentId: currentDepId
    });
  };

  const handleSave = async (id: string) => {
    if (window.confirm("Tem certeza que deseja salvar estas alterações?")) {
      const result = await updateEmployee(id, {
        name: editForm.name,
        email: editForm.email,
        cpf: editForm.cpf,
        roleId: editForm.roleId || null,
        secretariatId: editForm.secretariatId || null,
        departmentId: editForm.departmentId || null
      });
      if (result.error) alert(result.error); else setEditingId(null);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (window.confirm("Tem certeza que deseja INATIVAR este servidor? Ele não será excluído do sistema, apenas desativado.")) {
      const result = await deactivateEmployee(id);
      if (result.error) alert(result.error);
    }
  };

  const handleActivate = async (id: string) => {
    if (window.confirm("Deseja REATIVAR este servidor?")) {
      const result = await activateEmployee(id);
      if (result.error) alert(result.error);
    }
  };

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mb-2 flex size-9 items-center justify-center rounded bg-slate-100">
          <Users className="size-5 text-slate-400" />
        </div>
        <h2 className="text-sm font-bold text-slate-700">Nenhum registro encontrado</h2>
        <p className="mt-0.5 text-xs text-slate-500">Comece adicionando o primeiro servidor.</p>
      </div>
    );
  }

  return (
    <ErpListFrame toolbar={<div className="flex min-h-7 items-center justify-between gap-2">
        <h2 className="text-xs font-bold text-slate-800">Servidores cadastrados</h2>
        <input 
          type="text" 
          placeholder="Buscar servidor por nome, cpf ou e-mail..." 
          aria-label="Buscar servidor"
          className="h-7 w-full max-w-96 rounded border border-slate-300 bg-white px-2.5 text-xs shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
      </div>} pagination={<ErpPagination page={activePage} total={filteredEmployees.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="servidores" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
          <tr>
            <th className="h-8 px-3">Nome / CPF / Email</th>
            <th className="h-8 px-3">Cargo</th>
            <th className="h-8 px-3">Alocação</th>
            <th className="h-8 px-3 text-center">Status</th>
            <th className="h-8 px-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pageEmployees.map(emp => (
            <tr key={emp.id} className="hover:bg-slate-50">
              <td className="max-w-0 px-3 py-1.5">
                <div className="truncate font-medium text-slate-800" title={emp.name}>
                  {editingId === emp.id ? (
                    <input className="border rounded px-2 py-1 w-full" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  ) : emp.name}
                </div>
                <div className="truncate text-[10px] text-slate-500" title={emp.cpf || undefined}>
                  {editingId === emp.id ? (
                    <input className="border rounded px-2 py-1 w-full" placeholder="CPF" value={editForm.cpf} onChange={e => setEditForm({...editForm, cpf: e.target.value})} />
                  ) : (emp.cpf || "Sem CPF")}
                </div>
              </td>
              <td className="max-w-0 truncate px-3 py-1.5 text-slate-600" title={emp.role?.name || undefined}>
                {editingId === emp.id ? (
                  <select 
                    className="border rounded px-2 py-1 w-full" 
                    value={editForm.roleId} 
                    onChange={e => setEditForm({...editForm, roleId: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                ) : (emp.role?.name || "-")}
              </td>
              <td className="max-w-0 px-3 py-1.5 text-slate-600">
                {editingId === emp.id ? (
                  <div className="flex flex-col gap-2">
                    <select 
                      className="border rounded px-2 py-1 w-full" 
                      value={editForm.secretariatId} 
                      onChange={e => setEditForm({...editForm, secretariatId: e.target.value, departmentId: ""})}
                    >
                      <option value="">Selecione...</option>
                      {secretariats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select 
                      className="border rounded px-2 py-1 w-full" 
                      value={editForm.departmentId} 
                      onChange={e => setEditForm({...editForm, departmentId: e.target.value})}
                    >
                      <option value="">Departamento (Opcional)</option>
                      {availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="truncate font-medium text-slate-800" title={emp.secretariat?.name || undefined}>{emp.secretariat?.name || "Sem Secretaria"}</div>
                    <div className="truncate text-[10px] text-slate-500" title={emp.department?.name || undefined}>{emp.department?.name || ""}</div>
                  </>
                )}
              </td>
              <td className="px-3 py-2 text-center">
                {emp.isActive ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Ativo</span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">Inativo</span>
                )}
              </td>
              <td className="px-3 py-2 text-right">
                {editingId === emp.id ? (
                  <>
                    <button onClick={() => handleSave(emp.id)} className="text-emerald-600 hover:text-emerald-700 font-medium text-xs bg-emerald-50 px-2 py-1 rounded">Salvar</button>
                    <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-700 font-medium text-xs bg-slate-100 px-2 py-1 rounded">Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditClick(emp)} className="text-emerald-600 hover:text-emerald-700 p-1" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {emp.isActive ? (
                      <button onClick={() => handleDeactivate(emp.id)} className="text-red-500 hover:text-red-700 p-1" title="Inativar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(emp.id)} className="text-emerald-500 hover:text-emerald-700 p-1" title="Reativar">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
          {filteredEmployees.length === 0 && (
            <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-500">
                Nenhum servidor encontrado para &quot;{searchTerm}&quot;.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </ErpListFrame>
  );
}
