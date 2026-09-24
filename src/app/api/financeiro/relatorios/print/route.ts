import { NextRequest, NextResponse } from "next/server";
import { AccessError, assertBudgetUnitAccess, getTenantContextForModuleOperation, isSystemAdministrator } from "@/lib/platform/tenant-context";
import {
  generateCommitmentPrintHtml,
  generateSettlementPrintHtml,
  generatePaymentPrintHtml,
  generatePcaPrintHtml,
  generateBalancoFinanceiroPrintHtml,
  generateBudgetComparisonPrintHtml,
  generateRetentionPrintHtml,
  generateBankStatementPrintHtml,
} from "@/lib/financeiro/report-print";
import { generatePCA, generateBalancoFinanceiro } from "@/lib/financeiro/relatorios-legais";
import { generateBudgetChangesComparison } from "@/lib/financeiro/planejamento";
import { generateTreasuryBankStatement } from "@/lib/financeiro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "issueReports");
    const documentType = request.nextUrl.searchParams.get("type");
    const id = request.nextUrl.searchParams.get("id");

    if (!documentType) {
      return NextResponse.json({ error: "Tipo de documento não informado." }, { status: 400 });
    }
    if (["PCA", "BALANCO_FINANCEIRO", "COMPARATIVO_ORCAMENTO"].includes(documentType) && !isSystemAdministrator(context.user)) {
      throw new AccessError("A impressão de demonstrativos consolidados é restrita ao administrador do sistema.", 403);
    }

    let html = "";

    switch (documentType) {
      case "EMPENHO": {
        if (!id) return NextResponse.json({ error: "ID do empenho não informado." }, { status: 400 });
        const commitment = await context.prisma.commitment.findUnique({
          where: { id },
          include: {
            appropriation: {
              include: {
                budgetUnit: true,
                expenseNature: true,
                resourceSource: true,
              },
            },
            creditor: true,
          },
        });
        if (!commitment) return NextResponse.json({ error: "Empenho não encontrado." }, { status: 404 });
        assertBudgetUnitAccess(context.user, commitment.appropriation.budgetUnit.id);

        html = generateCommitmentPrintHtml({
          number: commitment.number,
          date: commitment.date.toISOString().slice(0, 10),
          type: commitment.type,
          budgetUnitCode: commitment.appropriation.budgetUnit.code,
          budgetUnitName: commitment.appropriation.budgetUnit.name,
          appropriationCode: commitment.appropriation.code,
          resourceSourceCode: commitment.appropriation.resourceSource.code,
          resourceSourceName: commitment.appropriation.resourceSource.name,
          expenseNatureCode: commitment.appropriation.expenseNature.code,
          expenseNatureName: commitment.appropriation.expenseNature.name,
          creditorName: commitment.creditor?.name ?? "Credor Não Informado",
          creditorDocument: commitment.creditor?.document ?? "000.000.000-00",
          historical: commitment.history,
          value: Number(commitment.valueDecimal ?? commitment.value),
        });
        break;
      }

      case "LIQUIDACAO": {
        if (!id) return NextResponse.json({ error: "ID da liquidação não informado." }, { status: 400 });
        const settlement = await context.prisma.settlement.findUnique({
          where: { id },
          include: {
            commitment: {
              include: {
                appropriation: { include: { budgetUnit: true } },
                creditor: true,
              },
            },
          },
        });
        if (!settlement) return NextResponse.json({ error: "Liquidação não encontrada." }, { status: 404 });
        assertBudgetUnitAccess(context.user, settlement.commitment.appropriation.budgetUnit.id);

        const grossVal = Number(settlement.valueDecimal ?? settlement.value);

        html = generateSettlementPrintHtml({
          number: settlement.id.slice(0, 10),
          date: settlement.date.toISOString().slice(0, 10),
          commitmentNumber: settlement.commitment.number,
          budgetUnitName: settlement.commitment.appropriation.budgetUnit.name,
          creditorName: settlement.commitment.creditor?.name ?? "Credor Não Informado",
          creditorDocument: settlement.commitment.creditor?.document ?? "000.000.000-00",
          historical: settlement.notes ?? settlement.commitment.history,
          value: grossVal,
          withholdingsTotal: 0,
          netValue: grossVal,
          invoiceNumber: settlement.fiscalDocumentNumber ?? undefined,
          invoiceSeries: settlement.fiscalDocumentSeries ?? undefined,
          invoiceDate: settlement.fiscalDocumentIssueDate ? settlement.fiscalDocumentIssueDate.toISOString().slice(0, 10) : undefined,
          invoiceKey: settlement.fiscalDocumentAccessKey ?? undefined,
        });
        break;
      }

      case "PAGAMENTO": {
        if (!id) return NextResponse.json({ error: "ID do pagamento não informado." }, { status: 400 });
        const payment = await context.prisma.payment.findUnique({
          where: { id },
          include: {
            settlement: true,
            commitment: {
              include: {
                creditor: true,
              },
            },
            bankAccount: true,
          },
        });
        if (!payment) return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
        if (!payment.bankAccount.budgetUnitId) throw new AccessError("Pagamento sem Unidade Gestora vinculada.", 403);
        assertBudgetUnitAccess(context.user, payment.bankAccount.budgetUnitId);

        const gross = Number(payment.valueDecimal ?? payment.value);
        const net = Number(payment.netValueDecimal ?? gross);

        html = generatePaymentPrintHtml({
          number: payment.orderNumber,
          date: payment.date.toISOString().slice(0, 10),
          settlementNumber: payment.settlement?.id.slice(0, 10) ?? "N/A",
          commitmentNumber: payment.commitment.number,
          bankAccountName: payment.bankAccount.bankName,
          bankAgencyAccount: `${payment.bankAccount.agency} / ${payment.bankAccount.accountNumber}`,
          creditorName: payment.commitment.creditor?.name ?? "Credor Não Informado",
          creditorDocument: payment.commitment.creditor?.document ?? "000.000.000-00",
          grossValue: gross,
          withholdingValue: Math.max(0, gross - net),
          netPaidValue: net,
          historical: payment.commitment.history,
        });
        break;
      }

      case "PCA": {
        const yearParam = request.nextUrl.searchParams.get("year");
        const year = yearParam ? parseInt(yearParam, 10) : 2026;
        const financialYear = await context.prisma.financialYear.findUnique({ where: { year } });
        if (!financialYear) return NextResponse.json({ error: "Exercício financeiro não encontrado." }, { status: 404 });

        const pcaData = await generatePCA(context.prisma, { financialYearId: financialYear.id });
        const demos = pcaData.demonstrativos;

        html = generatePcaPrintHtml({
          year,
          budgetBalance: {
            totalReceita: demos.balancoOrcamentario.totais.totalReceitaRealizada,
            totalDespesa: demos.balancoOrcamentario.totais.totalDespesaPaga,
            resultado: demos.balancoOrcamentario.totais.superavitDeficitOrcamentario,
          },
          balanceSheet: {
            totalAtivo: demos.balancoPatrimonial.totais.totalAtivo,
            totalPassivo: demos.balancoPatrimonial.totais.totalPassivo,
            patrimonioLiquido: demos.balancoPatrimonial.totais.totalPatrimonioLiquido,
          },
          financialBalance: {
            totalIngressos: demos.balancoFinanceiro.ingressos.totalIngressos,
            totalDispendios: demos.balancoFinanceiro.dispendios.totalDispendios,
            saldoFinal: demos.balancoFinanceiro.dispendios.saldoExercícioSeguinte,
          },
          dvp: {
            totalVPA: demos.dvp.totais.totalVPA,
            totalVPD: demos.dvp.totais.totalVPD,
            resultadoPatrimonial: demos.dvp.totais.resultadoPatrimonial,
          },
          dfc: {
            fluxoOperacional: demos.dfc.fluxoOperacional,
            fluxoInvestimento: demos.dfc.fluxoInvestimento,
            fluxoFinanciamento: demos.dfc.fluxoFinanciamento,
            variacaoCaixa: demos.dfc.geracaoLiquidaCaixa,
          },
        });
        break;
      }

      case "BALANCO_FINANCEIRO": {
        const yearParam = request.nextUrl.searchParams.get("year");
        const year = yearParam ? parseInt(yearParam, 10) : 2026;
        const financialYear = await context.prisma.financialYear.findUnique({ where: { year } });
        if (!financialYear) return NextResponse.json({ error: "Exercício financeiro não encontrado." }, { status: 404 });

        const bf = await generateBalancoFinanceiro(context.prisma, { financialYearId: financialYear.id });

        html = generateBalancoFinanceiroPrintHtml({
          year,
          ingressos: bf.ingressos,
          dispendios: bf.dispendios,
        });
        break;
      }

      case "COMPARATIVO_ORCAMENTO": {
        const yearParam = request.nextUrl.searchParams.get("year");
        const year = yearParam ? parseInt(yearParam, 10) : 2026;
        const financialYear = await context.prisma.financialYear.findUnique({ where: { year } });
        if (!financialYear) return NextResponse.json({ error: "Exercício financeiro não encontrado." }, { status: 404 });

        const comp = await generateBudgetChangesComparison(context.prisma, financialYear.id);

        html = generateBudgetComparisonPrintHtml(comp);
        break;
      }

      case "RETENCAO": {
        const id = request.nextUrl.searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID da retenção é obrigatório." }, { status: 400 });

        const retention = await context.prisma.paymentRetention.findUnique({
          where: { id },
          include: {
            payment: {
              include: {
                settlement: {
                  include: {
                    commitment: { include: { appropriation: { select: { budgetUnitId: true } } } },
                  },
                },
              },
            },
          },
        });

        if (!retention || !retention.payment) {
          return NextResponse.json({ error: "Retenção não encontrada." }, { status: 404 });
        }
        const retentionBudgetUnitId = retention.payment.settlement?.commitment.appropriation.budgetUnitId;
        if (!retentionBudgetUnitId) throw new AccessError("Retenção sem Unidade Gestora vinculada.", 403);
        assertBudgetUnitAccess(context.user, retentionBudgetUnitId);

        const p = retention.payment;
        const s = p.settlement;
        const c = s?.commitment;
        const grossValue = s ? Number(s.valueDecimal) : Number(retention.valueDecimal);
        const retentionValue = Number(retention.valueDecimal);

        html = generateRetentionPrintHtml({
          number: `RET-${retention.id.slice(-6).toUpperCase()}`,
          date: retention.createdAt.toLocaleDateString("pt-BR"),
          paymentNumber: p.orderNumber || "OP-S/N",
          settlementNumber: c?.number ? `NL-${c.number}` : "NL-S/N",
          commitmentNumber: c?.number ? `NE-${c.number}` : "NE-S/N",
          creditorName: retention.beneficiaryName || "FAVORECIDO NÃO INFORMADO",
          creditorDocument: retention.beneficiaryDocument || "000.000.000-00",
          calculationBase: grossValue,
          retentionType: retention.type,
          ratePercentage: grossValue > 0 ? Number(((retentionValue / grossValue) * 100).toFixed(2)) : 0,
          retentionValue,
          destinationAccount: "2.1.8.8.1.01.00 - Consignações Extraorçamentárias A Recolher",
        });
        break;
      }

      case "EXTRATO_BANCARIO": {
        const bankAccountId = request.nextUrl.searchParams.get("bankAccountId");
        if (!bankAccountId) return NextResponse.json({ error: "bankAccountId é obrigatório." }, { status: 400 });
        const account = await context.prisma.bankAccount.findUnique({ where: { id: bankAccountId }, select: { budgetUnitId: true } });
        if (!account) return NextResponse.json({ error: "Conta bancária não encontrada." }, { status: 404 });
        if (!account.budgetUnitId) throw new AccessError("Conta bancária sem Unidade Gestora vinculada.", 403);
        assertBudgetUnitAccess(context.user, account.budgetUnitId);

        const startDateParam = request.nextUrl.searchParams.get("startDate");
        const endDateParam = request.nextUrl.searchParams.get("endDate");
        const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.UTC(2026, 0, 1));
        const endDate = endDateParam ? new Date(endDateParam) : new Date(Date.UTC(2026, 11, 31));

        const statement = await generateTreasuryBankStatement(context.prisma, { bankAccountId, startDate, endDate });

        html = generateBankStatementPrintHtml(statement);
        break;
      }

      default:
        return NextResponse.json({ error: "Tipo de impressão não suportado." }, { status: 400 });
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Erro ao gerar impressão técnica:", error);
    return NextResponse.json({ error: "Não foi possível gerar o documento imprimível." }, { status: 500 });
  }
}
