import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import Link from "next/link";
import { Eye } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { BannersClient, type BannerRow } from "./BannersClient";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const { prisma } = await getTenantContextForModule("TRANSPARENCIA");
  const banners = await prisma.portalBanner.findMany({
    orderBy: { order: 'asc' },
  });
  const rows: BannerRow[] = banners.map((banner) => ({
    id: banner.id,
    title: banner.title,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl,
    position: banner.position,
    order: banner.order,
    status: banner.status,
    startDate: banner.startDate?.toISOString() || null,
    endDate: banner.endDate?.toISOString() || null,
  }));

  return (
    <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      <PageHeader
        title="Banners"
        icon={<Eye className="size-4 shrink-0 text-blue-600" />}
        action={<Link href="/transparencia/banners/novo" className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700">Novo banner</Link>}
      />
      <BannersClient rows={rows} />
    </PageFrame>
  );
}
