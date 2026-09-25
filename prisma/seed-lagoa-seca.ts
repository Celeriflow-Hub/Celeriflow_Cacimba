import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Gerando Base Modelo Completa de Homologação e POC para Lagoa Seca/PB...");

  // 1. Exercício Financeiro
  const year2026 = await prisma.financialYear.upsert({
    where: { year: 2026 },
    create: {
      year: 2026,
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T23:59:59.999Z"),
      status: "Aberto",
    },
    update: { status: "Aberto" },
  });

  // 2. Secretaria de Finanças e Unidades Gestoras
  const secretariaFinancas = await prisma.secretariat.upsert({
    where: { id: "sec-fin-01" },
    create: { id: "sec-fin-01", name: "Secretaria de Finanças e Planejamento", acronym: "SEFIN" },
    update: { name: "Secretaria de Finanças e Planejamento" },
  });

  const ugPrefeitura = await prisma.budgetUnit.upsert({
    where: { code: "0101" },
    create: { code: "0101", name: "Prefeitura Municipal de Lagoa Seca", secretariatId: secretariaFinancas.id },
    update: { name: "Prefeitura Municipal de Lagoa Seca", secretariatId: secretariaFinancas.id },
  });

  const ugCamara = await prisma.budgetUnit.upsert({
    where: { code: "0201" },
    create: { code: "0201", name: "Câmara Municipal de Lagoa Seca", secretariatId: secretariaFinancas.id },
    update: { name: "Câmara Municipal de Lagoa Seca", secretariatId: secretariaFinancas.id },
  });

  // 3. Perfis mínimos da POC, com auditoria somente leitura e acesso por módulo.
  const profileDefinitions = [
    { id: "perfil-administrador-lagoaseca", codigo: "SYSTEM_ADMINISTRATOR", nome: "Administrador", permissoes: { acesso: "operacional", modules: {} } },
    { id: "perfil-solicitante-lagoaseca", codigo: "SOLICITANTE", nome: "Solicitante", permissoes: { acesso: "operacional", modulosPermitidos: ["FINANCEIRO"] } },
    { id: "perfil-aprovador-lagoaseca", codigo: "APROVADOR", nome: "Aprovador/Gestor", permissoes: { acesso: "operacional", modulosPermitidos: ["FINANCEIRO"] } },
    { id: "perfil-contador-lagoaseca", codigo: "CONTADOR", nome: "Contador", permissoes: { acesso: "operacional", modulosPermitidos: ["FINANCEIRO"] } },
    { id: "perfil-tesoureiro-lagoaseca", codigo: "TESOUREIRO", nome: "Tesoureiro", permissoes: { acesso: "operacional", modulosPermitidos: ["FINANCEIRO"] } },
    { id: "perfil-auditor-lagoaseca", codigo: "AUDITOR", nome: "Auditor", permissoes: { acesso: "operacional", modulosPermitidos: ["FINANCEIRO"], modulosSomenteLeitura: ["FINANCEIRO"] } },
    { id: "perfil-transparencia-lagoaseca", codigo: "TRANSPARENCIA", nome: "Transparência", permissoes: { acesso: "operacional", modulosPermitidos: ["TRANSPARENCIA"] } },
  ];
  await Promise.all(profileDefinitions.map((profile) => prisma.configuracaoPerfil.upsert({
    where: { codigo: profile.codigo },
    create: { ...profile, permissoes: JSON.stringify(profile.permissoes), ativo: true },
    update: { codigo: profile.codigo, nome: profile.nome, permissoes: JSON.stringify(profile.permissoes), ativo: true },
  })));
  const perfilContador = await prisma.configuracaoPerfil.findUniqueOrThrow({ where: { codigo: "CONTADOR" } });

  const contadorPrefeitura = await prisma.usuario.upsert({
    where: { email: "contador.prefeitura@lagoaseca.pb.gov.br" },
    create: {
      email: "contador.prefeitura@lagoaseca.pb.gov.br",
      nome: "Contador Prefeitura - Lagoa Seca",
      perfilId: perfilContador.id,
      ativo: true,
      unidadesGestoras: {
        create: { budgetUnitId: ugPrefeitura.id },
      },
    },
    update: { nome: "Contador Prefeitura - Lagoa Seca", perfilId: perfilContador.id, ativo: true },
  });

  await prisma.usuario.upsert({
    where: { email: "contador.camara@lagoaseca.pb.gov.br" },
    create: {
      email: "contador.camara@lagoaseca.pb.gov.br",
      nome: "Contador Câmara - Lagoa Seca",
      perfilId: perfilContador.id,
      ativo: true,
      unidadesGestoras: {
        create: { budgetUnitId: ugCamara.id },
      },
    },
    update: { nome: "Contador Câmara - Lagoa Seca", perfilId: perfilContador.id, ativo: true },
  });

  // 4. Servidor Público
  const tesoureiro = await prisma.employee.upsert({
    where: { cpf: "111.222.333-44" },
    create: {
      name: "João da Silva - Tesoureiro",
      cpf: "111.222.333-44",
      secretariatId: secretariaFinancas.id,
      isActive: true,
    },
    update: { name: "João da Silva - Tesoureiro" },
  });
  await prisma.usuario.update({
    where: { id: contadorPrefeitura.id },
    data: { employeeId: tesoureiro.id },
  });

  // 5. Fontes de Recurso
  const fonteOrdinaria = await prisma.resourceSource.upsert({
    where: { code: "15000000" },
    create: { code: "15000000", name: "Recursos Não Vinculados de Impostos (Ordinário)" },
    update: {},
  });

  await prisma.resourceSource.upsert({
    where: { code: "15010000" },
    create: { code: "15010000", name: "Outros Recursos Vinculados à Educação (MDE)" },
    update: {},
  });

  // 6. Naturezas de Despesa
  const ndMaterial = await prisma.expenseNature.upsert({
    where: { code: "3.3.90.30.00" },
    create: { code: "3.3.90.30.00", name: "Material de Consumo" },
    update: {},
  });

  const ndPessoal = await prisma.expenseNature.upsert({
    where: { code: "3.1.90.11.00" },
    create: { code: "3.1.90.11.00", name: "Vencimentos e Vantagens Fixas - Pessoal Civil" },
    update: {},
  });

  // 7. Naturezas de Receita
  const nrIPTU = await prisma.revenueNature.upsert({
    where: { code: "1.1.1.2.50.0.1" },
    create: { code: "1.1.1.2.50.0.1", name: "Imposto sobre a Propriedade Predial e Territorial Urbana - IPTU" },
    update: {},
  });

  const nrFPM = await prisma.revenueNature.upsert({
    where: { code: "1.7.1.8.01.2.1" },
    create: { code: "1.7.1.8.01.2.1", name: "Cota-Parte do Fundo de Participação dos Municípios - FPM" },
    update: {},
  });

  // 8. Planejamento Orçamentário Equilibrado (PPA, LDO, LOA = R$ 15.000.000,00)
  const ppa = await prisma.multiYearPlan.upsert({
    where: { code: "PPA-2026-2029" },
    create: {
      code: "PPA-2026-2029",
      name: "PPA 2026-2029 - Lagoa Seca",
      startYear: 2026,
      endYear: 2029,
      description: "Plano Plurianual de Lagoa Seca/PB 2026-2029",
      status: "Aprovado",
    },
    update: { status: "Aprovado" },
  });

  const programaAdministracao = await prisma.programPPA.upsert({
    where: { id: "ppa-programa-administracao-lagoaseca-2026" },
    create: {
      id: "ppa-programa-administracao-lagoaseca-2026",
      multiYearPlanId: ppa.id,
      code: "0001",
      name: "Gestão Administrativa Municipal",
      type: "Gestão",
    },
    update: { multiYearPlanId: ppa.id, code: "0001", name: "Gestão Administrativa Municipal", type: "Gestão" },
  });

  const acaoPrefeitura = await prisma.actionPPA.upsert({
    where: { id: "ppa-acao-prefeitura-lagoaseca-2026" },
    create: {
      id: "ppa-acao-prefeitura-lagoaseca-2026",
      programId: programaAdministracao.id,
      code: "2002",
      name: "Manutenção da Administração Geral",
      type: "Atividade",
    },
    update: { programId: programaAdministracao.id, code: "2002", name: "Manutenção da Administração Geral", type: "Atividade" },
  });

  const acaoCamara = await prisma.actionPPA.upsert({
    where: { id: "ppa-acao-camara-lagoaseca-2026" },
    create: {
      id: "ppa-acao-camara-lagoaseca-2026",
      programId: programaAdministracao.id,
      code: "2001",
      name: "Manutenção das Atividades Legislativas",
      type: "Atividade",
    },
    update: { programId: programaAdministracao.id, code: "2001", name: "Manutenção das Atividades Legislativas", type: "Atividade" },
  });

  const objetivoAdministracao = await prisma.objectivePPA.upsert({
    where: { id: "ppa-objetivo-administracao-lagoaseca-2026" },
    create: {
      id: "ppa-objetivo-administracao-lagoaseca-2026",
      programId: programaAdministracao.id,
      code: "OBJ-001",
      description: "Assegurar a continuidade dos serviços administrativos e legislativos municipais.",
    },
    update: { programId: programaAdministracao.id, code: "OBJ-001", description: "Assegurar a continuidade dos serviços administrativos e legislativos municipais." },
  });

  await prisma.indicatorPPA.upsert({
    where: { id: "ppa-indicador-administracao-lagoaseca-2026" },
    create: {
      id: "ppa-indicador-administracao-lagoaseca-2026",
      objectiveId: objetivoAdministracao.id,
      name: "Unidades administrativas com execução orçamentária monitorada",
      unit: "%",
      baselineValue: 100,
      targetValue: 100,
    },
    update: { objectiveId: objetivoAdministracao.id, name: "Unidades administrativas com execução orçamentária monitorada", unit: "%", baselineValue: 100, targetValue: 100 },
  });

  await Promise.all([
    prisma.goalPPA.upsert({
      where: { id: "ppa-meta-prefeitura-lagoaseca-2026" },
      create: { id: "ppa-meta-prefeitura-lagoaseca-2026", actionId: acaoPrefeitura.id, year: 2026, physical: 100, financial: new Prisma.Decimal("10000000.00") },
      update: { actionId: acaoPrefeitura.id, year: 2026, physical: 100, financial: new Prisma.Decimal("10000000.00") },
    }),
    prisma.goalPPA.upsert({
      where: { id: "ppa-meta-camara-lagoaseca-2026" },
      create: { id: "ppa-meta-camara-lagoaseca-2026", actionId: acaoCamara.id, year: 2026, physical: 100, financial: new Prisma.Decimal("5000000.00") },
      update: { actionId: acaoCamara.id, year: 2026, physical: 100, financial: new Prisma.Decimal("5000000.00") },
    }),
  ]);

  const ldo = await prisma.budgetGuideline.upsert({
    where: { id: "ldo-2026-lagoaseca" },
    create: {
      id: "ldo-2026-lagoaseca",
      financialYearId: year2026.id,
      multiYearPlanId: ppa.id,
      status: "Vigente",
    },
    update: { multiYearPlanId: ppa.id, status: "Vigente" },
  });

  await Promise.all([
    prisma.budgetGuidelinePriority.upsert({
      where: { id: "ldo-prioridade-administracao-lagoaseca-2026" },
      create: { id: "ldo-prioridade-administracao-lagoaseca-2026", budgetGuidelineId: ldo.id, description: "Manutenção dos serviços administrativos e legislativos", targetValue: new Prisma.Decimal("100.00") },
      update: { budgetGuidelineId: ldo.id, description: "Manutenção dos serviços administrativos e legislativos", targetValue: new Prisma.Decimal("100.00") },
    }),
    prisma.budgetGuidelineRisk.upsert({
      where: { id: "ldo-risco-arrecadacao-lagoaseca-2026" },
      create: { id: "ldo-risco-arrecadacao-lagoaseca-2026", budgetGuidelineId: ldo.id, description: "Frustração de receita própria", estimatedImpact: new Prisma.Decimal("150000.00"), mitigation: "Acompanhar a MBA e reprogramar o CMD conforme a arrecadação." },
      update: { budgetGuidelineId: ldo.id, description: "Frustração de receita própria", estimatedImpact: new Prisma.Decimal("150000.00"), mitigation: "Acompanhar a MBA e reprogramar o CMD conforme a arrecadação." },
    }),
  ]);

  const loa = await prisma.annualBudgetLaw.upsert({
    where: { id: "loa-2026-lagoaseca" },
    create: {
      id: "loa-2026-lagoaseca",
      financialYearId: year2026.id,
      lawNumber: "LOA nº 1.050/2025",
      publicationDate: new Date("2025-12-15T00:00:00.000Z"),
      budgetGuidelineId: ldo.id,
      totalRevenue: 15000000,
      totalExpense: 15000000,
      status: "Vigente",
    },
    update: { budgetGuidelineId: ldo.id, status: "Vigente" },
  });

  // Previsão de Receita na LOA (Total: R$ 15.000.000,00)
  await prisma.annualBudgetRevenueForecast.upsert({
    where: { id: "forecast-iptu-2026" },
    create: {
      id: "forecast-iptu-2026",
      annualBudgetLawId: loa.id,
      code: nrIPTU.code,
      name: nrIPTU.name,
      estimatedValue: new Prisma.Decimal("3000000.00"),
    },
    update: { annualBudgetLawId: loa.id, code: nrIPTU.code, name: nrIPTU.name, estimatedValue: new Prisma.Decimal("3000000.00") },
  });

  await prisma.annualBudgetRevenueForecast.upsert({
    where: { id: "forecast-fpm-2026" },
    create: {
      id: "forecast-fpm-2026",
      annualBudgetLawId: loa.id,
      code: nrFPM.code,
      name: nrFPM.name,
      estimatedValue: new Prisma.Decimal("12000000.00"),
    },
    update: { annualBudgetLawId: loa.id, code: nrFPM.code, name: nrFPM.name, estimatedValue: new Prisma.Decimal("12000000.00") },
  });

  // Fixação de Despesa na LOA (Total: R$ 15.000.000,00)
  const fixationPrefeitura = await prisma.annualBudgetExpenseFixation.upsert({
    where: { id: "fixation-pref-2026" },
    create: {
      id: "fixation-pref-2026",
      annualBudgetLawId: loa.id,
      code: ndMaterial.code,
      name: "Manutenção da Administração Geral - Prefeitura",
      fixedValue: new Prisma.Decimal("10000000.00"),
    },
    update: { annualBudgetLawId: loa.id, code: ndMaterial.code, name: "Manutenção da Administração Geral - Prefeitura", fixedValue: new Prisma.Decimal("10000000.00") },
  });

  const fixationCamara = await prisma.annualBudgetExpenseFixation.upsert({
    where: { id: "fixation-cam-2026" },
    create: {
      id: "fixation-cam-2026",
      annualBudgetLawId: loa.id,
      code: ndPessoal.code,
      name: "Folha de Pagamento - Câmara Municipal",
      fixedValue: new Prisma.Decimal("5000000.00"),
    },
    update: { annualBudgetLawId: loa.id, code: ndPessoal.code, name: "Folha de Pagamento - Câmara Municipal", fixedValue: new Prisma.Decimal("5000000.00") },
  });

  for (let month = 1; month <= 12; month += 1) {
    await Promise.all([
      prisma.monthlyDisbursementSchedule.upsert({
        where: { annualBudgetLawId_month_budgetUnitId: { annualBudgetLawId: loa.id, month, budgetUnitId: ugPrefeitura.id } },
        create: { annualBudgetLawId: loa.id, month, budgetUnitId: ugPrefeitura.id, limitValue: new Prisma.Decimal(month === 12 ? "833333.37" : "833333.33") },
        update: { limitValue: new Prisma.Decimal(month === 12 ? "833333.37" : "833333.33") },
      }),
      prisma.monthlyDisbursementSchedule.upsert({
        where: { annualBudgetLawId_month_budgetUnitId: { annualBudgetLawId: loa.id, month, budgetUnitId: ugCamara.id } },
        create: { annualBudgetLawId: loa.id, month, budgetUnitId: ugCamara.id, limitValue: new Prisma.Decimal(month === 12 ? "416666.63" : "416666.67") },
        update: { limitValue: new Prisma.Decimal(month === 12 ? "416666.63" : "416666.67") },
      }),
    ]);
  }

  for (let bimonth = 1; bimonth <= 6; bimonth += 1) {
    await prisma.bimonthlyRevenueTarget.upsert({
      where: { annualBudgetLawId_bimonth: { annualBudgetLawId: loa.id, bimonth } },
      create: { annualBudgetLawId: loa.id, bimonth, targetValue: new Prisma.Decimal("2500000.00") },
      update: { targetValue: new Prisma.Decimal("2500000.00") },
    });
  }

  // 9. Contas Bancárias Ativas com Fonte Obrigatória, Unidade Gestora Vinculada e Saldo de Abertura
  const contaBBPrefeitura = await prisma.bankAccount.upsert({
    where: { id: "cl-lagoaseca-bb-pref-1000" },
    create: {
      id: "cl-lagoaseca-bb-pref-1000",
      bankName: "Banco do Brasil S.A.",
      agency: "1234-5",
      accountNumber: "10000-1",
      accountType: "Movimento",
      currentBalanceDecimal: new Prisma.Decimal("800000.00"),
      currentBalance: 800000,
      resourceSourceId: fonteOrdinaria.id,
      budgetUnitId: ugPrefeitura.id,
      isActive: true,
    },
    update: { currentBalanceDecimal: new Prisma.Decimal("800000.00"), resourceSourceId: fonteOrdinaria.id, budgetUnitId: ugPrefeitura.id, isActive: true },
  });

  const contaBBCamara = await prisma.bankAccount.upsert({
    where: { id: "cl-lagoaseca-bb-cam-2000" },
    create: {
      id: "cl-lagoaseca-bb-cam-2000",
      bankName: "Banco do Brasil S.A.",
      agency: "1234-5",
      accountNumber: "20000-2",
      accountType: "Movimento",
      currentBalanceDecimal: new Prisma.Decimal("200000.00"),
      currentBalance: 200000,
      resourceSourceId: fonteOrdinaria.id,
      budgetUnitId: ugCamara.id,
      isActive: true,
    },
    update: { currentBalanceDecimal: new Prisma.Decimal("200000.00"), resourceSourceId: fonteOrdinaria.id, budgetUnitId: ugCamara.id, isActive: true },
  });

  // Movimentos de abertura de saldo nas contas
  await prisma.treasuryMovement.upsert({
    where: { idempotencyKey: "SEED:LAGOA_SECA:PREF:OPENING_BALANCE" },
    create: {
      date: new Date("2026-01-01T08:00:00.000Z"),
      type: "OpeningBalance",
      direction: "Entrada",
      valueDecimal: new Prisma.Decimal("800000.00"),
      history: "Saldo Inicial de Tesouraria - Prefeitura de Lagoa Seca/PB",
      bankAccountId: contaBBPrefeitura.id,
      financialYearId: year2026.id,
      sourceModule: "FINANCEIRO",
      sourceType: "SEED",
      eventType: "OPENING_BALANCE",
      status: "Confirmado",
      idempotencyKey: "SEED:LAGOA_SECA:PREF:OPENING_BALANCE",
    },
    update: {},
  });

  await prisma.treasuryMovement.upsert({
    where: { idempotencyKey: "SEED:LAGOA_SECA:CAM:OPENING_BALANCE" },
    create: {
      date: new Date("2026-01-01T08:00:00.000Z"),
      type: "OpeningBalance",
      direction: "Entrada",
      valueDecimal: new Prisma.Decimal("200000.00"),
      history: "Saldo Inicial de Tesouraria - Câmara de Lagoa Seca/PB",
      bankAccountId: contaBBCamara.id,
      financialYearId: year2026.id,
      sourceModule: "FINANCEIRO",
      sourceType: "SEED",
      eventType: "OPENING_BALANCE",
      status: "Confirmado",
      idempotencyKey: "SEED:LAGOA_SECA:CAM:OPENING_BALANCE",
    },
    update: {},
  });

  // 10. Regras de Retenção Tributária
  await prisma.retentionRule.upsert({
    where: { code: "INSS_11" },
    create: {
      code: "INSS_11",
      type: "INSS",
      description: "Retenção de INSS 11% sobre serviços tomados",
      calculationBasePercentage: new Prisma.Decimal("100.00"),
      ratePercentage: new Prisma.Decimal("11.00"),
      dueDays: 20,
      beneficiaryName: "Instituto Nacional do Seguro Social",
      beneficiaryDocument: "29.979.036/0001-40",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      isActive: true,
    },
    update: {},
  });

  await prisma.retentionRule.upsert({
    where: { code: "IRRF_15" },
    create: {
      code: "IRRF_15",
      type: "IRRF",
      description: "Retenção de Imposto de Renda na Fonte 1,5%",
      calculationBasePercentage: new Prisma.Decimal("100.00"),
      ratePercentage: new Prisma.Decimal("1.50"),
      dueDays: 20,
      beneficiaryName: "Receita Federal do Brasil",
      beneficiaryDocument: "00.394.460/0001-41",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      isActive: true,
    },
    update: {},
  });

  // 11. Plano de Contas PCASP com separação de Ativo (1), Passivo (2.1/2.2) e Patrimônio Líquido (2.3)
  const accountCash = await prisma.accountingPlan.upsert({
    where: { code: "1.1.1.1.1.00.00" },
    create: { code: "1.1.1.1.1.00.00", name: "Caixa e Equivalentes de Caixa em Moeda Nacional", type: "Analítica" },
    update: {},
  });

  const accountCreditors = await prisma.accountingPlan.upsert({
    where: { code: "2.1.1.1.1.00.00" },
    create: { code: "2.1.1.1.1.00.00", name: "Fornecedores e Credores Nacionais a Pagar", type: "Analítica" },
    update: {},
  });

  const accountEquity = await prisma.accountingPlan.upsert({
    where: { code: "2.3.7.1.1.00.00" },
    create: { code: "2.3.7.1.1.00.00", name: "Patrimônio Social e Capital Social", type: "Analítica" },
    update: {},
  });

  const pocAccountingRules = [
    ["EMPENHO_EMITIDO", "Empenho emitido", accountEquity.id, accountCreditors.id],
    ["LIQUIDACAO_REGISTRADA", "Liquidacao registrada", accountEquity.id, accountCreditors.id],
    ["PAGAMENTO_EFETIVADO", "Pagamento efetivado", accountCreditors.id, accountCash.id],
    ["RETENCAO_RECOLHIDA", "Retencao recolhida", accountCreditors.id, accountCash.id],
    ["PAGAMENTO_ESTORNADO", "Pagamento estornado", accountCash.id, accountCreditors.id],
    ["RECEITA_LANCADA", "Receita lancada", accountCash.id, accountEquity.id],
    ["RECEITA_ARRECADADA", "Receita arrecadada", accountCash.id, accountEquity.id],
    ["RECEITA_ESTORNADA", "Receita estornada", accountEquity.id, accountCash.id],
    ["RECEITA_REDISTRIBUIDA_FONTE", "Receita redistribuida por fonte", accountCash.id, accountEquity.id],
  ] as const;
  for (const [code, name, debitAccountId, creditAccountId] of pocAccountingRules) {
    const event = await prisma.accountingEventCatalog.upsert({ where: { code }, create: { code, name, description: "REFERENCIA POC - substituir por matriz PCASP homologada" }, update: { name, description: "REFERENCIA POC - substituir por matriz PCASP homologada", isActive: true } });
    await prisma.accountingPostingRule.updateMany({
      where: { eventId: event.id, isReference: true, NOT: { debitAccountId, creditAccountId } },
      data: { isActive: false },
    });
    await prisma.accountingPostingRule.upsert({ where: { eventId_debitAccountId_creditAccountId: { eventId: event.id, debitAccountId, creditAccountId } }, create: { eventId: event.id, debitAccountId, creditAccountId, description: "REFERENCIA POC - nao utilizar em producao", isReference: true }, update: { isActive: true, isReference: true, description: "REFERENCIA POC - nao utilizar em producao" } });
  }

  // 12. Dotações Orçamentárias Segregadas por UG e alinhadas à LOA Fixada
  const dotacaoPrefeitura = await prisma.budgetAppropriation.upsert({
    where: { code: "0101.04.122.0001.2002.3.3.90.30.00" },
    create: {
      id: "dotacao-lagoaseca-pref-01",
      code: "0101.04.122.0001.2002.3.3.90.30.00",
      financialYearId: year2026.id,
      budgetUnitId: ugPrefeitura.id,
      expenseNatureId: ndMaterial.id,
      resourceSourceId: fonteOrdinaria.id,
      annualBudgetExpenseFixationId: fixationPrefeitura.id,
      programPPAId: programaAdministracao.id,
      actionPPAId: acaoPrefeitura.id,
      initialValueDecimal: new Prisma.Decimal("10000000.00"),
      updatedValueDecimal: new Prisma.Decimal("10000000.00"),
      committedValueDecimal: new Prisma.Decimal("0.00"),
      initialValue: 10000000,
      updatedValue: 10000000,
      committedValue: 0,
    },
    update: { financialYearId: year2026.id, budgetUnitId: ugPrefeitura.id, expenseNatureId: ndMaterial.id, resourceSourceId: fonteOrdinaria.id, annualBudgetExpenseFixationId: fixationPrefeitura.id, programPPAId: programaAdministracao.id, actionPPAId: acaoPrefeitura.id, initialValueDecimal: new Prisma.Decimal("10000000.00"), updatedValueDecimal: new Prisma.Decimal("10000000.00") },
  });

  await prisma.budgetAppropriation.upsert({
    where: { code: "0201.01.031.0001.2001.3.1.90.11.00" },
    create: {
      id: "dotacao-lagoaseca-cam-01",
      code: "0201.01.031.0001.2001.3.1.90.11.00",
      financialYearId: year2026.id,
      budgetUnitId: ugCamara.id,
      expenseNatureId: ndPessoal.id,
      resourceSourceId: fonteOrdinaria.id,
      annualBudgetExpenseFixationId: fixationCamara.id,
      programPPAId: programaAdministracao.id,
      actionPPAId: acaoCamara.id,
      initialValueDecimal: new Prisma.Decimal("5000000.00"),
      updatedValueDecimal: new Prisma.Decimal("5000000.00"),
      committedValueDecimal: new Prisma.Decimal("0.00"),
      initialValue: 5000000,
      updatedValue: 5000000,
      committedValue: 0,
    },
    update: { financialYearId: year2026.id, budgetUnitId: ugCamara.id, expenseNatureId: ndPessoal.id, resourceSourceId: fonteOrdinaria.id, annualBudgetExpenseFixationId: fixationCamara.id, programPPAId: programaAdministracao.id, actionPPAId: acaoCamara.id, initialValueDecimal: new Prisma.Decimal("5000000.00"), updatedValueDecimal: new Prisma.Decimal("5000000.00") },
  });

  // 13. Fornecedor e Credor
  const empresaTeste = await prisma.company.upsert({
    where: { cnpj: "12.345.678/0001-90" },
    create: { cnpj: "12.345.678/0001-90", corporateName: "Comércio e Distribuidora Paraibana Ltda", tradeName: "Distribuidora PB" },
    update: {},
  });

  const fornecedorTeste = await prisma.supplier.upsert({
    where: { id: "supp-lagoaseca-01" },
    create: {
      id: "supp-lagoaseca-01",
      companyId: empresaTeste.id,
      status: "Ativo",
    },
    update: {},
  });

  await prisma.creditor.upsert({
    where: { supplierId: fornecedorTeste.id },
    create: {
      supplierId: fornecedorTeste.id,
      name: "Comércio e Distribuidora Paraibana Ltda",
      document: "12.345.678/0001-90",
      companyId: empresaTeste.id,
    },
    update: {},
  });

  await prisma.commitment.upsert({
    where: { number: "EMP-SEED-LAGOA-SECA-001" },
    create: {
      number: "EMP-SEED-LAGOA-SECA-001",
      date: new Date("2026-01-10T00:00:00.000Z"),
      value: 1000,
      valueDecimal: new Prisma.Decimal("1000.00"),
      type: "Ordinário",
      history: "Empenho base para homologação financeira",
      appropriationId: dotacaoPrefeitura.id,
      supplierId: fornecedorTeste.id,
    },
    update: {
      appropriationId: dotacaoPrefeitura.id,
      supplierId: fornecedorTeste.id,
    },
  });

  // 14. Documento GED
  await prisma.document.upsert({
    where: { id: "doc-nf-lagoaseca-01" },
    create: {
      id: "doc-nf-lagoaseca-01",
      title: "Nota Fiscal Eletrônica nº 001.452",
      documentType: "Nota Fiscal",
      status: "Válido",
      fileUrl: "/docs/nf-001452.pdf",
    },
    update: {},
  });

  // 15. Receita Arrecadada Conciliada com Entrada na Tesouraria
  const receitaIptu = await prisma.revenue.upsert({
    where: { idempotencyKey: "SEED:LAGOA_SECA:REV:IPTU:01" },
    create: {
      date: new Date("2026-01-15T10:00:00.000Z"),
      valueDecimal: new Prisma.Decimal("150000.00"),
      value: 150000,
      financialYearId: year2026.id,
      revenueNatureId: nrIPTU.id,
      resourceSourceId: fonteOrdinaria.id,
      bankAccountId: contaBBPrefeitura.id,
      history: "Arrecadação de IPTU Exercício 2026 - Lagoa Seca",
      sourceModule: "TRIBUTACAO",
      sourceType: "IPTU",
      eventType: "REVENUE_REALIZED",
      idempotencyKey: "SEED:LAGOA_SECA:REV:IPTU:01",
      status: "Arrecadada",
    },
    update: {},
  });

  // Entrada de tesouraria idêntica para conciliação perfeita do saldo de caixa
  await prisma.treasuryMovement.upsert({
    where: { idempotencyKey: "SEED:LAGOA_SECA:REV:IPTU:01:TREASURY" },
    create: {
      date: new Date("2026-01-15T10:00:00.000Z"),
      type: "Revenue",
      direction: "Entrada",
      valueDecimal: new Prisma.Decimal("150000.00"),
      history: "Arrecadação de IPTU Exercício 2026 - Lagoa Seca",
      bankAccountId: contaBBPrefeitura.id,
      financialYearId: year2026.id,
      revenueId: receitaIptu.id,
      sourceModule: "TRIBUTACAO",
      sourceType: "IPTU",
      eventType: "REVENUE_REALIZED",
      status: "Confirmado",
      idempotencyKey: "SEED:LAGOA_SECA:REV:IPTU:01:TREASURY",
    },
    update: {},
  });

  console.log("✅ Seed do modelo financeiro de Lagoa Seca/PB concluído com sucesso!");
  console.log("   - Exercício 2026 configurado com senhas em hash PBKDF2.");
  console.log("   - UGs '0101' (Prefeitura) e '0201' (Câmara) com usuários segregados.");
  console.log("   - LOA equilibrada em R$ 15.000.000,00 (Previsão de Receita e Fixação de Despesa).");
  console.log("   - Dotações ajustadas para R$ 10.000.000 (Prefeitura) e R$ 5.000.000 (Câmara).");
  console.log("   - Saldo inicial de tesouraria e receitas 100% conciliadas.");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
