"use client";

import Link from "next/link";
import { useState } from "react";
import { updatePassword } from "firebase/auth";
import { KeyRound, Pencil, Plus } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { isStrongHealthPassword } from "@/lib/saude/health-access-policy";
import type { AccessRow, UsageRow } from "./AdministracaoClient";
import { saveHealthUserAccess } from "./actions";

type Props = {
  rows: AccessRow[];
  profiles: { id: string; name: string }[];
  employees: { id: string; name: string; registration: string | null; cpf: string | null }[];
  units: { id: string; name: string; type: string }[];
  canManage: boolean;
  usage: UsageRow[];
  usageFrom: string;
  usageUntil: string;
};
const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function AccessTab({ rows, profiles, employees, units, canManage, usage, usageFrom, usageUntil }: Props) {
  const [editing, setEditing] = useState<AccessRow | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true); setError("");
    const data = new FormData(event.currentTarget);
    const result = await saveHealthUserAccess({
      usuarioId: editing.id,
      perfilId: String(data.get("perfilId") || ""),
      employeeId: String(data.get("employeeId") || ""),
      ativo: data.get("ativo") === "on",
      canView: data.get("canView") === "on" || data.get("canEdit") === "on",
      canEdit: data.get("canEdit") === "on",
      unitIds: data.getAll("unitIds").map(String),
      validFrom: String(data.get("validFrom") || ""),
      validUntil: String(data.get("validUntil") || ""),
      weekdays: data.getAll("weekdays").map(Number),
      startTime: String(data.get("startTime") || ""),
      endTime: String(data.get("endTime") || ""),
    });
    setSaving(false);
    if ("error" in result) setError(result.error); else setEditing(null);
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const password = String(new FormData(event.currentTarget).get("password") || "");
    if (!isStrongHealthPassword(password)) { setError("Use ao menos 8 caracteres, com maiúscula, número e caractere especial."); return; }
    if (!auth.currentUser) { setError("Sessão Firebase não encontrada. Entre novamente no sistema."); return; }
    setSaving(true);
    try { await updatePassword(auth.currentUser, password); setPasswordOpen(false); }
    catch { setError("Não foi possível trocar a senha. Por segurança, entre novamente e repita a operação."); }
    finally { setSaving(false); }
  }

  if (!canManage) return <div className="p-4 text-sm text-slate-500">Somente o administrador do sistema pode gerenciar usuários e acessos.</div>;
  const maxUsage = Math.max(1, ...usage.map(item => item.count));
  return <>
    <div className="flex flex-wrap justify-end gap-2 border-b border-slate-200 p-2 dark:border-slate-700"><button onClick={() => { setError(""); setPasswordOpen(true); }} className="inline-flex h-8 items-center gap-1.5 rounded border px-3 text-xs font-semibold"><KeyRound className="size-3.5" />Trocar minha senha</button><Link href="/configuracoes/perfis" className="inline-flex h-8 items-center rounded border px-3 text-xs font-semibold">Perfis e privilégios</Link><Link href="/configuracoes/modulos" className="inline-flex h-8 items-center rounded border px-3 text-xs font-semibold">Atualizar módulos/menus</Link><Link href="/configuracoes/usuarios" className="inline-flex h-8 items-center gap-1.5 rounded bg-emerald-700 px-3 text-xs font-semibold text-white"><Plus className="size-3.5" />Novo usuário global</Link></div>
    <section className="border-b border-slate-200 p-3 dark:border-slate-700"><div className="mb-2 flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-xs font-bold">Utilização auditada do módulo Saúde</h3><p className="text-[10px] text-slate-500">Operações persistidas no ledger por dia; não representa tempo de sessão.</p></div><form action="/saude/administracao" className="flex items-end gap-2"><input type="hidden" name="aba" value="acessos" /><label className="text-[10px] font-semibold">De<input type="date" name="de" defaultValue={usageFrom} className="ml-1 h-7 rounded border px-1 text-xs dark:bg-slate-950" /></label><label className="text-[10px] font-semibold">Até<input type="date" name="ate" defaultValue={usageUntil} className="ml-1 h-7 rounded border px-1 text-xs dark:bg-slate-950" /></label><button className="h-7 rounded bg-slate-800 px-2 text-[10px] font-semibold text-white">Aplicar</button></form></div><div className="flex h-20 items-end gap-1 rounded bg-slate-50 p-2 dark:bg-slate-950">{usage.length ? usage.map(item => <div key={item.date} title={`${new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")}: ${item.count}`} className="min-w-2 flex-1 rounded-t bg-emerald-600" style={{ height: `${Math.max(8, item.count / maxUsage * 100)}%` }} />) : <p className="m-auto text-xs text-slate-500">Nenhuma operação auditada no período.</p>}</div></section>
    <table className="w-full table-fixed border-collapse text-left text-xs"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><tr><th className="w-[24%] px-3 py-2">Usuário</th><th className="w-[19%] px-3 py-2">Pessoa / CPF</th><th className="w-[17%] px-3 py-2">Perfil</th><th className="w-[25%] px-3 py-2">Escopo Saúde</th><th className="w-[9%] px-3 py-2">Situação</th><th className="w-16 px-3 py-2">Ação</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(row => <tr key={row.id} className="h-9 hover:bg-slate-50 dark:hover:bg-slate-800/60"><td className="truncate px-3 font-medium" title={row.email}>{row.nome}<span className="block truncate text-[10px] font-normal text-slate-500">{row.email}</span></td><td className="truncate px-3">{row.personName || "Não vinculado"}<span className="block text-[10px] text-slate-500">{row.cpf || "Sem CPF vinculado"}</span></td><td className="truncate px-3">{row.profileName}</td><td className="truncate px-3" title={row.scopes.map(scope => scope.unitName).join(", ")}>{row.scopes.length ? `${row.scopes.length} unidade(s) · ${row.scopes[0].startTime}-${row.scopes[0].endTime}` : "Sem escopo específico"}</td><td className="px-3">{row.ativo ? "Ativo" : "Inativo"}</td><td className="px-3"><button title="Editar vínculo e acesso" onClick={() => { setError(""); setEditing(row); }} className="rounded p-1 text-slate-500 hover:text-emerald-700"><Pencil className="size-3.5" /></button></td></tr>)}</tbody></table>
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={submit} className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="flex justify-between border-b px-4 py-3 dark:border-slate-700"><h2 className="text-sm font-bold">Acesso à Saúde · {editing.nome}</h2><button type="button" onClick={() => setEditing(null)} className="text-xs text-slate-500">Fechar</button></div><div className="grid gap-3 overflow-y-auto p-4 text-xs sm:grid-cols-2">
      {error && <p className="rounded bg-rose-50 p-2 text-rose-700 sm:col-span-2">{error}</p>}
      <label className="font-semibold">Pessoa física / servidor<select required name="employeeId" defaultValue={editing.employeeId || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:bg-slate-950"><option value="">Selecione</option>{employees.map(item => <option key={item.id} value={item.id}>{item.name}{item.cpf ? ` · ${item.cpf}` : ""}</option>)}</select></label>
      <label className="font-semibold">Perfil<select required name="perfilId" defaultValue={editing.perfilId} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:bg-slate-950">{profiles.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <div className="flex items-center gap-4 sm:col-span-2"><label><input type="checkbox" name="ativo" defaultChecked={editing.ativo} className="mr-1" />Usuário ativo</label><label><input type="checkbox" name="canView" defaultChecked={editing.canView} className="mr-1" />Visualizar Saúde</label><label><input type="checkbox" name="canEdit" defaultChecked={editing.canEdit} className="mr-1" />Editar Saúde</label></div>
      <fieldset className="sm:col-span-2"><legend className="mb-1 font-semibold">Unidades autorizadas</legend><div className="grid max-h-28 grid-cols-1 gap-1 overflow-y-auto rounded border p-2 sm:grid-cols-2">{units.map(unit => <label key={unit.id}><input type="checkbox" name="unitIds" value={unit.id} defaultChecked={editing.scopes.some(scope => scope.unitId === unit.id)} className="mr-1" />{unit.name} <span className="text-slate-500">({unit.type})</span></label>)}</div></fieldset>
      <label className="font-semibold">Início da vigência<input type="date" name="validFrom" defaultValue={editing.scopes[0]?.validFrom || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:bg-slate-950" /></label><label className="font-semibold">Fim da vigência<input type="date" name="validUntil" defaultValue={editing.scopes[0]?.validUntil || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:bg-slate-950" /></label>
      <fieldset className="sm:col-span-2"><legend className="mb-1 font-semibold">Dias permitidos</legend><div className="flex flex-wrap gap-3">{weekdays.map((day, index) => <label key={day}><input type="checkbox" name="weekdays" value={index} defaultChecked={!editing.scopes.length || editing.scopes[0].weekdays.split(",").includes(String(index))} className="mr-1" />{day}</label>)}</div></fieldset>
      <label className="font-semibold">Horário inicial<input required type="time" name="startTime" defaultValue={editing.scopes[0]?.startTime || "00:00"} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:bg-slate-950" /></label><label className="font-semibold">Horário final<input required type="time" name="endTime" defaultValue={editing.scopes[0]?.endTime || "23:59"} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:bg-slate-950" /></label>
    </div><div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" onClick={() => setEditing(null)} className="h-8 rounded border px-3 text-xs">Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar acesso"}</button></div></form></div>}
    {passwordOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={changePassword} className="w-full max-w-md rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="border-b px-4 py-3 text-sm font-bold dark:border-slate-700">Trocar minha senha</div><div className="space-y-3 p-4 text-xs"><p className="text-slate-500">A senha permanece exclusivamente no Firebase. Use ao menos 8 caracteres, letra maiúscula, número e caractere especial.</p><label className="block font-semibold">Nova senha<input required type="password" name="password" minLength={8} autoComplete="new-password" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:bg-slate-950" /></label>{error && <p className="rounded bg-rose-50 p-2 text-rose-700">{error}</p>}</div><div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" onClick={() => setPasswordOpen(false)} className="h-8 rounded border px-3 text-xs">Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white">Alterar senha</button></div></form></div>}
  </>;
}
