"use client";

import { useState } from "react";
import { Pencil, Power } from "lucide-react";
import type { GroupRow } from "./AdministracaoClient";
import { saveHealthSpecialtyGroup } from "./actions";

type Props = {
  rows: GroupRow[];
  editor: { kind: string; id?: string } | null;
  specialties: { id: string; code: string; name: string }[];
  services: { id: string; code: string; name: string }[];
  canUpdate: boolean;
  onEdit: (id: string) => void;
  onClose: () => void;
};

export default function GroupsTab({ rows, editor, specialties, services, canUpdate, onEdit, onClose }: Props) {
  const editing = editor?.kind === "grupos" ? rows.find(row => row.id === editor.id) : undefined;
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const values = new FormData(event.currentTarget);
    const result = await saveHealthSpecialtyGroup(editing?.id || null, {
      name: String(values.get("name") || ""),
      isActive: editing?.isActive ?? true,
      specialtyIds: values.getAll("specialtyIds").map(String),
      serviceIds: values.getAll("serviceIds").map(String),
    });
    setSaving(false);
    if ("error" in result) setError(result.error); else onClose();
  }

  async function toggle(row: GroupRow) {
    const result = await saveHealthSpecialtyGroup(row.id, { name: row.name, isActive: !row.isActive, specialtyIds: row.specialties.map(item => item.specialty.id), serviceIds: row.services.map(item => item.service.id) });
    if ("error" in result) setError(result.error);
  }

  return <>
    {error && !editor && <p className="m-2 rounded bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    <table className="w-full table-fixed border-collapse text-left text-xs"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><tr><th className="w-[30%] px-3 py-2">Grupo</th><th className="px-3 py-2">Especialidades</th><th className="hidden w-[24%] px-3 py-2 lg:table-cell">Serviços</th><th className="w-[12%] px-3 py-2">Situação</th><th className="w-20 px-3 py-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(row => { const specialtyText = row.specialties.map(item => item.specialty.name).join(", "); const serviceText = row.services.map(item => item.service.name).join(", "); return <tr key={row.id} className="h-9 hover:bg-slate-50 dark:hover:bg-slate-800/60"><td className="truncate px-3 font-medium">{row.name}</td><td className="truncate px-3 text-slate-600 dark:text-slate-300" title={specialtyText}>{specialtyText || "–"}</td><td className="hidden truncate px-3 text-slate-600 dark:text-slate-300 lg:table-cell" title={serviceText}>{serviceText || "–"}</td><td className="px-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${row.isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"}`}>{row.isActive ? "Ativo" : "Inativo"}</span></td><td className="px-3"><div className="flex justify-end gap-1">{canUpdate && <button title="Editar vínculos" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-emerald-700" onClick={() => onEdit(row.id)}><Pencil className="size-3.5" /></button>}{canUpdate && <button title={row.isActive ? "Inativar" : "Ativar"} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-amber-700" onClick={() => toggle(row)}><Power className="size-3.5" /></button>}</div></td></tr>; })}</tbody></table>

    {editor?.kind === "grupos" && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={submit} className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700"><h2 className="text-sm font-bold">{editing ? "Editar Grupo de Especialidades" : "Novo Grupo de Especialidades"}</h2><button type="button" className="text-xs text-slate-500" onClick={onClose}>Fechar</button></div><div className="space-y-3 overflow-y-auto p-4 text-xs">{error && <p className="rounded bg-rose-50 p-2 text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}<label className="block font-semibold">Nome<input required name="name" defaultValue={editing?.name || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label><div className="grid gap-3 sm:grid-cols-2"><fieldset className="rounded border p-2 dark:border-slate-700"><legend className="px-1 font-bold">Especialidades</legend><div className="max-h-52 space-y-1 overflow-y-auto">{specialties.map(option => <label key={option.id} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"><input type="checkbox" name="specialtyIds" value={option.id} defaultChecked={editing?.specialties.some(item => item.specialty.id === option.id)} /><span className="truncate">{option.code} - {option.name}</span></label>)}</div></fieldset><fieldset className="rounded border p-2 dark:border-slate-700"><legend className="px-1 font-bold">Serviços</legend><div className="max-h-52 space-y-1 overflow-y-auto">{services.map(option => <label key={option.id} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"><input type="checkbox" name="serviceIds" value={option.id} defaultChecked={editing?.services.some(item => item.service.id === option.id)} /><span className="truncate">{option.code} - {option.name}</span></label>)}</div></fieldset></div></div><div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" onClick={onClose} className="h-8 rounded border px-3 text-xs">Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button></div></form></div>}
  </>;
}
