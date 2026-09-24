"use client";

import { useState } from "react";
import { GitCompare, CheckCircle2, FileSpreadsheet, ArrowRightLeft, Sparkles, Scale } from "lucide-react";
import { confirmReconciliationSessionAction, openReconciliationSessionAction, runAutoReconciliationAction } from "./actions";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { pocVirtualBank } from "@/lib/poc/poc-config";
import type { ReconciliationMatchResult } from "@/lib/financeiro/reconciliation-engine";

interface Session {
  id: string;
  banco: string;
  agencia: string;
  contaNumero: string;
  periodo: string;
  saldoInicialDecimal: unknown;
  totalDebitosDecimal: unknown;
  totalCreditosDecimal: unknown;
  saldoFinalDecimal: unknown;
  saldoRazaoDecimal: unknown;
  diferencaDecimal: unknown;
  status: string;
  totalItensBanco: number;
  totalItensContabeis: number;
  itensConciliados: number;
  itensDivergentes: number;
  reciboIntegracao: string | null;
}

interface ConfirmReceipt {
  session: Session;
  recibo: string;
  hash: string;
}

export default function ConciliacaoBancariaClient({ initialSessions = [] }: { initialSessions?: Session[] }) {
  const [banco] = useState(pocVirtualBank.name);
  const [agencia, setAgencia] = useState<string>(pocVirtualBank.agency);
  const [contaNumero, setContaNumero] = useState("20001-1");
  const [periodo, setPeriodo] = useState("2025-08");
  const [saldoInicial, setSaldoInicial] = useState<number>(150000.0);

  const [activeSession, setActiveSession] = useState<Session | null>(initialSessions[0] || null);
  const [matchResults, setMatchResults] = useState<ReconciliationMatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmReceipt, setConfirmReceipt] = useState<ConfirmReceipt | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleOpenSession(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setConfirmReceipt(null);

    const res = await openReconciliationSessionAction({
      banco,
      agencia,
      contaNumero,
      periodo,
      saldoInicial,
    });

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.data) {
      setActiveSession(res.data);
    }
  }

  async function handleRunAutoMatch() {
    if (!activeSession) return;
    setLoading(true);
    setErrorMsg(null);

    const res = await runAutoReconciliationAction(activeSession.id);

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.data) {
      setActiveSession(res.data.session);
      setMatchResults(res.data.matches);
    }
  }

  async function handleConfirmSession() {
    if (!activeSession) return;
    setLoading(true);

    const res = await confirmReconciliationSessionAction(activeSession.id);

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.data) {
      setConfirmReceipt(res.data);
      setActiveSession(res.data.session);
    }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto px-1 py-1 sm:px-2 [&>*+*]:mt-2">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-300 bg-white px-3 py-2 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mt-0.5 flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
            <GitCompare className="size-4 text-emerald-600" />
            Motor Avançado de Conciliação Bancária
          </h1>
          <p className="text-xs text-slate-600">
            Abertura de conciliação bancária, leitura do extrato, cálculo de saldos e confronto com o razão bancário analítico.
          </p>
        </div>
      </div>

      {/* Grid: Abertura & Painel de Saldos */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
        {/* Form Abertura */}
        <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-none lg:col-span-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Abertura de Conciliação
          </h2>

          <form onSubmit={handleOpenSession} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold uppercase mb-1">Banco</label>
              <input
                type="text"
                value={banco}
                readOnly
                className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg text-sm"
                required
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block font-semibold uppercase mb-1">Agência</label>
                <input
                  type="text"
                  value={agencia}
                  onChange={(e) => setAgencia(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold uppercase mb-1">Conta Corrente</label>
                <input
                  type="text"
                  value={contaNumero}
                  onChange={(e) => setContaNumero(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block font-semibold uppercase mb-1">Período (AAAA-MM)</label>
                <input
                  type="month"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                  <label className="block font-semibold uppercase mb-1">Saldo Inicial do Extrato (R$)</label>
                <MoneyInput
                  value={saldoInicial}
                  onChange={setSaldoInicial}
                  className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg text-sm font-bold text-blue-600"
                  required
                />
              </div>
            </div>

            {errorMsg && <div className="p-2.5 bg-rose-50 text-rose-800 text-xs rounded-lg">{errorMsg}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow transition-all"
            >
              Abrir Conciliação &amp; Carregar Razão Bancário
            </button>
          </form>
        </div>

        {/* Dashboard de Saldos & Motor de Match */}
          <div className="space-y-3 lg:col-span-8">
          {!activeSession ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 italic">
              Preencha os dados e clique em &quot;Abrir Conciliação &amp; Carregar Razão Bancário&quot; para iniciar.
            </div>
          ) : (
            <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-none">
              {/* Header Sessão */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-600" />
                    Quadro Demonstrativo de Saldos da Conciliação
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {activeSession.banco} | Conta: {activeSession.contaNumero} | Período: {activeSession.periodo}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  activeSession.status === "CONCILIADA" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                }`}>
                  Status: {activeSession.status}
                </span>
              </div>

              {/* 5 Cards de Saldos */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border">
                  <span className="text-slate-500 block font-semibold">Saldo Inicial</span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    R$ {Number(activeSession.saldoInicialDecimal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border">
                  <span className="text-slate-500 block font-semibold">(+) Entradas (Créditos)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    R$ {Number(activeSession.totalCreditosDecimal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border">
                  <span className="text-slate-500 block font-semibold">(-) Saídas (Débitos)</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                    R$ {Number(activeSession.totalDebitosDecimal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-300">
                  <span className="text-emerald-800 dark:text-emerald-200 block font-semibold">Saldo Final Extrato</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    R$ {Number(activeSession.saldoFinalDecimal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-300">
                  <span className="text-blue-800 dark:text-blue-200 block font-semibold">Saldo do Razão Bancário</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                    R$ {Number(activeSession.saldoRazaoDecimal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-300">
                  <span className="text-blue-800 dark:text-blue-200 block font-semibold">Diferença / Ajuste</span>
                  <span className={`font-extrabold text-sm ${Number(activeSession.diferencaDecimal) === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    R$ {Number(activeSession.diferencaDecimal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Botões do Motor de Match */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleRunAutoMatch}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  Executar Correspondência Automática
                </button>

                {activeSession.status !== "CONCILIADA" && (
                  <button
                    onClick={handleConfirmSession}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Confirmar Conciliação no CeleriFlow
                  </button>
                )}
              </div>

              {confirmReceipt && (
                <div className="p-4 bg-emerald-50 border border-emerald-500 rounded-xl space-y-1 text-xs text-emerald-900 font-mono">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Conciliação confirmada e registrada no CeleriFlow!
                  </div>
                  <div>Recibo de Transmissão: <strong>{confirmReceipt.recibo}</strong></div>
                  <div className="truncate">Hash SHA-256: <span className="text-[10px] text-slate-500">{confirmReceipt.hash}</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Lançamentos Conciliados e Correspondências (9 Regras) */}
      {matchResults.length > 0 && (
          <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-none">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
              Resultado da Correspondência Automática
            </h3>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-bold">
              Total de Matches: {matchResults.length}
            </span>
          </div>

          <div className="overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Regra de Correspondência</th>
                  <th className="p-3">Confiança</th>
                  <th className="p-3">Descrição da Match</th>
                  <th className="p-3">Valor Banco</th>
                  <th className="p-3">Valor Contábil</th>
                  <th className="p-3">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {matchResults.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono">
                      <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] dark:bg-blue-900/80 dark:text-blue-200">
                        {m.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      {(m.confidenceScore * 100).toFixed(0)}%
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold">{m.description}</td>
                    <td className="p-3 font-bold text-emerald-600">
                      {m.valorBanco !== undefined ? `R$ ${m.valorBanco.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-3 font-bold text-blue-600">
                      {m.valorContabil !== undefined ? `R$ ${m.valorContabil.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-3 font-bold">
                      {m.diferenca !== undefined && m.diferenca !== 0 ? (
                        <span className="text-rose-600">R$ {m.diferenca.toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-600">R$ 0.00</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
