export type IntegrationEnvironment = "MOCK" | "DEMO" | "SANDBOX" | "HOMOLOGACAO" | "PRODUCAO";
export type IntegrationOperation =
  | "HEALTH_CHECK"
  | "DOWNLOAD_STATEMENT"
  | "EXPORT_TCE_BIDDING_ACCOUNTABILITY"
  | "EXPORT_TCE_CONTRACT_ACCOUNTABILITY"
  | "EXPORT_PNCP_PROCUREMENT"
  | "EXPORT_PNCP_PROCEDURE_RESULT"
  | "EXPORT_PNCP_CONTRACT"
  | "IMPORT_RENAME"
  | "EXPORT_HORUS"
  | "EXPORT_SIGAF"
  | "EXPORT_HEALTH_STOCK_TRANSPARENCY"
  | "EXPORT_ESUS_VACCINATION"
  | "EXCHANGE_LAB_DEVICE";
export type MockIntegrationResult = {
  status: "SUCESSO" | "FALHA";
  message: string;
  externalId: string;
  evidence: { dispatch: "MOCK"; scenario: string; externalId: string };
};

export const integrationEnvironments = ["MOCK", "DEMO", "SANDBOX", "HOMOLOGACAO", "PRODUCAO"] as const;

export type IntegrationDefinition = {
  code: string;
  name: string;
  category: "GOVERNAMENTAL" | "FISCAL" | "BANCARIA" | "COMUNICACAO" | "ASSINATURA" | "PUBLICACAO" | "SAUDE";
  provider: string;
  description: string;
};

export const integrationCatalog: readonly IntegrationDefinition[] = [
  { code: "TCE_PB_SAGRES", name: "TCE-PB / SAGRES", category: "GOVERNAMENTAL", provider: "Tribunal de Contas da Paraíba", description: "Remessas, validações, protocolos e retornos do SAGRES." },
  { code: "SICONFI", name: "SICONFI", category: "GOVERNAMENTAL", provider: "STN", description: "MSC, DCA, RREO e RGF." },
  { code: "ESOCIAL", name: "eSocial", category: "GOVERNAMENTAL", provider: "Receita Federal", description: "Eventos de prestadores e folha quando aplicável." },
  { code: "EFD_REINF", name: "EFD-Reinf", category: "GOVERNAMENTAL", provider: "Receita Federal", description: "Eventos de retenções e pagamentos." },
  { code: "DIRF_SEFIP", name: "DIRF e SEFIP", category: "GOVERNAMENTAL", provider: "Receita Federal", description: "Arquivos por competência, quando exigidos." },
  { code: "PNCP", name: "PNCP", category: "GOVERNAMENTAL", provider: "Portal Nacional de Contratações Públicas", description: "Publicação e consulta de contratações." },
  { code: "SIAFIC_DEMO", name: "SIAFIC DEMO", category: "GOVERNAMENTAL", provider: "Receptor SIAFIC - Robonuvem DEMO", description: "Transmissão autenticada de fornecedores e instrumentos para o receptor externo de demonstração." },
  { code: "NFE_CTE", name: "NF-e e CT-e", category: "FISCAL", provider: "SEFAZ", description: "Consulta, captura e validação de documentos fiscais." },
  { code: "NFSE", name: "NFS-e", category: "FISCAL", provider: "Provedor nacional ou municipal", description: "Emissão, consulta e captura de notas de serviço." },
  { code: "BANCO_CNAB", name: "CNAB", category: "BANCARIA", provider: "Instituição financeira", description: "Remessa, retorno e liquidação bancária." },
  { code: "BANCO_OFX", name: "OFX", category: "BANCARIA", provider: "Instituição financeira", description: "Importação de extratos e conciliação." },
  { code: "BANCO_API", name: "API Bancária", category: "BANCARIA", provider: "Instituição financeira", description: "Saldos, extratos e pagamentos via API." },
  { code: "PIX_BOLETO", name: "PIX e Boleto", category: "BANCARIA", provider: "PSP ou banco contratado", description: "Cobrança, consulta e webhook de liquidação." },
  { code: "EMAIL_SMTP", name: "E-mail institucional", category: "COMUNICACAO", provider: "Servidor SMTP", description: "Notificações e comunicações do sistema." },
  { code: "WHATSAPP", name: "WhatsApp", category: "COMUNICACAO", provider: "Meta ou BSP contratado", description: "Notificações e atendimento registrado." },
  { code: "ICP_BRASIL", name: "Assinatura ICP-Brasil", category: "ASSINATURA", provider: "ICP-Brasil", description: "Assinatura A1/A3 e validação de cadeia." },
  { code: "DIARIO_OFICIAL", name: "Diário Oficial", category: "PUBLICACAO", provider: "Canal definido pelo município", description: "Publicação, protocolo e retorno de documentos oficiais." },
  { code: "MS_RENAME", name: "RENAME", category: "SAUDE", provider: "Ministério da Saúde", description: "Importação versionada do catálogo nacional de medicamentos essenciais." },
  { code: "HORUS", name: "Hórus", category: "SAUDE", provider: "Ministério da Saúde", description: "Intercâmbio farmacêutico conforme endpoint contratado pela implantação." },
  { code: "SIGAF", name: "SIGAF", category: "SAUDE", provider: "Destino definido pela implantação", description: "Remessa farmacêutica diária com histórico de execução." },
  { code: "TRANSPARENCIA_SAUDE", name: "Transparência de medicamentos", category: "SAUDE", provider: "Portal municipal", description: "Publicação exclusiva de posição agregada de estoque." },
  { code: "ESUS_VACINACAO", name: "e-SUS Vacinação", category: "SAUDE", provider: "Ministério da Saúde", description: "Exportação versionada de fichas de vacinação." },
  { code: "DISPOSITIVO_ASSISTENCIAL", name: "Dispositivo assistencial", category: "SAUDE", provider: "Equipamento configurado", description: "Mensagens A15, HL7 ou ZPL com correlação e idempotência." },
] as const;

export function getIntegrationDefinition(code: string) {
  return integrationCatalog.find((integration) => integration.code === code);
}

export function isIntegrationEnvironment(value: string): value is IntegrationEnvironment {
  return integrationEnvironments.includes(value as IntegrationEnvironment);
}

export function isEnvironmentAllowedForIntegration(code: string, environment: IntegrationEnvironment) {
  if (code === "BANCO_API") return environment === "SANDBOX";
  if (code === "SIAFIC_DEMO") return environment === "DEMO";
  if (["MS_RENAME", "HORUS", "SIGAF", "TRANSPARENCIA_SAUDE", "ESUS_VACINACAO", "DISPOSITIVO_ASSISTENCIAL"].includes(code)) return environment === "SANDBOX" || environment === "HOMOLOGACAO";
  return environment === "MOCK";
}

export function assertIntegrationEnvironmentPolicy(code: string, environment: IntegrationEnvironment) {
  if (!getIntegrationDefinition(code)) throw new Error("Conector externo não reconhecido.");
  if (environment === "PRODUCAO") throw new Error("Despachos para PRODUCAO são bloqueados por política da instalação.");
  if (code === "BANCO_API" && environment !== "SANDBOX") {
    throw new Error("O Banco Virtual Robonuvem aceita somente o ambiente SANDBOX.");
  }
  if (code === "SIAFIC_DEMO" && environment !== "DEMO") {
    throw new Error("O receptor SIAFIC DEMO aceita somente o ambiente DEMO.");
  }
  const controlledHealthConnector = ["MS_RENAME", "HORUS", "SIGAF", "TRANSPARENCIA_SAUDE", "ESUS_VACINACAO", "DISPOSITIVO_ASSISTENCIAL"].includes(code);
  if (controlledHealthConnector && environment !== "SANDBOX" && environment !== "HOMOLOGACAO") {
    throw new Error(`O conector ${code} exige ambiente SANDBOX ou HOMOLOGACAO e endpoint controlado.`);
  }
  if (code !== "BANCO_API" && code !== "SIAFIC_DEMO" && !controlledHealthConnector && environment !== "MOCK") {
    throw new Error(`O conector ${code} é restrito ao ambiente MOCK e não realiza conexões de rede.`);
  }
}

export function assertIntegrationOperation(code: string, operation: IntegrationOperation) {
  if (operation === "DOWNLOAD_STATEMENT" && code !== "BANCO_API") {
    throw new Error("DOWNLOAD_STATEMENT é suportada somente pela integração BANCO_API.");
  }
  const procurementOperations: Partial<Record<IntegrationOperation, string>> = {
    EXPORT_TCE_BIDDING_ACCOUNTABILITY: "TCE_PB_SAGRES",
    EXPORT_TCE_CONTRACT_ACCOUNTABILITY: "TCE_PB_SAGRES",
    EXPORT_PNCP_PROCUREMENT: "PNCP",
    EXPORT_PNCP_PROCEDURE_RESULT: "PNCP",
    EXPORT_PNCP_CONTRACT: "PNCP",
  };
  if (procurementOperations[operation] && procurementOperations[operation] !== code) {
    throw new Error(`${operation} não é suportada pela integração ${code}.`);
  }
  const healthOperations: Partial<Record<IntegrationOperation, string>> = {
    IMPORT_RENAME: "MS_RENAME",
    EXPORT_HORUS: "HORUS",
    EXPORT_SIGAF: "SIGAF",
    EXPORT_HEALTH_STOCK_TRANSPARENCY: "TRANSPARENCIA_SAUDE",
    EXPORT_ESUS_VACCINATION: "ESUS_VACINACAO",
    EXCHANGE_LAB_DEVICE: "DISPOSITIVO_ASSISTENCIAL",
  };
  if (healthOperations[operation] && healthOperations[operation] !== code) throw new Error(`${operation} não é suportada pela integração ${code}.`);
}

export function runMockIntegration(code: string, operation: IntegrationOperation, mockScenario?: unknown): MockIntegrationResult {
  const definition = getIntegrationDefinition(code);
  if (!definition) throw new Error("Conector externo não reconhecido.");

  const scenario = getMockScenarioName(mockScenario);
  const failed = scenario === "failure";
  const externalId = `MOCK-${code}-${operation}-${scenario}`;
  return {
    status: failed ? "FALHA" : "SUCESSO",
    message: failed
      ? `${definition.name}: cenário MOCK ${scenario} retornou falha simulada. Nenhuma conexão externa foi realizada.`
      : `${definition.name}: cenário MOCK ${scenario} concluído. Nenhuma conexão externa foi realizada.`,
    externalId,
    evidence: { dispatch: "MOCK", scenario, externalId },
  };
}

function getMockScenarioName(mockScenario: unknown) {
  if (!mockScenario || typeof mockScenario !== "object" || Array.isArray(mockScenario)) return "success";
  const scenario = (mockScenario as Record<string, unknown>).scenario;
  return typeof scenario === "string" && /^[a-z0-9_-]+$/i.test(scenario.trim())
    ? scenario.trim().toLowerCase()
    : "success";
}
