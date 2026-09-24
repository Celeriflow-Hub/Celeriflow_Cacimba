"use server";
import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

export async function createUnit(formData: FormData) {
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const secretariatId = formData.get("secretariatId") as string;
  const address = formData.get("address") as string;
  const managerName = formData.get("managerName") as string;

  if (!name || !type || !secretariatId) return { error: "Nome, Tipo e Secretaria são obrigatórios" };

  try {
    const context = await getTenantContextForSystemAdministration();
    const secretariat = await context.prisma.secretariat.findUnique({ where: { id: secretariatId }, select: { isActive: true } });
    if (!secretariat?.isActive) return { error: "A secretaria selecionada deve estar ativa." };
    await context.prisma.$transaction(async (tx) => {
      const unit = await tx.administrativeUnit.create({ data: { name, type, secretariatId, address, managerName } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "ADMINISTRATIVE_UNIT", targetId: unit.id });
    });
  } catch {
    return { error: "Erro ao criar unidade" };
  }

  revalidatePath("/administracao/unidades");
  revalidatePath("/administracao"); 
  redirect("/administracao/unidades");
}
