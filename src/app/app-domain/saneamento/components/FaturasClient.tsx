"use client";

import { useState, useMemo } from "react";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Search, Filter, Receipt } from "lucide-react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  competence: string;
  totalAmount: number;
  dueDate: string;
  status: string;
  unit: { code: string };
};

const STATUS_COLORS: Record<string, string> = {
  Emitida: "bg-yellow-100 text-yellow-700",
  Paga: "bg-green-100 text-green-700",
  Vencida: "bg-red-100 text-red-700",
  Cancelada: "bg-gray-100 text-gray-500",
};

export function FaturasClient({ invoices }: { invoices: Invoice[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("Todos");

  const statuses = ["Todos", "Emitida", "Paga", "Vencida", "Cancelada"];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.unit.code.toLowerCase().includes(q) ||
        inv.competence.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "Todos" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de faturas">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar nº fatura, UC..."
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
              aria-label="Filtrar faturas por status"
              className="h-9 rounded-md border bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0284C7] dark:bg-gray-900 dark:text-white"
            >
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <span className="text-xs text-gray-400">{filtered.length} fatura{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          <Receipt className="h-10 w-10 mx-auto mb-3 text-gray-200" />
          Nenhuma fatura encontrada.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full table-fixed text-left">
            <thead className="sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-3 py-2">Número</th>
                <th className="px-3 py-2">Unidade</th>
                <th className="px-3 py-2">Competência</th>
                <th className="px-3 py-2 text-right">Valor (R$)</th>
                <th className="px-3 py-2 text-right">Vencimento</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {paged.map((inv) => (
                <tr key={inv.id} className="h-[38px] hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-3 py-2 text-xs font-mono font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{inv.unit.code}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{inv.competence}</td>
                  <td className="px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 text-right">
                    R$ {inv.totalAmount.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 text-right">
                    {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {inv.status}
                    </span>
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
