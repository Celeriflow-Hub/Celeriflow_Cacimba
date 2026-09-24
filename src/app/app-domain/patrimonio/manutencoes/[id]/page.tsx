import { notFound, redirect } from "next/navigation";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { assetOperationWhere } from "@/lib/patrimonio/asset-operations";
export default async function AssetMaintenanceOrigin({ params }: { params: Promise<{ id: string }> }) {
  const context = await getTenantContextForModule("PATRIMONIO"), { id } = await params;
  const maintenance = await context.prisma.assetMaintenance.findFirst({ where: { id, asset: assetOperationWhere(context) }, select: { assetId: true } });
  if (!maintenance) notFound();
  redirect(`/patrimonio/bens/${encodeURIComponent(maintenance.assetId)}`);
}
