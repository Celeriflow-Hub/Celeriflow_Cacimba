import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import Link from "next/link";
import { FileOutput } from "lucide-react";
import PaginasTable from "./PaginasTable";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function PaginasPage() {
  const { prisma } = await getTenantContextForModule("TRANSPARENCIA");
  const pages = await prisma.portalPage.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      <PageHeader
        title="Páginas institucionais"
        icon={<FileOutput className="size-4 shrink-0 text-purple-600" />}
        action={<Link href="/transparencia/paginas/novo" className="rounded-md bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-purple-700">Nova página</Link>}
      />
      <PaginasTable pages={pages.map((page) => ({ id: page.id, title: page.title, slug: page.slug, content: page.content, status: page.status, updatedAt: page.updatedAt.toISOString(), section: page.slug.split("/").filter(Boolean)[0] || "Institucional" }))} />
    </PageFrame>
  );
}
