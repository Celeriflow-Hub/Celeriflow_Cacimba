"use client";

import { useState } from "react";
import { Briefcase, Pencil, Trash2, RefreshCw } from "lucide-react";
import { updateRole, deactivateRole, activateRole } from "../actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Role = {
  id: string;
  name: string;
  level: string | null;
  canSign: boolean;
  isActive: boolean;
  _count: { employees: number };
};

export default function CargosClient({ roles }: { roles: Role[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", level: "", canSign: false });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (role.level && role.level.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE)));
  const pageRoles = filteredRoles.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleEditClick = (role: Role) => {
    setEditingId(role.id);
    setEditForm({ 
      name: role.name, 
      level: role.level || "",
      canSign: role.canSign
    });
  };

  const handleSaveEdit = async () => {
    if (editingId && window.confirm("Tem certeza que deseja salvar estas alterações?")) {
      await updateRole(editingId, editForm);
      setEditingId(null);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (window.confirm("Tem certeza que deseja INATIVAR este cargo? Ele não será excluído do sistema, apenas desativado.")) {
      await deactivateRole(id);
    }
  };

  const handleActivate = async (id: string) => {
    if (window.confirm("Deseja REATIVAR este cargo?")) {
      await activateRole(id);
    }
  };

  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mb-2 flex size-9 items-center justify-center rounded bg-slate-100">
          <Briefcase className="size-5 text-slate-400" />
        </div>
        <h2 className="text-sm font-bold text-slate-700">Nenhum registro encontrado</h2>
        <p className="mt-0.5 text-xs text-slate-500">Comece adicionando o primeiro cargo.</p>
      </div>
    );
  }

  return (
    <ErpListFrame className="min-h-0" toolbar={<div className="flex min-h-7 items-center justify-between gap-2">
        <h2 className="text-xs font-bold text-slate-800">Cargos cadastrados</h2>
        <input 
          type="text" 
          placeholder="Buscar cargo..." 
          aria-label="Buscar cargo"
          className="h-7 w-full max-w-72 rounded border border-slate-300 bg-white px-2.5 text-xs shadow-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/15"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
      </div>} pagination={<ErpPagination page={activePage} total={filteredRoles.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="cargos" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
          <tr>
            <th className="h-8 px-3">Nome</th>
            <th className="h-8 px-3">Nível</th>
            <th className="h-8 px-3">Pode Assinar?</th>
            <th className="h-8 px-3 text-center">Servidores Vinculados</th>
            <th className="h-8 px-3 text-center">Status</th>
            <th className="h-8 px-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pageRoles.map(role => (
            <tr key={role.id} className="h-9 hover:bg-slate-50">
              <td className="px-3 font-medium text-slate-800">
                {editingId === role.id ? (
                  <input className="border rounded px-2 py-1 w-full" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                ) : role.name}
              </td>
              <td className="px-3 text-slate-600">
                {editingId === role.id ? (
                  <input className="border rounded px-2 py-1 w-full" value={editForm.level} onChange={e => setEditForm({...editForm, level: e.target.value})} />
                ) : (role.level || "-")}
              </td>
              <td className="px-3 text-slate-600">
                {editingId === role.id ? (
                  <input type="checkbox" className="border rounded" checked={editForm.canSign} onChange={e => setEditForm({...editForm, canSign: e.target.checked})} />
                ) : (
                  role.canSign ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Sim</span>
                  ) : (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">Não</span>
                  )
                )}
              </td>
              <td className="px-3 text-center text-slate-600">{role._count.employees}</td>
              <td className="px-3 text-center">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${role.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {role.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-3 text-right">
                {editingId === role.id ? (
                  <>
                    <button onClick={handleSaveEdit} className="text-emerald-600 hover:text-emerald-700 font-medium text-xs bg-emerald-50 px-2 py-1 rounded">Salvar</button>
                    <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-700 font-medium text-xs bg-slate-100 px-2 py-1 rounded">Cancelar</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => handleEditClick(role)} className="text-purple-600 hover:text-purple-700 p-1" title="Editar" aria-label={`Editar ${role.name}`}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    {role.isActive ? (
                      <button type="button" onClick={() => handleDeactivate(role.id)} className="text-red-500 hover:text-red-700 p-1" title="Inativar" aria-label={`Inativar ${role.name}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button type="button" onClick={() => handleActivate(role.id)} className="text-emerald-500 hover:text-emerald-700 p-1" title="Reativar" aria-label={`Reativar ${role.name}`}>
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
          {filteredRoles.length === 0 && (
            <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-500">
                Nenhum cargo encontrado para &quot;{searchTerm}&quot;.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </ErpListFrame>
  );
}
