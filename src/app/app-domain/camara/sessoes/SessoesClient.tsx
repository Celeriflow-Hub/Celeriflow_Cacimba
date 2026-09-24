"use client";

import { useState } from "react";
import { Calendar, Search, Plus, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type Sessao = {
  id: string;
  numero: number;
  tipo: string;
  data: Date;
  local: string | null;
  status: string;
  quorum: number | null;
  proposicoes: {
    numero: string;
    tipo: string;
    ementa: string;
    status: string;
  }[];
  atas: {
    numero: string;
    status: string;
    dataAprovacao: Date | null;
  }[];
};

export default function SessoesClient({ sessoes }: { sessoes: Sessao[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [activeTab, setActiveTab] = useState<"sessoes" | "pautas" | "atas">("sessoes");
  const [page, setPage] = useState(1);

  const filtered = sessoes.filter(s => 
    s.numero.toString().includes(searchTerm) || 
    (s.tipo && s.tipo.toLowerCase().includes(searchTerm.toLowerCase()))
  ).filter((session) => statusFilter === "Todos" || session.status === statusFilter);
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3">
      <PageHeader
        title="Sessões Plenárias"
        icon={<Calendar className="size-4 shrink-0 text-[#9333EA]" />}
        action={<button className="flex h-8 items-center gap-2 rounded-md bg-[#9333EA] px-3 text-sm font-medium text-white transition-colors hover:bg-[#7E22CE]"><Plus className="h-4 w-4" />Nova Sessão</button>}
        className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white"
      />

      <div className="flex shrink-0 flex-wrap gap-1 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("sessoes")}
          className={`relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "sessoes" ? "text-[#9333EA]" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sessões
          {activeTab === "sessoes" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#9333EA] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("pautas")}
          className={`relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "pautas" ? "text-[#9333EA]" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pautas (Ordem do Dia)
          {activeTab === "pautas" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#9333EA] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("atas")}
          className={`relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "atas" ? "text-[#9333EA]" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Atas
          {activeTab === "atas" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#9333EA] rounded-t-full" />
          )}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar sessão..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#9333EA]/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <select aria-label="Filtrar sessões por situação" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option>Todos</option>{Array.from(new Set(sessoes.map((item) => item.status))).map((item) => <option key={item}>{item}</option>)}</select>
        </div>

        {activeTab === "sessoes" && (
          filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma sessão encontrada.</p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <table className="w-full table-fixed text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase text-gray-500 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3">Número / Tipo</th>
                    <th className="px-6 py-3">Data e Hora</th>
                    <th className="hidden px-3 py-2 md:table-cell">Local</th>
                    <th className="hidden px-3 py-2 text-center lg:table-cell">Quórum</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => (
                    <tr key={s.id} className="h-9 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="truncate px-3 py-2 font-bold text-gray-900 dark:text-white">{s.numero}ª · {s.tipo}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium">{format(new Date(s.data), "dd/MM/yyyy HH:mm")}</td>
                      <td className="hidden truncate px-3 py-2 text-gray-500 md:table-cell">
                        {s.local || "Plenário"}
                      </td>
                      <td className="hidden px-3 py-2 text-center lg:table-cell">
                        {s.quorum ? (
                          <Badge variant="outline" className="bg-gray-50">{s.quorum} presenças</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Badge 
                          className={
                            s.status === 'Encerrada' ? 'bg-gray-100 text-gray-700 hover:bg-gray-100' : 
                            s.status === 'Em Andamento' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                            'bg-blue-100 text-blue-700 hover:bg-blue-100'
                          }
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button className="text-xs font-medium text-[#9333EA] hover:text-[#7E22CE]">
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === "pautas" && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ordem do Dia por Sessão</h3>
            <div className="space-y-6">
              {visible.map(s => (
                <div key={s.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{s.numero}ª Sessão {s.tipo}</h4>
                      <p className="text-xs text-gray-500">{format(new Date(s.data), "dd/MM/yyyy 'às' HH:mm")}</p>
                    </div>
                    <Badge variant="outline">{s.proposicoes.length} Matérias</Badge>
                  </div>
                  <div className="p-0">
                    {s.proposicoes.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 italic">Nenhuma matéria pautada para esta sessão.</p>
                    ) : (
                        <div className="overflow-hidden"><table className="w-full table-fixed text-xs">
                        <tbody>
                          {s.proposicoes.map((prop, idx) => (
                            <tr key={idx} className="border-b last:border-0 border-gray-100 dark:border-gray-800">
                              <td className="p-4 w-1/4">
                                <span className="font-medium text-gray-900 dark:text-white">{prop.numero}</span>
                                <br />
                                <span className="text-xs text-gray-500">{prop.tipo}</span>
                              </td>
                              <td className="p-4 text-gray-600 line-clamp-2" title={prop.ementa}>{prop.ementa}</td>
                              <td className="p-4 w-32 text-right">
                                <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{prop.status}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        </table></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "atas" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.flatMap(s => s.atas.map((ata, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-[#9333EA] rounded-lg">
                        <FileText className="h-5 w-5" />
                      </div>
                      <Badge 
                        className={
                          ata.status === 'Publicada' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                          ata.status === 'Aprovada' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 
                          'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                        }
                      >
                        {ata.status}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{ata.numero}</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Ref: {s.numero}ª Sessão {s.tipo} ({format(new Date(s.data), "dd/MM/yyyy")})
                    </p>
                    
                    {ata.dataAprovacao && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Aprovada em: {format(new Date(ata.dataAprovacao), "dd/MM/yyyy")}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                      <button className="text-xs font-medium text-gray-500 hover:text-gray-700">Visualizar</button>
                      <button className="text-xs font-medium text-[#9333EA] hover:text-[#7E22CE]">Editar</button>
                    </div>
                  </CardContent>
                </Card>
              )))}
            </div>
            {visible.flatMap(s => s.atas).length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma ata registrada nas sessões listadas.</p>
              </div>
            )}
          </div>
        )}
        <div className="shrink-0 border-t border-slate-200 px-3 py-1.5"><ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="sessões" onPageChange={setPage} /></div>
      </div>
    </PageFrame>
  );
}
