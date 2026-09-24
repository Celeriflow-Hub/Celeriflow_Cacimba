"use client";

import { useState } from "react";
import { bulkUpdateTaxpayersByFilter } from "../cadastros-fiscais/actions";

export function BulkTaxpayerUpdate({ query, total }: { query: string; total: number }) {
  const [status, setStatus] = useState("Ativo");
  const [message, setMessage] = useState("");
  async function run() {
    if (!total || !confirm(`Aplicar a situação ${status} aos ${total} registros da consulta atual?`)) return;
    const result = await bulkUpdateTaxpayersByFilter({ query, expectedCount: total, status });
    setMessage(result.error ?? `${result.id} registro(s) atualizado(s).`);
  }
  return <div className="flex items-center gap-1"><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-7 rounded border border-slate-300 bg-white px-2 text-[11px]"><option>Ativo</option><option>Suspenso</option><option>Inativo</option></select><button type="button" onClick={run} disabled={!total} className="h-7 rounded border border-slate-300 bg-white px-2 text-[11px] font-semibold disabled:opacity-50">Aplicar ao filtro ({total})</button>{message && <span className="max-w-52 truncate text-[10px] text-slate-500" title={message}>{message}</span>}</div>;
}
