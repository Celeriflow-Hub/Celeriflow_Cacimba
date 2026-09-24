"use server";

import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: "create" | "update" | "delete") {
  return (await getTenantContextForModuleOperation("RH", operation)).prisma;
}

export async function saveFolha(formData: FormData) {
  const id = formData.get("id") as string | null;
  const prisma = await getTenantPrisma(id ? "update" : "create");
  try {
    const competence = formData.get("competence") as string;
    const type = formData.get("type") as string;
    const status = formData.get("status") as string;

    if (!competence) {
      return { success: false, error: "Competência é obrigatória." };
    }

    const data = {
      competence,
      type: type || "Mensal",
      status: status || "Aberta",
    };

    if (id) {
      await prisma.payroll.update({
        where: { id },
        data,
      });
    } else {
      await prisma.payroll.create({
        data,
      });
    }

    revalidatePath("/rh/folha");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar folha:", error);
    return { success: false, error: "Falha ao salvar a folha de pagamento." };
  }
}

export async function deleteFolha(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.payroll.delete({
      where: { id },
    });
    revalidatePath("/rh/folha");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir folha:", error);
    return { success: false, error: "Falha ao excluir. Verifique se existem itens vinculados a esta folha." };
  }
}

export async function processPayroll(payrollId: string) {
  const prisma = await getTenantPrisma("update");
  try {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        benefits: { include: { benefitConfig: true } }
      }
    });

    const events = await prisma.payrollEvent.findMany({ where: { isActive: true } });
    
    // Simplistic simulation
    let totalPayrollValue = 0;
    
    // Clear old items
    await prisma.payrollItem.deleteMany({ where: { payrollId } });
    
    for (const emp of employees) {
      let empTotal = 0;
      const empItems = [];
      
      const salaryBase = emp.salaryBase || 0;
      
      // Provento (Salário)
      const salaryEvent = events.find(e => e.type === "Vencimento" && e.name.toLowerCase().includes("salário"));
      if (salaryEvent) {
        empTotal += salaryBase;
        empItems.push({
          payrollId,
          employeeId: emp.id,
          eventId: salaryEvent.id,
          value: salaryBase,
          reference: "30 dias"
        });
      }
      
      // Benefícios (Descontos ou Proventos dependendo da regra, aqui só lanço o item)
      for (const ben of emp.benefits) {
        const value = ben.customValue !== null ? ben.customValue : ben.benefitConfig.baseValue;
        const benEvent = events.find(e => e.type === "Desconto" && e.name.toLowerCase().includes(ben.benefitConfig.type.toLowerCase()));
        if (benEvent) {
          empTotal -= value;
          empItems.push({
            payrollId,
            employeeId: emp.id,
            eventId: benEvent.id,
            value: value,
            reference: "Benefício"
          });
        }
      }
      
      // Insert items
      if (empItems.length > 0) {
        await prisma.payrollItem.createMany({ data: empItems });
      }
      
      totalPayrollValue += empTotal;
    }
    
    await prisma.payroll.update({
      where: { id: payrollId },
      data: { totalValue: totalPayrollValue, status: "Fechada" }
    });
    
    revalidatePath(`/rh/folha/${payrollId}/editar`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao processar folha:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao processar a folha de pagamento." };
  }
}
