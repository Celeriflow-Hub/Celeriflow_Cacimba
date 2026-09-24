"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, CircleAlert } from "lucide-react";
import { markNotificationRead } from "./actions";

export type NotificationListItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  readAt: Date | string | null;
  createdAt: Date | string;
  entity?: { href: string; label: string } | null;
};

const priorityClasses: Record<string, string> = {
  BAIXA: "bg-slate-100 text-slate-700",
  NORMAL: "bg-blue-100 text-blue-700",
  ALTA: "bg-amber-100 text-amber-800",
  URGENTE: "bg-red-100 text-red-800",
};

export default function NotificationsClient({ initialNotifications }: { initialNotifications: NotificationListItem[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  function markRead(id: string) {
    startTransition(async () => {
      const result = await markNotificationRead(id);
      if (!result.error) setNotifications((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date() } : item));
    });
  }

  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    {notifications.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">Nenhuma notificação no momento.</p> : <div className="divide-y divide-slate-100">{notifications.map((notification) => <div key={notification.id} className={`flex gap-3 p-4 ${notification.readAt ? "bg-white" : "bg-emerald-50/40"}`}>
      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-800">{notification.title}</p><time className="text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString("pt-BR")}</time></div><p className="mt-1 text-sm text-slate-600">{notification.message}</p><span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityClasses[notification.priority] || priorityClasses.NORMAL}`}>{notification.priority}</span>{notification.entity && <Link href={notification.entity.href} className="ml-3 mt-2 inline-block text-xs font-semibold text-emerald-700">{notification.entity.label}</Link>}</div>
      {!notification.readAt && <button onClick={() => markRead(notification.id)} disabled={isPending} className="self-start rounded-md p-1 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50" aria-label="Marcar como lida"><Check className="h-4 w-4" /></button>}
    </div>)}</div>}
  </div>;
}
