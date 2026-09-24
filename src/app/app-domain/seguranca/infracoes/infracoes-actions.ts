"use server";

import { getTenantContextForModule, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, type TrafficInfractionTicket } from "@prisma/client";

type ActionResult<T = unknown> = { error?: string; data?: T };

const ticketSchema = z.object({
  placaVeiculo: z.string().min(1, "Informe a placa do veículo."),
  chassi: z.string().optional(),
  codigoCtb: z.string().min(1, "Informe o código da infração CTB."),
  descricaoInfracao: z.string().min(1, "Informe a descrição da infração."),
  valorMulta: z.number().positive("Informe o valor da multa."),
  geolocalizacao: z.string().default("-7.2234, -35.8821"),
});

export async function issueTrafficTicketAction(input: z.infer<typeof ticketSchema>): Promise<ActionResult<TrafficInfractionTicket>> {
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const context = await getTenantContextForModuleOperation("SEGURANCA", "create");
    const { prisma, user } = context;

    const numeroAit = `AIT-GM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const qrCodePix = `00020126580014BR.GOV.BCB.PIX0136ait-multas-${numeroAit}5204000053039865405${parsed.data.valorMulta.toFixed(2)}5802BR5925GUARDA MUNICIPAL6009CAMPINA GR62070503***6304E2B1`;

    const ticket = await prisma.trafficInfractionTicket.create({
      data: {
        numeroAit,
        placaVeiculo: parsed.data.placaVeiculo.toUpperCase(),
        chassi: parsed.data.chassi,
        codigoCtb: parsed.data.codigoCtb,
        descricaoInfracao: parsed.data.descricaoInfracao,
        valorMulta: new Prisma.Decimal(parsed.data.valorMulta),
        geolocalizacao: parsed.data.geolocalizacao,
        agenteMatricula: user.employeeId || "GM-1092",
        status: "TRANSMITIDO_SNA",
        qrCodePix,
      },
    });

    revalidatePath("/seguranca/infracoes");
    return { data: ticket };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao emitir Auto de Infração Eletrônico (AIT)." };
  }
}

export async function getTrafficTicketsAction(): Promise<ActionResult<TrafficInfractionTicket[]>> {
  try {
    const context = await getTenantContextForModule("SEGURANCA");
    const tickets = await context.prisma.trafficInfractionTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return { data: tickets };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao carregar autos de infração." };
  }
}
