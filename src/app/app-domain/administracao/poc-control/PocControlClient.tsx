"use client";

import { useState } from "react";
import { resetPocDatabaseAction, getPocDataMetricsAction } from "./actions";
import { RefreshCw, Database, ShieldAlert, CheckCircle2, Server, Layers, AlertCircle } from "lucide-react";

interface PocControlClientProps {
  initialCounts: Record<string, number>;
}

export default function PocControlClient({ initialCounts }: PocControlClientProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(false);
  const [refreshingMetrics, setRefreshingMetrics] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleReset = async () => {
    const confirmation = prompt('Digite "RESETAR POC" para limpar os dados financeiros locais desta instância.');
    if (confirmation === null) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await resetPocDatabaseAction(confirmation);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else if (res.message) {
      setMessage({ type: "success", text: res.message });
      // Reload metrics after reset
      const updatedMetrics = await getPocDataMetricsAction();
      if (updatedMetrics.counts) {
        setCounts(updatedMetrics.counts);
      }
    }

    setLoading(false);
  };

  const handleRefreshMetrics = async () => {
    setRefreshingMetrics(true);
    const res = await getPocDataMetricsAction();
    if (res.counts) {
      setCounts(res.counts);
    }
    setRefreshingMetrics(false);
  };

  return (
    <div className="space-y-3">
      {/* Header Banner Card */}
      <div className="rounded-md border border-indigo-500/20 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-blue-900/40 p-3 shadow-sm backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded bg-indigo-600/30 p-2 text-indigo-400">
              <Database className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Console Admin: Modo POC e Demonstração</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ATIVO
                </span>
              </div>
              <p className="mt-0.5 max-w-2xl text-xs text-slate-300">
                Gerencie o ambiente de demonstração, verifique a volumetria de dados simulados e limpe os registros financeiros locais da POC. O banco virtual externo possui reset administrativo próprio.
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={loading}
            className="inline-flex h-7 items-center justify-center gap-1.5 rounded bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Restaurando Base POC..." : "Restaurar Base de Dados POC"}
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/30 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Overview Cards */}
       <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="rounded border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">Ambiente Ativo</span>
            <Server className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">POC & Simulação</p>
          <span className="text-xs text-slate-400">Isolado da Produção</span>
        </div>

        <div className="rounded border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">Cobertura de Módulos</span>
            <Layers className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">20 Módulos</p>
          <span className="text-xs text-slate-400">100+ registros cada / 200 RH</span>
        </div>

        <div className="rounded border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">Sandbox de Notificação</span>
            <ShieldAlert className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-300 mt-2">Ativado</p>
          <span className="text-xs text-slate-400">Logs de SMS/E-mail retidos na UI</span>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="space-y-3 rounded border border-slate-800 bg-slate-900/70 p-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Volumetria de Dados por Módulo (Mínimo 100 / 200 RH)</h3>
            <p className="text-xs text-slate-400">Visão em tempo real do banco de dados populado para apresentações públicas</p>
          </div>
          <button
            onClick={handleRefreshMetrics}
            disabled={refreshingMetrics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshingMetrics ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(counts).map(([label, count]) => {
            const isRh = label.includes("Servidores");
            const minRequired = isRh ? 200 : 100;
            const isTargetMet = count >= minRequired;

            return (
              <div
                key={label}
                className="flex items-center justify-between rounded border border-slate-800/80 bg-slate-950/50 p-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">{label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{count}</span>
                  {isTargetMet ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
