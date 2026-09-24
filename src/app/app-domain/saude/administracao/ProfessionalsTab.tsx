"use client";

import { useState } from "react";
import { Eye, Link2, Pencil, Power } from "lucide-react";
import type { ProfessionalRow } from "./AdministracaoClient";
import { changeHealthProfessionalStatus, saveHealthHabilitation, saveHealthProfessionalAdministration, saveHealthProfessionalAssignment, saveHealthServiceAssignment } from "./actions";

type Props = {
  rows: ProfessionalRow[];
  editor: { kind: string; id?: string } | null;
  unitOptions: { id: string; name: string; type: string }[];
  specialtyOptions: { id: string; code: string; name: string }[];
  serviceOptions: { id: string; code: string; name: string }[];
  cboOptions: { id: string; code: string; description: string }[];
  employeeOptions: { id: string; name: string; registration: string | null; cpf: string | null }[];
  canUpdate: boolean;
  onEdit: (id: string) => void;
  onClose: () => void;
};

function badge(active: boolean) {
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"}`}>{active ? "Ativo" : "Inativo"}</span>;
}

export default function ProfessionalsTab({ rows, editor, unitOptions, specialtyOptions, serviceOptions, cboOptions, employeeOptions, canUpdate, onEdit, onClose }: Props) {
  const editing = editor?.kind === "profissionais" ? rows.find(row => row.id === editor.id) : undefined;
  const [details, setDetails] = useState<ProfessionalRow | null>(null);
  const [statusProfessional, setStatusProfessional] = useState<ProfessionalRow | null>(null);
  const [assignmentProfessional, setAssignmentProfessional] = useState<ProfessionalRow | null>(null);
  const [referenceConfig, setReferenceConfig] = useState<{ professional: ProfessionalRow; kind: "servico" | "habilitacao" } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const mainAssignment = editing?.assignments.find(item => item.unit.id === editing.unit?.id) || editing?.assignments[0];

  async function submitProfessional(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError("");
    const values = new FormData(event.currentTarget);
    const result = await saveHealthProfessionalAdministration(editing?.id || null, {
      employeeId: String(values.get("employeeId") || ""), cns: String(values.get("cns") || ""), treatment: String(values.get("treatment") || ""),
      cbo: String(values.get("cbo") || ""), councilName: String(values.get("councilName") || ""), councilNumber: String(values.get("councilNumber") || ""),
      specialtyId: String(values.get("specialtyId") || ""), unitId: String(values.get("unitId") || ""), weeklyHours: String(values.get("weeklyHours") || ""),
      isAuditor: values.get("isAuditor") === "on", consultationIntervalMinutes: String(values.get("consultationIntervalMinutes") || ""),
    });
    setSaving(false);
    if ("error" in result) setError(result.error); else onClose();
  }

  async function submitStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!statusProfessional) return;
    setSaving(true); setError("");
    const result = await changeHealthProfessionalStatus({ id: statusProfessional.id, isActive: !statusProfessional.isActive, reason });
    setSaving(false);
    if ("error" in result) setError(result.error); else { setStatusProfessional(null); setReason(""); }
  }

  async function submitAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignmentProfessional) return;
    setSaving(true); setError("");
    const values = new FormData(event.currentTarget);
    const result = await saveHealthProfessionalAssignment(null, { professionalId: assignmentProfessional.id, unitId: String(values.get("unitId")), specialtyId: String(values.get("specialtyId") || ""), weeklyHours: Number(values.get("weeklyHours")), isActive: true });
    setSaving(false);
    if ("error" in result) setError(result.error); else { setAssignmentProfessional(null); setDetails(null); }
  }

  async function submitReference(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!referenceConfig) return;
    setSaving(true); setError("");
    const values = new FormData(event.currentTarget);
    const result = referenceConfig.kind === "servico"
      ? await saveHealthServiceAssignment(null, { serviceId: String(values.get("serviceId")), unitId: null, professionalId: referenceConfig.professional.id, isActive: true })
      : await saveHealthHabilitation(null, { code: String(values.get("code")), description: String(values.get("description")), unitId: null, professionalId: referenceConfig.professional.id, isActive: true });
    setSaving(false);
    if ("error" in result) setError(result.error); else { setReferenceConfig(null); setDetails(null); }
  }

  return <>
    <table className="w-full table-fixed border-collapse text-left text-xs"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><tr><th className="w-[31%] px-3 py-2">Profissional</th><th className="w-[16%] px-3 py-2">CPF</th><th className="hidden w-[16%] px-3 py-2 lg:table-cell">CNS</th><th className="w-[22%] px-3 py-2">Especialidade</th><th className="w-[9%] px-3 py-2">Situação</th><th className="w-24 px-3 py-2 text-right">Ações</th></tr></thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(row => <tr key={row.id} className="h-9 hover:bg-slate-50 dark:hover:bg-slate-800/60"><td className="truncate px-3 font-medium" title={row.employee.name}>{row.treatment ? `${row.treatment} ` : ""}{row.employee.name}</td><td className="truncate px-3 text-slate-600 dark:text-slate-300">{row.employee.cpf || "–"}</td><td className="hidden truncate px-3 text-slate-600 dark:text-slate-300 lg:table-cell">{row.cns || "–"}</td><td className="truncate px-3 text-slate-600 dark:text-slate-300">{row.specialty || "–"}</td><td className="px-3">{badge(row.isActive)}</td><td className="px-3"><div className="flex justify-end gap-1"><button title="Detalhes" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-emerald-700" onClick={() => setDetails(row)}><Eye className="size-3.5" /></button>{canUpdate && row.isActive && <button title="Vincular serviço ou habilitação" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-emerald-700" onClick={() => { setError(""); setReferenceConfig({ professional: row, kind: "servico" }); }}><Link2 className="size-3.5" /></button>}{canUpdate && <button title="Editar" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-emerald-700" onClick={() => onEdit(row.id)}><Pencil className="size-3.5" /></button>}{canUpdate && <button title={row.isActive ? "Inativar" : "Ativar"} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-amber-700" onClick={() => { setError(""); setStatusProfessional(row); }}><Power className="size-3.5" /></button>}</div></td></tr>)}</tbody>
    </table>

    {editor?.kind === "profissionais" && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true"><form onSubmit={submitProfessional} className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700"><h2 className="text-sm font-bold">{editing ? "Editar Profissional" : "Novo Profissional"}</h2><button type="button" className="text-xs text-slate-500" onClick={onClose}>Fechar</button></div><div className="grid gap-3 overflow-y-auto p-4 sm:grid-cols-2 text-xs">
      {error && <p className="sm:col-span-2 rounded bg-rose-50 p-2 text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
      <label className="sm:col-span-2 font-semibold">Pessoa / vínculo funcional<select disabled={Boolean(editing)} required name="employeeId" defaultValue={editing?.employeeId || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal disabled:opacity-70 dark:border-slate-600 dark:bg-slate-950"><option value="">Selecione</option>{employeeOptions.map(option => <option key={option.id} value={option.id}>{option.name}{option.registration ? ` · ${option.registration}` : ""}{option.cpf ? ` · ${option.cpf}` : ""}</option>)}</select>{editing && <input type="hidden" name="employeeId" value={editing.employeeId} />}</label>
      <label className="font-semibold">Tratamento<input name="treatment" defaultValue={editing?.treatment || ""} placeholder="Dra., Dr., Enf." className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label><label className="font-semibold">CNS<input name="cns" defaultValue={editing?.cns || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>
      <label className="font-semibold">CBO<select name="cbo" defaultValue={editing?.cbo || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950"><option value="">Selecione</option>{cboOptions.map(option => <option key={option.id} value={option.code}>{option.code} - {option.description}</option>)}</select></label><label className="font-semibold">Especialidade<select name="specialtyId" defaultValue={mainAssignment?.specialty?.id || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950"><option value="">Selecione</option>{specialtyOptions.map(option => <option key={option.id} value={option.id}>{option.code} - {option.name}</option>)}</select></label>
      <label className="font-semibold">Conselho<input name="councilName" defaultValue={editing?.councilName || ""} placeholder="CRM, COREN, CRO" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label><label className="font-semibold">Número do conselho<input name="councilNumber" defaultValue={editing?.councilNumber || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>
      <label className="font-semibold">Unidade<select name="unitId" defaultValue={mainAssignment?.unit.id || editing?.unit?.id || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950"><option value="">Selecione</option>{unitOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label><label className="font-semibold">Carga semanal<input type="number" min="0" max="168" name="weeklyHours" defaultValue={mainAssignment?.weeklyHours || 0} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>
      <label className="font-semibold">Intervalo de consulta (min.)<input type="number" min="1" max="480" name="consultationIntervalMinutes" defaultValue={editing?.consultationIntervalMinutes || ""} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label><label className="flex items-center gap-2 pt-5 font-semibold"><input type="checkbox" name="isAuditor" defaultChecked={editing?.isAuditor} />Profissional auditor</label>
    </div><div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" onClick={onClose} className="h-8 rounded border px-3 text-xs">Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button></div></form></div>}

    {statusProfessional && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={submitStatus} className="w-full max-w-md rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="border-b px-4 py-3 text-sm font-bold dark:border-slate-700">{statusProfessional.isActive ? "Inativar" : "Ativar"} profissional</div><div className="space-y-3 p-4 text-xs"><p>{statusProfessional.employee.name}</p>{statusProfessional.isActive && <label className="block font-semibold">Motivo da inativação<textarea required value={reason} onChange={event => setReason(event.target.value)} className="mt-1 min-h-20 w-full rounded border p-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>}{error && <p className="rounded bg-rose-50 p-2 text-rose-700">{error}</p>}</div><div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" onClick={() => setStatusProfessional(null)} className="h-8 rounded border px-3 text-xs">Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white">Confirmar</button></div></form></div>}

    {details && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700"><h2 className="truncate text-sm font-bold">{details.employee.name}</h2><button className="text-xs text-slate-500" onClick={() => setDetails(null)}>Fechar</button></div><div className="space-y-4 overflow-y-auto p-4 text-xs">{canUpdate && details.isActive && <button className="rounded border px-2 py-1 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => { setError(""); setAssignmentProfessional(details); }}>Novo vínculo</button>}<div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><span><b>CPF:</b> {details.employee.cpf || "–"}</span><span><b>CNS:</b> {details.cns || "–"}</span><span><b>CBO:</b> {details.cbo || "–"}</span><span><b>Conselho:</b> {details.councilName || "–"}</span><span><b>RG:</b> {details.employee.person?.rg || "–"}</span><span><b>Órgão:</b> {details.employee.person?.rgIssuer || "–"}</span><span><b>Telefone:</b> {details.employee.person?.phonePrimary || details.employee.phone || "–"}</span><span className="truncate" title={details.employee.person?.email || details.employee.email || ""}><b>E-mail:</b> {details.employee.person?.email || details.employee.email || "–"}</span></div><div><h3 className="mb-1 font-bold">Endereço</h3>{details.employee.person?.addresses[0] ? <p className="text-slate-600 dark:text-slate-300">{details.employee.person.addresses[0].streetName || "Logradouro não informado"}, {details.employee.person.addresses[0].number || "s/n"} · {details.employee.person.addresses[0].neighborhood?.name || "Bairro não informado"} · {details.employee.person.addresses[0].neighborhood?.city || "Município não informado"}/{details.employee.person.addresses[0].neighborhood?.state || "–"} · CEP {details.employee.person.addresses[0].zipCode || "–"}</p> : <p className="text-slate-500">Nenhum endereço vinculado à pessoa.</p>}</div><div><h3 className="mb-1 font-bold">Documentos</h3><p className="text-slate-600 dark:text-slate-300">{details.employee.person?.documents.map(document => `${document.documentType}: ${document.title}`).join(", ") || "Nenhum documento anexado à pessoa."}</p></div><div><h3 className="mb-1 font-bold">Vínculos</h3>{details.assignments.length ? details.assignments.map(item => <p key={item.id} className="border-t py-1 dark:border-slate-700">{item.unit.name} · {item.specialty?.name || "Sem especialidade"} · {item.weeklyHours}h semanais · {item.isActive ? "Ativo" : "Inativo"}</p>) : <p className="text-slate-500">Nenhum vínculo registrado.</p>}</div><div><h3 className="mb-1 font-bold">Histórico de situação</h3>{details.statusHistory.length ? details.statusHistory.map(item => <p key={item.id} className="border-t py-1 dark:border-slate-700">{new Date(item.occurredAt).toLocaleString("pt-BR")} · {item.isActive ? "Ativação" : "Inativação"}{item.reason ? ` · ${item.reason}` : ""}</p>) : <p className="text-slate-500">Sem alterações de situação.</p>}</div></div></div></div>}

    {assignmentProfessional && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={submitAssignment} className="w-full max-w-md rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="border-b px-4 py-3 text-sm font-bold dark:border-slate-700">Vincular unidade e especialidade</div><div className="space-y-3 p-4 text-xs"><label className="block font-semibold">Unidade<select required name="unitId" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950"><option value="">Selecione</option>{unitOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label><label className="block font-semibold">Especialidade<select name="specialtyId" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950"><option value="">Sem especialidade</option>{specialtyOptions.map(option => <option key={option.id} value={option.id}>{option.code} - {option.name}</option>)}</select></label><label className="block font-semibold">Carga semanal<input required type="number" min="0" max="168" name="weeklyHours" defaultValue="20" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label>{error && <p className="rounded bg-rose-50 p-2 text-rose-700">{error}</p>}</div><div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" className="h-8 rounded border px-3 text-xs" onClick={() => setAssignmentProfessional(null)}>Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white">Salvar vínculo</button></div></form></div>}

    {referenceConfig && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={submitReference} className="w-full max-w-md rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="border-b px-4 py-3 text-sm font-bold dark:border-slate-700">Serviços e habilitações</div><div className="space-y-3 p-4 text-xs"><p className="font-semibold">{referenceConfig.professional.employee.name}</p><label className="block font-semibold">Tipo<select value={referenceConfig.kind} onChange={event => setReferenceConfig({ ...referenceConfig, kind: event.target.value as "servico" | "habilitacao" })} className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950"><option value="servico">Serviço SUS / classificação</option><option value="habilitacao">Habilitação</option></select></label>{referenceConfig.kind === "servico" ? <label className="block font-semibold">Serviço<select required name="serviceId" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950"><option value="">Selecione</option>{serviceOptions.map(option => <option key={option.id} value={option.id}>{option.code} - {option.name}</option>)}</select></label> : <><label className="block font-semibold">Código<input required name="code" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label><label className="block font-semibold">Descrição<input required name="description" className="mt-1 h-8 w-full rounded border px-2 font-normal dark:border-slate-600 dark:bg-slate-950" /></label></>}<div><b>Atuais:</b> {[...referenceConfig.professional.serviceAssignments.map(item => item.service.name), ...referenceConfig.professional.habilitations.map(item => item.description)].join(", ") || "Nenhum vínculo."}</div>{error && <p className="rounded bg-rose-50 p-2 text-rose-700">{error}</p>}</div><div className="flex justify-end gap-2 border-t px-4 py-3 dark:border-slate-700"><button type="button" className="h-8 rounded border px-3 text-xs" onClick={() => setReferenceConfig(null)}>Cancelar</button><button disabled={saving} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white">Salvar vínculo</button></div></form></div>}
  </>;
}
