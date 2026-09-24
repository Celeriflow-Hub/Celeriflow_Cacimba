"use client";

import { useState, useTransition } from "react";
import { ESUS_FORM_SCHEMAS, type EsusField } from "@/lib/saude/sisab-form-config";
import { saveFormAction } from "./actions";

type Option = { id: string; label: string };
const inputCls = "h-8 min-w-0 rounded border border-slate-200 bg-white px-2 text-xs";

function FieldInput({ field, fieldName }: { field: EsusField; fieldName: string }) {
  if (field.type === "boolean") return <label className="flex h-8 items-center gap-2 text-xs"><input type="checkbox" name={fieldName} />{field.label}</label>;
  if (field.type === "select") return <select name={fieldName} required={field.required} className={inputCls} defaultValue=""><option value="">{field.label}</option>{field.options?.map(o => <option key={o}>{o}</option>)}</select>;
  return <input name={fieldName} type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} step={field.type === "number" ? "any" : undefined} required={field.required} placeholder={field.label} className={inputCls} />;
}

export default function SisabFormClient({ patients, households, families, professionals, teams, units, records }: {
  patients: Option[]; households: Option[]; families: Option[]; professionals: Option[]; teams: Option[]; units: Option[]; records: Option[];
}) {
  const [kind, setKind] = useState("VISITA");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const schema = ESUS_FORM_SCHEMAS[kind] || [];

  return (
    <details className="rounded border bg-white p-2 text-xs">
      <summary className="cursor-pointer font-semibold">Nova ficha tipada (central única)</summary>
      <form action={(data) => start(async () => {
        setError("");
        const fields: Record<string, unknown> = {};
        for (const item of schema) {
          const raw = data.get(`field_${item.key}`);
          if (item.type === "boolean") fields[item.key] = raw === "on";
          else if (raw !== null && raw !== "") fields[item.key] = item.type === "number" ? Number(raw) : String(raw);
        }
        data.set("fields", JSON.stringify(fields));
        const result = await saveFormAction(data);
        if (result?.error) setError(result.error);
      })} className="mt-2 grid gap-1">
        <select name="kind" required value={kind} onChange={e => setKind(e.target.value)} className={inputCls}>{Object.keys(ESUS_FORM_SCHEMAS).map(k => <option key={k}>{k}</option>)}</select>
        <select name="patientId" className={inputCls}><option value="">Paciente (reutiliza cadastro)</option>{patients.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
        <select name="householdId" className={inputCls}><option value="">Domicílio</option>{households.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}</select>
        <select name="familyId" className={inputCls}><option value="">Família</option>{families.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
        <select name="professionalId" required className={inputCls}><option value="">Profissional</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
        <select name="teamId" className={inputCls}><option value="">Equipe</option>{teams.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
        <select name="unitId" required className={inputCls}><option value="">Unidade</option>{units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}</select>
        <select name="originMedicalRecordId" className={inputCls}><option value="">Sem vínculo PEP (não duplica atendimento)</option>{records.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
        <input name="period" type="month" required className={inputCls} />
        {schema.map(item => <FieldInput key={item.key} field={item} fieldName={`field_${item.key}`} />)}
        <textarea name="details" placeholder="Conteúdo essencial da ficha" className="min-h-12 rounded border p-2" />
        {error && <p className="text-rose-600">{error}</p>}
        <button className="h-8 rounded bg-sky-700 font-semibold text-white" disabled={pending}>Salvar rascunho</button>
      </form>
    </details>
  );
}
