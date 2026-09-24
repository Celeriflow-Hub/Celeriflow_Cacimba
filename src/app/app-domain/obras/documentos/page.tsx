import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ObrasDocumentosClient } from "../components/ObrasDocumentosClient";
import { PageFrame } from "@/components/app-ui/PageFrame";

export default async function DocumentosPage() {
  const { prisma } = await getTenantContextForModule("OBRAS");
  const documentos = await prisma.obrasServicoDocumento.findMany({
    include: {
      obrasServico: true,
      document: {
        include: { folder: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <PageFrame className="px-1 py-1 md:px-2"><ObrasDocumentosClient documentos={documentos} /></PageFrame>;
}
