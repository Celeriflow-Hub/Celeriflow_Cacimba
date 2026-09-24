"use client";

import { Fragment, type FormEvent, useState, useTransition } from "react";
import { CheckCircle, ExternalLink, FileText, Pencil, RefreshCw, Trash2, Truck, XCircle } from "lucide-react";
import { activateSupplier, deactivateSupplier, updateSupplier } from "../actions";
import { supplierRegularityLinks, unconfiguredSupplierRegularityLinks } from "./supplier-regularity";
import type { SupplierListItem } from "./supplier-types";
import { certificationStatus, dateInputValue, formatCnpj, formatCpf } from "./supplier-utils";

type SupplierEditForm = {
  category: string;
  businessBranch: string;
  certificationsValidUntil: string;
  bankData: string;
  notes: string;
  primaryCnae: string;
  secondaryCnaes: string;
};

const editControlClass = "min-h-10 w-full rounded border border-slate-300 bg-white px-2 text-base text-slate-700 outline-none focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-600/15 sm:h-8 sm:min-h-0 sm:text-xs";

function companyTypeLabel(companyType: string | null) {
  if (companyType === "ME") return "ME";
  if (companyType === "EPP") return "EPP";
  if (companyType === "MEI") return "MEI";
  return companyType || "Não informado";
}

function certificationClass(code: ReturnType<typeof certificationStatus>["code"]) {
  if (code === "VENCIDA") return "border-rose-200 bg-rose-50 text-rose-700";
  if (code === "VENCE_EM_BREVE") return "border-amber-200 bg-amber-50 text-amber-800";
  if (code === "VIGENTE") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function supplierStatusClass(status: string) {
  if (status === "Ativo") return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
  if (status === "Suspenso") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function identityFor(supplier: SupplierListItem) {
  if (supplier.person) {
    return { type: "PF", name: supplier.person.fullName, document: formatCpf(supplier.person.cpf), documents: supplier.person.documents };
  }
  if (supplier.company) {
    return { type: "PJ", name: supplier.company.corporateName, document: formatCnpj(supplier.company.cnpj), documents: supplier.company.documents };
  }
  return { type: "Não informado", name: "Identidade não informada", document: "", documents: [] };
}

export default function FornecedoresClient({
  suppliers,
  canUpdate,
  hasFilters,
  referenceDate,
}: {
  suppliers: SupplierListItem[];
  canUpdate: boolean;
  hasFilters: boolean;
  referenceDate: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SupplierEditForm | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEditClick(supplier: SupplierListItem) {
    setActionError(null);
    setEditingId(supplier.id);
    setEditForm({
      category: supplier.category ?? "",
      businessBranch: supplier.businessBranch ?? "",
      certificationsValidUntil: dateInputValue(supplier.certificationsValidUntil),
      bankData: supplier.bankData ?? "",
      notes: supplier.notes ?? "",
      primaryCnae: supplier.company?.primaryCnae ?? "",
      secondaryCnaes: supplier.company?.secondaryCnaes ?? "",
    });
  }

  function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !editForm) return;
    const supplier = suppliers.find((item) => item.id === editingId);
    if (!supplier) return;

    startTransition(async () => {
      try {
        const result = await updateSupplier(editingId, {
          category: editForm.category,
          businessBranch: editForm.businessBranch,
          certificationsValidUntil: editForm.certificationsValidUntil,
          bankData: editForm.bankData,
          notes: editForm.notes,
          ...(supplier.company ? { primaryCnae: editForm.primaryCnae, secondaryCnaes: editForm.secondaryCnaes } : {}),
        });
        if (result.error) {
          setActionError(result.error);
          return;
        }
        setEditingId(null);
        setEditForm(null);
      } catch {
        setActionError("Não foi possível atualizar o fornecedor.");
      }
    });
  }

  function handleStatusChange(id: string, action: "activate" | "deactivate") {
    const message = action === "activate" ? "Deseja realmente reativar este registro?" : "Deseja realmente inativar este registro?";
    if (!confirm(message)) return;

    setActionError(null);
    startTransition(async () => {
      try {
        const result = action === "activate" ? await activateSupplier(id) : await deactivateSupplier(id);
        if (result.error) setActionError(result.error);
      } catch {
        setActionError("Não foi possível alterar a situação do fornecedor.");
      }
    });
  }

  if (suppliers.length === 0) {
    return (
      <div className="flex min-h-full items-center justify-center p-8 text-center">
        <div>
          <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded bg-slate-100">
            <Truck className="size-5 text-slate-400" />
          </div>
          <h2 className="text-sm font-bold text-slate-700">Nenhum registro encontrado</h2>
          <p className="mt-0.5 text-xs text-slate-500">{hasFilters ? "Nenhum fornecedor atende aos filtros informados." : "Comece adicionando o primeiro fornecedor na base de dados."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" aria-busy={isPending}>
      {actionError && <p role="alert" className="m-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{actionError}</p>}
      <table className="w-full table-fixed border-collapse text-left text-[11px] leading-tight">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-[10px] font-bold uppercase tracking-wider text-slate-600 backdrop-blur-xs">
          <tr>
            <th scope="col" className="w-[48%] px-2 py-2 md:w-[31%] md:px-2.5">Fornecedor</th>
            <th scope="col" className="hidden w-[24%] px-2.5 py-2 md:table-cell">ME/EPP e CNAE</th>
            <th scope="col" className="hidden w-[10%] px-2.5 py-2 md:table-cell">Situação</th>
            <th scope="col" className="w-[36%] px-2 py-2 md:w-[26%] md:px-2.5">Certidões e evidências</th>
            <th scope="col" className="w-[3.25rem] px-1 py-2 text-right md:w-[9%] md:px-2.5">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {suppliers.map((supplier) => {
            const identity = identityFor(supplier);
            const certification = certificationStatus(supplier.certificationsValidUntil, referenceDate);
            const isEditing = editingId === supplier.id;

            return (
              <Fragment key={supplier.id}>
                <tr className="h-[46px] align-top transition-colors hover:bg-slate-50/80">
                  <td className="max-w-0 px-2 py-1.5 md:px-2.5">
                    <p className="truncate font-semibold text-slate-800" title={identity.name}>{identity.name}</p>
                    <p className="truncate text-[10px] text-slate-500" title={identity.document}><span className="font-semibold text-slate-600">{identity.type}</span> · {identity.document || "Documento não informado"}</p>
                    <p className="hidden truncate text-[10px] text-slate-500 md:block" title={[supplier.category, supplier.businessBranch].filter(Boolean).join(" · ")}>{supplier.category || supplier.businessBranch ? [supplier.category, supplier.businessBranch].filter(Boolean).join(" · ") : "Sem categoria informada"}</p>
                    <div className="mt-1 flex flex-wrap gap-1 md:hidden">
                      {supplier.company?.companyType && <span className="inline-flex rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">{companyTypeLabel(supplier.company.companyType)}</span>}
                      <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold ${supplierStatusClass(supplier.status)}`}>{supplier.status}</span>
                    </div>
                  </td>
                  <td className="hidden max-w-0 px-2.5 py-1.5 md:table-cell">
                    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold ${supplier.company && ["ME", "EPP"].includes(supplier.company.companyType ?? "") ? "border-sky-200 bg-sky-50 text-sky-800" : "border-slate-200 bg-slate-100 text-slate-600"}`}>{supplier.company ? companyTypeLabel(supplier.company.companyType) : "Não se aplica a PF"}</span>
                    <p className="mt-1 truncate text-[10px] text-slate-600" title={supplier.company?.primaryCnae ?? ""}>{supplier.company?.primaryCnae ? `CNAE: ${supplier.company.primaryCnae}` : "CNAE não informado"}</p>
                  </td>
                  <td className="hidden px-2.5 py-1.5 md:table-cell">
                    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold ${supplierStatusClass(supplier.status)}`}>{supplier.status}</span>
                  </td>
                  <td className="max-w-0 px-2 py-1.5 md:px-2.5">
                    <div className="flex flex-col items-start gap-1">
                      <span title={certification.label} className={`inline-flex max-w-full truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold ${certificationClass(certification.code)}`}>{certification.label}</span>
                      <button type="button" onClick={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)} aria-expanded={expandedId === supplier.id} className="max-w-full truncate rounded text-left text-[10px] font-semibold text-fuchsia-700 outline-none hover:text-fuchsia-800 focus-visible:ring-2 focus-visible:ring-fuchsia-600/30">
                        {identity.documents.length} evidência{identity.documents.length === 1 ? "" : "s"} e consultas
                      </button>
                    </div>
                  </td>
                  <td className="px-1.5 py-1.5 text-right md:px-2.5">
                    {canUpdate ? (
                      <div className="flex flex-col items-end gap-0.5 md:flex-row md:justify-end md:gap-1">
                        <button type="button" disabled={isPending} onClick={() => handleEditClick(supplier)} aria-label={`Editar ${identity.name}`} className="inline-flex size-9 items-center justify-center rounded text-slate-500 outline-none hover:bg-fuchsia-50 hover:text-fuchsia-700 focus-visible:ring-2 focus-visible:ring-fuchsia-600 disabled:opacity-50 md:size-7" title="Editar fornecedor">
                          <Pencil className="size-3.5" />
                        </button>
                        {supplier.status === "Ativo" ? (
                          <button type="button" disabled={isPending} onClick={() => handleStatusChange(supplier.id, "deactivate")} aria-label={`Inativar ${identity.name}`} className="inline-flex size-9 items-center justify-center rounded text-slate-500 outline-none hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-rose-600 disabled:opacity-50 md:size-7" title="Inativar fornecedor">
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : (
                          <button type="button" disabled={isPending} onClick={() => handleStatusChange(supplier.id, "activate")} aria-label={`Reativar ${identity.name}`} className="inline-flex size-9 items-center justify-center rounded text-slate-500 outline-none hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50 md:size-7" title="Reativar fornecedor">
                            <RefreshCw className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ) : <span className="text-[10px] text-slate-400">Leitura</span>}
                  </td>
                </tr>
                {expandedId === supplier.id && (
                  <tr className="bg-slate-50/70">
                    <td colSpan={5} className="px-2 py-2 md:px-2.5">
                      <div className="grid gap-3 rounded border border-slate-200 bg-white p-2.5 text-[11px] text-slate-600 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.25fr)]">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-slate-700">Situação da habilitação</p>
                          <p className="text-slate-500">A validade acima é a informada no cadastro do fornecedor. Ela não declara regularidade fiscal.</p>
                          {supplier.company?.primaryCnae && <p><span className="font-semibold text-slate-700">CNAE principal:</span> {supplier.company.primaryCnae}</p>}
                          {supplier.company?.secondaryCnaes && <p><span className="font-semibold text-slate-700">CNAEs secundários:</span> {supplier.company.secondaryCnaes}</p>}
                        </div>
                        <div>
                          <p className="mb-1 font-semibold text-slate-700">Evidências cadastradas</p>
                          {identity.documents.length > 0 ? (
                            <ul className="space-y-1">
                              {identity.documents.map((document, index) => {
                                const evidenceStatus = certificationStatus(document.validUntil, referenceDate);
                                return <li key={`${document.title}-${index}`} className="rounded bg-slate-50 px-2 py-1"><FileText className="mr-1 inline size-3 text-slate-400" />{document.title} ({document.documentType}; {document.status}; {evidenceStatus.label})</li>;
                              })}
                            </ul>
                          ) : <p>Nenhum documento da identidade vinculada foi encontrado.</p>}
                        </div>
                        <div>
                          <p className="mb-1 font-semibold text-slate-700">Consultas externas de regularidade</p>
                          <p className="mb-2 text-slate-500">Abrem os portais externos. Nenhuma consulta ou certidão é emitida pelo CeleriFlow.</p>
                          <div className="flex flex-wrap gap-1">
                            {supplierRegularityLinks.map((link) => (
                              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" title={link.description} className="inline-flex min-h-8 items-center gap-1 rounded border border-slate-300 bg-white px-1.5 font-semibold text-fuchsia-700 hover:bg-fuchsia-50 sm:min-h-7">
                                {link.label}<ExternalLink className="size-3" />
                              </a>
                            ))}
                            {unconfiguredSupplierRegularityLinks.map((label) => <span key={label} title="O destino depende da jurisdição e não está configurado nesta base." className="inline-flex min-h-8 items-center rounded border border-dashed border-slate-300 px-1.5 text-slate-500 sm:min-h-7">{label}: não configurado</span>)}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {isEditing && editForm && (
                  <tr className="bg-fuchsia-50/50">
                    <td colSpan={5} className="px-2 py-2 md:px-2.5">
                      <form onSubmit={handleSaveEdit} className="grid grid-cols-1 gap-3 rounded border border-fuchsia-200 bg-white p-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor={`category-${supplier.id}`} className="mb-1 block text-xs font-semibold text-slate-700">Categoria</label>
                          <select id={`category-${supplier.id}`} value={editForm.category} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })} className={editControlClass}>
                            <option value="">Selecione...</option>
                            <option value="Materiais">Materiais Diversos</option>
                            <option value="Serviços">Prestação de Serviços</option>
                            <option value="Obras">Obras e Engenharia</option>
                            <option value="Equipamentos">Equipamentos</option>
                            <option value="Tecnologia">Tecnologia da Informação</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`branch-${supplier.id}`} className="mb-1 block text-xs font-semibold text-slate-700">Ramo de atividade</label>
                          <input id={`branch-${supplier.id}`} value={editForm.businessBranch} onChange={(event) => setEditForm({ ...editForm, businessBranch: event.target.value })} className={editControlClass} />
                        </div>
                        {supplier.company && <>
                          <div>
                            <label htmlFor={`primary-cnae-${supplier.id}`} className="mb-1 block text-xs font-semibold text-slate-700">CNAE principal</label>
                            <input id={`primary-cnae-${supplier.id}`} value={editForm.primaryCnae} onChange={(event) => setEditForm({ ...editForm, primaryCnae: event.target.value })} placeholder="Código e descrição" className={editControlClass} />
                          </div>
                          <div>
                            <label htmlFor={`secondary-cnaes-${supplier.id}`} className="mb-1 block text-xs font-semibold text-slate-700">CNAEs secundários</label>
                            <input id={`secondary-cnaes-${supplier.id}`} value={editForm.secondaryCnaes} onChange={(event) => setEditForm({ ...editForm, secondaryCnaes: event.target.value })} placeholder="Separe por ponto e vírgula" className={editControlClass} />
                          </div>
                        </>}
                        <div>
                          <label htmlFor={`validity-${supplier.id}`} className="mb-1 block text-xs font-semibold text-slate-700">Validade das certidões</label>
                          <input id={`validity-${supplier.id}`} type="date" value={editForm.certificationsValidUntil} onChange={(event) => setEditForm({ ...editForm, certificationsValidUntil: event.target.value })} className={editControlClass} />
                        </div>
                        <div>
                          <label htmlFor={`bank-${supplier.id}`} className="mb-1 block text-xs font-semibold text-slate-700">Dados bancários</label>
                          <input id={`bank-${supplier.id}`} value={editForm.bankData} onChange={(event) => setEditForm({ ...editForm, bankData: event.target.value })} className={editControlClass} />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor={`notes-${supplier.id}`} className="mb-1 block text-xs font-semibold text-slate-700">Observações</label>
                          <textarea id={`notes-${supplier.id}`} rows={2} value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} className={`${editControlClass} py-2`} />
                        </div>
                        <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
                          <button type="button" disabled={isPending} onClick={() => { setEditingId(null); setEditForm(null); }} className="inline-flex min-h-9 items-center justify-center gap-1 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:h-8 sm:min-h-0"><XCircle className="size-3.5" />Cancelar</button>
                          <button type="submit" disabled={isPending} className="inline-flex min-h-9 items-center justify-center gap-1 rounded bg-fuchsia-700 px-3 text-xs font-semibold text-white hover:bg-fuchsia-800 disabled:opacity-50 sm:h-8 sm:min-h-0"><CheckCircle className="size-3.5" />{isPending ? "Salvando" : "Salvar alterações"}</button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
