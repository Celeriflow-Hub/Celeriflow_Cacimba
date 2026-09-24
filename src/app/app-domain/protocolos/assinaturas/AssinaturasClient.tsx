"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileSignature, X } from "lucide-react";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { signProcessDocumentInternally } from "../actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

type PendingSignature = {
  signatureId: string;
  id: string;
  requestedAt: Date | string;
  process: { id: string; protocolNumber: string };
  title: string;
  documentType: string;
};

function signatureListHref(page = 1) {
  return page > 1 ? "/protocolos/assinaturas?page=" + page : "/protocolos/assinaturas";
}

export default function AssinaturasClient({
  initialDocuments,
  total,
  page,
  pageSize,
}: {
  initialDocuments: PendingSignature[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedDocument, setSelectedDocument] = useState<PendingSignature | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const firstVisible = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, total);

  function close() {
    if (isPending) return;
    setSelectedDocument(null);
    setPassword("");
    setError(null);
  }

  function sign() {
    if (!selectedDocument || !password) return;
    setError(null);
    startTransition(async () => {
      try {
        const user = auth.currentUser;
        if (!user?.email) throw new Error("Sua sessao Firebase nao esta disponivel. Entre novamente no sistema.");
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
        const result = await signProcessDocumentInternally(selectedDocument.id, await user.getIdToken(true));
        if (result.error) {
          setError(result.error);
          return;
        }
        setDocuments((current) => current.filter((document) => document.signatureId !== selectedDocument.signatureId));
        close();
        router.refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Nao foi possivel confirmar sua senha.");
      }
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 p-2 lg:p-3">
      <ErpPageTitle
        title="Assinaturas pendentes"
        description="Manifestações internas vinculadas aos processos no seu escopo."
        icon={<FileSignature className="size-5 shrink-0 text-emerald-700" />}
      />

      <ErpListFrame
        summary={(
          <p className="min-h-5 text-[11px] text-slate-600">
            <strong className="text-slate-900">{total}</strong> documento(s) aguardando sua assinatura
            {total ? " · exibindo " + firstVisible + "–" + lastVisible : ""}.
          </p>
        )}
        pagination={(
          <ErpPagination
            page={page}
            total={total}
            pageSize={pageSize}
            previousHref={signatureListHref(page - 1)}
            nextHref={signatureListHref(page + 1)}
            label="assinaturas pendentes"
          />
        )}
      >
        {documents.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center">
            <div className="mb-2 flex size-9 items-center justify-center rounded-full bg-slate-100">
              <CheckCircle2 className="size-5 text-slate-400" />
            </div>
            <h2 className="text-sm font-bold text-slate-700">Tudo em dia</h2>
            <p className="mt-1 max-w-md text-xs text-slate-500">Você não possui documentos aguardando assinatura no momento.</p>
          </div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <table className="h-full w-full table-fixed border-collapse text-left text-[11px] leading-3">
                <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
                  <tr>
                    <th className="w-[34%] px-2 py-1">Documento / processo</th>
                    <th className="px-2 py-1">Tipo de documento</th>
                    <th className="w-[16%] px-2 py-1">Solicitado em</th>
                    <th className="w-[14%] px-2 py-1">Situação</th>
                    <th className="w-[11%] px-2 py-1 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((processDocument) => (
                    <tr key={processDocument.signatureId} className="h-5 hover:bg-slate-50">
                      <td className="px-2 py-0.5">
                        <span className="block truncate font-semibold text-slate-800" title={processDocument.title}>{processDocument.title}</span>
                        <span className="block truncate text-[10px] leading-3 text-slate-500" title={processDocument.process.protocolNumber}>{processDocument.process.protocolNumber}</span>
                      </td>
                      <td className="truncate px-2 py-0.5 text-slate-700" title={processDocument.documentType || "Arquivo"}>{processDocument.documentType || "Arquivo"}</td>
                      <td className="whitespace-nowrap px-2 py-0.5 text-slate-600">{new Date(processDocument.requestedAt).toLocaleDateString("pt-BR")}</td>
                      <td className="px-2 py-0.5">
                        <span className="inline-flex max-w-full truncate rounded bg-amber-100 px-1.5 py-0 text-[10px] font-semibold leading-3 text-amber-700">Pendente</span>
                      </td>
                      <td className="px-2 py-0.5 text-right">
                        <button onClick={() => setSelectedDocument(processDocument)} disabled={isPending} className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50">Assinar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto md:hidden">
              {documents.map((processDocument) => (
                <article key={processDocument.signatureId} className="space-y-1.5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900">{processDocument.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{processDocument.process.protocolNumber}</p>
                    </div>
                    <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Pendente</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate text-slate-600">{processDocument.documentType || "Arquivo"} · {new Date(processDocument.requestedAt).toLocaleDateString("pt-BR")}</span>
                    <button onClick={() => setSelectedDocument(processDocument)} disabled={isPending} className="shrink-0 font-semibold text-emerald-700 disabled:opacity-50">Assinar</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </ErpListFrame>
      {selectedDocument && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-lg rounded-xl bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-200 p-5"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><FileSignature className="h-5 w-5 text-emerald-600" />Assinar documento</h2><button onClick={close} disabled={isPending} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div><div className="space-y-4 p-5 text-sm text-slate-700"><p><strong>{selectedDocument.title}</strong> esta vinculado a uma versao bloqueada com hash SHA-256.</p><label className="block text-sm font-medium text-slate-700">Senha da conta<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>{error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}</div><div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5"><button onClick={close} disabled={isPending} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancelar</button><button onClick={sign} disabled={!password || isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isPending ? "Registrando..." : "Registrar assinatura"}</button></div></div></div>}
    </div>
  );
}
