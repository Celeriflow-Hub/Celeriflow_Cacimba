import { Bell } from "lucide-react";
import { getProtocolContext } from "@/lib/protocols/access";
import { listInternalNotifications } from "@/lib/notifications/internal-notifications";
import { resolveNotificationEntities } from "@/lib/notifications/process-entity-resolver";
import NotificationsClient from "@/app/app-domain/notificacoes/NotificationsClient";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function ProtocolNotificationsPage() {
  const { prisma, user } = await getProtocolContext();
  const notifications = await listInternalNotifications(prisma, user.id, { sourceModule: "PROCESSOS" });
  const entities = await resolveNotificationEntities(notifications);
  const items = notifications.map((notification) => ({ ...notification, entity: entities.get(notification.id) ?? null }));

  return <PageFrame className="max-w-5xl space-y-2">
    <PageHeader title="Notificações internas" icon={<Bell className="size-4 shrink-0 text-emerald-600" />} />
    <p className="text-xs text-slate-500">Recebimentos, encaminhamentos e prazos dos seus processos.</p>
    <NotificationsClient initialNotifications={items} />
  </PageFrame>;
}
