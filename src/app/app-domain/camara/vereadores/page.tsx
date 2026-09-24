import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import VereadoresClient from "./VereadoresClient";

export default async function VereadoresPage() {
  const { prisma } = await getTenantContextForModule("CAMARA");
  const vereadores = await prisma.camVereador.findMany({
    orderBy: { nomeParlamentar: 'asc' },
    include: {
      gabinete: true,
      cargosMesa: true,
      legislatura: true
    }
  });

  return <VereadoresClient vereadores={vereadores} />;
}
