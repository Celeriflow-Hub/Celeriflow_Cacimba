import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ensureS9Defaults } from "@/lib/tributacao/s9-service";
import CemiteriosClient from "./CemiteriosClient";
export const dynamic = "force-dynamic";
export default async function CemiteriosPage() {
  const { prisma, user } = await getTenantContextForModule("TRIBUTACAO");
  await ensureS9Defaults(prisma, { usuarioId: user.id });
  const [cemeteries, graves, funeralHomes, causes, deceased, movements, concessions, taxpayers, feeAssessments] = await Promise.all([
    prisma.taxCemetery.findMany({ include: { sectors: true, employees: true }, orderBy: { name: "asc" } }),
    prisma.taxGrave.findMany({ include: { sector: true }, orderBy: [{ cemeteryId: "asc" }, { code: "asc" }], take: 300 }),
    prisma.taxFuneralHome.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.taxDeathCause.findMany({ orderBy: { code: "asc" } }),
    prisma.taxDeceased.findMany({ include: { grave: true, cause: true, funeralHome: true }, orderBy: { deathDate: "desc" }, take: 200 }),
    prisma.taxBurialMovement.findMany({ include: { deceased: true, grave: true }, orderBy: { movementDate: "desc" }, take: 200 }),
    prisma.taxGraveConcession.findMany({ include: { grave: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.taxpayer.findMany({ where: { status: "Ativo" }, include: { person: true, company: true }, orderBy: { createdAt: "asc" }, take: 200 }),
    prisma.taxAssessment.findMany({ where: { tax: { name: "Taxa de Sepultamento" } }, include: { guides: true, taxpayer: { include: { person: true, company: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const names = new Map(taxpayers.map((row) => [row.id, row.company?.corporateName ?? row.person?.fullName ?? row.id]));
  const graveOf = (id: string | null) => graves.find((g) => g.id === id);
  return <CemiteriosClient data={{
    cemeteries: cemeteries.map((c) => ({ id: c.id, code: c.code, name: c.name, address: c.address ?? null, wakePlace: c.wakePlace ?? null, sectors: c.sectors.map((s) => ({ id: s.id, code: s.code, name: s.name, parentId: s.parentId ?? null })), employees: c.employees.map((e) => ({ id: e.id, name: e.name, role: e.role })) })),
    graves: graves.map((g) => ({ id: g.id, cemeteryId: g.cemeteryId, code: g.code, type: g.graveType, sector: g.sector?.name ?? null, capacity: g.capacity, occupied: g.occupantCount, status: g.status })),
    funeralHomes: funeralHomes.map((f) => ({ id: f.id, name: f.name })),
    causes: causes.map((c) => ({ id: c.id, code: c.code, description: c.description })),
    deceased: deceased.map((d) => ({ id: d.id, name: d.fullName, deathDate: d.deathDate.toISOString().slice(0, 10), grave: d.grave?.code ?? null, cause: d.cause?.description ?? d.causeText ?? null, doctor: `${d.doctorName} · ${d.doctorCrm}`, status: d.status, cemeteryId: d.cemeteryId })),
    movements: movements.map((m) => ({ id: m.id, type: m.movementType, date: m.movementDate.toISOString().slice(0, 10), deceased: m.deceased?.fullName ?? null, grave: m.grave.code, from: graveOf(m.fromGraveId ?? null)?.code ?? null, to: graveOf(m.toGraveId ?? null)?.code ?? null, feeAssessmentId: m.feeAssessmentId ?? null })),
    concessions: concessions.map((c) => ({ id: c.id, grave: c.grave.code, holder: c.holderName, type: c.concessionType, endsAt: c.endsAt?.toISOString().slice(0, 10) ?? null, status: c.status, feeAssessmentId: c.feeAssessmentId ?? null })),
    taxpayers: taxpayers.map((row) => ({ id: row.id, name: names.get(row.id) ?? row.id })),
    fees: feeAssessments.map((a) => ({ id: a.id, number: a.assessmentNumber ?? a.id, taxpayer: names.get(a.taxpayerId) ?? a.taxpayerId, total: Number(a.finalValueDecimal ?? a.originalValueDecimal ?? a.originalValue), guides: a.guides.map((g) => ({ id: g.id, number: g.guideNumber ?? g.id, status: g.status, total: Number(g.totalValueDecimal ?? g.totalValue) })) })),
  }} />;
}
