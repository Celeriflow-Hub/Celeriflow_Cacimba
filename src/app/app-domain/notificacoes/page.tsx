import { Bell } from "lucide-react";
import { countUnreadInternalNotifications, listInternalNotifications } from "@/lib/notifications/internal-notifications";
import { resolveNotificationEntities } from "@/lib/notifications/process-entity-resolver";
import { getCurrentTenantContext } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import NotificationsClient from "./NotificationsClient";

export const dynamic = "force-dynamic";

export default async function InternalNotificationsPage() {
  const { prisma, user } = await getCurrentTenantContext();
  const [notifications, unread] = await Promise.all([
    listInternalNotifications(prisma, user.id),
    countUnreadInternalNotifications(prisma, user.id),
  ]);
  const entities = await resolveNotificationEntities(notifications);
  const items = notifications.map((notification) => ({ ...notification, entity: entities.get(notification.id) ?? null }));

  return <PageFrame className="max-w-5xl space-y-2">
    <PageHeader title={unread ? `Notificações internas (${unread})` : "Notificações internas"} icon={<Bell className="size-4 shrink-0 text-emerald-600" />} />
    <NotificationsClient initialNotifications={items} />
  </PageFrame>;
}
