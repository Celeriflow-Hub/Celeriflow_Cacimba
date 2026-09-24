"use client";

import { useState } from "react";
import { Pencil, Power } from "lucide-react";
import type { SchedulingGroupRow } from "./AdministracaoClient";
import { saveHealthSchedulingGroup } from "./actions";

type Props = { rows: SchedulingGroupRow[]; editor: { kind: string; id?: string } | null; units: { id: string; name: string }[]; groups: { id: string; name: string }[]; canUpdate: boolean; onEdit: (id: string) => void; onClose: () => void };

export default function SchedulingGroupsTab({ rows, editor, units, groups, canUpdate, onEdit, onClose }: Props) {
  const editing = editor?.kind === "agendamentos" ? rows.find(row => row.id === editor.id) : undefined;
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function persist(id: string | null, data: { name: string; unitId: string; specialtyGroupId: string; isActive: boolean }) {
    setSaving(true); setError("");
    const result = await saveHealthSchedulingGroup(id, data);
    setSaving(false);
    if ("error" in result) setError(result.error); else onClose();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    await persist(editing?.id || null, { name: String(values.get("name")), unitId: String(values.get("unitId")), specialtyGroupId: String(values.get("specialtyGroupId")), isActive: editing?.isActive ?? true });
  }

  return <>
    {error && !editor && <p className="m-2 rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}
    <table className="w-full table-fixed border-collapse text-left text-xs"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><tr><th className="w-[32%] px-3 py-2">Grupo de agendamento</th><th className="w-[29%] px-3 py-2">Unidade</th><th className="px-3 py-2">Grupo de especialidades</th><th className="w-[11%] px-3 py-2">Situação</th><th className="w-20 px-3 py-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(row => <tr key={row.id} className="h-9 hover:bg-slate-50 dark:hover:bg-slate-800/60"><td className="truncate px-3 font-medium">{row.name}</td><td className="truncate px-3 text-slate-600 dark:text-slate-300">{row.unit.name}</td><td className="truncate px-3 text-slate-600 dark:text-slate-300">{row.specialtyGroup.name}</td><td className="px-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${row.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{row.isActive ? "Ativo" : "Inativo"}</span></td><td className="px-3"><div className="flex justify-end gap-1">{canUpdate && <button title="Editar" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-emerald-700" onClick={() => onEdit(row.id)}><Pencil className="size-3.5" /></button>}{canUpdate && <button title={row.isActive ? "Inativar" : "Ativar"} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-amber-700" onClick={() => persist(row.id, { name: row.name, unitId: row.unit.id, specialtyGroupId: row.specialtyGroup.id, isActive: !row.isActive })}><Power className="size-3.5" /></button>}</div></td></tr>)}</tbody></table>
    {editor?.kind === "agendamentos" && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={submit} className="w-full max-w-md rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700"><h2 className="text-sm font-bold">{editing ? "Editar" : "Novo"} Grupo de Agendamento</h2><button type="button" className="text-xs text-slate-500" onClick={onClose}>Fechar</button></div><div className="space-y-3 p-4 text-xs">{error && <p className="rounded bg-rose-50 p-2 text-rose-700">{error}</p>}<label className="block font-semibold">Nome<input required name="name" defaultValue={editing?.name || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label><label className="block font-semibold">Unidade<select required name="unitId" defaultValue={editing?.unit.id || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950"><option value="">Selecione</option>{units.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label><label className="block font-semibold">Grupo de especialidades<select required name="specialtyGroupId" defaultValue={editing?.specialtyGroup.id || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950"><option value="">Selecione</option>{groups.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label></div><div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" onClick={onClose} className="h-8 rounded border px-3 text-xs">Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white">Salvar</button></div></form></div>}
  </>;
}
