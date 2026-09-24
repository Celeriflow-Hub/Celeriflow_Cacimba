import type { Prisma } from "@prisma/client";
import { createInternalNotifications } from "@/lib/notifications/internal-notifications";

function supplierName(supplier: {
  person: { fullName: string } | null;
  company: { tradeName: string | null; corporateName: string } | null;
}) {
  return supplier.person?.fullName || supplier.company?.tradeName || supplier.company?.corporateName || "Fornecedor cadastrado";
}

// This is an internal reminder only. It deliberately does not invoke SMTP or claim email delivery.
export async function notifyPendingPriceResearchInvitations(
  tx: Prisma.TransactionClient,
  input: { actorUsuarioId: string; recipientUserIds: string[] },
) {
  const invitations = await tx.priceQuote.findMany({
    where: { status: "CONVITE_PENDENTE" },
    orderBy: { createdAt: "asc" },
    include: {
      supplier: {
        select: {
          person: { select: { fullName: true } },
          company: { select: { tradeName: true, corporateName: true } },
        },
      },
      research: { select: { process: { select: { number: true } } } },
    },
  });
  const recipientUserIds = [...new Set(input.recipientUserIds.filter(Boolean))];
  let notificationsCreated = 0;

  for (const invitation of invitations) {
    const result = await createInternalNotifications(tx, {
      actorUsuarioId: input.actorUsuarioId,
      recipientUserIds,
      sourceModule: "COMPRAS",
      entityType: "PRICE_QUOTE",
      entityId: invitation.id,
      type: "PRICE_RESEARCH_INVITATION_PENDING_DELIVERY",
      title: "Convite de pesquisa de precos pendente de entrega",
      message: `O convite de ${supplierName(invitation.supplier)} para o processo ${invitation.research.process.number} aguarda entrega manual do acesso.`,
      priority: "NORMAL",
      dedupeDiscriminator: "PENDING_DELIVERY",
    });
    notificationsCreated += result.created;
  }

  return {
    pendingInvitations: invitations.length,
    eligibleRecipients: recipientUserIds.length,
    notificationsCreated,
  };
}
