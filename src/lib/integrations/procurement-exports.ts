import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";
import { createIdempotencyKey, sanitizeIntegrationValue } from "./contract";
import {
  getProcurementExportConfigurationStatus,
  getProcurementExportPackageDefinition,
  isProcurementExportStatus,
  procurementExportPackageDefinitions,
  resolveProcurementExportQueueState,
  type ProcurementExportConfigurationStatus,
  type ProcurementExportPackageCode,
  type ProcurementExportPackageDefinition,
  type ProcurementExportStatus,
  type ProcurementExportTargetType,
} from "./procurement-export-contract";
import {
  createProcurementExportIdempotencyKey,
  procurementExportConfigurationFingerprint,
} from "./procurement-export-keys";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

type Tx = Prisma.TransactionClient;

const EXPORT_CONTRACT_VERSION = "CLC-P8-POC-1";
const exportInFlightKeys = new Set<string>();

const biddingExportInclude = {
  process: {
    select: {
      id: true,
      number: true,
      object: true,
      type: true,
      modality: true,
      estimatedValue: true,
      updatedAt: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          customName: true,
          quantity: true,
          estimatedUnitValue: true,
          catalogItem: { select: { name: true, unit: true } },
          material: { select: { name: true, unitOfMeasure: true } },
        },
      },
    },
  },
  biddingLots: {
    orderBy: { number: "asc" },
    select: {
      id: true,
      number: true,
      description: true,
      status: true,
      estimatedValueDecimal: true,
      results: {
        where: { isCurrent: true },
        orderBy: { decidedAt: "asc" },
        select: {
          id: true,
          status: true,
          totalValueDecimal: true,
          unitValueDecimal: true,
          decidedAt: true,
          participant: { select: { id: true, displayCode: true, supplierId: true } },
        },
      },
    },
  },
} satisfies Prisma.BiddingInclude;

const contractExportInclude = {
  process: { select: { id: true, number: true, object: true, modality: true } },
  supplier: { select: { id: true } },
  sourceBudgetUnit: { select: { code: true, name: true } },
  amendments: {
    orderBy: { createdAt: "asc" },
    select: { id: true, type: true, status: true, newValue: true, newEndDate: true, createdAt: true },
  },
} satisfies Prisma.ContractInclude;

type BiddingExportRecord = Prisma.BiddingGetPayload<{ include: typeof biddingExportInclude }>;
type ContractExportRecord = Prisma.ContractGetPayload<{ include: typeof contractExportInclude }>;

type ExportTarget = {
  type: ProcurementExportTargetType;
  id: string;
  reference: string;
  secondaryReference: string;
  updatedAt: string;
  snapshot: Record<string, unknown>;
  resultReady: boolean;
};

type PersistedExportPayload = {
  contractVersion: string;
  kind: "PROCUREMENT_EXPORT_PACKAGE";
  packageCode: ProcurementExportPackageCode;
  target: { type: ProcurementExportTargetType; id: string; reference: string };
  sourceFingerprint: string;
  configurationFingerprint: string;
  idempotencyKey: string;
  state: ProcurementExportStatus;
  blockedReasons?: string[];
  validation?: { code: string; message: string };
  exportPackage?: Record<string, unknown>;
  outcome?: { reference: string; recordedAt: string; source: "EXTERNAL_OPERATOR_RECORD" };
};

type PersistedRun = {
  id: string;
  operation: string;
  status: string;
  message: string;
  externalId: string | null;
  payload: unknown;
  createdAt: Date;
};

export type ProcurementExportBoardRow = {
  id: string;
  packageCode: ProcurementExportPackageCode;
  packageName: string;
  requirementIds: string[];
  integrationCode: string;
  targetId: string;
  targetType: ProcurementExportTargetType;
  targetReference: string;
  targetSecondaryReference: string;
  state: ProcurementExportStatus | null;
  message: string | null;
  blockedReasons: string[];
  runId: string | null;
  hasExportPackage: boolean;
  externalId: string | null;
  createdAt: string | null;
};

export type QueueProcurementExportResult = {
  runId: string;
  status: ProcurementExportStatus;
  message: string;
  reused: boolean;
};

export class ProcurementExportError extends Error {}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function requiredText(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new ProcurementExportError(`${label} obrigatorio.`);
  return normalized;
}

function decimal(value: { toString: () => string } | null | undefined) {
  return value === null || value === undefined ? null : value.toString();
}

function itemName(item: { catalogItem: { name: string } | null; material: { name: string } | null; customName: string | null }) {
  return item.catalogItem?.name ?? item.material?.name ?? item.customName ?? "Item sem descricao";
}

function itemUnit(item: { catalogItem: { unit: string } | null; material: { unitOfMeasure: string } | null }) {
  return item.catalogItem?.unit ?? item.material?.unitOfMeasure ?? "UN";
}

function targetFromBidding(bidding: BiddingExportRecord): ExportTarget {
  const lots = bidding.biddingLots.map((lot) => ({
    id: lot.id,
    number: lot.number,
    description: lot.description,
    status: lot.status,
    estimatedValue: decimal(lot.estimatedValueDecimal),
    currentResults: lot.results.map((result) => ({
      id: result.id,
      status: result.status,
      participantId: result.participant.id,
      participantReference: result.participant.displayCode ?? result.participant.supplierId,
      totalValue: decimal(result.totalValueDecimal),
      unitValue: decimal(result.unitValueDecimal),
      decidedAt: result.decidedAt.toISOString(),
    })),
  }));
  const snapshot = {
    sourceEntity: "BIDDING",
    bidding: {
      id: bidding.id,
      number: bidding.number,
      modality: bidding.modality,
      status: bidding.status,
      publicationDate: bidding.publicationDate?.toISOString() ?? null,
      sessionDate: bidding.sessionDate?.toISOString() ?? null,
      updatedAt: bidding.updatedAt.toISOString(),
    },
    purchaseProcess: {
      id: bidding.process.id,
      number: bidding.process.number,
      object: bidding.process.object,
      type: bidding.process.type,
      modality: bidding.process.modality,
      estimatedValue: bidding.process.estimatedValue,
      updatedAt: bidding.process.updatedAt.toISOString(),
      items: bidding.process.items.map((item) => ({
        id: item.id,
        description: itemName(item),
        unit: itemUnit(item),
        quantity: item.quantity,
        estimatedUnitValue: item.estimatedUnitValue,
      })),
    },
    lots,
  };
  return {
    type: "BIDDING",
    id: bidding.id,
    reference: bidding.number,
    secondaryReference: `Processo ${bidding.process.number}`,
    updatedAt: bidding.updatedAt.toISOString(),
    snapshot,
    resultReady: lots.length > 0 && lots.every((lot) => lot.currentResults.length > 0),
  };
}

function targetFromContract(contract: ContractExportRecord): ExportTarget {
  const snapshot = {
    sourceEntity: "CONTRACT",
    contract: {
      id: contract.id,
      number: contract.number,
      object: contract.object,
      status: contract.status,
      initialValue: contract.initialValue,
      updatedValue: contract.updatedValue,
      startDate: contract.startDate.toISOString(),
      endDate: contract.endDate.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      supplierId: contract.supplierId,
      sourceBudgetUnit: contract.sourceBudgetUnit ? {
        code: contract.sourceBudgetUnit.code,
        name: contract.sourceBudgetUnit.name,
      } : null,
    },
    purchaseProcess: {
      id: contract.process.id,
      number: contract.process.number,
      object: contract.process.object,
      modality: contract.process.modality,
    },
    amendments: contract.amendments.map((amendment) => ({
      id: amendment.id,
      type: amendment.type,
      status: amendment.status,
      newValue: amendment.newValue,
      newEndDate: amendment.newEndDate?.toISOString() ?? null,
      createdAt: amendment.createdAt.toISOString(),
    })),
    documentVersion: null,
  };
  return {
    type: "CONTRACT",
    id: contract.id,
    reference: contract.number,
    secondaryReference: `Processo ${contract.process.number}`,
    updatedAt: contract.updatedAt.toISOString(),
    snapshot,
    resultReady: true,
  };
}

async function loadExportTarget(db: PrismaClient, definition: ProcurementExportPackageDefinition, targetId: string) {
  if (definition.targetType === "BIDDING") {
    const bidding = await db.bidding.findUnique({ where: { id: targetId }, include: biddingExportInclude });
    if (!bidding) throw new ProcurementExportError("Licitacao nao encontrada para o pacote de exportacao.");
    return targetFromBidding(bidding);
  }
  const contract = await db.contract.findUnique({ where: { id: targetId }, include: contractExportInclude });
  if (!contract) throw new ProcurementExportError("Contrato nao encontrado para o pacote de exportacao.");
  return targetFromContract(contract);
}

function exportRunPayload(value: unknown): PersistedExportPayload | null {
  const payload = asRecord(value);
  const target = asRecord(payload?.target);
  if (
    payload?.kind !== "PROCUREMENT_EXPORT_PACKAGE"
    || typeof payload.packageCode !== "string"
    || !getProcurementExportPackageDefinition(payload.packageCode)
    || typeof payload.idempotencyKey !== "string"
    || typeof payload.state !== "string"
    || !isProcurementExportStatus(payload.state)
    || !target
    || (target.type !== "BIDDING" && target.type !== "CONTRACT")
    || typeof target.id !== "string"
    || typeof target.reference !== "string"
    || typeof payload.sourceFingerprint !== "string"
    || typeof payload.configurationFingerprint !== "string"
  ) return null;

  return payload as unknown as PersistedExportPayload;
}

function toQueueResult(run: PersistedRun, payload: PersistedExportPayload, reused: boolean): QueueProcurementExportResult {
  return { runId: run.id, status: payload.state, message: run.message, reused };
}

function findMatchingRun(runs: PersistedRun[], idempotencyKey: string) {
  return runs.find((run) => exportRunPayload(run.payload)?.idempotencyKey === idempotencyKey) ?? null;
}

function connectionIssues(
  connection: { status: string; credentialReference: string | null; configuration: unknown } | null,
  definition: ProcurementExportPackageDefinition,
) {
  if (!connection) return ["Conexao de integracao ainda nao configurada nesta instalacao."];
  const configuration = getProcurementExportConfigurationStatus({
    code: definition.integrationCode,
    credentialReference: connection.credentialReference,
    configuration: connection.configuration,
    requestedOperation: definition.configurationOperation,
  });
  const issues = [...configuration.issues];
  if (connection.status !== "ATIVA") {
    issues.push("Execute o teste da conexao e mantenha-a ATIVA antes de preparar pacotes.");
  }
  return issues;
}

function configurationFingerprint(
  connection: { id: string; status: string; environment: string; credentialReference: string | null } | null,
  configuration: ProcurementExportConfigurationStatus,
) {
  if (!connection) return "PENDING_CONNECTION";
  return procurementExportConfigurationFingerprint({
    connectionId: connection.id,
    connectionStatus: connection.status,
    environment: connection.environment,
    credentialReference: connection.credentialReference,
    layout: configuration.layout,
    operations: configuration.operations,
  });
}

function packageManifest(
  definition: ProcurementExportPackageDefinition,
  target: ExportTarget,
  input: { idempotencyKey: string; environment: string; configuration: ProcurementExportConfigurationStatus },
) {
  return {
    contractVersion: EXPORT_CONTRACT_VERSION,
    packageCode: definition.code,
    requirementIds: definition.requirementIds,
    idempotencyKey: input.idempotencyKey,
    delivery: {
      state: "QUEUED",
      mode: "MANUAL_EXTERNAL_HANDOFF",
      note: "Pacote POC preparado para o operador. Nenhuma transmissao de rede ou confirmacao externa foi executada por este fluxo.",
    },
    destination: {
      integrationCode: definition.integrationCode,
      environment: input.environment,
      declaredOperation: definition.configurationOperation,
      layout: input.configuration.layout,
    },
    source: {
      entityType: target.type,
      entityId: target.id,
      reference: target.reference,
      updatedAt: target.updatedAt,
      snapshot: target.snapshot,
    },
    limitations: definition.code === "PNCP_CONTRACT"
      ? ["A versao de documento contratual nao esta vinculada pelo modelo atual; o pacote nao declara documento transmitido."]
      : [],
  };
}

function createPayload(input: {
  definition: ProcurementExportPackageDefinition;
  target: ExportTarget;
  idempotencyKey: string;
  sourceFingerprint: string;
  configurationFingerprint: string;
  state: ProcurementExportStatus;
  blockedReasons?: string[];
  validation?: { code: string; message: string };
  exportPackage?: Record<string, unknown>;
}) {
  return sanitizeIntegrationValue({
    contractVersion: EXPORT_CONTRACT_VERSION,
    kind: "PROCUREMENT_EXPORT_PACKAGE",
    packageCode: input.definition.code,
    target: { type: input.target.type, id: input.target.id, reference: input.target.reference },
    sourceFingerprint: input.sourceFingerprint,
    configurationFingerprint: input.configurationFingerprint,
    idempotencyKey: input.idempotencyKey,
    state: input.state,
    ...(input.blockedReasons?.length ? { blockedReasons: input.blockedReasons } : {}),
    ...(input.validation ? { validation: input.validation } : {}),
    ...(input.exportPackage ? { exportPackage: input.exportPackage } : {}),
  }) as Prisma.InputJsonValue;
}

function messageForState(status: ProcurementExportStatus, details?: string) {
  if (status === "PENDING_CONFIGURATION") return `Pacote bloqueado por configuracao: ${details ?? "revise credencial, leiaute e ativacao da conexao."}`;
  if (status === "REJECTED") return `Pacote rejeitado localmente: ${details ?? "os dados minimos do contexto nao foram encontrados."}`;
  if (status === "CONFIRMED") return "Retorno externo registrado pelo operador com referencia de comprovacao.";
  return "Pacote preparado e enfileirado para entrega externa manual. Nenhuma transmissao de rede foi executada.";
}

async function createRunWithAudit(
  tx: Tx,
  input: {
    connectionId: string;
    operation: string;
    environment: string;
    status: ProcurementExportStatus;
    message: string;
    payload: Prisma.InputJsonValue;
    actorUsuarioId: string;
  },
) {
  const { actorUsuarioId, ...runInput } = input;
  const run = await tx.integrationRun.create({ data: runInput });
  await writeAuditEvent(tx, {
    actorUsuarioId,
    eventType: auditEventTypes.administrativeMutation,
    targetType: "PROCUREMENT_EXPORT_PACKAGE",
    targetId: run.id,
  });
  return run;
}

export async function queueProcurementExport(
  db: PrismaClient,
  input: { packageCode: ProcurementExportPackageCode; targetId: string; actorUsuarioId: string },
): Promise<QueueProcurementExportResult> {
  const definition = getProcurementExportPackageDefinition(input.packageCode);
  if (!definition) throw new ProcurementExportError("Pacote de exportacao nao reconhecido.");
  const targetId = requiredText(input.targetId, "Registro de origem");
  const actorUsuarioId = requiredText(input.actorUsuarioId, "Usuario responsavel");
  const target = await loadExportTarget(db, definition, targetId);
  const connection = await db.integrationConnection.findUnique({ where: { code: definition.integrationCode } });
  const configuration = getProcurementExportConfigurationStatus({
    code: definition.integrationCode,
    credentialReference: connection?.credentialReference,
    configuration: connection?.configuration,
    requestedOperation: definition.configurationOperation,
  });
  const blockedReasons = connectionIssues(connection, definition);
  const sourceFingerprint = createIdempotencyKey(target.snapshot);
  const destinationFingerprint = configurationFingerprint(connection, configuration);
  const idempotencyKey = createProcurementExportIdempotencyKey({
    packageCode: definition.code,
    connectionId: connection?.id ?? null,
    configurationFingerprint: destinationFingerprint,
    sourceFingerprint,
  });

  if (!connection) {
    throw new ProcurementExportError("Configure a conexao TCE/PNCP antes de registrar um pacote pendente.");
  }

  const inFlightKey = `${connection.id}:${idempotencyKey}`;
  if (exportInFlightKeys.has(inFlightKey)) {
    throw new ProcurementExportError("Um pacote identico ja esta sendo preparado nesta instancia.");
  }

  exportInFlightKeys.add(inFlightKey);
  try {
    const existingRuns = await db.integrationRun.findMany({
      where: { connectionId: connection.id, operation: definition.operation },
      orderBy: { createdAt: "desc" },
    });
    const existing = findMatchingRun(existingRuns, idempotencyKey);
    if (existing) {
      const payload = exportRunPayload(existing.payload);
      if (payload) return toQueueResult(existing, payload, true);
    }

    const state = resolveProcurementExportQueueState({
      hasConfigurationIssues: blockedReasons.length > 0,
      requiresCurrentResult: "requiresCurrentResult" in definition && definition.requiresCurrentResult,
      resultReady: target.resultReady,
    });
    const validation = state === "REJECTED"
      ? {
        code: "CURRENT_RESULT_REQUIRED",
        message: "O pacote de procedimento e resultado exige resultado atual para todos os lotes da licitacao.",
      }
      : undefined;
    const payload = createPayload({
      definition,
      target,
      idempotencyKey,
      sourceFingerprint,
      configurationFingerprint: destinationFingerprint,
      state,
      ...(state === "PENDING_CONFIGURATION" ? { blockedReasons } : {}),
      ...(validation ? { validation } : {}),
      ...(state === "QUEUED" ? {
        exportPackage: packageManifest(definition, target, {
          idempotencyKey,
          environment: connection.environment,
          configuration,
        }),
      } : {}),
    });
    const message = messageForState(state, state === "PENDING_CONFIGURATION" ? blockedReasons.join(" ") : validation?.message);
    const run = await db.$transaction((tx) => createRunWithAudit(tx, {
      connectionId: connection.id,
      operation: definition.operation,
      environment: connection.environment,
      status: state,
      message,
      payload,
      actorUsuarioId,
    }));
    return { runId: run.id, status: state, message: run.message, reused: false };
  } finally {
    exportInFlightKeys.delete(inFlightKey);
  }
}

function externalReference(value: string) {
  const normalized = requiredText(value, "Referencia de retorno externo");
  if (normalized.length > 200 || !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(normalized)) {
    throw new ProcurementExportError("A referencia externa deve conter apenas letras, numeros e . _ : / -.");
  }
  return normalized;
}

export async function recordProcurementExportOutcome(
  db: PrismaClient,
  input: { runId: string; status: Extract<ProcurementExportStatus, "CONFIRMED" | "REJECTED">; externalReference: string; actorUsuarioId: string },
) {
  const runId = requiredText(input.runId, "Pacote de exportacao");
  const actorUsuarioId = requiredText(input.actorUsuarioId, "Usuario responsavel");
  const reference = externalReference(input.externalReference);
  const run = await db.integrationRun.findUnique({ where: { id: runId }, include: { connection: { select: { code: true } } } });
  if (!run || !["TCE_PB_SAGRES", "PNCP"].includes(run.connection.code)) {
    throw new ProcurementExportError("Pacote de exportacao nao encontrado.");
  }
  const payload = exportRunPayload(run.payload);
  if (!payload) throw new ProcurementExportError("O historico selecionado nao e um pacote de exportacao de Compras.");
  if (payload.state === "PENDING_CONFIGURATION") {
    throw new ProcurementExportError("Pacotes pendentes de configuracao nao podem receber retorno externo.");
  }
  if (payload.state === "CONFIRMED" || payload.state === "REJECTED") {
    if (payload.state === input.status && run.externalId === reference) return { runId: run.id, status: payload.state, reused: true };
    throw new ProcurementExportError("O pacote ja possui retorno terminal registrado e seu historico nao pode ser sobrescrito.");
  }
  if (payload.state !== "QUEUED") throw new ProcurementExportError("O pacote nao esta disponivel para registro de retorno.");

  const nextPayload = {
    ...payload,
    state: input.status,
    outcome: {
      reference,
      recordedAt: new Date().toISOString(),
      source: "EXTERNAL_OPERATOR_RECORD" as const,
    },
  };
  const updated = await db.$transaction(async (tx) => {
    const result = await tx.integrationRun.update({
      where: { id: run.id },
      data: {
        status: input.status,
        externalId: reference,
        message: input.status === "CONFIRMED"
          ? messageForState("CONFIRMED")
          : "Retorno externo de rejeicao registrado pelo operador com referencia de comprovacao.",
        payload: sanitizeIntegrationValue(nextPayload) as Prisma.InputJsonValue,
      },
    });
    await writeAuditEvent(tx, {
      actorUsuarioId,
      eventType: auditEventTypes.administrativeMutation,
      targetType: "PROCUREMENT_EXPORT_PACKAGE",
      targetId: run.id,
    });
    return result;
  });
  return { runId: updated.id, status: input.status, reused: false };
}

function boardRow(
  definition: ProcurementExportPackageDefinition,
  target: ExportTarget,
  connection: { id: string; status: string; environment: string; credentialReference: string | null; configuration: unknown; runs: PersistedRun[] } | null,
): ProcurementExportBoardRow {
  const configuration = getProcurementExportConfigurationStatus({
    code: definition.integrationCode,
    credentialReference: connection?.credentialReference,
    configuration: connection?.configuration,
    requestedOperation: definition.configurationOperation,
  });
  const blockedReasons = connectionIssues(connection, definition);
  const sourceFingerprint = createIdempotencyKey(target.snapshot);
  const configurationHash = configurationFingerprint(connection, configuration);
  const idempotencyKey = createProcurementExportIdempotencyKey({
    packageCode: definition.code,
    connectionId: connection?.id ?? null,
    configurationFingerprint: configurationHash,
    sourceFingerprint,
  });
  const run = connection ? findMatchingRun(connection.runs, idempotencyKey) : null;
  const payload = run ? exportRunPayload(run.payload) : null;
  const state = payload?.state ?? (blockedReasons.length ? "PENDING_CONFIGURATION" : null);
  return {
    id: `${definition.code}:${target.id}`,
    packageCode: definition.code,
    packageName: definition.name,
    requirementIds: [...definition.requirementIds],
    integrationCode: definition.integrationCode,
    targetId: target.id,
    targetType: target.type,
    targetReference: target.reference,
    targetSecondaryReference: target.secondaryReference,
    state,
    message: run?.message ?? null,
    blockedReasons,
    runId: run?.id ?? null,
    hasExportPackage: Boolean(payload?.exportPackage),
    externalId: run?.externalId ?? null,
    createdAt: run?.createdAt.toISOString() ?? null,
  };
}

export async function listProcurementExportBoard(db: PrismaClient): Promise<ProcurementExportBoardRow[]> {
  const [biddings, contracts, connections] = await Promise.all([
    db.bidding.findMany({ include: biddingExportInclude, orderBy: { updatedAt: "desc" }, take: 100 }),
    db.contract.findMany({ include: contractExportInclude, orderBy: { updatedAt: "desc" }, take: 100 }),
    db.integrationConnection.findMany({
      where: { code: { in: ["TCE_PB_SAGRES", "PNCP"] } },
      include: { runs: { orderBy: { createdAt: "desc" } } },
    }),
  ]);
  const targets = [
    ...biddings.map(targetFromBidding),
    ...contracts.map(targetFromContract),
  ];
  const connectionByCode = new Map(connections.map((connection) => [connection.code, connection]));
  return procurementExportPackageDefinitions.flatMap((definition) => targets
    .filter((target) => target.type === definition.targetType)
    .map((target) => boardRow(definition, target, connectionByCode.get(definition.integrationCode) ?? null)));
}

export async function getProcurementExportDownload(db: PrismaClient, runId: string, actorUsuarioId: string) {
  const id = requiredText(runId, "Pacote de exportacao");
  const actor = requiredText(actorUsuarioId, "Usuario responsavel");
  const run = await db.integrationRun.findUnique({ where: { id }, include: { connection: { select: { code: true } } } });
  if (!run || !["TCE_PB_SAGRES", "PNCP"].includes(run.connection.code)) {
    throw new ProcurementExportError("Pacote de exportacao nao encontrado.");
  }
  const payload = exportRunPayload(run.payload);
  if (!payload?.exportPackage) {
    throw new ProcurementExportError("Este historico nao possui pacote baixavel. Revise a configuracao ou a validacao local.");
  }
  await writeAuditEvent(db, {
    actorUsuarioId: actor,
    eventType: auditEventTypes.documentDownload,
    targetType: "PROCUREMENT_EXPORT_PACKAGE",
    targetId: run.id,
  });
  const safeReference = payload.target.reference.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "pacote";
  return {
    content: `${JSON.stringify(payload.exportPackage, null, 2)}\n`,
    filename: `${payload.packageCode.toLowerCase()}-${safeReference}-${run.id}.json`,
  };
}
