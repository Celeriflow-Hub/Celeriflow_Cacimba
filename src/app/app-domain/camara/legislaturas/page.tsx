import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import LegislaturasClient from "./LegislaturasClient";

export default async function LegislaturasPage() {
  const { prisma } = await getTenantContextForModule("CAMARA");
  const legislaturas = await prisma.camLegislatura.findMany({
    orderBy: { numero: 'desc' },
    include: {
      _count: {
        select: { vereadores: true }
      }
    }
  });

  return <LegislaturasClient legislaturas={legislaturas} />;
}
