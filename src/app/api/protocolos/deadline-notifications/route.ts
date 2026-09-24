import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyProtocolDepartment } from "@/lib/protocols/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.PROTOCOLS_CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron secret is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorUsuarioId = process.env.NOTIFICATION_SYSTEM_ACTOR_USER_ID?.trim();
  if (!actorUsuarioId) {
    return NextResponse.json({ error: "NOTIFICATION_SYSTEM_ACTOR_USER_ID is not configured." }, { status: 503 });
  }
  const technicalActor = await prisma.usuario.findFirst({ where: { id: actorUsuarioId, ativo: true }, select: { id: true } });
  if (!technicalActor) {
    return NextResponse.json({ error: "Configured notification system actor is not active." }, { status: 503 });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 3 * 86_400_000);
  const processes = await prisma.process.findMany({
    where: {
      expectedCompletionAt: { gte: now, lte: horizon },
      completedAt: null,
      archivedAt: null,
      status: { notIn: ["Concluido", "Concluído", "Arquivado", "Cancelado"] },
      currentDepartmentId: { not: null },
    },
    select: { id: true, protocolNumber: true, currentDepartmentId: true, expectedCompletionAt: true },
    take: 500,
  });

  let created = 0;
  for (const process of processes) {
    const deadline = process.expectedCompletionAt!;
    const result = await prisma.$transaction((tx) => notifyProtocolDepartment(tx, technicalActor.id, process.currentDepartmentId!, {
      processId: process.id,
      type: "DEADLINE_REMINDER",
      title: `Prazo proximo: ${process.protocolNumber}`,
      message: `O prazo previsto e ${deadline.toLocaleDateString("pt-BR")}.`,
      priority: "ALTA",
      dedupeDiscriminator: `DEADLINE_REMINDER:${deadline.toISOString()}`,
    }));
    created += result.created;
  }

  return NextResponse.json({ checked: processes.length, created });
}
