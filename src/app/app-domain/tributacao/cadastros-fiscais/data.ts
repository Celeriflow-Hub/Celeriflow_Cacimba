import type { PrismaClient } from "@prisma/client";

export async function getFiscalRegistryWorkspaceData(prisma: PrismaClient, entityType: string, entityId: string) {
  const [entries, processes, documents] = await Promise.all([
    prisma.taxRegistryEntry.findMany({ where: { entityType, entityId }, orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] }),
    prisma.process.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, protocolNumber: true, status: true } }),
    prisma.document.findMany({ where: { status: "Válido" }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, title: true, documentType: true } }),
  ]);
  return {
    entries: entries.map((entry) => ({
      id: entry.id,
      category: entry.category,
      title: entry.title,
      data: entry.data,
      status: entry.status,
      source: entry.source,
      effectiveFrom: entry.effectiveFrom.toISOString(),
      effectiveUntil: entry.effectiveUntil?.toISOString() ?? null,
      processId: entry.processId,
      documentId: entry.documentId,
      version: entry.version,
      createdAt: entry.createdAt.toISOString(),
    })),
    processes: processes.map((process) => ({ id: process.id, label: `${process.protocolNumber} · ${process.status}` })),
    documents: documents.map((document) => ({ id: document.id, label: `${document.title} · ${document.documentType}` })),
  };
}
