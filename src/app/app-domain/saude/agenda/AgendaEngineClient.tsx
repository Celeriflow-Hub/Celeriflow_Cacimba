"use client";

import { useState, useTransition } from "react";
import { addWaitlistAction, remanejarAppointmentAction, saveScheduleAction, transitionScheduleAction, transitionWaitlistAction } from "./schedule-actions";

type Schedule = { id: string; kind: string; unit: string; specialty: string | null; professional: string | null; when: string; slots: string; status: string };
type WaitEntry = { id: string; patient: string; specialty: string | null; priority: string; status: string; createdAt: string };
type Slim = { id: string; label: string };

const field = "h-8 min-w-0 rounded border border-slate-200 bg-white px-2 text-xs";
const btn = "h-8 rounded bg-emerald-700 px-2 font-semibold text-white text-xs";

export default function AgendaEngineClient({ schedules, waitlist, patients, units, professionals, specialties, appointments, canCreate, canUpdate }: {
  schedules: Schedule[]; waitlist: WaitEntry[]; patients: Slim[]; units: Slim[]; professionals: Slim[]; specialties: Slim[]; appointments: Slim[]; canCreate: boolean; canUpdate: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const run = (action: () => Promise<{ error?: string }>) => start(async () => { setError(""); const result = await action(); if (result?.error) setError(result.error); });

  return (
    <div className="grid shrink-0 gap-2 lg:grid-cols-3">
      <details className="rounded border bg-white p-2 text-xs">
        <summary className="cursor-pointer font-semibold">Cronogramas e vagas</summary>
        {canCreate && <form action={(data) => run(async () => saveScheduleAction({ kind: String(data.get("kind")), unitId: String(data.get("unitId")), specialtyId: String(data.get("specialtyId")) || null, professionalId: String(data.get("professionalId")) || null, weekday: data.get("weekday") === "" ? null : Number(data.get("weekday")), date: String(data.get("date")) || null, startTime: String(data.get("startTime")) || null, endTime: String(data.get("endTime")) || null, totalSlots: Number(data.get("totalSlots")) }))} className="mt-2 grid gap-1">
          <div className="grid grid-cols-2 gap-1"><select name="kind" className={field}><option value="FIXO">Fixo</option><option value="DIARIO">Diário</option></select><input name="totalSlots" type="number" min="1" required placeholder="Vagas" className={field} /></div>
          <select name="unitId" required className={field}><option value="">Unidade</option>{units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}</select>
          <select name="specialtyId" className={field}><option value="">Especialidade</option>{specialties.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          <select name="professionalId" className={field}><option value="">Profissional</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
          <div className="grid grid-cols-2 gap-1"><select name="weekday" className={field}><option value="">Dia (fixo)</option>{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => <option key={d} value={i}>{d}</option>)}</select><input name="date" type="date" className={field} /></div>
          <div className="grid grid-cols-2 gap-1"><input name="startTime" type="time" className={field} /><input name="endTime" type="time" className={field} /></div>
          <button className={btn} disabled={pending}>Salvar cronograma</button>
        </form>}
        <div className="mt-2 max-h-56 overflow-y-auto">{schedules.map(s => <article key={s.id} className="mb-1 rounded border p-2"><strong>{s.kind} · {s.when}</strong><p className="text-slate-500">{s.unit}{s.specialty ? ` · ${s.specialty}` : ""}{s.professional ? ` · ${s.professional}` : ""}</p><p>Vagas {s.slots} · {s.status}</p>{canUpdate && s.status === "Ativo" && <form action={(data) => run(async () => transitionScheduleAction(s.id, "Bloqueado", String(data.get("reason"))))} className="mt-1 flex gap-1"><input name="reason" required placeholder="Motivo do bloqueio" className={`${field} flex-1`} /><button className="rounded border px-2 py-1">Bloquear</button></form>}</article>)}{schedules.length === 0 && <p className="text-slate-400">Sem cronogramas.</p>}</div>
      </details>
      <details className="rounded border bg-white p-2 text-xs">
        <summary className="cursor-pointer font-semibold">Lista de espera</summary>
        {canCreate && <form action={(data) => run(async () => addWaitlistAction({ patientId: String(data.get("patientId")), specialtyId: String(data.get("specialtyId")) || null, scheduleId: String(data.get("scheduleId")) || null, priority: String(data.get("priority")), notes: String(data.get("notes")) || null }))} className="mt-2 grid gap-1">
          <select name="patientId" required className={field}><option value="">Paciente</option>{patients.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
          <div className="grid grid-cols-2 gap-1"><select name="specialtyId" className={field}><option value="">Especialidade</option>{specialties.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select><select name="priority" className={field}><option>Normal</option><option>Prioridade</option><option>Urgência</option></select></div>
          <button className={btn} disabled={pending}>Incluir na espera</button>
        </form>}
        <div className="mt-2 max-h-56 overflow-y-auto">{waitlist.map(w => <article key={w.id} className="mb-1 rounded border p-2"><strong>{w.patient}</strong><p className="text-slate-500">{w.specialty || "-"} · {w.priority} · {w.status}</p>{canUpdate && w.status === "Aguardando" && <div className="mt-1 flex gap-1"><button className="rounded border px-2 py-1" disabled={pending} onClick={() => run(async () => transitionWaitlistAction(w.id, "Chamado"))}>Chamar</button><button className="rounded border px-2 py-1" disabled={pending} onClick={() => run(async () => transitionWaitlistAction(w.id, "Cancelado"))}>Cancelar</button></div>}</article>)}{waitlist.length === 0 && <p className="text-slate-400">Espera vazia.</p>}</div>
      </details>
      <details className="rounded border bg-white p-2 text-xs">
        <summary className="cursor-pointer font-semibold">Remanejar agendamento</summary>
        {canUpdate && <form action={(data) => run(async () => remanejarAppointmentAction({ appointmentId: String(data.get("appointmentId")), date: String(data.get("date")), professionalId: String(data.get("professionalId")) || null, reason: String(data.get("reason")) }))} className="mt-2 grid gap-1">
          <select name="appointmentId" required className={field}><option value="">Agendamento</option>{appointments.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select>
          <input name="date" type="datetime-local" required className={field} />
          <select name="professionalId" className={field}><option value="">Manter profissional</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
          <input name="reason" required placeholder="Motivo" className={field} />
          <button className={btn} disabled={pending}>Confirmar remanejo</button>
        </form>}
        {error && <p className="mt-2 text-rose-600">{error}</p>}
      </details>
    </div>
  );
}
