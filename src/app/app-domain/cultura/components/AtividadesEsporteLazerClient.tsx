"use client";

import { useDeferredValue, useState } from "react";
import { Eye, Search } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Activity = { id: string; nome: string; modalidade: string; publicoAlvo: string | null; startsAt: string; endsAt: string | null; status: string; active: boolean; space: { nome: string; tipo: string; asset: { nome: string; patrimonio: string; realEstate: { inscricao: string | null; endereco: string } | null } | null; realEstate: { inscricao: string | null; endereco: string } | null } | null; instructorName: string | null; agentName: string | null };
const PAGE_SIZE = 20;

export default function AtividadesEsporteLazerClient({ activities }: { activities: Activity[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Activity | null>(null);
  const term = useDeferredValue(search.trim().toLocaleLowerCase("pt-BR"));
  const statuses = Array.from(new Set(activities.map((activity) => activity.active ? activity.status : "Inativa"))).sort();
  const filtered = activities.filter((activity) => {
    const shownStatus = activity.active ? activity.status : "Inativa";
    return (!term || [activity.nome, activity.modalidade, activity.publicoAlvo ?? "", activity.space?.nome ?? "", activity.instructorName ?? "", activity.agentName ?? ""].some((value) => value.toLocaleLowerCase("pt-BR").includes(term))) && (!status || shownStatus === status);
  });
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return <>
    <ErpListFrame toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_11rem]"><label className="relative"><span className="sr-only">Buscar atividades</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar atividade, modalidade ou responsável..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-rose-600" /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>} summary={<p className="text-[11px] text-slate-500">{filtered.length} atividades encontradas</p>} pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="atividades" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">Identificação</th><th className="p-2">Categoria</th><th className="hidden p-2 md:table-cell">Responsável</th><th className="hidden p-2 lg:table-cell">Data</th><th className="p-2">Situação</th><th className="p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((activity) => <tr key={activity.id} className="h-9 hover:bg-slate-50"><td className="truncate p-2 font-semibold text-slate-900" title={activity.nome}>{activity.nome}</td><td className="truncate p-2">{activity.modalidade}</td><td className="hidden truncate p-2 md:table-cell">{activity.instructorName ?? activity.agentName ?? "-"}</td><td className="hidden whitespace-nowrap p-2 lg:table-cell">{new Date(activity.startsAt).toLocaleDateString("pt-BR")}</td><td className="p-2"><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">{activity.active ? activity.status : "Inativa"}</span></td><td className="p-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(activity)} title="Ver detalhes"><Eye className="size-3.5" /></Button></td></tr>)}{visible.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma atividade encontrada.</td></tr>}</tbody></table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent><DialogHeader><DialogTitle>{detail?.nome}</DialogTitle><DialogDescription>{detail?.modalidade} · {detail?.status}</DialogDescription></DialogHeader>{detail && <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs font-semibold text-slate-500">Público-alvo</dt><dd>{detail.publicoAlvo || "-"}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Período</dt><dd>{new Date(detail.startsAt).toLocaleDateString("pt-BR")}{detail.endsAt ? " a " + new Date(detail.endsAt).toLocaleDateString("pt-BR") : ""}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Espaço</dt><dd>{detail.space?.nome || "-"}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Responsáveis</dt><dd>{[detail.instructorName, detail.agentName].filter(Boolean).join(" · ") || "-"}</dd></div></dl>}<DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
