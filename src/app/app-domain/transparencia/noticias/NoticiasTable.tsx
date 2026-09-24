"use client";
/* eslint-disable @next/next/no-img-element -- URLs são cadastradas pelo município e podem usar domínios externos. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Search, Trash2 } from "lucide-react";
import { deleteNews } from "./actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type News = { id: string; title: string; subtitle: string | null; content: string; imageUrl: string | null; status: string; publishedAt: string | null; createdAt: string; authorName: string | null; category: string };
const PAGE_SIZE = 20;

export default function NoticiasTable({ news }: { news: News[] }) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<News | null>(null);
  const router = useRouter();
  const categories = Array.from(new Set(news.map((item) => item.category))).sort();
  const statuses = Array.from(new Set(news.map((item) => item.status))).sort();
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = news.filter((item) => (!term || [item.title, item.subtitle || "", item.content, item.authorName || ""].some((value) => value.toLocaleLowerCase("pt-BR").includes(term))) && (!category || item.category === category) && (!status || item.status === status));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta notícia?")) startTransition(async () => { await deleteNews(id); router.refresh(); });
  };

  return <>
    <ErpListFrame toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_11rem_10rem]"><label className="relative"><span className="sr-only">Buscar notícias</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar título, texto ou autor..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-blue-600" /></label><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todas as categorias</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>} summary={<p className="text-[11px] text-slate-500">{filtered.length} notícias encontradas</p>} pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="notícias" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">Título</th><th className="hidden p-2 sm:table-cell">Categoria</th><th className="hidden w-24 p-2 md:table-cell">Publicação</th><th className="hidden p-2 lg:table-cell">Responsável</th><th className="w-24 p-2">Situação</th><th className="w-20 p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((item) => <tr key={item.id} className="h-9 hover:bg-slate-50"><td className="max-w-0 p-2"><span className="block truncate font-medium text-slate-900" title={item.title}>{item.title}</span></td><td className="hidden truncate p-2 sm:table-cell">{item.category}</td><td className="hidden whitespace-nowrap p-2 md:table-cell">{new Date(item.publishedAt || item.createdAt).toLocaleDateString("pt-BR")}</td><td className="hidden truncate p-2 lg:table-cell">{item.authorName || "Sem responsável"}</td><td className="p-2"><span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">{item.status}</span></td><td className="p-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(item)} title="Ver notícia"><Eye className="size-3.5" /></Button><button onClick={() => handleDelete(item.id)} disabled={isPending} className="inline-flex size-7 items-center justify-center rounded text-red-600 hover:bg-red-50 disabled:opacity-50" title="Excluir" aria-label={`Excluir ${item.title}`}><Trash2 className="size-3.5" /></button></td></tr>)}{visible.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma notícia encontrada.</td></tr>}</tbody></table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{detail?.title}</DialogTitle><DialogDescription>{detail?.category} · {detail?.authorName || "Sem responsável"} · {detail?.status}</DialogDescription></DialogHeader>{detail?.imageUrl && <div className="overflow-hidden rounded border border-slate-200 bg-slate-50"><img src={detail.imageUrl} alt={detail.title} className="max-h-64 w-full object-contain" /></div>}{detail?.subtitle && <p className="font-medium text-slate-800">{detail.subtitle}</p>}<div className="whitespace-pre-wrap break-words text-sm text-slate-700">{detail?.content}</div><DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
