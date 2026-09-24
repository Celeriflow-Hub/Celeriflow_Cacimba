"use client";

import { useState } from "react";
import { TrendingUp, Calculator, CheckCircle2, FileText, Percent, Coins, RotateCcw, Send } from "lucide-react";
import { calculateYieldAction, fetchExternalYieldsAction, transmitYieldAction } from "./rendimentos-actions";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { pocVirtualBank } from "@/lib/poc/poc-config";
import type { YieldCalculationResult, YieldTransmissionResult } from "@/lib/financeiro/yield-engine";

interface YieldRecord {
  id: string;
  contaNumero: string;
  data: string;
  valorBrutoDecimal: unknown;
  irrfDecimal: unknown;
  iofDecimal: unknown;
  correcaoDecimal: unknown;
  valorLiquidoDecimal: unknown;
  saldoAcumuladoDecimal: unknown;
  tipoRendimento: string;
  reciboMunicipal: string | null;
  createdAt: string;
}

interface ExternalYield {
  documentoRef?: string;
  data: string;
  valorBruto: number;
  irrf: number;
  iof: number;
  correcaoMonetaria: number;
  valorLiquido: number;
  saldoAcumulado: number;
  statementItemId?: string;
  alreadyProcessed: boolean;
}

export default function RendimentosClient({ initialHistory = [] }: { initialHistory?: YieldRecord[] }) {
  const [contaNumero, setContaNumero] = useState<string>(pocVirtualBank.accountNumbers[2]);
  const [valorBruto, setValorBruto] = useState<number>(3420.5);
  const [irrf, setIrrf] = useState<number>(513.07);
  const [iof, setIof] = useState<number>(0.0);
  const [correcaoMonetaria, setCorrecaoMonetaria] = useState<number>(0.0);
  const [saldoAnteriorAcumulado, setSaldoAnteriorAcumulado] = useState<number>(145800.0);
  const [isEstorno, setIsEstorno] = useState<boolean>(false);
  const [periodoInicio, setPeriodoInicio] = useState("2025-08-01");
  const [periodoFim, setPeriodoFim] = useState("2025-08-31");
  const [externalYields, setExternalYields] = useState<ExternalYield[]>([]);
  const [selectedYield, setSelectedYield] = useState<ExternalYield | null>(null);

  const [calculation, setCalculation] = useState<YieldCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const [receipt, setReceipt] = useState<YieldTransmissionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [queryMessage, setQueryMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<YieldRecord[]>(initialHistory);

  async function handleCalculate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setReceipt(null);
    setErrorMsg(null);

    const res = await calculateYieldAction({
      valorBruto,
      irrf,
      iof,
      correcaoMonetaria,
      saldoAnteriorAcumulado,
      isEstorno,
    });

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.data) {
      setCalculation(res.data);
    }
  }

  async function handleFetchYields() {
    setLoading(true);
    setErrorMsg(null);
    setQueryMessage(null);
    setExternalYields([]);

    try {
      const res = await fetchExternalYieldsAction({ banco: pocVirtualBank.name, agencia: pocVirtualBank.agency, contaNumero, periodoInicio, periodoFim });
      if (res.error) return setErrorMsg(res.error);

      const yields = res.data || [];
      setExternalYields(yields);
      if (!yields.length) return setErrorMsg("Nenhum rendimento foi encontrado no extrato para o período informado.");
      setQueryMessage(`${yields.length} rendimento${yields.length === 1 ? "" : "s"} identificado${yields.length === 1 ? "" : "s"}. Selecione um item para apurar.`);
    } catch {
      setErrorMsg("Não foi possível consultar os rendimentos no extrato de aplicação.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectYield(yieldItem: ExternalYield) {
    if (!yieldItem.statementItemId) return setErrorMsg("Baixe o extrato da aplicação antes de processar este rendimento.");
    if (yieldItem.alreadyProcessed) return setErrorMsg("Este rendimento já foi processado.");
    setSelectedYield(yieldItem);
    setValorBruto(yieldItem.valorBruto);
    setIrrf(yieldItem.irrf);
    setIof(yieldItem.iof);
    setCorrecaoMonetaria(yieldItem.correcaoMonetaria);
    const res = await calculateYieldAction({ ...yieldItem, saldoAnteriorAcumulado });
    if (res.error) setErrorMsg(res.error);
    else if (res.data) setCalculation(res.data);
  }

  async function handleTransmit() {
    if (!calculation) return;
    setTransmitting(true);
    setErrorMsg(null);

    const res = await transmitYieldAction({
      statementItemId: selectedYield?.statementItemId,
      contaNumero,
      data: selectedYield?.data || new Date().toISOString(),
      valorBruto: calculation.valorBruto,
      irrf: calculation.irrf,
      iof: calculation.iof,
      correcaoMonetaria: calculation.correcaoMonetaria,
      valorLiquido: calculation.valorLiquido,
      saldoAcumulado: calculation.saldoAcumulado,
      tipo: calculation.tipo,
    });

    setTransmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.data) {
      const transmittedYield = res.data;
      setReceipt(transmittedYield);
      setHistory((prev) => [
        {
          id: transmittedYield.yieldTransactionId,
          contaNumero,
          data: new Date().toISOString(),
          valorBrutoDecimal: calculation.valorBruto,
          irrfDecimal: calculation.irrf,
          iofDecimal: calculation.iof,
          correcaoDecimal: calculation.correcaoMonetaria,
          valorLiquidoDecimal: calculation.valorLiquido,
          saldoAcumuladoDecimal: calculation.saldoAcumulado,
          tipoRendimento: calculation.tipo,
          reciboMunicipal: transmittedYield.reciboId,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto px-1 py-1 sm:px-2 [&>*+*]:mt-2">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-300 bg-white px-3 py-2 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mt-0.5 flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
            <TrendingUp className="size-4 text-emerald-600" />
            Gestão de Rendimentos de Aplicação Financeira
          </h1>
          <p className="text-xs text-slate-600">
            Leitura do extrato de aplicação, apuração de Rendimento Bruto, Líquido, IRRF, IOF, Correção Monetária e Acumulado com classificação contábil e transmissão municipal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
        {/* Form Calculadora */}
        <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-none lg:col-span-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Calculator className="w-5 h-5 text-emerald-600" />
            Apuração de Rendimentos do Extrato
          </h2>

          <form onSubmit={handleCalculate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Conta da Aplicação Financeira
              </label>
              <input
                type="text"
                value={contaNumero}
                onChange={(e) => setContaNumero(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Início do período</label>
                <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Fim do período</label>
                <input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm" />
              </div>
            </div>
            <button type="button" onClick={handleFetchYields} disabled={loading} className="w-full border border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold py-2.5 px-4 rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Consultando rendimentos..." : "Consultar rendimentos no extrato de aplicação"}
            </button>
            {errorMsg && (
              <div role="alert" className="p-3 bg-rose-50 text-rose-800 border border-rose-200 text-xs rounded-lg">{errorMsg}</div>
            )}
            {queryMessage && (
              <div role="status" className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-lg">{queryMessage}</div>
            )}
            {externalYields.length > 0 && (
              <div className="space-y-2 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Rendimentos identificados no extrato</p>
                {externalYields.map((yieldItem) => (
                  <button key={yieldItem.documentoRef || yieldItem.data} type="button" onClick={() => handleSelectYield(yieldItem)} disabled={yieldItem.alreadyProcessed} className="w-full rounded border border-slate-200 dark:border-slate-700 p-2 text-left text-xs hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
                    {new Date(yieldItem.data).toLocaleDateString("pt-BR")} - R$ {Number(yieldItem.valorLiquido).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{yieldItem.alreadyProcessed ? " (processado)" : ""}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Rendimento Bruto (R$)
                </label>
                <MoneyInput
                  value={valorBruto}
                  onChange={setValorBruto}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Imposto de Renda (IRRF R$)
                </label>
                <MoneyInput
                  value={irrf}
                  onChange={setIrrf}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm font-bold text-rose-600 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  IOF Retido (R$)
                </label>
                <MoneyInput
                  value={iof}
                  onChange={setIof}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Correção Monetária (R$)
                </label>
                <MoneyInput
                  value={correcaoMonetaria}
                  onChange={setCorrecaoMonetaria}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Saldo Acumulado Anterior (R$)
              </label>
              <MoneyInput
                value={saldoAnteriorAcumulado}
                onChange={setSaldoAnteriorAcumulado}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="estornoCheck"
                checked={isEstorno}
                onChange={(e) => setIsEstorno(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="estornoCheck" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Marcar como Estorno de Rendimento
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Coins className="w-5 h-5" />
              Calcular &amp; Gerar Demonstrativo
            </button>
          </form>
        </div>

        {/* Quadro Demonstrativo & Classificação Contábil */}
          <div className="space-y-3 lg:col-span-7">
          {!calculation ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400 italic">
              Preencha os valores do extrato e clique em &quot;Calcular &amp; Gerar Demonstrativo&quot;.
            </div>
          ) : (
            <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-none">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-5 h-5 text-emerald-600" />
                  Demonstrativo de Apuração de Rendimento
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full dark:bg-emerald-900 dark:text-emerald-300">
                  Tipo: {calculation.tipo}
                </span>
              </div>

              {/* Grid 4 Cards com Totais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 font-semibold block">Rendimento Bruto</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">
                    R$ {calculation.valorBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 font-semibold block">IRRF / IOF Retido</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    - R$ {(calculation.irrf + calculation.iof).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block">Rendimento Líquido</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    R$ {calculation.valorLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 font-semibold block">Saldo Acumulado</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    R$ {calculation.saldoAcumulado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Classificação Contábil Exigida pelo Edital */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2">
                <span className="text-amber-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                  <FileText className="w-4 h-4" /> Classificação Contábil Automática (PCASP / STN)
                </span>
                <div className="space-y-1 border-t border-slate-800 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conta Débito:</span>
                    <span className="text-emerald-400">{calculation.classificacaoContabil.contaDebito}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conta Crédito:</span>
                    <span className="text-emerald-400">{calculation.classificacaoContabil.contaCredito}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Evento Contábil:</span>
                    <span className="text-blue-300">{calculation.classificacaoContabil.eventoContabil}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Natureza da Receita:</span>
                    <span className="text-slate-300">{calculation.classificacaoContabil.naturezaReceita}</span>
                  </div>
                </div>
              </div>

              {/* Transmissão Municipal */}
              {!receipt ? (
                <button
                  onClick={handleTransmit}
                  disabled={transmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  {transmitting ? (
                      "Registrando no CeleriFlow..."
                  ) : (
                    <>
                        <Send className="w-5 h-5" /> Registrar Rendimento no CeleriFlow
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Operação registrada no CeleriFlow!
                    </span>
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                      {receipt.status}
                    </span>
                  </div>
                  <div className="font-mono text-slate-700 dark:text-slate-300 space-y-1">
                    <div>Recibo: <strong className="text-emerald-700 dark:text-emerald-300">{receipt.reciboId}</strong></div>
                    <div>Lançamento Contábil: <strong>{receipt.numeroLancamento}</strong></div>
                    <div className="truncate">Hash SHA-256: <span className="text-[10px] text-slate-500">{receipt.hashTransmissao}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Histórico */}
      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-none">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Histórico de Rendimentos Apurados</h3>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Nenhum rendimento transmitido ainda.</p>
        ) : (
          <div className="overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Conta Aplicação</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Bruto</th>
                  <th className="p-3">Tributos</th>
                  <th className="p-3">Líquido</th>
                  <th className="p-3">Saldo Acumulado</th>
                  <th className="p-3">Recibo Municipal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((h) => {
                  const b = Number(h.valorBrutoDecimal || 0);
                  const l = Number(h.valorLiquidoDecimal || 0);
                  const t = Number(h.irrfDecimal || 0) + Number(h.iofDecimal || 0);
                  const s = Number(h.saldoAcumuladoDecimal || 0);

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-500">{new Date(h.data).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{h.contaNumero}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-slate-800 dark:text-slate-300">
                          {h.tipoRendimento}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-300">R$ {b.toFixed(2)}</td>
                      <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">- R$ {t.toFixed(2)}</td>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">R$ {l.toFixed(2)}</td>
                      <td className="p-3 font-bold text-blue-600 dark:text-blue-400">R$ {s.toFixed(2)}</td>
                      <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-400">{h.reciboMunicipal || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
