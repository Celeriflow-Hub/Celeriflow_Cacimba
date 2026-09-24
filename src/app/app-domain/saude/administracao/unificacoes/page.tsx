import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Combine } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { UnificationsClient, type MergeCandidate, type MergeHistory, type MergeKind } from "./UnificationsClient";

const PAGE_SIZE = 20;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
function href(page: number, kind: string, q: string) { const query = new URLSearchParams({ tipo: kind, page: String(page), ...(q ? { q } : {}) }); return `/app-domain/saude/administracao/unificacoes?${query}`; }

export default async function UnificationsPage({ searchParams }: { searchParams: Promise<{ tipo?: string | string[]; q?: string | string[]; page?: string | string[] }> }) {
  const context = await getTenantContextForModule("SAUDE");
  const params = await searchParams;
  const rawKind = first(params.tipo);
  const kind: MergeKind = rawKind === "ADDRESS" || rawKind === "PROFESSIONAL" ? rawKind : "PATIENT";
  const q = (first(params.q) || "").trim().slice(0, 120);
  const requestedPage = Number(first(params.page)) || 1;
  let candidates: MergeCandidate[] = [];
  let total = 0;
  let page = requestedPage;
  if (kind === "ADDRESS") {
    const where: Prisma.AddressWhereInput = { canonicalAddressId: null, ...(q ? { OR: [{ streetName: { contains: q, mode: "insensitive" } }, { zipCode: { contains: q } }, { person: { is: { fullName: { contains: q, mode: "insensitive" } } } }] } : {}) };
    total = await context.prisma.address.count({ where }); page = Math.min(requestedPage, Math.max(1, Math.ceil(total / PAGE_SIZE)));
    const rows = await context.prisma.address.findMany({ where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: [{ streetName: "asc" }, { id: "asc" }], select: { id: true, zipCode: true, streetName: true, number: true, complement: true, person: { select: { fullName: true } }, company: { select: { corporateName: true } } } });
    candidates = rows.map(row => ({ id: row.id, title: `${row.streetName || "Logradouro não informado"}, ${row.number || "s/n"}`, subtitle: `CEP ${row.zipCode || "não informado"}`, facts: [row.person?.fullName || row.company?.corporateName || "Sem titular", row.complement || "Sem complemento"] }));
  } else if (kind === "PATIENT") {
    const where: Prisma.PatientWhereInput = { status: { not: "Unificado" }, ...(q ? { person: { is: { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { motherName: { contains: q, mode: "insensitive" } }] } } } : {}) };
    total = await context.prisma.patient.count({ where }); page = Math.min(requestedPage, Math.max(1, Math.ceil(total / PAGE_SIZE)));
    const rows = await context.prisma.patient.findMany({ where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: [{ person: { fullName: "asc" } }, { id: "asc" }], select: { id: true, cns: true, person: { select: { fullName: true, birthDate: true, motherName: true, cpf: true } }, _count: { select: { records: true, appointments: true } } } });
    candidates = rows.map(row => ({ id: row.id, title: row.person.fullName, subtitle: `CNS ${row.cns || "não informado"} · CPF ${row.person.cpf || "não informado"}`, facts: [`Nascimento: ${row.person.birthDate?.toLocaleDateString("pt-BR") || "não informado"}`, `Mãe: ${row.person.motherName || "não informada"}`, `${row._count.records} registro(s) e ${row._count.appointments} agendamento(s)`] }));
  } else {
    const where: Prisma.HealthProfessionalWhereInput = { isActive: true, ...(q ? { employee: { is: { name: { contains: q, mode: "insensitive" } } } } : {}) };
    total = await context.prisma.healthProfessional.count({ where }); page = Math.min(requestedPage, Math.max(1, Math.ceil(total / PAGE_SIZE)));
    const rows = await context.prisma.healthProfessional.findMany({ where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: [{ employee: { name: "asc" } }, { id: "asc" }], select: { id: true, cns: true, cbo: true, councilName: true, councilNumber: true, employee: { select: { name: true, cpf: true } }, _count: { select: { records: true, appointments: true, assignments: true } } } });
    candidates = rows.map(row => ({ id: row.id, title: row.employee.name, subtitle: `${row.councilName || "Conselho"} ${row.councilNumber || "não informado"} · CPF ${row.employee.cpf || "não informado"}`, facts: [`CNS: ${row.cns || "não informado"}`, `CBO: ${row.cbo || "não informado"}`, `${row._count.records} registro(s), ${row._count.appointments} agendamento(s) e ${row._count.assignments} vínculo(s)`] }));
  }
  const historyRows = await context.prisma.healthAdministrativeMerge.findMany({ where: { kind }, take: 20, orderBy: { createdAt: "desc" }, select: { id: true, kind: true, targetId: true, sourceIds: true, criteria: true, result: true, createdAt: true, actorUsuario: { select: { nome: true } } } });
  const history: MergeHistory[] = historyRows.map(row => ({ id: row.id, kind: row.kind, targetId: row.targetId, sourceIds: JSON.stringify(row.sourceIds), criteria: JSON.stringify(row.criteria), result: JSON.stringify(row.result), actor: row.actorUsuario.nome, createdAt: row.createdAt.toISOString() }));
  return <PageFrame className="flex h-full min-h-0 max-w-none flex-1 flex-col gap-2 overflow-hidden"><PageHeader title="Central de Unificações" icon={<Combine className="size-4 text-emerald-700" />} className="mb-0 shrink-0" action={<Link href="/app-domain/saude/administracao" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold">Administração</Link>} /><form className="grid shrink-0 gap-2 rounded-md border bg-white p-2 sm:grid-cols-[190px_1fr_auto]"><select name="tipo" defaultValue={kind} className="h-8 rounded border bg-white px-2 text-xs"><option value="PATIENT">Prontuários</option><option value="PROFESSIONAL">Profissionais</option><option value="ADDRESS">Endereços</option></select><input name="q" defaultValue={q} placeholder="Buscar candidatos" className="h-8 rounded border px-2 text-xs" /><button className="h-8 rounded bg-slate-800 px-4 text-xs font-bold text-white">Buscar</button></form><UnificationsClient kind={kind} candidates={candidates} history={history} canUpdate={canPerformModuleOperation(context.user, "SAUDE", "update")} /><div className="shrink-0"><ErpPagination page={page} total={total} previousHref={href(Math.max(1, page - 1), kind, q)} nextHref={href(page + 1, kind, q)} label="candidatos" jumpTo={{ pathname: "/app-domain/saude/administracao/unificacoes", values: { tipo: kind, q } }} /></div></PageFrame>;
}
