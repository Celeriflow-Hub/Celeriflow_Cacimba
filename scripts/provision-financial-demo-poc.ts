import "dotenv/config";
import crypto from "node:crypto";
import { prisma } from "../src/lib/prisma";
import {
  authorizeAccountingMonthClose,
  finalizeAnnualAccountingClose,
  postAccountingTransaction,
  prepareAnnualAccountingClose,
  requestAccountingMonthClose,
  type FinanceActor,
} from "../src/lib/financeiro";
import { pocFixture } from "../src/lib/poc/fixture-catalog";

const demoProfileId = "perfil-poc-financeiro-demonstracao";
const year2025 = 2025;

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `$pbkdf2-sha512$100000$${salt}$${derivedKey}`;
}

async function ensureDemoActor(input: { cpf: string; email: string; name: string }): Promise<FinanceActor> {
  const employee = await prisma.employee.upsert({
    where: { cpf: input.cpf },
    create: { name: input.name, cpf: input.cpf, registration: `POC-${input.cpf.slice(-2)}`, isActive: true },
    update: { name: input.name, isActive: true },
  });
  const user = await prisma.usuario.upsert({
    where: { email: input.email },
    create: { nome: input.name, email: input.email, senha: hashPassword(crypto.randomUUID()), ativo: true, perfilId: demoProfileId, employeeId: employee.id },
    update: { nome: input.name, ativo: true, perfilId: demoProfileId, employeeId: employee.id },
  });
  return { usuarioId: user.id, employeeId: employee.id };
}

async function ensureAccountingDemoAccounts() {
  const [cash, equity] = await Promise.all([
    prisma.accountingPlan.upsert({
      where: { code: "1.1.1.1.1.00.00" },
      create: { code: "1.1.1.1.1.00.00", name: "Caixa e Equivalentes de Caixa em Moeda Nacional", type: "Analítica" },
      update: {},
    }),
    prisma.accountingPlan.upsert({
      where: { code: "2.3.7.1.1.00.00" },
      create: { code: "2.3.7.1.1.00.00", name: "Patrimônio Social e Capital Social", type: "Analítica" },
      update: {},
    }),
  ]);
  return { cash, equity };
}

async function post2025DemonstrationEntries(financialYearId: string, actor: FinanceActor, accounts: Awaited<ReturnType<typeof ensureAccountingDemoAccounts>>) {
  for (let month = 0; month < 12; month += 1) {
    const value = 10_000 + month * 750;
    const date = new Date(Date.UTC(year2025, month, 15, 12));
    await postAccountingTransaction(prisma, actor, {
      financialYearId,
      date,
      history: `Arrecadação demonstrativa POC - competência ${String(month + 1).padStart(2, "0")}/${year2025}`,
      lines: [
        { accountId: accounts.cash.id, type: "Débito", value },
        { accountId: accounts.equity.id, type: "Crédito", value },
      ],
      sourceModule: "POC_DEMONSTRACAO",
      sourceType: "HISTORICO_CONTABIL",
      sourceId: `DEMO:${year2025}:${month + 1}`,
      eventType: "DEMONSTRACAO_POC",
      idempotencyKey: `DEMO:${year2025}:ACCOUNTING:${month + 1}`,
    });
  }
}

async function close2025Demonstration(financialYearId: string, requester: FinanceActor, authorizer: FinanceActor) {
  for (let month = 0; month < 12; month += 1) {
    const competence = new Date(Date.UTC(year2025, month, 1));
    const close = await prisma.monthlyAccountingClose.findUnique({
      where: { financialYearId_competence: { financialYearId, competence } },
      select: { status: true },
    });
    if (!close || close.status === "ABERTO") {
      await requestAccountingMonthClose(prisma, requester, financialYearId, competence);
    }
    const current = await prisma.monthlyAccountingClose.findUniqueOrThrow({
      where: { financialYearId_competence: { financialYearId, competence } },
      select: { status: true },
    });
    if (current.status === "PENDENTE_FECHAMENTO") {
      await authorizeAccountingMonthClose(prisma, authorizer, financialYearId, competence);
    }
    if (current.status !== "FECHADO" && current.status !== "PENDENTE_FECHAMENTO") {
      throw new Error(`A competência ${month + 1}/${year2025} não está disponível para o fechamento demonstrativo.`);
    }
  }

  const annual = await prisma.annualAccountingClose.findUnique({
    where: { financialYearId },
    select: { status: true, preparedByUsuarioId: true },
  });
  if (!annual) await prepareAnnualAccountingClose(prisma, requester, financialYearId);
  else if (annual.status !== "ENCERRADO" && annual.status !== "PRONTO_PARA_VALIDACAO") {
    await prepareAnnualAccountingClose(prisma, requester, financialYearId);
  }
  const pendingAnnual = await prisma.annualAccountingClose.findUniqueOrThrow({
    where: { financialYearId },
    select: { status: true, preparedByUsuarioId: true },
  });
  if (pendingAnnual.status === "PRONTO_PARA_VALIDACAO") {
    if (pendingAnnual.preparedByUsuarioId !== requester.usuarioId) {
      throw new Error("O encerramento anual pendente foi preparado por outro usuário e requer autorização manual.");
    }
    await finalizeAnnualAccountingClose(prisma, authorizer, financialYearId);
  }
}

async function seedClosed2025History(financialYearId: string, requester: FinanceActor, authorizer: FinanceActor) {
  const pendingSummary = {
    demonstration: true,
    note: "Histórico simulado exclusivamente para demonstração da POC; não representa encerramento contábil oficial.",
  };
  for (let month = 0; month < 12; month += 1) {
    const competence = new Date(Date.UTC(year2025, month, 1));
    const closedAt = new Date(Date.UTC(2026, month, 10, 12));
    const existing = await prisma.monthlyAccountingClose.findUnique({
      where: { financialYearId_competence: { financialYearId, competence } },
      include: { events: { select: { id: true } } },
    });
    if (existing && !["ABERTO", "FECHADO"].includes(existing.status)) {
      throw new Error(`A competência ${month + 1}/${year2025} possui um fluxo real pendente e não pode ser substituída pela simulação.`);
    }
    const close = await prisma.monthlyAccountingClose.upsert({
      where: { financialYearId_competence: { financialYearId, competence } },
      create: {
        financialYearId,
        competence,
        status: "FECHADO",
        pendingSummary,
        closedByUsuarioId: authorizer.usuarioId,
        closedByEmployeeId: authorizer.employeeId,
        closedAt,
      },
      update: existing?.status === "ABERTO"
        ? { status: "FECHADO", pendingSummary, closedByUsuarioId: authorizer.usuarioId, closedByEmployeeId: authorizer.employeeId, closedAt }
        : {},
    });
    if (!existing?.events.length) {
      await prisma.monthlyAccountingCloseEvent.createMany({
        data: [
          { monthlyAccountingCloseId: close.id, action: "CLOSE_REQUESTED", pendingSummary, requestedByUsuarioId: requester.usuarioId, requestedAt: closedAt, createdAt: closedAt },
          { monthlyAccountingCloseId: close.id, action: "CLOSE_AUTHORIZED", pendingSummary, closureEvidence: { demonstration: true, closedByUsuarioId: authorizer.usuarioId, closedAt: closedAt.toISOString() }, requestedByUsuarioId: requester.usuarioId, authorizedByUsuarioId: authorizer.usuarioId, requestedAt: closedAt, authorizedAt: closedAt, createdAt: closedAt },
        ],
      });
    }
  }
  const annual = await prisma.annualAccountingClose.findUnique({ where: { financialYearId }, select: { status: true } });
  if (annual && annual.status !== "ENCERRADO") {
    throw new Error("O encerramento anual de 2025 já possui um fluxo real pendente e não pode ser substituído pela simulação.");
  }
  const closedAt = new Date("2026-01-15T12:00:00.000Z");
  await prisma.annualAccountingClose.upsert({
    where: { financialYearId },
    create: {
      financialYearId,
      status: "ENCERRADO",
      pendingSummary,
      preparedByUsuarioId: requester.usuarioId,
      preparedAt: new Date("2026-01-14T12:00:00.000Z"),
      closedByUsuarioId: authorizer.usuarioId,
      closedByEmployeeId: authorizer.employeeId,
      closedAt,
    },
    update: {},
  });
  await prisma.financialYear.update({ where: { id: financialYearId }, data: { status: "Encerrado" } });
}

async function main() {
  await prisma.configuracaoPerfil.upsert({
    where: { codigo: "POC_FINANCEIRO_DEMONSTRACAO" },
    create: { id: demoProfileId, codigo: "POC_FINANCEIRO_DEMONSTRACAO", nome: "Equipe Financeira da POC", permissoes: JSON.stringify({ ALL: true }), ativo: true },
    update: { codigo: "POC_FINANCEIRO_DEMONSTRACAO", nome: "Equipe Financeira da POC", permissoes: JSON.stringify({ ALL: true }), ativo: true },
  });
  const [requester, authorizer, accounts] = await Promise.all([
    ensureDemoActor({ cpf: "900.000.000-01", email: `contabilidade.poc@${pocFixture.emailDomain}`, name: "Equipe de Contabilidade" }),
    ensureDemoActor({ cpf: "900.000.000-02", email: `controle.interno.poc@${pocFixture.emailDomain}`, name: "Equipe de Controle Interno" }),
    ensureAccountingDemoAccounts(),
  ]);
  const financialYear2025 = await prisma.financialYear.upsert({
    where: { year: year2025 },
    create: { year: year2025, status: "Aberto", startDate: new Date("2025-01-01T00:00:00.000Z"), endDate: new Date("2025-12-31T23:59:59.999Z") },
    update: {},
  });
  const financialYear2026 = await prisma.financialYear.upsert({
    where: { year: 2026 },
    create: { year: 2026, status: "Aberto", startDate: new Date("2026-01-01T00:00:00.000Z"), endDate: new Date("2026-12-31T23:59:59.999Z") },
    update: {},
  });

  if (financialYear2025.status !== "Encerrado") {
    if (!['Aberto', 'Em Encerramento'].includes(financialYear2025.status)) {
      throw new Error(`O exercício ${year2025} está em ${financialYear2025.status} e não pode receber a demonstração POC.`);
    }
    if (financialYear2025.status === "Aberto") await post2025DemonstrationEntries(financialYear2025.id, requester, accounts);
    const pendingReconciliations = await prisma.bankStatementItem.count({
      where: {
        status: "Pendente",
        date: { gte: new Date("2025-01-01T00:00:00.000Z"), lte: new Date("2025-12-31T23:59:59.999Z") },
      },
    });
    if (pendingReconciliations) {
      await seedClosed2025History(financialYear2025.id, requester, authorizer);
      console.log(`Histórico de 2025 simulado com ${pendingReconciliations} conciliação(ões) pendente(s) preservada(s).`);
    } else {
      await close2025Demonstration(financialYear2025.id, requester, authorizer);
    }
  }

  await postAccountingTransaction(prisma, requester, {
    financialYearId: financialYear2026.id,
    date: new Date("2026-03-20T12:00:00.000Z"),
    history: "Arrecadação demonstrativa POC - março de 2026",
    lines: [
      { accountId: accounts.cash.id, type: "Débito", value: 12_500 },
      { accountId: accounts.equity.id, type: "Crédito", value: 12_500 },
    ],
    sourceModule: "POC_DEMONSTRACAO",
    sourceType: "LANCAMENTO_CONTABIL",
    sourceId: "DEMO:2026:03",
    eventType: "DEMONSTRACAO_POC",
    idempotencyKey: "DEMO:2026:ACCOUNTING:03",
  });

  console.log("Demonstração financeira POC provisionada: 2025 encerrado e 2026 aberto com lançamento contábil.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
