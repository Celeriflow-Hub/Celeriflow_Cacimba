"use client";

import { useDeferredValue, useState } from "react";
import { Eye, FolderKanban, Search } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type CulturaProjetoListItem = {
  id: string; numero: string; nome: string; descricao: string | null; categoria: string; status: string; valorSolicitado: number | null; createdAt: string;
  agente: { nome: string; tipo: string; segmento: string; pessoaNome: string | null; empresaNome: string | null };
  appropriation: { id: string; code: string } | null; commitment: { id: string; number: string } | null; purchaseProcess: { id: string; number: string } | null; contract: { id: string; number: string } | null; documentCount: number;
};
const PAGE_SIZE = 20;
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const proponent = (project: CulturaProjetoListItem) => project.agente.pessoaNome ?? project.agente.empresaNome ?? project.agente.nome;

export default function CulturaProjetosClient({ projetos }: { projetos: CulturaProjetoListItem[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<CulturaProjetoListItem | null>(null);
  const deferred = useDeferredValue(search.trim().toLocaleLowerCase("pt-BR"));
  const categories = Array.from(new Set(projetos.map((project) => project.categoria))).sort();
  const statuses = Array.from(new Set(projetos.map((project) => project.status))).sort();
  const filtered = projetos.filter((project) => (!deferred || [project.numero, project.nome, project.descricao ?? "", proponent(project)].some((value) => value.toLocaleLowerCase("pt-BR").includes(deferred))) && (category === "todas" || project.categoria === category) && (status === "todos" || project.status === status));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3">
    <PageHeader title="Fomento e Projetos" icon={<FolderKanban className="size-4 text-indigo-600" />} />
    <ErpListFrame toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_10rem_10rem]"><label className="relative"><span className="sr-only">Buscar projetos</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar projeto, número ou responsável..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-indigo-600" /></label><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="todas">Todas as categorias</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="todos">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>} summary={<p className="text-[11px] text-slate-500">{filtered.length} projetos encontrados</p>} pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="projetos" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">Identificação</th><th className="p-2">Categoria</th><th className="hidden p-2 md:table-cell">Responsável</th><th className="hidden p-2 lg:table-cell">Data</th><th className="p-2">Situação</th><th className="p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((project) => <tr key={project.id} className="h-9 hover:bg-slate-50"><td className="truncate p-2 font-semibold text-slate-900" title={project.nome}>{project.numero} · {project.nome}</td><td className="truncate p-2">{project.categoria}</td><td className="hidden truncate p-2 md:table-cell">{proponent(project)}</td><td className="hidden whitespace-nowrap p-2 lg:table-cell">{new Date(project.createdAt).toLocaleDateString("pt-BR")}</td><td className="p-2"><span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700">{project.status}</span></td><td className="p-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(project)} title="Ver detalhes"><Eye className="size-3.5" /></Button></td></tr>)}{visible.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhum projeto encontrado.</td></tr>}</tbody></table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{detail?.nome}</DialogTitle><DialogDescription>{detail?.numero} · {detail?.categoria} · {detail?.status}</DialogDescription></DialogHeader>{detail && <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs font-semibold text-slate-500">Responsável</dt><dd>{proponent(detail)}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Valor solicitado</dt><dd>{detail.valorSolicitado === null ? "Não informado" : currency.format(detail.valorSolicitado)}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Documentos</dt><dd>{detail.documentCount}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Vínculos</dt><dd>{[detail.appropriation?.code, detail.commitment?.number, detail.purchaseProcess?.number, detail.contract?.number].filter(Boolean).join(" · ") || "Sem vínculos"}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">Descrição</dt><dd className="mt-1 whitespace-pre-wrap break-words">{detail.descricao || "Sem descrição."}</dd></div></dl>}<DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </PageFrame>;
}
