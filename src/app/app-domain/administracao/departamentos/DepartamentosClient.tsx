"use client";

import { useState } from "react";
import { Network, Pencil, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { updateDepartment, deactivateDepartment, activateDepartment } from "../actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Department = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  secretariat: { name: string };
};

export default function DepartamentosClient({ 
  departments, 
  secretariats 
}: { 
  departments: Department[],
  secretariats: { id: string, name: string }[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", secretariatId: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredDepartments = departments.filter(dep => 
    dep.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (dep.description && dep.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    dep.secretariat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredDepartments.length / PAGE_SIZE)));
  const pageDepartments = filteredDepartments.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleEditClick = (dep: Department) => {
    setEditingId(dep.id);
    setEditForm({ 
      name: dep.name, 
      description: dep.description || "",
      secretariatId: secretariats.find(s => s.name === dep.secretariat.name)?.id || ""
    });
  };

  const handleSaveEdit = async () => {
    if (editingId && window.confirm("Tem certeza que deseja salvar estas alterações?")) {
      const result = await updateDepartment(editingId, editForm);
      if (result.error) alert(result.error); else setEditingId(null);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (window.confirm("Tem certeza que deseja INATIVAR este departamento? Ele não será excluído do sistema, apenas desativado.")) {
      const result = await deactivateDepartment(id);
      if (result.error) alert(result.error);
    }
  };

  const handleActivate = async (id: string) => {
    if (window.confirm("Deseja REATIVAR este departamento?")) {
      const result = await activateDepartment(id);
      if (result.error) alert(result.error);
    }
  };

  if (departments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mb-2 flex size-9 items-center justify-center rounded bg-slate-100">
          <Network className="size-5 text-slate-400" />
        </div>
        <h2 className="text-sm font-bold text-slate-700">Nenhum registro encontrado</h2>
        <p className="mt-0.5 text-xs text-slate-500">Comece adicionando o primeiro departamento.</p>
      </div>
    );
  }

  return (
    <ErpListFrame toolbar={<div className="flex min-h-7 items-center justify-between gap-2">
        <h2 className="text-xs font-bold text-slate-800">Departamentos cadastrados</h2>
        <input 
          type="text" 
          placeholder="Buscar departamento..." 
          aria-label="Buscar departamento"
          className="h-7 w-full max-w-72 rounded border border-slate-300 bg-white px-2.5 text-xs shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/15"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
      </div>} pagination={<ErpPagination page={activePage} total={filteredDepartments.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="departamentos" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
          <tr>
            <th className="h-8 px-3">Nome</th>
            <th className="h-8 px-3">Secretaria Vinculada</th>
            <th className="h-8 px-3 text-center">Status</th>
            <th className="h-8 px-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pageDepartments.map(dep => (
            <tr key={dep.id} className="h-9 hover:bg-slate-50">
              <td className="px-3 font-medium text-slate-800">
                {editingId === dep.id ? (
                  <input className="border rounded px-2 py-1 w-full" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                ) : dep.name}
              </td>
              <td className="px-3 text-slate-600">
                {editingId === dep.id ? (
                  <select 
                    className="border rounded px-2 py-1 w-full" 
                    value={editForm.secretariatId} 
                    onChange={e => setEditForm({...editForm, secretariatId: e.target.value})}
                  >
                    <option value="" disabled>Selecione uma secretaria...</option>
                    {secretariats.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                ) : dep.secretariat.name}
              </td>
              <td className="px-3 text-center">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${dep.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {dep.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-3 text-right">
                {editingId === dep.id ? (
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={handleSaveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEditClick(dep)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {dep.isActive ? (
                      <button onClick={() => handleDeactivate(dep.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Inativar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(dep.id)} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Reativar">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
          {filteredDepartments.length === 0 && (
            <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-500">
                Nenhum departamento encontrado para &quot;{searchTerm}&quot;.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </ErpListFrame>
  );
}
