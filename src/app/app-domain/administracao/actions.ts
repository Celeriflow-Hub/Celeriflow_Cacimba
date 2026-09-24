"use server";

import { assertLifecycleCanDeactivate } from "@/lib/administration/c3-policy";
import { validateEmployeeRelations } from "@/lib/administration/employee-lifecycle";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

type ActionResult = { error: string | null };

async function runAdministrativeMutation(targetType: string, targetId: string, mutate: (context: Awaited<ReturnType<typeof getTenantContextForSystemAdministration>>) => Promise<void>): Promise<ActionResult> {
  try {
    const context = await getTenantContextForSystemAdministration();
    await mutate(context);
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível concluir a alteração administrativa." };
  }
}

async function auditMutation(context: Awaited<ReturnType<typeof getTenantContextForSystemAdministration>>, targetType: string, targetId: string, mutation: (tx: Prisma.TransactionClient) => Promise<void>) {
  await context.prisma.$transaction(async (tx) => {
    await mutation(tx);
    await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType, targetId });
  });
}

export async function deactivateSecretariat(id: string) {
  const result = await runAdministrativeMutation("SECRETARIAT", id, async (context) => {
    const [departments, units, employees] = await Promise.all([
      context.prisma.department.count({ where: { secretariatId: id, isActive: true } }),
      context.prisma.administrativeUnit.count({ where: { secretariatId: id, isActive: true } }),
      context.prisma.employee.count({ where: { secretariatId: id, isActive: true } }),
    ]);
    assertLifecycleCanDeactivate({ entity: "a secretaria", activeChildrenOrReferences: departments + units + employees });
    await auditMutation(context, "SECRETARIAT", id, (tx) => tx.secretariat.update({ where: { id }, data: { isActive: false } }).then(() => undefined));
  });
  if (!result.error) revalidatePath("/administracao/secretarias");
  return result;
}

export async function activateSecretariat(id: string) {
  const result = await runAdministrativeMutation("SECRETARIAT", id, (context) => auditMutation(context, "SECRETARIAT", id, (tx) => tx.secretariat.update({ where: { id }, data: { isActive: true } }).then(() => undefined)));
  if (!result.error) revalidatePath("/administracao/secretarias");
  return result;
}

export async function updateSecretariat(id: string, data: { name: string; acronym: string; managerName: string }) {
  const result = await runAdministrativeMutation("SECRETARIAT", id, (context) => auditMutation(context, "SECRETARIAT", id, (tx) => tx.secretariat.update({ where: { id }, data }).then(() => undefined)));
  if (!result.error) revalidatePath("/administracao/secretarias");
  return result;
}

export async function deactivateDepartment(id: string) {
  const result = await runAdministrativeMutation("DEPARTMENT", id, async (context) => {
    const employees = await context.prisma.employee.count({ where: { departmentId: id, isActive: true } });
    assertLifecycleCanDeactivate({ entity: "o departamento", activeChildrenOrReferences: employees });
    await auditMutation(context, "DEPARTMENT", id, (tx) => tx.department.update({ where: { id }, data: { isActive: false } }).then(() => undefined));
  });
  if (!result.error) revalidatePath("/administracao/departamentos");
  return result;
}

export async function activateDepartment(id: string) {
  const result = await runAdministrativeMutation("DEPARTMENT", id, async (context) => {
    const department = await context.prisma.department.findUnique({ where: { id }, select: { secretariat: { select: { isActive: true } } } });
    if (!department?.secretariat.isActive) throw new Error("Ative a secretaria antes de ativar o departamento.");
    await auditMutation(context, "DEPARTMENT", id, (tx) => tx.department.update({ where: { id }, data: { isActive: true } }).then(() => undefined));
  });
  if (!result.error) revalidatePath("/administracao/departamentos");
  return result;
}

export async function updateDepartment(id: string, data: { name: string; description: string; secretariatId: string }) {
  const result = await runAdministrativeMutation("DEPARTMENT", id, async (context) => {
    const [department, secretariat, employeeCount] = await Promise.all([
      context.prisma.department.findUnique({ where: { id }, select: { secretariatId: true } }),
      context.prisma.secretariat.findUnique({ where: { id: data.secretariatId }, select: { isActive: true } }),
      context.prisma.employee.count({ where: { departmentId: id } }),
    ]);
    if (!department || !secretariat?.isActive) throw new Error("A secretaria selecionada deve estar ativa.");
    if (department.secretariatId !== data.secretariatId && employeeCount > 0) throw new Error("Não é possível mover um departamento que possui servidores vinculados.");
    await auditMutation(context, "DEPARTMENT", id, (tx) => tx.department.update({ where: { id }, data }).then(() => undefined));
  });
  if (!result.error) revalidatePath("/administracao/departamentos");
  return result;
}

// Role.canSign remains informational; document signing has its own authorization flow.
export async function deactivateRole(id: string) {
  const result = await runAdministrativeMutation("ROLE", id, (context) => auditMutation(context, "ROLE", id, (tx) => tx.role.update({ where: { id }, data: { isActive: false } }).then(() => undefined)));
  if (!result.error) revalidatePath("/administracao/cargos");
  return result;
}

export async function activateRole(id: string) {
  const result = await runAdministrativeMutation("ROLE", id, (context) => auditMutation(context, "ROLE", id, (tx) => tx.role.update({ where: { id }, data: { isActive: true } }).then(() => undefined)));
  if (!result.error) revalidatePath("/administracao/cargos");
  return result;
}

export async function updateRole(id: string, data: { name: string; level: string; canSign: boolean }) {
  const result = await runAdministrativeMutation("ROLE", id, (context) => auditMutation(context, "ROLE", id, (tx) => tx.role.update({ where: { id }, data }).then(() => undefined)));
  if (!result.error) revalidatePath("/administracao/cargos");
  return result;
}

export async function deactivateEmployee(id: string) {
  const result = await runAdministrativeMutation("EMPLOYEE", id, (context) => auditMutation(context, "EMPLOYEE", id, (tx) => tx.employee.update({ where: { id }, data: { isActive: false } }).then(() => undefined)));
  if (!result.error) revalidatePath("/administracao/servidores");
  return result;
}

export async function activateEmployee(id: string) {
  const result = await runAdministrativeMutation("EMPLOYEE", id, (context) => auditMutation(context, "EMPLOYEE", id, (tx) => tx.employee.update({ where: { id }, data: { isActive: true } }).then(() => undefined)));
  if (!result.error) revalidatePath("/administracao/servidores");
  return result;
}

export async function updateEmployee(id: string, data: { name: string; email: string; cpf: string; roleId: string | null; secretariatId: string | null; departmentId: string | null }) {
  const result = await runAdministrativeMutation("EMPLOYEE", id, async (context) => {
    const hierarchy = await validateEmployeeRelations(context.prisma, data);
    await auditMutation(context, "EMPLOYEE", id, (tx) => tx.employee.update({ where: { id }, data: { ...data, secretariatId: hierarchy.secretariatId } }).then(() => undefined));
  });
  if (!result.error) revalidatePath("/administracao/servidores");
  return result;
}

export async function deactivateAdministrativeUnit(id: string) {
  const result = await runAdministrativeMutation("ADMINISTRATIVE_UNIT", id, async (context) => {
    const employees = await context.prisma.employee.count({ where: { unitId: id, isActive: true } });
    assertLifecycleCanDeactivate({ entity: "a unidade administrativa", activeChildrenOrReferences: employees });
    await auditMutation(context, "ADMINISTRATIVE_UNIT", id, (tx) => tx.administrativeUnit.update({ where: { id }, data: { isActive: false } }).then(() => undefined));
  });
  if (!result.error) revalidatePath("/administracao/unidades");
  return result;
}

export async function activateAdministrativeUnit(id: string) {
  const result = await runAdministrativeMutation("ADMINISTRATIVE_UNIT", id, async (context) => {
    const unit = await context.prisma.administrativeUnit.findUnique({ where: { id }, select: { secretariat: { select: { isActive: true } } } });
    if (!unit?.secretariat.isActive) throw new Error("Ative a secretaria antes de ativar a unidade.");
    await auditMutation(context, "ADMINISTRATIVE_UNIT", id, (tx) => tx.administrativeUnit.update({ where: { id }, data: { isActive: true } }).then(() => undefined));
  });
  if (!result.error) revalidatePath("/administracao/unidades");
  return result;
}

export async function updateAdministrativeUnit(id: string, data: { name: string; type: string; managerName: string; secretariatId: string }) {
  const result = await runAdministrativeMutation("ADMINISTRATIVE_UNIT", id, async (context) => {
    const [unit, secretariat, employeeCount] = await Promise.all([
      context.prisma.administrativeUnit.findUnique({ where: { id }, select: { secretariatId: true } }),
      context.prisma.secretariat.findUnique({ where: { id: data.secretariatId }, select: { isActive: true } }),
      context.prisma.employee.count({ where: { unitId: id } }),
    ]);
    if (!unit || !secretariat?.isActive) throw new Error("A secretaria selecionada deve estar ativa.");
    if (unit.secretariatId !== data.secretariatId && employeeCount > 0) throw new Error("Não é possível mover uma unidade que possui servidores vinculados.");
    await auditMutation(context, "ADMINISTRATIVE_UNIT", id, (tx) => tx.administrativeUnit.update({ where: { id }, data }).then(() => undefined));
  });
  if (!result.error) revalidatePath("/administracao/unidades");
  return result;
}

export async function updateInternalDemand(id: string, data: { title: string; status: string; priority: string; assigneeId: string | null; secretariatId: string | null; departmentId: string | null }) {
  const result = await runAdministrativeMutation("INTERNAL_DEMAND", id, (context) => auditMutation(context, "INTERNAL_DEMAND", id, (tx) => tx.internalDemand.update({ where: { id }, data }).then(() => undefined)));
  if (!result.error) revalidatePath("/administracao/demandas");
  return result;
}

export async function deleteCalendarEvent(id: string) {
  const result = await runAdministrativeMutation("CALENDAR_EVENT", id, (context) => auditMutation(context, "CALENDAR_EVENT", id, (tx) => tx.calendarEvent.delete({ where: { id } }).then(() => undefined)));
  if (!result.error) revalidatePath("/administracao/calendario");
  return result;
}

export async function updateCalendarEvent(id: string, data: { title: string; description: string; date: Date; type: string; isHoliday: boolean }) {
  const result = await runAdministrativeMutation("CALENDAR_EVENT", id, (context) => auditMutation(context, "CALENDAR_EVENT", id, (tx) => tx.calendarEvent.update({ where: { id }, data }).then(() => undefined)));
  if (!result.error) revalidatePath("/administracao/calendario");
  return result;
}
