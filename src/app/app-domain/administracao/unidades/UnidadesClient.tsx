"use client";

import { useState } from "react";
import { Building, Pencil, Power, PowerOff } from "lucide-react";
import { activateAdministrativeUnit, deactivateAdministrativeUnit, updateAdministrativeUnit } from "../actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Unit = {
  id: string;
  name: string;
  type: string;
  managerName: string | null;
  secretariatId: string;
  isActive: boolean;
  secretariat: { name: string } | null;
};

export default function UnidadesClient({ 
  units, 
  secretariats 
}: { 
  units: Unit[],
  secretariats: { id: string, name: string }[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", type: "", managerName: "", secretariatId: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    unit.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.managerName && unit.managerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (unit.secretariat?.name && unit.secretariat.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredUnits.length / PAGE_SIZE)));
  const pageUnits = filteredUnits.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleEditClick = (unit: Unit) => {
    setEditingId(unit.id);
    setEditForm({ 
      name: unit.name, 
      type: unit.type,
      managerName: unit.managerName || "",
      secretariatId: unit.secretariatId || secretariats[0]?.id || ""
    });
  };

  const handleSaveEdit = async () => {
    if (editingId && window.confirm("Tem certeza que deseja salvar estas alterações?")) {
      const result = await updateAdministrativeUnit(editingId, editForm);
      if (result.error) alert(result.error); else setEditingId(null);
    }
  };

  const handleToggleStatus = async (unit: Unit) => {
    if (!window.confirm(`Deseja ${unit.isActive ? "inativar" : "reativar"} esta unidade?`)) return;
    const result = unit.isActive ? await deactivateAdministrativeUnit(unit.id) : await activateAdministrativeUnit(unit.id);
    if (result.error) alert(result.error);
  };

  if (units.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mb-2 flex size-9 items-center justify-center rounded bg-slate-100">
          <Building className="size-5 text-slate-400" />
        </div>
        <h2 className="text-sm font-bold text-slate-700">Nenhum registro encontrado</h2>
        <p className="mt-0.5 text-xs text-slate-500">Comece adicionando a primeira unidade.</p>
      </div>
    );
  }

  return (
    <ErpListFrame toolbar={<div className="flex min-h-7 items-center justify-between gap-2">
        <h2 className="text-xs font-bold text-slate-800">Unidades cadastradas</h2>
        <input 
          type="text" 
          placeholder="Buscar unidade..." 
          aria-label="Buscar unidade"
          className="h-7 w-full max-w-72 rounded border border-slate-300 bg-white px-2.5 text-xs shadow-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
      </div>} pagination={<ErpPagination page={activePage} total={filteredUnits.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="unidades" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
            <tr>
              <th className="h-8 px-3">Nome</th>
              <th className="h-8 px-3">Tipo</th>
              <th className="h-8 px-3">Secretaria Vinculada</th>
              <th className="h-8 px-3">Responsável</th>
              <th className="h-8 px-3 text-center">Status</th>
              <th className="h-8 px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageUnits.map(unit => (
              <tr key={unit.id} className="h-9 hover:bg-slate-50">
                <td className="px-3 font-medium text-slate-800">
                  {editingId === unit.id ? (
                    <input className="border rounded px-2 py-1 w-full" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  ) : unit.name}
                </td>
                <td className="px-3 text-slate-600">
                  {editingId === unit.id ? (
                    <input className="border rounded px-2 py-1 w-full" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} />
                  ) : (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{unit.type}</span>
                  )}
                </td>
                <td className="px-3 text-slate-600">
                  {editingId === unit.id ? (
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
                  ) : unit.secretariat?.name || "-"}
                </td>
                <td className="px-3 text-slate-600">
                  {editingId === unit.id ? (
                    <input className="border rounded px-2 py-1 w-full" value={editForm.managerName} onChange={e => setEditForm({...editForm, managerName: e.target.value})} />
                  ) : unit.managerName || "-"}
                </td>
                <td className="px-3 text-center">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${unit.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{unit.isActive ? "Ativa" : "Inativa"}</span>
                </td>
                <td className="px-3 text-right">
                  {editingId === unit.id ? (
                    <>
                      <button onClick={handleSaveEdit} className="text-emerald-600 hover:text-emerald-700 font-medium text-xs bg-emerald-50 px-2 py-1 rounded">Salvar</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-700 font-medium text-xs bg-slate-100 px-2 py-1 rounded">Cancelar</button>
                    </>
                  ) : (
                    <>
                    <button onClick={() => handleEditClick(unit)} className="text-amber-600 hover:text-amber-700 p-1" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleToggleStatus(unit)} className="text-slate-600 hover:text-slate-900 p-1" title={unit.isActive ? "Inativar" : "Reativar"}>
                      {unit.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filteredUnits.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-500">
                  Nenhuma unidade encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </ErpListFrame>
  );
}
