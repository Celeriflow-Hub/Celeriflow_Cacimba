import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { ListFilter } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ProcedureCatalog, type ProcedureRow } from "./ProcedureCatalog";

const PAGE_SIZE = 20;
type SearchParams = { q?: string | string[]; page?: string | string[]; source?: string | string[]; competence?: string | string[]; status?: string | string[] };

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function pageNumber(value: string | undefined) { return value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : 1; }
function href(page: number, values: Record<string, string>) {
  const params = new URLSearchParams(Object.entries({ ...values, page: String(page) }).filter(([, value]) => value));
  return `/saude/administracao/procedimentos?${params}`;
}

export default async function HealthProceduresPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { prisma } = await getTenantContextForModule("SAUDE");
  const params = await searchParams;
  const query = (first(params.q) || "").trim().slice(0, 120);
  const source = ["SIA", "SIGTAP"].includes(first(params.source) || "") ? first(params.source)! : "";
  const competence = /^\d{4}-(0[1-9]|1[0-2])$/.test(first(params.competence) || "") ? first(params.competence)! : "";
  const status = ["ativo", "inativo"].includes(first(params.status) || "") ? first(params.status)! : "";
  const where: Prisma.HealthSusProcedureWhereInput = {
    isCurrent: true,
    ...(query ? { OR: [{ code: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] } : {}),
    ...(source ? { source } : {}), ...(competence ? { competence } : {}), ...(status ? { isActive: status === "ativo" } : {}),
  };
  const total = await prisma.healthSusProcedure.count({ where });
  const requestedPage = pageNumber(first(params.page));
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const [procedures, competences] = await Promise.all([
    prisma.healthSusProcedure.findMany({
      where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: [{ code: "asc" }, { competence: "desc" }, { id: "asc" }],
      include: { sourceBatch: { select: { origin: true, fileName: true } } },
    }),
    prisma.healthSusProcedure.findMany({ distinct: ["competence"], orderBy: { competence: "desc" }, select: { competence: true } }),
  ]);
  const versionRecords = procedures.length ? await prisma.healthSusProcedure.findMany({
    where: { OR: procedures.map(item => ({ source: item.source, code: item.code })) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, source: true, code: true, competence: true, isCurrent: true, createdAt: true, sourceBatch: { select: { origin: true, fileName: true } } },
  }) : [];
  const rows: ProcedureRow[] = procedures.map(item => ({
    id: item.id, source: item.source, competence: item.competence, code: item.code, description: item.description,
    group: [item.groupCode, item.groupName].filter(Boolean).join(" · "), subgroup: [item.subgroupCode, item.subgroupName].filter(Boolean).join(" · "),
    complexity: item.complexity || "", registrationInstrument: item.registrationInstrument || "", unitValue: item.unitValue?.toString() || null,
    minimumAge: item.minimumAge, maximumAge: item.maximumAge, allowedSex: item.allowedSex || "", financing: item.financing || "",
    cidCodes: item.cidCodes || "", cboCodes: item.cboCodes || "", serviceCodes: item.serviceCodes || "", classificationCodes: item.classificationCodes || "",
    isActive: item.isActive, origin: item.sourceBatch.origin, fileName: item.sourceBatch.fileName,
    versions: versionRecords.filter(version => version.source === item.source && version.code === item.code).map(version => ({ id: version.id, competence: version.competence, isCurrent: version.isCurrent, createdAt: version.createdAt.toISOString(), origin: version.sourceBatch.origin, fileName: version.sourceBatch.fileName })),
  }));
  const values = { q: query, source, competence, status };
  return <PageFrame className="flex h-full min-h-0 max-w-none flex-1 flex-col gap-2 overflow-hidden">
    <PageHeader title="Procedimentos Ambulatoriais" icon={<ListFilter className="size-4 shrink-0 text-emerald-700" />} className="mb-0 shrink-0" action={<div className="flex gap-1"><Link href="/saude/administracao/importacoes" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cargas SUS</Link><Link href="/saude/administracao" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Administração</Link></div>} />
    <form method="get" className="grid shrink-0 gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_130px_150px_130px_auto]">
      <input name="q" defaultValue={query} placeholder="Código ou descrição" className="h-8 rounded border border-slate-300 px-2.5 text-xs" />
      <select name="source" defaultValue={source} className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"><option value="">Todas as origens</option><option value="SIA">SIA/SUS</option><option value="SIGTAP">SIGTAP</option></select>
      <select name="competence" defaultValue={competence} className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"><option value="">Todas as competências</option>{competences.map(item => <option key={item.competence} value={item.competence}>{item.competence}</option>)}</select>
      <select name="status" defaultValue={status} className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"><option value="">Todas as situações</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option></select>
      <button type="submit" className="h-8 rounded bg-slate-800 px-4 text-xs font-bold text-white hover:bg-slate-900">Consultar</button>
    </form>
    <ProcedureCatalog rows={rows} />
    <div className="shrink-0 px-1"><ErpPagination page={page} total={total} pageSize={PAGE_SIZE} previousHref={href(Math.max(1, page - 1), values)} nextHref={href(page + 1, values)} label="procedimentos" jumpTo={{ pathname: "/saude/administracao/procedimentos", values }} /></div>
  </PageFrame>;
}
