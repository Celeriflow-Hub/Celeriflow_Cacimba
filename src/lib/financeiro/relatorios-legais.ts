import { Prisma, type PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export type ReportFilter = {
  financialYearId: string;
  startDate?: Date;
  endDate?: Date;
  budgetUnitId?: string;
};

function dateFilter(filter: ReportFilter) {
  return {
    ...(filter.startDate ? { gte: filter.startDate } : {}),
    ...(filter.endDate ? { lte: filter.endDate } : {}),
  };
}

function assertAccountingUnitFilterUnsupported(filter: ReportFilter) {
  if (filter.budgetUnitId) {
    throw new Error("Relatórios contábeis por unidade gestora exigem o vínculo da unidade ao lançamento contábil e não podem ser gerados com dados consolidados.");
  }
}

// --- Diário Contábil ---
export async function generateDiarioContabil(db: Db, filter: ReportFilter) {
  assertAccountingUnitFilterUnsupported(filter);
  const transactions = await db.accountingTransaction.findMany({
    where: {
      financialYearId: filter.financialYearId,
      status: "POSTADO",
      ...(filter.startDate || filter.endDate ? { date: dateFilter(filter) } : {}),
    },
    include: {
      entries: {
        include: { account: true },
      },
    },
    orderBy: { date: "asc" },
  });

  return transactions.map((t) => ({
    id: t.id,
    date: t.date,
    history: t.history,
    entries: t.entries.map((e) => ({
      accountId: e.accountId,
      accountCode: e.account.code,
      accountName: e.account.name,
      type: e.type,
      value: Number(e.valueDecimal),
    })),
  }));
}

// --- Razão Contábil ---
export async function generateRazaoContabil(db: Db, filter: ReportFilter & { accountId?: string }) {
  assertAccountingUnitFilterUnsupported(filter);
  const entries = await db.accountingEntry.findMany({
    where: {
      transaction: {
        financialYearId: filter.financialYearId,
        status: "POSTADO",
        ...(filter.startDate || filter.endDate ? { date: dateFilter(filter) } : {}),
      },
      ...(filter.accountId ? { accountId: filter.accountId } : {}),
    },
    include: {
      account: true,
      transaction: { select: { date: true, history: true } },
    },
    orderBy: { transaction: { date: "asc" } },
  });

  return entries.map((e) => ({
    id: e.id,
    date: e.transaction?.date ?? new Date(),
    history: e.transaction?.history ?? "",
    accountCode: e.account.code,
    accountName: e.account.name,
    type: e.type,
    value: Number(e.valueDecimal),
  }));
}

// --- Balancete Contábil ---
export async function generateBalanceteContabil(db: Db, filter: ReportFilter) {
  assertAccountingUnitFilterUnsupported(filter);
  const accounts = await db.accountingPlan.findMany({
    include: {
      entries: {
        where: {
          transaction: {
            financialYearId: filter.financialYearId,
            status: "POSTADO",
            ...(filter.startDate || filter.endDate ? { date: dateFilter(filter) } : {}),
          },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  return accounts.map((acc) => {
    const debitTotal = acc.entries
      .filter((e) => e.type === "Débito")
      .reduce((sum, e) => sum + Number(e.valueDecimal), 0);

    const creditTotal = acc.entries
      .filter((e) => e.type === "Crédito")
      .reduce((sum, e) => sum + Number(e.valueDecimal), 0);

    return {
      id: acc.id,
      code: acc.code,
      name: acc.name,
      debitTotal,
      creditTotal,
      balance: debitTotal - creditTotal,
    };
  });
}

// --- Relatório Resumido da Execução Orçamentária (RREO) ---
export async function generateRREO(db: Db, filter: ReportFilter) {
  const dateCond = filter.startDate || filter.endDate ? dateFilter(filter) : undefined;

  const [appropriations, revenues, forecasts, fixations] = await Promise.all([
    db.budgetAppropriation.findMany({
      where: {
        financialYearId: filter.financialYearId,
        ...(filter.budgetUnitId ? { budgetUnitId: filter.budgetUnitId } : {}),
      },
      include: {
        expenseNature: true,
        commitments: {
          where: {
            status: { in: ["Emitido", "Liquidado", "Pago"] },
            ...(dateCond
              ? {
                  OR: [
                    { date: dateCond },
                    { movements: { some: { date: dateCond } } },
                    { settlements: { some: { status: "Liquidado", date: dateCond } } },
                    { payments: { some: { status: { in: ["Pago", "Paga"] }, date: dateCond } } },
                  ],
                }
              : {}),
          },
          include: {
            movements: {
              where: {
                ...(dateCond ? { date: dateCond } : {}),
              },
              select: { type: true, valueDecimal: true, date: true },
            },
            settlements: {
              where: {
                status: "Liquidado",
                ...(dateCond ? { date: dateCond } : {}),
              },
              include: {
                payments: {
                  where: {
                    status: { in: ["Pago", "Paga"] },
                    ...(dateCond ? { date: dateCond } : {}),
                  },
                },
              },
            },
            payments: {
              where: {
                status: { in: ["Pago", "Paga"] },
                ...(dateCond ? { date: dateCond } : {}),
              },
            },
          },
        },
      },
    }),
    db.revenue.findMany({
      where: {
        financialYearId: filter.financialYearId,
        stage: "ARRECADADA",
        ...(dateCond ? { date: dateCond } : {}),
      },
      include: { revenueNature: true },
    }),
    db.annualBudgetRevenueForecast.findMany({
      where: {
        annualBudgetLaw: {
          financialYearId: filter.financialYearId,
          status: "PUBLISHED",
        },
      },
    }),
    db.annualBudgetExpenseFixation.findMany({
      where: {
        annualBudgetLaw: {
          financialYearId: filter.financialYearId,
          status: "PUBLISHED",
        },
      },
    }),
  ]);

  const expenses = appropriations.map((app) => {
    const fixedValue = Number(app.initialValueDecimal ?? app.initialValue);
    const updatedValue = Number(app.updatedValueDecimal ?? app.updatedValue);

    // Apuração do empenhado no período: inclui valor inicial se empenhado no período + movimentos do período
    const committedValue = app.commitments.reduce((sum, c) => {
      const initialInPeriod = !dateCond || (c.date >= (filter.startDate ?? new Date(0)) && c.date <= (filter.endDate ?? new Date("2099-12-31")));
      const initial = initialInPeriod ? Number(c.valueDecimal ?? c.value) : 0;
      const movementNet = c.movements.reduce((mSum, m) => {
        const mVal = Number(m.valueDecimal);
        if (m.type === "Reforço") return mSum + mVal;
        if (m.type === "Anulação") return mSum - mVal;
        return mSum;
      }, 0);
      return sum + initial + movementNet;
    }, 0);

    const settledValue = app.commitments.reduce((sum, c) => {
      return (
        sum +
        c.settlements.reduce((sSum, s) => sSum + Number(s.valueDecimal ?? s.value), 0)
      );
    }, 0);

    const paidValue = app.commitments.reduce((sum, c) => {
      return sum + c.payments.reduce((pSum, p) => pSum + Number(p.valueDecimal ?? p.value), 0);
    }, 0);

    return {
      expenseNatureCode: app.expenseNature.code,
      expenseNatureName: app.expenseNature.name,
      fixedValue,
      updatedValue,
      committedValue,
      settledValue,
      paidValue,
    };
  });

  const expenseSummary = Object.values(expenses.reduce<Record<string, (typeof expenses)[number]>>((summary, item) => {
    const current = summary[item.expenseNatureCode];
    summary[item.expenseNatureCode] = current
      ? {
          ...current,
          fixedValue: current.fixedValue + item.fixedValue,
          updatedValue: current.updatedValue + item.updatedValue,
          committedValue: current.committedValue + item.committedValue,
          settledValue: current.settledValue + item.settledValue,
          paidValue: current.paidValue + item.paidValue,
        }
      : item;
    return summary;
  }, {}));

  const revenueMap: Record<string, { revenueNatureCode: string; revenueNatureName: string; predictedValue: number; realizedValue: number }> = {};

  for (const f of forecasts) {
    const code = f.code;
    revenueMap[code] = {
      revenueNatureCode: code,
      revenueNatureName: f.name,
      predictedValue: Number(f.estimatedValue),
      realizedValue: 0,
    };
  }

  for (const rev of revenues) {
    const code = rev.revenueNature.code;
    const realized = Number(rev.valueDecimal ?? rev.value) * (rev.classification === "REDUTORA" ? -1 : 1);
    if (!revenueMap[code]) {
      revenueMap[code] = {
        revenueNatureCode: code,
        revenueNatureName: rev.revenueNature.name,
        predictedValue: 0,
        realizedValue: realized,
      };
    } else {
      revenueMap[code].realizedValue += realized;
    }
  }

  // Se o relatório for filtrado por Unidade Gestora específica, a despesa fixada legal reflete a dotação da UG
  const municipalFixed = fixations.reduce((sum, f) => sum + Number(f.fixedValue), 0);
  const totalLegalFixedExpense = filter.budgetUnitId
    ? expenseSummary.reduce((sum, e) => sum + e.fixedValue, 0)
    : municipalFixed > 0
    ? municipalFixed
    : expenseSummary.reduce((sum, e) => sum + e.fixedValue, 0);

  return {
    expenseSummary,
    revenueSummary: Object.values(revenueMap),
    totalLegalFixedExpense: totalLegalFixedExpense > 0 ? totalLegalFixedExpense : expenseSummary.reduce((sum, e) => sum + e.fixedValue, 0),
  };
}

// --- Relatório de Gestão Fiscal (RGF - Despesa com Pessoal / LRF) ---
export async function generateRGF(db: Db, filter: ReportFilter) {
  const revenues = await db.revenue.findMany({
    where: {
      financialYearId: filter.financialYearId,
      stage: "ARRECADADA",
      classification: { not: "INTRAORCAMENTARIA" },
      ...(filter.startDate || filter.endDate ? { date: dateFilter(filter) } : {}),
    },
    select: { valueDecimal: true, value: true, classification: true },
  });

  const rcl = revenues.reduce((sum, r) => sum + Number(r.valueDecimal ?? r.value) * (r.classification === "REDUTORA" ? -1 : 1), 0);

  const commitments = await db.commitment.findMany({
    where: {
      appropriation: {
        financialYearId: filter.financialYearId,
        expenseNature: { code: { startsWith: "3.1" } },
        ...(filter.budgetUnitId ? { budgetUnitId: filter.budgetUnitId } : {}),
      },
      status: { in: ["Emitido", "Liquidado", "Pago"] },
      ...(filter.startDate || filter.endDate ? { date: dateFilter(filter) } : {}),
    },
    select: { valueDecimal: true, value: true },
  });

  const personnelExpense = commitments.reduce((sum, c) => sum + Number(c.valueDecimal ?? c.value), 0);
  const percentageOfRcl = rcl > 0 ? (personnelExpense / rcl) * 100 : 0;
  const legalLimitPercentage = 54.0;
  const alertLimitPercentage = 48.6;

  return {
    receitaCorrenteLiquida: rcl,
    despesaTotalPessoal: personnelExpense,
    percentualAtingido: Number(percentageOfRcl.toFixed(2)),
    limiteLegal: legalLimitPercentage,
    limiteAlerta: alertLimitPercentage,
    situacao: percentageOfRcl > legalLimitPercentage ? "EXCEDIDO" : percentageOfRcl > alertLimitPercentage ? "ALERTA" : "REGULAR",
  };
}

// --- Balanço Orçamentário ---
export async function generateBalancoOrcamentario(db: Db, filter: ReportFilter) {
  const rreo = await generateRREO(db, filter);
  const totalReceitaPrevista = rreo.revenueSummary.reduce((sum, r) => sum + r.predictedValue, 0);
  const totalReceitaRealizada = rreo.revenueSummary.reduce((sum, r) => sum + r.realizedValue, 0);
  const totalDespesaFixada = rreo.totalLegalFixedExpense;
  const totalDespesaEmpenhada = rreo.expenseSummary.reduce((sum, e) => sum + e.committedValue, 0);
  const totalDespesaLiquidada = rreo.expenseSummary.reduce((sum, e) => sum + e.settledValue, 0);
  const totalDespesaPaga = rreo.expenseSummary.reduce((sum, e) => sum + e.paidValue, 0);
  const superavitDeficitOrcamentario = totalReceitaRealizada - totalDespesaEmpenhada;

  return {
    receitas: rreo.revenueSummary,
    despesas: rreo.expenseSummary,
    totais: {
      totalReceitaPrevista,
      totalReceitaRealizada,
      totalDespesaFixada,
      totalDespesaEmpenhada,
      totalDespesaLiquidada,
      totalDespesaPaga,
      superavitDeficitOrcamentario,
    },
  };
}

// --- Balanço Patrimonial ---
export async function generateBalancoPatrimonial(db: Db, filter: ReportFilter) {
  const accounts = await db.accountingPlan.findMany({
    include: {
      entries: {
        where: {
          transaction: {
            financialYearId: filter.financialYearId,
            status: "POSTADO",
            ...(filter.startDate || filter.endDate ? { date: dateFilter(filter) } : {}),
          },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  // Ativo: Contas da classe 1 (Ativo Circulante e Não Circulante)
  const ativo = accounts.filter((acc) => acc.code.startsWith("1")).map((acc) => {
    const debit = acc.entries.filter((e) => e.type === "Débito").reduce((s, e) => s + Number(e.valueDecimal), 0);
    const credit = acc.entries.filter((e) => e.type === "Crédito").reduce((s, e) => s + Number(e.valueDecimal), 0);
    return { code: acc.code, name: acc.name, balance: debit - credit };
  });

  // Passivo: Contas da classe 2 (EXCETO classe 2.3 que é Patrimônio Líquido)
  const passivo = accounts.filter((acc) => acc.code.startsWith("2.") && !acc.code.startsWith("2.3")).map((acc) => {
    const debit = acc.entries.filter((e) => e.type === "Débito").reduce((s, e) => s + Number(e.valueDecimal), 0);
    const credit = acc.entries.filter((e) => e.type === "Crédito").reduce((s, e) => s + Number(e.valueDecimal), 0);
    return { code: acc.code, name: acc.name, balance: credit - debit };
  });

  // Patrimônio Líquido: Exclusivamente contas da classe 2.3
  const patrimonioLiquido = accounts.filter((acc) => acc.code.startsWith("2.3")).map((acc) => {
    const debit = acc.entries.filter((e) => e.type === "Débito").reduce((s, e) => s + Number(e.valueDecimal), 0);
    const credit = acc.entries.filter((e) => e.type === "Crédito").reduce((s, e) => s + Number(e.valueDecimal), 0);
    return { code: acc.code, name: acc.name, balance: credit - debit };
  });

  const totalAtivo = ativo.reduce((s, a) => s + a.balance, 0);
  const totalPassivo = passivo.reduce((s, p) => s + p.balance, 0);
  const totalPatrimonioLiquido = patrimonioLiquido.reduce((s, pl) => s + pl.balance, 0);

  return {
    ativo,
    passivo,
    patrimonioLiquido,
    totais: {
      totalAtivo,
      totalPassivo,
      totalPatrimonioLiquido,
      balancoEquilibrado: Math.abs(totalAtivo - (totalPassivo + totalPatrimonioLiquido)) < 0.01,
    },
  };
}

// --- Balanço Financeiro (MCASP / Anexo 13 da Lei 4.320/64) ---
export async function generateBalancoFinanceiro(db: Db, filter: ReportFilter) {
  const [rreo, financialYear, treasuryMovements, withholdings] = await Promise.all([
    generateRREO(db, filter),
    db.financialYear.findUnique({ where: { id: filter.financialYearId }, select: { startDate: true, endDate: true } }),
    db.treasuryMovement.findMany({
      where: {
        status: "Confirmado",
        bankAccount: {
          isActive: true,
          ...(filter.budgetUnitId ? { budgetUnitId: filter.budgetUnitId } : {}),
        },
      },
      select: { date: true, direction: true, valueDecimal: true },
    }),
    db.withholdingPayable.findMany({
      where: filter.budgetUnitId
        ? {
            retention: {
              payment: {
                commitment: {
                  appropriation: {
                    budgetUnitId: filter.budgetUnitId,
                  },
                },
              },
            },
          }
        : {},
    }),
  ]);
  if (!financialYear) throw new Error("Exercício financeiro não encontrado para o Balanço Financeiro.");

  const receitaOrcamentariaRealizada = rreo.revenueSummary.reduce((s, r) => s + r.realizedValue, 0);
  const despesaOrcamentariaPaga = rreo.expenseSummary.reduce((s, e) => s + e.paidValue, 0);

  const receitasExtraorcamentarias = withholdings
    .filter((w) => w.status === "Recolhida" || w.status === "Pendente")
    .reduce((s, w) => s + Number(w.valueDecimal), 0);

  const despesasExtraorcamentarias = withholdings
    .filter((w) => w.status === "Recolhida")
    .reduce((s, w) => s + Number(w.valueDecimal), 0);

  const signedTreasuryValue = (direction: string, value: number) => {
    if (["Entrada", "CREDIT"].includes(direction)) return Math.abs(value);
    if (["Saída", "DEBIT"].includes(direction)) return -Math.abs(value);
    throw new Error(`Direção de tesouraria inválida no Balanço Financeiro: ${direction}.`);
  };
  const saldoInicialCaixaBancos = treasuryMovements
    .filter((movement) => movement.date < financialYear.startDate)
    .reduce((total, movement) => total + signedTreasuryValue(movement.direction, Number(movement.valueDecimal)), 0);
  const saldoAtualCaixaBancos = treasuryMovements
    .filter((movement) => movement.date <= financialYear.endDate)
    .reduce((total, movement) => total + signedTreasuryValue(movement.direction, Number(movement.valueDecimal)), 0);

  const totalIngressos = receitaOrcamentariaRealizada + receitasExtraorcamentarias + saldoInicialCaixaBancos;
  const totalDispendios = despesaOrcamentariaPaga + despesasExtraorcamentarias + saldoAtualCaixaBancos;

  return {
    ingressos: {
      receitaOrcamentaria: receitaOrcamentariaRealizada,
      receitaExtraorcamentaria: receitasExtraorcamentarias,
      saldoExercícioAnterior: saldoInicialCaixaBancos,
      totalIngressos,
    },
    dispendios: {
      despesaOrcamentaria: despesaOrcamentariaPaga,
      despesaExtraorcamentaria: despesasExtraorcamentarias,
      saldoExercícioSeguinte: saldoAtualCaixaBancos,
      totalDispendios,
    },
    equilibrado: Math.abs(totalIngressos - totalDispendios) < 0.01,
  };
}

// --- Demonstração das Variações Patrimoniais (DVP / MCASP) ---
export async function generateDVP(db: Db, filter: ReportFilter) {
  const accounts = await db.accountingPlan.findMany({
    include: {
      entries: {
        where: {
          transaction: {
            financialYearId: filter.financialYearId,
            status: "POSTADO",
            ...(filter.startDate || filter.endDate ? { date: dateFilter(filter) } : {}),
          },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  // VPA: Variações Patrimoniais Aumentativas (Classe 4 do PCASP)
  const vpaAccounts = accounts.filter((acc) => acc.code.startsWith("4"));
  const vpa = vpaAccounts.map((acc) => {
    const credit = acc.entries.filter((e) => e.type === "Crédito").reduce((s, e) => s + Number(e.valueDecimal), 0);
    const debit = acc.entries.filter((e) => e.type === "Débito").reduce((s, e) => s + Number(e.valueDecimal), 0);
    return { code: acc.code, name: acc.name, value: credit - debit };
  }).filter((acc) => Math.abs(acc.value) > 0.001);

  // VPD: Variações Patrimoniais Diminuídas (Classe 3 do PCASP)
  const vpdAccounts = accounts.filter((acc) => acc.code.startsWith("3"));
  const vpd = vpdAccounts.map((acc) => {
    const debit = acc.entries.filter((e) => e.type === "Débito").reduce((s, e) => s + Number(e.valueDecimal), 0);
    const credit = acc.entries.filter((e) => e.type === "Crédito").reduce((s, e) => s + Number(e.valueDecimal), 0);
    return { code: acc.code, name: acc.name, value: debit - credit };
  }).filter((acc) => Math.abs(acc.value) > 0.001);

  const totalVPA = vpa.reduce((s, a) => s + a.value, 0);
  const totalVPD = vpd.reduce((s, a) => s + a.value, 0);
  const resultadoPatrimonial = totalVPA - totalVPD;

  return {
    variacoesAumentativas: vpa,
    variacoesDiminuidas: vpd,
    totais: {
      totalVPA,
      totalVPD,
      resultadoPatrimonial,
      situacao: resultadoPatrimonial >= 0 ? "SUPERAVIT_PATRIMONIAL" : "DEFICIT_PATRIMONIAL",
    },
  };
}

// --- Demonstração dos Fluxos de Caixa (DFC / MCASP) ---
export async function generateDemonstracaoFluxosCaixa(db: Db, filter: ReportFilter) {
  const [bf] = await Promise.all([generateBalancoFinanceiro(db, filter)]);

  const fluxoOperacional = bf.ingressos.receitaOrcamentaria - bf.dispendios.despesaOrcamentaria;
  const fluxoInvestimento = 0; // Recursos direcionados a investimentos fixos
  const fluxoFinanciamento = bf.ingressos.receitaExtraorcamentaria - bf.dispendios.despesaExtraorcamentaria;
  const geracaoLiquidaCaixa = fluxoOperacional + fluxoInvestimento + fluxoFinanciamento;

  return {
    fluxoOperacional,
    fluxoInvestimento,
    fluxoFinanciamento,
    geracaoLiquidaCaixa,
    saldoInicialCaixa: bf.ingressos.saldoExercícioAnterior,
    saldoFinalCaixa: bf.dispendios.saldoExercícioSeguinte,
    conciliado: Math.abs((bf.ingressos.saldoExercícioAnterior + geracaoLiquidaCaixa) - bf.dispendios.saldoExercícioSeguinte) < 0.01,
  };
}

// --- Prestação de Contas Anual Completa (PCA) ---
export async function generatePCA(db: Db, filter: ReportFilter) {
  const [
    balancoOrcamentario,
    balancoPatrimonial,
    balancoFinanceiro,
    dvp,
    dfc,
    rreo,
    rgf,
  ] = await Promise.all([
    generateBalancoOrcamentario(db, filter),
    generateBalancoPatrimonial(db, filter),
    generateBalancoFinanceiro(db, filter),
    generateDVP(db, filter),
    generateDemonstracaoFluxosCaixa(db, filter),
    generateRREO(db, filter),
    generateRGF(db, filter),
  ]);

  const notasExplicativas = [
    {
      num: 1,
      titulo: "Contexto Operacional e Unidades Gestoras",
      conteudo: "A Prestação de Contas Anual consolida a execução orçamentária, financeira e patrimonial do Município de Lagoa Seca, abrangendo a Administração Direta e Indireta.",
    },
    {
      num: 2,
      titulo: "Critérios de Apuração Orçamentária e Patrimonial",
      conteudo: "As receitas orçamentárias foram reconhecidas pelo regime de caixa e as despesas pelo regime de competência/empenho, observando rigorosamente os ditames do MCASP e da LRF (LC 101/2000).",
    },
    {
      num: 3,
      titulo: "Cumprimento dos Limites Legais Fiscais (LRF)",
      conteudo: `A Despesa Total com Pessoal encerrou o período em ${rgf.percentualAtingido}% da RCL, em situação ${rgf.situacao} perante o limite legal de ${rgf.limiteLegal}%.`,
    },
  ];

  return {
    exercicioFiscalId: filter.financialYearId,
    dataEmissao: new Date().toISOString(),
    statusConformidade: rgf.situacao === "EXCEDIDO" ? "IRREGULAR" : "REGULAR_COM_ATENCAO",
    demonstrativos: {
      balancoOrcamentario,
      balancoPatrimonial,
      balancoFinanceiro,
      dvp,
      dfc,
      rreo,
      rgf,
    },
    notasExplicativas,
  };
}
