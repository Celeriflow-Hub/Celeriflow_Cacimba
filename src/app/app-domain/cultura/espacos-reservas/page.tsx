import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ReservasAgendaClient } from "../components/ReservasAgendaClient";

export default async function EspacosReservasPage() {
  const { prisma } = await getTenantContextForModule("CULTURA");
  const reservas = await prisma.culturaReserva.findMany({
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    include: {
      space: {
        select: {
          nome: true,
          tipo: true,
          endereco: true,
          realEstate: {
            select: {
              municipalInsc: true,
              propertyType: true,
              streetName: true,
              number: true,
              complement: true,
            },
          },
        },
      },
      person: { select: { fullName: true, cpf: true } },
      company: { select: { corporateName: true, tradeName: true, cnpj: true } },
      event: { select: { nome: true, tipo: true, status: true } },
      documentos: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          purpose: true,
          document: { select: { title: true, documentType: true, status: true } },
        },
      },
    },
  });

  return <ReservasAgendaClient reservas={reservas.map((reserva) => ({
    ...reserva,
    startsAt: reserva.startsAt.toISOString(),
    endsAt: reserva.endsAt.toISOString(),
  }))} />;
}
