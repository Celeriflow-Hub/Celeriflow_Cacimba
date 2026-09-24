"use client";

import { useState } from "react";
import { Droplet, Calculator } from "lucide-react";
import { processMeterReadingAction } from "./leituras-actions";

export function LeiturasInteractiveClient() {
  const [matricula, setMatricula] = useState("MAT-9921-04");
  const [consumidor, setConsumidor] = useState("JOÃO PEDRO DOS SANTOS");
  const endereco = "RUA DAS ACÁCIAS, 140 - BAIRRO DAS FREIRAS";
  const [hidrometro, setHidrometro] = useState("A2026-99182");
  const [leituraAnterior, setLeituraAnterior] = useState<number>(450.0);
  const [leituraAtual, setLeituraAtual] = useState<number>(478.0);
  const [tipoTarifa, setTipoTarifa] = useState<"RESIDENCIAL" | "COMERCIAL" | "INDUSTRIAL">("RESIDENCIAL");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof processMeterReadingAction>>["data"] | null>(null);

  async function handleProcessReading(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await processMeterReadingAction({
      codigoMatricula: matricula,
      nomeConsumidor: consumidor,
      endereco,
      numeroHidrometro: hidrometro,
      leituraAnterior,
      leituraAtual,
      tipoTarifa,
    });

    setLoading(false);

    if (res.data) {
      setResult(res.data);
    } else {
      alert(res.error || "Erro ao processar leitura.");
    }
  }

  return (
    <section className="mb-3 space-y-3 rounded-md border border-blue-800/40 bg-gradient-to-r from-blue-950 via-cyan-950 to-slate-900 p-4 text-white shadow-lg">
      <div className="flex flex-col gap-2 border-b border-blue-900/60 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Motor de Leitura Móvel de Hidrômetros &amp; Emissão Simultânea
          </span>
          <h2 className="mt-1 flex items-center gap-2 text-base font-bold sm:text-lg">
            <Droplet className="size-5 text-cyan-400" />
            Coleta de Campo, Cálculo por Faixas e Fatura Pix
          </h2>
        </div>
        <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow">
          Conta Simultânea
        </span>
      </div>

      <form onSubmit={handleProcessReading} className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Matrícula da Unidade</label>
          <input
            type="text"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 font-mono text-white"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Nome do Consumidor</label>
          <input
            type="text"
            value={consumidor}
            onChange={(e) => setConsumidor(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 font-semibold text-white"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">N° do Hidrômetro</label>
          <input
            type="text"
            value={hidrometro}
            onChange={(e) => setHidrometro(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 font-mono text-white"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Tipo de Tarifa</label>
          <select
            value={tipoTarifa}
            onChange={(e) => setTipoTarifa(e.target.value as "RESIDENCIAL" | "COMERCIAL" | "INDUSTRIAL")}
            className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 font-semibold text-white"
          >
            <option value="RESIDENCIAL">RESIDENCIAL</option>
            <option value="COMERCIAL">COMERCIAL</option>
            <option value="INDUSTRIAL">INDUSTRIAL</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Leitura Anterior (m³)</label>
          <input
            type="number"
            step="0.1"
            value={leituraAnterior}
            onChange={(e) => setLeituraAnterior(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 font-bold text-slate-400"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Leitura Atual (m³)</label>
          <input
            type="number"
            step="0.1"
            value={leituraAtual}
            onChange={(e) => setLeituraAtual(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 font-bold text-cyan-400"
            required
          />
        </div>

        <div className="flex items-end sm:col-span-3 sm:justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-3 text-sm font-bold text-white shadow transition-colors hover:bg-cyan-500 sm:w-auto"
          >
            <Calculator className="w-4 h-4" /> Efetuar Leitura e Imprimir Fatura Simultânea
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-3 rounded-md border border-blue-800/80 bg-slate-950 p-3 text-xs">
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-bold text-cyan-300">Fatura Emitida — {result.record.nomeConsumidor} ({result.record.codigoMatricula})</span>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded">
              FATURA IMPRESSA / EMITIDA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <span className="text-slate-500 block">Consumo Médio Apurado</span>
              <span className="font-bold text-white text-sm">{result.billing.consumoM3} m³</span>
            </div>
            <div>
              <span className="text-slate-500 block">Tarifa de Água</span>
              <span className="font-bold text-slate-300">R$ {result.billing.tarifaAgua.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Tarifa de Esgoto (80%)</span>
              <span className="font-bold text-slate-300">R$ {result.billing.tarifaEsgoto.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Valor Total da Fatura</span>
              <span className="font-bold text-emerald-400 text-base">R$ {result.billing.valorTotalFatura.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-800 pt-2 text-[10px] sm:flex-row sm:items-center sm:justify-between">
            <span className="break-all font-mono text-slate-400">Linha Digitável: {result.billing.linhaDigitavel}</span>
            <span className="font-mono text-cyan-400">Pix QR Code Prontidão Ativa</span>
          </div>
        </div>
      )}
    </section>
  );
}
