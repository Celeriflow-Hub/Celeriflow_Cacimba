import { Bus } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { HealthSimpleListClient } from "../HealthSimpleListClient";
import { addPassengerAction, authorizeTfdAction, confirmPassengerRemovalAction, createTfdRequestAction, createTripAction, movePassengerAction, requestPassengerRemovalAction, updateTripStatusAction } from "./actions";
import type { Prisma } from "@prisma/client";

const field = "h-8 min-w-0 rounded border border-slate-200 bg-white px-2 text-xs";
const PAGE_SIZE = 20;
type Params = { q?: string | string[]; filter?: string | string[]; page?: string | string[] };
const first = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
const num = (v: string | undefined) => v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : 1;

export default async function TfdPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getTenantContextForModule("SAUDE");
  const { prisma } = context;
  const unitIds = context.user.hasHealthAccessScope ? context.user.allowedHealthUnitIds || [] : undefined;
  const params = await searchParams;
  const q = (first(params.q) || "").trim().slice(0, 120);
  const filter = (first(params.filter) || "").trim().slice(0, 40);
  const where: Prisma.HealthTfdTripWhereInput = {
    ...(filter ? { status: filter } : {}),
    ...(q ? { OR: [{ origin: { contains: q, mode: "insensitive" } }, { destination: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const total = await prisma.healthTfdTrip.count({ where });
  const page = Math.min(num(first(params.page)), Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const [trips, requests, patients, units, fleetUnits, employees, passengers, removals] = await Promise.all([
    prisma.healthTfdTrip.findMany({ where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: { date: "desc" }, include: { fleetUnit: true, driverEmployee: true, passengers: { include: { patient: { include: { person: true } } } } } }),
    prisma.healthTfdRequest.findMany({ where: unitIds ? { originUnitId: { in: unitIds } } : {}, orderBy: { createdAt: "desc" }, take: 500, include: { patient: { include: { person: true } }, originUnit: true } }),
    prisma.patient.findMany({ where: { status: "Ativo", ...(unitIds ? { referenceUnitId: { in: unitIds } } : {}) }, take: 500, orderBy: { person: { fullName: "asc" } }, include: { person: true } }),
    prisma.healthUnit.findMany({ where: { isActive: true, ...(unitIds ? { id: { in: unitIds } } : {}) }, orderBy: { name: "asc" } }),
    prisma.fleetUnit.findMany({ where: { category: "VEICULO", status: "ATIVO" }, take: 200, orderBy: { name: "asc" } }),
    prisma.employee.findMany({ where: { isActive: true }, take: 200, orderBy: { name: "asc" } }),
    prisma.healthTfdPassenger.findMany({ take: 200, orderBy: { createdAt: "desc" }, include: { trip: true, patient: { include: { person: true } } } }),
    prisma.healthTfdPassengerRemoval.findMany({ where: { status: "Pendente" }, take: 100, include: { passenger: { include: { patient: { include: { person: true } } } } } }),
  ]);

  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="TFD e Transporte" icon={<Bus className="size-4 text-amber-700" />} />
      <div className="grid shrink-0 gap-2 lg:grid-cols-3">
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Solicitar TFD</summary><form action={createTfdRequestAction} className="mt-2 grid gap-1"><select name="patientId" required className={field}><option value="">Paciente</option>{patients.map(p => <option key={p.id} value={p.id}>{p.person.fullName}</option>)}</select><select name="originUnitId" className={field}><option value="">Unidade origem</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><select name="regulationRequestId" className={field}><option value="">Sem regulação vinculada</option>{requests.slice(0,100).map(r => <option key={r.id} value={r.id}>{r.patient.person.fullName} · {r.destination}</option>)}</select><input name="destination" required placeholder="Destino" className={field}/><textarea name="reason" required placeholder="Motivo" className="min-h-12 rounded border p-2"/><select name="priority" className={field}><option>Normal</option><option>Media</option><option>Alta</option></select><input name="companionName" placeholder="Acompanhante (opcional)" className={field}/><input name="companionDocument" placeholder="Doc acompanhante" className={field}/><button className="h-8 rounded bg-amber-700 font-semibold text-white">Solicitar</button></form></details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Autorizar / Criar viagem</summary>
          <form action={authorizeTfdAction} className="mt-2 grid gap-1"><select name="requestId" required className={field}><option value="">Solicitação TFD</option>{requests.filter(r => r.status==="SOLICITADA").map(r => <option key={r.id} value={r.id}>{r.patient.person.fullName} → {r.destination}</option>)}</select><button className="h-8 rounded bg-slate-800 font-semibold text-white">Autorizar</button></form>
          <form action={createTripAction} className="mt-2 grid gap-1 border-t pt-2"><input name="date" type="date" required className={field}/><input name="origin" required placeholder="Origem" className={field}/><input name="destination" required placeholder="Destino" className={field}/><select name="fleetUnitId" required className={field}><option value="">Veículo (Frotas)</option>{fleetUnits.map(f => <option key={f.id} value={f.id}>{f.name} · {f.plate || ""}</option>)}</select><select name="driverEmployeeId" className={field}><option value="">Condutor</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><input name="capacity" type="number" min="1" required placeholder="Capacidade" className={field}/><button className="h-8 rounded bg-amber-700 font-semibold text-white">Criar viagem</button></form>
        </details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Passageiros e movimentação</summary>
          <form action={addPassengerAction} className="mt-2 grid gap-1"><select name="tripId" required className={field}><option value="">Viagem</option>{trips.map(t => <option key={t.id} value={t.id}>{t.origin} → {t.destination} · {t.date.toLocaleDateString("pt-BR")}</option>)}</select><select name="patientId" required className={field}><option value="">Paciente</option>{patients.map(p => <option key={p.id} value={p.id}>{p.person.fullName}</option>)}</select><select name="tfdRequestId" className={field}><option value="">Sem vínculo TFD</option>{requests.map(r => <option key={r.id} value={r.id}>{r.patient.person.fullName}</option>)}</select><select name="kind" className={field}><option value="PACIENTE">Paciente</option><option value="ACOMPANHANTE">Acompanhante</option></select><input name="companionName" placeholder="Nome acompanhante se for acompanhante" className={field}/><input name="companionDocument" placeholder="Doc acompanhante" className={field}/><button className="h-8 rounded bg-amber-700 font-semibold text-white">Incluir</button></form>
          <form action={movePassengerAction} className="mt-2 grid gap-1 border-t pt-2"><select name="passengerId" required className={field}><option value="">Passageiro</option>{passengers.map(p => <option key={p.id} value={p.id}>{p.patient.person.fullName} · {p.kind}</option>)}</select><select name="targetTripId" required className={field}><option value="">Viagem destino</option>{trips.map(t => <option key={t.id} value={t.id}>{t.origin} → {t.destination}</option>)}</select><button className="h-8 rounded bg-slate-800 font-semibold text-white">Transferir</button></form>
          <form action={updateTripStatusAction} className="mt-2 grid gap-1 border-t pt-2"><select name="tripId" required className={field}><option value="">Viagem</option>{trips.map(t => <option key={t.id} value={t.id}>{t.origin} → {t.destination}</option>)}</select><select name="status" required className={field}><option value="EMBARCANDO">Embarcando</option><option value="EM_TRANSITO">Saída</option><option value="RETORNANDO">Retorno</option><option value="CONCLUIDA">Concluir</option><option value="CANCELADA">Cancelar</option></select><button className="h-8 rounded bg-slate-800 font-semibold text-white">Atualizar situação</button></form>
          <form action={requestPassengerRemovalAction} className="mt-2 grid gap-1 border-t pt-2"><select name="passengerId" required className={field}><option value="">Passageiro (exclusão com dupla custódia)</option>{passengers.map(p => <option key={p.id} value={p.id}>{p.patient.person.fullName} · {p.kind}</option>)}</select><button className="h-7 rounded border px-2">Solicitar exclusão</button></form>
          <form action={confirmPassengerRemovalAction} className="mt-2 grid gap-1 border-t pt-2"><select name="passengerId" required className={field}><option value="">Exclusão pendente</option>{removals.map(r => <option key={r.passengerId} value={r.passengerId}>{r.passenger.patient.person.fullName}</option>)}</select><select name="decision" required className={field}><option value="confirm">Confirmar (2º usuário)</option><option value="reject">Recusar</option></select><button className="h-7 rounded border px-2">Decidir</button></form>
        </details>
      </div>
      <HealthSimpleListClient rows={trips.map(t => ({ id: t.id, cells: { date: t.date.toLocaleDateString("pt-BR"), origin: t.origin, destination: t.destination, vehicle: t.fleetUnit.name, driver: t.driverEmployee?.name || "-", capacity: `${t.passengers.length}/${t.capacity}`, status: t.status } }))} columns={[{ key: "date", label: "Data", width: "medium" }, { key: "origin", label: "Origem" }, { key: "destination", label: "Destino" }, { key: "vehicle", label: "Veículo", responsive: "sm" }, { key: "driver", label: "Condutor", responsive: "md" }, { key: "capacity", label: "Lotação", width: "medium" }, { key: "status", label: "Situação", width: "medium" }]} label="viagens" searchPlaceholder="Buscar origem, destino ou veículo" filterKey="status" filterLabel="Todas" serverPagination={{ page, total, pathname: "/app-domain/saude/tfd", search: q, filter, filterOptions: ["PLANEJADA","EMBARCANDO","EM_TRANSITO","RETORNANDO","CONCLUIDA","CANCELADA"] }} />
    </PageFrame>
  );
}
