import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import CertidoesClient from "./CertidoesClient";

export const dynamic = "force-dynamic";

export default async function CertidoesPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const certificates = await prisma.taxCertificate.findMany({
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
      <CertidoesClient certificates={certificates} taxpayers={taxpayers} />
    </div>
  );
}
