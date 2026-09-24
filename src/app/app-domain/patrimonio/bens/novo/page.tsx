import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { AssetReceiptForm } from "./AssetReceiptForm";

export default async function NovoBemPatrimonialPage() {
  const { prisma } = await getTenantContextForModule("PATRIMONIO");
  const [categories, departments] = await Promise.all([
    prisma.assetCategory.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return <AssetReceiptForm categories={categories} departments={departments} />;
}
