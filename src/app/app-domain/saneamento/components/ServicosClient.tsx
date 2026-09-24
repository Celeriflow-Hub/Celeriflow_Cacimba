"use client";

import { useState, useMemo } from "react";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Search, Filter, Wrench } from "lucide-react";
import { NewServiceOrderSheet } from "./NewServiceOrderSheet";
import { EditServiceOrderSheet } from "./EditServiceOrderSheet";

type Unit = { id: string; code: string; address: string };

type ServiceOrder = {
  id: string;
  orderNumber: string;
  orderType: string;
  description: string;
  priority: string;
  status: string;
  technician: string | null;
  createdAt: Date;
  unit: { code: string } | null;
};

const PRIORITY_COLORS: Record<string, string> = {
  Normal: "bg-emerald-100 text-emerald-700",
  Alta: "bg-amber-100 text-amber-700",
  Urgente: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  Aberta: "bg-slate-100 text-slate-700 border border-slate-200",
  "Em Andamento": "bg-blue-50 text-blue-700 border border-blue-200",
  Concluída: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Cancelada: "bg-red-50 text-red-500 border border-red-200",
};

export function ServicosClient({ orders, units }: { orders: ServiceOrder[]; units: Unit[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");

  const statuses = ["Todos", "Aberta", "Em Andamento", "Concluída", "Cancelada"];
  const types = ["Todos", "Vazamento", "Religação", "Corte", "Manutenção", "Troca de Hidrômetro"];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.orderType.toLowerCase().includes(q) ||
        (o.unit?.code ?? "").toLowerCase().includes(q) ||
        (o.technician ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "Todos" || o.status === statusFilter;
      const matchesType = typeFilter === "Todos" || o.orderType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [orders, search, statusFilter, typeFilter]);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de ordens de serviço">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar nº OS, tipo, técnico..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 w-full rounded-md border bg-white pl-8 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7] dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              aria-label="Filtrar ordens por status"
              className="h-9 rounded-md border bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0284C7] dark:bg-gray-900 dark:text-white"
            >
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            aria-label="Filtrar ordens por tipo"
            className="h-9 rounded-md border bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0284C7] dark:bg-gray-900 dark:text-white"
          >
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{filtered.length} OS</span>
          <NewServiceOrderSheet units={units} />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          <Wrench className="h-10 w-10 mx-auto mb-3 text-gray-200" />
          Nenhuma ordem de serviço encontrada.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full table-fixed text-left">
            <thead className="sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-3 py-2">Nº OS</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">UC</th>
                <th className="px-3 py-2">Técnico</th>
                <th className="px-3 py-2 text-center">Prioridade</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {paged.map((o) => (
                <tr key={o.id} className="h-[38px] hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-3 py-2 text-xs font-mono font-medium text-gray-900 dark:text-white">{o.orderNumber}</td>
                  <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">{o.orderType}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{o.unit?.code ?? <span className="text-gray-300 italic">Rede pública</span>}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{o.technician || "-"}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[o.priority] ?? "bg-gray-100 text-gray-500"}`}>
                      {o.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <EditServiceOrderSheet order={o} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ErpPagination page={Math.min(page, pageCount)} total={filtered.length} pageSize={pageSize} previousHref="#" nextHref="#" onPageChange={setPage} />
</section>
  );
}
