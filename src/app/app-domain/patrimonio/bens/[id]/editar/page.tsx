import { notFound } from "next/navigation";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { assetOperationWhere } from "@/lib/patrimonio/asset-operations";
import { AssetEditForm } from "./AssetEditForm";

export default async function EditarBemPatrimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await getTenantContextForModule("PATRIMONIO");
  const { id } = await params;
  const [asset, categories] = await Promise.all([
    context.prisma.asset.findFirst({
      where: { id, ...assetOperationWhere(context) },
    }),
    context.prisma.assetCategory.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!asset || asset.status === "Baixado") notFound();

  return (
    <AssetEditForm
      asset={{
        id: asset.id,
        patrimonyNumber: asset.patrimonyNumber,
        name: asset.name,
        description: asset.description || "",
        brand: asset.brand || "",
        model: asset.model || "",
        serialNumber: asset.serialNumber || "",
        categoryId: asset.categoryId,
      }}
      categories={categories}
    />
  );
}
