import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import ImoveisClient from "./ImoveisClient";

export const dynamic = "force-dynamic";

export default async function ImoveisFiscaisPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const [imoveis, rawTaxpayers] = await Promise.all([prisma.realEstate.findMany({
    include: {
      taxpayer: {
        include: { person: true, company: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  }), prisma.taxpayer.findMany({ where: { status: "Ativo" }, include: { person: true, company: true }, orderBy: { updatedAt: "desc" } })]);

  const taxpayers = rawTaxpayers.map((taxpayer) => ({ id: taxpayer.id, name: taxpayer.company?.corporateName ?? taxpayer.person?.fullName ?? "Contribuinte sem nome" }));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ImoveisClient imoveis={imoveis} taxpayers={taxpayers} />
    </div>
  );
}
