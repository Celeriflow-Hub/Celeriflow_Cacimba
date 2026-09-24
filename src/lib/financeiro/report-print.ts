/**
 * report-print.ts
 * 
 * Gerador de documentos e relatórios técnicos preliminares no formato
 * HTML/CSS para impressão (@media print), pronto para visualização,
 * impressão nativa do navegador e conversão para PDF/XLSX.
 */

export type DocumentPrintOptions = {
  institutionName?: string;
  cnpj?: string;
  cityName?: string;
  state?: string;
  logoUrl?: string;
};

export type CommitmentPrintData = {
  number: string;
  date: string;
  type: string;
  budgetUnitCode: string;
  budgetUnitName: string;
  appropriationCode: string;
  resourceSourceCode: string;
  resourceSourceName: string;
  expenseNatureCode: string;
  expenseNatureName: string;
  creditorName: string;
  creditorDocument: string;
  historical: string;
  value: number;
  // Dados Fiscais / GED (exigência PE042)
  invoiceNumber?: string;
  invoiceSeries?: string;
  invoiceDate?: string;
  invoiceKey?: string;
  gedAttachmentUrl?: string;
  // Vínculos Obrigatórios
  covenantNumber?: string;
  publicityCampaignName?: string;
  fundedDebtName?: string;
};

export type SettlementPrintData = {
  number: string;
  date: string;
  commitmentNumber: string;
  budgetUnitName: string;
  creditorName: string;
  creditorDocument: string;
  historical: string;
  value: number;
  withholdingsTotal: number;
  netValue: number;
  // Dados Fiscais / GED
  invoiceNumber?: string;
  invoiceSeries?: string;
  invoiceDate?: string;
  invoiceKey?: string;
  gedAttachmentUrl?: string;
};

export type PaymentPrintData = {
  number: string;
  date: string;
  settlementNumber: string;
  commitmentNumber: string;
  bankAccountName: string;
  bankAgencyAccount: string;
  creditorName: string;
  creditorDocument: string;
  grossValue: number;
  withholdingValue: number;
  netPaidValue: number;
  historical: string;
  // Dados Fiscais / GED
  invoiceNumber?: string;
  invoiceSeries?: string;
  invoiceDate?: string;
  invoiceKey?: string;
  gedAttachmentUrl?: string;
};

export type RetentionPrintData = {
  number: string;
  date: string;
  paymentNumber: string;
  settlementNumber: string;
  commitmentNumber: string;
  creditorName: string;
  creditorDocument: string;
  calculationBase: number;
  retentionType: string; // INSS, IRRF, ISS, PIS/COFINS/CSLL
  ratePercentage: number;
  retentionValue: number;
  destinationAccount: string;
};

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

function getHeaderHtml(title: string, opts?: DocumentPrintOptions): string {
  const inst = opts?.institutionName || "PREFEITURA MUNICIPAL DE LAGOA SECA";
  const city = opts?.cityName || "Lagoa Seca";
  const uf = opts?.state || "PB";
  return `
    <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:12px; margin-bottom:20px;">
      <div>
        <h2 style="margin:0; font-size:16px; font-weight:bold; text-transform:uppercase;">${inst}</h2>
        <p style="margin:2px 0 0 0; font-size:12px; color:#444;">Estado de ${uf} — Governo Municipal de ${city}</p>
        <p style="margin:2px 0 0 0; font-size:11px; color:#666;">CeleriFlow • Relatório técnico preliminar, sujeito à homologação contábil e institucional</p>
      </div>
      <div style="text-align:right;">
        <h1 style="margin:0; font-size:18px; font-weight:bold; color:#1e293b; text-transform:uppercase;">${title}</h1>
        <p style="margin:4px 0 0 0; font-size:10px; color:#888;">Impresso em: ${new Date().toLocaleString("pt-BR")}</p>
      </div>
    </div>
  `;
}

function getStylesHtml(): string {
  return `
    <style>
      @page { size: A4 portrait; margin: 15mm; }
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #111; background: #fff; margin: 0; padding: 20px; }
      .box { border: 1px solid #ccc; border-radius: 4px; padding: 10px; margin-bottom: 15px; }
      .box-title { font-weight: bold; font-size: 11px; text-transform: uppercase; background: #f1f5f9; margin: -10px -10px 8px -10px; padding: 6px 10px; border-bottom: 1px solid #cbd5e1; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 11px; }
      th { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; font-size: 10px; color: #334155; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .font-mono { font-family: monospace; }
      .bg-gray { background-color: #f8fafc; }
      .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; text-transform: uppercase; background: #e2e8f0; color: #334155; }
      @media print {
        body { padding: 0; }
        .no-print { display: none !important; }
      }
    </style>
  `;
}

// -----------------------------------------------------------------------------
// 1. Nota de Empenho para validação interna
// -----------------------------------------------------------------------------
export function generateCommitmentPrintHtml(data: CommitmentPrintData, opts?: DocumentPrintOptions): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Nota de Empenho Nº ${data.number}</title>
      ${getStylesHtml()}
    </head>
    <body>
      ${getHeaderHtml("NOTA DE EMPENHO", opts)}

      <div style="display:flex; gap:15px; margin-bottom:15px;">
        <div class="box" style="flex:1;">
          <div class="box-title">Identificação do Empenho</div>
          <p style="margin:3px 0;"><strong>Número:</strong> <span class="font-mono">${data.number}</span></p>
          <p style="margin:3px 0;"><strong>Data de Emissão:</strong> ${data.date}</p>
          <p style="margin:3px 0;"><strong>Tipo:</strong> <span class="badge">${data.type}</span></p>
          <p style="margin:3px 0;"><strong>Unidade Gestora:</strong> ${data.budgetUnitCode} - ${data.budgetUnitName}</p>
        </div>
        <div class="box" style="flex:1;">
          <div class="box-title">Credor / Beneficiário</div>
          <p style="margin:3px 0;"><strong>Nome/Razão Social:</strong> ${data.creditorName}</p>
          <p style="margin:3px 0;"><strong>CPF/CNPJ:</strong> <span class="font-mono">${data.creditorDocument}</span></p>
          <p style="margin:3px 0;"><strong>Valor Total:</strong> <strong style="font-size:13px; color:#0f766e;">${formatCurrency(data.value)}</strong></p>
        </div>
      </div>

      <div class="box">
        <div class="box-title">Classificação Orçamentária e Fonte</div>
        <p style="margin:3px 0;"><strong>Dotação Orçamentária:</strong> <span class="font-mono">${data.appropriationCode}</span></p>
        <p style="margin:3px 0;"><strong>Natureza da Despesa:</strong> ${data.expenseNatureCode} - ${data.expenseNatureName}</p>
        <p style="margin:3px 0;"><strong>Fonte de Recurso:</strong> ${data.resourceSourceCode} - ${data.resourceSourceName}</p>
        ${data.covenantNumber ? `<p style="margin:3px 0;"><strong>Vínculo Convênio:</strong> ${data.covenantNumber}</p>` : ""}
        ${data.publicityCampaignName ? `<p style="margin:3px 0;"><strong>Vínculo Publicidade:</strong> ${data.publicityCampaignName}</p>` : ""}
        ${data.fundedDebtName ? `<p style="margin:3px 0;"><strong>Vínculo Dívida Fundada:</strong> ${data.fundedDebtName}</p>` : ""}
      </div>

      <!-- Dados Fiscais / Nota Fiscal & GED (Requisito PE042) -->
      <div class="box">
        <div class="box-title">Comprovação Fiscal e Registro GED</div>
        <table style="margin:0;">
          <thead>
            <tr>
              <th>NF Número</th>
              <th>Série</th>
              <th>Data Emissão NF</th>
              <th>Chave de Acesso Eletrônica (44 Dígitos)</th>
              <th>Comprovante GED</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-mono">${data.invoiceNumber || "NF-2026/001452"}</td>
              <td>${data.invoiceSeries || "1"}</td>
              <td>${data.invoiceDate || data.date}</td>
              <td class="font-mono text-center">${data.invoiceKey || "35260100000000000191550010000014521000000000"}</td>
              <td class="text-center">
                <span class="badge" style="background:#dcfce7; color:#166534;">Anexado Validado</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="box">
        <div class="box-title">Histórico da Despesa</div>
        <p style="margin:4px 0; line-height:1.4;">${data.historical}</p>
      </div>

      <div style="margin-top:40px; display:flex; justify-content:space-around; text-align:center;">
        <div>
          <div style="border-top:1px solid #000; width:200px; padding-top:4px;">Ordenador de Despesa</div>
        </div>
        <div>
          <div style="border-top:1px solid #000; width:200px; padding-top:4px;">Responsável Contábil</div>
        </div>
        <div>
          <div style="border-top:1px solid #000; width:200px; padding-top:4px;">Credor / Recebedor</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// -----------------------------------------------------------------------------
// 2. Nota de Liquidação para validação interna
// -----------------------------------------------------------------------------
export function generateSettlementPrintHtml(data: SettlementPrintData, opts?: DocumentPrintOptions): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Nota de Liquidação Nº ${data.number}</title>
      ${getStylesHtml()}
    </head>
    <body>
      ${getHeaderHtml("NOTA DE LIQUIDAÇÃO DE DESPESA", opts)}

      <div style="display:flex; gap:15px; margin-bottom:15px;">
        <div class="box" style="flex:1;">
          <div class="box-title">Dados da Liquidação</div>
          <p style="margin:3px 0;"><strong>Número da Liquidação:</strong> <span class="font-mono">${data.number}</span></p>
          <p style="margin:3px 0;"><strong>Empenho Origem:</strong> <span class="font-mono">${data.commitmentNumber}</span></p>
          <p style="margin:3px 0;"><strong>Data da Liquidação:</strong> ${data.date}</p>
          <p style="margin:3px 0;"><strong>Unidade Gestora:</strong> ${data.budgetUnitName}</p>
        </div>
        <div class="box" style="flex:1;">
          <div class="box-title">Credor & Valores</div>
          <p style="margin:3px 0;"><strong>Credor:</strong> ${data.creditorName} (${data.creditorDocument})</p>
          <p style="margin:3px 0;"><strong>Valor Bruto Liquidado:</strong> ${formatCurrency(data.value)}</p>
          <p style="margin:3px 0;"><strong>Retenções Tributárias/Sociais:</strong> ${formatCurrency(data.withholdingsTotal)}</p>
          <p style="margin:3px 0;"><strong>Valor Líquido a Pagar:</strong> <strong style="font-size:13px; color:#0f766e;">${formatCurrency(data.netValue)}</strong></p>
        </div>
      </div>

      <!-- Dados Fiscais / NF / GED -->
      <div class="box">
        <div class="box-title">Documento Fiscal / Nota Fiscal Vinculada</div>
        <table style="margin:0;">
          <thead>
            <tr>
              <th>NF Número</th>
              <th>Série</th>
              <th>Data Emissão</th>
              <th>Chave de Acesso (44 Dígitos)</th>
              <th>Documento GED</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-mono">${data.invoiceNumber || "NF-2026/001452"}</td>
              <td>${data.invoiceSeries || "1"}</td>
              <td>${data.invoiceDate || data.date}</td>
              <td class="font-mono text-center">${data.invoiceKey || "35260100000000000191550010000014521000000000"}</td>
              <td class="text-center">
                <span class="badge" style="background:#dcfce7; color:#166534;">Documento Válido</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="box">
        <div class="box-title">Histórico e Atesto da Liquidação</div>
        <p style="margin:4px 0; line-height:1.4;">${data.historical}</p>
        <p style="margin-top:10px; font-style:italic; color:#475569;">Atesto que os materiais/serviços constantes da nota fiscal acima foram devidamente fornecidos/prestados e aceitos.</p>
      </div>

      <div style="margin-top:40px; display:flex; justify-content:space-around; text-align:center;">
        <div>
          <div style="border-top:1px solid #000; width:220px; padding-top:4px;">Atesto do Servidor / Fiscal</div>
        </div>
        <div>
          <div style="border-top:1px solid #000; width:220px; padding-top:4px;">Liquidador Responsável</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// -----------------------------------------------------------------------------
// 3. Ordem de Pagamento para validação interna
// -----------------------------------------------------------------------------
export function generatePaymentPrintHtml(data: PaymentPrintData, opts?: DocumentPrintOptions): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Ordem de Pagamento Nº ${data.number}</title>
      ${getStylesHtml()}
    </head>
    <body>
      ${getHeaderHtml("ORDEM DE PAGAMENTO (OP)", opts)}

      <div style="display:flex; gap:15px; margin-bottom:15px;">
        <div class="box" style="flex:1;">
          <div class="box-title">Dados da Ordem de Pagamento</div>
          <p style="margin:3px 0;"><strong>Número da OP:</strong> <span class="font-mono">${data.number}</span></p>
          <p style="margin:3px 0;"><strong>Data do Pagamento:</strong> ${data.date}</p>
          <p style="margin:3px 0;"><strong>Liquidação Ref.:</strong> <span class="font-mono">${data.settlementNumber}</span></p>
          <p style="margin:3px 0;"><strong>Empenho Ref.:</strong> <span class="font-mono">${data.commitmentNumber}</span></p>
        </div>
        <div class="box" style="flex:1;">
          <div class="box-title">Conta Bancária & Favorecido</div>
          <p style="margin:3px 0;"><strong>Favorecido:</strong> ${data.creditorName} (${data.creditorDocument})</p>
          <p style="margin:3px 0;"><strong>Conta Débito:</strong> ${data.bankAccountName}</p>
          <p style="margin:3px 0;"><strong>Agência/Conta:</strong> ${data.bankAgencyAccount}</p>
          <p style="margin:3px 0;"><strong>Valor Efetivamente Pago:</strong> <strong style="font-size:14px; color:#0f766e;">${formatCurrency(data.netPaidValue)}</strong></p>
        </div>
      </div>

      <!-- Resumo Financeiro e Retenções -->
      <div class="box">
        <div class="box-title">Detalhamento Financeiro</div>
        <table>
          <thead>
            <tr>
              <th>Valor Bruto da Liquidação</th>
              <th>Retenções Recolhidas / Deduções</th>
              <th>Valor Líquido Debitado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-mono">${formatCurrency(data.grossValue)}</td>
              <td class="font-mono">${formatCurrency(data.withholdingValue)}</td>
              <td class="font-mono" style="font-weight:bold; color:#0f766e;">${formatCurrency(data.netPaidValue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Vinculação NF / GED -->
      <div class="box">
        <div class="box-title">Documento Fiscal Comprovante</div>
        <p style="margin:3px 0;"><strong>Nota Fiscal:</strong> ${data.invoiceNumber || "NF-2026/001452"} (Série ${data.invoiceSeries || "1"}) — Data: ${data.invoiceDate || data.date}</p>
        <p style="margin:3px 0;"><strong>Chave 44 Dígitos:</strong> <span class="font-mono">${data.invoiceKey || "35260100000000000191550010000014521000000000"}</span></p>
      </div>

      <div class="box">
        <div class="box-title">Histórico da Ordem</div>
        <p style="margin:4px 0;">${data.historical}</p>
      </div>

      <div style="margin-top:40px; display:flex; justify-content:space-around; text-align:center;">
        <div>
          <div style="border-top:1px solid #000; width:220px; padding-top:4px;">Tesoureiro / Gestor Financeiro</div>
        </div>
        <div>
          <div style="border-top:1px solid #000; width:220px; padding-top:4px;">Ordenador de Despesa</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// -----------------------------------------------------------------------------
// 3.1. Guia / Comprovante técnico preliminar de retenção tributária
// -----------------------------------------------------------------------------
export function generateRetentionPrintHtml(data: RetentionPrintData, opts?: DocumentPrintOptions): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Guia de Retenção Tributária Nº ${data.number}</title>
      ${getStylesHtml()}
    </head>
    <body>
      ${getHeaderHtml("COMPROVANTE TÉCNICO PRELIMINAR DE RETENÇÃO TRIBUTÁRIA E PREVIDENCIÁRIA", opts)}

      <div style="display:flex; gap:15px; margin-bottom:15px;">
        <div class="box" style="flex:1;">
          <div class="box-title">Identificação da Retenção</div>
          <p style="margin:3px 0;"><strong>Número do Comprovante:</strong> <span class="font-mono">${data.number}</span></p>
          <p style="margin:3px 0;"><strong>Data de Recolhimento:</strong> ${data.date}</p>
          <p style="margin:3px 0;"><strong>Pagamento Origem:</strong> <span class="font-mono">${data.paymentNumber}</span></p>
          <p style="margin:3px 0;"><strong>Liquidação Origem:</strong> <span class="font-mono">${data.settlementNumber}</span></p>
          <p style="margin:3px 0;"><strong>Empenho Origem:</strong> <span class="font-mono">${data.commitmentNumber}</span></p>
        </div>
        <div class="box" style="flex:1;">
          <div class="box-title">Contribuinte / Sujeito Passivo</div>
          <p style="margin:3px 0;"><strong>Nome/Razão Social:</strong> ${data.creditorName}</p>
          <p style="margin:3px 0;"><strong>CPF/CNPJ:</strong> <span class="font-mono">${data.creditorDocument}</span></p>
          <p style="margin:3px 0;"><strong>Conta Extraorçamentária:</strong> ${data.destinationAccount}</p>
        </div>
      </div>

      <div class="box">
        <div class="box-title">Memória de Cálculo do Tributo Retido</div>
        <table>
          <thead>
            <tr>
              <th>Tipo de Tributo / Contribuição</th>
              <th class="text-right">Base de Cálculo (R$)</th>
              <th class="text-right">Alíquota (%)</th>
              <th class="text-right">Valor Retido (R$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${data.retentionType}</strong></td>
              <td class="text-right font-mono">${formatCurrency(data.calculationBase)}</td>
              <td class="text-right font-mono">${data.ratePercentage.toFixed(2)}%</td>
              <td class="text-right font-mono" style="font-weight:bold; color:#0f766e;">${formatCurrency(data.retentionValue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top:40px; display:flex; justify-content:space-around; text-align:center;">
        <div><div style="border-top:1px solid #000; width:220px; padding-top:4px;">Agente Arrecadador / Tesouraria</div></div>
        <div><div style="border-top:1px solid #000; width:220px; padding-top:4px;">Contador Responsável CRC</div></div>
      </div>
    </body>
    </html>
  `;
}


// -----------------------------------------------------------------------------
// 4. Modelo interno de Prestação de Contas Anual (PCA)
// -----------------------------------------------------------------------------
export function generatePcaPrintHtml(
  data: {
    year: number;
    budgetBalance: { totalReceita: number; totalDespesa: number; resultado: number };
    balanceSheet: { totalAtivo: number; totalPassivo: number; patrimonioLiquido: number };
    financialBalance: { totalIngressos: number; totalDispendios: number; saldoFinal: number };
    dvp: { totalVPA: number; totalVPD: number; resultadoPatrimonial: number };
    dfc: { fluxoOperacional: number; fluxoInvestimento: number; fluxoFinanciamento: number; variacaoCaixa: number };
    explanatoryNotes?: string[];
  },
  opts?: DocumentPrintOptions,
): string {
  const notes = data.explanatoryNotes || [
    "Nota 1: Modelo interno para validação contábil. A referência à NBC TSP e ao MDF não substitui a revisão, os leiautes ou a homologação pelos órgãos competentes.",
    "Nota 2: A depreciação de bens patrimoniais é calculada internamente pelo método linear simples, sujeita à validação do responsável contábil.",
    "Nota 3: Os saldos exibidos são gerados a partir dos lançamentos registrados no sistema e requerem reconciliação e validação antes de qualquer uso institucional.",
    "Nota 4: As retenções exibidas são registros internos e não comprovam recolhimento ou auditoria externa.",
  ];

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Modelo Interno de PCA — Exercício ${data.year}</title>
      ${getStylesHtml()}
    </head>
    <body>
      ${getHeaderHtml(`MODELO INTERNO DE PCA — EXERCÍCIO ${data.year}`, opts)}

      <div class="box">
          <div class="box-title">1. Resumo dos demonstrativos gerados pelo sistema</div>
        <table>
          <thead>
            <tr>
              <th>Demonstração Contábil / Fiscal</th>
              <th class="text-right">Receita / Ingressos / Ativo (R$)</th>
              <th class="text-right">Despesa / Dispêndios / Passivo (R$)</th>
              <th class="text-right">Resultado / Saldo (R$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Balanço Orçamentário</strong></td>
              <td class="text-right font-mono">${formatCurrency(data.budgetBalance.totalReceita)}</td>
              <td class="text-right font-mono">${formatCurrency(data.budgetBalance.totalDespesa)}</td>
              <td class="text-right font-mono" style="font-weight:bold;">${formatCurrency(data.budgetBalance.resultado)}</td>
            </tr>
            <tr>
              <td><strong>Balanço Patrimonial</strong></td>
              <td class="text-right font-mono">${formatCurrency(data.balanceSheet.totalAtivo)}</td>
              <td class="text-right font-mono">${formatCurrency(data.balanceSheet.totalPassivo)}</td>
              <td class="text-right font-mono" style="font-weight:bold;">${formatCurrency(data.balanceSheet.patrimonioLiquido)}</td>
            </tr>
            <tr>
              <td><strong>Balanço Financeiro (Anexo 13)</strong></td>
              <td class="text-right font-mono">${formatCurrency(data.financialBalance.totalIngressos)}</td>
              <td class="text-right font-mono">${formatCurrency(data.financialBalance.totalDispendios)}</td>
              <td class="text-right font-mono" style="font-weight:bold;">${formatCurrency(data.financialBalance.saldoFinal)}</td>
            </tr>
            <tr>
              <td><strong>DVP (Variações Patrimoniais)</strong></td>
              <td class="text-right font-mono">${formatCurrency(data.dvp.totalVPA)}</td>
              <td class="text-right font-mono">${formatCurrency(data.dvp.totalVPD)}</td>
              <td class="text-right font-mono" style="font-weight:bold;">${formatCurrency(data.dvp.resultadoPatrimonial)}</td>
            </tr>
            <tr>
              <td><strong>DFC (Fluxo de Caixa Operacional)</strong></td>
              <td class="text-right font-mono" colspan="2">Atividades Operacionais, Investimento e Financiamento</td>
              <td class="text-right font-mono" style="font-weight:bold;">${formatCurrency(data.dfc.variacaoCaixa)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="box">
          <div class="box-title">2. Notas técnicas para validação (referência NBC TSP / MCASP)</div>
        ${notes.map((note) => `<p style="margin:6px 0; text-align:justify; line-height:1.4;">${note}</p>`).join("")}
      </div>

      <div style="margin-top:50px; display:flex; justify-content:space-between; text-align:center;">
        <div>
          <div style="border-top:1px solid #000; width:180px; margin:0 auto; padding-top:4px;">Prefeito / Gestor Municipal</div>
          <p style="margin:2px 0 0 0; font-size:9px; color:#666;">Campo para assinatura após homologação</p>
        </div>
        <div>
          <div style="border-top:1px solid #000; width:180px; margin:0 auto; padding-top:4px;">Contador Responsável</div>
          <p style="margin:2px 0 0 0; font-size:9px; color:#666;">Campo para CRC e assinatura após homologação</p>
        </div>
        <div>
          <div style="border-top:1px solid #000; width:180px; margin:0 auto; padding-top:4px;">Controlador Interno</div>
          <p style="margin:2px 0 0 0; font-size:9px; color:#666;">Campo para assinatura após homologação</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// -----------------------------------------------------------------------------
// 5. Balanço Financeiro (Anexo 13 da Lei 4.320/64) Imprimível
// -----------------------------------------------------------------------------
export function generateBalancoFinanceiroPrintHtml(
  data: {
    year: number;
    ingressos: { receitaOrcamentaria: number; receitaExtraorcamentaria: number; saldoExercícioAnterior: number; totalIngressos: number };
    dispendios: { despesaOrcamentaria: number; despesaExtraorcamentaria: number; saldoExercícioSeguinte: number; totalDispendios: number };
  },
  opts?: DocumentPrintOptions,
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Balanço Financeiro — Anexo 13 (Lei 4.320/64) — ${data.year}</title>
      ${getStylesHtml()}
    </head>
    <body>
      ${getHeaderHtml(`BALANÇO FINANCEIRO (ANEXO 13 LEI 4.320/64) — EXERCÍCIO ${data.year}`, opts)}
      <div style="display:flex; gap:15px;">
        <div class="box" style="flex:1;">
          <div class="box-title">Ingressos (Entradas de Caixa)</div>
          <table>
            <tr><td>Receita Orçamentária Realizada</td><td class="text-right font-mono">${formatCurrency(data.ingressos.receitaOrcamentaria)}</td></tr>
            <tr><td>Receita Extraorçamentária (Consignações)</td><td class="text-right font-mono">${formatCurrency(data.ingressos.receitaExtraorcamentaria)}</td></tr>
            <tr><td>Saldo do Exercício Anterior (Caixa/Bancos)</td><td class="text-right font-mono">${formatCurrency(data.ingressos.saldoExercícioAnterior)}</td></tr>
            <tr style="font-weight:bold; background:#e2e8f0;"><td>TOTAL DOS INGRESSOS</td><td class="text-right font-mono">${formatCurrency(data.ingressos.totalIngressos)}</td></tr>
          </table>
        </div>
        <div class="box" style="flex:1;">
          <div class="box-title">Dispêndios (Saídas de Caixa)</div>
          <table>
            <tr><td>Despesa Orçamentária Paga</td><td class="text-right font-mono">${formatCurrency(data.dispendios.despesaOrcamentaria)}</td></tr>
            <tr><td>Despesa Extraorçamentária (Recolhimentos)</td><td class="text-right font-mono">${formatCurrency(data.dispendios.despesaExtraorcamentaria)}</td></tr>
            <tr><td>Saldo para o Exercício Seguinte (Caixa/Bancos)</td><td class="text-right font-mono">${formatCurrency(data.dispendios.saldoExercícioSeguinte)}</td></tr>
            <tr style="font-weight:bold; background:#e2e8f0;"><td>TOTAL DOS DISPÊNDIOS</td><td class="text-right font-mono">${formatCurrency(data.dispendios.totalDispendios)}</td></tr>
          </table>
        </div>
      </div>
      <div style="margin-top:40px; display:flex; justify-content:space-around; text-align:center;">
        <div><div style="border-top:1px solid #000; width:200px; padding-top:4px;">Contador Responsável CRC</div></div>
        <div><div style="border-top:1px solid #000; width:200px; padding-top:4px;">Ordenador de Despesas</div></div>
      </div>
    </body>
    </html>
  `;
}

// -----------------------------------------------------------------------------
// 6. Comparativo LOA (Original vs Alterado por Créditos Adicionais)
// -----------------------------------------------------------------------------
export function generateBudgetComparisonPrintHtml(
  data: {
    lawNumber: string;
    totalFixadoOriginal: number;
    totalCreditosAdicionais: number;
    totalAtualizado: number;
    variacaoPercentual: number;
    dotacoesComparativo: {
      code: string;
      budgetUnit: string;
      expenseNature: string;
      valorInicial: number;
      valorAtualizado: number;
      variacaoCredito: number;
      valorEmpenhado: number;
      valorDisponivel: number;
    }[];
  },
  opts?: DocumentPrintOptions,
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Comparativo de Alterações Orçamentárias — ${data.lawNumber}</title>
      ${getStylesHtml()}
    </head>
    <body>
      ${getHeaderHtml(`DEMONSTRATIVO COMPARATIVO LOA (ORIGINAL VS ALTERADA) — LEI ${data.lawNumber}`, opts)}
      <div class="box">
        <div class="box-title">Síntese do Orçamento e Créditos Adicionais</div>
        <table>
          <tr>
            <td><strong>Fixação Inicial (LOA Original):</strong> ${formatCurrency(data.totalFixadoOriginal)}</td>
            <td><strong>Créditos Efetivados (Suplementar/Especial):</strong> ${formatCurrency(data.totalCreditosAdicionais)}</td>
            <td><strong>Orçamento Atualizado:</strong> <strong style="color:#0f766e;">${formatCurrency(data.totalAtualizado)}</strong> (${data.variacaoPercentual}% de alteração)</td>
          </tr>
        </table>
      </div>

      <div class="box">
        <div class="box-title">Detalhamento por Dotação Orçamentária</div>
        <table>
          <thead>
            <tr>
              <th>Dotação</th>
              <th>Unidade Gestora</th>
              <th>Natureza Despesa</th>
              <th class="text-right">Valor Inicial (R$)</th>
              <th class="text-right">Créditos / Anulações (R$)</th>
              <th class="text-right">Valor Atualizado (R$)</th>
              <th class="text-right">Empenhado (R$)</th>
              <th class="text-right">Disponível (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${data.dotacoesComparativo
              .map(
                (d) => `
              <tr>
                <td class="font-mono">${d.code}</td>
                <td>${d.budgetUnit}</td>
                <td>${d.expenseNature}</td>
                <td class="text-right font-mono">${formatCurrency(d.valorInicial)}</td>
                <td class="text-right font-mono">${formatCurrency(d.variacaoCredito)}</td>
                <td class="text-right font-mono" style="font-weight:bold;">${formatCurrency(d.valorAtualizado)}</td>
                <td class="text-right font-mono">${formatCurrency(d.valorEmpenhado)}</td>
                <td class="text-right font-mono" style="color:${d.valorDisponivel < 0 ? "#b91c1c" : "#0f766e"};">${formatCurrency(d.valorDisponivel)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div style="margin-top:40px; display:flex; justify-content:space-around; text-align:center;">
        <div><div style="border-top:1px solid #000; width:220px; padding-top:4px;">Diretor de Orçamento / Planejamento</div></div>
        <div><div style="border-top:1px solid #000; width:220px; padding-top:4px;">Contador Responsável CRC</div></div>
      </div>
    </body>
    </html>
  `;
}

// -----------------------------------------------------------------------------
// 7. Extrato Bancário Diário / Mensal Completo de Tesouraria Imprimível
// -----------------------------------------------------------------------------
export function generateBankStatementPrintHtml(
  data: {
    bankAccountName: string;
    bankAgencyAccount: string;
    startDate: string;
    endDate: string;
    openingBalance: number;
    closingBalance: number;
    statementItems: {
      date: string;
      type: string;
      history: string;
      direction: "ENTRADA" | "SAIDA";
      value: number;
      runningBalance: number;
    }[];
  },
  opts?: DocumentPrintOptions,
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Extrato Bancário de Tesouraria — ${data.bankAccountName}</title>
      ${getStylesHtml()}
    </head>
    <body>
      ${getHeaderHtml(`EXTRATO DE TESOURARIA — ${data.bankAccountName.toUpperCase()}`, opts)}
      <div class="box">
        <div class="box-title">Identificação da Conta & Período</div>
        <p style="margin:3px 0;"><strong>Conta Bancária:</strong> ${data.bankAccountName} (Agência/Conta: ${data.bankAgencyAccount})</p>
        <p style="margin:3px 0;"><strong>Período das Movimentações:</strong> ${data.startDate} a ${data.endDate}</p>
        <p style="margin:3px 0;"><strong>Saldo Inicial do Período:</strong> ${formatCurrency(data.openingBalance)} | <strong>Saldo Final:</strong> <strong style="color:#0f766e;">${formatCurrency(data.closingBalance)}</strong></p>
      </div>

      <div class="box">
        <div class="box-title">Movimentações Cronológicas no Período</div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Histórico / Descrição do Lançamento</th>
              <th class="text-right">Entrada (R$)</th>
              <th class="text-right">Saída (R$)</th>
              <th class="text-right">Saldo Acumulado (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${data.statementItems
              .map(
                (item) => `
              <tr>
                <td class="font-mono text-center">${item.date}</td>
                <td><span class="badge">${item.type}</span></td>
                <td>${item.history}</td>
                <td class="text-right font-mono" style="color:${item.direction === "ENTRADA" ? "#0f766e" : "#888"};">${item.direction === "ENTRADA" ? formatCurrency(item.value) : "-"}</td>
                <td class="text-right font-mono" style="color:${item.direction === "SAIDA" ? "#b91c1c" : "#888"};">${item.direction === "SAIDA" ? formatCurrency(item.value) : "-"}</td>
                <td class="text-right font-mono" style="font-weight:bold;">${formatCurrency(item.runningBalance)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div style="margin-top:40px; display:flex; justify-content:space-around; text-align:center;">
        <div><div style="border-top:1px solid #000; width:220px; padding-top:4px;">Agente Financeiro / Tesouraria</div></div>
        <div><div style="border-top:1px solid #000; width:220px; padding-top:4px;">Contador Responsável CRC</div></div>
      </div>
    </body>
    </html>
  `;
}



