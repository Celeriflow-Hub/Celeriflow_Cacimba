"use client";

import { useState } from "react";
import { Users, Search, Plus, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { createFamily, updateFamily, toggleFamilyStatus } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Person = { id: string; fullName: string; cpf: string | null };
type Family = {
  id: string;
  representativeId: string;
  representative: Person;
  nis: string | null;
  familyCode: string | null;
  income: number | null;
  perCapitaIncome: number | null;
  vulnerabilities: string | null;
  status: string;
};
type FamilyFormData = {
  representativeId: string;
  nis: string;
  familyCode: string;
  income: string;
  perCapitaIncome: string;
  vulnerabilities: string;
};

export default function FamiliasClient({ familiasInicial, persons }: { familiasInicial: Family[]; persons: Person[] }) {
  const [familias, setFamilias] = useState<Family[]>(familiasInicial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFamilia, setEditingFamilia] = useState<Family | null>(null);
  
  const [formData, setFormData] = useState<FamilyFormData>({
    representativeId: "",
    nis: "",
    familyCode: "",
    income: "",
    perCapitaIncome: "",
    vulnerabilities: ""
  });

  const filtered = familias.filter((f) =>
    (f.representative?.fullName || "").toLowerCase().includes(search.toLowerCase()) || 
    (f.nis || "").includes(search) ||
    (f.familyCode || "").includes(search)
  ).filter((family) => statusFilter === "Todos" || family.status === statusFilter);
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visibleFamilies = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleOpenModal = (familia?: Family) => {
    if (familia) {
      setEditingFamilia(familia);
      setFormData({
        representativeId: familia.representativeId || "",
        nis: familia.nis || "",
        familyCode: familia.familyCode || "",
        income: familia.income?.toString() || "",
        perCapitaIncome: familia.perCapitaIncome?.toString() || "",
        vulnerabilities: familia.vulnerabilities || ""
      });
    } else {
      setEditingFamilia(null);
      setFormData({ representativeId: "", nis: "", familyCode: "", income: "", perCapitaIncome: "", vulnerabilities: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      income: formData.income ? Number(formData.income) : undefined,
      perCapitaIncome: formData.perCapitaIncome ? Number(formData.perCapitaIncome) : undefined,
    };
    if (editingFamilia) {
      const res = await updateFamily(editingFamilia.id, data);
      if (res.success && res.data) {
        setFamilias(familias.map((f) => f.id === editingFamilia.id ? res.data : f));
      }
    } else {
      const res = await createFamily(data);
      if (res.success && res.data) {
        setFamilias([res.data, ...familias]);
      }
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Ativo" ? "Inativo" : "Ativo";
    const res = await toggleFamilyStatus(id, newStatus);
    if (res.success && res.data) {
      setFamilias(familias.map((f) => f.id === id ? res.data : f));
    }
  };

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3">
      <PageHeader
        title="Famílias e Indivíduos"
        icon={<Users className="size-4 shrink-0 text-blue-600" />}
        action={<button onClick={() => handleOpenModal()} className="inline-flex h-7 items-center gap-1 rounded-md bg-blue-600 px-2.5 text-xs font-semibold text-white hover:bg-blue-700"><Plus className="size-3.5" />Nova família</button>}
      />
      <ErpListFrame
        toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_10rem]"><div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar por NIS, código ou responsável..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="h-8 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option>Todos</option>{Array.from(new Set(familias.map((item) => item.status))).map((item) => <option key={item}>{item}</option>)}</select></div>}
        summary={<p className="text-[11px] text-slate-500">{filtered.length} famílias encontradas</p>}
        pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="famílias" onPageChange={setPage} />}
      >
        <table className="w-full table-fixed text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100">
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="p-2 font-semibold">Responsável</th>
                <th className="p-2 font-semibold">NIS</th>
                <th className="hidden p-2 font-semibold md:table-cell">Código familiar</th>
                <th className="hidden p-2 font-semibold lg:table-cell">Renda</th>
                <th className="hidden p-2 text-center font-semibold sm:table-cell">Status</th>
                <th className="p-2 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length > 0 ? (
                visibleFamilies.map((familia) => (
                  <tr key={familia.id} className="h-9 hover:bg-slate-50/50">
                    <td className="truncate p-2 font-semibold text-slate-800" title={familia.representative?.fullName}>{familia.representative?.fullName || "Sem responsável"}</td>
                    <td className="p-2 text-slate-600">
                      <p className="flex items-center gap-1 font-medium text-xs">
                        <CreditCard className="w-3 h-3 text-slate-400" /> 
                        {familia.nis || '-'}
                      </p>
                    </td>
                    <td className="hidden p-2 text-slate-600 md:table-cell">
                      {familia.familyCode || '-'}
                    </td>
                    <td className="hidden whitespace-nowrap p-2 font-medium text-slate-700 lg:table-cell">
                      {familia.income === null ? "-" : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(familia.income)}
                    </td>
                    <td className="hidden p-2 text-center sm:table-cell">
                      {familia.status === "Ativo" ? (
                         <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-200">
                           <CheckCircle2 className="w-3 h-3" /> Ativo
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 rounded-md text-xs font-medium border border-rose-200">
                           <XCircle className="w-3 h-3" /> Inativo
                         </span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleOpenModal(familia)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors text-xs font-medium">
                          Editar
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(familia.id, familia.status)}
                          className={familia.status === 'Ativo' ? 'text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg transition-colors text-xs font-medium' : 'text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors text-xs font-medium'}
                        >
                          {familia.status === 'Ativo' ? 'Inativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nenhuma família encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </ErpListFrame>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {editingFamilia ? "Editar Família" : "Nova Família"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Responsável Familiar (Pessoa)</label>
                  <select required value={formData.representativeId} onChange={e => setFormData({...formData, representativeId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">Selecione a Pessoa</option>
                    {persons.map((p) => (
                      <option key={p.id} value={p.id}>{p.fullName} {p.cpf ? `(CPF: ${p.cpf})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">NIS</label>
                  <input type="text" value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Código Familiar</label>
                  <input type="text" value={formData.familyCode} onChange={e => setFormData({...formData, familyCode: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Renda Total</label>
                  <input type="number" step="0.01" value={formData.income} onChange={e => setFormData({...formData, income: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Renda Per Capita</label>
                  <input type="number" step="0.01" value={formData.perCapitaIncome} onChange={e => setFormData({...formData, perCapitaIncome: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Vulnerabilidades</label>
                  <input type="text" value={formData.vulnerabilities} onChange={e => setFormData({...formData, vulnerabilities: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  {editingFamilia ? "Salvar Alterações" : "Criar Família"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
