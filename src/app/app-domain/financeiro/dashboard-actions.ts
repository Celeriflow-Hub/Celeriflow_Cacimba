"use server"

import { getTenantContextForModule } from "@/lib/platform/tenant-context";

async function getTenantPrisma() {
  return (await getTenantContextForModule("FINANCEIRO")).prisma;
}

export async function getFinanceiroDashboardStats(month: string, year: string) {
  const prisma = await getTenantPrisma();
  let dateFilter = {}
  
  if (month && year) {
    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
    dateFilter = {
      date: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  } else if (year) {
    const startOfYear = new Date(parseInt(year), 0, 1)
    const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59, 999)
    dateFilter = {
      date: {
        gte: startOfYear,
        lte: endOfYear
      }
    }
  } else if (month) {
    // If only month is provided, assume current year
    const currentYear = new Date().getFullYear()
    const startOfMonth = new Date(currentYear, parseInt(month) - 1, 1)
    const endOfMonth = new Date(currentYear, parseInt(month), 0, 23, 59, 59, 999)
    dateFilter = {
      date: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  }

  const [revenues, expenses] = await Promise.all([
    prisma.revenue.findMany({
      select: { value: true, valueDecimal: true, classification: true },
      where: { ...dateFilter, stage: "ARRECADADA" },
    }),
    prisma.expense.findMany({
      select: { value: true, valueDecimal: true },
      where: dateFilter,
    }),
  ])

  const totalReceita = revenues.reduce((total, revenue) => total + Number(revenue.valueDecimal ?? revenue.value) * (revenue.classification === "REDUTORA" ? -1 : 1), 0)
  const totalDespesa = expenses.reduce((total, expense) => total + Number(expense.valueDecimal ?? expense.value), 0)
  const resultadoOperacional = totalReceita - totalDespesa

  return {
    totalReceita,
    totalDespesa,
    resultadoOperacional
  }
}
