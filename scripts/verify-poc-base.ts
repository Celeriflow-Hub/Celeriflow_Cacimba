import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { pocVirtualBank } from "../src/lib/poc/poc-config";
import { constitutionalRevenueRules } from "../src/lib/poc/constitutional-revenue-rules";
import { pocFixture } from "../src/lib/poc/fixture-catalog";

type Check = { check: string; status: "OK" | "FALHA"; detail: string };

async function main() {
  const checks: Check[] = [];
  const fail = (check: string, detail: string) => checks.push({ check, status: "FALHA", detail });
  const pass = (check: string, detail: string) => checks.push({ check, status: "OK", detail });

  try {
    const [unit, years, accounts, integration] = await Promise.all([
      prisma.budgetUnit.findUnique({ where: { code: "0101" }, select: { id: true, name: true } }),
      prisma.financialYear.findMany({ where: { year: { in: [2025, 2026] } }, select: { year: true, status: true } }),
      prisma.bankAccount.findMany({
        where: { bankName: pocVirtualBank.name, agency: pocVirtualBank.agency, accountNumber: { in: ["10001-0", "20001-1", "90001-4"] } },
        select: { id: true, accountNumber: true, isActive: true, budgetUnitId: true, resourceSourceId: true, accountingPlanId: true },
      }),
      prisma.integrationConnection.findUnique({ where: { code: "BANCO_API" }, select: { status: true, environment: true, provider: true } }),
    ]);

    if (unit?.name === pocFixture.cityHallName) pass("Unidade gestora", `UG 0101 identificada como ${pocFixture.cityHallName}.`);
    else fail("Unidade gestora", `A UG 0101 não está identificada como ${pocFixture.cityHallName}.`);

    if (years.length === 2 && years.every((year) => year.status === "Aberto")) pass("Exercícios", "Exercícios 2025 e 2026 estão abertos.");
    else fail("Exercícios", "Os exercícios 2025 e 2026 devem estar abertos para os cenários do roteiro.");

    const invalidAccounts = accounts.filter((account) => !account.isActive || account.budgetUnitId !== unit?.id || !account.resourceSourceId || !account.accountingPlanId);
    if (accounts.length === 3 && invalidAccounts.length === 0) pass("Contas bancárias", "Contas 10001-0, 20001-1 e 90001-4 ativas, com UG, fonte e plano contábil vinculados.");
    else fail("Contas bancárias", "As contas essenciais da POC devem estar ativas e vinculadas à UG, fonte e plano contábil.");

    if (integration?.status === "ATIVA" && integration.environment === "SANDBOX" && integration.provider === "Robonuvem - ambiente externo de testes") pass("Integração bancária", "BANCO_API ativa em SANDBOX para o Banco Virtual Robonuvem.");
    else fail("Integração bancária", "BANCO_API não está ativa e configurada para o sandbox da POC.");

    const revenueAccount = accounts.find((account) => account.accountNumber === "20001-1");
    const rules = await prisma.classificationRule.findMany({
      where: { tipoMovimento: "RECEITA_CONSTITUCIONAL", ativo: true },
      select: { textoProcurado: true, ativo: true, bankAccountId: true },
    });
    const missingRules = constitutionalRevenueRules.filter((rule) => !rules.some((stored) => stored.textoProcurado === rule.textoProcurado && stored.bankAccountId === revenueAccount?.id));
    const unlinkedRules = rules.filter((rule) => rule.bankAccountId !== revenueAccount?.id);
    if (missingRules.length === 0 && unlinkedRules.length === 0) pass("Regras constitucionais", `${rules.length} regras ativas vinculadas à conta 20001-1.`);
    else fail("Regras constitucionais", `Regras sem vínculo à conta 20001-1: ${[...missingRules.map((rule) => rule.textoProcurado), ...unlinkedRules.map((rule) => rule.textoProcurado)].join(", ")}.`);

    const opening = revenueAccount && await prisma.treasuryMovement.findUnique({ where: { idempotencyKey: "poc-robonuvem-opening-20001-2025" }, select: { bankAccountId: true } });
    if (opening?.bankAccountId === revenueAccount?.id) pass("Saldo inicial", "Saldo inicial auditável da conta 20001-1 está disponível para a conciliação.");
    else fail("Saldo inicial", "O saldo inicial auditável da conta 20001-1 não está disponível.");
  } finally {
    console.table(checks);
    await prisma.$disconnect();
  }

  if (checks.some((check) => check.status === "FALHA")) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error("Falha ao verificar a base POC:", error);
  await prisma.$disconnect();
  process.exit(1);
});
