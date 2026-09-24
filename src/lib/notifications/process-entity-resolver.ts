import { getProtocolContext, protocolScope } from "@/lib/protocols/access";

type NotificationEntity = {
  id: string;
  sourceModule: string;
  entityType: string;
  entityId: string;
};

export type ResolvedNotificationEntity = {
  href: string;
  label: string;
};

// Notification history is personal. Links are exposed only after the target module reauthorizes the entity.
export async function resolveNotificationEntities(notifications: NotificationEntity[]) {
  const processNotifications = notifications.filter((notification) => notification.sourceModule === "PROCESSOS" && notification.entityType === "PROCESS");
  const resolved = new Map<string, ResolvedNotificationEntity>();
  if (!processNotifications.length) return resolved;

  try {
    const context = await getProtocolContext();
    const processIds = [...new Set(processNotifications.map((notification) => notification.entityId))];
    const processes = await context.prisma.process.findMany({
      where: { id: { in: processIds }, ...protocolScope(context) },
      select: { id: true, protocolNumber: true },
    });
    const processesById = new Map(processes.map((process) => [process.id, process]));
    for (const notification of processNotifications) {
      const process = processesById.get(notification.entityId);
      if (process) resolved.set(notification.id, { href: `/protocolos/processos/${process.id}`, label: `Abrir ${process.protocolNumber}` });
    }
  } catch {
    // A global notification remains visible when its source module is unavailable to the recipient.
  }

  return resolved;
}
