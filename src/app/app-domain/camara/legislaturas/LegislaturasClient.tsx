"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Landmark, Search, Plus, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Legislatura = {
  id: string;
  numero: number;
  inicio: Date;
  fim: Date;
  status: string;
  descricao: string | null;
  _count: { vereadores: number };
};

export default function LegislaturasClient({ legislaturas }: { legislaturas: Legislatura[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [page, setPage] = useState(1);

  const filtered = legislaturas.filter(leg => 
    leg.numero.toString().includes(searchTerm) || 
    (leg.descricao && leg.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  ).filter((leg) => statusFilter === "Todos" || leg.status === statusFilter);
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3">
      <PageHeader
        title="Legislaturas"
        icon={<Landmark className="size-4 shrink-0 text-[#9333EA]" />}
        action={<button className="flex h-8 items-center gap-2 rounded-md bg-[#9333EA] px-3 text-sm font-medium text-white transition-colors hover:bg-[#7E22CE]"><Plus className="h-4 w-4" />Nova Legislatura</button>}
        className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white"
      />

      <ErpListFrame toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_10rem]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar legislatura..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#9333EA]/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option>Todos</option>{Array.from(new Set(legislaturas.map((item) => item.status))).map((item) => <option key={item}>{item}</option>)}</select>
        </div>} summary={<p className="text-[11px] text-slate-500">{filtered.length} legislaturas encontradas</p>} pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="legislaturas" onPageChange={setPage} />}>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Landmark className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma legislatura encontrada.</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">Número</th>
                  <th className="px-6 py-3">Período</th>
                  <th className="hidden px-3 py-2 text-center md:table-cell">Vereadores</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((leg) => (
                  <tr key={leg.id} className="h-9 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="truncate px-3 py-2 font-medium text-gray-900 dark:text-white">
                      {leg.numero}ª Legislatura
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{format(new Date(leg.inicio), 'yyyy')} - {format(new Date(leg.fim), 'yyyy')}</span>
                      </div>
                    </td>
                    <td className="hidden px-3 py-2 text-center md:table-cell">
                      <Badge variant="outline" className="bg-gray-50">
                        {leg._count.vereadores}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge 
                        className={
                          leg.status === 'Ativa' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                          leg.status === 'Encerrada' ? 'bg-gray-100 text-gray-700 hover:bg-gray-100' : 
                          'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                        }
                      >
                        {leg.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button className="text-xs font-medium text-[#9333EA] hover:text-[#7E22CE]">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ErpListFrame>
    </PageFrame>
  );
}
