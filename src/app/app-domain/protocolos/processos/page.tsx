import type { Prisma } from "@prisma/client";
import { getProtocolContext, protocolScope } from "@/lib/protocols/access";
import { parseProcessListFilters, PROCESS_LIST_PAGE_SIZE, processListHref, resolveProcessListPage } from "@/lib/protocols/process-listing-policy";
import ProcessosClient from "./ProcessosClient";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
  status?: string | string[];
  page?: string | string[];
};

function processListWhere(scope: Prisma.ProcessWhereInput, filters: ReturnType<typeof parseProcessListFilters>): Prisma.ProcessWhereInput {
  const conditions: Prisma.ProcessWhereInput[] = [scope];

  if (filters.status === "ATIVOS") {
    conditions.push({ status: { not: "Arquivado" } });
  } else if (filters.status) {
    conditions.push({ status: filters.status });
  }

  if (filters.q) {
    conditions.push({
      OR: [
        { protocolNumber: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { processType: { is: { name: { contains: filters.q, mode: "insensitive" } } } },
        { subject: { is: { name: { contains: filters.q, mode: "insensitive" } } } },
        { person: { is: { fullName: { contains: filters.q, mode: "insensitive" } } } },
        { company: { is: { corporateName: { contains: filters.q, mode: "insensitive" } } } },
      ],
    });
  }

  return { AND: conditions };
}

export default async function ProcessosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await getProtocolContext();
  const parsedFilters = parseProcessListFilters(await searchParams);
  const filters = { ...parsedFilters, status: parsedFilters.status || "ATIVOS" };
  const where = processListWhere(protocolScope(context), filters);
  const total = await context.prisma.process.count({ where });
  const page = resolveProcessListPage(filters.page, total);

  const processos = await context.prisma.process.findMany({
    where,
    include: {
      processType: { select: { name: true } },
      subject: { select: { name: true } },
      person: { select: { fullName: true } },
      company: { select: { corporateName: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PROCESS_LIST_PAGE_SIZE,
    take: PROCESS_LIST_PAGE_SIZE,
  });

  const canReceive = context.protocolAccess.canUpdate && Boolean(context.user.departmentId);
  const currentDepartmentId = context.user.departmentId || null;
  const returnTo = processListHref(filters, page);

  return (
    <ProcessosClient
      processos={processos}
      filters={filters}
      total={total}
      page={page}
      pageSize={PROCESS_LIST_PAGE_SIZE}
      canReceive={canReceive}
      currentDepartmentId={currentDepartmentId}
      canCreate={context.protocolAccess.canCreate}
      returnTo={returnTo}
    />
  );
}
