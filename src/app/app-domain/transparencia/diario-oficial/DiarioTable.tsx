"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Search, Trash2 } from "lucide-react";
import { deleteDiary } from "./actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

type Diary = { id: string; editionNumber: number; publishDate: string; status: string; pdfUrl: string };
const PAGE_SIZE = 20;

export default function DiarioTable({ diaries }: { diaries: Diary[] }) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const router = useRouter();
  const statuses = Array.from(new Set(diaries.map((diary) => diary.status))).sort();
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = diaries.filter((diary) => (!term || [String(diary.editionNumber), diary.status, new Date(diary.publishDate).toLocaleDateString("pt-BR")].some((value) => value.toLocaleLowerCase("pt-BR").includes(term))) && (!status || diary.status === status));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta edição?")) startTransition(async () => { await deleteDiary(id); router.refresh(); });
  };

  return (
    <ErpListFrame toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_10rem]"><label className="relative"><span className="sr-only">Buscar edições</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar edição, data ou situação..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-emerald-600" /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>} summary={<p className="text-[11px] text-slate-500">{filtered.length} edições encontradas</p>} pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="edições" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">Edição</th><th className="p-2">Data</th><th className="hidden p-2 sm:table-cell">Tipo</th><th className="p-2">Situação</th><th className="hidden p-2 md:table-cell">Publicação</th><th className="w-20 p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((diary) => <tr key={diary.id} className="h-9 hover:bg-slate-50"><td className="truncate p-2 font-medium text-slate-900">Nº {diary.editionNumber}</td><td className="whitespace-nowrap p-2">{new Date(diary.publishDate).toLocaleDateString("pt-BR")}</td><td className="hidden truncate p-2 sm:table-cell">Edição regular</td><td className="p-2"><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">{diary.status}</span></td><td className="hidden max-w-0 p-2 md:table-cell"><span className="block truncate" title={diary.pdfUrl}>{diary.pdfUrl}</span></td><td className="p-2 text-right"><Link href={diary.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex size-7 items-center justify-center rounded hover:bg-blue-50" title="Ler PDF" aria-label={`Ler edição ${diary.editionNumber}`}><ExternalLink className="size-3.5" /></Link><button onClick={() => handleDelete(diary.id)} disabled={isPending} className="inline-flex size-7 items-center justify-center rounded text-red-600 hover:bg-red-50 disabled:opacity-50" title="Excluir" aria-label={`Excluir edição ${diary.editionNumber}`}><Trash2 className="size-3.5" /></button></td></tr>)}{visible.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma edição encontrada.</td></tr>}</tbody></table>
    </ErpListFrame>
  );
}
