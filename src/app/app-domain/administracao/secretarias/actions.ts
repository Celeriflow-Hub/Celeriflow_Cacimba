"use server";
import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

export async function createSecretariat(formData: FormData) {
  const name = formData.get("name") as string;
  const acronym = formData.get("acronym") as string;
  const managerName = formData.get("managerName") as string;

  if (!name) return { error: "Nome é obrigatório" };

  try {
    const context = await getTenantContextForSystemAdministration();
    await context.prisma.$transaction(async (tx) => {
      const secretariat = await tx.secretariat.create({ data: { name, acronym, managerName } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "SECRETARIAT", targetId: secretariat.id });
    });
  } catch {
    return { error: "Erro ao criar secretaria" };
  }

  revalidatePath("/administracao/secretarias");
  revalidatePath("/administracao"); 
  redirect("/administracao/secretarias");
}
