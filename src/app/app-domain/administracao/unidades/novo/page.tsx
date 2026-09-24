import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import NovaUnidadeForm from "./NovaUnidadeForm";

export const dynamic = "force-dynamic";

export default async function NovaUnidadePage() {
  const { prisma } = await getTenantContextForModule("ADMINISTRACAO");
  const secretariats = await prisma.secretariat.findMany({ orderBy: { name: 'asc' } });
  
  return <NovaUnidadeForm secretariats={secretariats} />;
}
