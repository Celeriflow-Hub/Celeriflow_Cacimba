"use client";

import { useState } from "react";
import { Users, Pencil, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { updatePerson, deactivatePerson, activatePerson } from "../actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type TaxpayerInfo = {
  municipalInsc: string | null;
};

type Person = {
  id: string;
  fullName: string;
  cpf: string;
  email: string | null;
  phonePrimary: string | null;
  status: string;
  taxpayerInfo?: TaxpayerInfo | null;
};

export default function PessoasFisicasClient({ persons }: { persons: Person[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Person & { isTaxpayer: boolean; municipalInsc: string }>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredPersons = persons.filter((person) => [person.fullName, person.cpf, person.email, person.phonePrimary].some((value) => value?.toLowerCase().includes(normalizedSearch)));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredPersons.length / PAGE_SIZE)));
  const pagePersons = filteredPersons.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleEditClick = (person: Person) => {
    setEditingId(person.id);
    setEditForm({
      fullName: person.fullName,
      cpf: person.cpf,
      email: person.email,
      phonePrimary: person.phonePrimary,
      isTaxpayer: !!person.taxpayerInfo,
      municipalInsc: person.taxpayerInfo?.municipalInsc || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (confirm("Deseja salvar as alterações?")) {
      try {
        await updatePerson(editingId, {
          fullName: editForm.fullName,
          cpf: editForm.cpf,
          email: editForm.email,
          phonePrimary: editForm.phonePrimary,
          // Pass the taxpayer fields to the action
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
    if (confirm("Deseja realmente inativar este registro?")) {
      await deactivatePerson(id);
    }
  };

  const handleActivate = async (id: string) => {
    if (confirm("Deseja realmente reativar este registro?")) {
      await activatePerson(id);
    }
  };

  if (persons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-2 flex size-9 items-center justify-center rounded bg-slate-100">
          <Users className="size-5 text-slate-400" />
        </div>
        <h2 className="text-sm font-bold text-slate-700">Nenhum registro encontrado</h2>
        <p className="mt-0.5 text-xs text-slate-500">Comece adicionando a primeira pessoa física na base de dados.</p>
      </div>
    );
  }

  return (
    <ErpListFrame toolbar={<input type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="Buscar por nome, CPF, telefone ou e-mail" aria-label="Buscar pessoas físicas" className="h-7 w-full max-w-md rounded border border-slate-300 px-2.5 text-xs outline-none focus:border-indigo-600" />} pagination={<ErpPagination page={activePage} total={filteredPersons.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="pessoas" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
          <tr>
            <th className="h-8 px-3">Nome Completo</th>
            <th className="h-8 px-3">CPF</th>
            <th className="h-8 px-3">Telefone</th>
            <th className="hidden h-8 px-3 lg:table-cell">E-mail</th>
            <th className="hidden h-8 px-3 md:table-cell">Contribuinte</th>
            <th className="h-8 px-3">Status</th>
            <th className="h-8 px-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pagePersons.map((person) => (
            <tr key={person.id} className="hover:bg-slate-50 transition-colors">
              <td className="max-w-0 truncate px-3 py-1.5 font-medium text-slate-800" title={person.fullName}>
                {editingId === person.id ? (
                  <input
                    type="text"
                    value={editForm.fullName || ""}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full border rounded px-2 py-1 placeholder-slate-400 font-normal"
                    placeholder="Nome Completo"
                  />
                ) : (
                  person.fullName
                )}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {editingId === person.id ? (
                  <input
                    type="text"
                    value={editForm.cpf || ""}
                    onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })}
                    className="w-full border rounded px-2 py-1 placeholder-slate-400 font-normal"
                    placeholder="CPF (apenas números)"
                  />
                ) : (
                  person.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                )}
              </td>
              <td className="max-w-0 truncate px-3 py-1.5 text-slate-600" title={person.phonePrimary || undefined}>
                {editingId === person.id ? (
                    <input
                      type="text"
                      value={editForm.phonePrimary || ""}
                      onChange={(e) => setEditForm({ ...editForm, phonePrimary: e.target.value })}
                      className="w-full border rounded px-2 py-1 placeholder-slate-400 font-normal text-xs"
                      placeholder="Telefone"
                    />
                ) : (
                  person.phonePrimary || "-"
                )}
              </td>
              <td className="hidden max-w-0 truncate px-3 py-1.5 text-slate-600 lg:table-cell" title={person.email || undefined}>
                {editingId === person.id ? <input type="email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full rounded border px-2 py-1 text-xs" placeholder="E-mail" /> : person.email || "-"}
              </td>
              <td className="hidden px-3 py-1.5 text-slate-600 md:table-cell">
                {editingId === person.id ? (
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
                  person.taxpayerInfo ? (
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-amber-700">Sim</span>
                      {person.taxpayerInfo.municipalInsc && (
                        <span className="text-slate-500">Insc: {person.taxpayerInfo.municipalInsc}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">Não</span>
                  )
                )}
              </td>
              <td className="px-3 py-2">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${person.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {person.status}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                {editingId === person.id ? (
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
                    <button onClick={() => handleEditClick(person)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {person.status === 'Ativo' ? (
                      <button onClick={() => handleDeactivate(person.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Inativar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(person.id)} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Reativar">
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
