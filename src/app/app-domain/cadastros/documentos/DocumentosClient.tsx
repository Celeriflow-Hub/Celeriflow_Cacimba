"use client";

import { useState } from "react";
import { File, FileText, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { updateDocument, deleteDocument } from "../actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Document = {
  id: string;
  title: string;
  documentType: string;
  validUntil: Date | null;
  fileUrl: string | null;
  person: { fullName: string } | null;
  company: { corporateName: string } | null;
};

export default function DocumentosClient({ documents }: { documents: Document[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Document>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredDocuments = documents.filter((doc) => [doc.title, doc.documentType, doc.person?.fullName, doc.company?.corporateName].some((value) => value?.toLowerCase().includes(normalizedSearch)));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE)));
  const pageDocuments = filteredDocuments.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleEditClick = (doc: Document) => {
    setEditingId(doc.id);
    setEditForm({
      title: doc.title,
      documentType: doc.documentType,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (confirm("Deseja salvar as alterações?")) {
      try {
        await updateDocument(editingId, {
          title: editForm.title,
          documentType: editForm.documentType,
        });
        setEditingId(null);
      } catch (e) {
        console.error(e);
        alert("Erro ao salvar");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este documento?")) {
      await deleteDocument(id);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-2 flex size-9 items-center justify-center rounded bg-slate-100">
          <File className="size-5 text-slate-400" />
        </div>
        <h2 className="text-sm font-bold text-slate-700">Nenhum documento encontrado</h2>
        <p className="mt-0.5 text-xs text-slate-500">Comece anexando o primeiro documento à base de dados.</p>
      </div>
    );
  }

  return (
    <ErpListFrame toolbar={<div className="flex items-center gap-2"><input type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="Buscar por tipo, número ou vínculo" aria-label="Buscar documentos" className="h-7 w-full max-w-md rounded border border-slate-300 px-2.5 text-xs outline-none focus:border-rose-600" /></div>} pagination={<ErpPagination page={activePage} total={filteredDocuments.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="documentos" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
          <tr>
            <th className="h-8 px-3">Título do Documento</th>
            <th className="h-8 px-3">Tipo</th>
            <th className="h-8 px-3">Vínculo</th>
            <th className="h-8 px-3">Validade</th>
            <th className="h-8 px-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pageDocuments.map((doc) => {
            let link = '-';
            if (doc.person) link = doc.person.fullName;
            else if (doc.company) link = doc.company.corporateName;

            return (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                <td className="max-w-0 truncate px-3 py-1.5 font-medium text-slate-800" title={doc.title}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    {editingId === doc.id ? (
                      <input
                        type="text"
                        value={editForm.title || ""}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full border rounded px-2 py-1 placeholder-slate-400 font-normal"
                        placeholder="Título"
                      />
                    ) : (
                      doc.title
                    )}
                  </div>
                </td>
                <td className="max-w-0 truncate px-3 py-1.5 text-slate-600" title={doc.documentType}>
                  {editingId === doc.id ? (
                    <input
                      type="text"
                      value={editForm.documentType || ""}
                      onChange={(e) => setEditForm({ ...editForm, documentType: e.target.value })}
                      className="w-full border rounded px-2 py-1 placeholder-slate-400"
                      placeholder="Tipo"
                    />
                  ) : (
                    doc.documentType
                  )}
                </td>
                <td className="max-w-0 truncate px-3 py-1.5 text-slate-600" title={link}>
                  <span className="block truncate rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {link}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {doc.validUntil ? new Date(doc.validUntil).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td className="px-3 py-2 text-right">
                  {editingId === doc.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleSaveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Salvar">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded" title="Cancelar">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      {doc.fileUrl && (
                        <a href={`/api/download?url=${encodeURIComponent(doc.fileUrl)}`} target="_blank" rel="noreferrer" className="text-rose-600 hover:text-rose-800 text-sm font-semibold mr-2">Ver Anexo</a>
                      )}
                      <button onClick={() => handleEditClick(doc)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </ErpListFrame>
  );
}
