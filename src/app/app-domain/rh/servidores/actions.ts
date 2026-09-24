"use server";

import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { validateEmployeeRelations } from "@/lib/administration/employee-lifecycle";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

async function getTenantPrisma(operation: "create" | "update" | "delete") {
  return getTenantContextForModuleOperation("RH", operation);
}

export async function saveServidor(formData: FormData) {
  const id = formData.get("id") as string | null;
  const context = await getTenantPrisma(id ? "update" : "create");
  const { prisma } = context;
  try {
    const name = formData.get("name") as string;
    const cpf = formData.get("cpf") as string;
    const registration = formData.get("registration") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const roleId = formData.get("roleId") as string;
    const departmentId = formData.get("departmentId") as string;
    const secretariatId = formData.get("secretariatId") as string;
    const isActive = formData.get("isActive") === "true";
    const salaryBase = parseFloat(formData.get("salaryBase") as string) || 0;
    const contractedHours = parseInt(formData.get("contractedHours") as string, 10) || 220;

    if (!name) {
      return { success: false, error: "Nome é obrigatório." };
    }

    const hierarchy = await validateEmployeeRelations(prisma, { secretariatId: secretariatId || null, departmentId: departmentId || null });
    const data = {
      name,
      cpf: cpf || null,
      registration: registration || null,
      email: email || null,
      phone: phone || null,
      roleId: roleId || null,
      departmentId: departmentId || null,
      secretariatId: hierarchy.secretariatId,
      isActive,
      salaryBase,
      contractedHours
    };

    await prisma.$transaction(async (tx) => {
      const employee = id
        ? await tx.employee.update({ where: { id }, data })
        : await tx.employee.create({ data });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "EMPLOYEE", targetId: employee.id });
    });

    revalidatePath("/rh/servidores");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar servidor:", error);
    return { success: false, error: "Falha ao salvar o servidor. Verifique se o CPF já está cadastrado." };
  }
}

export async function toggleServidorStatus(id: string, isActive: boolean) {
  const context = await getTenantPrisma("update");
  const { prisma } = context;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.employee.update({ where: { id }, data: { isActive } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "EMPLOYEE", targetId: id });
    });
    revalidatePath("/rh/servidores");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar status do servidor:", error);
    return { success: false, error: "Falha ao alterar status." };
  }
}

export async function deleteServidor(id: string) {
  void id;
  return { success: false, error: "A exclusão física de servidores foi desativada. Inative o servidor para preservar o histórico." };
}
