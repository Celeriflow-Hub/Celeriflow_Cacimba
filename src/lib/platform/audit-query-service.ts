import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { buildAuditEventPageQuery, createAuditEventPage, type AuditEventQuery } from "./audit-query";

const auditEventInclude = {
  actorUsuario: {
    select: {
      nome: true,
      email: true,
      perfil: { select: { nome: true } },
    },
  },
} satisfies Prisma.AuditEventInclude;

export async function getAuditEventPage(db: Pick<PrismaClient, "auditEvent">, query: AuditEventQuery) {
  const events = await db.auditEvent.findMany({
    ...buildAuditEventPageQuery(query),
    include: auditEventInclude,
  });
  return createAuditEventPage(events, query);
}
