"use server";

import { revalidatePath } from "next/cache";
import { markInternalNotificationRead } from "@/lib/notifications/internal-notifications";
import { getCurrentTenantContext } from "@/lib/platform/tenant-context";

export async function markNotificationRead(notificationId: string): Promise<{ error: string | null }> {
  try {
    const { prisma, user } = await getCurrentTenantContext();
    const marked = await prisma.$transaction((tx) => markInternalNotificationRead(tx, notificationId, user.id));
    if (!marked) throw new Error("Notificacao nao encontrada ou ja lida.");
    revalidatePath("/notificacoes");
    revalidatePath("/protocolos/notificacoes");
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao atualizar notificacao." };
  }
}
