"use client";

import { useState } from "react";
import { Car, Send } from "lucide-react";
import { issueTrafficTicketAction } from "./infracoes-actions";

type TrafficTicket = NonNullable<Awaited<ReturnType<typeof issueTrafficTicketAction>>["data"]>;

export function InfracoesInteractiveClient() {
  const [placa, setPlaca] = useState("ABC-1D23");
  const [chassi, setChassi] = useState("9BWZZZ377VT004912");
  const [codigoCtb, setCodigoCtb] = useState("500-20 (Dirigir sem cinto de segurança)");
  const [descricao, setDescricao] = useState("Condutor transitando em via pública urbana sem utilizar o cinto de segurança obrigatório.");
  const [valorMulta, setValorMulta] = useState(195.23);
  const [geolocalizacao] = useState("-7.2234, -35.8821 (Av. Floriano Peixoto, 100)");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrafficTicket | null>(null);

  async function handleIssueTicket(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await issueTrafficTicketAction({
      placaVeiculo: placa,
      chassi,
      codigoCtb,
      descricaoInfracao: descricao,
      valorMulta,
      geolocalizacao,
    });

    setLoading(false);

    if (res.data) {
      setResult(res.data);
    } else {
      alert(res.error || "Erro ao emitir Auto de Infração.");
    }
  }

  return (
    <section className="rounded-xl border border-cyan-900/60 bg-slate-950 p-3 text-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-cyan-900/60 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Talão Eletrônico AIT — SNA / Senatran (Guarda Municipal)
          </span>
          <h2 className="mt-2 flex items-center gap-2 text-base font-bold">
            <Car className="h-5 w-5 text-cyan-400" />
            Emissão Instantânea de Auto de Infração de Trânsito com Pix
          </h2>
        </div>
        <span className="w-fit shrink-0 rounded-full bg-cyan-500 px-2.5 py-1 text-xs font-bold text-white shadow">
          SNA Transmitido
        </span>
      </div>

      <form onSubmit={handleIssueTicket} className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Placa do Veículo</label>
          <input
            type="text"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-sm uppercase font-bold"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Chassi (Opcional)</label>
          <input
            type="text"
            value={chassi}
            onChange={(e) => setChassi(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Enquadramento CTB</label>
          <input
            type="text"
            value={codigoCtb}
            onChange={(e) => setCodigoCtb(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-slate-300 font-semibold mb-1">Descrição / Histórico da Infração</label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Valor da Multa (R$)</label>
          <input
            type="number"
            step="0.01"
            value={valorMulta}
            onChange={(e) => setValorMulta(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-cyan-400 font-bold"
            required
          />
        </div>

        <div className="flex justify-end sm:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 shadow text-sm transition-all"
          >
            <Send className="w-4 h-4" /> Autuar &amp; Transmitir ao Sistema Nacional (SNA)
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-3 space-y-3 rounded-lg border border-cyan-800/80 bg-slate-900 p-3 text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-300">AIT N° {result.numeroAit} ({result.placaVeiculo})</span>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded">
              {result.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 block">Agente Autuador</span>
              <span className="font-mono text-white text-xs">{result.agenteMatricula}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Copia e Cola QR Code Pix</span>
              <span className="font-mono text-cyan-400 text-[10px] break-all">{result.qrCodePix}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
