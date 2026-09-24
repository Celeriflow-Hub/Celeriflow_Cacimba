"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Home, Pencil, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { updateRealEstate, deactivateRealEstate, activateRealEstate, createRealEstate } from "./actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import {
  ErpTableContainer,
  ErpTableThead,
  ErpTableTh,
  ErpTableTr,
  ErpTableTd,
  ErpStatusBadge,
  type ErpStatusVariant,
} from "@/components/app-ui/erp/ErpTable";

type RealEstate = {
  id: string;
  municipalInsc: string | null;
  streetName: string | null;
  number: string | null;
  landArea: number | null;
  builtArea: number | null;
  status: string;
  taxpayer: {
    person: { fullName: string } | null;
    company: { corporateName: string } | null;
  } | null;
};

type RealEstateUpdate = {
  municipalInsc?: string | null;
  streetName?: string | null;
  number?: string | null;
  propertyType?: string;
  landArea?: number | null;
  builtArea?: number | null;
};

function statusVariant(status: string): ErpStatusVariant {
  if (status === "Regular") return "success";
  if (status === "Irregular" || status === "Inativo") return "danger";
  if (status === "Pendente") return "warning";
  return "neutral";
}

export default function ImoveisClient({ imoveis, taxpayers }: { imoveis: RealEstate[]; taxpayers: { id: string; name: string }[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RealEstateUpdate>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    municipalInsc: "",
    streetName: "",
    number: "",
    propertyType: "Terreno",
    landArea: 0,
    builtArea: 0,
    taxpayerId: taxpayers[0]?.id ?? "",
    registration: "",
    propertyUse: "Residencial",
    fiscalZone: "Urbana",
    lot: "",
    block: ""
  });

  const filtered = imoveis.filter((imovel) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const insc = imovel.municipalInsc?.toLowerCase() || "";
    const street = imovel.streetName?.toLowerCase() || "";
    const name = (imovel.taxpayer?.company?.corporateName || imovel.taxpayer?.person?.fullName || "").toLowerCase();
    return insc.includes(term) || street.includes(term) || name.includes(term);
  });
  const pageSize = 20;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleEditClick = (re: RealEstate) => {
    setEditingId(re.id);
    setEditForm({
      municipalInsc: re.municipalInsc,
      streetName: re.streetName,
      number: re.number,
      landArea: re.landArea,
      builtArea: re.builtArea
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (confirm("Deseja salvar as alterações?")) {
      try {
        await updateRealEstate(editingId, editForm);
        setEditingId(null);
      } catch (e) {
        console.error(e);
        alert("Erro ao salvar alterações.");
      }
    }
  };

  const handleDeactivate = async (id: string) => {
    if (confirm("Deseja inativar este imóvel?")) {
      await deactivateRealEstate(id);
    }
  };

  const handleActivate = async (id: string) => {
    if (confirm("Deseja reativar este imóvel?")) {
      await activateRealEstate(id);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRealEstate(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({ municipalInsc: "", streetName: "", number: "", propertyType: "Terreno", landArea: 0, builtArea: 0, taxpayerId: taxpayers[0]?.id ?? "", registration: "", propertyUse: "Residencial", fiscalZone: "Urbana", lot: "", block: "" });
    } catch (err) {
      console.error(err);
      alert("Erro ao criar imóvel.");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-2.5 overflow-hidden">
      <ErpPageTitle
        title="Imóveis (IPTU)"
        icon={<Home className="size-4 text-emerald-600" />}
        action={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600"
          >
            <Plus className="size-3.5" />
            Novo Imóvel
          </button>
        }
      />

      <ErpListFrame
        pagination={<ErpPagination page={page} total={filtered.length} pageSize={pageSize} previousHref="#" nextHref="#" label="imóveis" onPageChange={setPage} />}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
              <span className="sr-only">Buscar imóvel</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Buscar por inscrição imobiliária, endereço ou proprietário"
                className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          </div>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[18%]">Inscrição Imob.</ErpTableTh>
              <ErpTableTh className="w-[32%]">Endereço</ErpTableTh>
              <ErpTableTh className="w-[24%]">Proprietário</ErpTableTh>
              <ErpTableTh className="w-[12%]">Áreas (T / C)</ErpTableTh>
              <ErpTableTh className="w-[6%]">Status</ErpTableTh>
              <ErpTableTh className="w-[8%] text-right">Ações</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  Nenhum imóvel encontrado.
                </td>
              </tr>
            ) : (
              paged.map((imovel) => (
                <ErpTableTr key={imovel.id}>
                  <ErpTableTd className="font-semibold text-slate-900 dark:text-slate-100">
                    {editingId === imovel.id ? (
                      <input
                        type="text"
                        value={editForm.municipalInsc || ""}
                        onChange={(e) => setEditForm({ ...editForm, municipalInsc: e.target.value })}
                        className="h-6 w-full rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                      />
                    ) : (
                      <Link href={`/tributacao/imoveis/${imovel.id}`} className="text-emerald-700 hover:underline">{imovel.municipalInsc || "Abrir ficha"}</Link>
                    )}
                  </ErpTableTd>
                  <ErpTableTd>
                    {editingId === imovel.id ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={editForm.streetName || ""}
                          onChange={(e) => setEditForm({ ...editForm, streetName: e.target.value })}
                          className="h-6 w-3/4 rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                          placeholder="Logradouro"
                        />
                        <input
                          type="text"
                          value={editForm.number || ""}
                          onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                          className="h-6 w-1/4 rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                          placeholder="Nº"
                        />
                      </div>
                    ) : (
                      imovel.streetName ? `${imovel.streetName}, ${imovel.number || "S/N"}` : "Endereço não informado"
                    )}
                  </ErpTableTd>
                  <ErpTableTd>
                    {imovel.taxpayer?.company?.corporateName || imovel.taxpayer?.person?.fullName || "Não Informado"}
                  </ErpTableTd>
                  <ErpTableTd>
                    {editingId === imovel.id ? (
                      <div className="flex items-center gap-1 text-[10px]">
                        <span>T:</span>
                        <input
                          type="number"
                          value={editForm.landArea || 0}
                          onChange={(e) => setEditForm({ ...editForm, landArea: Number(e.target.value) })}
                          className="h-6 w-12 rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                        />
                        <span>C:</span>
                        <input
                          type="number"
                          value={editForm.builtArea || 0}
                          onChange={(e) => setEditForm({ ...editForm, builtArea: Number(e.target.value) })}
                          className="h-6 w-12 rounded border border-slate-200 px-1 text-[11px] outline-none focus:border-amber-500"
                        />
                      </div>
                    ) : (
                      <span className="tabular-nums">
                        T: {imovel.landArea || 0}m² | C: {imovel.builtArea || 0}m²
                      </span>
                    )}
                  </ErpTableTd>
                  <ErpTableTd>
                    <ErpStatusBadge variant={statusVariant(imovel.status)}>{imovel.status}</ErpStatusBadge>
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    {editingId === imovel.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={handleSaveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Salvar">
                          <CheckCircle className="size-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded" title="Cancelar">
                          <XCircle className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEditClick(imovel)} className="p-1 text-slate-400 hover:text-sky-600 rounded" title="Editar">
                          <Pencil className="size-3.5" />
                        </button>
                        {imovel.status === "Regular" ? (
                          <button onClick={() => handleDeactivate(imovel.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded" title="Inativar">
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => handleActivate(imovel.id)} className="p-1 text-slate-400 hover:text-emerald-600 rounded" title="Reativar">
                            <RefreshCw className="size-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </ErpTableTd>
                </ErpTableTr>
              ))
            )}
          </tbody>
        </ErpTableContainer>
      </ErpListFrame>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-bold text-slate-800">Novo Imóvel Fiscal</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Titular fiscal</label>
                <select required value={createForm.taxpayerId} onChange={(e) => setCreateForm({...createForm, taxpayerId: e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Selecione</option>{taxpayers.map((taxpayer) => <option key={taxpayer.id} value={taxpayer.id}>{taxpayer.name}</option>)}</select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inscrição Imobiliária</label>
                <input
                  type="text"
                  required
                  value={createForm.municipalInsc}
                  onChange={(e) => setCreateForm({...createForm, municipalInsc: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-slate-700">Matrícula<input value={createForm.registration} onChange={(e) => setCreateForm({...createForm, registration: e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <label className="block text-xs font-semibold text-slate-700">Zona<select value={createForm.fiscalZone} onChange={(e) => setCreateForm({...createForm, fiscalZone: e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Urbana</option><option>Rural</option></select></label>
                <label className="block text-xs font-semibold text-slate-700">Tipo<select value={createForm.propertyType} onChange={(e) => setCreateForm({...createForm, propertyType: e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Terreno</option><option>Casa</option><option>Apartamento</option><option>Galpão</option><option>Rural</option></select></label>
                <label className="block text-xs font-semibold text-slate-700">Uso<select value={createForm.propertyUse} onChange={(e) => setCreateForm({...createForm, propertyUse: e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Residencial</option><option>Comercial</option><option>Misto</option><option>Rural</option></select></label>
                <label className="block text-xs font-semibold text-slate-700">Quadra<input value={createForm.block} onChange={(e) => setCreateForm({...createForm, block: e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <label className="block text-xs font-semibold text-slate-700">Lote<input value={createForm.lot} onChange={(e) => setCreateForm({...createForm, lot: e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Logradouro</label>
                  <input
                    type="text"
                    required
                    value={createForm.streetName}
                    onChange={(e) => setCreateForm({...createForm, streetName: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nº</label>
                  <input
                    type="text"
                    required
                    value={createForm.number}
                    onChange={(e) => setCreateForm({...createForm, number: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Área Terreno (m²)</label>
                  <input
                    type="number"
                    value={createForm.landArea}
                    onChange={(e) => setCreateForm({...createForm, landArea: Number(e.target.value)})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Área Construída (m²)</label>
                  <input
                    type="number"
                    value={createForm.builtArea}
                    onChange={(e) => setCreateForm({...createForm, builtArea: Number(e.target.value)})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-600 transition-colors shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
