import type { Prisma } from "@prisma/client";
import { createInternalNotifications, type InternalNotificationPriority } from "@/lib/notifications/internal-notifications";
import { canViewModule, type AppContext } from "@/lib/platform/tenant-context";

type NotificationInput = {
  processId: string;
  type: string;
  title: string;
  message: string;
  priority?: InternalNotificationPriority;
  dedupeDiscriminator: string;
};

type NotificationRecipient = {
  id: string;
  perfil: { codigo: string; permissoes: string; ativo: boolean; nome: string };
  permissoesModulo: { modulo: { codigo: string }; canView: boolean; canEdit: boolean }[];
};

function hasProcessModuleAccess(recipient: NotificationRecipient) {
  const user: AppContext["user"] = {
    id: recipient.id,
    firebaseUid: "",
    email: "",
    name: "",
    role: recipient.perfil.nome,
    profileCode: recipient.perfil.codigo,
    permissions: recipient.perfil.permissoes,
    modulePermissions: recipient.permissoesModulo.map((permission) => ({
      code: permission.modulo.codigo.toUpperCase(),
      canView: permission.canView,
      canEdit: permission.canEdit,
    })),
    allowedBudgetUnitIds: [],
    employeeId: null,
    departmentId: null,
    secretariatId: null,
  };
  return recipient.perfil.ativo && canViewModule(user, "PROCESSOS");
}

const recipientInclude = {
  perfil: { select: { codigo: true, permissoes: true, ativo: true, nome: true } },
  permissoesModulo: { include: { modulo: { select: { codigo: true } } } },
} satisfies Prisma.UsuarioInclude;

export async function notifyProtocolDepartment(
  tx: Prisma.TransactionClient,
  actorUsuarioId: string,
  departmentId: string,
  notification: NotificationInput,
) {
  const recipients = await tx.usuario.findMany({
    where: { ativo: true, employee: { is: { isActive: true, departmentId } } },
    include: recipientInclude,
  });
  const eligibleRecipients = recipients.filter(hasProcessModuleAccess);
  if (!eligibleRecipients.length) return { created: 0 };

  return createInternalNotifications(tx, {
    actorUsuarioId,
    recipientUserIds: eligibleRecipients.map((recipient) => recipient.id),
    sourceModule: "PROCESSOS",
    entityType: "PROCESS",
    entityId: notification.processId,
    ...notification,
  });
}

export async function notifyProtocolUsers(
  tx: Prisma.TransactionClient,
  actorUsuarioId: string,
  userIds: string[],
  notification: NotificationInput,
) {
  const requestedIds = [...new Set(userIds)].filter(Boolean);
  if (!requestedIds.length) return { created: 0 };
  const recipients = await tx.usuario.findMany({
    where: { id: { in: requestedIds }, ativo: true },
    include: recipientInclude,
  });
  const eligibleRecipients = recipients.filter(hasProcessModuleAccess);
  if (!eligibleRecipients.length) return { created: 0 };

  return createInternalNotifications(tx, {
    actorUsuarioId,
    recipientUserIds: eligibleRecipients.map((recipient) => recipient.id),
    sourceModule: "PROCESSOS",
    entityType: "PROCESS",
    entityId: notification.processId,
    ...notification,
  });
}
