import type { Prisma, PrismaClient } from "@prisma/client";
import { uploadGeneratedFinancialFile } from "@/lib/platform/blob";
import { ingestGedDocument } from "@/lib/documents/document-flow-service";

const financialFolderName = "Financeiro";

async function resolveFinancialFolder(tx: Prisma.TransactionClient) {
  // Serializing this lookup prevents simultaneous reports from creating duplicate root folders.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`GED:${financialFolderName}`}))`;
  const folder = await tx.folder.findFirst({
    where: { name: financialFolderName, parentId: null },
    select: { id: true },
  });
  return folder?.id ?? (await tx.folder.create({
    data: {
      name: financialFolderName,
      description: "Documentos gerados pelo módulo Financeiro.",
    },
    select: { id: true },
  })).id;
}

async function moveFinancialDocumentsToFolder(tx: Prisma.TransactionClient, folderId: string) {
  await tx.document.updateMany({
    where: {
      folderId: null,
      OR: [
        { documentType: { startsWith: "FINANCEIRO:" } },
        { documentType: { startsWith: "PUBLIC_FINANCIAL_REPORT:" } },
      ],
    },
    data: { folderId },
  });
}

export async function ensureFinancialGedFolder(db: PrismaClient) {
  return db.$transaction(async (tx) => {
    const folderId = await resolveFinancialFolder(tx);
    await moveFinancialDocumentsToFolder(tx, folderId);
    return folderId;
  });
}

export async function saveFinancialFileToGed(
  db: PrismaClient,
  input: {
    title: string;
    documentType: string;
    filename: string;
    content: string | Uint8Array;
    contentType: string;
    fileUrl?: string;
    actorUsuarioId: string;
  },
) {
  const file = input.fileUrl
    ? { url: input.fileUrl }
    : await uploadGeneratedFinancialFile(input.filename, input.content, input.contentType);
  const folderId = await db.$transaction(async (tx) => {
    const folderId = await resolveFinancialFolder(tx);
    await moveFinancialDocumentsToFolder(tx, folderId);
    return folderId;
  });
  const document = await ingestGedDocument(db, {
    title: input.title,
    documentType: input.documentType,
    documentClassCode: "GED_EXTERNAL_PROVIDER_REQUIRED",
    fileUrl: file.url,
    folderId,
    content: input.content,
    actorUsuarioId: input.actorUsuarioId,
  });
  return { documentId: document.documentId, folderId };
}
