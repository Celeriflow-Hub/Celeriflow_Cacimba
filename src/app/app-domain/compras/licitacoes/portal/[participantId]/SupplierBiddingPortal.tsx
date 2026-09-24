"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockKeyhole, Send, Timer } from "lucide-react";
import { submitBiddingBid } from "../../actions";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

type SupplierBiddingPortalProps = {
  participantId: string;
  supplierName: string;
  participantLabel: string;
  bidding: {
    number: string;
    modality: string;
    status: string;
    deadline: string | null;
    processNumber: string;
    object: string;
  };
  lots: Array<{
    id: string;
    number: number;
    description: string | null;
    status: string;
    estimatedValue: string | null;
    eligibility: { status: string; reason: string | null } | null;
    canSubmit: boolean;
    items: Array<{ id: string; label: string; quantity: number; unit: string }>;
    bids: Array<{ id: string; sequence: number; totalValue: string; status: string; submittedAt: string }>;
  }>;
};

function parseMoney(value: string) {
  const normalized = value.trim();
  if (!normalized) return Number.NaN;
  return Number(normalized.includes(",") ? normalized.replace(/\./g, "").replace(",", ".") : normalized);
}

function newIdempotencyKey() {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function SupplierBiddingPortal({ participantId, supplierName, participantLabel, bidding, lots }: SupplierBiddingPortalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>({});
  const [idempotencyKeys, setIdempotencyKeys] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function submitLot(lotId: string) {
    const totalValue = parseMoney(values[lotId] || "");
    if (!Number.isFinite(totalValue) || totalValue <= 0) {
      setNotice("");
      setError("Informe um valor total maior que zero para apresentar o lance.");
      return;
    }
    const idempotencyKey = idempotencyKeys[lotId] || newIdempotencyKey();
    if (!idempotencyKeys[lotId]) setIdempotencyKeys((current) => ({ ...current, [lotId]: idempotencyKey }));
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        const result = await submitBiddingBid({ participantId, biddingLotId: lotId, totalValue, idempotencyKey });
        if (!result.success) {
          setError(result.error);
          return;
        }
        setIdempotencyKeys((current) => {
          const next = { ...current };
          delete next[lotId];
          return next;
        });
        setValues((current) => ({ ...current, [lotId]: "" }));
        setNotice(result.alreadySubmitted ? "O lance já havia sido recebido e foi confirmado." : "Lance apresentado com sucesso.");
        router.refresh();
      } catch {
        setError("Não foi possível apresentar o lance. Tente novamente com a mesma sessão.");
      }
    });
  }

  return (
    <main className="mx-auto min-h-[calc(100dvh-5rem)] w-full max-w-5xl px-4 py-6 sm:py-8">
      <header className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm font-bold text-slate-900">Portal do Fornecedor</p><h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Licitação {bidding.number}</h1><p className="mt-1 text-sm text-slate-600">{bidding.modality} · Processo {bidding.processNumber}</p></div>
        <Link href="/compras/licitacoes/portal" className="text-sm font-semibold text-emerald-800 hover:underline">Minhas participações</Link>
      </header>

      {error ? <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {notice ? <p role="status" className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p> : null}

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fornecedor</p><p className="mt-1 text-sm font-semibold text-slate-900">{supplierName}</p><p className="mt-1 text-xs text-slate-600">{participantLabel}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objeto</p><p className="mt-1 text-sm text-slate-800">{bidding.object}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prazo para lances</p><p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900"><Timer className="size-4 text-amber-700" />{bidding.deadline ? dateTime.format(new Date(bidding.deadline)) : "Não definido"}</p><p className="mt-1 text-xs text-slate-600">Situação: {bidding.status}</p></div></div>
      </section>

      <div className="space-y-4">
        {lots.map((lot) => {
          const parsedValue = parseMoney(values[lot.id] || "");
          const validValue = Number.isFinite(parsedValue) && parsedValue > 0;
          const eligible = lot.eligibility?.status === "Habilitado";
          return <section key={lot.id} className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-base font-semibold text-slate-950">Lote {lot.number}{lot.description ? ` · ${lot.description}` : ""}</h2><p className="mt-1 text-sm text-slate-600">{lot.items.map((item) => `${item.label} (${item.quantity} ${item.unit})`).join(" · ")}</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{lot.status}</Badge><Badge variant={eligible ? "secondary" : "outline"}>{lot.eligibility?.status || "Sem habilitação"}</Badge></div></div><div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meus lances</p>{lot.bids.length ? <div className="mt-2 space-y-2">{lot.bids.map((bid) => <div key={bid.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"><span>Lance #{bid.sequence} · {bid.status}</span><span className="font-semibold tabular-nums">{currency.format(Number(bid.totalValue))}</span><time className="text-xs text-slate-500">{dateTime.format(new Date(bid.submittedAt))}</time></div>)}</div> : <p className="mt-2 text-sm text-slate-600">Nenhum lance apresentado para este lote.</p>}</div><div className={`rounded-md border p-3 ${lot.canSubmit && eligible ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><p className="text-sm font-semibold text-slate-900">Apresentar lance</p>{lot.canSubmit && eligible ? <><label className="mt-3 block text-sm font-medium text-slate-800" htmlFor={`bid-${lot.id}`}>Valor total do lote</label><div className="mt-1 flex items-center gap-2"><span className="text-sm font-semibold text-emerald-900">R$</span><Input id={`bid-${lot.id}`} inputMode="decimal" value={values[lot.id] || ""} onChange={(event) => setValues((current) => ({ ...current, [lot.id]: event.target.value }))} placeholder="0,00" disabled={pending} /></div>{validValue ? <p className="mt-2 text-sm font-semibold text-emerald-950">Total: {currency.format(parsedValue)}</p> : <p className="mt-2 text-xs text-emerald-900">Informe o valor global com até duas casas decimais.</p>}<Button type="button" className="mt-3 w-full" disabled={pending || !validValue} onClick={() => submitLot(lot.id)}>{pending ? "Enviando..." : <><Send className="size-4" />Apresentar lance</>}</Button></> : <div className="mt-3 flex gap-2 text-sm text-slate-600"><LockKeyhole className="mt-0.5 size-4 shrink-0" /><p>{!eligible ? lot.eligibility?.reason || "A habilitação deste lote ainda não foi concedida." : "A disputa ou o prazo deste lote não está disponível para lances."}</p></div>}</div></div></section>;
        })}
      </div>
      {!lots.length ? <section className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">Não há lotes disponíveis para esta participação.</section> : null}
    </main>
  );
}
