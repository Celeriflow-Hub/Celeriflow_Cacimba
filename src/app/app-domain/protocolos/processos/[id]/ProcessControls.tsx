"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, FileText, Send, X } from "lucide-react";
import { addProcessDispatch, approveGenericProcessWorkflow, archiveProcess, cancelProcessForwarding, concludeGenericProcessWorkflow, concludeProcess, forwardProcess, publishProcessNotice, receiveProcess, rejectGenericProcessWorkflow, rejectProcessForwarding, reopenProcess, requestProcessSignatures, returnGenericProcessWorkflow } from "../../actions";

type Department = { id: string; name: string };
type Mode = "dispatch" | "forward" | "document" | "signatures" | "conclude" | "archive" | "reopen" | "genericApprove" | "genericReturn" | "genericReject" | "genericConclude" | "cancelForwarding" | "rejectForwarding" | null;

export default function ProcessControls({
  processId,
  status,
  currentDepartmentId,
  canOperate,
  departments,
  genericWorkflow,
  documentClasses,
  signableDocuments,
  signers,
  canPublishPublicNotice,
  pendingMovement,
  canCancelPending,
  canRejectPending,
}: {
  processId: string;
  status: string;
  currentDepartmentId: string | null;
  canOperate: boolean;
  departments: Department[];
  genericWorkflow: { currentPosition: number; totalStages: number; stageLabel: string; status: string } | null;
  documentClasses: { id: string; label: string }[];
  signableDocuments: { id: string; title: string }[];
  signers: { id: string; nome: string; email: string }[];
  canPublishPublicNotice: boolean;
  pendingMovement: { id: string; fromDepartmentName: string | null; toDepartmentName: string } | null;
  canCancelPending: boolean;
  canRejectPending: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [destinationDepartmentId, setDestinationDepartmentId] = useState("");
  const [reason, setReason] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [dispatchType, setDispatchType] = useState("Despacho");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentType, setDocumentType] = useState("Anexo");
  const [documentClassId, setDocumentClassId] = useState("");
  const [signatureDocumentId, setSignatureDocumentId] = useState("");
  const [selectedSignerIds, setSelectedSignerIds] = useState<string[]>([]);

  const isGeneric = Boolean(genericWorkflow);
  const isTerminal = ["Arquivado", "Cancelado", "Rejeitado"].includes(status) || (isGeneric && genericWorkflow?.status !== "ACTIVE");
  const isAwaitingAccounting = status === "Aguardando Contabilidade";
  const disabled = !canOperate || isTerminal || status === "Aguardando Recebimento";

  function close() {
    if (isPending) return;
    setMode(null);
    setError(null);
  }

  function handleResult(result: { error: string | null }) {
    if (result.error) {
      setError(result.error);
      return;
    }
    setMode(null);
    setError(null);
    router.refresh();
  }

  function handleReceive() {
    setError(null);
    startTransition(async () => handleResult(await receiveProcess(processId)));
  }

  function handleForward() {
    setError(null);
    startTransition(async () => {
      handleResult(await forwardProcess({ processId, destinationDepartmentId, reason, dueAt }));
    });
  }

  function handleDispatch() {
    setError(null);
    startTransition(async () => {
      handleResult(await addProcessDispatch({ processId, dispatchType, content }));
    });
  }

  function handleLifecycle() {
    setError(null);
    startTransition(async () => {
      const result = mode === "genericApprove"
        ? await approveGenericProcessWorkflow(processId, reason)
        : mode === "genericReturn"
          ? await returnGenericProcessWorkflow(processId, reason)
          : mode === "genericReject"
            ? await rejectGenericProcessWorkflow(processId, reason)
            : mode === "genericConclude"
              ? await concludeGenericProcessWorkflow(processId, reason)
        : mode === "conclude"
        ? await concludeProcess(processId, reason)
        : mode === "archive"
          ? await archiveProcess(processId, reason)
          : await reopenProcess(processId, reason);
      handleResult(result);
    });
  }

  function handlePendingMovement() {
    if (!pendingMovement) return;
    setError(null);
    startTransition(async () => {
      const result = mode === "cancelForwarding"
        ? await cancelProcessForwarding(pendingMovement.id, reason)
        : await rejectProcessForwarding(pendingMovement.id, reason);
      handleResult(result);
    });
  }

  function handleDocument() {
    if (!file) {
      setError("Selecione um arquivo.");
      return;
    }
    if (!documentTitle.trim()) {
      setError("Informe o titulo do documento.");
      return;
    }
    if (!documentClassId) {
      setError("Selecione a classe documental de assinatura interna.");
      return;
    }
    if (file.size > 10 * 1024 * 1024 || !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setError("Envie apenas PDF, JPG ou PNG de ate 10 MB.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("processId", processId);
      formData.append("title", documentTitle);
      formData.append("documentType", documentType);
      formData.append("documentClassId", documentClassId);
      const response = await fetch("/api/protocolos/upload", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Erro ao enviar o arquivo.");
        return;
      }
      setMode(null);
      router.refresh();
    });
  }

  function handleSignatures() {
    if (!signatureDocumentId) {
      setError("Selecione o documento para assinatura.");
      return;
    }
    if (!selectedSignerIds.length) {
      setError("Selecione ao menos um signatario.");
      return;
    }
    setError(null);
    startTransition(async () => handleResult(await requestProcessSignatures({
      processId,
      documentId: signatureDocumentId,
      signerUsuarioIds: selectedSignerIds,
    })));
  }

  function toggleSigner(signerId: string) {
    setSelectedSignerIds((current) => current.includes(signerId)
      ? current.filter((id) => id !== signerId)
      : [...current, signerId]);
  }

  function handlePublishPublicNotice() {
    if (!confirm("Publicar somente o aviso redigido, sem descricao, interessado ou anexos?")) return;
    setError(null);
    startTransition(async () => handleResult(await publishProcessNotice(processId)));
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status === "Aguardando Recebimento" && (
          <button disabled={!canOperate || isTerminal || isPending} onClick={handleReceive} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
            Receber Processo
          </button>
        )}
        {!isGeneric && canCancelPending && pendingMovement && <button disabled={isPending} onClick={() => setMode("cancelForwarding")} className="px-4 py-2 bg-white border border-amber-300 hover:bg-amber-50 disabled:opacity-50 text-amber-800 text-sm font-semibold rounded-lg shadow-sm transition-colors">Cancelar encaminhamento</button>}
        {!isGeneric && canRejectPending && pendingMovement && <button disabled={isPending} onClick={() => setMode("rejectForwarding")} className="px-4 py-2 bg-white border border-red-300 hover:bg-red-50 disabled:opacity-50 text-red-800 text-sm font-semibold rounded-lg shadow-sm transition-colors">Recusar recebimento</button>}
        <button disabled={disabled} onClick={() => setMode("document")} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors">
          <FileUp className="w-4 h-4" />
          Anexar Documento
        </button>
        {signableDocuments.length > 0 && <button disabled={disabled} onClick={() => setMode("signatures")} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors">
          Solicitar assinatura
        </button>}
        {canPublishPublicNotice && <button disabled={isPending} onClick={handlePublishPublicNotice} className="px-4 py-2 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
          Publicar aviso redigido
        </button>}
        <button disabled={disabled} onClick={() => setMode("dispatch")} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors">
          <FileText className="w-4 h-4" />
          Adicionar Despacho
        </button>
        {!isGeneric && <button disabled={disabled || isAwaitingAccounting} onClick={() => setMode("forward")} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors">
          <Send className="w-4 h-4" />
          Tramitar
        </button>}
        {isGeneric && genericWorkflow && status !== "Aguardando Recebimento" && !isTerminal ? <>
          {genericWorkflow.currentPosition < genericWorkflow.totalStages && <button disabled={!canOperate || isPending} onClick={() => setMode("genericApprove")} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">Aprovar e encaminhar</button>}
          {genericWorkflow.currentPosition > 1 && <button disabled={!canOperate || isPending} onClick={() => setMode("genericReturn")} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">Devolver etapa</button>}
          <button disabled={!canOperate || isPending} onClick={() => setMode("genericReject")} className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">Rejeitar</button>
          {genericWorkflow.currentPosition === genericWorkflow.totalStages && <button disabled={!canOperate || isPending} onClick={() => setMode("genericConclude")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">Concluir</button>}
        </> : null}
        {!isGeneric && (status === "Recebido" || status === "Em Analise" || status === "Reaberto") ? (
          <button disabled={!canOperate || isPending} onClick={() => setMode("conclude")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
            Concluir
          </button>
        ) : null}
        {!isGeneric && status === "Concluido" ? (
          <button disabled={!canOperate || isPending} onClick={() => setMode("archive")} className="px-4 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
            Arquivar
          </button>
        ) : null}
        {!isGeneric && status === "Arquivado" ? (
          <button disabled={!canOperate || isPending} onClick={() => setMode("reopen")} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
            Reabrir
          </button>
        ) : null}
      </div>

      {!canOperate && !canCancelPending && !canRejectPending && <p className="mt-2 text-xs text-slate-500">Ações operacionais exigem vínculo ativo com o setor atual do processo.</p>}

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                 {mode === "forward" ? "Tramitar processo" : mode === "dispatch" ? "Adicionar despacho" : mode === "document" ? "Anexar documento" : mode === "signatures" ? "Solicitar assinaturas" : mode === "genericApprove" ? "Aprovar etapa" : mode === "genericReturn" ? "Devolver etapa" : mode === "genericReject" ? "Rejeitar processo" : mode === "genericConclude" ? "Concluir processo" : mode === "conclude" ? "Concluir processo" : mode === "archive" ? "Arquivar processo" : mode === "cancelForwarding" ? "Cancelar encaminhamento" : mode === "rejectForwarding" ? "Recusar recebimento" : "Reabrir processo"}
              </h2>
              <button onClick={close} disabled={isPending} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              {mode === "forward" && (
                <>
                  <label className="block text-sm font-medium text-slate-700">Setor de destino
                    <select value={destinationDepartmentId} onChange={event => setDestinationDepartmentId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
                      <option value="">Selecione o setor</option>
                      {departments.filter(department => department.id !== currentDepartmentId).map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">Prazo da etapa
                    <input type="date" value={dueAt} onChange={event => setDueAt(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">Motivo
                    <textarea value={reason} onChange={event => setReason(event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
                  </label>
                </>
              )}
               {mode === "dispatch" && (
                <>
                   <label className="block text-sm font-medium text-slate-700">Tipo
                    <select value={dispatchType} onChange={event => setDispatchType(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
                      <option>Despacho</option><option>Parecer</option><option>Decisao</option>
                    </select>
                   </label>
                   <label className="block text-sm font-medium text-slate-700">Conteúdo
                    <textarea value={content} onChange={event => setContent(event.target.value)} rows={7} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
                  </label>
                </>
               )}
               {mode === "genericApprove" && <label className="block text-sm font-medium text-slate-700">Observação (opcional)<textarea value={reason} onChange={event => setReason(event.target.value)} rows={5} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>}
              {mode === "document" && (
                <>
                  <label className="block text-sm font-medium text-slate-700">Titulo
                    <input value={documentTitle} onChange={event => setDocumentTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
                  </label>
                   <label className="block text-sm font-medium text-slate-700">Tipo
                    <input value={documentType} onChange={event => setDocumentType(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
                   </label>
                   <label className="block text-sm font-medium text-slate-700">Classe documental
                     <select value={documentClassId} onChange={event => setDocumentClassId(event.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="">Selecione a classe</option>{documentClasses.map((documentClass) => <option key={documentClass.id} value={documentClass.id}>{documentClass.label}</option>)}</select>
                   </label>
                   <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={event => {
                    const selectedFile = event.target.files?.[0] || null;
                    setFile(selectedFile);
                    if (selectedFile && !documentTitle) setDocumentTitle(selectedFile.name);
                  }} className="block w-full text-sm text-slate-600" />
                  <p className="text-xs text-slate-500">PDF, JPG ou PNG, com até 10 MB.</p>
                 </>
               )}
               {mode === "signatures" && (
                 <>
                   <label className="block text-sm font-medium text-slate-700">Documento
                     <select value={signatureDocumentId} onChange={event => setSignatureDocumentId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="">Selecione o documento</option>{signableDocuments.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}</select>
                   </label>
                   <fieldset className="space-y-2"><legend className="text-sm font-medium text-slate-700">Signatarios com acesso a Processos</legend>{signers.map((signer) => <label key={signer.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm"><input type="checkbox" checked={selectedSignerIds.includes(signer.id)} onChange={() => toggleSigner(signer.id)} /> <span>{signer.nome}<span className="block text-xs text-slate-500">{signer.email}</span></span></label>)}</fieldset>
                 </>
               )}
              {(mode === "conclude" || mode === "archive" || mode === "reopen" || mode === "genericReturn" || mode === "genericReject" || mode === "genericConclude" || mode === "cancelForwarding" || mode === "rejectForwarding") && (
                <label className="block text-sm font-medium text-slate-700">Justificativa
                  <textarea value={reason} onChange={event => setReason(event.target.value)} rows={5} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
                </label>
              )}
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5">
              <button onClick={close} disabled={isPending} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancelar</button>
               <button disabled={isPending} onClick={mode === "forward" ? handleForward : mode === "dispatch" ? handleDispatch : mode === "document" ? handleDocument : mode === "signatures" ? handleSignatures : mode === "cancelForwarding" || mode === "rejectForwarding" ? handlePendingMovement : handleLifecycle} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {isPending ? "Salvando..." : mode === "forward" ? "Tramitar" : mode === "dispatch" ? "Adicionar" : mode === "document" ? "Anexar" : mode === "signatures" ? "Solicitar" : mode === "genericApprove" ? "Aprovar" : mode === "genericReturn" ? "Devolver" : mode === "genericReject" ? "Rejeitar" : mode === "genericConclude" || mode === "conclude" ? "Concluir" : mode === "archive" ? "Arquivar" : mode === "cancelForwarding" ? "Cancelar encaminhamento" : mode === "rejectForwarding" ? "Recusar recebimento" : "Reabrir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
