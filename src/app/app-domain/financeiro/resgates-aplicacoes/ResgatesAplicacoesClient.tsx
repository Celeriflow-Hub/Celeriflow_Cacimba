"use client";

import { useState } from "react";
import { ArrowRightLeft, CheckCircle2, Send, Zap, Calculator, Sparkles, FileText, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { classifyItemAction, transmitItemAction } from "./resgates-actions";
import { pocVirtualBank } from "@/lib/poc/poc-config";
import type { ClassificationResult, MunicipalIntegrationReceipt } from "@/lib/financeiro/classification-engine";

interface StatementItem {
  id: string;
  banco: string | null;
  agencia: string | null;
  contaNumero: string | null;
  date: string;
  description: string | null;
  reference: string | null;
  codigoTransacao: string | null;
  sinal: string | null;
  valueDecimal: unknown;
  status: string;
  categoriaClassificada: string | null;
  reciboMunicipal: string | null;
}

export default function ResgatesAplicacoesClient({ initialItems = [] }: { initialItems?: StatementItem[] }) {
  const [items, setItems] = useState<StatementItem[]>(initialItems);
  const [selectedItem, setSelectedItem] = useState<StatementItem | null>(null);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [transmitting, setTransmitting] = useState(false);
  const [receipt, setReceipt] = useState<MunicipalIntegrationReceipt | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState("TODAS");
  const [signalFilter, setSignalFilter] = useState("TODOS");

  const availableAccounts = [...new Set(items.map((item) => item.contaNumero).filter((account): account is string => Boolean(account)))];
  const filteredItems = items.filter((item) => (
    (accountFilter === "TODAS" || item.contaNumero === accountFilter)
    && (signalFilter === "TODOS" || item.sinal === signalFilter)
  ));

  async function handleClassify(item: StatementItem) {
    setSelectedItem(item);
    setReceipt(null);
    setErrorMsg(null);

    const valor = typeof item.valueDecimal === "object" ? Number(item.valueDecimal) : Number(item.valueDecimal || 0);

    const res = await classifyItemAction({
      descricao: item.description || "Movimentação Bancária",
      codigoTransacao: item.codigoTransacao || undefined,
      sinal: (item.sinal as "CREDITO" | "DEBITO") || (valor < 0 ? "DEBITO" : "CREDITO"),
      valor: Math.abs(valor),
      banco: item.banco || pocVirtualBank.name,
      contaNumero: item.contaNumero || pocVirtualBank.accountNumbers[2],
    });

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.data) {
      setClassificationResult(res.data);
    }
  }

  async function handleTransmit() {
    if (!selectedItem || !classificationResult) return;
    setTransmitting(true);
    setErrorMsg(null);

    const res = await transmitItemAction({ statementItemId: selectedItem.id });

    setTransmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.data) {
      const transmissionReceipt = res.data;
      setReceipt(transmissionReceipt);
      // Atualizar lista local
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? {
                ...i,
                status: "Processado",
                reciboMunicipal: transmissionReceipt.reciboId,
                categoriaClassificada: classificationResult.category,
              }
            : i
        )
      );
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-2 px-1 py-1 sm:px-2">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-300 bg-white px-3 py-2 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mt-0.5 flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
            <ArrowRightLeft className="size-4 text-blue-600" />
            Motor de Classificação de Resgates e Aplicações
          </h1>
          <p className="text-xs text-slate-600">
            Classificação automática dos lançamentos, cálculo de valores, prévia contábil e registro real no CeleriFlow com recibo e vínculo bidirecional.
          </p>
        </div>
      </div>

      {/* Grid: Extratos & Painel de Classificação */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
        {/* Tabela de Extratos Importados */}
        <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-none lg:col-span-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-600" />
              Lançamentos do Extrato Bancário
            </span>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded text-slate-600 dark:text-slate-300 font-mono">
              Exibindo: {filteredItems.length} de {items.length}
            </span>
          </h2>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Conta do extrato
              <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                <option value="TODAS">Todas as contas</option>
                {availableAccounts.map((account) => <option key={account} value={account}>{account}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Tipo de movimento
              <select value={signalFilter} onChange={(event) => setSignalFilter(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                <option value="TODOS">Créditos e débitos</option>
                <option value="CREDITO">Somente créditos</option>
                <option value="DEBITO">Somente débitos</option>
              </select>
            </label>
          </div>

          <div className="max-h-[calc(100dvh-16rem)] space-y-2 overflow-y-auto pr-1">
            {filteredItems.length === 0 ? (
              <p className="text-sm text-slate-500 italic p-4 text-center">Nenhum lançamento corresponde aos filtros. Baixe o extrato da conta desejada na funcionalidade de Extratos Bancários.</p>
            ) : (
              filteredItems.map((item) => {
                const valor = typeof item.valueDecimal === "object" ? Number(item.valueDecimal) : Number(item.valueDecimal || 0);
                const isCredito = item.sinal === "CREDITO" || (item.sinal !== "DEBITO" && valor >= 0);
                const isSelected = selectedItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleClassify(item)}
                    className={`cursor-pointer rounded-md border p-3 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isCredito ? (
                          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <ArrowDownLeft className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                            {item.description || "Movimento de Extrato"}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Doc: {item.reference || item.codigoTransacao || "S/D"} | {new Date(item.date).toLocaleDateString("pt-BR")}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">Conta: {item.contaNumero || "Não identificada"}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-sm font-bold block ${isCredito ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {isCredito ? "+" : "-"} R$ {Math.abs(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        {item.categoriaClassificada ? (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-blue-900/60 dark:text-blue-300">
                            {item.categoriaClassificada}
                          </span>
                        ) : (
                          <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded dark:bg-slate-700 dark:text-slate-300">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Motor de Classificação & Prévia Contábil */}
        <div className="lg:col-span-6 space-y-4">
          <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-none">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Resultado do Motor de Classificação
            </h2>

            {!selectedItem ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 italic">
                Clique em um lançamento bancário da lista ao lado para acionar o Motor de Classificação.
              </div>
            ) : classificationResult ? (
              <div className="space-y-4">
                {/* Card Categoria Reconhecida */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-90">Categoria Identificada</span>
                    <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                      Confiança: {(classificationResult.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mt-1 tracking-wide">{classificationResult.category}</h3>
                  <p className="text-xs opacity-90 mt-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-300" /> {classificationResult.reason}
                  </p>
                </div>

                {/* Cálculo dos Valores */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Calculator className="w-4 h-4 text-blue-500" /> Cálculo dos Valores
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Valor Bruto</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        R$ {classificationResult.calculatedValues.valorBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Taxas / Encargos</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        R$ {classificationResult.calculatedValues.encargosOuTaxas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Valor Líquido</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        R$ {classificationResult.calculatedValues.valorLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prévia do Lançamento Contábil */}
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs shadow-inner">
                  <h4 className="text-amber-400 font-bold tracking-wider flex items-center gap-1 uppercase">
                    <FileText className="w-4 h-4" /> Prévia do Lançamento Contábil (CeleriFlow)
                  </h4>
                  <div className="space-y-1.5 border-t border-slate-800 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Conta Débito:</span>
                      <span className="text-emerald-400 font-bold">{classificationResult.accountingPreview.debitoConta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Conta Crédito:</span>
                      <span className="text-emerald-400 font-bold">{classificationResult.accountingPreview.creditoConta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Evento Contábil:</span>
                      <span className="text-blue-300 font-bold">{classificationResult.accountingPreview.eventoContabil}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Natureza:</span>
                      <span className="text-slate-300">{classificationResult.accountingPreview.naturezaOperacao}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                  <p className="font-bold">Conta que receberá o lançamento no CeleriFlow</p>
                  <p className="mt-1 font-mono">{selectedItem.banco || pocVirtualBank.name} | Agência {selectedItem.agencia || pocVirtualBank.agency} | Conta {selectedItem.contaNumero || "Não identificada"}</p>
                  <p className="mt-1 text-blue-800 dark:text-blue-200">O movimento será gravado na mesma conta identificada no item de extrato selecionado.</p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 text-xs rounded-lg">
                    {errorMsg}
                  </div>
                )}

                {/* Registro real do lançamento no CeleriFlow */}
                {!receipt ? (
                  <button
                    onClick={handleTransmit}
                    disabled={transmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                  >
                    {transmitting ? (
                      "Registrando no CeleriFlow..."
                    ) : (
                      <>
                        <Send className="w-5 h-5" /> Registrar no CeleriFlow &amp; Gerar Recibo
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Transmitido &amp; Vinculado com Sucesso!
                      </span>
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                        {receipt.status}
                      </span>
                    </div>
                    <div className="font-mono text-slate-700 dark:text-slate-300 space-y-1">
                      <div>Recibo CeleriFlow: <strong className="text-emerald-700 dark:text-emerald-300">{receipt.reciboId}</strong></div>
                      <div>Número do Lançamento: <strong>{receipt.numeroLancamento}</strong></div>
                      <div>Conta registrada: <strong>{receipt.contaCeleriFlow?.banco} | Ag. {receipt.contaCeleriFlow?.agencia} | {receipt.contaCeleriFlow?.numero}</strong></div>
                      <div className="truncate">Hash SHA-256: <span className="text-[10px] text-slate-500">{receipt.hashIntegracao}</span></div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
