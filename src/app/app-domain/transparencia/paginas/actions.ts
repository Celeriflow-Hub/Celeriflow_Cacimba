"use server"

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("TRANSPARENCIA", operation)).prisma;
}

const reservedPortalSlugs = new Set(["noticias"]);

function createPortalSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createPage(data: FormData) {
  const prisma = await getTenantPrisma("create");
  const title = data.get("title") as string;
  const content = data.get("content") as string;
  const status = data.get("status") as string;

  if (!title || !content) {
    throw new Error("Título e conteúdo são obrigatórios.");
  }

  const slug = createPortalSlug(title);
  if (!slug) {
    throw new Error("Informe um título com caracteres que possam compor a URL da página.");
  }
  if (reservedPortalSlugs.has(slug)) {
    throw new Error("Este título usa uma URL reservada pelo portal. Escolha outro título para a página.");
  }

  await prisma.portalPage.create({
    data: {
      title,
      content,
      status,
      slug,
    }
  });

  revalidatePath("/transparencia/paginas");
  revalidatePath("/portal");
  revalidatePath(`/portal/${slug}`);
}

export async function deletePage(id: string) {
  const prisma = await getTenantPrisma("delete");
  const page = await prisma.portalPage.findUnique({ where: { id }, select: { slug: true } });
  if (!page) {
    throw new Error("Página institucional não encontrada.");
  }
  await prisma.portalPage.delete({
    where: { id }
  });
  revalidatePath("/transparencia/paginas");
  revalidatePath("/portal");
  revalidatePath(`/portal/${page.slug}`);
}
