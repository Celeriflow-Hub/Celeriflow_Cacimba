"use client";

import { useState } from "react";
import { BookOpenCheck, LockKeyhole, Send, TriangleAlert } from "lucide-react";
import { authorizeMonthClose, authorizeMonthReopen, finalizeAnnualClose, postManualAccountingTransaction, prepareAnnualClose, requestMonthClose, requestMonthReopen, savePostingRule } from "./actions";

type Props = { years: { id: string; year: number; status: string }[]; accounts: { id: string; code: string; name: string }[]; transactions: { id: string; date: string; history: string; status: string; entries: { id: string; type: string; value: string; account: string }[] }[]; trialBalance: { account: string; debit: string; credit: string; balance: string }[]; monthlyCloses: { id: string; year: number; competence: string; status: string; closedAt?: string; events: { id: string; action: string; justification?: string | null; requestedBy: string; authorizedBy?: string; requestedAt: string; authorizedAt?: string }[] }[]; annualCloses: { id: string; year: number; status: string; closedBy?: string; closedAt?: string }[] };
const currency = (value: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

export default function ContabilidadeClient({ years, accounts, transactions, trialBalance, monthlyCloses, annualCloses }: Props) {
  const currentYear = years.find((year) => year.status === "Aberto") ?? years[0];
  const [notice, setNotice] = useState<string>();
  const [posting, setPosting] = useState({ financialYearId: currentYear?.id ?? "", date: new Date().toISOString().slice(0, 10), history: "", debitAccountId: accounts[0]?.id ?? "", creditAccountId: accounts[1]?.id ?? accounts[0]?.id ?? "", value: 0 });
  const [competence, setCompetence] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [reopenJustification, setReopenJustification] = useState("");
  const [rule, setRule] = useState({ eventCode: "", eventName: "", debitAccountId: accounts[0]?.id ?? "", creditAccountId: accounts[1]?.id ?? accounts[0]?.id ?? "" });

  async function submitPosting(event: React.FormEvent) {
    event.preventDefault();
    const result = await postManualAccountingTransaction(posting);
    setNotice(result.error ?? "Partida contabil postada e balanceada.");
  }
  async function submitCloseRequest() {
    if (!posting.financialYearId) return;
    const result = await requestMonthClose({ financialYearId: posting.financialYearId, competence });
    setNotice(result.error ?? "Fechamento mensal solicitado para autorizacao.");
  }
  async function submitCloseAuthorization() {
    if (!posting.financialYearId) return;
    const result = await authorizeMonthClose({ financialYearId: posting.financialYearId, competence });
    setNotice(result.error ?? "Fechamento mensal autorizado.");
  }
  async function submitReopenRequest() {
    if (!posting.financialYearId) return;
    const result = await requestMonthReopen({ financialYearId: posting.financialYearId, competence, justification: reopenJustification });
    setNotice(result.error ?? "Reabertura mensal solicitada para autorizacao.");
  }
  async function submitReopenAuthorization() {
    if (!posting.financialYearId) return;
    const result = await authorizeMonthReopen({ financialYearId: posting.financialYearId, competence });
    setNotice(result.error ?? "Reabertura mensal autorizada.");
  }
  async function submitAnnualClose() {
    if (!posting.financialYearId) return;
    const result = await prepareAnnualClose(posting.financialYearId);
    setNotice(result.error ?? "Encerramento anual preparado para validacao de saldos e restos a pagar.");
  }
  async function submitFinalAnnualClose() {
    if (!posting.financialYearId) return;
    const result = await finalizeAnnualClose(posting.financialYearId);
    setNotice(result.error ?? "Exercicio encerrado definitivamente.");
  }

  return <div className="h-full min-h-0 overflow-y-auto px-1 py-1 sm:px-2 [&>*+*]:mt-2">
    <header className="flex gap-2 border-b border-slate-300 bg-white px-3 py-2 shadow-sm"><BookOpenCheck className="mt-0.5 size-4 text-emerald-700" /><div><h1 className="text-sm font-bold tracking-tight text-slate-900">Contabilidade e Fechamento</h1><p className="text-xs text-slate-500">Postagem interna balanceada. Nenhum demonstrativo oficial e gerado nesta tela.</p></div></header>
    {notice && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex gap-2"><TriangleAlert className="w-4 h-4 mt-0.5" />{notice}</div>}
    <div className="grid gap-2 lg:grid-cols-2">
      <form onSubmit={submitPosting} className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
        <h2 className="font-bold text-slate-800">Nova partida manual</h2>
        <select required value={posting.financialYearId} onChange={(event) => setPosting({ ...posting, financialYearId: event.target.value })} className="w-full border rounded-lg p-2 text-sm"><option value="">Exercicio</option>{years.map((year) => <option key={year.id} value={year.id}>{year.year} - {year.status}</option>)}</select>
        <div className="grid sm:grid-cols-2 gap-3"><input required type="date" value={posting.date} onChange={(event) => setPosting({ ...posting, date: event.target.value })} className="border rounded-lg p-2 text-sm" /><input required min="0.01" step="0.01" type="number" placeholder="Valor" value={posting.value || ""} onChange={(event) => setPosting({ ...posting, value: Number(event.target.value) })} className="border rounded-lg p-2 text-sm" /></div>
        <input required placeholder="Historico" value={posting.history} onChange={(event) => setPosting({ ...posting, history: event.target.value })} className="w-full border rounded-lg p-2 text-sm" />
        <div className="grid sm:grid-cols-2 gap-3"><select required value={posting.debitAccountId} onChange={(event) => setPosting({ ...posting, debitAccountId: event.target.value })} className="border rounded-lg p-2 text-sm"><option value="">Conta de debito</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}</select><select required value={posting.creditAccountId} onChange={(event) => setPosting({ ...posting, creditAccountId: event.target.value })} className="border rounded-lg p-2 text-sm"><option value="">Conta de credito</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}</select></div>
        <button className="bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-semibold flex gap-2"><Send className="w-4 h-4" />Postar debito = credito</button>
      </form>
       <section className="space-y-3 rounded-md bg-slate-900 p-3 text-slate-100"><h2 className="font-bold">Controles de fechamento</h2><p className="text-sm text-slate-300">Fechamentos e reaberturas exigem solicitante e autorizador distintos. A reabertura preserva a evidencia do fechamento anterior.</p><input type="date" value={competence} onChange={(event) => setCompetence(event.target.value)} className="w-full rounded-lg p-2 text-sm text-slate-900" /><div className="flex flex-wrap gap-2"><button onClick={submitCloseRequest} className="bg-white text-slate-900 rounded-lg px-3 py-2 text-sm font-semibold flex gap-2"><LockKeyhole className="w-4 h-4" />Solicitar fechamento</button><button onClick={submitCloseAuthorization} className="border border-slate-500 rounded-lg px-3 py-2 text-sm font-semibold">Autorizar fechamento</button></div><textarea required value={reopenJustification} onChange={(event) => setReopenJustification(event.target.value)} placeholder="Justificativa obrigatoria para reabertura" className="min-h-20 w-full rounded-lg p-2 text-sm text-slate-900" /><div className="flex flex-wrap gap-2"><button onClick={submitReopenRequest} className="border border-amber-300 text-amber-100 rounded-lg px-3 py-2 text-sm font-semibold">Solicitar reabertura</button><button onClick={submitReopenAuthorization} className="border border-slate-500 rounded-lg px-3 py-2 text-sm font-semibold">Autorizar reabertura</button></div><div className="flex flex-wrap gap-2 border-t border-slate-700 pt-3"><button onClick={submitAnnualClose} className="border border-slate-500 rounded-lg px-3 py-2 text-sm font-semibold">Preparar anual e restos</button><button onClick={submitFinalAnnualClose} className="bg-emerald-700 rounded-lg px-3 py-2 text-sm font-semibold">Encerramento anual final</button></div></section>
      <form onSubmit={async (event) => { event.preventDefault(); const result = await savePostingRule(rule); setNotice(result.error ?? "Regra contabil interna salva."); }} className="space-y-3 rounded-md border border-slate-200 bg-white p-3"><h2 className="font-bold text-slate-800">Catalogo de evento e regra</h2><div className="grid gap-2 sm:grid-cols-2"><input required placeholder="Codigo do evento" value={rule.eventCode} onChange={(event) => setRule({ ...rule, eventCode: event.target.value })} className="border rounded-lg p-2 text-sm" /><input required placeholder="Nome do evento" value={rule.eventName} onChange={(event) => setRule({ ...rule, eventName: event.target.value })} className="border rounded-lg p-2 text-sm" /></div><div className="grid gap-2 sm:grid-cols-2"><select required value={rule.debitAccountId} onChange={(event) => setRule({ ...rule, debitAccountId: event.target.value })} className="border rounded-lg p-2 text-sm">{accounts.map((account) => <option key={account.id} value={account.id}>D: {account.code}</option>)}</select><select required value={rule.creditAccountId} onChange={(event) => setRule({ ...rule, creditAccountId: event.target.value })} className="border rounded-lg p-2 text-sm">{accounts.map((account) => <option key={account.id} value={account.id}>C: {account.code}</option>)}</select></div><button className="bg-slate-800 text-white rounded-lg px-3 py-2 text-sm font-semibold">Salvar regra</button><p className="text-xs text-slate-500">Eventos configurados podem ser postados pelo servico com uma unica regra ativa.</p></form>
    </div>
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="p-4 border-b font-bold text-slate-800">Historico de fechamentos mensais</div><div className="divide-y">{monthlyCloses.map((close) => <div key={close.id} className="p-4 space-y-2"><div className="flex justify-between gap-3"><span className="font-semibold">{new Date(close.competence).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}</span><span className="text-xs text-slate-500">{close.status}</span></div>{close.events.map((event) => <div key={event.id} className="text-sm text-slate-600"><span className="font-medium">{event.action}</span> solicitado por {event.requestedBy} em {new Date(event.requestedAt).toLocaleString("pt-BR")}{event.authorizedBy && <>; autorizado por {event.authorizedBy}{event.authorizedAt && ` em ${new Date(event.authorizedAt).toLocaleString("pt-BR")}`}</>}{event.justification && <p className="text-slate-500">Justificativa: {event.justification}</p>}</div>)}</div>)}{!monthlyCloses.length && <p className="p-6 text-sm text-slate-500">Nenhum fechamento mensal registrado.</p>}</div></section>
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="p-4 border-b font-bold text-slate-800">Encerramentos anuais</div><div className="divide-y">{annualCloses.map((close) => <div key={close.id} className="p-4 text-sm flex justify-between gap-3"><span>{close.year} - {close.status}</span><span className="text-slate-500">{close.closedBy ? `${close.closedBy}${close.closedAt ? ` em ${new Date(close.closedAt).toLocaleString("pt-BR")}` : ""}` : "Sem fechamento final"}</span></div>)}{!annualCloses.length && <p className="p-6 text-sm text-slate-500">Nenhum encerramento anual preparado.</p>}</div></section>
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="p-4 border-b font-bold text-slate-800">Balancete interno</div><div className="overflow-y-auto"><table className="w-full table-fixed text-xs"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Conta</th><th className="p-3 text-right">Debitos</th><th className="p-3 text-right">Creditos</th><th className="p-3 text-right">Saldo</th></tr></thead><tbody>{trialBalance.map((row) => <tr key={row.account} className="border-t"><td className="p-3">{row.account}</td><td className="p-3 text-right">{currency(row.debit)}</td><td className="p-3 text-right">{currency(row.credit)}</td><td className="p-3 text-right">{currency(row.balance)}</td></tr>)}{!trialBalance.length && <tr><td colSpan={4} className="p-6 text-center text-slate-500">Sem postagens no exercicio selecionado.</td></tr>}</tbody></table></div></section>
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="p-4 border-b font-bold text-slate-800">Diario interno recente</div><div className="divide-y">{transactions.map((transaction) => <div key={transaction.id} className="p-4"><div className="flex justify-between gap-3"><span className="font-semibold">{transaction.history}</span><span className="text-xs text-slate-500">{new Date(transaction.date).toLocaleDateString("pt-BR")} · {transaction.status}</span></div><p className="text-sm text-slate-500 mt-1">{transaction.entries.map((entry) => `${entry.type}: ${entry.account} (${currency(entry.value)})`).join(" | ")}</p></div>)}{!transactions.length && <p className="p-6 text-sm text-slate-500">Nenhum lancamento contabil interno.</p>}</div></section>
  </div>;
}
