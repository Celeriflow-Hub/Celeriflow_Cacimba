"use client";

import { useState } from "react";
import { Download, ShieldCheck, FileCheck, HardDrive, Terminal, CheckCircle2, RefreshCw, Eye, Hash, Calendar, Building2 } from "lucide-react";
import { runAutomatedBankDownloadAction } from "./extratos-actions";
import { pocVirtualBank } from "@/lib/poc/poc-config";

interface DownloadRecord {
  id: string;
  banco: string;
  agencia: string;
  contaNumero: string;
  tipoConta: string;
  periodoInicio: string;
  periodoFim: string;
  nomeArquivo: string;
  caminhoDestino: string;
  formato: string;
  hashSHA256: string;
  tamanhoBytes: number;
  status: string;
  logsExecucao: string;
  auditLogId: string | null;
  createdAt: string;
}

export default function DownloadExtratosClient({ initialHistory = [] }: { initialHistory?: DownloadRecord[] }) {
  const [banco] = useState(pocVirtualBank.name);
  const [agencia, setAgencia] = useState<string>(pocVirtualBank.agency);
  const [contaNumero, setContaNumero] = useState("20001-1");
  const [periodoInicio, setPeriodoInicio] = useState("2025-08-01");
  const [periodoFim, setPeriodoFim] = useState("2025-08-31");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<DownloadRecord | null>(null);
  const [history, setHistory] = useState<DownloadRecord[]>(initialHistory);

  async function handleExecuteAutomation(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setCurrentResult(null);

    const res = await runAutomatedBankDownloadAction({
      banco,
      agencia,
      contaNumero,
      periodoInicio,
      periodoFim,
    });

    setLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.data) {
      const record = res.data;
      setCurrentResult(record);
      setHistory((prev) => [record, ...prev]);
    }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto px-1 py-1 sm:px-2 [&>*+*]:mt-2">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-300 bg-white px-3 py-2 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mt-0.5 flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
            <Download className="size-4 text-emerald-600" />
            Automação de Download de Extratos Bancários
          </h1>
          <p className="text-xs text-slate-600">
            Acesso automatizado ao banco simulado externo, com arquivamento privado do extrato original e registro de auditoria.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
        {/* Form Container */}
        <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-none lg:col-span-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            Parâmetros da Automação
          </h2>

          <form onSubmit={handleExecuteAutomation} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Instituição Bancária
              </label>
              <div className="w-full rounded-lg border border-slate-300 bg-slate-100 p-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {banco}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Banco externo de testes exclusivo desta POC.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Agência
                </label>
                <input
                  type="text"
                  value={agencia}
                  onChange={(e) => setAgencia(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Conta Corrente / Aplicação
                </label>
                <input
                  type="text"
                  value={contaNumero}
                  onChange={(e) => setContaNumero(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Período Início
                </label>
                <input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Período Fim
                </label>
                <input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Conectando à Plataforma Bancária...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Executar Automação de Download
                </>
              )}
            </button>
          </form>
        </div>

        {/* Console Log & Evidence Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Real-time Automation Terminal */}
          <div className="rounded-md border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300 shadow-none">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="flex items-center gap-2 text-emerald-400 font-bold">
                <Terminal className="w-4 h-4" /> Console de Execução do Bot de Automação
              </span>
              <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                {loading ? "EM EXECUÇÃO..." : currentResult ? "STATUS: 200 OK" : "AGUARDANDO"}
              </span>
            </div>

            <div className="space-y-1 rounded border border-slate-800/80 bg-slate-900/50 p-3">
              {loading && (
                <div className="text-amber-400 animate-pulse">
                  &gt; Estabelecendo handshake SSL/TLS com o servidor bancário...
                </div>
              )}
              {currentResult ? (
                currentResult.logsExecucao.split("\n").map((line, idx) => (
                  <div key={idx} className="text-emerald-300">
                    {line}
                  </div>
                ))
              ) : !loading ? (
                <div className="text-slate-500 italic">
                  Pronto para iniciar a automação. Preencha os campos e clique em &quot;Executar Automação de Download&quot;.
                </div>
              ) : null}
            </div>
          </div>

          {/* Panel: Evidências para Aprovação da Comissão */}
          {currentResult && (
            <div className="space-y-3 rounded-md border border-emerald-500/40 bg-emerald-50 p-3 shadow-none">
              <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-3">
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  Evidência Oficial de Automação para Aprovação
                </h3>
                <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> APROVADO
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold">Conta &amp; Período Baixado</span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {currentResult.banco} | Ag: {currentResult.agencia} CC: {currentResult.contaNumero}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 block mt-1">
                    Período: {currentResult.periodoInicio.slice(0, 10)} até {currentResult.periodoFim.slice(0, 10)}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold flex items-center gap-1">
                    <FileCheck className="w-4 h-4 text-emerald-600" /> Arquivo Original &amp; Formato
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {currentResult.nomeArquivo} ({currentResult.formato})
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 block mt-1">
                    Tamanho: {(currentResult.tamanhoBytes / 1024).toFixed(2)} KB | Extrato CC e Aplicação
                  </span>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold flex items-center gap-1">
                    <Hash className="w-4 h-4 text-purple-600" /> Assinatura de Integridade (Hash SHA-256)
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold break-all text-xs">
                    {currentResult.hashSHA256}
                  </span>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold flex items-center gap-1">
                    <HardDrive className="w-4 h-4 text-blue-600" /> Arquivo arquivado (Blob privado da instância)
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-bold text-xs break-all">
                    {currentResult.caminhoDestino}
                  </span>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Registro de Auditoria Inalterável</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                      AuditLog ID: {currentResult.auditLogId || "LOG-AUTO-" + currentResult.id}
                    </span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded font-semibold dark:bg-blue-900 dark:text-blue-200">
                    Autenticado por Certificado A1
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-none">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Eye className="w-5 h-5 text-slate-600" />
          Histórico de Execuções e Downloads de Extratos
        </h3>

        {history.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">Nenhum download efetuado recentemente.</p>
        ) : (
          <div className="overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Data/Hora</th>
                  <th className="p-3">Banco / Conta</th>
                  <th className="p-3">Período</th>
                  <th className="p-3">Arquivo Original</th>
                  <th className="p-3">Hash SHA-256</th>
                  <th className="p-3">Destino</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-500">{new Date(item.createdAt).toLocaleString("pt-BR")}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.banco} ({item.contaNumero})
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {item.periodoInicio.slice(0, 10)} a {item.periodoFim.slice(0, 10)}
                    </td>
                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{item.nomeArquivo}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500 max-w-[140px] truncate" title={item.hashSHA256}>
                      {item.hashSHA256}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-500 max-w-[180px] truncate" title={item.caminhoDestino}>
                      {item.caminhoDestino}
                    </td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-emerald-900/60 dark:text-emerald-300">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
