import type { Prisma } from "@prisma/client";
import { getProtocolContext, protocolScope } from "@/lib/protocols/access";
import { parseProcessListFilters, PROCESS_LIST_PAGE_SIZE, resolveProcessListPage } from "@/lib/protocols/process-listing-policy";
import ArquivadosClient from "./ArquivadosClient";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
  page?: string | string[];
};

export default async function ArquivadosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await getProtocolContext();
  const filters = parseProcessListFilters(await searchParams);
  const conditions: Prisma.ProcessWhereInput[] = [
    protocolScope(context),
    { status: "Arquivado" },
  ];

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

  const where: Prisma.ProcessWhereInput = { AND: conditions };
  const total = await context.prisma.process.count({ where });
  const page = resolveProcessListPage(filters.page, total);
  const processos = await context.prisma.process.findMany({
    where,
    select: {
      id: true,
      protocolNumber: true,
      status: true,
      archivedAt: true,
      processType: { select: { name: true } },
      subject: { select: { name: true } },
      person: { select: { fullName: true } },
      company: { select: { corporateName: true } },
    },
    orderBy: [{ archivedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PROCESS_LIST_PAGE_SIZE,
    take: PROCESS_LIST_PAGE_SIZE,
  });

  return (
    <ArquivadosClient
      processos={processos}
      query={filters.q}
      total={total}
      page={page}
      pageSize={PROCESS_LIST_PAGE_SIZE}
    />
  );
}
