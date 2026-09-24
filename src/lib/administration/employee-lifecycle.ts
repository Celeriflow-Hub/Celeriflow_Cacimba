import type { PrismaClient } from "@prisma/client";
import { resolveEmployeeHierarchy } from "@/lib/administration/c3-policy";

type EmployeeRelationsInput = {
  secretariatId: string | null;
  departmentId: string | null;
  unitId?: string | null;
};

export async function validateEmployeeRelations(prisma: PrismaClient, input: EmployeeRelationsInput) {
  const [department, secretariat, unit] = await Promise.all([
    input.departmentId ? prisma.department.findUnique({ where: { id: input.departmentId }, select: { id: true, secretariatId: true, isActive: true } }) : null,
    input.secretariatId ? prisma.secretariat.findUnique({ where: { id: input.secretariatId }, select: { id: true, isActive: true } }) : null,
    input.unitId ? prisma.administrativeUnit.findUnique({ where: { id: input.unitId }, select: { id: true, secretariatId: true, isActive: true } }) : null,
  ]);
  if (input.departmentId && !department) throw new Error("Departamento não encontrado.");
  if (input.secretariatId && !secretariat) throw new Error("Secretaria não encontrada.");
  if (input.unitId && !unit) throw new Error("Unidade administrativa não encontrada.");
  return resolveEmployeeHierarchy({ requestedSecretariatId: input.secretariatId, department, secretariat, unit });
}
