import { MapPin } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { HealthSimpleListClient } from "../HealthSimpleListClient";
import { addFamilyMemberAction, addVisitParticipantAction, createVisitAction, saveAreaAction, saveFamilyAction, saveHouseholdAction, saveMicroareaAction } from "./actions";
import type { Prisma } from "@prisma/client";

const field = "h-8 min-w-0 rounded border border-slate-200 bg-white px-2 text-xs";
const PAGE_SIZE = 20;
type Params = { q?: string | string[]; page?: string | string[] };
const first = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
const num = (v: string | undefined) => v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : 1;

export default async function TerritorioPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getTenantContextForModule("SAUDE");
  const { prisma } = context;
  const unitIds = context.user.hasHealthAccessScope ? context.user.allowedHealthUnitIds || [] : undefined;
  const params = await searchParams;
  const q = (first(params.q) || "").trim().slice(0, 120);
  const visitWhere: Prisma.HealthHomeVisitWhereInput = {
    ...(q ? { OR: [{ actions: { contains: q, mode: "insensitive" } }, { family: { familyCode: { contains: q, mode: "insensitive" } } }] } : {}),
  };
  const total = await prisma.healthHomeVisit.count({ where: visitWhere });
  const page = Math.min(num(first(params.page)), Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const [visits, areas, microareas, households, families, units, teams, professionals, patients] = await Promise.all([
    prisma.healthHomeVisit.findMany({ where: visitWhere, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: { visitedAt: "desc" }, include: { family: true, household: true, professional: { select: { id: true } }, team: true, participants: { include: { person: { select: { fullName: true } } } } } }),
    prisma.healthTerritoryArea.findMany({ where: unitIds ? { unitId: { in: unitIds } } : {}, orderBy: { code: "asc" }, include: { unit: true, team: true } }),
    prisma.healthMicroarea.findMany({ orderBy: { code: "asc" }, take: 200, include: { area: true } }),
    prisma.healthHousehold.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { microarea: { include: { area: true } } } }),
    prisma.healthFamily.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { household: true, members: { include: { person: { select: { fullName: true } } } } } }),
    prisma.healthUnit.findMany({ where: { isActive: true, ...(unitIds ? { id: { in: unitIds } } : {}) }, orderBy: { name: "asc" } }),
    prisma.healthTeam.findMany({ where: { isActive: true, ...(unitIds ? { unitId: { in: unitIds } } : {}) }, orderBy: { name: "asc" } }),
    prisma.healthProfessional.findMany({ where: { isActive: true }, take: 200, orderBy: { id: "asc" } }),
    prisma.patient.findMany({ where: { status: "Ativo", ...(unitIds ? { referenceUnitId: { in: unitIds } } : {}) }, take: 300, orderBy: { person: { fullName: "asc" } }, include: { person: true } }),
  ]);

  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Território e Visitas" icon={<MapPin className="size-4 text-emerald-700" />} />
      <div className="grid shrink-0 gap-2 lg:grid-cols-4">
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Área / Microárea</summary>
          <form action={saveAreaAction} className="mt-2 grid gap-1"><input name="code" required placeholder="Código da área" className={field}/><input name="name" required placeholder="Nome" className={field}/><select name="unitId" className={field}><option value="">Unidade</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><select name="teamId" className={field}><option value="">Equipe</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><button className="h-8 rounded bg-emerald-700 font-semibold text-white">Salvar área</button></form>
          <form action={saveMicroareaAction} className="mt-2 grid gap-1 border-t pt-2"><select name="areaId" required className={field}><option value="">Área</option>{areas.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select><input name="code" required placeholder="Código microárea" className={field}/><button className="h-8 rounded bg-slate-800 font-semibold text-white">Salvar microárea</button></form>
        </details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Domicílio / Família</summary>
          <form action={saveHouseholdAction} className="mt-2 grid gap-1"><input name="householdCode" placeholder="Código domiciliar e-SUS" className={field}/><select name="microareaId" className={field}><option value="">Microárea</option>{microareas.map(m => <option key={m.id} value={m.id}>{m.area.code}/{m.code}</option>)}</select><button className="h-8 rounded bg-emerald-700 font-semibold text-white">Salvar domicílio</button></form>
          <form action={saveFamilyAction} className="mt-2 grid gap-1 border-t pt-2"><input name="familyCode" placeholder="Código familiar e-SUS" className={field}/><select name="householdId" className={field}><option value="">Domicílio</option>{households.map(h => <option key={h.id} value={h.id}>{h.householdCode || h.id.slice(0,8)}</option>)}</select><button className="h-8 rounded bg-slate-800 font-semibold text-white">Criar família</button></form>
          <form action={addFamilyMemberAction} className="mt-2 grid gap-1 border-t pt-2"><select name="familyId" required className={field}><option value="">Família</option>{families.map(f => <option key={f.id} value={f.id}>{f.familyCode || f.id.slice(0,8)} ({f.members.length})</option>)}</select><select name="personId" required className={field}><option value="">Pessoa (usa cadastro único)</option>{patients.map(p => <option key={p.personId} value={p.personId}>{p.person.fullName}</option>)}</select><input name="kinship" placeholder="Parentesco" className={field}/><button className="h-8 rounded bg-emerald-700 font-semibold text-white">Vincular membro</button></form>
        </details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Nova visita</summary><form action={createVisitAction} className="mt-2 grid gap-1"><select name="householdId" className={field}><option value="">Domicílio</option>{households.map(h => <option key={h.id} value={h.id}>{h.householdCode || h.id.slice(0,8)}</option>)}</select><select name="familyId" className={field}><option value="">Família</option>{families.map(f => <option key={f.id} value={f.id}>{f.familyCode || f.id.slice(0,8)}</option>)}</select><select name="professionalId" required className={field}><option value="">Agente/profissional</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.id.slice(0,8)}</option>)}</select><select name="teamId" className={field}><option value="">Equipe</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><select name="microareaId" className={field}><option value="">Microárea</option>{microareas.map(m => <option key={m.id} value={m.id}>{m.area.code}/{m.code}</option>)}</select><input name="visitedAt" type="datetime-local" required className={field}/><textarea name="actions" required placeholder="Ações realizadas" className="min-h-12 rounded border p-2"/><input name="observations" placeholder="Observações permitidas" className={field}/><button className="h-8 rounded bg-emerald-700 font-semibold text-white">Registrar visita</button></form></details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Participantes da visita</summary><form action={addVisitParticipantAction} className="mt-2 grid gap-1"><select name="visitId" required className={field}><option value="">Visita</option>{visits.map(v => <option key={v.id} value={v.id}>{v.visitedAt.toLocaleDateString("pt-BR")} · {v.actions.slice(0,30)}</option>)}</select><select name="personId" required className={field}><option value="">Pessoa atendida</option>{patients.map(p => <option key={p.personId} value={p.personId}>{p.person.fullName}</option>)}</select><p className="text-[10px] text-slate-500">1 visita pode ter N participantes; evento e participações ficam separados.</p><button className="h-8 rounded bg-slate-800 font-semibold text-white">Adicionar participante</button></form></details>
      </div>
      <HealthSimpleListClient rows={visits.map(v => ({ id: v.id, cells: { date: v.visitedAt.toLocaleDateString("pt-BR"), family: v.family?.familyCode || v.household?.householdCode || "-", team: v.team?.name || "-", actions: v.actions.slice(0,60), participants: String(v.participants.length), status: v.status } }))} columns={[{ key: "date", label: "Data", width: "medium" }, { key: "family", label: "Família/Domicílio" }, { key: "team", label: "Equipe", responsive: "sm" }, { key: "actions", label: "Ações" }, { key: "participants", label: "Pessoas", width: "narrow" }, { key: "status", label: "Situação", width: "medium" }]} label="visitas" searchPlaceholder="Buscar ação ou família" serverPagination={{ page, total, pathname: "/app-domain/saude/territorio", search: q }} />
    </PageFrame>
  );
}
