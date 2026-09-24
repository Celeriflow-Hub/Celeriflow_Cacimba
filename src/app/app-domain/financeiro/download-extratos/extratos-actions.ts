"use server";

import { getTenantContextForModule, getTenantContextForModuleOperation, isSystemAdministrator, type AppContext } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

import { executeConfiguredStatementDownload } from "@/lib/integrations/runtime";
import { archiveBankStatement } from "@/lib/platform/blob";
import { saveFinancialFileToGed } from "@/lib/financeiro/ged";
import { pocVirtualBank } from "@/lib/poc/poc-config";

type ActionResult<T = unknown> = { error?: string; data?: T };

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" && error.message) {
    return error.message;
  }
  return fallback;
}

type DownloadRecordForClient = {
  id: string;
  banco: string;
  agencia: string;
  contaNumero: string;
  tipoConta: string;
  periodoInicio: string;
  periodoFim: string;
  nomeArquivo: string;
  caminhoDestino: string;
  formato: string;
  hashSHA256: string;
  tamanhoBytes: number;
  status: string;
  logsExecucao: string;
  auditLogId: string | null;
  createdAt: string;
};

function serializeDownloadRecord(record: {
  id: string;
  banco: string;
  agencia: string;
  contaNumero: string;
  tipoConta: string;
  periodoInicio: Date;
  periodoFim: Date;
  nomeArquivo: string;
  caminhoDestino: string;
  formato: string;
  hashSHA256: string;
  tamanhoBytes: number;
  status: string;
  logsExecucao: string;
  auditLogId: string | null;
  createdAt: Date;
}): DownloadRecordForClient {
  return {
    ...record,
    periodoInicio: record.periodoInicio.toISOString(),
    periodoFim: record.periodoFim.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

const downloadSchema = z.object({
  banco: z.literal(pocVirtualBank.name, "A POC aceita somente o Banco Virtual Robonuvem."),
  agencia: z.string().min(1, "Informe a agência."),
  contaNumero: z.string().min(1, "Informe o número da conta."),
  periodoInicio: z.string().min(1, "Selecione a data inicial."),
  periodoFim: z.string().min(1, "Selecione a data final."),
});

export async function runAutomatedBankDownloadAction(input: {
  banco: string;
  agencia: string;
  contaNumero: string;
  periodoInicio: string;
  periodoFim: string;
}): Promise<ActionResult<DownloadRecordForClient>> {
  const parsed = downloadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let context: AppContext | undefined;
  try {
    context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const { prisma, user } = context;

    const timestamp = Date.now();

    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        bankName: parsed.data.banco,
        agency: parsed.data.agencia,
        accountNumber: parsed.data.contaNumero,
        isActive: true,
      },
      select: { id: true, budgetUnitId: true },
    });
    if (!bankAccount) throw new Error("A conta bancária informada não está cadastrada ou ativa na tesouraria.");
    if (!isSystemAdministrator(user) && (!bankAccount.budgetUnitId || !user.allowedBudgetUnitIds.includes(bankAccount.budgetUnitId))) {
      throw new Error("Sem permissão para automatizar extratos desta Unidade Gestora.");
    }
    const bankExecution = await executeConfiguredStatementDownload(
      prisma,
      { banco: parsed.data.banco, agencia: parsed.data.agencia, contaNumero: parsed.data.contaNumero },
      { periodoInicio: parsed.data.periodoInicio, periodoFim: parsed.data.periodoFim },
    );
    const bankData = bankExecution.data;

    const existingDownload = await prisma.automatedBankDownload.findFirst({
      where: {
        banco: parsed.data.banco,
        agencia: parsed.data.agencia,
        contaNumero: parsed.data.contaNumero,
        hashSHA256: bankData.hashSHA256,
      },
    });
    if (existingDownload) return { data: serializeDownloadRecord(existingDownload) };

    const extension = bankStatementFormatExtension(bankData.formato);
    const fileNameCC = `EXTRATO_CC_${parsed.data.contaNumero}_${timestamp}.${extension}`;

    const archivedFile = await archiveBankStatement(
      fileNameCC,
      bankData.rawContent,
      bankStatementContentType(bankData.formato),
    );
    const gedDocument = await saveFinancialFileToGed(prisma, {
      title: `Extrato bancário ${parsed.data.banco} ${parsed.data.agencia}/${parsed.data.contaNumero}`,
      documentType: "FINANCEIRO:EXTRATO_BANCARIO",
      filename: fileNameCC,
      content: bankData.rawContent,
      contentType: bankStatementContentType(bankData.formato),
      fileUrl: archivedFile.url,
      actorUsuarioId: user.id,
    });

    const logsExecucao = [
      `[${new Date().toLocaleTimeString()}] Conectando ao WebService / Simulador Bancário (${parsed.data.banco})...`,
      `[${new Date().toLocaleTimeString()}] Autenticação autorizada com o Simulador / API Bancária...`,
      `[${new Date().toLocaleTimeString()}] Extrato de Conta Corrente e Aplicação recebido (${(bankData.tamanhoBytes / 1024).toFixed(2)} KB).`,
      `[${new Date().toLocaleTimeString()}] ${bankData.items.length} movimentações sincronizadas do ambiente simulador.`,
      `[${new Date().toLocaleTimeString()}] Integridade SHA-256 calculada: ${bankData.hashSHA256}`,
      `[${new Date().toLocaleTimeString()}] Arquivo original arquivado no repositório privado da instância.`,
      `[${new Date().toLocaleTimeString()}] Gravando registro inalterável de auditoria no CeleriFlow...`,
      `[${new Date().toLocaleTimeString()}] Automação de extratos concluída com sucesso.`,
    ].join("\n");

    const statementItems = bankData.items.map((item, index) => ({
      ...item,
      codigoTransacao: item.codigoTransacao || crypto.createHash("sha256")
        .update(`${bankData.hashSHA256}:${index}:${item.date.toISOString()}:${item.value}:${item.description}`)
        .digest("hex"),
    }));
    const result = await prisma.$transaction(async (tx) => {
      const downloadRecord = await tx.automatedBankDownload.create({
        data: {
          banco: parsed.data.banco,
          agencia: parsed.data.agencia,
          contaNumero: parsed.data.contaNumero,
          tipoConta: "CORRENTE_E_APLICACAO",
          periodoInicio: new Date(parsed.data.periodoInicio),
          periodoFim: new Date(parsed.data.periodoFim),
          nomeArquivo: fileNameCC,
          caminhoDestino: archivedFile.url,
          formato: bankData.formato,
          hashSHA256: bankData.hashSHA256,
          tamanhoBytes: bankData.tamanhoBytes,
          status: "CONCLUIDO",
          logsExecucao,
        },
      });
      const audit = await tx.financialAuditLog.create({
        data: {
          action: "DOWNLOAD_AUTOMATICO_EXTRATO",
          entityType: "AutomatedBankDownload",
          entityId: downloadRecord.id,
          authorUsuarioId: user.id,
          payload: { banco: parsed.data.banco, agencia: parsed.data.agencia, contaNumero: parsed.data.contaNumero, hashSHA256: bankData.hashSHA256, gedDocumentId: gedDocument.documentId },
        },
      });
      await tx.automatedBankDownload.update({ where: { id: downloadRecord.id }, data: { auditLogId: audit.id } });
      const inserted = await tx.bankStatementItem.createMany({
        data: statementItems.map((item) => ({
          downloadId: downloadRecord.id,
          bankAccountId: bankAccount.id,
          banco: parsed.data.banco,
          agencia: parsed.data.agencia,
          contaNumero: parsed.data.contaNumero,
          tipoConta: item.tipoConta,
          date: item.date,
          description: item.description,
          reference: item.reference || null,
          codigoTransacao: item.codigoTransacao,
          sinal: item.sinal,
          direction: item.sinal === "CREDITO" ? "CREDIT" : "DEBIT",
          valueDecimal: new Prisma.Decimal(item.value),
          status: "Pendente",
          reciboMunicipal: item.documento || null,
          bankTransactionId: item.bankTransactionId || null,
          integrationEventId: item.integrationEventId || null,
          transactionType: item.transactionType || null,
          clientReference: item.clientReference || null,
          collectionReference: item.collectionReference || null,
          reversalOfBankTransactionId: item.reversalOfBankTransactionId || null,
        })),
        skipDuplicates: true,
      });
      const constitutionalRules = await tx.classificationRule.findMany({
        where: { ativo: true, tipoMovimento: "RECEITA_CONSTITUCIONAL", bankAccountId: bankAccount.id },
        select: { textoProcurado: true, tipoReceita: true },
      });
      if (constitutionalRules.length > 0) {
        const downloadedItems = await tx.bankStatementItem.findMany({
          where: { downloadId: downloadRecord.id, sinal: "CREDITO" },
          select: { id: true, description: true, valueDecimal: true, date: true, banco: true, contaNumero: true, sinal: true },
        });
        const exceptionRows = downloadedItems.flatMap((item) => {
          const rule = constitutionalRules.find((candidate) => item.description?.toUpperCase().includes(candidate.textoProcurado.toUpperCase()));
          return rule ? [{
            statementItemId: item.id,
            descricao: item.description || rule.textoProcurado,
            valorDecimal: item.valueDecimal,
            dataMovimento: item.date,
            banco: item.banco || parsed.data.banco,
            contaNumero: item.contaNumero || parsed.data.contaNumero,
            sinal: item.sinal || "CREDITO",
            scoreConfianca: 0.98,
            sugestaoTipo: rule.tipoReceita || rule.textoProcurado,
            motivoExcecao: "Receita constitucional identificada e aguardando confirmação do operador financeiro.",
          }] : [];
        });
        if (exceptionRows.length > 0) await tx.exceptionQueueItem.createMany({ data: exceptionRows });
      }
      return { downloadRecord, insertedCount: inserted.count };
    });

    revalidatePath("/financeiro/download-extratos");
    revalidatePath("/financeiro/automacoes");
    revalidatePath("/documentos/ged");
    revalidatePath("/documentos");
    return { data: serializeDownloadRecord(result.downloadRecord) };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Falha na execução da automação bancária.") };
  }
}

function bankStatementFormatExtension(format: "OFX" | "JSON" | "CNAB") {
  return format.toLowerCase();
}

function bankStatementContentType(format: "OFX" | "JSON" | "CNAB") {
  if (format === "JSON") return "application/json; charset=utf-8";
  return "text/plain; charset=utf-8";
}

export async function getDownloadHistoryAction(): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModule("FINANCEIRO");
    const accountScope = isSystemAdministrator(context.user)
      ? undefined
      : await context.prisma.bankAccount.findMany({
          where: { budgetUnitId: { in: context.user.allowedBudgetUnitIds } },
          select: { bankName: true, agency: true, accountNumber: true },
        });
    if (accountScope && accountScope.length === 0) return { data: [] };
    const history = await context.prisma.automatedBankDownload.findMany({
      where: accountScope ? { OR: accountScope.map((account) => ({ banco: account.bankName, agencia: account.agency, contaNumero: account.accountNumber })) } : undefined,
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return { data: history };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro ao carregar histórico de downloads.") };
  }
}
