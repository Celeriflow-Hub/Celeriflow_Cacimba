"use client";

import { useState } from "react";
import { Search, CheckCircle2, PlayCircle } from "lucide-react";
import { updateTicketStatus } from "./actions";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
  person: { fullName: string } | null;
  channel: { name: string };
}

export default function AtendimentoClient({ initialTickets }: { initialTickets: Ticket[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tickets, setTickets] = useState(initialTickets);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredTickets = tickets.filter(
    (t) =>
      t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoadingId(id);
    const result = await updateTicketStatus(id, newStatus);
    if (result.success) {
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
    } else {
      alert(result.error);
    }
    setLoadingId(null);
  };

  if (tickets.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Search className="text-slate-400 w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-700">Nenhum chamado pendente</h3>
        <p className="text-slate-500 mt-1">A caixa de entrada de serviços rápidos está vazia no momento.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
        <h3 className="text-sm font-semibold text-slate-800 hidden sm:block">Fila de Chamados Recentes</h3>
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar chamado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Número</th>
              <th className="px-6 py-3">Assunto</th>
              <th className="px-6 py-3">Solicitante</th>
              <th className="px-6 py-3">Prioridade</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Ação Rápida</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{t.ticketNumber}</td>
                <td className="px-6 py-4">
                  <span className="font-medium text-slate-800 block">{t.subject}</span>
                  <span className="text-xs text-slate-500">{t.channel.name}</span>
                </td>
                <td className="px-6 py-4 text-slate-600">{t.person?.fullName || "Anônimo"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                    t.priority === 'Urgente' ? 'bg-red-100 text-red-700' :
                    t.priority === 'Alta' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {t.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                    t.status === 'Resolvido' ? 'bg-emerald-100 text-emerald-700' :
                    t.status === 'Em Atendimento' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {t.status === 'Aberto' && (
                    <button
                      onClick={() => handleStatusChange(t.id, 'Em Atendimento')}
                      disabled={loadingId === t.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      <PlayCircle className="w-4 h-4" /> Atender
                    </button>
                  )}
                  {t.status === 'Em Atendimento' && (
                    <button
                      onClick={() => handleStatusChange(t.id, 'Resolvido')}
                      disabled={loadingId === t.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Concluir
                    </button>
                  )}
                  {t.status === 'Resolvido' && (
                    <span className="text-emerald-600 font-semibold text-xs flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Finalizado
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Nenhum chamado encontrado na busca.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
