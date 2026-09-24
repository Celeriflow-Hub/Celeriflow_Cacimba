import assert from "node:assert/strict";
import test from "node:test";
import { calculateRetentions } from "../src/lib/financeiro/retencoes.ts";
import { runMockIntegration } from "../src/lib/integrations/registry.ts";
import { exportPublicDataCSV, exportPublicDataTXT, getPublicExpenses, getPublicRevenues, parsePublicDataFilter } from "../src/lib/transparencia/portal-fiscal.ts";
import { financialReportFilename, generateFinancialReportCsv, generateInternalReportDataset, isFinancialReportType, isReportFormat, isReportMonth, reportDatasetCsv, reportRequiresMonth } from "../src/lib/financeiro/report-delivery.ts";
import { generateReportPdf } from "../src/lib/financeiro/report-export.ts";
import { generatePcaPrintHtml, generateBudgetComparisonPrintHtml, generateRetentionPrintHtml, generateBankStatementPrintHtml } from "../src/lib/financeiro/report-print.ts";
import { getPublicBiddings, getPublicContracts, getPublicFinancialReportSnapshots, getPublicHelpFaqAndContactInfo, isPublicFinancialReportType, publicFinancialReportDocumentType } from "../src/lib/transparencia/portal-public.ts";

test("calcula retenções com base e alíquota configuradas", () => {
  const [retention] = calculateRetentions(1_000, [
    { type: "INSS", calculationBasePercentage: 20, ratePercentage: 11 },
  ]);

  assert.equal(retention.baseValue.toString(), "200");
  assert.equal(retention.retainedValue.toString(), "22");
});

test("valida e normaliza filtros da API pública", () => {
  const filter = parsePublicDataFilter(new URLSearchParams("year=2026&page=2&pageSize=25&search=saude"));

  assert.deepEqual(filter, { year: 2026, page: 2, pageSize: 25, search: "saude" });
  assert.throws(() => parsePublicDataFilter(new URLSearchParams("pageSize=101")));
  assert.throws(() => parsePublicDataFilter(new URLSearchParams("revenueClassification=SIGILOSA")));
});

test("neutraliza fórmulas em exportações CSV", () => {
  const csv = exportPublicDataCSV([{ beneficiary: "=HYPERLINK(\"https://invalid.example\")" }]);

  assert.match(csv, /"'=HYPERLINK/);
  assert.doesNotMatch(csv, /\n"=HYPERLINK/);
  assert.match(exportPublicDataCSV([{ value: "\t=1+1" }]), /"'\t=1\+1"/);
});

test("projeta despesa pública sem identificadores internos ou dados pessoais", async () => {
  let where: unknown;
  const db = {
    commitment: {
      count: async ({ where: receivedWhere }: { where: unknown }) => {
        where = receivedWhere;
        return 1;
      },
      findMany: async () => [{
        id: "internal-commitment-id",
        number: "EMP-2026-001",
        date: new Date("2026-02-01T00:00:00.000Z"),
        value: 100,
        valueDecimal: null,
        status: "Pago",
        updatedAt: new Date("2026-02-03T00:00:00.000Z"),
        purchaseReceipt: { number: "REC-2026-001", receivedAt: new Date("2026-01-31T00:00:00.000Z") },
        creditor: { name: "Maria da Silva", document: "12345678901", personId: "person-1" },
        supplier: { person: { cpf: "12345678901" }, company: null },
        appropriation: {
          code: "02.001.10.301.0001.2001.3.3.90.30",
          budgetUnit: { code: "02.001", name: "Fundo Municipal de Saúde" },
          expenseNature: { code: "3.3.90.30", name: "Material de Consumo" },
          resourceSource: { code: "500", name: "Recursos não vinculados" },
        },
        settlements: [{ date: new Date("2026-02-02T00:00:00.000Z"), value: 100, valueDecimal: null }],
        payments: [{ date: new Date("2026-02-03T00:00:00.000Z"), value: 100, valueDecimal: null }],
      }],
    },
  } as never;

  const result = await getPublicExpenses(db, { budgetUnitCode: "02.001", resourceSourceCode: "500" });
  const row = result.data[0];

  assert.equal(row.supplierName, "PESSOA FÍSICA");
  assert.equal(row.supplierDocumentMasked, "***.456.789-**");
  assert.equal(row.committedValue, 100);
  assert.equal(row.settledValue, 100);
  assert.equal(row.paidValue, 100);
  assert.equal(row.paidPaymentCount, 1);
  assert.equal(row.receiptNumber, "REC-2026-001");
  assert.ok(row.receiptDate);
  assert.equal(row.receiptDate.toISOString(), "2026-01-31T00:00:00.000Z");
  assert.equal("id" in row, false);
  assert.equal("history" in row, false);
  assert.match(JSON.stringify(where), /budgetUnit/);
  assert.match(JSON.stringify(where), /resourceSource/);
});

test("projeta receita arrecadada com classificação, fonte e unidade disponíveis", async () => {
  const db = {
    revenue: {
      count: async () => 1,
      findMany: async () => [{
        id: "internal-revenue-id",
        date: new Date("2026-02-01T00:00:00.000Z"),
        launchDate: new Date("2026-01-15T00:00:00.000Z"),
        collectionDate: new Date("2026-02-01T00:00:00.000Z"),
        value: 250,
        valueDecimal: null,
        status: "Arrecadada",
        classification: "ORCAMENTARIA",
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
        revenueNature: { code: "1.1.1.3.03.1.1", name: "Imposto sobre a Renda" },
        resourceSource: { code: "500", name: "Recursos não vinculados" },
        bankAccount: { budgetUnit: { code: "02.001", name: "Fundo Municipal de Saúde" } },
      }],
    },
  } as never;

  const result = await getPublicRevenues(db, { revenueClassification: "ORCAMENTARIA" });
  const row = result.data[0];

  assert.equal(row.classification, "ORCAMENTARIA");
  assert.equal(row.resourceSourceCode, "500");
  assert.equal(row.budgetUnitCode, "02.001");
  assert.equal(row.value, 250);
  assert.equal("id" in row, false);
});

test("executa conectores externos em modo mock sem chamada de rede", () => {
  const result = runMockIntegration("SICONFI", "HEALTH_CHECK");

  assert.equal(result.status, "SUCESSO");
  assert.equal(result.evidence.dispatch, "MOCK");
  assert.match(result.externalId, /^MOCK-SICONFI-/);
});

test("aceita apenas tipos internos de relatório e gera nome CSV previsível", () => {
  assert.equal(isFinancialReportType("RREO"), true);
  assert.equal(isFinancialReportType("BALANCETE_MENSAL"), true);
  assert.equal(isFinancialReportType("LOA_ANEXO_PROGRAMACAO"), true);
  assert.equal(isFinancialReportType("PDF"), false);
  assert.equal(isReportFormat("PDF"), true);
  assert.equal(isReportFormat("HTML"), false);
  assert.equal(isReportMonth(1), true);
  assert.equal(isReportMonth(13), false);
  assert.equal(reportRequiresMonth("BALANCETE_MENSAL"), true);
  assert.equal(reportRequiresMonth("BALANCETE"), false);
  assert.equal(financialReportFilename("BALANCO_PATRIMONIAL", 2026), "relatorio-balanco_patrimonial-2026.csv");
});

test("gera PDF binário a partir do conjunto canônico", async () => {
  const dataset = {
    title: "Relatório interno de teste",
    year: 2026,
    warnings: ["Uso interno."],
    metadata: {
      status: "INTERNAL_PARTIAL" as const,
      scope: "Teste",
      referencePeriod: "Exercício 2026",
      statutoryCompleteness: "NOT_STATUTORY" as const,
      publicSnapshotEligible: false,
      publicSnapshotCondition: "Não aprovado para snapshot público.",
    },
    sections: [{ title: "Dados", rows: [{ descricao: "=não é fórmula", valor: 10 }] }],
  };
  const pdf = await generateReportPdf(dataset);
  const csv = reportDatasetCsv(dataset);

  assert.equal(Buffer.from(pdf).subarray(0, 5).toString("ascii"), "%PDF-");
  assert.match(csv.csv, /"'=não é fórmula"/);
  assert.match(csv.csv, /"Metadados do relatório"/);
  assert.match(csv.csv, /"INTERNAL_PARTIAL"/);
});

test("reconhece apenas relatórios legais publicáveis e cria uma chave estável para o snapshot", () => {
  assert.equal(isPublicFinancialReportType("RREO"), true);
  assert.equal(isPublicFinancialReportType("DIARIO"), false);
  assert.equal(publicFinancialReportDocumentType("year-2026", "RGF"), "PUBLIC_FINANCIAL_REPORT:year-2026:RGF");
});

test("lista apenas snapshots publicados e impede balanços antes do encerramento anual", async () => {
  const db = {
    financialYear: {
      findMany: async () => [
        { id: "year-open", year: 2026, annualAccountingCloses: [] },
        { id: "year-closed", year: 2025, annualAccountingCloses: [{ status: "ENCERRADO", closedAt: new Date("2026-02-01T00:00:00.000Z") }] },
      ],
    },
    document: {
      findMany: async () => [
        { id: "rreo", documentType: publicFinancialReportDocumentType("year-open", "RREO"), versions: [{ versionNumber: 2, finalizedAt: new Date("2026-03-01T00:00:00.000Z") }] },
        { id: "open-balance", documentType: publicFinancialReportDocumentType("year-open", "BALANCO_PATRIMONIAL"), versions: [{ versionNumber: 1, finalizedAt: new Date("2026-03-01T00:00:00.000Z") }] },
        { id: "closed-balance", documentType: publicFinancialReportDocumentType("year-closed", "BALANCO_ORCAMENTARIO"), versions: [{ versionNumber: 1, finalizedAt: new Date("2026-02-02T00:00:00.000Z") }] },
      ],
    },
  } as never;

  const reports = await getPublicFinancialReportSnapshots(db);

  assert.deepEqual(reports.map((report) => `${report.year}:${report.type}:v${report.version}`), ["2026:RREO:v2", "2025:BALANCO_ORCAMENTARIO:v1"]);
});

test("projeta contratos e licitações sem ids internos, rascunhos ou identificação de pessoa física", async () => {
  const db = {
    contract: {
      findMany: async () => [{
        id: "contract-internal-id",
        number: "CT-001/2026",
        object: "Aquisição de materiais",
        initialValue: 100,
        updatedValue: 120,
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: new Date("2026-12-31T00:00:00.000Z"),
        status: "Vigente",
        supplier: { person: { fullName: "Maria da Silva", cpf: "12345678901" }, company: null },
        process: { number: "PROC-001/2026", modality: "Pregão" },
        secretariat: { name: "Saúde" },
      }],
    },
    bidding: {
      findMany: async () => [{
        id: "bidding-internal-id",
        number: "PE-010/2026",
        modality: "Pregão",
        status: "Publicada",
        publicationDate: new Date("2026-01-10T00:00:00.000Z"),
        sessionDate: new Date("2026-01-20T00:00:00.000Z"),
        process: { number: "PROC-001/2026", object: "Aquisição de materiais", estimatedValue: 100, secretariat: { name: "Saúde" } },
      }],
    },
  } as never;

  const [contracts, biddings] = await Promise.all([getPublicContracts(db), getPublicBiddings(db)]);

  assert.equal(contracts[0].supplier.name, "PESSOA FÍSICA");
  assert.equal(contracts[0].supplier.documentMasked, "***.456.789-**");
  assert.equal("id" in contracts[0], false);
  assert.equal(biddings[0].processNumber, "PROC-001/2026");
  assert.equal("id" in biddings[0], false);
});

test("entrega o Diário canônico como CSV seguro", async () => {
  const db = {
    accountingTransaction: {
      findMany: async () => [{
        id: "transaction-1",
        date: new Date("2026-01-02T00:00:00.000Z"),
        history: "=FORMULA",
        entries: [{
          accountId: "account-1",
          account: { code: "1.1.1", name: "Caixa" },
          type: "Débito",
          valueDecimal: 100,
        }],
      }],
    },
  } as never;

  const result = await generateFinancialReportCsv(db, "DIARIO", "year-2026");

  assert.equal(result.rowCount, 2);
  assert.match(result.csv, /"data","historico","contaCodigo"/);
  assert.match(result.csv, /"'=FORMULA"/);
});

test("gera balancete mensal com período e situação de fechamento explícitos", async () => {
  const db = {
    accountingPlan: {
      findMany: async () => [{
        id: "account-1",
        code: "1.1.1",
        name: "Caixa",
        entries: [
          { type: "Débito", valueDecimal: 120 },
          { type: "Crédito", valueDecimal: 20 },
        ],
      }],
    },
    monthlyAccountingClose: {
      findMany: async () => [{
        competence: new Date("2026-02-01T00:00:00.000Z"),
        status: "ENCERRADO",
        closedAt: new Date("2026-03-01T00:00:00.000Z"),
        pendingSummary: null,
      }],
    },
  } as never;

  const report = await generateInternalReportDataset(db, "BALANCETE_MENSAL", "year-2026", 2026, { month: 2 });

  assert.equal(report.metadata.scope, "Mensal");
  assert.equal(report.metadata.referencePeriod, "Fevereiro de 2026");
  assert.equal(report.metadata.publicSnapshotEligible, false);
  assert.equal(report.sections[0].rows[0].situacao, "ENCERRADO");
  assert.equal(report.sections[1].rows[0].saldoMovimentacao, 100);
  await assert.rejects(() => generateInternalReportDataset(db, "BALANCETE_MENSAL", "year-2026", 2026), /mês válido/);
});

test("gera relatório de conciliações e síntese anual somente a partir dos registros internos", async () => {
  const db = {
    bankReconciliation: {
      findMany: async () => [{
        date: new Date("2026-03-01T00:00:00.000Z"),
        periodStart: new Date("2026-02-01T00:00:00.000Z"),
        periodEnd: new Date("2026-02-28T00:00:00.000Z"),
        systemBalance: 100,
        systemBalanceDecimal: null,
        bankBalance: 90,
        bankBalanceDecimal: null,
        status: "Divergente",
        bankAccount: {
          bankName: "Banco Municipal",
          agency: "0001",
          accountNumber: "123-4",
          accountType: "Movimento",
          budgetUnit: { code: "02.001", name: "Saúde" },
          resourceSource: { code: "500", name: "Ordinários" },
        },
      }],
    },
    treasuryMovement: {
      findMany: async () => [
        { bankAccountId: "bank-1", type: "Revenue", direction: "Entrada", valueDecimal: 200, bankAccount: { bankName: "Banco Municipal", agency: "0001", accountNumber: "123-4", budgetUnit: { code: "02.001", name: "Saúde" }, resourceSource: { code: "500", name: "Ordinários" } } },
        { bankAccountId: "bank-1", type: "Payment", direction: "Saída", valueDecimal: 80, bankAccount: { bankName: "Banco Municipal", agency: "0001", accountNumber: "123-4", budgetUnit: { code: "02.001", name: "Saúde" }, resourceSource: { code: "500", name: "Ordinários" } } },
      ],
    },
  } as never;

  const reconciliation = await generateInternalReportDataset(db, "CONCILIACAO_TESOURARIA", "year-2026", 2026);
  const balance = await generateInternalReportDataset(db, "BALANCO_FINANCEIRO", "year-2026", 2026);

  assert.equal(reconciliation.metadata.status, "INTERNAL_PARTIAL");
  assert.equal(reconciliation.sections[0].rows[0].diferenca, 10);
  assert.equal(reconciliation.sections[1].rows[0].quantidade, 1);
  assert.equal(balance.metadata.publicSnapshotEligible, false);
  assert.equal(balance.sections[2].rows[0].fluxoLiquido, 120);
  assert.match(balance.warnings.join(" "), /não constitui Balanço Financeiro oficial/);
});

test("gera modelo interno de PCA com notas técnicas e campos de assinatura sujeitos à homologação", () => {
  const html = generatePcaPrintHtml({
    year: 2026,
    budgetBalance: { totalReceita: 15000000, totalDespesa: 14500000, resultado: 500000 },
    balanceSheet: { totalAtivo: 20000000, totalPassivo: 5000000, patrimonioLiquido: 15000000 },
    financialBalance: { totalIngressos: 18000000, totalDispendios: 17000000, saldoFinal: 1000000 },
    dvp: { totalVPA: 16000000, totalVPD: 14000000, resultadoPatrimonial: 2000000 },
    dfc: { fluxoOperacional: 1200000, fluxoInvestimento: -400000, fluxoFinanciamento: 0, variacaoCaixa: 800000 },
  });

  assert.match(html, /MODELO INTERNO DE PCA — EXERCÍCIO 2026/);
  assert.match(html, /Notas técnicas para validação \(referência NBC TSP \/ MCASP\)/);
  assert.match(html, /Prefeito \/ Gestor Municipal/);
  assert.match(html, /Contador Responsável/);
  assert.match(html, /Controlador Interno/);
});

test("gera leiaute imprimível do comparativo LOA original vs alterada por créditos adicionais", () => {
  const html = generateBudgetComparisonPrintHtml({
    lawNumber: "LOA-2026/001",
    totalFixadoOriginal: 15000000,
    totalCreditosAdicionais: 500000,
    totalAtualizado: 15500000,
    variacaoPercentual: 3.33,
    dotacoesComparativo: [
      {
        code: "0101.04.122.0001.2002.3.3.90.30.00",
        budgetUnit: "0101 - Prefeitura Municipal",
        expenseNature: "3.3.90.30 - Material de Consumo",
        valorInicial: 100000,
        valorAtualizado: 150000,
        variacaoCredito: 50000,
        valorEmpenhado: 80000,
        valorDisponivel: 70000,
      },
    ],
  });

  assert.match(html, /DEMONSTRATIVO COMPARATIVO LOA \(ORIGINAL VS ALTERADA\)/);
  assert.match(html, /Fixação Inicial \(LOA Original\)/);
  assert.match(html, /Créditos Efetivados/);
  assert.match(html, /Diretor de Orçamento \/ Planejamento/);
});

test("gera comprovante técnico preliminar de retenção tributária e previdenciária", () => {
  const html = generateRetentionPrintHtml({
    number: "RET-000145",
    date: "02/08/2026",
    paymentNumber: "OP-2026/00089",
    settlementNumber: "NL-2026/00089",
    commitmentNumber: "NE-2026/00120",
    creditorName: "Empresa Construtora Lagoa Seca Ltda",
    creditorDocument: "00.123.456/0001-89",
    calculationBase: 50000,
    retentionType: "INSS - Retenção 11%",
    ratePercentage: 11,
    retentionValue: 5500,
    destinationAccount: "2.1.8.8.1.01.00 - Consignações Extraorçamentárias A Recolher",
  });

  assert.match(html, /COMPROVANTE TÉCNICO PRELIMINAR DE RETENÇÃO TRIBUTÁRIA E PREVIDENCIÁRIA/);
  assert.match(html, /INSS - Retenção 11%/);
  assert.match(html, /Agente Arrecadador \/ Tesouraria/);
});

test("gera extrato de tesouraria e conciliacao imprimivel com saldo cronologico acumulado", () => {
  const html = generateBankStatementPrintHtml({
    bankAccountName: "Conta Movimento FPM",
    bankAgencyAccount: "0001/12345-6",
    startDate: "01/08/2026",
    endDate: "31/08/2026",
    openingBalance: 100000,
    closingBalance: 125000,
    statementItems: [
      {
        date: "02/08/2026",
        type: "Receita Arrecadada",
        history: "Repasse Cota FPM",
        direction: "ENTRADA",
        value: 50000,
        runningBalance: 150000,
      },
      {
        date: "03/08/2026",
        type: "Pagamento OP",
        history: "Pagamento Fornecedor OP-001",
        direction: "SAIDA",
        value: 25000,
        runningBalance: 125000,
      },
    ],
  });

  assert.match(html, /EXTRATO DE TESOURARIA — CONTA MOVIMENTO FPM/);
  assert.match(html, /Repasse Cota FPM/);
  assert.match(html, /Agente Financeiro \/ Tesouraria/);
});

test("exporta dados publicos em formato TXT tabulado higienizado e fornece informacoes de FAQ/Ajuda", () => {
  const txt = exportPublicDataTXT([
    { processo: "001/2026", valor: 15000, historico: "Aquisição de Merenda Escolar" },
  ]);

  assert.match(txt, /processo\tvalor\thistorico/);
  assert.match(txt, /001\/2026\t15000\tAquisição de Merenda Escolar/);

  const faqInfo = getPublicHelpFaqAndContactInfo();
  assert.equal(faqInfo.faq.length, 4);
  assert.match(faqInfo.portalInfo.title, /Lagoa Seca/);
  assert.match(faqInfo.contact.ombudsmanName, /Ouvidoria Geral/);
});
