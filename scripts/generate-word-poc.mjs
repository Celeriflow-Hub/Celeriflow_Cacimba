import fs from "fs";
import path from "path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} from "docx";

// Cores corporativas CeleriFlow
const COLOR_PRIMARY = "0F766E"; // Emerald 700
const COLOR_SECONDARY = "0F172A"; // Slate 900
const COLOR_MUTED = "475569"; // Slate 600
const COLOR_BG_HEADER = "F1F5F9"; // Slate 100
const COLOR_BORDER = "CBD5E1"; // Slate 300
const COLOR_ACCENT = "0284C7"; // Blue 600
const COLOR_LIGHT_EMERALD = "ECFDF5";

const borderDefault = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: COLOR_BORDER,
};

const cellBorders = {
  top: borderDefault,
  bottom: borderDefault,
  left: borderDefault,
  right: borderDefault,
};

function createHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24, // 12pt
        color: COLOR_SECONDARY,
        font: "Calibri",
      }),
    ],
  });
}

function createHeading3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22, // 11pt
        color: COLOR_PRIMARY,
        font: "Calibri",
      }),
    ],
  });
}

function createParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80, line: 276 },
    children: [
      new TextRun({
        text,
        size: 21, // 10.5pt
        color: options.color || COLOR_SECONDARY,
        font: "Calibri",
        bold: options.bold || false,
        italics: options.italics || false,
      }),
    ],
  });
}

function createBullet(text, boldPrefix = "") {
  const children = [];
  if (boldPrefix) {
    children.push(
      new TextRun({
        text: boldPrefix + " ",
        bold: true,
        size: 21,
        color: COLOR_SECONDARY,
        font: "Calibri",
      })
    );
  }
  children.push(
    new TextRun({
      text,
      size: 21,
      color: COLOR_SECONDARY,
      font: "Calibri",
    })
  );

  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
    children,
  });
}

function createNumbered(numberStr, text, boldPrefix = "") {
  const children = [];
  children.push(
    new TextRun({
      text: numberStr + " ",
      bold: true,
      size: 21,
      color: COLOR_PRIMARY,
      font: "Calibri",
    })
  );
  if (boldPrefix) {
    children.push(
      new TextRun({
        text: boldPrefix + " ",
        bold: true,
        size: 21,
        color: COLOR_SECONDARY,
        font: "Calibri",
      })
    );
  }
  children.push(
    new TextRun({
      text,
      size: 21,
      color: COLOR_SECONDARY,
      font: "Calibri",
    })
  );

  return new Paragraph({
    indent: { left: 360 },
    spacing: { before: 60, after: 60 },
    children,
  });
}

function createCallout(title, text, type = "info") {
  const bg = type === "success" ? COLOR_LIGHT_EMERALD : "F8FAFC";
  const borderCol = type === "success" ? COLOR_PRIMARY : COLOR_ACCENT;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 24, color: borderCol },
            },
            shading: { fill: bg, type: ShadingType.CLEAR },
            margins: { top: 140, bottom: 140, left: 200, right: 140 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 21,
                    color: borderCol,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: text,
                    size: 20,
                    color: COLOR_MUTED,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createTableHeaderCell(text, widthPercent) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    shading: { fill: COLOR_BG_HEADER, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: true,
            size: 20,
            color: COLOR_SECONDARY,
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

function createTableCell(text, widthPercent, isCode = false) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            size: 19,
            color: isCode ? COLOR_PRIMARY : COLOR_SECONDARY,
            font: isCode ? "Consolas" : "Calibri",
            bold: isCode,
          }),
        ],
      }),
    ],
  });
}

async function generateDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 21,
            color: COLOR_SECONDARY,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 polegada (2,54 cm)
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "CeleriFlow • Roteiro Operacional da POC - São João do Ivaí/PR",
                    size: 16,
                    color: COLOR_MUTED,
                    font: "Calibri",
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Página ",
                    size: 16,
                    color: COLOR_MUTED,
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: COLOR_MUTED,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: " de ",
                    size: 16,
                    color: COLOR_MUTED,
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: COLOR_MUTED,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Título Principal
          new Paragraph({
            spacing: { before: 0, after: 120 },
            children: [
              new TextRun({
                text: "CeleriFlow — Gestão Pública Municipal",
                size: 20,
                bold: true,
                color: COLOR_PRIMARY,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [
              new TextRun({
                text: "Roteiro Operacional da POC - São João do Ivaí/PR",
                size: 36, // 18pt
                bold: true,
                color: COLOR_SECONDARY,
                font: "Calibri",
              }),
            ],
          }),

          createCallout(
            "Finalidade e Escopo da Demonstração",
            "Este roteiro cobre exclusivamente os oito itens avaliados da planilha POC_Sao_Joao_do_Ivai_Somente_Itens_Avaliados.xlsx. O Banco Virtual Robonuvem é a única origem bancária simulada (SANDBOX). Todas as operações realizadas após a leitura bancária são registradas de forma real e definitiva no banco de dados do CeleriFlow: receitas, movimentos de tesouraria, eventos contábeis, conciliações e trilhas de auditoria.",
            "success"
          ),

          new Paragraph({ spacing: { before: 180, after: 80 }, children: [] }),

          // Seção 1: Critérios
          createHeading2("1. Resumo dos Critérios de Avaliação"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Grupo de Requisitos", 50),
                  createTableHeaderCell("Qtd. Itens", 25),
                  createTableHeaderCell("Critério de Aprovação", 25),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Características técnicas obrigatórias", 50),
                  createTableCell("3", 25),
                  createTableCell("100% (Obrigatório)", 25),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Especificações técnicas dos módulos", 50),
                  createTableCell("5", 25),
                  createTableCell("Mínimo de 80%", 25),
                ],
              }),
            ],
          }),

          // Seção 2: Acessos da Comissão
          createHeading2("2. Acessos da Comissão Avaliadora"),
          createParagraph(
            "As três contas possuem login individual e acesso operacional restrito ao módulo financeiro da POC (Unidade Gestora 0101):"
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Responsável / Comissão", 35),
                  createTableHeaderCell("E-mail de Login", 35),
                  createTableHeaderCell("Perfil Provisionado", 30),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Comissão TI", 35),
                  createTableCell("adminteste@email.com", 35, true),
                  createTableCell("POC Avaliador Técnico de TI", 30),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Comissão Administrativo-Financeira", 35),
                  createTableCell("gestao1@email.com", 35, true),
                  createTableCell("POC Avaliador Administrativo-Financeiro", 30),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Comissão Contábil", 35),
                  createTableCell("contadorteste@email.com", 35, true),
                  createTableCell("POC Avaliador Contábil", 30),
                ],
              }),
            ],
          }),

          createParagraph(
            "Nota de Segurança: As senhas não são recuperáveis no Firebase e são entregues por canal seguro antes da sessão. Não utilize credenciais do Banco Virtual para login no CeleriFlow.",
            { italics: true, color: COLOR_MUTED }
          ),

          // Seção 3: Pré-condições
          createHeading2("3. Pré-condições de Execução"),
          createBullet("URL do CeleriFlow acessível via protocolo HTTPS seguro."),
          createBullet("Três logins da comissão testados e autenticados individualmente."),
          createBullet("Integração BANCO_API ativa em modo SANDBOX com o Banco Virtual Robonuvem."),
          createBullet("Período bancário de demonstração disponível: agosto de 2025."),
          createBullet("Ambiente devidamente identificado como POC, sem tráfego financeiro real."),

          // Seção 4: Dados para os Testes
          createHeading2("4. Dados e Valores de Referência dos Testes"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Cenário de Teste", 30),
                  createTableHeaderCell("Conta", 20),
                  createTableHeaderCell("Período / Data", 25),
                  createTableHeaderCell("Valor de Referência (R$)", 25),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Receitas Constitucionais", 30),
                  createTableCell("20001-1", 20, true),
                  createTableCell("01/08/2025 a 31/08/2025", 25),
                  createTableCell("FPM: 145.000,00 | FUNDEB: 98.400,00\nIPVA: 15.500,00 | ICMS: 53.800,00", 25),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Aplicação Financeira", 30),
                  createTableCell("10001-0", 20, true),
                  createTableCell("11/05/2026", 25),
                  createTableCell("R$ 80.000,00", 25),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Resgate Financeiro", 30),
                  createTableCell("90001-4", 20, true),
                  createTableCell("27/05/2026", 25),
                  createTableCell("R$ 150.000,00", 25),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Rendimento de Aplicação", 30),
                  createTableCell("90001-4", 20, true),
                  createTableCell("Agosto / 2025", 25),
                  createTableCell("R$ 4.400,00", 25),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Tarifa Bancária", 30),
                  createTableCell("10001-0", 20, true),
                  createTableCell("30/06/2026", 25),
                  createTableCell("R$ 450,00", 25),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Divergência Controlada", 30),
                  createTableCell("Conta consultada", 20, true),
                  createTableCell("UNRECOGNIZED_TRANSACTION", 25),
                  createTableCell("R$ 999,99 (Exceção)", 25),
                ],
              }),
            ],
          }),

          // Seção 5: Sequência de Demonstração
          createHeading2("5. Sequência Passo a Passo de Demonstração"),

          // Item 1
          createHeading3("5.1 Tela Inicial (Item 3.1.1 a.1)"),
          createNumbered("1.", "Acessar a URL oficial da POC no navegador."),
          createNumbered("2.", "Efetuar login com uma das três credenciais da comissão."),
          createNumbered("3.", "Confirmar que a primeira tela apresentada intitula-se Home."),
          createNumbered("4.", "Confirmar a presença no menu dos módulos Home e Automações."),
          createNumbered("5.", "Navegar até Automações e retornar com sucesso à Home."),
          createCallout("Evidência Esperada", "Navegação web limpa, intuitiva, responsiva e sem erros.", "info"),

          // Item 2
          createHeading3("5.2 Acesso e Login (Item 3.1.1 a.2)"),
          createNumbered("1.", "Demonstrar autenticação bem-sucedida para cada perfil da comissão."),
          createNumbered("2.", "Tentar acessar rota financeira protegida sem sessão e demonstrar o bloqueio de segurança."),
          createNumbered("3.", "Confirmar que a conta da comissão possui acesso restrito ao escopo financeiro."),
          createNumbered("4.", "Solicitar uma automação e registrar na trilha de auditoria o usuário logado."),
          createCallout("Evidência Esperada", "Sessão individual, controle estrito por perfil e trilha de auditoria de acessos e interações.", "info"),

          // Item 3
          createHeading3("5.3 Catálogo e Acompanhamento de Automações (Item 3.1.1 a.3)"),
          createNumbered("1.", "Acessar Home > Automações."),
          createNumbered("2.", "Apresentar histórico completo de extratos processados, execuções e falhas tratadas."),
          createNumbered("3.", "Clicar em Nova Automação."),
          createNumbered("4.", "Informar os parâmetros de conta e período e disparar a execução."),
          createNumbered("5.", "Acompanhar no painel o status em tempo real, data/hora e logs da tarefa."),
          createCallout("Evidência Esperada", "Catálogo completo, controle de parâmetros, acompanhamento em tempo real e histórico de execuções.", "info"),

          // Item 4
          createHeading3("5.4 Download e Arquivamento de Extratos (Item 3.1.2-01)"),
          createParagraph("Tela de Acesso: Financeiro > Extratos Bancários", { bold: true, color: COLOR_PRIMARY }),
          createNumbered("1.", "Confirmar que a instituição financeira está fixada como Banco Virtual Robonuvem."),
          createNumbered("2.", "Executar para a conta corrente 20001-1, agência 0001, período de 01/08/2025 a 31/08/2025."),
          createNumbered("3.", "Apresentar console de execução, formato recebido, hash criptográfico SHA-256 e local de arquivamento."),
          createNumbered("4.", "Abrir e inspecionar o extrato arquivado diretamente pelo histórico."),
          createNumbered("5.", "Repetir o procedimento para a conta de aplicação 90001-4."),
          createNumbered("6.", "Reexecutar a importação já realizada e comprovar o controle de duplicidade (não duplicação)."),
          createCallout("Resultado no CeleriFlow", "Documento arquivado com integridade SHA-256, itens de extrato persistidos e registro na auditoria financeira.", "success"),

          // Item 5
          createHeading3("5.5 Aplicações e Resgates Financeiros (Item 3.1.2-02)"),
          createParagraph("Tela de Acesso: Financeiro > Resgates e Aplicações", { bold: true, color: COLOR_PRIMARY }),
          createNumbered("1.", "Confirmar a carga dos lançamentos originados do Banco Virtual Robonuvem."),
          createNumbered("2.", "Selecionar a aplicação da conta 10001-0 ou o resgate da conta 90001-4."),
          createNumbered("3.", "Exibir classificação, justificativa, valor bruto, encargos, valor líquido e prévia contábil."),
          createNumbered("4.", "Clicar em 'Registrar no CeleriFlow & Gerar Recibo'."),
          createNumbered("5.", "Exibir recibo oficial de transmissão, número do lançamento e hash de integração."),
          createNumbered("6.", "Tentar reprocessar o mesmo registro e demonstrar a trava contra duplicidade."),
          createCallout("Resultado no CeleriFlow", "Movimento de tesouraria registrado, vínculo ao extrato bancário, recibo emitido e auditoria criada.", "success"),

          // Item 6
          createHeading3("5.6 Rendimentos de Aplicações (Item 3.1.2-03)"),
          createParagraph("Tela de Acesso: Financeiro > Rendimentos de Aplicações", { bold: true, color: COLOR_PRIMARY }),
          createNumbered("1.", "Informar a conta de aplicação 90001-4 e o período de agosto de 2025."),
          createNumbered("2.", "Clicar em 'Consultar rendimentos no extrato de aplicação'."),
          createNumbered("3.", "Selecionar o rendimento identificado pelo banco."),
          createNumbered("4.", "Apresentar o cálculo do rendimento bruto, IRRF, IOF, correção, líquido, saldo acumulado e classificação contábil."),
          createNumbered("5.", "Clicar em 'Registrar Rendimento no CeleriFlow'."),
          createNumbered("6.", "Exibir recibo gerado e conferir atualização do histórico de rendimentos."),
          createCallout("Resultado no CeleriFlow", "Receita arrecadada lançada, movimento de tesouraria, partida contábil, extrato vinculado e auditoria.", "success"),

          // Item 7
          createHeading3("5.7 Receitas Constitucionais e Legais (Item 3.1.2-04)"),
          createParagraph("Tela de Acesso: Financeiro > Regras Constitucionais", { bold: true, color: COLOR_PRIMARY }),
          createNumbered("1.", "Apresentar as regras pré-configuradas: FPM, FUNDEB, IPVA, ICMS, ITR, FEP, IPI Exportação, Royalties e LC 176."),
          createNumbered("2.", "Após baixar o extrato da conta 20001-1, abrir a Fila de Exceções."),
          createNumbered("3.", "Selecionar e processar individualmente as receitas de FPM, FUNDEB, IPVA e ICMS."),
          createNumbered("4.", "Exibir detalhamento: classificação, natureza da receita, fonte de recursos, evento contábil, valor e recibo."),
          createNumbered("5.", "Ativar o cenário de falha UNRECOGNIZED_TRANSACTION, baixar o extrato e demonstrar a pendência na Fila de Exceções."),
          createCallout("Resultado no CeleriFlow", "Receita pública arrecadada, movimento de caixa, evento contábil automático e rastreabilidade total.", "success"),

          // Item 8
          createHeading3("5.8 Conciliação Bancária & Carga de Razão (Item 3.1.2-05)"),
          createParagraph("Tela de Acesso: Financeiro > Conciliação Bancária", { bold: true, color: COLOR_PRIMARY }),
          createNumbered("1.", "Informar Banco Virtual Robonuvem, agência 0001, conta corrente 20001-1 e período 2025-08."),
          createNumbered("2.", "Clicar em 'Abrir Conciliação & Carregar Razão'."),
          createNumbered("3.", "Apresentar no Quadro Demonstrativo: Saldo Inicial, Entradas (Créditos), Saídas (Débitos), Saldo Final do Extrato, Saldo do Razão Contábil e Diferença (R$ 0,00)."),
          createNumbered("4.", "Clicar em 'Executar Correspondência Automática (Motor de 9 Regras)'."),
          createNumbered("5.", "Exibir a correspondência das partidas contábeis e extrato, com percentuais de confiança e detalhamento."),
          createNumbered("6.", "Clicar em 'Confirmar Conciliação no CeleriFlow'."),
          createNumbered("7.", "Exibir o recibo oficial de transmissão, hash SHA-256 e status final CONCILIADA."),
          createCallout("Resultado no CeleriFlow", "Sessão conciliada e travada, partidas amarradas, conciliação registrada e auditada.", "success"),

          // Seção 6: Evidências de Encerramento
          createHeading2("6. Evidências de Encerramento e Auditoria"),
          createNumbered("1.", "Abrir Financeiro > Automações e apresentar todas as execuções, extratos e eventos processados."),
          createNumbered("2.", "Com perfil administrador, abrir Configurações > Auditoria de Uso e filtrar as operações da demonstração."),
          createNumbered("3.", "Comprovar que os logs gravam usuário responsável, data/hora, módulo, tela e tipo de ação, em conformidade com a LGPD (sem expor senhas ou dados sensíveis)."),
          createNumbered("4.", "Preencher a planilha de avaliação técnica com a marcação ATENDE para todos os 8 itens avaliados."),

          // Seção 7: Cenários de Falha Controlada
          createHeading2("7. Demonstração de Resiliência (Falhas Controladas)"),
          createParagraph(
            "Utilize o painel de sandbox do Banco Virtual Robonuvem para injetar cenários de exceção controlada, comprovando o tratamento robusto de erros pelo CeleriFlow:"
          ),
          createBullet("Credencial Inválida / Autenticação Expirada: Sistema bloqueia e notifica o usuário sem interromper o serviço."),
          createBullet("Indisponibilidade / Timeout de Conexão: Sistema registra retry inteligente e alerta de indisponibilidade temporária."),
          createBullet("Transação Não Reconhecida (UNRECOGNIZED_TRANSACTION): Lançamento é direcionado para a Fila de Exceções para conferência manual."),
          createBullet("Restauração do Cenário Normal: Execução repetida imediatamente com sucesso e emissão de recibo."),

          // Seção 8: Diretrizes Finais
          createHeading2("8. Diretrizes e Boas Práticas da Apresentação"),
          createBullet("Não afirmar integração com banco oficial ou utilizar dados bancários reais durante a sessão."),
          createBullet("Utilizar exclusivamente o Banco Virtual Robonuvem para as operações bancárias da POC."),
          createBullet("Nunca expor senhas, tokens de API, client_secret ou variáveis de ambiente na tela de projeção."),
          createBullet("Ressaltar a clara distinção: dados bancários simulados (SANDBOX) vs. registros fiscais e contábeis reais e definitivos no CeleriFlow."),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outDir = path.resolve(process.cwd(), "docs/São João do Ivai");
  const outFile = path.join(outDir, "ROTEIRO_OPERACIONAL_POC_SAO_JOAO_DO_IVAI.docx");
  fs.writeFileSync(outFile, buffer);
  console.log(`Documento Word gerado com sucesso em: ${outFile}`);
}

generateDocx().catch((err) => {
  console.error("Erro ao gerar docx:", err);
  process.exit(1);
});
