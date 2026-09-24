"use client";

import { useState } from "react";
import { Calendar, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { updateCalendarEvent, deleteCalendarEvent } from "../actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  isHoliday: boolean;
  type: string;
};

export default function CalendarioClient({ events }: { events: CalendarEvent[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string, description: string, date: string, type: string, isHoliday: boolean }>({
    title: "", description: "", date: "", type: "", isHoliday: false
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    event.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE)));
  const pageEvents = filteredEvents.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleEditClick = (event: CalendarEvent) => {
    setEditingId(event.id);
    setEditForm({
      title: event.title,
      description: event.description || "",
      date: new Date(event.date).toISOString().split('T')[0],
      type: event.type,
      isHoliday: event.isHoliday
    });
  };

  const handleSaveEdit = async () => {
    if (editingId && window.confirm("Tem certeza que deseja salvar estas alterações?")) {
      const dataToSave = {
        title: editForm.title,
        description: editForm.description,
        // using the simple date string allows prisma to receive a correct date object without timezone shifts
        date: new Date(`${editForm.date}T12:00:00Z`), 
        type: editForm.type,
        isHoliday: editForm.isHoliday
      };
      const result = await updateCalendarEvent(editingId, dataToSave);
      if (result.error) alert(result.error); else setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este evento permanentemente?")) {
      const result = await deleteCalendarEvent(id);
      if (result.error) alert(result.error);
    }
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mb-2 flex size-9 items-center justify-center rounded bg-slate-100">
          <Calendar className="size-5 text-slate-400" />
        </div>
        <h2 className="text-sm font-bold text-slate-700">Nenhum evento encontrado</h2>
        <p className="mt-0.5 text-xs text-slate-500">Comece adicionando o primeiro evento ao calendário.</p>
      </div>
    );
  }

  return (
    <ErpListFrame toolbar={<div className="flex min-h-7 items-center justify-between gap-2">
        <h2 className="text-xs font-bold text-slate-800">Eventos cadastrados</h2>
        <input 
          type="text" 
          placeholder="Buscar evento..." 
          aria-label="Buscar evento"
          className="h-7 w-full max-w-72 rounded border border-slate-300 bg-white px-2.5 text-xs shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
      </div>} pagination={<ErpPagination page={activePage} total={filteredEvents.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="eventos" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
            <tr>
              <th className="h-8 w-40 px-3">Data</th>
              <th className="h-8 px-3">Evento</th>
              <th className="h-8 px-3">Tipo</th>
              <th className="h-8 px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageEvents.map(event => (
              <tr key={event.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-800">
                  {editingId === event.id ? (
                    <input 
                      type="date"
                      className="border rounded px-2 py-1 w-full" 
                      value={editForm.date} 
                      onChange={e => setEditForm({...editForm, date: e.target.value})} 
                    />
                  ) : (
                    format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  )}
                </td>
                <td className="max-w-0 truncate px-3 py-1.5" title={event.description || event.title}>
                  {editingId === event.id ? (
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text"
                        placeholder="Título do evento"
                        className="border rounded px-2 py-1 w-full" 
                        value={editForm.title} 
                        onChange={e => setEditForm({...editForm, title: e.target.value})} 
                      />
                      <input 
                        type="text"
                        placeholder="Descrição (opcional)"
                        className="border rounded px-2 py-1 w-full text-xs" 
                        value={editForm.description} 
                        onChange={e => setEditForm({...editForm, description: e.target.value})} 
                      />
                    </div>
                  ) : (
                    <span className="block truncate font-medium text-slate-800">{event.title}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {editingId === event.id ? (
                    <div className="flex flex-col gap-2">
                      <select 
                        className="border rounded px-2 py-1 w-full" 
                        value={editForm.type} 
                        onChange={e => setEditForm({...editForm, type: e.target.value})}
                      >
                        <option value="Feriado Nacional">Feriado Nacional</option>
                        <option value="Feriado Estadual">Feriado Estadual</option>
                        <option value="Feriado Municipal">Feriado Municipal</option>
                        <option value="Ponto Facultativo">Ponto Facultativo</option>
                        <option value="Expediente Especial">Expediente Especial</option>
                        <option value="Outro">Outro</option>
                      </select>
                      <label className="flex items-center gap-2 text-xs">
                        <input 
                          type="checkbox" 
                          checked={editForm.isHoliday}
                          onChange={e => setEditForm({...editForm, isHoliday: e.target.checked})}
                        />
                        É Feriado?
                      </label>
                    </div>
                  ) : (
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      event.isHoliday ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {event.type}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {editingId === event.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleSaveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Salvar">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded" title="Cancelar">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEditClick(event)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-500">
                  Nenhum evento encontrado para &quot;{searchTerm}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </ErpListFrame>
  );
}
