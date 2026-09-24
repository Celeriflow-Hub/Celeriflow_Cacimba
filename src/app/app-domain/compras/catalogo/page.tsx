import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import CatalogoClient from "./CatalogoClient"

export default async function CatalogoPage() {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const items = await prisma.catalogItem.findMany({
    orderBy: { createdAt: 'desc' }
  }).catch(() => [])

  return <CatalogoClient items={items} />
}
