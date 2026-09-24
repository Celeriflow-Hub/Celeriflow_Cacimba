export const procurementExportStatuses = ["PENDING_CONFIGURATION", "QUEUED", "CONFIRMED", "REJECTED"] as const;
export type ProcurementExportStatus = (typeof procurementExportStatuses)[number];

export const procurementExportOperations = [
  "BIDDING_ACCOUNTABILITY",
  "CONTRACT_ACCOUNTABILITY",
  "PROCUREMENT",
  "PROCEDURE_RESULT",
  "CONTRACT",
] as const;
export type ProcurementExportOperation = (typeof procurementExportOperations)[number];

export const procurementExportPackageDefinitions = [
  {
    code: "TCE_BIDDING_ACCOUNTABILITY",
    name: "Prestacao de contas de licitacao",
    integrationCode: "TCE_PB_SAGRES",
    operation: "EXPORT_TCE_BIDDING_ACCOUNTABILITY",
    configurationOperation: "BIDDING_ACCOUNTABILITY",
    targetType: "BIDDING",
    requirementIds: ["CLC-038"],
  },
  {
    code: "TCE_CONTRACT_ACCOUNTABILITY",
    name: "Prestacao de contas de contrato",
    integrationCode: "TCE_PB_SAGRES",
    operation: "EXPORT_TCE_CONTRACT_ACCOUNTABILITY",
    configurationOperation: "CONTRACT_ACCOUNTABILITY",
    targetType: "CONTRACT",
    requirementIds: ["CLC-038"],
  },
  {
    code: "PNCP_PROCUREMENT",
    name: "PNCP: compra e licitacao",
    integrationCode: "PNCP",
    operation: "EXPORT_PNCP_PROCUREMENT",
    configurationOperation: "PROCUREMENT",
    targetType: "BIDDING",
    requirementIds: ["CLC-040"],
  },
  {
    code: "PNCP_PROCEDURE_RESULT",
    name: "PNCP: procedimento e resultado",
    integrationCode: "PNCP",
    operation: "EXPORT_PNCP_PROCEDURE_RESULT",
    configurationOperation: "PROCEDURE_RESULT",
    targetType: "BIDDING",
    requirementIds: ["CLC-048"],
    requiresCurrentResult: true,
  },
  {
    code: "PNCP_CONTRACT",
    name: "PNCP: contexto contratual",
    integrationCode: "PNCP",
    operation: "EXPORT_PNCP_CONTRACT",
    configurationOperation: "CONTRACT",
    targetType: "CONTRACT",
    requirementIds: ["CLC-079"],
  },
] as const;

export type ProcurementExportPackageCode = (typeof procurementExportPackageDefinitions)[number]["code"];
export type ProcurementExportPackageDefinition = (typeof procurementExportPackageDefinitions)[number];
export type ProcurementExportTargetType = ProcurementExportPackageDefinition["targetType"];

export type ProcurementExportLayout = {
  code: string;
  version: string;
  specificationReference: string;
  competence?: string;
};

export type ProcurementExportConfigurationStatus = {
  supported: boolean;
  ready: boolean;
  issues: string[];
  layout: ProcurementExportLayout | null;
  operations: ProcurementExportOperation[];
};

type ConfigurationInput = {
  code: string;
  credentialReference?: string | null;
  configuration?: unknown;
  requestedOperation?: ProcurementExportOperation;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isProcurementExportOperation(value: string): value is ProcurementExportOperation {
  return (procurementExportOperations as readonly string[]).includes(value);
}

function parseLayout(configuration: unknown) {
  if (!isRecord(configuration) || !isRecord(configuration.layout)) return null;
  const layout = configuration.layout;
  const code = text(layout.code);
  const version = text(layout.version);
  const specificationReference = text(layout.specificationReference);
  const competence = text(layout.competence);
  if (!code || !version || !specificationReference) return null;
  return {
    code,
    version,
    specificationReference,
    ...(competence ? { competence } : {}),
  };
}

function parseOperations(configuration: unknown) {
  if (!isRecord(configuration) || !Array.isArray(configuration.operations)) return [];
  return [...new Set(configuration.operations.map(text).filter(isProcurementExportOperation))];
}

function isTemplatePlaceholder(value: string) {
  return value === "VERSAO_OFICIAL"
    || value.startsWith("IDENTIFICADOR_OFICIAL_")
    || value.startsWith("URL_OU_REFERENCIA_")
    || value === "AAAA-MM";
}

function supportedOperations(code: string): readonly ProcurementExportOperation[] {
  if (code === "TCE_PB_SAGRES") return ["BIDDING_ACCOUNTABILITY", "CONTRACT_ACCOUNTABILITY"];
  if (code === "PNCP") return ["PROCUREMENT", "PROCEDURE_RESULT", "CONTRACT"];
  return [];
}

export function isProcurementExportIntegration(code: string) {
  return code === "TCE_PB_SAGRES" || code === "PNCP";
}

export function getProcurementExportPackageDefinition(code: string) {
  return procurementExportPackageDefinitions.find((definition) => definition.code === code);
}

export function isProcurementExportStatus(value: string): value is ProcurementExportStatus {
  return (procurementExportStatuses as readonly string[]).includes(value);
}

export function resolveProcurementExportQueueState(input: {
  hasConfigurationIssues: boolean;
  requiresCurrentResult: boolean;
  resultReady: boolean;
}): Extract<ProcurementExportStatus, "PENDING_CONFIGURATION" | "QUEUED" | "REJECTED"> {
  if (input.hasConfigurationIssues) return "PENDING_CONFIGURATION";
  if (input.requiresCurrentResult && !input.resultReady) return "REJECTED";
  return "QUEUED";
}

// Layout metadata is public. Credentials remain only in credentialReference.
export function getProcurementExportConfigurationStatus(input: ConfigurationInput): ProcurementExportConfigurationStatus {
  if (!isProcurementExportIntegration(input.code)) {
    return { supported: false, ready: false, issues: [], layout: null, operations: [] };
  }

  const issues: string[] = [];
  if (!text(input.credentialReference)) {
    issues.push("Informe uma referencia de credencial no cofre para liberar pacotes de exportacao.");
  }

  const layout = parseLayout(input.configuration);
  if (!layout) {
    issues.push("Informe layout.code, layout.version e layout.specificationReference no JSON publico.");
  } else if ([layout.code, layout.version, layout.specificationReference, layout.competence ?? ""].some(isTemplatePlaceholder)) {
    issues.push("Substitua os valores de exemplo do leiaute pela identificacao e especificacao oficiais.");
  }

  if (input.code === "TCE_PB_SAGRES" && (!layout?.competence || !/^\d{4}-(0[1-9]|1[0-2])$/.test(layout.competence))) {
    issues.push("Informe layout.competence no formato AAAA-MM para a remessa do Tribunal.");
  }

  const allowed = supportedOperations(input.code);
  const operations = parseOperations(input.configuration).filter((operation) => allowed.includes(operation));
  if (!operations.length) {
    issues.push(`Declare ao menos uma operacao em operations: ${allowed.join(", ")}.`);
  }
  if (input.requestedOperation && !operations.includes(input.requestedOperation)) {
    issues.push(`A operacao ${input.requestedOperation} nao foi declarada para este conector.`);
  }

  return { supported: true, ready: issues.length === 0, issues, layout, operations };
}

export function parseProcurementExportConfigurationJson(value: string) {
  if (!value.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function getProcurementExportConfigurationTemplate(code: string) {
  if (code === "TCE_PB_SAGRES") {
    return JSON.stringify({
      layout: {
        code: "IDENTIFICADOR_OFICIAL_DO_LEIAUTE",
        version: "VERSAO_OFICIAL",
        specificationReference: "URL_OU_REFERENCIA_DA_ESPECIFICACAO_OFICIAL",
        competence: "AAAA-MM",
      },
      operations: ["BIDDING_ACCOUNTABILITY", "CONTRACT_ACCOUNTABILITY"],
    }, null, 2);
  }
  if (code === "PNCP") {
    return JSON.stringify({
      layout: {
        code: "IDENTIFICADOR_OFICIAL_DO_CONTRATO_TECNICO",
        version: "VERSAO_OFICIAL",
        specificationReference: "URL_OU_REFERENCIA_DA_ESPECIFICACAO_OFICIAL",
      },
      operations: ["PROCUREMENT", "PROCEDURE_RESULT", "CONTRACT"],
    }, null, 2);
  }
  return "";
}
