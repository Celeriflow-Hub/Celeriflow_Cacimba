import Link from "next/link";
import { Landmark, Plus, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import {
  clampPatrimonioListPage,
  patrimonioListHref,
  parsePatrimonioListPage,
  PATRIMONIO_LIST_PAGE_SIZE,
} from "../listing";
import { CostCenterTable } from "./CostCenterTable";

type SearchParams = { q?: string; page?: string };

export default async function CentrosCustoPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const context = await getTenantContextForModule("PATRIMONIO");
  const params = await searchParams;
  const q = params?.q?.trim() || "";
  const requestedPage = parsePatrimonioListPage(params?.page);
  const where: Prisma.CostCenterWhereInput = q ? {
    OR: [
      { code: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ],
  } : {};
  const total = await context.prisma.costCenter.count({ where });
  const page = clampPatrimonioListPage(requestedPage, total);
  const costCenters = await context.prisma.costCenter.findMany({
    where,
    include: { _count: { select: { warehouses: true } } },
    orderBy: [{ code: "asc" }, { name: "asc" }],
    skip: (page - 1) * PATRIMONIO_LIST_PAGE_SIZE,
    take: PATRIMONIO_LIST_PAGE_SIZE,
  });
  const canCreate = canPerformModuleOperation(context.user, "PATRIMONIO", "create");
  const canUpdate = canPerformModuleOperation(context.user, "PATRIMONIO", "update");
  const canDelete = canPerformModuleOperation(context.user, "PATRIMONIO", "delete");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
      <ErpPageTitle title="Centros de custo" icon={<Landmark className="size-4 text-emerald-700" />} action={canCreate ? <Link href="/patrimonio/centros-custo/novo" className={buttonVariants({ size: "sm" })}><Plus className="size-3.5" />Novo centro de custo</Link> : undefined} />
      <ErpListFrame
        toolbar={<form className="flex items-center gap-2" role="search"><Input name="q" defaultValue={q} placeholder="Código, nome ou descrição" className="h-8 min-w-0 flex-1 bg-white text-xs sm:max-w-xl" /><button type="submit" className={buttonVariants({ size: "sm" })}><Search className="size-3.5" />Buscar</button></form>}
        summary={<p className="text-[11px] text-slate-600"><strong className="text-slate-900">{total}</strong> centro(s) de custo encontrado(s)</p>}
        pagination={<ErpPagination page={page} total={total} pageSize={PATRIMONIO_LIST_PAGE_SIZE} label="centros de custo" previousHref={patrimonioListHref("/patrimonio/centros-custo", page - 1, { q })} nextHref={patrimonioListHref("/patrimonio/centros-custo", page + 1, { q })} />}
      >
        <CostCenterTable costCenters={costCenters.map((costCenter) => ({ id: costCenter.id, code: costCenter.code, name: costCenter.name, description: costCenter.description, isActive: costCenter.isActive, warehouseCount: costCenter._count.warehouses }))} canUpdate={canUpdate} canDelete={canDelete} />
      </ErpListFrame>
    </div>
  );
}
