"use client";

import { useState, type FormEvent } from "react";
import { Filter, Pencil, PowerOff, Search } from "lucide-react";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { inactivateWaterQualityAnalysis, updateWaterQualityAnalysis } from "../actions";

type QualityAnalysis = {
  id: string;
  collectionPoint: string;
  collectedAt: string;
  parameter: string;
  result: string;
  limit: string;
  compliance: string;
  active: boolean;
};

const COMPLIANCE_COLORS: Record<string, string> = {
  Conforme: "bg-emerald-100 text-emerald-700",
  "Não Conforme": "bg-red-100 text-red-700",
};

export function QualityClient({ analyses }: { analyses: QualityAnalysis[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [complianceFilter, setComplianceFilter] = useState("Todos");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [editingAnalysis, setEditingAnalysis] = useState<QualityAnalysis | null>(null);
  const [saving, setSaving] = useState(false);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);

  const filteredAnalyses = analyses.filter((analysis) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [
      analysis.collectionPoint,
      analysis.collectedAt,
      analysis.parameter,
      analysis.result,
      analysis.limit,
    ].some((value) => value.toLowerCase().includes(query));
    const matchesCompliance = complianceFilter === "Todos" || analysis.compliance === complianceFilter;
    const matchesActive = activeFilter === "Todos" || (activeFilter === "Ativas" ? analysis.active : !analysis.active);

    return matchesSearch && matchesCompliance && matchesActive;
  });
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filteredAnalyses.length / pageSize));
  const pagedAnalyses = filteredAnalyses.slice((page - 1) * pageSize, page * pageSize);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAnalysis) return;

    setSaving(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await updateWaterQualityAnalysis(editingAnalysis.id, {
        collectionPoint: formData.get("collectionPoint") as string,
        collectedAt: formData.get("collectedAt") as string,
        parameter: formData.get("parameter") as string,
        result: formData.get("result") as string,
        limit: formData.get("limit") as string,
        compliance: formData.get("compliance") as string,
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      setEditingAnalysis(null);
    } catch {
      alert("Erro ao atualizar análise de qualidade.");
    } finally {
      setSaving(false);
    }
  }

  async function handleInactivate(analysis: QualityAnalysis) {
    if (!confirm(`Inativar a análise de ${analysis.parameter} do ponto ${analysis.collectionPoint}?`)) return;

    setInactivatingId(analysis.id);
    try {
      const result = await inactivateWaterQualityAnalysis(analysis.id);
      if (result.error) alert(result.error);
    } catch {
      alert("Erro ao inativar análise de qualidade.");
    } finally {
      setInactivatingId(null);
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de análises de qualidade">
      <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar ponto, parâmetro..."
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              className="h-9 w-full rounded-md border bg-white py-1.5 pr-3 pl-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7] dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={complianceFilter}
              onChange={(event) => { setComplianceFilter(event.target.value); setPage(1); }}
              aria-label="Filtrar por conformidade"
              className="h-9 rounded-md border bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0284C7] dark:bg-gray-900 dark:text-white"
            >
              <option value="Todos">Todas as conformidades</option>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
            </select>
          </div>
          <select
            value={activeFilter}
            onChange={(event) => { setActiveFilter(event.target.value); setPage(1); }}
            aria-label="Filtrar por situação"
            className="h-9 rounded-md border bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0284C7] dark:bg-gray-900 dark:text-white"
          >
            <option value="Todos">Ativas e inativas</option>
            <option value="Ativas">Ativas</option>
            <option value="Inativas">Inativas</option>
          </select>
        </div>
        <span className="text-xs text-gray-400">{filteredAnalyses.length} registro{filteredAnalyses.length !== 1 ? "s" : ""}</span>
      </div>

      {filteredAnalyses.length === 0 ? (
        <div className="p-10 text-center text-sm text-gray-400">Nenhuma análise encontrada.</div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full table-fixed text-left">
            <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2">Ponto</th>
                <th className="px-3 py-2">Coleta</th>
                <th className="px-3 py-2">Parâmetro</th>
                <th className="px-3 py-2">Resultado</th>
                <th className="px-3 py-2">Limite</th>
                <th className="px-3 py-2">Conformidade</th>
                <th className="px-3 py-2">Situação</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {pagedAnalyses.map((analysis) => (
                <tr key={analysis.id} className="h-[38px] text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/40">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{analysis.collectionPoint}</td>
                  <td className="px-3 py-2">{new Date(`${analysis.collectedAt}T00:00:00`).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2">{analysis.parameter}</td>
                  <td className="px-3 py-2">{analysis.result}</td>
                  <td className="px-3 py-2">{analysis.limit}</td>
                  <td className="px-3 py-2"><span className={`rounded-full px-1.5 py-0.5 font-medium ${COMPLIANCE_COLORS[analysis.compliance] ?? "bg-gray-100 text-gray-500"}`}>{analysis.compliance}</span></td>
                  <td className="px-3 py-2"><span className={`rounded-full px-1.5 py-0.5 font-medium ${analysis.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{analysis.active ? "Ativa" : "Inativa"}</span></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingAnalysis(analysis)}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-[#0284C7]"
                        title="Editar análise"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInactivate(analysis)}
                        disabled={!analysis.active || inactivatingId === analysis.id}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Inativar análise"
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

      <Sheet open={editingAnalysis !== null} onOpenChange={(open) => !open && setEditingAnalysis(null)}>
        <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
          <SheetHeader>
            <SheetTitle>Editar Análise de Qualidade</SheetTitle>
            <SheetDescription>Atualize os dados da análise selecionada.</SheetDescription>
          </SheetHeader>
          {editingAnalysis && (
            <form onSubmit={handleUpdate} className="mt-4 space-y-3 pb-2">
              <div className="space-y-2">
                <label htmlFor="collectionPoint" className="text-sm font-medium">Ponto de coleta</label>
                <input id="collectionPoint" name="collectionPoint" required defaultValue={editingAnalysis.collectionPoint} className="w-full rounded-md border p-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label htmlFor="collectedAt" className="text-sm font-medium">Data da coleta</label>
                <input id="collectedAt" name="collectedAt" type="date" required defaultValue={editingAnalysis.collectedAt} className="w-full rounded-md border p-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label htmlFor="parameter" className="text-sm font-medium">Parâmetro</label>
                <input id="parameter" name="parameter" required defaultValue={editingAnalysis.parameter} className="w-full rounded-md border p-2 text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="result" className="text-sm font-medium">Resultado</label>
                  <input id="result" name="result" required defaultValue={editingAnalysis.result} className="w-full rounded-md border p-2 text-sm" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="limit" className="text-sm font-medium">Limite</label>
                  <input id="limit" name="limit" required defaultValue={editingAnalysis.limit} className="w-full rounded-md border p-2 text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="compliance" className="text-sm font-medium">Conformidade</label>
                <select id="compliance" name="compliance" required defaultValue={editingAnalysis.compliance} className="w-full rounded-md border p-2 text-sm">
                  <option value="Conforme">Conforme</option>
                  <option value="Não Conforme">Não Conforme</option>
                </select>
              </div>
              <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
                <SheetTrigger render={<button type="button" className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200" />}>
                  Cancelar
                </SheetTrigger>
                <button type="submit" disabled={saving} className="rounded-md bg-[#0284C7] px-4 py-2 text-sm font-medium text-white hover:bg-[#0369A1] disabled:opacity-50">
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
      <ErpPagination page={Math.min(page, pageCount)} total={filteredAnalyses.length} pageSize={pageSize} previousHref="#" nextHref="#" onPageChange={setPage} />
    </section>
  );
}
