"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPriceResearchAction } from "./actions";

type ProcessOption = {
  id: string;
  number: string;
  object: string;
  purchaseRequestNumber: string;
  itemCount: number;
};

function defaultDeadline() {
  const value = new Date(Date.now() + 24 * 60 * 60 * 1000);
  value.setSeconds(0, 0);
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function PriceResearchCreateForm({ processes }: { processes: ProcessOption[] }) {
  const router = useRouter();
  const [processId, setProcessId] = useState("");
  const [deadlineAt, setDeadlineAt] = useState(defaultDeadline);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const deadline = new Date(deadlineAt);
    if (!processId || !deadlineAt || !Number.isFinite(deadline.getTime())) {
      setError("Selecione o processo e informe o prazo de encerramento.");
      return;
    }

    startTransition(async () => {
      const result = await createPriceResearchAction({ processId, deadlineAt: deadline.toISOString() });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.researchId) router.push(`/compras/pesquisas-precos/${result.researchId}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-slate-800 md:col-span-2">
          Processo e solicitação de origem
          <select value={processId} onChange={(event) => setProcessId(event.target.value)} required className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15">
            <option value="">Selecione um processo</option>
            {processes.map((process) => <option key={process.id} value={process.id}>{process.number} · Solicitação {process.purchaseRequestNumber} · {process.itemCount} item(ns)</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-800">
          Encerramento da pesquisa
          <input type="datetime-local" value={deadlineAt} onChange={(event) => setDeadlineAt(event.target.value)} required className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15" />
        </label>
        <div className="self-end rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          A pesquisa fica disponível desde a criação até o horário informado. O encerramento é validado pelo servidor.
        </div>
      </div>
      {processId ? <p className="rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-900">O valor de referência será a média aritmética das cotações globais apresentadas.</p> : null}
      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <button type="button" onClick={() => router.push("/compras/pesquisas-precos")} className="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
        <button type="submit" disabled={pending || !processes.length} className="min-h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Criando..." : "Criar pesquisa"}</button>
      </div>
    </form>
  );
}
