"use client";

import { useState } from "react";
import { Search, Plus, FileBadge, Trash2, XCircle } from "lucide-react";
import { createCertificate, cancelCertificate } from "./actions";
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

type Certificate = {
  id: string;
  certificateType: string;
  createdAt: Date;
  validUntil: Date;
  authCode: string;
  status: string;
  taxpayer: {
    id: string;
    person: { fullName: string; cpf: string } | null;
    company: { corporateName: string; cnpj: string } | null;
  };
};

type Taxpayer = {
  id: string;
  name: string;
};

function certVariant(status: string): ErpStatusVariant {
  if (status === "Ativa") return "success";
  if (status === "Vencida") return "warning";
  if (status === "Revogada" || status === "Cancelada") return "danger";
  return "neutral";
}

export default function CertidoesClient({
  certificates,
  taxpayers
}: {
  certificates: Certificate[];
  taxpayers: Taxpayer[];
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [createForm, setCreateForm] = useState({
    certificateType: "Negativa",
    taxpayerId: taxpayers[0]?.id || "",
    validUntil: ""
  });

  const filtered = certificates.filter((cert) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const code = cert.authCode.toLowerCase();
    const type = cert.certificateType.toLowerCase();
    const name = (cert.taxpayer?.company?.corporateName || cert.taxpayer?.person?.fullName || "").toLowerCase();
    return code.includes(term) || type.includes(term) || name.includes(term);
  });
  const pageSize = 20;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleCancel = async (id: string) => {
    if (confirm("Deseja revogar esta certidão?")) {
      await cancelCertificate(id);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.taxpayerId) {
      alert("Selecione um contribuinte válido.");
      return;
    }
    if (!createForm.validUntil) {
      alert("Informe a data de validade.");
      return;
    }
    try {
      await createCertificate(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        certificateType: "Negativa",
        taxpayerId: taxpayers[0]?.id || "",
        validUntil: ""
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar rascunho interno.");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-2.5 overflow-hidden">
      <ErpPageTitle
        title="Certidões e Situação Fiscal"
        icon={<FileBadge className="size-4 text-sky-600" />}
        action={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600"
          >
            <Plus className="size-3.5" />
            Nova Certidão
          </button>
        }
      />

      <ErpListFrame
        pagination={<ErpPagination page={page} total={filtered.length} pageSize={pageSize} previousHref="#" nextHref="#" label="certidões" onPageChange={setPage} />}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
              <span className="sr-only">Buscar certidão</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Buscar por código de autenticação, tipo ou contribuinte"
                className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          </div>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[18%]">Cód. Autenticação</ErpTableTh>
              <ErpTableTh className="w-[32%]">Contribuinte</ErpTableTh>
              <ErpTableTh className="w-[20%]">Tipo de Certidão</ErpTableTh>
              <ErpTableTh className="w-[12%]">Emissão</ErpTableTh>
              <ErpTableTh className="w-[12%]">Validade</ErpTableTh>
              <ErpTableTh className="w-[8%]">Status</ErpTableTh>
              <ErpTableTh className="w-[6%] text-right">Ação</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                  Nenhum registro de certidão encontrado.
                </td>
              </tr>
            ) : (
              paged.map((cert) => (
                <ErpTableTr key={cert.id}>
                  <ErpTableTd className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                    {cert.authCode}
                  </ErpTableTd>
                  <ErpTableTd>
                    {cert.taxpayer?.company?.corporateName || cert.taxpayer?.person?.fullName || "Não Informado"}
                  </ErpTableTd>
                  <ErpTableTd>
                    {cert.certificateType}
                  </ErpTableTd>
                  <ErpTableTd>
                    {new Date(cert.createdAt).toLocaleDateString("pt-BR")}
                  </ErpTableTd>
                  <ErpTableTd>
                    {new Date(cert.validUntil).toLocaleDateString("pt-BR")}
                  </ErpTableTd>
                  <ErpTableTd>
                    <ErpStatusBadge variant={certVariant(cert.status)}>{cert.status}</ErpStatusBadge>
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    {cert.status === "Ativa" && (
                      <button
                        onClick={() => handleCancel(cert.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Revogar Certidão"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
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
              <h2 className="text-base font-bold text-slate-800">Registrar Certidão</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contribuinte</label>
                <select
                  required
                  value={createForm.taxpayerId}
                  onChange={(e) => setCreateForm({...createForm, taxpayerId: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                >
                  <option value="">Selecione um contribuinte...</option>
                  {taxpayers.map(tp => (
                    <option key={tp.id} value={tp.id}>{tp.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Certidão</label>
                  <select
                    value={createForm.certificateType}
                    onChange={(e) => setCreateForm({...createForm, certificateType: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  >
                    <option value="Negativa">Negativa</option>
                    <option value="Positiva com Efeito de Negativa">Positiva com Efeito</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Validade</label>
                  <input
                    type="date"
                    required
                    value={createForm.validUntil}
                    onChange={(e) => setCreateForm({...createForm, validUntil: e.target.value})}
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
