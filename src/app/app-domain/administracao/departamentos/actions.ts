"use server";
import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

export async function createDepartment(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const secretariatId = formData.get("secretariatId") as string;

  if (!name || !secretariatId) return { error: "Nome e Secretaria são obrigatórios" };

  try {
    const context = await getTenantContextForSystemAdministration();
    const secretariat = await context.prisma.secretariat.findUnique({ where: { id: secretariatId }, select: { isActive: true } });
    if (!secretariat?.isActive) return { error: "A secretaria selecionada deve estar ativa." };
    await context.prisma.$transaction(async (tx) => {
      const department = await tx.department.create({ data: { name, description, secretariatId } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "DEPARTMENT", targetId: department.id });
    });
  } catch {
    return { error: "Erro ao criar departamento" };
  }

  revalidatePath("/administracao/departamentos");
  revalidatePath("/administracao"); 
  redirect("/administracao/departamentos");
}
