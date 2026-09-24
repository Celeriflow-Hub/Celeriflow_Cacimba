"use client";

import { useState } from "react";
import { X, Copy, Check, RefreshCw, FileJson, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntegrationRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionName: string;
  environment: string;
  endpoint: string;
  run: {
    id: string;
    operation: string;
    environment: string;
    status: string;
    message: string;
    createdAt: Date | string;
    payload?: string | null;
  } | null;
  onReprocess?: () => Promise<void>;
}

export default function IntegrationRunModal({
  isOpen,
  onClose,
  connectionName,
  environment,
  endpoint,
  run,
  onReprocess,
}: IntegrationRunModalProps) {
  const [copiedEvidence, setCopiedEvidence] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  if (!isOpen || !run) return null;

  const persistedEnvelope = run.payload || "Nenhuma evidência sanitizada foi persistida para esta execução.";

  const handleCopyEvidence = () => {
    navigator.clipboard.writeText(persistedEnvelope);
    setCopiedEvidence(true);
    setTimeout(() => setCopiedEvidence(false), 2000);
  };

  const handleReprocessClick = async () => {
    if (!onReprocess) return;
    setReprocessing(true);
    await onReprocess();
    setReprocessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl space-y-4 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900 p-4 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{connectionName}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  run.status === "SUCCESS" || run.status === "SUCESSO" || run.status === "CONFIRMED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : run.status === "QUEUED" || run.status === "PENDING_CONFIGURATION"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}>
                  {run.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{endpoint || "Endpoint padrão configurado"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs sm:grid-cols-2">
          <div>
            <span className="text-slate-400">Ambiente</span>
            <p className="font-semibold text-white mt-0.5">{run.environment || environment}</p>
          </div>
          <div>
            <span className="text-slate-400">Data/Hora Execução</span>
            <p className="font-semibold text-white mt-0.5">{new Date(run.createdAt).toLocaleString("pt-BR")}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileJson className="w-4 h-4 text-emerald-400" /> Envelope Sanitizado Persistido
            </span>
            <button onClick={handleCopyEvidence} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              {copiedEvidence ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedEvidence ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-80">
            {persistedEnvelope}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-xs text-slate-400">
            Evidência técnica auditável para comissão de licitação / avaliação POC.
          </span>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="border-slate-700 bg-slate-800 text-slate-200">
              Fechar
            </Button>
            {onReprocess && (
              <Button onClick={handleReprocessClick} disabled={reprocessing} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <RefreshCw className={`w-4 h-4 mr-2 ${reprocessing ? "animate-spin" : ""}`} />
                {reprocessing ? "Reprocessando..." : "Reprocessar Integração"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
