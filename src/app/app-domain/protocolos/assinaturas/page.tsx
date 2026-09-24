import { getProtocolContext, protocolScope } from "@/lib/protocols/access";
import { parseProcessListFilters, PROCESS_LIST_PAGE_SIZE, resolveProcessListPage } from "@/lib/protocols/process-listing-policy";
import AssinaturasClient from "./AssinaturasClient";

export const dynamic = "force-dynamic";

type SearchParams = {
  page?: string | string[];
};

export default async function AssinaturasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await getProtocolContext();
  const { prisma, user } = context;
  const filters = parseProcessListFilters(await searchParams);
  const where = {
    signerUsuarioId: user.id,
    status: "PENDING",
    documentVersion: { status: "PENDING_SIGNATURE" },
    document: { processDocuments: { some: { process: { is: protocolScope(context) } } } },
  };
  const total = await prisma.documentSignature.count({ where });
  const page = resolveProcessListPage(filters.page, total);
  const signatures = await prisma.documentSignature.findMany({
    where,
    select: {
      id: true,
      documentId: true,
      requestedAt: true,
      document: {
        select: {
          title: true,
          documentType: true,
          processDocuments: {
            where: { process: { is: protocolScope(context) } },
            select: { process: { select: { id: true, protocolNumber: true } } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ requestedAt: "asc" }, { id: "asc" }],
    skip: (page - 1) * PROCESS_LIST_PAGE_SIZE,
    take: PROCESS_LIST_PAGE_SIZE,
  });

  return (
    <AssinaturasClient
      key={"signatures:" + page + ":" + total + ":" + signatures.map((signature) => signature.id).join(",")}
      initialDocuments={signatures.flatMap((signature) => {
        const process = signature.document.processDocuments[0]?.process;
        return process
          ? [{
            signatureId: signature.id,
            id: signature.documentId,
            title: signature.document.title,
            documentType: signature.document.documentType,
            requestedAt: signature.requestedAt,
            process,
          }]
          : [];
      })}
      total={total}
      page={page}
      pageSize={PROCESS_LIST_PAGE_SIZE}
    />
  );
}
