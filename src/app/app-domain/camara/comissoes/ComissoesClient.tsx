"use client";

import { useState } from "react";
import { Users, Search, Plus, List, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

type Comissao = {
  id: string;
  nome: string;
  sigla: string | null;
  tipo: string;
  descricao: string | null;
  status: string;
  membros: {
    cargo: string;
    vereador: {
      nomeParlamentar: string;
      partido: string | null;
    }
  }[];
};

export default function ComissoesClient({ comissoes }: { comissoes: Comissao[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = comissoes.filter(com => 
    com.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (com.sigla && com.sigla.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <PageFrame className="space-y-3 px-1 py-1 md:px-2">
      <PageHeader
        title="Comissões Parlamentares"
        icon={<Users className="size-4 shrink-0 text-[#9333EA]" />}
        action={<button className="flex h-8 items-center gap-2 rounded-md bg-[#9333EA] px-3 text-sm font-medium text-white transition-colors hover:bg-[#7E22CE]"><Plus className="h-4 w-4" />Nova Comissão</button>}
        className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white"
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar comissão..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#9333EA]/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <List className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma comissão encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((com) => (
              <Card key={com.id} className="overflow-hidden hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-white dark:bg-gray-800">{com.sigla || "COM"}</Badge>
                    <Badge 
                      className={
                        com.status === 'Ativa' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                        'bg-gray-100 text-gray-700 hover:bg-gray-100'
                      }
                    >
                      {com.status}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2" title={com.nome}>
                    {com.nome}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2" title={com.descricao || ""}>
                    {com.descricao || "Sem descrição"}
                  </p>
                  <div className="mt-3 text-xs font-medium text-gray-500">
                    Tipo: <span className="text-gray-700 dark:text-gray-300">{com.tipo}</span>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" /> Membros ({com.membros.length})
                  </h4>
                  {com.membros.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Nenhum membro designado.</p>
                  ) : (
                    <ul className="space-y-3">
                      {com.membros.map((m, idx) => (
                        <li key={idx} className="flex flex-col">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">{m.vereador.nomeParlamentar}</span>
                            <span className="text-xs text-gray-500 font-semibold">{m.vereador.partido}</span>
                          </div>
                          <span className="text-xs text-[#9333EA] font-medium">{m.cargo}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-6 flex justify-end">
                    <button className="text-sm font-medium text-[#9333EA] hover:text-[#7E22CE]">
                      Gerenciar Comissão
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
