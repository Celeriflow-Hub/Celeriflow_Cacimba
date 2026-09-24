"use server";

import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { getCeleriFlowInstanceId } from "@/lib/platform/instance";
import { isPocModeEnabled } from "@/lib/poc/poc-config";

const POC_RESET_CONFIRMATION = "RESETAR POC";

export async function resetPocDatabaseAction(confirmation: string): Promise<{ success?: boolean; message?: string; error?: string }> {
  try {
    const context = await getTenantContextForSystemAdministration();
    if (!isPocModeEnabled() || process.env.CELERIFLOW_POC_RESET_ENABLED !== "true") {
      throw new Error("O reset esta desabilitado para esta instancia.");
    }
    if (confirmation !== POC_RESET_CONFIRMATION) {
      throw new Error(`Digite \"${POC_RESET_CONFIRMATION}\" para confirmar o reset.`);
    }
    const instanceId = getCeleriFlowInstanceId();

    console.log(`[POC-RESET] Iniciando reset financeiro da instancia ${instanceId}.`);
    await resetPocFinancialData(context.prisma);

    return {
      success: true,
      message: `Dados financeiros locais da instancia ${instanceId} restaurados. Restaure o banco virtual separadamente pelo perfil SANDBOX_ADMIN.`,
    };
  } catch (err) {
    console.error("[POC-RESET-ERROR]", err);
    return {
      error: err instanceof Error ? err.message : "Falha ao restaurar a base de dados da POC.",
    };
  }
}

async function resetPocFinancialData(prisma: Awaited<ReturnType<typeof getTenantContextForSystemAdministration>>["prisma"]) {
  const pocBank = "001 - Banco Virtual Robonuvem";
  await prisma.$transaction(async (tx) => {
    const accounts = await tx.bankAccount.findMany({ where: { bankName: pocBank }, select: { id: true } });
    const accountIds = accounts.map((account) => account.id);
    const revenues = await tx.revenue.findMany({ where: { sourceType: { in: ["BANK_YIELD", "BANK_CONSTITUTIONAL"] } }, select: { id: true } });
    const revenueIds = revenues.map((revenue) => revenue.id);

    await tx.bankReconciliationMatch.deleteMany();
    await tx.bankReconciliationSession.deleteMany();
    await tx.yieldTransaction.deleteMany();
    await tx.exceptionQueueItem.deleteMany();
    await tx.bankStatementItem.deleteMany({ where: { banco: pocBank } });
    await tx.bankReconciliation.deleteMany({ where: { bankAccountId: { in: accountIds } } });
    await tx.treasuryMovement.deleteMany({
      where: {
        OR: [
          { sourceModule: "POC_BANCO_VIRTUAL" },
          { sourceType: { in: ["BANK_STATEMENT", "BANK_YIELD", "BANK_CONSTITUTIONAL"] } },
          ...(revenueIds.length ? [{ revenueId: { in: revenueIds } }] : []),
        ],
      },
    });
    if (revenueIds.length) await tx.revenue.deleteMany({ where: { id: { in: revenueIds } } });
    await tx.automatedBankDownload.deleteMany({ where: { banco: pocBank } });
    const connection = await tx.integrationConnection.findUnique({ where: { code: "BANCO_API" }, select: { id: true } });
    if (connection) await tx.integrationRun.deleteMany({ where: { connectionId: connection.id } });
  });
}

export async function getPocDataMetricsAction(): Promise<{
  counts?: Record<string, number>;
  error?: string;
}> {
  try {
    const { prisma } = await getTenantContextForSystemAdministration();

    const [
      servidores,
      pessoasFisicas,
      pessoasJuridicas,
      licitacoes,
      contratos,
      patrimonios,
      alunos,
      pacientes,
      familias,
      obras,
      licencas,
      chamados,
      proposicoes,
      ocorrencias,
      faturasSaneamento,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.person.count(),
      prisma.company.count(),
      prisma.purchaseProcess.count(),
      prisma.contract.count(),
      prisma.materialStock.count(),
      prisma.student.count(),
      prisma.patient.count(),
      prisma.socialFamily.count(),
      prisma.obrasObra.count(),
      prisma.envLicense.count(),
      prisma.socialAttendance.count(),
      prisma.camProposicao.count(),
      prisma.segurancaOcorrencia.count(),
      prisma.sanInvoice.count(),
    ]);

    return {
      counts: {
        "Servidores (RH)": servidores,
        "Pessoas Físicas": pessoasFisicas,
        "Pessoas Jurídicas": pessoasJuridicas,
        "Licitações & Compras": licitacoes,
        "Contratos Públicos": contratos,
        "Bens Patrimoniais": patrimonios,
        "Alunos (Educação)": alunos,
        "Pacientes (Saúde)": pacientes,
        "Famílias (Assistência Social)": familias,
        "Obras Públicas": obras,
        "Licenças Ambientais": licencas,
        "Atendimentos Sociais": chamados,
        "Proposições (Câmara)": proposicoes,
        "Ocorrências (Segurança)": ocorrencias,
        "Faturas de Saneamento": faturasSaneamento,
      },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Falha ao carregar métricas da POC." };
  }
}
