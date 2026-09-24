import { redirect } from "next/navigation";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { getPatientPortalAccess } from "@/lib/portal-paciente/access";
import { portalAppointments, portalOpenSchedules } from "@/lib/saude/patient-portal-service";
import { cancelAppointmentAction, confirmAppointmentAction, requestAppointmentAction } from "../actions";

const field = "h-8 min-w-0 rounded border border-slate-200 bg-white px-2 text-xs";

export default async function PortalAgendaPage() {
  const access = await getPatientPortalAccess();
  if (access.status !== "AVAILABLE") redirect("/app-domain/login");
  const [appointments, units, schedules] = await Promise.all([
    portalAppointments(access.context, access.patient.id),
    access.context.prisma.healthUnit.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    portalOpenSchedules(access.context),
  ]);
  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Minha agenda" />
      <details className="shrink-0 rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Solicitar agendamento</summary><form action={requestAppointmentAction} className="mt-2 grid gap-1 sm:grid-cols-4"><select name="unitId" required className={field}><option value="">Unidade</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><input name="date" type="datetime-local" required className={field} /><input name="specialty" placeholder="Especialidade desejada" className={field} /><select name="scheduleId" className={field}><option value="">Vaga livre</option>{schedules.filter(s => s.free > 0).map(s => <option key={s.id} value={s.id}>{s.unit} · {s.specialty || "Geral"} · {s.when} · {s.free} vagas</option>)}</select><button className="h-8 rounded bg-emerald-700 px-2 font-semibold text-white">Solicitar</button></form></details>
      <details className="shrink-0 rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Vagas disponíveis ({schedules.filter(s => s.free > 0).length})</summary><div className="mt-1 max-h-32 overflow-y-auto">{schedules.map(s => <p key={s.id} className="border-b py-1"><strong>{s.unit}</strong> · {s.specialty || "Geral"}{s.professional ? ` · ${s.professional}` : ""} · {s.when} · <strong>{s.free}/{s.total} vagas</strong></p>)}{schedules.length === 0 && <p className="text-slate-400">Sem cronogramas abertos.</p>}</div></details>
      <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto">
        {appointments.map(a => (
          <article key={a.id} className="rounded border bg-white p-2 text-xs">
            <strong>{a.date.toLocaleDateString("pt-BR")} · {a.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {a.status}</strong>
            <p className="text-slate-500">{a.specialty || "Atendimento"} · {a.unit?.name}</p>
            <div className="mt-1 flex gap-1">
              {a.status === "Agendado" && <form action={confirmAppointmentAction}><input type="hidden" name="appointmentId" value={a.id} /><button className="rounded border px-2 py-1">Confirmar</button></form>}
              {!["Atendido", "Faltou", "Cancelado"].includes(a.status) && <form action={cancelAppointmentAction} className="flex gap-1"><input type="hidden" name="appointmentId" value={a.id} /><input name="reason" placeholder="Motivo" className="h-7 rounded border px-1" /><button className="rounded border px-2 py-1">Cancelar</button></form>}
            </div>
          </article>
        ))}
        {appointments.length === 0 && <p className="text-xs text-slate-400">Nenhum agendamento.</p>}
      </div>
    </PageFrame>
  );
}
