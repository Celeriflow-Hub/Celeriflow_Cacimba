"use client";
import { useState, useTransition } from "react";
import { Landmark } from "lucide-react";
import { createEstimateAction, importMovementsAction, importRepasseAction, markNotificationReadAction, notifyCorrectionAction, processCompetencyAction, resolveCrossCheckAction, seedScenarioAction, upsertAccountantAction, upsertCompanyAction, upsertRuleAction } from "./actions";
const input = "h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900";
const button = "inline-flex h-8 items-center justify-center rounded-md bg-emerald-600 px-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50";
const ghost = "inline-flex h-7 items-center justify-center rounded-md bg-slate-100 px-2 text-[11px] font-semibold dark:bg-slate-900";
const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
type Data = {
  exercises: { id: string; year: number }[];
  exercise: { id: string; year: number };
  companies: { id: string; cnpj: string; corporateName: string; taxRegime: string | null; phone: string | null; email: string | null; accountant: { id: string; name: string } | null }[];
  rules: { id: string; cfop: string; cfopDescription: string | null; composesVaf: boolean; formula: string; formulaVersion: string; contrapartidaCfop: string | null; situation: string }[];
  imports: { id: string; kind: string; companyId: string; competency: string; version: string; fileName: string; status: string }[];
  results: { id: string; companyId: string; competency: string; sourceType: string; saidaElegivel: number; entradaElegivel: number; vafValue: number; participation: number; rank: number | null; company: { corporateName: string } }[];
  repasses: { id: string; competency: string; weekNumber: number | null; municipalValue: number; stateTotalValue: number }[];
  notifications: { id: string; companyId: string | null; type: string; title: string; competency: string | null; status: string }[];
  crossChecks: { id: string; companyId: string; competency: string; cfop: string; checkType: string; description: string; severity: string; status: string }[];
  protocols: { id: string; protocolNumber: string; companyId: string | null; documentType: string; competency: string; status: string }[];
  activities: { id: string; competency: string; activityType: string; title: string; status: string }[];
  reports: { ranking: { companyId: string; company: string; vaf: number; participation: number; rank: number }[]; total: number; evolution: { competency: string; value: number }[]; abc: { label: string; value: number; curve: string }[]; repasseTotal: number; byCfop: { cfop: string; saida: number; entrada: number; vaf: number }[]; simples: { company: string; competency: string; vaf: number }[]; openIssues: number };
};
export default function VafClient({ data }: { data: Data }) {
  const [tab, setTab] = useState("relatorios");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ cnpj: "", corporateName: "", cpfCnpj: "", accName: "", cfop: "5102", formula: "saida - entrada", competency: "202601", fileName: "efd.txt", saida: "15000", entrada: "9000", municipal: "1000", state: "50000" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const run = (fn: () => Promise<{ error?: string; summary?: string }>) => start(async () => {
    const r = await fn();
    setMsg(r.error ? `Erro: ${r.error}` : r.summary ?? "OK.");
  });
  const ex = data.exercise;
  const companyName = (id: string | null) => data.companies.find((c) => c.id === id)?.corporateName ?? id ?? "-";
  return <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-2.5">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div><h1 className="flex items-center gap-2 text-lg font-bold"><Landmark className="size-5 text-emerald-600" />VAF — Valor Adicionado Fiscal</h1>
        <p className="text-[11px] text-slate-500">Exercício {ex.year} · importar → cruzar → apurar → ranking/evolução → repasses · EFD/GIA mesclados sem duplicar.</p></div>
      <div className="flex gap-2">
        <select className={input} style={{ maxWidth: 130 }} defaultValue={ex.year} onChange={(e) => { window.location.href = `/tributacao/vaf?year=${e.target.value}`; }}>{data.exercises.map((e) => <option key={e.id} value={e.year}>{e.year}</option>)}</select>
        <button className={button} disabled={pending} onClick={() => run(seedScenarioAction)}>Rodar cenário A/B</button>
      </div>
    </header>
    {msg && <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-800">{msg}</p>}
    <nav className="flex flex-wrap gap-1">{[["relatorios", "Relatórios"], ["empresas", "Empresas/Contador"], ["regras", "CFOP/Regras"], ["importacoes", "Importações"], ["cruzamentos", "Cruzamentos"]].map(([k, l]) => <button key={k} className={tab === k ? button : ghost} onClick={() => setTab(k)}>{l}</button>)}</nav>
    <main className="grid min-h-0 flex-1 content-start gap-2 overflow-auto">
      {tab === "relatorios" && <>
        <div className="grid gap-2 sm:grid-cols-4">{[
          ["VAF total", money(data.reports.total), `${data.reports.ranking.length} empresas`],
          ["Repasses municipal", money(data.reports.repasseTotal), `${data.repasses.length} lotes`],
          ["Inconsistências abertas", String(data.reports.openIssues), "EFD x GIA"],
          ["Cenário A/B", "A 60% · B 40%", "15000−9000=6000 · 4000"],
        ].map(([l, v, s]) => <div key={l} className="rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-[10px] uppercase text-slate-500">{l}</p><p className="text-lg font-bold">{v}</p><p className="text-[10px] text-slate-500">{s}</p></div>)}</div>
        <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>Ranking por VAF</b>{data.reports.ranking.map((r) => <div key={r.companyId} className="grid grid-cols-[1fr_110px_70px_50px] gap-2 border-t py-1"><span>{r.rank}º {r.company}</span><span className="text-right">{money(r.vaf)}</span><span className="text-right">{r.participation}%</span><span className="text-right">{data.reports.abc.find((a) => a.label === r.company)?.curve}</span></div>)}</section>
        <div className="grid gap-2 xl:grid-cols-2">
          <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>Evolução (valores absolutos)</b>{data.reports.evolution.map((e) => <div key={e.competency} className="flex justify-between border-t py-1"><span>{e.competency}</span><span>{money(e.value)}</span></div>)}</section>
          <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>Por CFOP (EFD/GIA entregues)</b>{data.reports.byCfop.map((c) => <div key={c.cfop} className="flex justify-between border-t py-1"><span>{c.cfop}</span><span>saída {money(c.saida)} · entrada {money(c.entrada)} · VAF {money(c.vaf)}</span></div>)}</section>
          <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>Simples Nacional</b>{data.reports.simples.slice(0, 20).map((s, i) => <div key={i} className="flex justify-between border-t py-1"><span>{s.company} · {s.competency}</span><span>{money(s.vaf)}</span></div>)}</section>
          <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>Repasses por competência</b>{data.repasses.slice(0, 20).map((r) => <div key={r.id} className="flex justify-between border-t py-1"><span>{r.competency}{r.weekNumber ? ` S${r.weekNumber}` : ""}</span><span>{money(Number(r.municipalValue))} / {money(Number(r.stateTotalValue))}</span></div>)}</section>
        </div>
      </>}
      {tab === "empresas" && <div className="grid gap-2 xl:grid-cols-2">
        <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>Empresas e carteira do contador</b>{data.companies.map((c) => <div key={c.id} className="border-t py-1"><p><b>{c.corporateName}</b> · {c.cnpj} · {c.taxRegime ?? "-"} · {c.phone ?? "-"} · {c.email ?? "-"}</p><p className="text-slate-500">Contador: {c.accountant?.name ?? "sem vínculo"}</p></div>)}
          <div className="mt-2 grid grid-cols-2 gap-1"><input className={input} placeholder="CNPJ" value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} /><input className={input} placeholder="Razão social" value={form.corporateName} onChange={(e) => set("corporateName", e.target.value)} /></div>
          <button className={button} disabled={pending} onClick={() => run(() => upsertCompanyAction({ cnpj: form.cnpj, corporateName: form.corporateName }))}>Salvar empresa</button></section>
        <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>Contador</b>
          <div className="grid grid-cols-2 gap-1"><input className={input} placeholder="CPF/CNPJ" value={form.cpfCnpj} onChange={(e) => set("cpfCnpj", e.target.value)} /><input className={input} placeholder="Nome" value={form.accName} onChange={(e) => set("accName", e.target.value)} /></div>
          <button className={button} disabled={pending} onClick={() => run(() => upsertAccountantAction({ cpfCnpj: form.cpfCnpj, name: form.accName }))}>Salvar contador</button>
          <div className="mt-2"><b>Protocolos e histórico</b>{data.protocols.slice(0, 20).map((p) => <div key={p.id} className="border-t py-1">{p.protocolNumber} · {p.documentType} · {p.competency} · {companyName(p.companyId)} · {p.status}</div>)}</div>
          <div className="mt-2"><b>Atividades</b>{data.activities.slice(0, 20).map((a) => <div key={a.id} className="border-t py-1">{a.competency} · {a.activityType} · {a.title} · {a.status}</div>)}</div></section>
      </div>}
      {tab === "regras" && <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>CFOP / contrapartida / fórmula / vigência / versão</b>
        {data.rules.map((r) => <div key={r.id} className="border-t py-1">{r.cfop} · {r.cfopDescription ?? ""} · fórmula <code>{r.formula}</code> v{r.formulaVersion} · contrapartida {r.contrapartidaCfop ?? "-"} · VAF {r.composesVaf ? "sim" : "não"} · {r.situation}</div>)}
        <div className="mt-2 grid grid-cols-4 gap-1"><input className={input} placeholder="CFOP" value={form.cfop} onChange={(e) => set("cfop", e.target.value)} /><input className={input} placeholder="Fórmula (saida - entrada)" value={form.formula} onChange={(e) => set("formula", e.target.value)} /><input className={input} type="date" defaultValue="2026-01-01" id="vaf-from" /><button className={button} disabled={pending} onClick={() => run(() => upsertRuleAction({ exerciseId: ex.id, cfop: form.cfop, formula: form.formula, effectiveFrom: (document.getElementById("vaf-from") as HTMLInputElement).value }))}>Salvar regra</button></div></section>}
      {tab === "importacoes" && <div className="grid gap-2 xl:grid-cols-2">
        <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>EFD / GIA por competência (não soma fontes)</b>
          <div className="grid grid-cols-4 gap-1"><input className={input} placeholder="Competência AAAAMM" value={form.competency} onChange={(e) => set("competency", e.target.value)} /><input className={input} placeholder="Arquivo" value={form.fileName} onChange={(e) => set("fileName", e.target.value)} /><input className={input} placeholder="Saídas" value={form.saida} onChange={(e) => set("saida", e.target.value)} /><input className={input} placeholder="Entradas" value={form.entrada} onChange={(e) => set("entrada", e.target.value)} /></div>
          <div className="mt-1 flex gap-1">{data.companies.slice(0, 4).map((c) => <span key={c.id} className="flex gap-1"><button className={ghost} disabled={pending} onClick={() => run(() => importMovementsAction("EFD", { companyId: c.id, exerciseId: ex.id, competency: form.competency, fileName: form.fileName, movements: [{ cfop: "5102", operationType: "SAIDA", value: Number(form.saida) }, { cfop: "1102", operationType: "ENTRADA", value: Number(form.entrada) }] }))}>EFD {c.corporateName.slice(0, 10)}</button><button className={ghost} disabled={pending} onClick={() => run(() => importMovementsAction("GIA", { companyId: c.id, exerciseId: ex.id, competency: form.competency, fileName: form.fileName, movements: [{ cfop: "5102", operationType: "SAIDA", value: Number(form.saida) }, { cfop: "1102", operationType: "ENTRADA", value: Number(form.entrada) }] }))}>GIA</button></span>)}</div>
          <button className={button} disabled={pending} onClick={() => run(() => processCompetencyAction({ exerciseId: ex.id, competency: form.competency }))}>Cruzar e apurar {form.competency}</button>
          <div className="mt-2">{data.imports.slice(0, 30).map((i) => <div key={i.id} className="border-t py-1">{i.kind} · {companyName(i.companyId)} · {i.competency} v{i.version} · {i.fileName} · {i.status}</div>)}</div></section>
        <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>Repasses e índices</b>
          <div className="grid grid-cols-3 gap-1"><input className={input} placeholder="Municipal" value={form.municipal} onChange={(e) => set("municipal", e.target.value)} /><input className={input} placeholder="Estado" value={form.state} onChange={(e) => set("state", e.target.value)} /><button className={button} disabled={pending} onClick={() => run(() => importRepasseAction({ exerciseId: ex.id, competency: form.competency, municipalValue: Number(form.municipal), stateTotalValue: Number(form.state) }))}>Importar repasse</button></div>
          <div className="mt-2"><b>Resultados apurados</b>{data.results.slice(0, 30).map((r) => <div key={r.id} className="border-t py-1">{r.company.corporateName} · {r.competency} · saída {money(Number(r.saidaElegivel))} − entrada {money(Number(r.entradaElegivel))} = <b>{money(Number(r.vafValue))}</b> · {Number(r.participation)}% · #{r.rank}</div>)}</div>
          <button className={ghost} disabled={pending} onClick={() => run(() => createEstimateAction({ exerciseId: ex.id, competency: form.competency, method: "LINEAR", realizedMonths: 3, realizedValue: 3000 }))}>Gerar estimativa anual (3 meses)</button></section>
      </div>}
      {tab === "cruzamentos" && <div className="grid gap-2 xl:grid-cols-2">
        <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>EFD x GIA · diferenças · omissos · inconsistências</b>{data.crossChecks.slice(0, 40).map((c) => <div key={c.id} className="border-t py-1"><p>{c.checkType} · CFOP {c.cfop} · {companyName(c.companyId)} · {c.competency} · {c.severity} · {c.status}</p><p className="text-slate-500">{c.description}</p><div className="flex gap-1"><button className={ghost} disabled={pending} onClick={() => run(() => resolveCrossCheckAction(c.id, "CORRIGIDA"))}>Corrigir</button><button className={ghost} disabled={pending} onClick={() => run(() => resolveCrossCheckAction(c.id, "IGNORADA"))}>Ignorar</button></div></div>)}</section>
        <section className="rounded-lg border bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-950"><b>Notificações</b>{data.notifications.slice(0, 30).map((n) => <div key={n.id} className="border-t py-1"><p><b>{n.type}</b> · {n.title} · {companyName(n.companyId)} · {n.status}</p><button className={ghost} disabled={pending} onClick={() => run(() => markNotificationReadAction(n.id))}>Marcar lida</button></div>)}
          <div className="mt-2"><b>Notificar correção</b>{data.companies.slice(0, 3).map((c) => <button key={c.id} className={ghost} disabled={pending} onClick={() => run(() => notifyCorrectionAction({ companyId: c.id, exerciseId: ex.id, competency: form.competency, title: "Corrigir divergência EFD x GIA", content: "Apresentar declaração retificadora para a competência." }))}>Notificar {c.corporateName.slice(0, 12)}</button>)}</div></section>
      </div>}
    </main>
  </div>;
}
