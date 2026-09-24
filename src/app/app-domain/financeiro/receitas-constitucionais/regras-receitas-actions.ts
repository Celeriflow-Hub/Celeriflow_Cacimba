"use server";

import { getTenantContextForModule, getTenantContextForModuleOperation, isSystemAdministrator } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { recordConfirmedRevenue, type FinanceActor } from "@/lib/financeiro";
import { isPocVirtualBank, pocVirtualBank } from "@/lib/poc/poc-config";

type ActionResult<T = unknown> = { error?: string; data?: T };
type ConstitutionalRuleForClient = Prisma.ClassificationRuleGetPayload<{
  include: { bankAccount: { select: { id: true; bankName: true; agency: true; accountNumber: true } } };
}>;
type ConstitutionalRuleBankAccount = Prisma.BankAccountGetPayload<{
  select: { id: true; bankName: true; agency: true; accountNumber: true };
}>;
type ConstitutionalRulesData = { rules: ConstitutionalRuleForClient[]; bankAccounts: ConstitutionalRuleBankAccount[] };

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" && error.message) {
    return error.message;
  }
  return fallback;
}

const ruleSchema = z.object({
  textoProcurado: z.string().min(1, "Informe o texto procurado."),
  bankAccountId: z.string().min(1, "Selecione a conta bancária vinculada."),
  tipoReceita: z.string().min(1, "Informe o tipo de receita."),
  naturezaReceita: z.string().min(1, "Informe a natureza da receita."),
  fonteRecurso: z.string().min(1, "Informe a fonte de recurso."),
  eventoContabil: z.string().min(1, "Informe o evento contábil."),
  deducaoAplicavel: z.boolean().default(false),
  prioridade: z.number().int().default(10),
  exigeConfirmacao: z.boolean().default(false),
});

/**
 * Garante o pré-cadastro das receitas e regras de transferência constitucional exigidas pela POC
 */
export async function seedConstitutionalRulesAction(): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    const { prisma } = context;

    const count = await prisma.classificationRule.count({
      where: { tipoMovimento: "RECEITA_CONSTITUCIONAL" },
    });
    const revenueAccount = await prisma.bankAccount.findFirst({
      where: { bankName: pocVirtualBank.name, agency: pocVirtualBank.agency, accountNumber: "20001-1", isActive: true },
      select: { id: true },
    });
    if (!revenueAccount) throw new Error("A conta de receitas 20001-1 deve estar ativa antes de cadastrar as regras constitucionais.");
    const revenueAccountLabel = `${pocVirtualBank.name} / ${pocVirtualBank.agency} / 20001-1`;

    {
      const defaultRules = [
        {
          textoProcurado: "FPM",
          tipoReceita: "FPM",
          naturezaReceita: "1.7.1.8.01.2.1.00.00 - Cota-Parte do FPM",
          fonteRecurso: "15000000 - Recursos Não Vinculados de Impostos",
          eventoContabil: "10.01.01 - Arrecadação de FPM",
          deducaoAplicavel: true,
          prioridade: 1,
          exigeConfirmacao: false,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
          bancoContaFiltro: "Conta Transferências STN",
        },
        {
          textoProcurado: "ICMS",
          tipoReceita: "ICMS",
          naturezaReceita: "1.7.2.8.01.1.1.00.00 - Cota-Parte do ICMS",
          fonteRecurso: "15000000 - Recursos Não Vinculados de Impostos",
          eventoContabil: "10.01.02 - Arrecadação de Cota-Parte ICMS",
          deducaoAplicavel: true,
          prioridade: 2,
          exigeConfirmacao: false,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
          bancoContaFiltro: "Conta Transferências Estado",
        },
        {
          textoProcurado: "FUNDEB",
          tipoReceita: "Fundeb",
          naturezaReceita: "1.7.1.8.06.1.1.00.00 - Transferências do FUNDEB",
          fonteRecurso: "15400000 - Transferências do FUNDEB - Impostos",
          eventoContabil: "10.01.05 - Arrecadação de Receita do FUNDEB",
          deducaoAplicavel: false,
          prioridade: 3,
          exigeConfirmacao: false,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
          bancoContaFiltro: "Conta Específica FUNDEB",
        },
        {
          textoProcurado: "IPVA",
          tipoReceita: "IPVA",
          naturezaReceita: "1.7.2.8.01.2.1.00.00 - Cota-Parte do IPVA",
          fonteRecurso: "15000000 - Recursos Não Vinculados de Impostos",
          eventoContabil: "10.01.03 - Arrecadação de IPVA",
          deducaoAplicavel: true,
          prioridade: 4,
          exigeConfirmacao: false,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
          bancoContaFiltro: "Conta Arrecadação Estadual",
        },
        {
          textoProcurado: "ITR",
          tipoReceita: "ITR",
          naturezaReceita: "1.7.1.8.01.5.1.00.00 - Cota-Parte do ITR",
          fonteRecurso: "15000000 - Recursos Não Vinculados",
          eventoContabil: "10.01.04 - Arrecadação de ITR",
          deducaoAplicavel: true,
          prioridade: 5,
          exigeConfirmacao: false,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
        },
        {
          textoProcurado: "FEP",
          tipoReceita: "FEP",
          naturezaReceita: "1.7.1.8.02.1.1.00.00 - Fundo Especial do Petróleo",
          fonteRecurso: "15300000 - Royalties e Compensações Financeiras",
          eventoContabil: "10.01.06 - Arrecadação FEP",
          deducaoAplicavel: false,
          prioridade: 6,
          exigeConfirmacao: false,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
        },
        {
          textoProcurado: "ICS",
          tipoReceita: "ICS",
          naturezaReceita: "1.7.1.8.03.1.1.00.00 - Transferências da Saúde (ICS)",
          fonteRecurso: "16000000 - Transferências Fundo a Fundo Saúde",
          eventoContabil: "10.01.08 - Arrecadação ICS Saúde",
          deducaoAplicavel: false,
          prioridade: 7,
          exigeConfirmacao: false,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
        },
        {
          textoProcurado: "IPM",
          tipoReceita: "IPM",
          naturezaReceita: "1.7.2.8.01.1.1.00.00 - Índice de Participação dos Municípios",
          fonteRecurso: "15000000 - Recursos Não Vinculados de Impostos",
          eventoContabil: "10.01.09 - Arrecadação IPM",
          deducaoAplicavel: true,
          prioridade: 8,
          exigeConfirmacao: false,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
        },
        {
          textoProcurado: "RPM",
          tipoReceita: "RPM",
          naturezaReceita: "1.3.9.0.00.0.0.00.00 - Receita Patrimonial Municipal",
          fonteRecurso: "15000000 - Recursos Próprios",
          eventoContabil: "10.01.10 - Arrecadação RPM",
          deducaoAplicavel: false,
          prioridade: 9,
          exigeConfirmacao: false,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
        },
        {
          textoProcurado: "ADO25",
          tipoReceita: "ADO25",
          naturezaReceita: "1.7.1.8.01.9.1.00.00 - Compensação Financeira ADO 25 / LC 176",
          fonteRecurso: "15000000 - Recursos Não Vinculados",
          eventoContabil: "10.01.07 - Transferência ADO 25",
          deducaoAplicavel: true,
          prioridade: 10,
          exigeConfirmacao: false,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
        },
        {
          textoProcurado: "ADO LC 176",
          tipoReceita: "ADO — LC nº 176/2020",
          naturezaReceita: "1.7.1.8.01.9.1.00.00 - Compensação Lei Kandir LC 176/2020",
          fonteRecurso: "15000000 - Recursos Não Vinculados",
          eventoContabil: "10.01.07 - Transferência LC 176",
          deducaoAplicavel: true,
          prioridade: 11,
          exigeConfirmacao: false,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
        },
      ];

      for (const rule of defaultRules) {
        const exists = await prisma.classificationRule.findFirst({
          where: { textoProcurado: rule.textoProcurado, tipoMovimento: "RECEITA_CONSTITUCIONAL" },
        });
        const data = { ...rule, bankAccountId: revenueAccount.id, bancoContaFiltro: revenueAccountLabel };
        if (exists) await prisma.classificationRule.update({ where: { id: exists.id }, data });
        else await prisma.classificationRule.create({ data });
      }

      // Inserir itens de teste na Fila de Exceções para demonstração na POC
      const existingExceptions = await prisma.exceptionQueueItem.count();
      if (existingExceptions === 0) {
        await prisma.exceptionQueueItem.createMany({
          data: [
            {
              descricao: "STN TR COMPENSA-MUN LC 176 ADO-2020 V1",
              valorDecimal: new Prisma.Decimal(42500.0),
              dataMovimento: new Date(),
              banco: pocVirtualBank.name,
              contaNumero: "98765-4",
              sinal: "CREDITO",
              scoreConfianca: 0.65,
              sugestaoTipo: "ADO — LC nº 176/2020",
              motivoExcecao: "Descrição contém sufixo variante V1 não coberto por correspondência exata.",
              status: "PENDENTE",
            },
            {
              descricao: "COT PARTE ROYALTIES ANP D-2026/08",
              valorDecimal: new Prisma.Decimal(89400.0),
              dataMovimento: new Date(),
              banco: pocVirtualBank.name,
              contaNumero: "12345-6",
              sinal: "CREDITO",
              scoreConfianca: 0.58,
              sugestaoTipo: "Royalties do Petróleo",
              motivoExcecao: "Sigla 'ANP' necessita confirmação de prioridade e deducao.",
              status: "PENDENTE",
            },
          ],
        });
      }
    }

    const missingRules = [
      {
        textoProcurado: "IPI_EXPORTACAO",
        tipoReceita: "IPI Exportação",
        naturezaReceita: "1.7.2.8.01.3.1.00.00 - Cota-Parte do IPI Exportação",
        fonteRecurso: "15000000 - Recursos Não Vinculados de Impostos",
        eventoContabil: "10.01.11 - Arrecadação de IPI Exportação",
        deducaoAplicavel: true,
        prioridade: 12,
        exigeConfirmacao: false,
      },
      {
        textoProcurado: "ROYALTIES",
        tipoReceita: "Royalties do Petróleo",
        naturezaReceita: "1.7.1.8.02.2.1.00.00 - Royalties do Petróleo",
        fonteRecurso: "15000000 - Recursos Não Vinculados de Impostos",
        eventoContabil: "10.01.12 - Arrecadação de Royalties",
        deducaoAplicavel: false,
        prioridade: 13,
        exigeConfirmacao: false,
      },
    ];
    for (const rule of missingRules) {
      const exists = await prisma.classificationRule.findFirst({ where: { textoProcurado: rule.textoProcurado, tipoMovimento: "RECEITA_CONSTITUCIONAL" } });
      const data = { ...rule, tipoMovimento: "RECEITA_CONSTITUCIONAL", bankAccountId: revenueAccount.id, bancoContaFiltro: revenueAccountLabel };
      if (exists) await prisma.classificationRule.update({ where: { id: exists.id }, data });
      else await prisma.classificationRule.create({ data });
    }
    const natures = [
      ["1.7.1.8.01.2.1", "Cota-Parte do Fundo de Participação dos Municípios - FPM"],
      ["1.7.2.8.01.1.1", "Cota-Parte do ICMS"],
      ["1.7.1.8.06.1.1", "Transferências do FUNDEB"],
      ["1.7.2.8.01.2.1", "Cota-Parte do IPVA"],
      ["1.7.1.8.01.5.1", "Cota-Parte do ITR"],
      ["1.7.1.8.02.1.1", "Fundo Especial do Petróleo"],
      ["1.7.1.8.01.9.1", "Compensação Financeira ADO 25 / LC 176"],
      ["1.7.2.8.01.3.1", "Cota-Parte do IPI Exportação"],
      ["1.7.1.8.02.2.1", "Royalties do Petróleo"],
    ] as const;
    for (const [code, name] of natures) await prisma.revenueNature.upsert({ where: { code }, create: { code, name }, update: { name } });

    revalidatePath("/financeiro/receitas-constitucionais");
    return { data: { count } };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro ao gerar regras pré-cadastradas.") };
  }
}

export async function getConstitutionalRulesAction(): Promise<ActionResult<ConstitutionalRulesData>> {
  try {
    const context = await getTenantContextForModule("FINANCEIRO");
    const rules = await context.prisma.classificationRule.findMany({
      where: { tipoMovimento: "RECEITA_CONSTITUCIONAL" },
      orderBy: { prioridade: "asc" },
      include: { bankAccount: { select: { id: true, bankName: true, agency: true, accountNumber: true } } },
    });
    const bankAccounts = await context.prisma.bankAccount.findMany({
      where: {
        bankName: pocVirtualBank.name,
        isActive: true,
        ...(isSystemAdministrator(context.user) ? {} : { budgetUnitId: { in: context.user.allowedBudgetUnitIds } }),
      },
      orderBy: [{ agency: "asc" }, { accountNumber: "asc" }],
      select: { id: true, bankName: true, agency: true, accountNumber: true },
    });
    return { data: { rules, bankAccounts } };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro ao buscar regras de receita.") };
  }
}

export async function getExceptionQueueAction(): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModule("FINANCEIRO");
    const items = await context.prisma.exceptionQueueItem.findMany({
      where: { status: "PENDENTE", banco: pocVirtualBank.name },
      orderBy: { createdAt: "desc" },
    });
    return { data: items };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro ao buscar fila de exceções.") };
  }
}

export async function createRuleAction(data: z.infer<typeof ruleSchema>): Promise<ActionResult<ConstitutionalRuleForClient>> {
  const parsed = ruleSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const bankAccount = await context.prisma.bankAccount.findFirst({
      where: {
        id: parsed.data.bankAccountId,
        bankName: pocVirtualBank.name,
        isActive: true,
        ...(isSystemAdministrator(context.user) ? {} : { budgetUnitId: { in: context.user.allowedBudgetUnitIds } }),
      },
      select: { bankName: true, agency: true, accountNumber: true },
    });
    if (!bankAccount) return { error: "A conta bancária selecionada não está disponível para esta Unidade Gestora." };
    const newRule = await context.prisma.classificationRule.create({
      data: {
        ...parsed.data,
        bancoContaFiltro: `${bankAccount.bankName} / ${bankAccount.agency} / ${bankAccount.accountNumber}`,
        tipoMovimento: "RECEITA_CONSTITUCIONAL",
      },
      include: { bankAccount: { select: { id: true, bankName: true, agency: true, accountNumber: true } } },
    });

    revalidatePath("/financeiro/receitas-constitucionais");
    return { data: newRule };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro ao criar regra de receita.") };
  }
}

export async function resolveExceptionAction(exceptionId: string, ruleText?: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    const { prisma, user } = context;

    const exceptionItem = await prisma.exceptionQueueItem.findUnique({
      where: { id: exceptionId },
    });

    if (!exceptionItem) return { error: "Item da fila de exceção não encontrado." };

    // Se fornecido texto para nova regra, cria a regra no banco
    let newRuleId: string | undefined = undefined;
    if (ruleText && ruleText.trim() !== "") {
      const bankAccount = await prisma.bankAccount.findFirst({
        where: { bankName: exceptionItem.banco, accountNumber: exceptionItem.contaNumero, isActive: true },
        select: { id: true, bankName: true, agency: true, accountNumber: true },
      });
      if (!bankAccount) return { error: "A exceção não pertence a uma conta bancária ativa e vinculada." };
      const newRule = await prisma.classificationRule.create({
        data: {
          textoProcurado: ruleText.trim(),
          bankAccountId: bankAccount.id,
          bancoContaFiltro: `${bankAccount.bankName} / ${bankAccount.agency} / ${bankAccount.accountNumber}`,
          tipoReceita: exceptionItem.sugestaoTipo || "Receita Municipal",
          naturezaReceita: "1.7.1.8.00.0.0.00.00 - Transferência Legal",
          fonteRecurso: "15000000 - Recursos Não Vinculados",
          eventoContabil: "10.01.00 - Arrecadação",
          deducaoAplicavel: true,
          prioridade: 10,
          tipoMovimento: "RECEITA_CONSTITUCIONAL",
        },
      });
      newRuleId = newRule.id;
    }

    await prisma.exceptionQueueItem.update({
      where: { id: exceptionId },
      data: {
        status: "RESOLVIDO",
        resolvidoPor: user.email || user.id,
        resolvidoEm: new Date(),
        regraGeradaId: newRuleId,
      },
    });

    revalidatePath("/financeiro/receitas-constitucionais");
    return { data: { success: true } };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro ao resolver exceção.") };
  }
}

export async function processConstitutionalRevenueAction(statementItemId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const result = await context.prisma.$transaction(async (tx) => {
      const item = await tx.bankStatementItem.findUnique({ where: { id: statementItemId } });
      if (!item) throw new Error("Lançamento bancário não encontrado.");
      if (!isPocVirtualBank(item.banco)) throw new Error("O lançamento não pertence ao Banco Virtual Robonuvem.");
      if (item.treasuryMovementId) return { treasuryMovementId: item.treasuryMovementId, alreadyProcessed: true };
      if (item.sinal !== "CREDITO") throw new Error("Apenas créditos bancários podem ser tratados como receitas constitucionais.");

      const account = await tx.bankAccount.findFirst({
        where: {
          bankName: item.banco || undefined,
          agency: item.agencia || undefined,
          accountNumber: item.contaNumero || undefined,
          isActive: true,
        },
        select: { id: true, budgetUnitId: true, resourceSourceId: true },
      });
      if (!account?.resourceSourceId) throw new Error("A conta de recebimento deve estar ativa e vinculada a uma fonte de recurso.");
      if (!isSystemAdministrator(context.user) && (!account.budgetUnitId || !context.user.allowedBudgetUnitIds.includes(account.budgetUnitId))) {
        throw new Error("Sem permissão para processar receita desta Unidade Gestora.");
      }

      const rules = await tx.classificationRule.findMany({
        where: { ativo: true, tipoMovimento: "RECEITA_CONSTITUCIONAL", bankAccountId: account.id },
        orderBy: { prioridade: "asc" },
      });
      const description = (item.description || "").toUpperCase();
      const rule = rules.find((candidate) => description.includes(candidate.textoProcurado.toUpperCase()));
      if (!rule?.naturezaReceita || !rule.fonteRecurso) throw new Error("Não há regra constitucional completa para este lançamento.");

      const natureCode = rule.naturezaReceita.match(/^\d[\d.]+/)?.[0]?.replace(/(?:\.00)+$/, "");
      const sourceCode = rule.fonteRecurso.match(/^\d+/)?.[0];
      if (!natureCode || !sourceCode) throw new Error("A regra constitucional possui natureza ou fonte inválida.");
      const [nature, source] = await Promise.all([
        tx.revenueNature.findUnique({ where: { code: natureCode }, select: { id: true } }),
        tx.resourceSource.findUnique({ where: { code: sourceCode }, select: { id: true } }),
      ]);
      if (!nature || !source) throw new Error("Cadastre a natureza e a fonte informadas na regra antes de processar a receita.");
      // A conta registra o crédito bancário; a regra define a fonte legal da receita.

      const actor: FinanceActor = {
        usuarioId: context.user.id,
        employeeId: context.user.employeeId,
        allowedBudgetUnitIds: isSystemAdministrator(context.user) ? undefined : context.user.allowedBudgetUnitIds,
      };
      const idempotencyKey = `BANK:CONSTITUTIONAL:${account.id}:${item.codigoTransacao || item.id}`;
      const revenue = await recordConfirmedRevenue(tx, actor, {
        date: item.date,
        value: item.valueDecimal,
        revenueNatureId: nature.id,
        resourceSourceId: source.id,
        bankAccountId: account.id,
        history: item.description || rule.textoProcurado,
        sourceModule: "FINANCEIRO",
        sourceType: "BANK_CONSTITUTIONAL",
        sourceId: item.id,
        eventType: rule.eventoContabil || "RECEITA_CONSTITUCIONAL",
        idempotencyKey,
        integrationEventId: item.integrationEventId ?? undefined,
        bankTransactionId: item.bankTransactionId ?? item.codigoTransacao ?? undefined,
        bankAccountExternalId: account.id ? (await tx.bankAccount.findUnique({ where: { id: account.id }, select: { externalId: true } }))?.externalId ?? undefined : undefined,
        collectionReference: item.collectionReference ?? undefined,
      });
      if (!revenue.treasuryMovement) throw new Error("A receita constitucional não gerou movimento de tesouraria.");
      await tx.bankStatementItem.update({
        where: { id: item.id },
        data: {
          treasuryMovementId: revenue.treasuryMovement.id,
          status: "Processado",
          categoriaClassificada: "RECEITA_CONSTITUCIONAL",
          reciboMunicipal: `REC-REC-${revenue.id}`,
        },
      });
      await tx.financialAuditLog.create({
        data: {
          action: "RECEITA_CONSTITUCIONAL_PROCESSADA",
          entityType: "Revenue",
          entityId: revenue.id,
          authorUsuarioId: context.user.id,
          budgetUnitId: account.budgetUnitId,
          payload: { statementItemId: item.id, ruleId: rule.id, treasuryMovementId: revenue.treasuryMovement.id, deducaoAplicavel: rule.deducaoAplicavel },
        },
      });
      return { treasuryMovementId: revenue.treasuryMovement.id, revenueId: revenue.id, alreadyProcessed: false };
    });
    revalidatePath("/financeiro/receitas-constitucionais");
    revalidatePath("/financeiro/receitas");
    return { data: result };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Não foi possível processar a receita constitucional.") };
  }
}
