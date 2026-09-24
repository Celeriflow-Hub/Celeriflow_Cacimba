import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { CulturaEventosClient } from "../components/CulturaEventosClient";

export default async function EventosPage() {
  const { prisma } = await getTenantContextForModule("CULTURA");
  const eventos = await prisma.culturaEvento.findMany({
    orderBy: { data: "asc" },
    include: {
      space: {
        select: {
          id: true,
          nome: true,
          tipo: true,
          endereco: true,
          capacidade: true,
          realEstate: {
            select: {
              id: true,
              municipalInsc: true,
              registration: true,
              propertyType: true,
              streetName: true,
              number: true,
              complement: true,
            },
          },
        },
      },
      responsibleEmployee: { select: { id: true, name: true, registration: true } },
      project: {
        select: {
          id: true,
          numero: true,
          nome: true,
          categoria: true,
          status: true,
          agente: { select: { id: true, nome: true, tipo: true } },
        },
      },
      reservas: {
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          purpose: true,
          status: true,
          space: { select: { id: true, nome: true } },
        },
      },
      documentos: {
        select: {
          id: true,
          purpose: true,
          document: { select: { id: true, title: true, documentType: true, fileUrl: true, status: true } },
        },
      },
    },
  });

  return <CulturaEventosClient eventos={eventos.map((evento) => ({
    ...evento,
    data: evento.data.toISOString(),
    startsAt: evento.startsAt?.toISOString() ?? null,
    endsAt: evento.endsAt?.toISOString() ?? null,
    reservas: evento.reservas.map((reserva) => ({
      ...reserva,
      startsAt: reserva.startsAt.toISOString(),
      endsAt: reserva.endsAt.toISOString(),
    })),
  }))} />;
}
