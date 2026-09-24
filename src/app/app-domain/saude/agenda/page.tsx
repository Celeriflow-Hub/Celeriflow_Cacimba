import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import type { Prisma } from "@prisma/client";
import { Calendar } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import AgendaClient from "./AgendaClient";
import AgendaEngineClient from "./AgendaEngineClient";

type Params = { q?: string | string[] };
const first = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getTenantContextForModule("SAUDE");
  const unitIds = context.user.hasHealthAccessScope ? context.user.allowedHealthUnitIds || [] : undefined;
  const q = ((await searchParams).q ? first((await searchParams).q) : "") || "";
  const term = q.trim().slice(0, 120);
  const birthMatch = /^\d{4}-\d{2}-\d{2}$/.test(term) ? new Date(`${term}T12:00:00`) : null;
  const appointmentWhere: Prisma.HealthAppointmentWhereInput = {
    ...(unitIds ? { unitId: { in: unitIds } } : {}),
    ...(term ? {
      OR: [
        { patient: { person: { fullName: { contains: term, mode: "insensitive" } } } },
        { patient: { person: { cpf: { contains: term } } } },
        { patient: { cns: { contains: term } } },
        { patient: { person: { motherName: { contains: term, mode: "insensitive" } } } },
        ...(birthMatch && !Number.isNaN(birthMatch.getTime()) ? [{ patient: { person: { birthDate: birthMatch } } }] : []),
        { professional: { employee: { name: { contains: term, mode: "insensitive" } } } },
        { status: { contains: term, mode: "insensitive" } },
      ],
    } : {}),
  };
  const [items, patients, units, professionals, schedulingGroups, specialties, services, specialtyList, schedules, waitlist, board] = await Promise.all([
    context.prisma.healthAppointment.findMany({
      where: appointmentWhere,
      take: 500,
      orderBy: [{ date: "desc" }, { id: "desc" }],
      select: {
        id: true,
        date: true,
        specialty: true,
        specialtyRef: { select: { name: true } },
        priority: true,
        status: true,
        patient: { select: { person: { select: { fullName: true } } } },
        unit: { select: { name: true } },
        professional: { select: { employee: { select: { name: true } } } },
      },
    }),
    context.prisma.patient.findMany({
      where: { status: "Ativo" },
      orderBy: { person: { fullName: "asc" } },
      select: { id: true, cns: true, person: { select: { fullName: true } } },
    }),
    context.prisma.healthUnit.findMany({
      where: { isActive: true, ...(unitIds ? { id: { in: unitIds } } : {}) },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    context.prisma.healthProfessional.findMany({
      where: { isActive: true, ...(unitIds ? { OR: [{ unitId: { in: unitIds } }, { assignments: { some: { unitId: { in: unitIds }, isActive: true } } }] } : {}) },
      orderBy: { employee: { name: "asc" } },
      select: { id: true, unitId: true, specialty: true, employee: { select: { name: true, isActive: true } } },
    }),
    context.prisma.healthSchedulingGroup.findMany({ where: { isActive: true, ...(unitIds ? { unitId: { in: unitIds } } : {}) }, orderBy: [{ unit: { name: "asc" } }, { name: "asc" }], select: { id: true, name: true, unitId: true, specialtyGroupId: true } }),
    context.prisma.healthSpecialtyGroupMember.findMany({ where: { group: { isActive: true }, specialty: { isActive: true } }, orderBy: { specialty: { name: "asc" } }, select: { groupId: true, specialty: { select: { id: true, name: true, unitLinks: { where: { isActive: true }, select: { unitId: true } } } } } }),
    context.prisma.healthSpecialtyGroupService.findMany({ where: { group: { isActive: true }, service: { isActive: true } }, orderBy: { service: { name: "asc" } }, select: { groupId: true, service: { select: { id: true, name: true, assignments: { where: { isActive: true }, select: { unitId: true } } } } } }),
    context.prisma.healthSpecialty.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
    context.prisma.healthCareSchedule.findMany({ where: unitIds ? { unitId: { in: unitIds } } : {}, orderBy: [{ date: "asc" }, { weekday: "asc" }], take: 200, include: { unit: { select: { name: true } }, specialty: { select: { name: true } }, professional: { select: { employee: { select: { name: true } } } }, appointments: { where: { status: { in: ["Agendado", "Confirmado", "Aguardando", "Em Atendimento"] } }, select: { id: true } } } }),
    context.prisma.healthWaitlist.findMany({ where: { status: "Aguardando", ...(unitIds ? { OR: [{ schedule: { unitId: { in: unitIds } } }, { patient: { referenceUnitId: { in: unitIds } } }] } : {}) }, orderBy: [{ priority: "desc" }, { createdAt: "asc" }], take: 200, include: { patient: { select: { person: { select: { fullName: true } } } }, specialty: { select: { name: true } } } }),
    context.prisma.healthAppointment.findMany({ where: { ...(unitIds ? { unitId: { in: unitIds } } : {}), status: { in: ["Aguardando", "Em Atendimento"] } }, orderBy: [{ calledAt: "desc" }, { date: "asc" }], take: 30, select: { id: true, date: true, status: true, calledAt: true, patient: { select: { person: { select: { fullName: true } } } }, unit: { select: { name: true } } } }),
  ]);
  const weekdayName = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      <PageHeader title="Agenda e Agendamentos" icon={<Calendar className="size-4 shrink-0 text-emerald-600" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <form method="get" className="flex shrink-0 gap-2 px-1"><input name="q" defaultValue={term} placeholder="Buscar nome, CPF, CNS, nascimento (AAAA-MM-DD), mãe, profissional ou situação" className="h-8 w-full rounded border border-slate-200 px-2 text-xs" /><button className="h-8 rounded bg-slate-800 px-3 text-xs font-semibold text-white">Buscar</button></form>
      <details className="mx-1 shrink-0 rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Painel de chamada ({board.length})</summary><div className="mt-1 max-h-40 overflow-y-auto">{board.map(b => <p key={b.id} className="border-b py-1"><strong>{b.patient.person.fullName}</strong> · {b.unit?.name} · {b.status}{b.calledAt ? ` · chamado às ${b.calledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}</p>)}{board.length === 0 && <p className="text-slate-400">Ninguém aguardando.</p>}</div></details>
      <AgendaEngineClient
        schedules={schedules.map(s => ({ id: s.id, kind: s.kind, unit: s.unit.name, specialty: s.specialty?.name || null, professional: s.professional?.employee.name || null, when: s.date ? s.date.toLocaleDateString("pt-BR") : s.weekday !== null ? `Toda ${weekdayName[s.weekday || 0]}` : "-", slots: `${s.appointments.length}/${s.totalSlots}`, status: s.status }))}
        waitlist={waitlist.map(w => ({ id: w.id, patient: w.patient.person.fullName, specialty: w.specialty?.name || null, priority: w.priority, status: w.status, createdAt: w.createdAt.toLocaleDateString("pt-BR") }))}
        patients={patients.map(p => ({ id: p.id, label: p.person.fullName }))}
        units={units.map(u => ({ id: u.id, label: u.name }))}
        professionals={professionals.filter(p => p.employee.isActive).map(p => ({ id: p.id, label: p.employee.name }))}
        specialties={specialtyList.map(s => ({ id: s.id, label: s.name }))}
        appointments={items.filter(i => ["Agendado", "Confirmado"].includes(i.status)).map(i => ({ id: i.id, label: `${i.patient.person.fullName} · ${i.date.toLocaleDateString("pt-BR")}` }))}
        canCreate={canPerformModuleOperation(context.user, "SAUDE", "create")}
        canUpdate={canPerformModuleOperation(context.user, "SAUDE", "update")}
      />
      <AgendaClient
        appointments={items.map(item => ({ ...item, date: item.date.toISOString() }))}
        patients={patients}
        units={units}
        professionals={professionals.filter(professional => professional.employee.isActive).map(({ employee, ...professional }) => ({ ...professional, employee: { name: employee.name } }))}
        schedulingGroups={schedulingGroups}
        specialties={specialties}
        services={services}
        canCreate={canPerformModuleOperation(context.user, "SAUDE", "create")}
        canUpdate={canPerformModuleOperation(context.user, "SAUDE", "update")}
      />
    </PageFrame>
  );
}
