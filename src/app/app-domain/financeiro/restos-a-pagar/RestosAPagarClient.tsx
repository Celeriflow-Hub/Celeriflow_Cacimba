"use client";

import { useState } from "react";
import { Ban, ClipboardList, History, Link2, RotateCcw } from "lucide-react";
import { cancelRap, reregisterRap, trackRapPayment } from "./actions";

type Year = { id: string; year: number; status: string };
type Payable = {
  id: string;
  financialYear: Year;
  originFinancialYear: { id: string; year: number };
  commitment: { id: string; number: string; history: string; supplierName: string };
  previousYear?: number;
  successorYear?: number;
  value: string;
  type: string;
  status: string;
  events: { id: string; action: string; justification?: string | null; value?: string; paymentOrderNumber?: string; actor: string; createdAt: string }[];
};
type Payment = { id: string; orderNumber: string; commitmentId: string; value: string; date: string };

const currency = (value: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
const typeLabel = (type: string) => type === "PROCESSADO" ? "Processado" : "Não processado";

export default function RestosAPagarClient({ payables, years, payments }: { payables: Payable[]; years: Year[]; payments: Payment[] }) {
  const [originYear, setOriginYear] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [notice, setNotice] = useState<string>();
  const [tracking, setTracking] = useState({ payableCarryForwardId: "", paymentId: "", value: "" });
  const visiblePayables = payables.filter((payable) => (originYear === "ALL" || payable.originFinancialYear.id === originYear) && (type === "ALL" || payable.type === type));
  const selectedPayable = payables.find((payable) => payable.id === tracking.payableCarryForwardId);
  const selectablePayments = selectedPayable
    ? payments.filter((payment) => payment.commitmentId === selectedPayable.commitment.id && new Date(payment.date) > new Date(`${selectedPayable.originFinancialYear.year}-12-31T23:59:59.999Z`))
    : [];

  async function submitTracking(event: React.FormEvent) {
    event.preventDefault();
    const result = await trackRapPayment({ ...tracking, value: Number(tracking.value) });
    setNotice(result.error ?? "Pagamento interno vinculado apenas ao histórico do RAP.");
    if (!result.error) setTracking({ payableCarryForwardId: "", paymentId: "", value: "" });
  }

  async function handleCancel(payableCarryForwardId: string) {
    const justification = window.prompt("Informe a justificativa obrigatória do cancelamento interno:");
    if (!justification?.trim()) return;
    const result = await cancelRap({ payableCarryForwardId, justification });
    setNotice(result.error ?? "Cancelamento registrado no histórico do RAP.");
  }

  async function handleReregister(payableCarryForwardId: string) {
    const availableYears = years.filter((year) => year.status === "Aberto").map((year) => `${year.year}`).join(", ");
    const targetYear = window.prompt(`Informe o ano aberto de destino para reinscrição (${availableYears || "nenhum disponível"}):`);
    if (!targetYear) return;
    const target = years.find((year) => year.year === Number(targetYear));
    if (!target) return setNotice("Informe um exercício de destino existente.");
    const justification = window.prompt("Informe a justificativa obrigatória da reinscrição interna:");
    if (!justification?.trim()) return;
    const result = await reregisterRap({ payableCarryForwardId, targetFinancialYearId: target.id, justification });
    setNotice(result.error ?? "Reinscrição registrada no histórico do RAP.");
  }

  return <div className="space-y-2 px-1 py-1 sm:px-2">
    <header className="flex gap-2 border-b border-slate-300 bg-white px-3 py-2 shadow-sm"><ClipboardList className="mt-0.5 size-4 text-emerald-700" /><div><h1 className="text-sm font-bold tracking-tight text-slate-900">Restos a Pagar</h1><p className="text-xs text-slate-500">Acompanhamento interno de RAP por tipo e exercício de origem. Não executa pagamento nem gera lançamento contábil.</p></div></header>
    {notice && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{notice}</div>}
    <div className="grid gap-2 lg:grid-cols-[1fr_1.35fr]">
      <section className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
        <h2 className="font-bold text-slate-800">Consulta</h2>
        <div className="grid gap-3 sm:grid-cols-2"><select value={originYear} onChange={(event) => setOriginYear(event.target.value)} className="rounded-lg border p-2 text-sm"><option value="ALL">Todos os anos de origem</option>{years.map((year) => <option key={year.id} value={year.id}>{year.year}</option>)}</select><select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border p-2 text-sm"><option value="ALL">Todos os tipos</option><option value="PROCESSADO">Processado</option><option value="NAO_PROCESSADO">Não processado</option></select></div>
        <p className="text-sm text-slate-500">{visiblePayables.length} registro(s) encontrado(s).</p>
      </section>
      <form onSubmit={submitTracking} className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
        <h2 className="font-bold text-slate-800">Vincular pagamento já efetivado</h2>
        <select required value={tracking.payableCarryForwardId} onChange={(event) => setTracking({ payableCarryForwardId: event.target.value, paymentId: "", value: "" })} className="w-full rounded-lg border p-2 text-sm"><option value="">Selecione o RAP pendente</option>{payables.filter((payable) => ["PENDENTE", "PAGAMENTO_PARCIAL_RASTREADO"].includes(payable.status)).map((payable) => <option key={payable.id} value={payable.id}>{payable.originFinancialYear.year} · {payable.commitment.number} · {typeLabel(payable.type)} · {currency(payable.value)}</option>)}</select>
        <div className="grid gap-3 sm:grid-cols-2"><select required disabled={!selectedPayable} value={tracking.paymentId} onChange={(event) => { const payment = selectablePayments.find((item) => item.id === event.target.value); setTracking({ ...tracking, paymentId: event.target.value, value: payment?.value ?? "" }); }} className="rounded-lg border p-2 text-sm"><option value="">Pagamento efetivado</option>{selectablePayments.map((payment) => <option key={payment.id} value={payment.id}>{payment.orderNumber} · {currency(payment.value)}</option>)}</select><input required min="0.01" step="0.01" type="number" value={tracking.value} onChange={(event) => setTracking({ ...tracking, value: event.target.value })} placeholder="Valor a acompanhar" className="rounded-lg border p-2 text-sm" /></div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"><Link2 className="w-4 h-4" />Registrar acompanhamento</button>
      </form>
    </div>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b p-4 font-bold text-slate-800">RAP inscritos e histórico</div><div className="divide-y">{visiblePayables.map((payable) => <article key={payable.id} className="p-4 space-y-3"><div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><p className="font-semibold text-slate-800">{payable.commitment.number} · {payable.commitment.supplierName}</p><p className="text-sm text-slate-500">Origem: {payable.originFinancialYear.year} · Registro: {payable.financialYear.year} · {typeLabel(payable.type)} · {currency(payable.value)}</p><p className="text-sm text-slate-500">{payable.commitment.history}</p>{payable.previousYear && <p className="text-xs text-slate-500">Reinscrito de {payable.previousYear}</p>}{payable.successorYear && <p className="text-xs text-slate-500">Reinscrito para {payable.successorYear}</p>}</div><span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{payable.status}</span></div>{["PENDENTE", "PAGAMENTO_PARCIAL_RASTREADO"].includes(payable.status) && <div className="flex flex-wrap gap-2"><button onClick={() => handleCancel(payable.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"><Ban className="w-3.5 h-3.5" />Cancelar interno</button>{payable.status === "PENDENTE" && <button onClick={() => handleReregister(payable.id)} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800"><RotateCcw className="w-3.5 h-3.5" />Reinscrever</button>}</div>}<div className="border-t pt-3"><p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500"><History className="w-3.5 h-3.5" />Histórico interno</p>{payable.events.map((event) => <div key={event.id} className="py-1 text-sm text-slate-600"><span className="font-medium">{event.action}</span>{event.value && ` · ${currency(event.value)}`}{event.paymentOrderNumber && ` · OP ${event.paymentOrderNumber}`} · {event.actor} em {new Date(event.createdAt).toLocaleString("pt-BR")}{event.justification && <span className="block text-slate-500">Justificativa: {event.justification}</span>}</div>)}{!payable.events.length && <p className="text-sm text-slate-500">Inscrição legada sem eventos de acompanhamento.</p>}</div></article>)}{!visiblePayables.length && <p className="p-8 text-center text-sm text-slate-500">Nenhum resto a pagar para os filtros selecionados.</p>}</div></section>
  </div>;
}
