"use client";

import Link from "next/link";
import { useState } from "react";
import { EyeOff, Search } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { ErpStatusBadge, ErpTableContainer, ErpTableTd, ErpTableTh, ErpTableThead, ErpTableTr } from "@/components/app-ui/erp/ErpTable";

const PAGE_SIZE = 20;

type Ombudsman = {
  id: string; protocolNumber: string; type: string; subject: string; isAnonymous: boolean;
  isConfidential: boolean; status: string; createdAt: Date; person: { fullName: string } | null;
};

export default function OuvidoriaClient({ initialManifestacoes }: { initialManifestacoes: Ombudsman[]; canManage: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const filtered = initialManifestacoes.filter((item) => {
    const search = searchTerm.trim().toLowerCase();
    return (!search || item.protocolNumber.toLowerCase().includes(search) || item.subject.toLowerCase().includes(search) || item.person?.fullName.toLowerCase().includes(search)) && (!filterType || item.type === filterType);
  });
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const rows = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return <ErpListFrame
    toolbar={<div className="flex flex-col gap-2 sm:flex-row">
      <label className="relative max-w-md flex-1"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><span className="sr-only">Buscar manifestação</span><input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="Protocolo, assunto ou manifestante" className="h-7 w-full rounded border border-slate-300 bg-white py-1 pl-8 pr-2 text-xs outline-none focus:border-amber-600" /></label>
      <select value={filterType} onChange={(event) => { setFilterType(event.target.value); setPage(1); }} className="h-7 rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-amber-600"><option value="">Todos os tipos</option><option>Denúncia</option><option>Reclamação</option><option>Sugestão</option><option>Elogio</option></select>
    </div>}
    pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="manifestações" onPageChange={setPage} />}
  >
    <ErpTableContainer>
      <ErpTableThead><ErpTableTr><ErpTableTh className="w-[16%]">Protocolo</ErpTableTh><ErpTableTh className="w-[12%]">Tipo</ErpTableTh><ErpTableTh>Assunto</ErpTableTh><ErpTableTh className="hidden w-[18%] md:table-cell">Manifestante</ErpTableTh><ErpTableTh className="w-[12%]">Abertura</ErpTableTh><ErpTableTh className="w-[12%]">Situação</ErpTableTh><ErpTableTh className="w-12 text-right">Ações</ErpTableTh></ErpTableTr></ErpTableThead>
      <tbody>{rows.map((item) => {
        const requester = item.isAnonymous ? "Anônimo" : item.person?.fullName || "Identidade restrita";
        return <ErpTableTr key={item.id}><ErpTableTd className="font-semibold">{item.protocolNumber}</ErpTableTd><ErpTableTd>{item.type}</ErpTableTd><ErpTableTd title={item.subject}>{item.subject}</ErpTableTd><ErpTableTd className="hidden md:table-cell" title={requester}>{item.isAnonymous ? <span className="inline-flex items-center gap-1 italic"><EyeOff className="size-3.5" />Anônimo</span> : requester}</ErpTableTd><ErpTableTd>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</ErpTableTd><ErpTableTd><ErpStatusBadge variant={item.status === "Concluído" ? "success" : "warning"}>{item.status}</ErpStatusBadge></ErpTableTd><ErpTableTd className="text-right"><Link href={`/atendimento/ouvidoria/${item.id}`} className="font-semibold text-amber-700 hover:text-amber-800">Abrir</Link></ErpTableTd></ErpTableTr>;
      })}{rows.length === 0 && <ErpTableTr><ErpTableTd colSpan={7} className="text-center text-slate-500">Nenhuma manifestação encontrada.</ErpTableTd></ErpTableTr>}</tbody>
    </ErpTableContainer>
  </ErpListFrame>;
}
