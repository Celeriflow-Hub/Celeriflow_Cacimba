"use client";

import { useState, useTransition } from "react";
import { CheckCircle, File, FileSignature, X } from "lucide-react";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { signDocumentInternally } from "./actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Documento = {
  id: string;
  title: string;
  documentType: string;
  createdAt: Date | string;
  status: string;
};

export default function AssinaturasClient({ initialDocuments }: { initialDocuments: Documento[] }) {
  const [documents, setDocuments] = useState<Documento[]>(initialDocuments);
  const [selectedDocument, setSelectedDocument] = useState<Documento | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredDocuments = documents.filter((doc) => [doc.title, doc.documentType, doc.status].some((value) => value.toLowerCase().includes(normalizedSearch)));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE)));
  const pageDocuments = filteredDocuments.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  function closeConfirmation() {
    if (isPending) return;
    setSelectedDocument(null);
    setPassword("");
    setError(null);
  }

  function handleSignature() {
    if (!selectedDocument || !password) return;
    setError(null);
    startTransition(async () => {
      try {
        const user = auth.currentUser;
        if (!user?.email) throw new Error("Sua sessao Firebase nao esta disponivel. Entre novamente no sistema.");
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
        const token = await user.getIdToken(true);
        const result = await signDocumentInternally(selectedDocument.id, token);
        if (result.error) {
          setError(result.error);
          return;
        }
        setDocuments((current) => current.filter((document) => document.id !== selectedDocument.id));
        closeConfirmation();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Nao foi possivel confirmar sua senha.");
      }
    });
  };

  return (
    <ErpListFrame toolbar={<input type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="Buscar documentos pendentes" aria-label="Buscar documentos pendentes" className="h-7 w-full max-w-md rounded border border-slate-300 px-2.5 text-xs outline-none focus:border-indigo-600" />} pagination={<ErpPagination page={activePage} total={filteredDocuments.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="assinaturas" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase text-slate-600">
          <tr>
            <th className="px-6 py-3">Documento</th>
            <th className="px-6 py-3">Tipo</th>
            <th className="px-6 py-3">Data de Envio</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pageDocuments.map((doc) => (
            <tr key={doc.id} className="group h-[38px] transition-colors hover:bg-slate-50">
              <td className="max-w-0 truncate px-2.5 py-1.5 font-bold text-slate-800" title={doc.title}>
                <File className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                {doc.title}
              </td>
              <td className="px-6 py-4 text-slate-600">
                {doc.documentType || "Arquivo"}
              </td>
              <td className="px-6 py-4 text-slate-500">
                {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-700">
                  Pendente
                </span>
              </td>
              <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedDocument(doc)}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Assinar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><FileSignature className="h-5 w-5 text-indigo-600" /> Assinar documento</h2>
              <button onClick={closeConfirmation} disabled={isPending} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5 text-sm text-slate-700">
              <p><strong>{selectedDocument.title}</strong> já está vinculado a uma versão bloqueada com hash SHA-256.</p>
              <p className="rounded-lg bg-indigo-50 p-3 text-indigo-800">Confirme sua senha Firebase para concluir sua assinatura interna. A versão será concluída somente depois de todos os signatários obrigatórios.</p>
              <label className="block text-sm font-medium text-slate-700">Senha da conta
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </label>
              {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5">
              <button onClick={closeConfirmation} disabled={isPending} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancelar</button>
              <button onClick={handleSignature} disabled={!password || isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isPending ? "Registrando..." : "Registrar manifestação"}</button>
            </div>
          </div>
        </div>
      )}
    </ErpListFrame>
  );
}
