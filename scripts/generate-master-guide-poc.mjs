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
const COLOR_LIGHT_AMBER = "FFFBEB";
const COLOR_AMBER = "D97706";
const COLOR_LIGHT_BLUE = "F0F9FF";

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

function createTitle(text) {
  return new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [
      new TextRun({
        text,
        size: 32, // 16pt
        bold: true,
        color: COLOR_SECONDARY,
        font: "Calibri",
      }),
    ],
  });
}

function createSubtitle(text) {
  return new Paragraph({
    spacing: { before: 0, after: 200 },
    children: [
      new TextRun({
        text,
        size: 22,
        bold: true,
        color: COLOR_PRIMARY,
        font: "Calibri",
      }),
    ],
  });
}

function createHeading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 340, after: 140 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26, // 13pt
        color: COLOR_PRIMARY,
        font: "Calibri",
      }),
    ],
  });
}

function createHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 23, // 11.5pt
        color: COLOR_SECONDARY,
        font: "Calibri",
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
        size: 20,
        color: COLOR_SECONDARY,
        font: "Calibri",
      })
    );
  }
  children.push(
    new TextRun({
      text,
      size: 20,
      color: COLOR_SECONDARY,
      font: "Calibri",
    })
  );

  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    children,
  });
}

function createStepNumbered(numStr, actionTitle, detailText, speechTip = "") {
  const paras = [];
  paras.push(
    new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [
        new TextRun({
          text: numStr + " ",
          bold: true,
          size: 21,
          color: COLOR_PRIMARY,
          font: "Calibri",
        }),
        new TextRun({
          text: actionTitle,
          bold: true,
          size: 21,
          color: COLOR_SECONDARY,
          font: "Calibri",
        }),
      ],
    })
  );

  paras.push(
    new Paragraph({
      indent: { left: 360 },
      spacing: { before: 20, after: 40 },
      children: [
        new TextRun({
          text: detailText,
          size: 20,
          color: COLOR_SECONDARY,
          font: "Calibri",
        }),
      ],
    })
  );

  if (speechTip) {
    paras.push(
      new Paragraph({
        indent: { left: 360 },
        spacing: { before: 20, after: 80 },
        children: [
          new TextRun({
            text: "💬 O que falar para a comissão: ",
            bold: true,
            italics: true,
            size: 19,
            color: COLOR_ACCENT,
            font: "Calibri",
          }),
          new TextRun({
            text: `"${speechTip}"`,
            italics: true,
            size: 19,
            color: COLOR_MUTED,
            font: "Calibri",
          }),
        ],
      })
    );
  }

  return paras;
}

function createCallout(title, text, type = "info") {
  let bg = COLOR_LIGHT_BLUE;
  let borderCol = COLOR_ACCENT;
  if (type === "success") {
    bg = COLOR_LIGHT_EMERALD;
    borderCol = COLOR_PRIMARY;
  } else if (type === "warning") {
    bg = COLOR_LIGHT_AMBER;
    borderCol = COLOR_AMBER;
  }

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
            margins: { top: 120, bottom: 120, left: 180, right: 140 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 20,
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
                    size: 19,
                    color: COLOR_SECONDARY,
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
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: true,
            size: 19,
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
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            size: 18,
            color: isCode ? COLOR_PRIMARY : COLOR_SECONDARY,
            font: isCode ? "Consolas" : "Calibri",
            bold: isCode,
          }),
        ],
      }),
    ],
  });
}

async function generateMasterGuideDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 20,
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
              top: 1440,
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
                    text: "CeleriFlow • Guia Mestre de Testes & Apresentação da POC — São João do Ivaí/PR",
                    size: 15,
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
                    size: 15,
                    color: COLOR_MUTED,
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 15,
                    color: COLOR_MUTED,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: " de ",
                    size: 15,
                    color: COLOR_MUTED,
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 15,
                    color: COLOR_MUTED,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Header / Título
          createSubtitle("PREFEITURA MUNICIPAL DE SÃO JOÃO DO IVAÍ / PR — PREGÃO ELETRÔNICO Nº 51/2026"),
          createTitle("Guia Mestre de Testes & Apresentação da POC (Prova de Conceito)"),

          createCallout(
            "🎯 Como usar este guia para não se atrapalhar",
            "Este roteiro foi desenhado para ser o seu navegador passo a passo durante a sessão ao vivo com a comissão avaliadora. Ele contém exatamente: onde clicar, o que preencher, o que esperar na tela, a evidência a demonstrar e o que falar em cada etapa. Siga rigorosamente a ordem numérica de 1 a 9.",
            "success"
          ),

          new Paragraph({ spacing: { before: 100, after: 60 }, children: [] }),

          // Seção 1: Checklist de Pré-Voo
          createHeading1("1. Checklist de Pré-Voo (15 Minutos Antes da Chamada)"),
          createBullet("Abra o navegador em modo anônimo limpo e acesse a URL oficial do CeleriFlow (com HTTPS ativo).", "1. Ambiente Web:"),
          createBullet("Tenha em mãos os 3 logins da comissão com as senhas temporárias validadas.", "2. Credenciais:"),
          createBullet("Verifique que o Banco Virtual Robonuvem está ativo em modo SANDBOX com o período de agosto/2025.", "3. Integração Bancária:"),
          createBullet("Certifique-se de que nenhuma sessão com senha de administrador geral está aberta na tela de projeção.", "4. Segurança:"),
          createBullet("Deixe este roteiro aberto em uma segunda tela para acompanhar as etapas e valores.", "5. Apoio Operacional:"),

          // Seção 2: Tabela de Credenciais & Perfis
          createHeading1("2. Matriz de Acessos da Comissão Avaliadora"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Comissão", 28),
                  createTableHeaderCell("Login de Acesso", 36),
                  createTableHeaderCell("Perfil Provisionado", 36),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Comissão TI", 28),
                  createTableCell("adminteste@email.com", 36, true),
                  createTableCell("POC Avaliador Técnico de TI (UG 0101)", 36),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Comissão Administrativo-Financeira", 28),
                  createTableCell("gestao1@email.com", 36, true),
                  createTableCell("POC Avaliador Administrativo-Financeiro (UG 0101)", 36),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Comissão Contábil", 28),
                  createTableCell("contadorteste@email.com", 36, true),
                  createTableCell("POC Avaliador Contábil (UG 0101)", 36),
                ],
              }),
            ],
          }),

          // Seção 3: Tabela de Dados e Valores
          createHeading1("3. Tabela de Valores de Referência (Dados dos Testes)"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Cenário de Teste", 28),
                  createTableHeaderCell("Conta Bancária", 20),
                  createTableHeaderCell("Período / Data", 24),
                  createTableHeaderCell("Valor / Detalhe Esperado", 28),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Receitas Constitucionais", 28),
                  createTableCell("20001-1 (Agência 0001)", 20, true),
                  createTableCell("01/08/2025 a 31/08/2025", 24),
                  createTableCell("FPM: R$ 145.000,00 | FUNDEB: R$ 98.400,00\nIPVA: R$ 15.500,00 | ICMS: R$ 53.800,00", 28),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Aplicação Financeira", 28),
                  createTableCell("10001-0 (Agência 0001)", 20, true),
                  createTableCell("11/05/2026", 24),
                  createTableCell("R$ 80.000,00 (Débito Aplicação)", 28),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Resgate Financeiro", 28),
                  createTableCell("90001-4 (Agência 0001)", 20, true),
                  createTableCell("27/05/2026", 24),
                  createTableCell("R$ 150.000,00 (Crédito Resgate)", 28),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Rendimento de Aplicação", 28),
                  createTableCell("90001-4 (Agência 0001)", 20, true),
                  createTableCell("Agosto de 2025", 24),
                  createTableCell("R$ 4.400,00 (Bruto, com cálculo de IR/IOF)", 28),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Conciliação Bancária", 28),
                  createTableCell("20001-1 (Agência 0001)", 20, true),
                  createTableCell("2025-08", 24),
                  createTableCell("Saldo Inicial: R$ 150.000,00 | Razão: Calculado\nDiferença: R$ 0,00 (9 Regras)", 28),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Falha Controlada (Exceção)", 28),
                  createTableCell("Conta consultada", 20, true),
                  createTableCell("UNRECOGNIZED_TRANSACTION", 24),
                  createTableCell("R$ 999,99 (Fila de Exceções)", 28),
                ],
              }),
            ],
          }),

          // Seção 4: Passo a Passo Detalhado
          createHeading1("4. Passo a Passo Completo de Execução & Apresentação"),

          // ETAPA 1
          createHeading2("ETAPA 1 — Tela Inicial e Navegação (Item 3.1.1 a.1 / CT-01)"),
          ...createStepNumbered(
            "1.1",
            "Acessar a URL da POC e Efetuar Login",
            "Abra a página inicial no navegador e entre com a credencial 'adminteste@email.com'.",
            "Senhores avaliadores, estamos acessando a plataforma 100% web do CeleriFlow através de conexão segura HTTPS com login individual."
          ),
          ...createStepNumbered(
            "1.2",
            "Demonstrar a Tela Inicial (Home) e os Menus",
            "Mostre o título 'Home', o cabeçalho de boas-vindas e a presença das opções 'Home' e 'Automações' no menu superior/lateral.",
            "Vejam que a interface é limpa e intuitiva, apresentando imediatamente as opções de Home e Catálogo de Automações, conforme exigido no item CT-01."
          ),
          ...createStepNumbered(
            "1.3",
            "Navegar entre Home e Automações",
            "Clique em 'Automações', aguarde a tela carregar sem erros no console, e clique em 'Home' para retornar.",
            "A navegação ocorre de forma instantânea e fluida, sem falhas ou lentidão."
          ),
          createCallout("Evidência a Registrar", "Item CT-01 atendido: Interface web simples, opção de Home e Automações, navegação 100% funcional.", "success"),

          // ETAPA 2
          createHeading2("ETAPA 2 — Controle de Acesso, Perfis e Segurança (Item 3.1.1 a.2 / CT-02)"),
          ...createStepNumbered(
            "2.1",
            "Demonstrar Sessão Individual por Perfil",
            "Mostre o perfil do usuário logado no canto superior direito ('POC Avaliador Técnico de TI').",
            "Cada membro da comissão possui acesso individualizado e rastreado."
          ),
          ...createStepNumbered(
            "2.2",
            "Demonstrar Bloqueio de Rota Não Autenticada",
            "Abra uma janela anônima e tente colar a URL '/financeiro/conciliacao-bancaria'. Mostre que o sistema bloqueia o acesso e redireciona para o login.",
            "Tentativas de acesso direto sem autenticação são imediatamente interceptadas pelas políticas de segurança."
          ),
          ...createStepNumbered(
            "2.3",
            "Demonstrar Restrição por Escopo (Unidade Gestora 0101)",
            "Mostre que as rotas e cadastros estão restritos estritamente ao escopo da POC de São João do Ivaí.",
            "O controle de acesso por Unidade Gestora impede que usuários visualizem dados fora de sua alçada."
          ),
          createCallout("Evidência a Registrar", "Item CT-02 atendido: Autenticação obrigatória, bloqueio a não autorizados e rastreabilidade total.", "success"),

          // ETAPA 3
          createHeading2("ETAPA 3 — Catálogo e Disparo de Automações (Item 3.1.1 a.3 / CT-03)"),
          ...createStepNumbered(
            "3.1",
            "Acessar o Painel de Automações",
            "No menu lateral, clique em 'Tesouraria e Bancos > Monitoramento de Automações' (ou na Home em 'Automações').",
            "Aqui temos o catálogo central de tarefas automáticas bancárias e fiscais do município."
          ),
          ...createStepNumbered(
            "3.2",
            "Apresentar o Histórico de Tarefas",
            "Exiba as execuções anteriores, indicando data/hora, status (Sucesso, Em Andamento, Pendência), conta processada e logs.",
            "O gestor tem visibilidade em tempo real de todas as rotinas executadas pelo robô."
          ),
          ...createStepNumbered(
            "3.3",
            "Disparar Nova Automação com Parâmetros",
            "Clique em 'Nova Automação', selecione a conta '20001-1' e o período '2025-08', e execute a rotina.",
            "Podemos disparar tarefas manuais sob demanda informando parâmetros específicos de conta e competência."
          ),
          createCallout("Evidência a Registrar", "Item CT-03 atendido: Catálogo disponível, formulário de parâmetros e acompanhamento de status.", "success"),

          // ETAPA 4
          createHeading2("ETAPA 4 — Download e Arquivamento de Extratos (Item 3.1.2-01 / MOD-01)"),
          ...createStepNumbered(
            "4.1",
            "Acessar a Tela de Extratos Bancários",
            "Navegue em 'Tesouraria e Bancos > Extratos Bancários' (/financeiro/download-extratos).",
            "Vamos agora executar a leitura do extrato oficial simulado no Banco Virtual Robonuvem."
          ),
          ...createStepNumbered(
            "4.2",
            "Baixar Extrato da Conta Corrente (20001-1)",
            "Selecione Banco 'Banco Virtual Robonuvem', Agência '0001', Conta '20001-1', Período de '01/08/2025' a '31/08/2025' e clique em 'Executar Download'.",
            "O sistema se conecta à API bancária, realiza o download seguro e processa os itens de extrato."
          ),
          ...createStepNumbered(
            "4.3",
            "Apresentar Hash SHA-256 e Arquivamento",
            "Destaque na tela o Hash criptográfico SHA-256 gerado para o arquivo e o caminho de catalogação por conta e competência.",
            "Para garantir a integridade exigida pelos órgãos de controle, todo documento recebe carimbo de tempo e hash SHA-256."
          ),
          ...createStepNumbered(
            "4.4",
            "Repetir para Conta de Aplicação (90001-4) e Testar Duplicidade",
            "Repita o processo para a conta de aplicação '90001-4'. Em seguida, clique novamente em baixar a conta '20001-1' para mostrar que o sistema não duplica registros já importados.",
            "A idempotência do CeleriFlow garante que extratos já baixados não criem lançamentos duplicados na tesouraria."
          ),
          createCallout("Evidência a Registrar", "Item MOD-01 atendido: Download de conta corrente e aplicação, organização por pastas, Hash SHA-256 e não duplicação.", "success"),

          // ETAPA 5
          createHeading2("ETAPA 5 — Resgates e Aplicações Financeiras (Item 3.1.2-02 / MOD-02)"),
          ...createStepNumbered(
            "5.1",
            "Acessar a Tela de Resgates e Aplicações",
            "Navegue em 'Tesouraria e Bancos > Resgates e Aplicações' (/financeiro/resgates-aplicacoes).",
            "Nesta tela, o sistema lê automaticamente os lançamentos de aplicação e resgate do extrato e prepara a escrituração contábil."
          ),
          ...createStepNumbered(
            "5.2",
            "Identificar Aplicação (Conta 10001-0) e Resgate (Conta 90001-4)",
            "Mostre a aplicação de R$ 80.000,00 (11/05/2026) e o resgate de R$ 150.000,00 (27/05/2026). Destaque a classificação, justificativa e prévia de débito/crédito.",
            "Vejam que o robô identifica a natureza da operação, calcula os valores e já monta a prévia da partida dobrada."
          ),
          ...createStepNumbered(
            "5.3",
            "Registrar no CeleriFlow e Gerar Recibo",
            "Clique no botão 'Registrar no CeleriFlow & Gerar Recibo'. Mostre o número do lançamento, o recibo oficial de transmissão e a trava contra duplicidade.",
            "O lançamento é persistido de forma definitiva na tesouraria e no razão, gerando um comprovante auditável."
          ),
          createCallout("Evidência a Registrar", "Item MOD-02 atendido: Identificação de aplicação e resgate, cálculo de valores, gravação no sistema e emissão de recibo.", "success"),

          // ETAPA 6
          createHeading2("ETAPA 6 — Rendimentos de Aplicações Financeiras (Item 3.1.2-03 / MOD-03)"),
          ...createStepNumbered(
            "6.1",
            "Acessar a Tela de Rendimentos",
            "Navegue em 'Tesouraria e Bancos > Rendimentos de Aplicações' (/financeiro/rendimentos).",
            "Vamos agora demonstrar a apropriação dos rendimentos gerados pelas aplicações financeiras do município."
          ),
          ...createStepNumbered(
            "6.2",
            "Consultar Rendimento da Conta 90001-4 (Agosto/2025)",
            "Selecione a conta '90001-4' e o mês '2025-08'. Clique em 'Consultar rendimentos no extrato de aplicação'.",
            "O sistema localiza o lançamento de rendimento retornado pela instituição financeira."
          ),
          ...createStepNumbered(
            "6.3",
            "Exibir Cálculo do Rendimento Bruto, Deduções e Líquido",
            "Mostre o valor bruto (R$ 4.400,00), a apuração de retenções (IRRF/IOF se aplicável), o valor líquido e a classificação da receita patrimonial.",
            "A apuração separa a receita patrimonial de rendimentos e as deduções tributárias legais."
          ),
          ...createStepNumbered(
            "6.4",
            "Registrar Rendimento no CeleriFlow",
            "Clique em 'Registrar Rendimento no CeleriFlow'. Exiba o recibo com identificador do lançamento e a atualização do saldo bancário.",
            "A receita é reconhecida e contabilizada no orçamento e no caixa municipal."
          ),
          createCallout("Evidência a Registrar", "Item MOD-03 atendido: Leitura de extrato de aplicação, cálculo de rendimentos brutos/líquidos, registro e recibo.", "success"),

          // ETAPA 7
          createHeading2("ETAPA 7 — Receitas Constitucionais e Fila de Exceções (Item 3.1.2-04 / MOD-04)"),
          ...createStepNumbered(
            "7.1",
            "Acessar Regras Constitucionais",
            "Navegue em 'Receitas > Regras Constitucionais' (/financeiro/receitas-constitucionais).",
            "O CeleriFlow possui regras inteligentes para reconhecimento de todos os repasses constitucionais previstos no edital: FPM, FUNDEB, IPVA, ICMS, ITR, Royalties, FEP e LC 176."
          ),
          ...createStepNumbered(
            "7.2",
            "Processar Receitas da Conta 20001-1",
            "Abra a Fila de Processamento e mostre cada receita: FPM (R$ 145.000,00), FUNDEB (R$ 98.400,00), IPVA (R$ 15.500,00) e ICMS (R$ 53.800,00).",
            "Ao clicar em processar, o sistema vincula a classificação orçamentária correta, fonte de recursos e evento contábil."
          ),
          ...createStepNumbered(
            "7.3",
            "Demonstrar Tratamento de Transação Não Reconhecida (Falha Controlada)",
            "Apresente o lançamento especial de R$ 999,99 (cenário UNRECOGNIZED_TRANSACTION). Mostre que ele é automaticamente isolado na 'Fila de Exceções' para triagem manual, sem travar o sistema.",
            "Quando um crédito não tem regra cadastrada ou identificador conhecido, ele é desviado para a Fila de Exceções, preservando a segurança contábil."
          ),
          createCallout("Evidência a Registrar", "Item MOD-04 atendido: Classificação de repasses constitucionais, lançamento contábil, geração de recibos e Fila de Exceções.", "success"),

          // ETAPA 8
          createHeading2("ETAPA 8 — Conciliação Bancária & Carga de Razão (Item 3.1.2-05 / MOD-05)"),
          ...createStepNumbered(
            "8.1",
            "Acessar Conciliação Bancária",
            "Navegue em 'Tesouraria e Bancos > Conciliação Bancária' (/financeiro/conciliacao-bancaria).",
            "Chegamos ao núcleo da conciliação bancária automatizada, com cruzamento entre extrato bancário e o razão contábil."
          ),
          ...createStepNumbered(
            "8.2",
            "Abrir Conciliação e Carregar Razão",
            "Preencha: Banco 'Banco Virtual Robonuvem', Agência '0001', Conta '20001-1', Período '2025-08', Saldo Inicial '150.000,00'. Clique em 'Abrir Conciliação & Carregar Razão'.",
            "Ao abrir a sessão, o CeleriFlow busca em tempo real todos os lançamentos contábeis e de tesouraria registrados até o fim do mês, calculando o Saldo do Razão."
          ),
          ...createStepNumbered(
            "8.3",
            "Apresentar o Quadro Demonstrativo de Saldos",
            "Destaque os 6 cards: Saldo Inicial (R$ 150.000,00), (+) Entradas, (-) Saídas, Saldo Final Extrato, Saldo do Razão e Diferença (R$ 0,00).",
            "Vejam que o sistema calcula a conciliação completa dos saldos e aponta qualquer divergência centavo a centavo."
          ),
          ...createStepNumbered(
            "8.4",
            "Executar Motor de Correspondência Automática (9 Regras)",
            "Clique em 'Executar Correspondência Automática (Motor de 9 Regras)'. Apresente a tabela de correspondências com o score de confiança (100%), descrição da match e valor conciliado.",
            "O motor de inteligência contábil aplica as 9 regras do edital para casar os itens de extrato com os lançamentos contábeis."
          ),
          ...createStepNumbered(
            "8.5",
            "Confirmar Conciliação no CeleriFlow",
            "Clique em 'Confirmar Conciliação no CeleriFlow'. Exiba a mensagem de sucesso, o Recibo de Transmissão ('REC-CONCIL-...'), o Hash SHA-256 e o status final 'CONCILIADA'.",
            "A conciliação está oficialmente homologada e travada para alterações, com recibo auditável."
          ),
          createCallout("Evidência a Registrar", "Item MOD-05 atendido: Carga do razão, cálculo de saldos, correspondência pelas 9 regras, divergência zerada e conciliação confirmada.", "success"),

          // ETAPA 9
          createHeading2("ETAPA 9 — Auditoria de Uso e Encerramento da Sessão"),
          ...createStepNumbered(
            "9.1",
            "Apresentar a Trilha de Auditoria (Configurações > Auditoria de Uso)",
            "Acesse a trilha de auditoria e mostre os registros gravados durante a apresentação: usuário responsável, data/hora, ação realizada e módulo.",
            "Todas as ações executadas durante a sessão geraram trilha de auditoria imutável, atendendo aos princípios de conformidade e LGPD."
          ),
          ...createStepNumbered(
            "9.2",
            "Conferir a Ata da Comissão",
            "Solicite à comissão o preenchimento da ficha de avaliação, confirmando o resultado 'ATENDE' para todos os 8 itens demonstrados.",
            "Apresentamos com 100% de sucesso todos os requisitos técnicos obrigatórios e os módulos de automação financeira do edital."
          ),

          // Seção 5: Respostas para Perguntas Difíceis
          createHeading1("5. Guia Rápido de Respostas para Perguntas da Comissão"),
          createBullet(
            "O ambiente de demonstração utiliza o Banco Virtual Robonuvem em modo Sandbox exatamente para isolar testes de tráfego financeiro real, garantindo segurança jurídica e repetibilidade dos testes sem risco de movimentação indevida de fundos públicos.",
            "❓ 'Por que estamos usando o Banco Virtual Robonuvem e não o banco real da prefeitura?'"
          ),
          createBullet(
            "Sim. Toda a gravação de receitas, despesas, movimentos de caixa, partidas do razão e conciliações é persistida de forma definitiva no banco de dados relacional do CeleriFlow, pronta para ser integrada aos sistemas oficiais de contabilidade.",
            "❓ 'Os dados gerados nesta sessão são reais no CeleriFlow?'"
          ),
          createBullet(
            "O CeleriFlow possui adaptadores nativos para APIs bancárias oficiais (Banco do Brasil, Caixa, Itaú, Bradesco, Santander), VAN bancária CNAB 240/400 e arquivos OFX padrão FEBRABAN, operando com chaves de integração municipais fornecidas no pós-contratação.",
            "❓ 'Como será feita a conexão com os bancos reais após a assinatura do contrato?'"
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outDir = path.resolve(process.cwd(), "docs/São João do Ivai");
  const outFile = path.join(outDir, "GUIA_PASSO_A_PASSO_TESTES_E_APRESENTACAO_POC_SAO_JOAO_DO_IVAI.docx");
  fs.writeFileSync(outFile, buffer);
  console.log(`Guia Mestre de Testes gerado com sucesso em: ${outFile}`);
}

generateMasterGuideDocx().catch((err) => {
  console.error("Erro ao gerar guia mestre docx:", err);
  process.exit(1);
});
