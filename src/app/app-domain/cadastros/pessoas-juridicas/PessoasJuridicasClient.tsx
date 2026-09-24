"use client";

import { useState } from "react";
import { Building2, Pencil, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { updateCompany, deactivateCompany, activateCompany } from "../actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type TaxpayerInfo = {
  municipalInsc: string | null;
};

type Company = {
  id: string;
  corporateName: string;
  cnpj: string;
  emailPrimary: string | null;
  phone: string | null;
  status: string;
  taxpayerInfo?: TaxpayerInfo | null;
};

export default function PessoasJuridicasClient({ companies }: { companies: Company[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Company & { isTaxpayer: boolean; municipalInsc: string }>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCompanies = companies.filter((company) => [company.corporateName, company.cnpj, company.emailPrimary, company.phone].some((value) => value?.toLowerCase().includes(normalizedSearch)));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE)));
  const pageCompanies = filteredCompanies.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleEditClick = (company: Company) => {
    setEditingId(company.id);
    setEditForm({
      corporateName: company.corporateName,
      cnpj: company.cnpj,
      emailPrimary: company.emailPrimary,
      phone: company.phone,
      isTaxpayer: !!company.taxpayerInfo,
      municipalInsc: company.taxpayerInfo?.municipalInsc || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (confirm("Deseja salvar as alterações?")) {
      try {
        await updateCompany(editingId, {
          corporateName: editForm.corporateName,
          cnpj: editForm.cnpj,
          emailPrimary: editForm.emailPrimary,
          phone: editForm.phone,
          isTaxpayer: editForm.isTaxpayer,
          municipalInsc: editForm.municipalInsc,
        });
        setEditingId(null);
      } catch (e) {
        console.error(e);
        alert("Erro ao salvar");
      }
    }
  };

  const handleDeactivate = async (id: string) => {
    if (confirm("Deseja realmente inativar esta empresa?")) {
      await deactivateCompany(id);
    }
  };

  const handleActivate = async (id: string) => {
    if (confirm("Deseja realmente reativar esta empresa?")) {
      await activateCompany(id);
    }
  };

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-2 flex size-9 items-center justify-center rounded bg-slate-100">
          <Building2 className="size-5 text-slate-400" />
        </div>
        <h2 className="text-sm font-bold text-slate-700">Nenhum registro encontrado</h2>
        <p className="mt-0.5 text-xs text-slate-500">Comece adicionando a primeira empresa na base de dados.</p>
      </div>
    );
  }

  return (
    <ErpListFrame toolbar={<input type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="Buscar por razão social, CNPJ, telefone ou e-mail" aria-label="Buscar pessoas jurídicas" className="h-7 w-full max-w-md rounded border border-slate-300 px-2.5 text-xs outline-none focus:border-emerald-600" />} pagination={<ErpPagination page={activePage} total={filteredCompanies.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="empresas" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
          <tr>
            <th className="h-8 px-3">Razão Social</th>
            <th className="h-8 px-3">CNPJ</th>
            <th className="h-8 px-3">Telefone</th>
            <th className="hidden h-8 px-3 lg:table-cell">E-mail</th>
            <th className="hidden h-8 px-3 md:table-cell">Contribuinte</th>
            <th className="h-8 px-3">Status</th>
            <th className="h-8 px-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pageCompanies.map((company) => (
            <tr key={company.id} className="hover:bg-slate-50 transition-colors">
              <td className="max-w-0 truncate px-3 py-1.5 font-medium text-slate-800" title={company.corporateName}>
                {editingId === company.id ? (
                  <input
                    type="text"
                    value={editForm.corporateName || ""}
                    onChange={(e) => setEditForm({ ...editForm, corporateName: e.target.value })}
                    className="w-full border rounded px-2 py-1 placeholder-slate-400 font-normal"
                    placeholder="Razão Social"
                  />
                ) : (
                  company.corporateName
                )}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {editingId === company.id ? (
                  <input
                    type="text"
                    value={editForm.cnpj || ""}
                    onChange={(e) => setEditForm({ ...editForm, cnpj: e.target.value })}
                    className="w-full border rounded px-2 py-1 placeholder-slate-400 font-normal"
                    placeholder="CNPJ (apenas números)"
                  />
                ) : (
                  company.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
                )}
              </td>
              <td className="max-w-0 truncate px-3 py-1.5 text-slate-600" title={company.phone || undefined}>
                {editingId === company.id ? (
                    <input
                      type="text"
                      value={editForm.phone || ""}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full border rounded px-2 py-1 placeholder-slate-400 font-normal text-xs"
                      placeholder="Telefone"
                    />
                ) : (
                  company.phone || "-"
                )}
              </td>
              <td className="hidden max-w-0 truncate px-3 py-1.5 text-slate-600 lg:table-cell" title={company.emailPrimary || undefined}>
                {editingId === company.id ? <input type="email" value={editForm.emailPrimary || ""} onChange={(e) => setEditForm({ ...editForm, emailPrimary: e.target.value })} className="w-full rounded border px-2 py-1 text-xs" placeholder="E-mail" /> : company.emailPrimary || "-"}
              </td>
              <td className="hidden px-3 py-1.5 text-slate-600 md:table-cell">
                {editingId === company.id ? (
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isTaxpayer}
                        onChange={(e) => setEditForm({ ...editForm, isTaxpayer: e.target.checked })}
                      />
                      É Contribuinte?
                    </label>
                    {editForm.isTaxpayer && (
                      <input
                        type="text"
                        value={editForm.municipalInsc || ""}
                        onChange={(e) => setEditForm({ ...editForm, municipalInsc: e.target.value })}
                        className="w-full border rounded px-2 py-1 placeholder-slate-400 font-normal text-xs"
                        placeholder="Inscrição Municipal"
                      />
                    )}
                  </div>
                ) : (
                  company.taxpayerInfo ? (
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-amber-700">Sim</span>
                      {company.taxpayerInfo.municipalInsc && (
                        <span className="text-slate-500">Insc: {company.taxpayerInfo.municipalInsc}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">Não</span>
                  )
                )}
              </td>
              <td className="px-3 py-2">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${company.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {company.status}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                {editingId === company.id ? (
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={handleSaveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Salvar">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded" title="Cancelar">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEditClick(company)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {company.status === 'Ativo' ? (
                      <button onClick={() => handleDeactivate(company.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Inativar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(company.id)} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Reativar">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ErpListFrame>
  );
}
