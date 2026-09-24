"use client";

import { useState } from "react";
import { Clock3, Eye, Link2, Pencil, Power } from "lucide-react";
import type { UnitRow } from "./AdministracaoClient";
import {
  changeHealthUnitStatus,
  saveHealthHabilitation,
  saveHealthServiceAssignment,
  saveHealthUnitAdministration,
  saveHealthUnitShift,
  saveHealthUnitSpecialty,
} from "./actions";

type UnitForm = { name: string; type: string; cnes: string; phone: string; email: string; isThirdParty: boolean };
type Props = {
  rows: UnitRow[];
  specialtyOptions: { id: string; code: string; name: string }[];
  serviceOptions: { id: string; code: string; name: string }[];
  editor: { kind: string; id?: string } | null;
  canUpdate: boolean;
  onEdit: (id: string) => void;
  onClose: () => void;
};

const emptyForm: UnitForm = { name: "", type: "UBS", cnes: "", phone: "", email: "", isThirdParty: false };
const unitTypes = ["UBS", "ESF", "UPA", "Hospital", "CAPS", "Farmácia", "Centro de Especialidades", "Maternidade", "Outros"];
const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"}`}>{active ? "Ativa" : "Inativa"}</span>;
}

export default function UnitsTab({ rows, specialtyOptions, serviceOptions, editor, canUpdate, onEdit, onClose }: Props) {
  const editing = editor?.kind === "unidades" ? rows.find(row => row.id === editor.id) : undefined;
  const [statusUnit, setStatusUnit] = useState<UnitRow | null>(null);
  const [details, setDetails] = useState<UnitRow | null>(null);
  const [config, setConfig] = useState<{ unit: UnitRow; kind: "turno" | "especialidade" | "servico" | "habilitacao" } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitUnit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const values = new FormData(event.currentTarget);
    const result = await saveHealthUnitAdministration(editing?.id || null, {
      name: String(values.get("name") || ""),
      type: String(values.get("type") || ""),
      cnes: String(values.get("cnes") || ""),
      phone: String(values.get("phone") || ""),
      email: String(values.get("email") || ""),
      isThirdParty: values.get("isThirdParty") === "on",
    });
    setSaving(false);
    if ("error" in result) setError(result.error); else onClose();
  }

  async function submitStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!statusUnit) return;
    setSaving(true);
    setError("");
    const result = await changeHealthUnitStatus({ id: statusUnit.id, isActive: !statusUnit.isActive, reason });
    setSaving(false);
    if ("error" in result) setError(result.error); else { setStatusUnit(null); setReason(""); }
  }

  async function submitConfiguration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;
    setSaving(true);
    setError("");
    const values = new FormData(event.currentTarget);
    let result;
    if (config.kind === "turno") {
      result = await saveHealthUnitShift(null, { unitId: config.unit.id, dayOfWeek: Number(values.get("dayOfWeek")), startTime: String(values.get("startTime")), endTime: String(values.get("endTime")), isActive: true });
    } else if (config.kind === "especialidade") {
      result = await saveHealthUnitSpecialty(null, { unitId: config.unit.id, specialtyId: String(values.get("specialtyId")), isActive: true });
    } else if (config.kind === "servico") {
      result = await saveHealthServiceAssignment(null, { unitId: config.unit.id, professionalId: null, serviceId: String(values.get("serviceId")), isActive: true });
    } else {
      result = await saveHealthHabilitation(null, { unitId: config.unit.id, professionalId: null, code: String(values.get("code")), description: String(values.get("description")), isActive: true });
    }
    setSaving(false);
    if ("error" in result) setError(result.error); else { setConfig(null); setDetails(null); }
  }

  return (
    <>
      <table className="w-full table-fixed border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <tr><th className="w-[34%] px-3 py-2">Unidade</th><th className="w-[15%] px-3 py-2">Tipo</th><th className="w-[12%] px-3 py-2">CNES</th><th className="hidden w-[17%] px-3 py-2 lg:table-cell">Telefone</th><th className="w-[10%] px-3 py-2">Situação</th><th className="w-24 px-3 py-2 text-right">Ações</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map(row => <tr key={row.id} className="h-9 hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <td className="truncate px-3 font-medium text-slate-900 dark:text-slate-100" title={row.name}>{row.name}</td>
            <td className="truncate px-3 text-slate-600 dark:text-slate-300">{row.type}</td>
            <td className="truncate px-3 text-slate-600 dark:text-slate-300">{row.cnes || "–"}</td>
            <td className="hidden truncate px-3 text-slate-600 dark:text-slate-300 lg:table-cell">{row.phone || "–"}</td>
            <td className="px-3"><StatusBadge active={row.isActive} /></td>
            <td className="px-3"><div className="flex justify-end gap-1">
              <button title="Detalhes e vínculos" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 dark:hover:bg-slate-800" onClick={() => setDetails(row)}><Eye className="size-3.5" /></button>
              {canUpdate && <button title="Editar" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 dark:hover:bg-slate-800" onClick={() => onEdit(row.id)}><Pencil className="size-3.5" /></button>}
              {canUpdate && <button title={row.isActive ? "Inativar" : "Ativar"} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-amber-700 dark:hover:bg-slate-800" onClick={() => { setError(""); setStatusUnit(row); }}><Power className="size-3.5" /></button>}
            </div></td>
          </tr>)}
        </tbody>
      </table>

      {editor?.kind === "unidades" && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true">
        <form onSubmit={submitUnit} className="w-full max-w-xl rounded-md bg-white shadow-xl dark:bg-slate-900">
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700"><h2 className="text-sm font-bold">{editing ? "Editar Unidade de Saúde" : "Nova Unidade de Saúde"}</h2><button type="button" className="text-xs text-slate-500" onClick={onClose}>Fechar</button></div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {error && <p className="sm:col-span-2 rounded bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
            <label className="sm:col-span-2 text-xs font-semibold">Nome<input required name="name" defaultValue={editing?.name || emptyForm.name} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>
            <label className="text-xs font-semibold">Tipo<select required name="type" defaultValue={editing?.type || emptyForm.type} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950">{unitTypes.map(type => <option key={type}>{type}</option>)}</select></label>
            <label className="text-xs font-semibold">CNES<input name="cnes" defaultValue={editing?.cnes || emptyForm.cnes} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>
            <label className="text-xs font-semibold">Telefone<input name="phone" defaultValue={editing?.phone || emptyForm.phone} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>
            <label className="text-xs font-semibold">E-mail<input type="email" name="email" defaultValue={editing?.email || emptyForm.email} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>
            <label className="flex items-center gap-2 text-xs font-semibold sm:col-span-2"><input type="checkbox" name="isThirdParty" defaultChecked={editing?.isThirdParty || false} />Unidade terceira / prestador externo</label>
          </div>
          <div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" onClick={onClose} className="h-8 rounded border px-3 text-xs">Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button></div>
        </form>
      </div>}

      {statusUnit && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true"><form onSubmit={submitStatus} className="w-full max-w-md rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="border-b px-4 py-3 text-sm font-bold dark:border-slate-700">{statusUnit.isActive ? "Inativar" : "Ativar"} unidade</div><div className="space-y-3 p-4"><p className="text-xs text-slate-600 dark:text-slate-300">{statusUnit.name}</p>{statusUnit.isActive && <label className="block text-xs font-semibold">Motivo da inativação<textarea required value={reason} onChange={event => setReason(event.target.value)} className="mt-1 min-h-20 w-full rounded border p-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>}{error && <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}</div><div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" className="h-8 rounded border px-3 text-xs" onClick={() => setStatusUnit(null)}>Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white">Confirmar</button></div></form></div>}

      {details && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true"><div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700"><h2 className="truncate text-sm font-bold">{details.name}</h2><button className="text-xs text-slate-500" onClick={() => setDetails(null)}>Fechar</button></div><div className="space-y-4 overflow-y-auto p-4 text-xs">
        {canUpdate && details.isActive && <div className="flex flex-wrap gap-1.5 border-b pb-3 dark:border-slate-700"><button onClick={() => setConfig({ unit: details, kind: "turno" })} className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"><Link2 className="size-3" />Turno</button><button onClick={() => setConfig({ unit: details, kind: "especialidade" })} className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"><Link2 className="size-3" />Especialidade</button><button onClick={() => setConfig({ unit: details, kind: "servico" })} className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"><Link2 className="size-3" />Serviço</button><button onClick={() => setConfig({ unit: details, kind: "habilitacao" })} className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"><Link2 className="size-3" />Habilitação</button></div>}
        <p><b>Natureza:</b> {details.isThirdParty ? "Unidade terceira" : "Unidade própria"}</p><div><h3 className="mb-1 font-bold">Turnos</h3><div className="flex flex-wrap gap-1">{details.shifts.length ? details.shifts.map(shift => <span key={shift.id} className="rounded border px-2 py-1"><Clock3 className="mr-1 inline size-3" />{weekDays[shift.dayOfWeek]} {shift.startTime}–{shift.endTime}</span>) : <span className="text-slate-500">Nenhum turno vinculado.</span>}</div></div>
        <div><h3 className="mb-1 font-bold">Especialidades</h3><p className="text-slate-600 dark:text-slate-300">{details.specialties.map(item => item.specialty.name).join(", ") || "Nenhuma especialidade vinculada."}</p></div>
        <div><h3 className="mb-1 font-bold">Serviços e classificações</h3><p className="text-slate-600 dark:text-slate-300">{details.services.map(item => `${item.service.code} - ${item.service.name}`).join(", ") || "Nenhum serviço vinculado."}</p></div>
        <div><h3 className="mb-1 font-bold">Habilitações</h3><p className="text-slate-600 dark:text-slate-300">{details.habilitations.map(item => `${item.code} - ${item.description}`).join(", ") || "Nenhuma habilitação vinculada."}</p></div>
        <div><h3 className="mb-1 font-bold">Histórico de situação</h3>{details.statusHistory.length ? details.statusHistory.map(item => <p key={item.id} className="border-t py-1 text-slate-600 dark:border-slate-700 dark:text-slate-300">{new Date(item.occurredAt).toLocaleString("pt-BR")} · {item.isActive ? "Ativação" : "Inativação"}{item.reason ? ` · ${item.reason}` : ""}</p>) : <p className="text-slate-500">Sem alterações de situação.</p>}</div>
      </div></div></div>}

      {config && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true"><form onSubmit={submitConfiguration} className="w-full max-w-md rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700"><h2 className="text-sm font-bold">Vincular {config.kind}</h2><button type="button" className="text-xs text-slate-500" onClick={() => setConfig(null)}>Fechar</button></div><div className="space-y-3 p-4 text-xs">
        <p className="font-semibold text-slate-700 dark:text-slate-200">{config.unit.name}</p>
        {config.kind === "turno" && <div className="grid grid-cols-3 gap-2"><label className="font-semibold">Dia<select name="dayOfWeek" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950">{weekDays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><label className="font-semibold">Início<input required type="time" name="startTime" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label><label className="font-semibold">Fim<input required type="time" name="endTime" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label></div>}
        {config.kind === "especialidade" && <label className="block font-semibold">Especialidade<select required name="specialtyId" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950"><option value="">Selecione</option>{specialtyOptions.map(option => <option key={option.id} value={option.id}>{option.code} - {option.name}</option>)}</select></label>}
        {config.kind === "servico" && <label className="block font-semibold">Serviço SUS / classificação<select required name="serviceId" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950"><option value="">Selecione</option>{serviceOptions.map(option => <option key={option.id} value={option.id}>{option.code} - {option.name}</option>)}</select></label>}
        {config.kind === "habilitacao" && <><label className="block font-semibold">Código<input required name="code" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label><label className="block font-semibold">Descrição<input required name="description" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label></>}
        {error && <p className="rounded bg-rose-50 p-2 text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
      </div><div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" onClick={() => setConfig(null)} className="h-8 rounded border px-3">Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 font-semibold text-white disabled:opacity-50">Salvar vínculo</button></div></form></div>}
    </>
  );
}
