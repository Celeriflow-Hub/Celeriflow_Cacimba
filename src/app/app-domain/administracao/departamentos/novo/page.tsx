import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import NovoDepartamentoForm from "./NovoDepartamentoForm";

export const dynamic = "force-dynamic";

export default async function NovaDepartamentoPage() {
  const { prisma } = await getTenantContextForModule("ADMINISTRACAO");
  const secretariats = await prisma.secretariat.findMany({ orderBy: { name: 'asc' } });
  
  return <NovoDepartamentoForm secretariats={secretariats} />;
}
