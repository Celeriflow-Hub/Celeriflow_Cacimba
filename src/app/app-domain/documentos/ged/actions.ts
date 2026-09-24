"use server";

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { ingestGedDocument, requestInternalDocumentSignatures } from "@/lib/documents/document-flow-service";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("DOCUMENTOS", operation)).prisma;
}

export async function createFolder(name: string, parentId: string | null) {
  const prisma = await getTenantPrisma("create");
  if (!name.trim()) throw new Error("Nome obrigatório");
  await prisma.folder.create({
    data: { name: name.trim(), parentId: parentId || null },
  });
  revalidatePath("/documentos/ged");
  revalidatePath("/documentos");
}

export async function createDocument(
  title: string,
  documentType: string,
  documentClassCode: string,
  publicLabel: string,
  fileUrl: string,
  folderId: string | null
) {
  const context = await getTenantContextForModuleOperation("DOCUMENTOS", "create");
  if (!title.trim()) throw new Error("Título obrigatório");
  await ingestGedDocument(context.prisma, {
    title,
    documentType: documentType || "Arquivo",
    documentClassCode,
    publicLabel,
    fileUrl,
    folderId: folderId || null,
    actorUsuarioId: context.user.id,
  });
  revalidatePath("/documentos/ged");
  revalidatePath("/documentos");
}

export async function requestInternalSignatures(documentId: string, signerUsuarioIds: string[]): Promise<{ error: string | null; qrValidationUrl?: string }> {
  try {
    const context = await getTenantContextForModuleOperation("DOCUMENTOS", "create");
    const result = await requestInternalDocumentSignatures(context, documentId, signerUsuarioIds);
    revalidatePath("/documentos");
    revalidatePath("/documentos/assinaturas");
    revalidatePath("/documentos/ged");
    return { error: null, qrValidationUrl: result.qrValidationUrl };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nao foi possivel solicitar as assinaturas." };
  }
}

export async function deleteDocument(id: string) {
  const prisma = await getTenantPrisma("delete");
  await prisma.document.delete({ where: { id } });
  revalidatePath("/documentos/ged");
  revalidatePath("/documentos");
}

export async function deleteFolder(id: string) {
  const prisma = await getTenantPrisma("delete");
  // First move all documents inside to folderId = null (unlink), then delete
  await prisma.document.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });
  // Recursively unlink sub-folders' documents
  const subFolders = await prisma.folder.findMany({ where: { parentId: id } });
  for (const sub of subFolders) {
    await prisma.document.updateMany({
      where: { folderId: sub.id },
      data: { folderId: null },
    });
    await prisma.folder.delete({ where: { id: sub.id } });
  }
  await prisma.folder.delete({ where: { id } });
  revalidatePath("/documentos/ged");
  revalidatePath("/documentos");
}
