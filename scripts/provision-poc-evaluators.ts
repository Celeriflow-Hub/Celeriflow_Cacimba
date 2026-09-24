import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { pocFixtureUsers } from "../src/lib/poc/fixture-catalog";

const evaluatorProfiles = [
  { id: "perfil-poc-avaliador-ti", name: "Avaliador Técnico de Tecnologia", email: pocFixtureUsers.evaluatorTechnology.email },
  { id: "perfil-poc-avaliador-financeiro", name: "Avaliador Administrativo-Financeiro", email: pocFixtureUsers.evaluatorFinance.email },
  { id: "perfil-poc-avaliador-contabil", name: "Avaliador Contábil", email: pocFixtureUsers.evaluatorAccounting.email },
];

async function main() {
  const [financeModule, pocUnit] = await Promise.all([
    prisma.configuracaoModulo.findUnique({ where: { codigo: "FINANCEIRO" }, select: { id: true } }),
    prisma.budgetUnit.findUnique({ where: { code: "0101" }, select: { id: true } }),
  ]);
  if (!financeModule || !pocUnit) throw new Error("Módulo FINANCEIRO ou Unidade Gestora 0101 não foi encontrado.");

  const blockedModules = (await prisma.configuracaoModulo.findMany({
    where: { codigo: { not: "FINANCEIRO" } },
    select: { codigo: true },
  })).map((module) => module.codigo);

  for (const evaluator of evaluatorProfiles) {
    const profileCode = evaluator.id.replace("perfil-", "").toUpperCase();
    const user = await prisma.usuario.findUnique({ where: { email: evaluator.email }, select: { id: true, employeeId: true } });
    if (!user) throw new Error(`Usuário avaliador ${evaluator.email} não foi encontrado.`);
    let employeeId = user.employeeId;
    if (!employeeId) {
      const registration = `POC-SJI-${evaluator.id.replace("perfil-poc-", "").toUpperCase()}`;
      const employee = await prisma.employee.findFirst({ where: { registration }, select: { id: true } })
        ?? await prisma.employee.create({
          data: {
            name: evaluator.name,
            registration,
            email: evaluator.email,
            isActive: true,
          },
        });
      employeeId = employee.id;
    }

    const profile = await prisma.configuracaoPerfil.upsert({
      where: { codigo: profileCode },
      create: {
        id: evaluator.id,
        codigo: profileCode,
        nome: evaluator.name,
        descricao: "Acesso individual da comissão avaliadora da POC de São João do Ivaí.",
        permissoes: JSON.stringify({
          acesso: "operacional",
          modulosBloqueados: blockedModules,
          modules: {
            FINANCEIRO: {
              showDashboardCard: true,
              blocked: false,
              create: true,
              update: true,
              delete: true,
              issueReports: evaluator.email === pocFixtureUsers.evaluatorFinance.email,
            },
          },
        }),
        ativo: true,
      },
      update: {
        codigo: profileCode,
        nome: evaluator.name,
        descricao: "Acesso individual da comissão avaliadora da POC de São João do Ivaí.",
        permissoes: JSON.stringify({
          acesso: "operacional",
          modulosBloqueados: blockedModules,
          modules: {
            FINANCEIRO: {
              showDashboardCard: true,
              blocked: false,
              create: true,
              update: true,
              delete: true,
              issueReports: evaluator.email === pocFixtureUsers.evaluatorFinance.email,
            },
          },
        }),
        ativo: true,
      },
    });

    await prisma.$transaction([
      prisma.usuario.update({ where: { id: user.id }, data: { perfilId: profile.id, employeeId, ativo: true } }),
      prisma.usuarioModulo.deleteMany({ where: { usuarioId: user.id } }),
      prisma.usuarioModulo.create({ data: { usuarioId: user.id, moduloId: financeModule.id, canView: true, canEdit: true } }),
      prisma.usuarioUnidadeGestora.deleteMany({ where: { usuarioId: user.id } }),
      prisma.usuarioUnidadeGestora.create({ data: { usuarioId: user.id, budgetUnitId: pocUnit.id } }),
    ]);
  }

  console.log("Três avaliadores provisionados com acesso operacional exclusivo ao módulo FINANCEIRO.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
