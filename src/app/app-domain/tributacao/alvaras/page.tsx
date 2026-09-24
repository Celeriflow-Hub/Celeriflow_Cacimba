import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import AlvarasClient from "./AlvarasClient";

export const dynamic = "force-dynamic";

export default async function AlvarasPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const licenses = await prisma.license.findMany({
    include: {
      taxpayer: { include: { person: true, company: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const rawTaxpayers = await prisma.taxpayer.findMany({
    include: { person: true, company: true }
  });

  const taxpayers = rawTaxpayers.map(tp => ({
    id: tp.id,
    name: tp.company?.corporateName || tp.person?.fullName || "Contribuinte sem nome"
  }));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <AlvarasClient licenses={licenses} taxpayers={taxpayers} />
    </div>
  );
}
