import Link from "next/link";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { getPatientPortalAccess } from "@/lib/portal-paciente/access";
import { portalAppointments, portalLabReports } from "@/lib/saude/patient-portal-service";
import { listPatientTimeline } from "@/lib/saude/patient-timeline-service";

export default async function PortalPacienteHome() {
  const access = await getPatientPortalAccess();
  if (access.status !== "AVAILABLE") {
    return (
      <PageFrame className="flex flex-col gap-2 p-4">
        <PageHeader title="Portal do Paciente" />
        <div className="rounded border bg-white p-4 text-sm"><p>{access.reason}</p><Link href="/app-domain/login" className="mt-2 inline-block text-sky-700 underline">Ir para o acesso</Link></div>
      </PageFrame>
    );
  }
  const [appointments, reports, timeline] = await Promise.all([
    portalAppointments(access.context, access.patient.id),
    portalLabReports(access.context, access.patient.id),
    listPatientTimeline(access.context.prisma, access.patient.id, 30),
  ]);
  const upcoming = appointments.filter(a => ["Agendado", "Confirmado"].includes(a.status)).slice(0, 5);
  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title={`Olá, ${access.patient.fullName.split(" ")[0]}`} />
      <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto lg:grid-cols-2">
        <div className="rounded border bg-white p-2"><h2 className="text-xs font-bold uppercase text-slate-500">Próximos agendamentos</h2>{upcoming.map(a => <article key={a.id} className="mb-1 rounded border p-2 text-xs"><strong>{a.date.toLocaleDateString("pt-BR")} · {a.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong><p className="text-slate-500">{a.specialty || "Atendimento"} · {a.unit?.name} · {a.status}</p></article>)}{upcoming.length === 0 && <p className="text-xs text-slate-400">Nenhum agendamento futuro.</p>}<Link href="/portal-paciente/agenda" className="text-xs text-sky-700 underline">Gerenciar agenda</Link></div>
        <div className="rounded border bg-white p-2"><h2 className="text-xs font-bold uppercase text-slate-500">Laudos liberados</h2>{reports.slice(0, 5).map(r => <article key={r.id} className="mb-1 rounded border p-2 text-xs"><strong>{r.document.title}</strong><p className="text-slate-500">Liberado em {r.releasedAt?.toLocaleDateString("pt-BR")}</p><a href={r.document.fileUrl} className="text-sky-700 underline">Abrir documento</a></article>)}{reports.length === 0 && <p className="text-xs text-slate-400">Nenhum laudo liberado.</p>}</div>
        <div className="rounded border bg-white p-2 lg:col-span-2"><h2 className="text-xs font-bold uppercase text-slate-500">Meu histórico recente</h2>{timeline.slice(0, 15).map(e => <article key={e.id} className="mb-1 rounded border p-2 text-xs"><p className="text-[10px] uppercase text-slate-400">{e.date.toLocaleDateString("pt-BR")} · {e.kind}</p><strong>{e.title}</strong></article>)}{timeline.length === 0 && <p className="text-xs text-slate-400">Sem histórico.</p>}<Link href="/portal-paciente/saude" className="text-xs text-sky-700 underline">Ver minha saúde</Link></div>
      </div>
    </PageFrame>
  );
}
