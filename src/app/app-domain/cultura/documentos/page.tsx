import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { CulturaDocumentosClient, type CulturaDocumento } from "../components/CulturaDocumentosClient";

export default async function DocumentosPage() {
  const { prisma } = await getTenantContextForModule("CULTURA");
  const [eventDocuments, projectDocuments, reservationDocuments, councilDocuments] = await Promise.all([
    prisma.culturaEventoDocumento.findMany({
      include: { event: { select: { nome: true } }, document: { include: { folder: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.culturaProjetoDocumento.findMany({
      include: { project: { select: { numero: true, nome: true } }, document: { include: { folder: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.culturaReservaDocumento.findMany({
      include: { reservation: { select: { purpose: true, space: { select: { nome: true } } } }, document: { include: { folder: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.culturaConselhoDocumento.findMany({
      include: { council: { select: { nome: true } }, document: { include: { folder: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const documentos: CulturaDocumento[] = [
    ...eventDocuments.map((item) => ({
      id: item.id,
      purpose: item.purpose,
      ownerType: "Evento",
      ownerName: item.event.nome,
      createdAt: item.createdAt.toISOString(),
      document: item.document,
    })),
    ...projectDocuments.map((item) => ({
      id: item.id,
      purpose: item.purpose,
      ownerType: "Projeto",
      ownerName: `${item.project.numero} - ${item.project.nome}`,
      createdAt: item.createdAt.toISOString(),
      document: item.document,
    })),
    ...reservationDocuments.map((item) => ({
      id: item.id,
      purpose: item.purpose,
      ownerType: "Reserva",
      ownerName: `${item.reservation.purpose} - ${item.reservation.space.nome}`,
      createdAt: item.createdAt.toISOString(),
      document: item.document,
    })),
    ...councilDocuments.map((item) => ({
      id: item.id,
      purpose: item.purpose,
      ownerType: "Conselho",
      ownerName: item.council.nome,
      createdAt: item.createdAt.toISOString(),
      document: item.document,
    })),
  ].sort((first, second) => second.createdAt.localeCompare(first.createdAt));

  return <CulturaDocumentosClient documentos={documentos} />;
}
