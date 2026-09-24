"use server";

import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: "create" | "update" | "delete") {
  return (await getTenantContextForModuleOperation("RH", operation)).prisma;
}

export async function savePonto(formData: FormData) {
  const id = formData.get("id") as string | null;
  const prisma = await getTenantPrisma(id ? "update" : "create");
  try {
    const employeeId = formData.get("employeeId") as string;
    const dateStr = formData.get("date") as string;
    const entryTimeStr = formData.get("entryTime") as string; // "08:00"
    const exitTimeStr = formData.get("exitTime") as string; // "17:00"
    const status = formData.get("status") as string;

    if (!employeeId || !dateStr) {
      return { success: false, error: "Servidor e Data são obrigatórios." };
    }

    const date = new Date(dateStr);
    
    // Convert times to proper Date objects if provided
    let entryTime: Date | null = null;
    let exitTime: Date | null = null;
    let hoursWorked = 0;

    if (entryTimeStr) {
      const [hours, minutes] = entryTimeStr.split(":").map(Number);
      entryTime = new Date(date);
      entryTime.setHours(hours, minutes, 0, 0);
    }

    if (exitTimeStr) {
      const [hours, minutes] = exitTimeStr.split(":").map(Number);
      exitTime = new Date(date);
      exitTime.setHours(hours, minutes, 0, 0);
    }

    if (entryTime && exitTime) {
      // Calculate hours worked
      const diffMs = exitTime.getTime() - entryTime.getTime();
      hoursWorked = Math.max(0, diffMs / (1000 * 60 * 60));
    }

    const data = {
      employeeId,
      date,
      entryTime,
      exitTime,
      status: status || "Presente",
      hoursWorked
    };

    if (id) {
      await prisma.attendanceRecord.update({
        where: { id },
        data,
      });
    } else {
      await prisma.attendanceRecord.create({
        data,
      });
    }

    revalidatePath("/rh/ponto");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar registro de ponto:", error);
    return { success: false, error: "Falha ao salvar o registro de ponto." };
  }
}

export async function deletePonto(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.attendanceRecord.delete({
      where: { id },
    });
    revalidatePath("/rh/ponto");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir registro de ponto:", error);
    return { success: false, error: "Falha ao excluir o registro de ponto." };
  }
}
