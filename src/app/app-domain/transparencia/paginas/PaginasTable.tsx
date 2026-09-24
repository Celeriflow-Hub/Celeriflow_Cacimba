"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Search, Trash2 } from "lucide-react";
import { deletePage } from "./actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PortalPage = { id: string; title: string; slug: string; content: string; status: string; updatedAt: string; section: string };
const PAGE_SIZE = 20;

export default function PaginasTable({ pages }: { pages: PortalPage[] }) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<PortalPage | null>(null);
  const router = useRouter();
  const sections = Array.from(new Set(pages.map((item) => item.section))).sort();
  const statuses = Array.from(new Set(pages.map((item) => item.status))).sort();
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = pages.filter((item) => (!term || [item.title, item.slug, item.content].some((value) => value.toLocaleLowerCase("pt-BR").includes(term))) && (!section || item.section === section) && (!status || item.status === status));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta página?")) startTransition(async () => { await deletePage(id); router.refresh(); });
  };

  return <>
    <ErpListFrame toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_10rem_10rem]"><label className="relative"><span className="sr-only">Buscar páginas</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar título, rota ou conteúdo..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-purple-600" /></label><select value={section} onChange={(event) => { setSection(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todas as seções</option>{sections.map((value) => <option key={value}>{value}</option>)}</select><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>} summary={<p className="text-[11px] text-slate-500">{filtered.length} páginas encontradas</p>} pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="páginas" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">Título</th><th className="p-2">Rota</th><th className="hidden p-2 sm:table-cell">Seção</th><th className="hidden w-24 p-2 md:table-cell">Atualização</th><th className="w-24 p-2">Situação</th><th className="w-20 p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((item) => <tr key={item.id} className="h-9 hover:bg-slate-50"><td className="max-w-0 p-2"><span className="block truncate font-medium text-slate-900" title={item.title}>{item.title}</span></td><td className="max-w-0 p-2"><span className="block truncate font-mono text-[11px]" title={`/portal/${item.slug}`}>/portal/{item.slug}</span></td><td className="hidden truncate p-2 capitalize sm:table-cell">{item.section}</td><td className="hidden whitespace-nowrap p-2 md:table-cell">{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</td><td className="p-2"><span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">{item.status}</span></td><td className="p-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(item)} title="Ver conteúdo"><Eye className="size-3.5" /></Button><button onClick={() => handleDelete(item.id)} disabled={isPending} className="inline-flex size-7 items-center justify-center rounded text-red-600 hover:bg-red-50 disabled:opacity-50" title="Excluir" aria-label={`Excluir ${item.title}`}><Trash2 className="size-3.5" /></button></td></tr>)}{visible.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma página encontrada.</td></tr>}</tbody></table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{detail?.title}</DialogTitle><DialogDescription>/portal/{detail?.slug} · {detail?.status}</DialogDescription></DialogHeader><div className="whitespace-pre-wrap break-words text-sm text-slate-700">{detail?.content}</div><DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
