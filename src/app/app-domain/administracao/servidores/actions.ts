"use server";
import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateEmployeeRelations } from "@/lib/administration/employee-lifecycle";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

export async function createEmployee(formData: FormData) {
  const name = formData.get("name") as string;
  const cpf = formData.get("cpf") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const registration = formData.get("registration") as string;
  
  const roleId = formData.get("roleId") as string || null;
  const secretariatId = formData.get("secretariatId") as string || null;
  const departmentId = formData.get("departmentId") as string || null;
  const unitId = formData.get("unitId") as string || null;

  if (!name || !cpf) return { error: "Nome e CPF são obrigatórios" };

  try {
    const context = await getTenantContextForSystemAdministration();
    const hierarchy = await validateEmployeeRelations(context.prisma, { secretariatId, departmentId, unitId });
    await context.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({ data: { name, cpf, email, phone, registration, roleId, secretariatId: hierarchy.secretariatId, departmentId, unitId } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "EMPLOYEE", targetId: employee.id });
    });
  } catch (error: unknown) {
    console.error("Error creating employee:", error);
    return { error: error instanceof Error ? error.message : "Erro desconhecido ao cadastrar servidor." };
  }

  revalidatePath("/administracao/servidores");
  revalidatePath("/administracao"); 
  redirect("/administracao/servidores");
}
