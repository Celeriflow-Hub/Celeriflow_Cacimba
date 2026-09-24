import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { LaboratoryClient, type LaboratoryRow } from "./LaboratoryClient";

const PAGE_SIZE = 20;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
function href(page: number, unit: string) { return `/app-domain/saude/administracao/laboratorio?${new URLSearchParams({ page: String(page), ...(unit ? { unidade: unit } : {}) })}`; }

export default async function LaboratoryPage({ searchParams }: { searchParams: Promise<{ unidade?: string | string[]; page?: string | string[] }> }) {
  const context = await getTenantContextForModule("SAUDE");
  const params = await searchParams;
  const unitId = (first(params.unidade) || "").slice(0, 64);
  const requestedPage = Number(first(params.page)) || 1;
  const where = unitId ? { unitId } : {};
  const total = await context.prisma.healthLaboratoryConfiguration.count({ where });
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const [configurations, units] = await Promise.all([
    context.prisma.healthLaboratoryConfiguration.findMany({ where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: [{ isActive: "desc" }, { createdAt: "desc" }], select: { id: true, unitId: true, laboratoryName: true, collectionStartTime: true, collectionEndTime: true, resultReleaseDays: true, allowsExternalProcessing: true, requiresTechnicalReview: true, usesDigitalSignature: true, publishesPatientPortal: true, resultFooterMessage: true, effectiveFrom: true, effectiveUntil: true, isActive: true, createdAt: true, unit: { select: { name: true } }, createdByUsuario: { select: { nome: true } } } }),
    context.prisma.healthUnit.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const rows: LaboratoryRow[] = configurations.map(row => ({ ...row, unitName: row.unit.name, createdBy: row.createdByUsuario.nome, createdAt: row.createdAt.toISOString() }));
  return <PageFrame className="flex h-full min-h-0 max-w-none flex-1 flex-col gap-2 overflow-hidden"><PageHeader title="Configuração Laboratorial" icon={<FlaskConical className="size-4 text-emerald-700" />} className="mb-0 shrink-0" action={<Link href="/app-domain/saude/administracao" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold">Administração</Link>} /><form className="flex shrink-0 gap-2 rounded-md border bg-white p-2"><select name="unidade" defaultValue={unitId} className="h-8 min-w-0 flex-1 rounded border bg-white px-2 text-xs"><option value="">Todas as unidades</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select><button className="h-8 rounded bg-slate-800 px-4 text-xs font-bold text-white">Filtrar</button></form><LaboratoryClient rows={rows} units={units} canUpdate={canPerformModuleOperation(context.user, "SAUDE", "update")} /><div className="shrink-0"><ErpPagination page={page} total={total} previousHref={href(Math.max(1, page - 1), unitId)} nextHref={href(page + 1, unitId)} label="configurações" jumpTo={{ pathname: "/app-domain/saude/administracao/laboratorio", values: { unidade: unitId } }} /></div></PageFrame>;
}
