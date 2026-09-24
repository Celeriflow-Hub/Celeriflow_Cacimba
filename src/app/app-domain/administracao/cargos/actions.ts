"use server";
import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

export async function createRole(formData: FormData) {
  const name = formData.get("name") as string;
  const level = formData.get("level") as string;
  const description = formData.get("description") as string;
  const canSign = formData.get("canSign") === "on";

  if (!name) return { error: "Nome é obrigatório" };

  try {
    const context = await getTenantContextForSystemAdministration();
    await context.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({ data: { name, level, description, canSign } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "ROLE", targetId: role.id });
    });
  } catch {
    return { error: "Erro ao criar cargo" };
  }

  revalidatePath("/administracao/cargos");
  revalidatePath("/administracao"); 
  redirect("/administracao/cargos");
}
