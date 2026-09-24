import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import ModelosClient from "./ModelosClient";

export const dynamic = "force-dynamic";

export default async function DocumentosModelosPage() {
  const { prisma } = await getTenantContextForModule("DOCUMENTOS");
  const modelos = await prisma.document.findMany({
    where: { documentType: "Modelo" },
    orderBy: { updatedAt: "desc" },
  });

  return <ModelosClient initialModelos={modelos} />;
}
