"use server";

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("SOCIAL", operation)).prisma;
}

export async function createSocialUnit(data: { name: string; type: string; phone?: string; email?: string; addressId?: string; realEstateId?: string; managerId?: string }) {
  const prisma = await getTenantPrisma("create");
  try {
    const unit = await prisma.socialUnit.create({
      data: {
        name: data.name,
        type: data.type,
        phone: data.phone,
        email: data.email,
        addressId: data.addressId,
        realEstateId: data.realEstateId || null,
        managerId: data.managerId || null,
      },
      include: { realEstate: true, manager: true }
    });
    revalidatePath("/social/unidades");
    return { success: true, data: unit };
  } catch (error) {
    console.error("Error creating social unit:", error);
    return { success: false, error: "Falha ao criar unidade socioassistencial." };
  }
}

export async function updateSocialUnit(id: string, data: { name: string; type: string; phone?: string; email?: string; realEstateId?: string; managerId?: string }) {
  const prisma = await getTenantPrisma("update");
  try {
    const unit = await prisma.socialUnit.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        phone: data.phone,
        email: data.email,
        realEstateId: data.realEstateId || null,
        managerId: data.managerId || null,
      },
      include: { realEstate: true, manager: true }
    });
    revalidatePath("/social/unidades");
    return { success: true, data: unit };
  } catch (error) {
    console.error("Error updating social unit:", error);
    return { success: false, error: "Falha ao atualizar unidade socioassistencial." };
  }
}

export async function toggleSocialUnitStatus(id: string, isActive: boolean) {
  const prisma = await getTenantPrisma("update");
  try {
    const unit = await prisma.socialUnit.update({
      where: { id },
      data: { isActive },
      include: { realEstate: true, manager: true }
    });
    revalidatePath("/social/unidades");
    return { success: true, data: unit };
  } catch (error) {
    console.error("Error toggling social unit status:", error);
    return { success: false, error: "Falha ao alterar status da unidade." };
  }
}

export async function createFamily(data: { representativeId: string; nis?: string; familyCode?: string; income?: number; perCapitaIncome?: number; vulnerabilities?: string }) {
  const prisma = await getTenantPrisma("create");
  try {
    const family = await prisma.socialFamily.create({
      data: {
        representativeId: data.representativeId,
        nis: data.nis,
        familyCode: data.familyCode,
        income: data.income ? Number(data.income) : null,
        perCapitaIncome: data.perCapitaIncome ? Number(data.perCapitaIncome) : null,
        vulnerabilities: data.vulnerabilities,
      },
      include: { representative: true, members: true }
    });
    revalidatePath("/social/familias");
    return { success: true, data: family };
  } catch (error) {
    console.error("Error creating family:", error);
    return { success: false, error: "Falha ao cadastrar família." };
  }
}

export async function updateFamily(id: string, data: { representativeId: string; nis?: string; familyCode?: string; income?: number; perCapitaIncome?: number; vulnerabilities?: string }) {
  const prisma = await getTenantPrisma("update");
  try {
    const family = await prisma.socialFamily.update({
      where: { id },
      data: {
        representativeId: data.representativeId,
        nis: data.nis,
        familyCode: data.familyCode,
        income: data.income ? Number(data.income) : null,
        perCapitaIncome: data.perCapitaIncome ? Number(data.perCapitaIncome) : null,
        vulnerabilities: data.vulnerabilities,
      },
      include: { representative: true, members: true }
    });
    revalidatePath("/social/familias");
    return { success: true, data: family };
  } catch (error) {
    console.error("Error updating family:", error);
    return { success: false, error: "Falha ao atualizar família." };
  }
}

export async function toggleFamilyStatus(id: string, status: string) {
  const prisma = await getTenantPrisma("update");
  try {
    const family = await prisma.socialFamily.update({
      where: { id },
      data: { status },
      include: { representative: true, members: true }
    });
    revalidatePath("/social/familias");
    return { success: true, data: family };
  } catch (error) {
    console.error("Error toggling family status:", error);
    return { success: false, error: "Falha ao inativar família." };
  }
}

export async function createAttendance(data: { familyId: string; unitId: string; professionalId: string; type: string; description: string; secrecyLevel?: string; personId?: string }) {
  const prisma = await getTenantPrisma("create");
  try {
    const attendance = await prisma.socialAttendance.create({
      data: {
        familyId: data.familyId,
        unitId: data.unitId,
        professionalId: data.professionalId,
        type: data.type,
        description: data.description,
        secrecyLevel: data.secrecyLevel || "Normal",
        personId: data.personId,
        isActive: true,
      },
      include: { family: true, person: true, professional: true, unit: true }
    });
    revalidatePath("/social/prontuario");
    return { success: true, data: attendance };
  } catch (error) {
    console.error("Error creating attendance:", error);
    return { success: false, error: "Falha ao registrar atendimento." };
  }
}

export async function updateAttendance(id: string, data: { familyId: string; unitId: string; professionalId: string; type: string; description: string; secrecyLevel?: string; personId?: string }) {
  const prisma = await getTenantPrisma("update");
  try {
    const attendance = await prisma.socialAttendance.update({
      where: { id },
      data: {
        familyId: data.familyId,
        unitId: data.unitId,
        professionalId: data.professionalId,
        type: data.type,
        description: data.description,
        secrecyLevel: data.secrecyLevel || "Normal",
        personId: data.personId,
      },
      include: { family: true, person: true, professional: true, unit: true }
    });
    revalidatePath("/social/prontuario");
    return { success: true, data: attendance };
  } catch (error) {
    console.error("Error updating attendance:", error);
    return { success: false, error: "Falha ao atualizar atendimento." };
  }
}

export async function createSocialBenefit(data: { name: string; description?: string; isRecurrent: boolean; expense?: { description: string; value: number; appropriationId: string; secretariatId: string } }) {
  const prisma = await getTenantPrisma("create");
  try {
    const benefit = await prisma.socialBenefit.create({
      data: {
        name: data.name,
        description: data.description,
        isRecurrent: data.isRecurrent,
        expenses: data.expense ? {
          create: {
            description: data.expense.description,
            value: Number(data.expense.value),
            appropriationId: data.expense.appropriationId,
            secretariatId: data.expense.secretariatId,
            status: "Empenhada",
          }
        } : undefined
      },
    });
    revalidatePath("/social/beneficios");
    return { success: true, data: benefit };
  } catch (error) {
    console.error("Error creating benefit:", error);
    return { success: false, error: "Falha ao criar benefício." };
  }
}

export async function createSocialProgram(data: { name: string; sphere: string; description?: string; expense?: { description: string; value: number; appropriationId: string; secretariatId: string } }) {
  const prisma = await getTenantPrisma("create");
  try {
    const program = await prisma.socialProgram.create({
      data: {
        name: data.name,
        sphere: data.sphere,
        description: data.description,
        expenses: data.expense ? {
          create: {
            description: data.expense.description,
            value: Number(data.expense.value),
            appropriationId: data.expense.appropriationId,
            secretariatId: data.expense.secretariatId,
            status: "Empenhada",
          }
        } : undefined
      },
    });
    revalidatePath("/social/beneficios");
    return { success: true, data: program };
  } catch (error) {
    console.error("Error creating program:", error);
    return { success: false, error: "Falha ao criar programa social." };
  }
}
export async function toggleAttendanceStatus(id: string, isActive: boolean) {
  const prisma = await getTenantPrisma("update");
  try {
    const attendance = await prisma.socialAttendance.update({
      where: { id },
      data: { isActive },
      include: { family: true, person: true, professional: true, unit: true }
    });
    revalidatePath("/social/prontuario");
    return { success: true, data: attendance };
  } catch (error) {
    console.error("Error toggling attendance status:", error);
    return { success: false, error: "Falha ao inativar atendimento." };
  }
}

export async function createBenefitConcession(data: { benefitId: string; familyId: string; professionalId: string; quantity?: number; value?: number; personId?: string }) {
  const prisma = await getTenantPrisma("create");
  try {
    const concession = await prisma.socialBenefitConcession.create({
      data: {
        benefitId: data.benefitId,
        familyId: data.familyId,
        professionalId: data.professionalId,
        quantity: data.quantity || 1,
        value: data.value,
        personId: data.personId,
      },
    });
    revalidatePath("/social/beneficios");
    return { success: true, data: concession };
  } catch (error) {
    console.error("Error creating benefit concession:", error);
    return { success: false, error: "Falha ao registrar concessão de benefício." };
  }
}
