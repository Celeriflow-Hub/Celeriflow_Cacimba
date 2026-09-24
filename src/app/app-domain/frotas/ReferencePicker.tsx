"use client";
import { useEffect, useId, useState } from "react";
import type { ReferenceOption } from "@/lib/frotas/queries";

export const fieldClass = "min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 md:min-h-9 md:py-1.5 md:text-sm";
export function ReferencePicker({ kind, value, onChange, required, unitId, label, selectedLabel, id: providedId, endpoint = "/api/frotas/referencias", departmentId }: { kind: string; value: string; onChange: (value: string, label?: string) => void; required?: boolean; unitId?: string; label: string; selectedLabel?: string; id?: string; endpoint?: string; departmentId?: string }) {
  const generatedId = useId(), id = providedId || generatedId;
  const [search, setSearch] = useState(""), [options, setOptions] = useState<ReferenceOption[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const response = await fetch(`${endpoint}?${new URLSearchParams({ kind, q: search, unitId: unitId || "", departmentId: departmentId || "" })}`, { signal: controller.signal });
        const result = await response.json().catch(() => { throw new Error("Não foi possível carregar os registros. Recarregue a página e tente novamente."); });
        if (!response.ok) throw new Error(result.error || "Falha na consulta.");
        setOptions(result.options);
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Falha na consulta."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [kind, search, unitId, endpoint, departmentId]);
  return <div className="space-y-1">
    <label className="sr-only" htmlFor={`${id}-search`}>Buscar {label.toLowerCase()}</label>
    <input id={`${id}-search`} className={fieldClass} type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar código ou nome..." />
    <select id={id} aria-label={label} className={fieldClass} value={value} required={required} onChange={e => onChange(e.target.value, options.find(o => o.id === e.target.value)?.label)} aria-busy={loading}>
      <option value="">{required ? "Selecione um registro" : "Sem vínculo (opcional)"}</option>
      {value && !options.some(o => o.id === value) && <option value={value}>{selectedLabel || "Vínculo atual preservado"}</option>}
      {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
    <p className="text-xs leading-4 text-slate-500" role={error ? "alert" : undefined}>{error || (loading ? "Consultando..." : "Até 20 resultados. Refine a busca para localizar outros registros.")}</p>
  </div>;
}
