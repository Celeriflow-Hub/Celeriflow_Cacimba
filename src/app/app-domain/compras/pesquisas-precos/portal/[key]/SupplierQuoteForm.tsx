"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveSupplierPriceQuoteDraftAction, submitSupplierPriceQuoteAction } from "../../actions";
import { CompactItemsTable, type PriceResearchItemRow } from "../../CompactItemsTable";

type PortalQuote = {
  invitationId: string;
  supplierName: string;
  quoteValue: number;
  process: { number: string; object: string; purchaseRequestNumber: string | null; items: PriceResearchItemRow[] };
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function parseMoney(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;
  return Number(trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed);
}

export function SupplierQuoteForm({ accessKey, quote }: { accessKey: string; quote: PortalQuote }) {
  const router = useRouter();
  const [value, setValue] = useState(quote.quoteValue > 0 ? String(quote.quoteValue) : "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const parsedValue = parseMoney(value);
  const totalIsValid = Number.isFinite(parsedValue) && parsedValue > 0;

  function saveDraft() {
    if (!totalIsValid) {
      setError("Informe um valor global maior que zero.");
      return;
    }
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await saveSupplierPriceQuoteDraftAction({ accessKey, value: parsedValue });
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice("Rascunho salvo. A proposta ainda não foi apresentada.");
      router.refresh();
    });
  }

  function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!totalIsValid) {
      setError("Informe um valor global maior que zero.");
      return;
    }
    if (!confirm("Apresentar esta cotação? O valor não poderá ser alterado depois da confirmação.")) return;
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await submitSupplierPriceQuoteAction({ accessKey, value: parsedValue });
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice("Cotação apresentada com sucesso.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submitQuote} className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
      {error ? <p role="alert" className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {notice ? <p role="status" className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p> : null}

      <section className="shrink-0 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 p-3 sm:grid-cols-2"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Compra</p><p className="mt-1 text-sm font-semibold text-slate-900">Processo {quote.process.number}</p><p className="mt-1 text-xs leading-5 text-slate-600">{quote.process.object}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fornecedor</p><p className="mt-1 text-sm font-semibold text-slate-900">{quote.supplierName}</p><p className="mt-1 text-xs text-slate-600">Solicitação {quote.process.purchaseRequestNumber ?? "vinculada ao processo"}</p></div></div>
      </section>

      <CompactItemsTable items={quote.process.items} title="Itens solicitados" description="Confira unidades e quantidades antes de informar o valor total. Os dados da compra não podem ser alterados neste portal." className="h-[min(42dvh,24rem)] shrink-0" />

      <section className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <label className="block text-sm font-semibold text-emerald-950" htmlFor="global-quote-value">Valor global ofertado para todos os itens</label>
        <div className="mt-2 flex items-center gap-2"><span className="text-sm font-semibold text-emerald-900">R$</span><input id="global-quote-value" inputMode="decimal" type="text" value={value} onChange={(event) => setValue(event.target.value)} placeholder="0,00" disabled={pending} className="h-10 min-w-0 flex-1 rounded-md border border-emerald-300 bg-white px-3 text-base tabular-nums outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:bg-slate-100" /></div>
        <p className="mt-2 text-xs leading-5 text-emerald-900">O modelo disponível registra uma proposta global por fornecedor. O conjunto de itens, unidades e quantidades permanece visível nesta proposta.</p>
        {totalIsValid ? <p className="mt-2 text-sm font-semibold text-emerald-950">Total a apresentar: {money.format(parsedValue)}</p> : null}
      </section>

      <footer className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-white pt-2 sm:flex-row"><button type="button" onClick={saveDraft} disabled={pending || !totalIsValid} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Salvando..." : "Salvar rascunho"}</button><button type="submit" disabled={pending || !totalIsValid} className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Enviando..." : "Apresentar cotação"}</button><Link href="/login" className="inline-flex h-10 items-center justify-center px-3 text-sm font-semibold text-slate-600 hover:underline">Trocar acesso</Link></footer>
    </form>
  );
}
