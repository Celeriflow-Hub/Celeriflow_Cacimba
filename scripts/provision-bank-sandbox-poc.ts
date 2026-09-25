import dotenv from "dotenv";
import { Prisma } from "@prisma/client";

dotenv.config();
const localBankEnvironment = dotenv.config({ path: ".env.local", processEnv: {} }).parsed ?? {};
for (const [key, value] of Object.entries(localBankEnvironment)) {
  if (key.startsWith("BANK_SANDBOX_") || key === "SIMULADOR_WEBHOOK_SECRET") {
    process.env[key] = value;
  }
}
import { pocVirtualBank } from "../src/lib/poc/poc-config";
import { constitutionalRevenueRules } from "../src/lib/poc/constitutional-revenue-rules";

const bankName = pocVirtualBank.name;
const agency = pocVirtualBank.agency;

type SandboxAccount = {
  id: string;
  externalId: string;
  accountNumber: string;
  accountType: string;
  balance: string;
  purpose: string;
  sourceCode?: string;
  planCode: string;
};

const sandboxAccounts: SandboxAccount[] = [
  { id: "poc-robonuvem-checking-10001", externalId: "BA-001", accountNumber: "10001-0", accountType: "Movimento", balance: "3037984.77", purpose: "Recursos livres, pagamentos e dívida", sourceCode: "15000000", planCode: "1.1.1.1.1.00.01" },
  { id: "poc-robonuvem-revenue-20001", externalId: "BA-002", accountNumber: "20001-1", accountType: "Arrecadação", balance: "52231.76", purpose: "Tributária e receitas constitucionais", sourceCode: "15000000", planCode: "1.1.1.1.1.00.02" },
  { id: "poc-sji-ba-003", externalId: "BA-003", accountNumber: "10003-3", accountType: "Movimento", balance: "237154.81", purpose: "Folha de pagamento", sourceCode: "15000000", planCode: "1.1.1.1.1.00.03" },
  { id: "poc-sji-ba-004", externalId: "BA-004", accountNumber: "10004-4", accountType: "Movimento", balance: "374980.42", purpose: "FUNDEB 70%", sourceCode: "15400000", planCode: "1.1.1.1.1.00.04" },
  { id: "poc-sji-ba-005", externalId: "BA-005", accountNumber: "10005-5", accountType: "Movimento", balance: "131257.44", purpose: "FUNDEB outros", sourceCode: "15400000", planCode: "1.1.1.1.1.00.05" },
  { id: "poc-sji-ba-006", externalId: "BA-006", accountNumber: "10006-6", accountType: "Movimento", balance: "200000.00", purpose: "Salário-Educação", sourceCode: "15500000", planCode: "1.1.1.1.1.00.06" },
  { id: "poc-sji-ba-007", externalId: "BA-007", accountNumber: "10007-7", accountType: "Movimento", balance: "234760.00", purpose: "PNAE", sourceCode: "15520000", planCode: "1.1.1.1.1.00.07" },
  { id: "poc-sji-ba-008", externalId: "BA-008", accountNumber: "10008-8", accountType: "Movimento", balance: "200000.00", purpose: "PNATE", sourceCode: "15530000", planCode: "1.1.1.1.1.00.08" },
  { id: "poc-sji-ba-009", externalId: "BA-009", accountNumber: "10009-9", accountType: "Movimento", balance: "291320.00", purpose: "Saúde - Atenção Primária", sourceCode: "16000000", planCode: "1.1.1.1.1.00.09" },
  { id: "poc-sji-ba-010", externalId: "BA-010", accountNumber: "10010-0", accountType: "Movimento", balance: "200000.00", purpose: "Saúde - Média/Alta Complexidade", sourceCode: "16000000", planCode: "1.1.1.1.1.00.10" },
  { id: "poc-sji-ba-011", externalId: "BA-011", accountNumber: "10011-1", accountType: "Movimento", balance: "200000.00", purpose: "Saúde - Vigilância", sourceCode: "16000000", planCode: "1.1.1.1.1.00.11" },
  { id: "poc-sji-ba-012", externalId: "BA-012", accountNumber: "10012-2", accountType: "Movimento", balance: "258750.00", purpose: "Assistência Social - FNAS", sourceCode: "16600000", planCode: "1.1.1.1.1.00.12" },
  { id: "poc-sji-ba-013", externalId: "BA-013", accountNumber: "10013-3", accountType: "Movimento", balance: "231900.00", purpose: "Assistência Social - Estadual", sourceCode: "16610000", planCode: "1.1.1.1.1.00.13" },
  { id: "poc-sji-ba-014", externalId: "BA-014", accountNumber: "10014-4", accountType: "Movimento", balance: "262480.33", purpose: "COSIP", sourceCode: "17510000", planCode: "1.1.1.1.1.00.14" },
  { id: "poc-sji-ba-015", externalId: "BA-015", accountNumber: "10015-5", accountType: "Movimento", balance: "541050.00", purpose: "Convênio Obras 01", sourceCode: "REC-CONV-OBR-001", planCode: "1.1.1.1.1.00.15" },
  { id: "poc-sji-ba-016", externalId: "BA-016", accountNumber: "10016-6", accountType: "Movimento", balance: "200000.00", purpose: "Convênio Obras 02", sourceCode: "REC-CONV-OBR-002", planCode: "1.1.1.1.1.00.16" },
  { id: "poc-sji-ba-017", externalId: "BA-017", accountNumber: "10017-7", accountType: "Movimento", balance: "200000.00", purpose: "Convênio Estadual", sourceCode: "REC-CONV-EST-001", planCode: "1.1.1.1.1.00.17" },
  { id: "poc-sji-ba-018", externalId: "BA-018", accountNumber: "10018-8", accountType: "Movimento", balance: "222500.00", purpose: "Cultura", sourceCode: "REC-CUL-001", planCode: "1.1.1.1.1.00.18" },
  { id: "poc-sji-ba-019", externalId: "BA-019", accountNumber: "10019-9", accountType: "Movimento", balance: "218400.00", purpose: "Defesa Civil", sourceCode: "REC-DEF-001", planCode: "1.1.1.1.1.00.19" },
  { id: "poc-sji-ba-020", externalId: "BA-020", accountNumber: "10020-0", accountType: "Movimento", balance: "283174.22", purpose: "Retenções e consignações", planCode: "2.1.8.8.1.00.20" },
  { id: "poc-robonuvem-investment-90001", externalId: "BA-021", accountNumber: "90001-4", accountType: "Aplicação", balance: "1028071.37", purpose: "Aplicações de recursos livres", sourceCode: "15000000", planCode: "1.1.1.2.1.00.01" },
  { id: "poc-sji-ba-022", externalId: "BA-022", accountNumber: "90002-5", accountType: "Aplicação", balance: "375000.00", purpose: "Aplicação FUNDEB", sourceCode: "15400000", planCode: "1.1.1.2.1.00.02" },
  { id: "poc-sji-ba-023", externalId: "BA-023", accountNumber: "90003-6", accountType: "Aplicação", balance: "342000.00", purpose: "Aplicação Saúde", sourceCode: "16000000", planCode: "1.1.1.2.1.00.03" },
  { id: "poc-sji-ba-024", externalId: "BA-024", accountNumber: "90004-7", accountType: "Aplicação", balance: "430000.00", purpose: "Aplicação Convênios", planCode: "1.1.1.2.1.00.04" },
];

async function main() {
  const [{ prisma }, { bankIntegrationClient }] = await Promise.all([
    import("../src/lib/prisma"),
    import("../src/lib/financeiro/bank-integration-client"),
  ]);
  const ensureFinancialYear = async (year: number) => prisma.financialYear.upsert({
    where: { year },
    create: {
      year,
      status: "Aberto",
      startDate: new Date(`${year}-01-01T00:00:00.000Z`),
      endDate: new Date(`${year}-12-31T23:59:59.999Z`),
    },
    update: { status: "Aberto" },
  });
  if (process.env.SKIP_BANK_SANDBOX_HEALTH_CHECK !== "true") {
    await bankIntegrationClient.checkSandboxHealth();
    const integrationCheck = await bankIntegrationClient.fetchBankStatement(
      { banco: bankName, agencia: agency, contaNumero: "20001-1" },
      { periodoInicio: "2025-08-01", periodoFim: "2025-08-31" },
    );
    if (integrationCheck.items.length === 0) {
      throw new Error("O Banco Virtual Robonuvem não retornou movimentações para a validação da POC.");
    }
  }

  const [budgetUnit, year2025] = await Promise.all([
    prisma.budgetUnit.findFirst({ where: { code: "0101" }, select: { id: true } }),
    ensureFinancialYear(2025),
    ensureFinancialYear(2026),
  ]);
  if (!budgetUnit) throw new Error("A UG 0101 é obrigatória para provisionar as contas da POC.");
  await prisma.budgetUnit.update({ where: { id: budgetUnit.id }, data: { name: "Prefeitura Municipal de São João do Ivaí" } });
  await prisma.budgetUnit.updateMany({ where: { code: "0201" }, data: { name: "Câmara Municipal de São João do Ivaí" } });
  const sourceCodes = [...new Set([
    ...sandboxAccounts.flatMap((account) => account.sourceCode ? [account.sourceCode] : []),
    ...constitutionalRevenueRules.map((rule) => rule.fonteRecurso.match(/^\d+/)?.[0]).filter((code): code is string => Boolean(code)),
  ])];
  for (const code of sourceCodes) {
    await prisma.resourceSource.upsert({ where: { code }, create: { code, name: `Fonte POC ${code}` }, update: {} });
  }
  const sources = await prisma.resourceSource.findMany({ where: { code: { in: sourceCodes } }, select: { id: true, code: true } });
  const sourceIdByCode = new Map(sources.map((source) => [source.code, source.id]));

  const [checkingAccountingPlan, revenueAccountingPlan, investmentAccountingPlan, openingEquityPlan] = await Promise.all([
    prisma.accountingPlan.upsert({ where: { code: "1.1.1.1.1.00.01" }, create: { code: "1.1.1.1.1.00.01", name: "Banco Virtual Robonuvem - Conta Movimento 10001-0", type: "Analítica" }, update: {} }),
    prisma.accountingPlan.upsert({ where: { code: "1.1.1.1.1.00.02" }, create: { code: "1.1.1.1.1.00.02", name: "Banco Virtual Robonuvem - Conta Receitas 20001-1", type: "Analítica" }, update: {} }),
    prisma.accountingPlan.upsert({ where: { code: "1.1.1.2.1.00.01" }, create: { code: "1.1.1.2.1.00.01", name: "Banco Virtual Robonuvem - Aplicações 90001-4", type: "Analítica" }, update: {} }),
    prisma.accountingPlan.upsert({ where: { code: "2.3.7.1.1.00.00" }, create: { code: "2.3.7.1.1.00.00", name: "Patrimônio Social e Capital Social", type: "Analítica" }, update: {} }),
  ]);
  for (const definition of sandboxAccounts) {
    await prisma.accountingPlan.upsert({ where: { code: definition.planCode }, create: { code: definition.planCode, name: `Banco Virtual Robonuvem - ${definition.externalId} ${definition.purpose}`, type: "Analítica" }, update: {} });
  }
  const plans = await prisma.accountingPlan.findMany({ where: { code: { in: sandboxAccounts.map((account) => account.planCode) } }, select: { id: true, code: true } });
  const accountingPlanIdByCode = new Map(plans.map((plan) => [plan.code, plan.id]));
  const accounts = new Map<string, { id: string }>();
  // Historical sandbox accounts remain preserved for referential integrity, but are not usable or displayed in this POC.
  await prisma.bankAccount.updateMany({
    where: { bankName: { not: bankName } },
    data: { isActive: false },
  });
  for (const definition of sandboxAccounts) {
    const data = {
      bankName,
      agency,
      accountNumber: definition.accountNumber,
      accountType: definition.accountType,
      currentBalance: Number(definition.balance),
      currentBalanceDecimal: new Prisma.Decimal(definition.balance),
       budgetUnitId: budgetUnit.id,
       resourceSourceId: definition.sourceCode ? sourceIdByCode.get(definition.sourceCode) : null,
       accountingPlanId: accountingPlanIdByCode.get(definition.planCode),
       externalId: definition.externalId,
       purpose: definition.purpose,
      isActive: true,
    };
    const account = await prisma.bankAccount.upsert({
      where: { id: definition.id },
      create: { id: definition.id, ...data },
      update: data,
      select: { id: true },
    });
    accounts.set(definition.accountNumber, account);
  }
  const revenueBankAccountId = accounts.get("20001-1")?.id;
  if (!revenueBankAccountId) throw new Error("A conta de receitas 20001-1 é obrigatória para as regras constitucionais.");
  const revenueBankAccountLabel = `${bankName} / ${agency} / 20001-1`;
  for (const rule of constitutionalRevenueRules) {
    const natureCode = rule.naturezaReceita.match(/^\d[\d.]+/)?.[0]?.replace(/(?:\.00)+$/, "");
    if (natureCode) {
      await prisma.revenueNature.upsert({
        where: { code: natureCode },
        create: { code: natureCode, name: rule.naturezaReceita.replace(/^\d[\d.]+\s*-\s*/, "") },
        update: {},
      });
    }
    const existingRule = await prisma.classificationRule.findFirst({
      where: { textoProcurado: rule.textoProcurado, tipoMovimento: "RECEITA_CONSTITUCIONAL" },
      select: { id: true },
    });
    const data = { ...rule, tipoMovimento: "RECEITA_CONSTITUCIONAL", bankAccountId: revenueBankAccountId, bancoContaFiltro: revenueBankAccountLabel };
    if (existingRule) await prisma.classificationRule.update({ where: { id: existingRule.id }, data });
    else await prisma.classificationRule.create({ data });
  }
  const investmentLinks: Record<string, string> = {
    "10001-0": "90001-4",
    "10004-4": "90002-5",
    "10005-5": "90002-5",
    "10009-9": "90003-6",
    "10010-0": "90003-6",
    "10011-1": "90003-6",
    "10015-5": "90004-7",
    "10016-6": "90004-7",
    "10017-7": "90004-7",
  };
  for (const [currentAccount, investmentAccount] of Object.entries(investmentLinks)) {
    await prisma.bankAccount.update({
      where: { id: accounts.get(currentAccount)?.id },
      data: { linkedInvestmentAccountId: accounts.get(investmentAccount)?.id },
    });
  }

  const investmentEvents = [
    ["APLICACAO_FINANCEIRA", "Aplicação financeira", investmentAccountingPlan.id, checkingAccountingPlan.id],
    ["RESGATE_APLICACAO_FINANCEIRA", "Resgate de aplicação financeira", checkingAccountingPlan.id, investmentAccountingPlan.id],
    ["RECEITA_ARRECADADA", "Receita arrecadada", revenueAccountingPlan.id, openingEquityPlan.id],
  ] as const;
  for (const [code, name, debitAccountId, creditAccountId] of investmentEvents) {
    const event = await prisma.accountingEventCatalog.upsert({
      where: { code },
      create: { code, name, description: "REFERENCIA POC - substituir por matriz PCASP homologada" },
      update: { name, description: "REFERENCIA POC - substituir por matriz PCASP homologada", isActive: true },
    });
    await prisma.accountingPostingRule.updateMany({
      where: { eventId: event.id, isReference: true, NOT: { debitAccountId, creditAccountId } },
      data: { isActive: false },
    });
    await prisma.accountingPostingRule.upsert({
      where: { eventId_debitAccountId_creditAccountId: { eventId: event.id, debitAccountId, creditAccountId } },
      create: { eventId: event.id, debitAccountId, creditAccountId, description: "REFERENCIA POC - não utilizar em produção", isReference: true },
      update: { isActive: true, isReference: true, description: "REFERENCIA POC - não utilizar em produção" },
    });
  }

  await prisma.integrationConnection.upsert({
    where: { code: "BANCO_API" },
    create: {
      code: "BANCO_API",
      name: "Banco Virtual Robonuvem",
      category: "BANCARIA",
      provider: "Robonuvem - ambiente externo de testes",
      environment: "SANDBOX",
      status: "ATIVA",
      baseUrl: pocVirtualBank.baseUrl,
      credentialReference: "env:BANK_SANDBOX_CLIENT_SECRET",
      configuration: { clientIdEnvironment: "BANK_SANDBOX_CLIENT_ID", statementFormat: "ofx" },
    },
    update: {
      name: "Banco Virtual Robonuvem",
      category: "BANCARIA",
      provider: "Robonuvem - ambiente externo de testes",
      environment: "SANDBOX",
      status: "ATIVA",
      baseUrl: pocVirtualBank.baseUrl,
      credentialReference: "env:BANK_SANDBOX_CLIENT_SECRET",
      configuration: { clientIdEnvironment: "BANK_SANDBOX_CLIENT_ID", statementFormat: "ofx" },
    },
  });

  // Transactions from the virtual bank must be created by their own processing flows.
  // The three demonstration accounts start with an auditable balance so applications, redemptions, and reconciliation can run.
  const movements = [
    { key: "poc-robonuvem-opening-10001-2025", account: "10001-0", year: year2025, date: "2025-07-31", type: "SaldoInicial", direction: "Entrada", value: "3037984.77", history: "Saldo inicial da tesouraria POC - Conta 10001-0" },
    { key: "poc-robonuvem-opening-20001-2025", account: "20001-1", year: year2025, date: "2025-07-31", type: "SaldoInicial", direction: "Entrada", value: "150000.00", history: "Saldo inicial da conciliação POC - agosto de 2025" },
    { key: "poc-robonuvem-opening-90001-2025", account: "90001-4", year: year2025, date: "2025-07-31", type: "SaldoInicial", direction: "Entrada", value: "1028071.37", history: "Saldo inicial da tesouraria POC - Conta 90001-4" },
  ];
  await prisma.treasuryMovement.deleteMany({
    where: {
      idempotencyKey: {
        in: [
          "poc-robonuvem-fpm-2025",
          "poc-robonuvem-fundeb-2025",
          "poc-robonuvem-ipva-2025",
          "poc-robonuvem-icms-2025",
          "poc-robonuvem-yield-2025",
          "poc-robonuvem-investment-2026",
          "poc-robonuvem-redemption-2026",
          "poc-robonuvem-fee-2026",
        ],
      },
      statementItems: { none: {} },
    },
  });

  for (const movement of movements) {
    const bankAccountId = accounts.get(movement.account)?.id;
    if (!bankAccountId) throw new Error(`Conta ${movement.account} não foi provisionada.`);
    await prisma.treasuryMovement.upsert({
      where: { idempotencyKey: movement.key },
      create: {
        date: new Date(`${movement.date}T12:00:00.000Z`),
        type: movement.type,
        direction: movement.direction,
        valueDecimal: new Prisma.Decimal(movement.value),
        history: movement.history,
        bankAccountId,
        financialYearId: movement.year.id,
        sourceModule: "POC_BANCO_VIRTUAL",
        sourceType: "SANDBOX_BANK",
        sourceId: movement.key,
        eventType: "BANK_SANDBOX_SEED",
        idempotencyKey: movement.key,
      },
      update: {
        date: new Date(`${movement.date}T12:00:00.000Z`),
        type: movement.type,
        direction: movement.direction,
        valueDecimal: new Prisma.Decimal(movement.value),
        history: movement.history,
        bankAccountId,
        financialYearId: movement.year.id,
      },
    });
  }

  const openingAuthor = await prisma.usuario.findFirst({ where: { ativo: true, employeeId: { not: null } }, select: { id: true, employeeId: true } });
  if (!openingAuthor?.employeeId) throw new Error("A POC exige um usuário ativo vinculado a servidor para registrar os saldos iniciais contábeis.");
  for (const movement of movements) {
    const definition = sandboxAccounts.find((account) => account.accountNumber === movement.account);
    const bankAccountId = accounts.get(movement.account)?.id;
    const accountingPlanId = definition && accountingPlanIdByCode.get(definition.planCode);
    if (!bankAccountId || !accountingPlanId) throw new Error(`A conta ${movement.account} não possui plano contábil para o saldo inicial.`);
    await prisma.accountingTransaction.upsert({
      where: { idempotencyKey: `${movement.key}:ACCOUNTING` },
      create: {
        financialYearId: movement.year.id,
        date: new Date(`${movement.date}T12:00:00.000Z`),
        history: `Saldo inicial do razão bancário POC - Conta ${movement.account}`,
        status: "POSTADO",
        sourceModule: "POC_BANCO_VIRTUAL",
        sourceType: "OPENING_BALANCE",
        sourceId: bankAccountId,
        eventType: "OPENING_BALANCE",
        idempotencyKey: `${movement.key}:ACCOUNTING`,
        authorUsuarioId: openingAuthor.id,
        authorEmployeeId: openingAuthor.employeeId,
        postedAt: new Date(),
        entries: {
          create: [
            { date: new Date(`${movement.date}T12:00:00.000Z`), value: Number(movement.value), valueDecimal: new Prisma.Decimal(movement.value), type: "Débito", history: `Saldo inicial do razão bancário POC - Conta ${movement.account}`, accountId: accountingPlanId, authorId: openingAuthor.employeeId },
            { date: new Date(`${movement.date}T12:00:00.000Z`), value: Number(movement.value), valueDecimal: new Prisma.Decimal(movement.value), type: "Crédito", history: `Contrapartida do saldo inicial do razão bancário POC - Conta ${movement.account}`, accountId: openingEquityPlan.id, authorId: openingAuthor.employeeId },
          ],
        },
      },
      update: {},
    });
  }

  const activeForeignAccounts = await prisma.bankAccount.count({
    where: { isActive: true, bankName: { not: bankName } },
  });
  if (activeForeignAccounts > 0) {
    throw new Error(`${activeForeignAccounts} conta(s) de outro banco ainda estão ativas na POC.`);
  }

  console.log("Banco Virtual Robonuvem provisionado: 24 contas BA, vínculos de aplicação e conexão BANCO_API em SANDBOX.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
