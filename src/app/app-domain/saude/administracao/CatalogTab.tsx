"use client";

import { useState } from "react";
import { Pencil, Power } from "lucide-react";
import type { CboRow, ServiceRow, SpecialtyRow } from "./AdministracaoClient";
import { saveHealthCbo, saveHealthService, saveHealthSpecialty } from "./actions";

type Kind = "especialidades" | "servicos" | "cbo";
type Props = { kind: Kind; rows: SpecialtyRow[] | ServiceRow[] | CboRow[]; editor: { kind: string; id?: string } | null; canUpdate: boolean; onEdit: (id: string) => void; onClose: () => void };

const labels: Record<Kind, { singular: string; description: string }> = {
  especialidades: { singular: "Especialidade", description: "Descrição" },
  servicos: { singular: "Serviço SUS", description: "Descrição" },
  cbo: { singular: "CBO", description: "Ocupação" },
};

function normalize(kind: Kind, row: SpecialtyRow | ServiceRow | CboRow) {
  return { id: row.id, code: row.code, name: "description" in row ? row.description : row.name, classification: "classification" in row ? row.classification : null, isActive: row.isActive };
}

export default function CatalogTab({ kind, rows, editor, canUpdate, onEdit, onClose }: Props) {
  const normalized = rows.map(row => normalize(kind, row));
  const editing = editor?.kind === kind ? normalized.find(row => row.id === editor.id) : undefined;
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(id: string | null, data: { code: string; name: string; classification: string; isActive: boolean }) {
    if (kind === "especialidades") return saveHealthSpecialty(id, data);
    if (kind === "servicos") return saveHealthService(id, data);
    return saveHealthCbo(id, data);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const values = new FormData(event.currentTarget);
    const result = await save(editing?.id || null, { code: String(values.get("code") || ""), name: String(values.get("name") || ""), classification: String(values.get("classification") || ""), isActive: editing?.isActive ?? true });
    setSaving(false);
    if ("error" in result) setError(result.error); else onClose();
  }

  async function toggle(row: ReturnType<typeof normalize>) {
    setError("");
    const result = await save(row.id, { code: row.code, name: row.name, classification: row.classification || "", isActive: !row.isActive });
    if ("error" in result) setError(result.error);
  }

  return <>
    {error && !editor && <p className="m-2 rounded bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    <table className="w-full table-fixed border-collapse text-left text-xs"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><tr><th className="w-[20%] px-3 py-2">Código</th><th className="px-3 py-2">{labels[kind].description}</th>{kind === "servicos" && <th className="hidden w-[23%] px-3 py-2 md:table-cell">Classificação</th>}<th className="w-[12%] px-3 py-2">Situação</th><th className="w-20 px-3 py-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{normalized.map(row => <tr key={row.id} className="h-9 hover:bg-slate-50 dark:hover:bg-slate-800/60"><td className="truncate px-3 font-mono text-slate-700 dark:text-slate-200">{row.code}</td><td className="truncate px-3 font-medium" title={row.name}>{row.name}</td>{kind === "servicos" && <td className="hidden truncate px-3 text-slate-600 dark:text-slate-300 md:table-cell">{row.classification || "–"}</td>}<td className="px-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${row.isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"}`}>{row.isActive ? "Ativo" : "Inativo"}</span></td><td className="px-3"><div className="flex justify-end gap-1">{canUpdate && <button title="Editar" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-emerald-700" onClick={() => onEdit(row.id)}><Pencil className="size-3.5" /></button>}{canUpdate && <button title={row.isActive ? "Inativar" : "Ativar"} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-amber-700" onClick={() => toggle(row)}><Power className="size-3.5" /></button>}</div></td></tr>)}</tbody></table>

    {editor?.kind === kind && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true"><form onSubmit={submit} className="w-full max-w-md rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700"><h2 className="text-sm font-bold">{editing ? "Editar" : "Novo"} {labels[kind].singular}</h2><button type="button" className="text-xs text-slate-500" onClick={onClose}>Fechar</button></div><div className="space-y-3 p-4 text-xs">{error && <p className="rounded bg-rose-50 p-2 text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}<label className="block font-semibold">Código<input required name="code" defaultValue={editing?.code || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label><label className="block font-semibold">{labels[kind].description}<input required name="name" defaultValue={editing?.name || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>{kind === "servicos" && <label className="block font-semibold">Classificação<input name="classification" defaultValue={editing?.classification || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>}</div><div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" onClick={onClose} className="h-8 rounded border px-3 text-xs">Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button></div></form></div>}
  </>;
}
