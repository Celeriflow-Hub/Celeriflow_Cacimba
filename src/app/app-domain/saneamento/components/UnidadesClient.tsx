"use client";

import { useState, useMemo } from "react";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Search, Filter, PowerOff } from "lucide-react";
import { NewUnitSheet } from "./NewUnitSheet";
import { EditUnitSheet } from "./EditUnitSheet";
import { inactivateConsumerUnit } from "../actions";

type Unit = {
  id: string;
  code: string;
  address: string;
  category: string;
  status: string;
  ownerName: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  Ativa: "bg-green-100 text-green-700",
  Cortada: "bg-red-100 text-red-700",
  Suspensa: "bg-yellow-100 text-yellow-700",
  Inativa: "bg-gray-100 text-gray-500",
};

export function UnidadesClient({ units }: { units: Unit[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todas");

  const statuses = ["Todos", "Ativa", "Cortada", "Suspensa", "Inativa"];
  const categories = ["Todas", "Residencial", "Comercial", "Industrial", "Pública", "Rural"];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return units.filter((u) => {
      const matchesSearch =
        !q ||
        u.code.toLowerCase().includes(q) ||
        u.address.toLowerCase().includes(q) ||
        (u.ownerName ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "Todos" || u.status === statusFilter;
      const matchesCategory = categoryFilter === "Todas" || u.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [units, search, statusFilter, categoryFilter]);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function handleInactivate(id: string, code: string) {
    if (!confirm(`Inativar a unidade ${code}? Esta ação pode ser revertida editando o status.`)) return;
    try {
      const result = await inactivateConsumerUnit(id);
      if (result.error) alert(result.error);
    } catch {
      alert("Erro ao inativar unidade.");
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de unidades consumidoras">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar unidade, titular..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 w-full rounded-md border bg-white pl-8 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7] dark:bg-gray-900 dark:text-white"
            />
          </div>
          {/* Status filter */}
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              aria-label="Filtrar por status"
              className="h-9 rounded-md border bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0284C7] dark:bg-gray-900 dark:text-white"
            >
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            aria-label="Filtrar por categoria"
            className="h-9 rounded-md border bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0284C7] dark:bg-gray-900 dark:text-white"
          >
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</span>
          <NewUnitSheet />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          Nenhuma unidade consumidora encontrada.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full table-fixed text-left">
            <thead className="sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Endereço</th>
                <th className="px-3 py-2">Titular</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {paged.map((unit) => (
                <tr key={unit.id} className="h-[38px] hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-3 py-2 text-xs font-mono font-medium text-gray-900 dark:text-white">{unit.code}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 max-w-[200px] truncate">{unit.address}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{unit.ownerName || "-"}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{unit.category}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[unit.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {unit.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <EditUnitSheet unit={unit} />
                      <button
                        onClick={() => handleInactivate(unit.id, unit.code)}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                        title="Inativar"
                        disabled={unit.status === "Inativa"}
                      >
                        <PowerOff className="h-3.5 w-3.5" />
                      </button>
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
