import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { getTenantContextForModule, assertHealthUnitAccess } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { listPatientTimeline } from "@/lib/saude/patient-timeline-service";

const card = "rounded border bg-white p-2";
const kpi = "text-lg font-bold tabular-nums";
type Params = { period?: string | string[]; unit?: string | string[]; professional?: string | string[]; specialty?: string | string[]; patient?: string | string[] };
const first = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;

export default async function GerencialPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getTenantContextForModule("SAUDE");
  const { prisma } = context;
  const unitIds = context.user.hasHealthAccessScope ? context.user.allowedHealthUnitIds || [] : undefined;
  const params = await searchParams;
  const period = (first(params.period) || "").trim().slice(0, 7);
  const unitFilter = (first(params.unit) || "").trim().slice(0, 64);
  const professionalFilter = (first(params.professional) || "").trim().slice(0, 64);
  const specialtyFilter = (first(params.specialty) || "").trim().slice(0, 64);
  const patientFilter = (first(params.patient) || "").trim().slice(0, 64);
  const range = /^\d{4}-\d{2}$/.test(period) ? { gte: new Date(`${period}-01T00:00:00`), lt: new Date(`${period}-01T00:00:00`).getMonth() === 11 ? new Date(`${Number(period.slice(0, 4)) + 1}-01-01T00:00:00`) : new Date(`${period.slice(0, 4)}-${String(Number(period.slice(5, 7)) + 1).padStart(2, "0")}-01T00:00:00`) } : undefined;
  const unitScope = unitFilter ? { unitId: unitFilter } : unitIds ? { unitId: { in: unitIds } } : {};
  const [
    appointments, appointmentsDone, records, triages, dispensations, vaccinations,
    labOrders, regulations, trips, facts, esusForms, plans, accesses, patients, units, professionals, specialties,
  ] = await Promise.all([
    prisma.healthAppointment.count({ where: { ...(range ? { date: range } : {}), ...unitScope, ...(professionalFilter ? { professionalId: professionalFilter } : {}), ...(specialtyFilter ? { specialtyId: specialtyFilter } : {}) } }),
    prisma.healthAppointment.count({ where: { status: "Atendido", ...(range ? { date: range } : {}), ...unitScope } }),
    prisma.medicalRecord.count({ where: { completedAt: { not: null }, ...(range ? { date: range } : {}), ...unitScope, ...(professionalFilter ? { professionalId: professionalFilter } : {}) } }),
    prisma.healthTriage.count({ where: { ...(range ? { createdAt: range } : {}), ...(unitIds || unitFilter ? { appointment: unitScope } : {}) } }),
    prisma.medicineDispensation.count({ where: { ...(range ? { date: range } : {}), ...(unitFilter ? { unitId: unitFilter } : unitIds ? { unitId: { in: unitIds } } : {}) } }),
    prisma.vaccinationRecord.count({ where: { ...(range ? { date: range } : {}), ...(unitFilter ? { unitId: unitFilter } : unitIds ? { unitId: { in: unitIds } } : {}) } }),
    prisma.healthLabOrder.groupBy({ by: ["status"], where: { ...(range ? { createdAt: range } : {}), ...(unitIds || unitFilter ? { OR: [{ requestUnitId: unitFilter || { in: unitIds! } }, { collectionUnitId: unitFilter || { in: unitIds! } }] } : {}) }, _count: true }),
    prisma.healthRegulationRequest.groupBy({ by: ["status"], where: { ...(range ? { createdAt: range } : {}), ...(unitFilter ? { requestUnitId: unitFilter } : unitIds ? { requestUnitId: { in: unitIds } } : {}) }, _count: true }),
    prisma.healthTfdTrip.count({ where: range ? { date: { gte: range.gte, lt: range.lt } } : {} }),
    prisma.healthProductionFact.groupBy({ by: ["status"], where: { ...(period ? { period } : {}), ...(unitFilter ? { unitId: unitFilter } : unitIds ? { unitId: { in: unitIds } } : {}) }, _count: true }),
    prisma.healthEsusForm.count({ where: { status: "FINALIZADA", ...(period ? { period } : {}), ...(unitFilter ? { unitId: unitFilter } : unitIds ? { unitId: { in: unitIds } } : {}) } }),
    prisma.specializedTherapeuticPlan.count({ where: { status: "ACTIVE", ...(unitFilter ? { unitId: unitFilter } : unitIds ? { unitId: { in: unitIds } } : {}) } }),
    prisma.auditEvent.groupBy({ by: ["eventType"], where: range ? { createdAt: range } : {}, _count: true, orderBy: { _count: { eventType: "desc" } }, take: 20 }),
    prisma.patient.findMany({ where: { status: "Ativo", ...(unitIds ? { referenceUnitId: { in: unitIds } } : {}) }, take: 300, orderBy: { person: { fullName: "asc" } }, select: { id: true, referenceUnitId: true, person: { select: { fullName: true } } } }),
    prisma.healthUnit.findMany({ where: { isActive: true, ...(unitIds ? { id: { in: unitIds } } : {}) }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.healthProfessional.findMany({ where: { isActive: true }, take: 200, select: { id: true, cbo: true } }),
    prisma.healthSpecialty.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  let timeline: Awaited<ReturnType<typeof listPatientTimeline>> = [];
  let timelinePatient: string | null = null;
  if (patientFilter) {
    const target = await prisma.patient.findUnique({ where: { id: patientFilter }, select: { id: true, referenceUnitId: true, person: { select: { fullName: true } } } });
    if (target) {
      if (target.referenceUnitId) assertHealthUnitAccess(context.user, target.referenceUnitId);
      timeline = await listPatientTimeline(prisma, target.id);
      timelinePatient = target.person.fullName;
    }
  }
  const accessByUser = await prisma.auditEvent.groupBy({ by: ["actorUsuarioId"], where: range ? { createdAt: range } : {}, _count: true, orderBy: { _count: { actorUsuarioId: "desc" } }, take: 20 });
  const actorNames = await prisma.usuario.findMany({ where: { id: { in: accessByUser.map(a => a.actorUsuarioId) } }, select: { id: true, nome: true } });
  const actorName = new Map(actorNames.map(a => [a.id, a.nome]));

  const kpis: Array<{ label: string; value: string; href: string }> = [
    { label: "Agendamentos", value: String(appointments), href: "/saude/agenda" },
    { label: "Atendidos", value: String(appointmentsDone), href: "/saude/atendimentos" },
    { label: "Atendimentos concluídos", value: String(records), href: "/saude/atendimentos" },
    { label: "Acolhimentos", value: String(triages), href: "/saude/acolhimento" },
    { label: "Dispensações", value: String(dispensations), href: "/saude/farmacia" },
    { label: "Vacinações", value: String(vaccinations), href: "/saude/vacinacao" },
    { label: "Viagens TFD", value: String(trips), href: "/saude/tfd" },
    { label: "Fichas e-SUS finalizadas", value: String(esusForms), href: "/saude/sisab" },
    { label: "Planos especializados ativos", value: String(plans), href: "/saude/centro-especializado" },
  ];

  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Gerencial da Saúde" icon={<BarChart3 className="size-4 text-slate-700" />} />
      <form method="get" className="grid shrink-0 gap-2 rounded-md border bg-white p-2 text-xs sm:grid-cols-2 lg:grid-cols-[160px_1fr_200px_200px_auto]">
        <input name="period" type="month" defaultValue={period} className="h-8 rounded border px-2" />
        <select name="unit" defaultValue={unitFilter} className="h-8 rounded border bg-white px-2"><option value="">Todas as unidades</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        <select name="professional" defaultValue={professionalFilter} className="h-8 rounded border bg-white px-2"><option value="">Todos os profissionais</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.cbo || p.id.slice(0, 8)}</option>)}</select>
        <select name="specialty" defaultValue={specialtyFilter} className="h-8 rounded border bg-white px-2"><option value="">Todas as especialidades</option>{specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <button className="h-8 rounded bg-slate-800 px-4 font-bold text-white">Filtrar</button>
      </form>
      <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto lg:grid-cols-[2fr_1fr]">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="grid shrink-0 gap-2 sm:grid-cols-3">
            {kpis.map(k => <Link key={k.label} href={k.href} className={card}><p className="text-[10px] uppercase text-slate-500">{k.label}</p><p className={kpi}>{k.value}</p></Link>)}
          </div>
          <div className="grid shrink-0 gap-2 md:grid-cols-3">
            <div className={card}><h2 className="text-xs font-bold uppercase text-slate-500">Laboratório por etapa</h2>{labOrders.map(l => <p key={l.status} className="flex justify-between text-xs"><span>{l.status}</span><strong className="tabular-nums">{l._count}</strong></p>)}{labOrders.length === 0 && <p className="text-xs text-slate-400">Sem dados no recorte.</p>}</div>
            <div className={card}><h2 className="text-xs font-bold uppercase text-slate-500">Regulação por situação</h2>{regulations.map(r => <p key={r.status} className="flex justify-between text-xs"><span>{r.status}</span><strong className="tabular-nums">{r._count}</strong></p>)}{regulations.length === 0 && <p className="text-xs text-slate-400">Sem dados no recorte.</p>}</div>
            <div className={card}><h2 className="text-xs font-bold uppercase text-slate-500">Produção por situação</h2>{facts.map(f => <p key={f.status} className="flex justify-between text-xs"><span>{f.status}</span><strong className="tabular-nums">{f._count}</strong></p>)}{facts.length === 0 && <p className="text-xs text-slate-400">Sem dados no recorte.</p>}</div>
          </div>
          <details className={`${card} shrink-0`} open={timeline.length > 0}><summary className="cursor-pointer text-xs font-bold uppercase text-slate-500">Histórico transversal do paciente{timelinePatient ? ` · ${timelinePatient}` : ""}</summary>
            <form method="get" className="mt-2 flex gap-2"><input type="hidden" name="period" value={period} /><select name="patient" defaultValue={patientFilter} className="h-8 flex-1 rounded border bg-white px-2 text-xs"><option value="">Selecione o paciente</option>{patients.map(p => <option key={p.id} value={p.id}>{p.person.fullName}</option>)}</select><button className="h-8 rounded bg-slate-800 px-3 text-xs font-semibold text-white">Abrir</button></form>
            <div className="mt-2 max-h-72 overflow-y-auto">{timeline.map(e => <article key={e.id} className="mb-1 rounded border p-2 text-xs"><p className="text-[10px] uppercase text-slate-400">{e.date.toLocaleDateString("pt-BR")} · {e.kind}</p><strong>{e.title}</strong>{e.detail && <p className="truncate text-slate-500" title={e.detail}>{e.detail}</p>}{e.href && <Link href={e.href} className="text-sky-700 underline">Abrir origem</Link>}</article>)}{patientFilter && timeline.length === 0 && <p className="text-xs text-slate-400">Sem eventos para este paciente.</p>}</div>
          </details>
        </div>
        <div className={`${card} min-h-0 overflow-y-auto`}><h2 className="sticky top-0 bg-white pb-2 text-xs font-bold uppercase text-slate-500">Acessos por usuário</h2>{accessByUser.map(a => <p key={a.actorUsuarioId} className="flex justify-between gap-2 text-xs"><span className="truncate">{actorName.get(a.actorUsuarioId) || a.actorUsuarioId.slice(0, 8)}</span><strong className="tabular-nums">{a._count}</strong></p>)}{accessByUser.length === 0 && <p className="text-xs text-slate-400">Sem acessos no recorte.</p>}<h2 className="pb-2 pt-3 text-xs font-bold uppercase text-slate-500">Eventos por tipo</h2>{accesses.map(a => <p key={a.eventType} className="flex justify-between gap-2 text-xs"><span className="truncate">{a.eventType}</span><strong className="tabular-nums">{a._count}</strong></p>)}<h2 className="pb-2 pt-3 text-xs font-bold uppercase text-slate-500">Relatórios</h2><Link href="/saude/relatorios" className="text-xs text-sky-700 underline">Abrir central de relatórios</Link></div>
      </div>
    </PageFrame>
  );
}
