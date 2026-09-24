import assert from "node:assert/strict";
import test from "node:test";
import {
  getProcurementExportDownload,
  queueProcurementExport,
  recordProcurementExportOutcome,
} from "../src/lib/integrations/procurement-exports.ts";

type MemoryRun = {
  id: string;
  connectionId: string;
  operation: string;
  environment: string;
  status: string;
  message: string;
  externalId: string | null;
  payload: Record<string, unknown>;
  createdAt: Date;
};

function memoryDatabase(input: { connectionStatus?: string; resultReady?: boolean } = {}) {
  const runs: MemoryRun[] = [];
  const auditEvents: Array<Record<string, unknown>> = [];
  const connection = {
    id: "pncp-connection",
    code: "PNCP",
    environment: "MOCK",
    status: input.connectionStatus ?? "ATIVA",
    credentialReference: "secret://integracoes/pncp",
    configuration: {
      layout: {
        code: "PNCP-CONTRATACOES",
        version: "2026.1",
        specificationReference: "https://example.test/pncp/contract",
      },
      operations: ["PROCUREMENT", "PROCEDURE_RESULT", "CONTRACT"],
    },
  };
  const updatedAt = new Date("2026-09-19T12:00:00.000Z");
  const currentResults = input.resultReady ? [{
    id: "result-1",
    status: "HOMOLOGADO",
    totalValueDecimal: { toString: () => "1000.00" },
    unitValueDecimal: { toString: () => "10.00" },
    decidedAt: updatedAt,
    participant: { id: "participant-1", displayCode: "SUPPLIER-1", supplierId: "supplier-1" },
  }] : [];
  const bidding = {
    id: "bidding-1",
    number: "LIC-2026-001",
    modality: "PREGAO",
    status: "HOMOLOGADA",
    publicationDate: null,
    sessionDate: null,
    updatedAt,
    process: {
      id: "process-1",
      number: "PROC-2026-001",
      object: "Aquisicao POC",
      type: "COMPRA",
      modality: "PREGAO",
      estimatedValue: 1000,
      updatedAt,
      items: [],
    },
    biddingLots: [{
      id: "lot-1",
      number: 1,
      description: "Lote POC",
      status: "HOMOLOGADO",
      estimatedValueDecimal: { toString: () => "1000.00" },
      results: currentResults,
    }],
  };
  const auditEvent = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      auditEvents.push(data);
    },
  };
  const tx = {
    integrationRun: {
      create: async ({ data }: { data: Omit<MemoryRun, "id" | "createdAt" | "externalId"> }) => {
        const run: MemoryRun = {
          ...data,
          id: `run-${runs.length + 1}`,
          createdAt: new Date("2026-09-19T12:01:00.000Z"),
          externalId: null,
        };
        runs.push(run);
        return run;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<MemoryRun> }) => {
        const run = runs.find((candidate) => candidate.id === where.id);
        if (!run) throw new Error("Run not found");
        Object.assign(run, data);
        return run;
      },
    },
    auditEvent,
  };
  const db = {
    bidding: { findUnique: async () => bidding },
    contract: { findUnique: async () => null },
    integrationConnection: { findUnique: async () => connection },
    integrationRun: {
      findMany: async () => runs,
      findUnique: async ({ where }: { where: { id: string } }) => {
        const run = runs.find((candidate) => candidate.id === where.id);
        return run ? { ...run, connection: { code: connection.code } } : null;
      },
    },
    auditEvent,
    $transaction: async <T>(operation: (transaction: typeof tx) => Promise<T>) => operation(tx),
  };
  return { db, connection, runs, auditEvents };
}

test("queued procurement packages are downloadable, audited, and manually confirmed without a network dispatch", async () => {
  const memory = memoryDatabase();
  const queued = await queueProcurementExport(memory.db as never, {
    packageCode: "PNCP_PROCUREMENT",
    targetId: "bidding-1",
    actorUsuarioId: "buyer-1",
  });

  assert.equal(queued.status, "QUEUED");
  assert.equal(memory.runs[0].payload.state, "QUEUED");
  assert.deepEqual((memory.runs[0].payload.exportPackage as { delivery: unknown }).delivery, {
    state: "QUEUED",
    mode: "MANUAL_EXTERNAL_HANDOFF",
    note: "Pacote POC preparado para o operador. Nenhuma transmissao de rede ou confirmacao externa foi executada por este fluxo.",
  });

  const download = await getProcurementExportDownload(memory.db as never, queued.runId, "buyer-1");
  assert.match(download.filename, /^pncp_procurement-LIC-2026-001-run-1\.json$/);
  assert.match(download.content, /MANUAL_EXTERNAL_HANDOFF/);

  const confirmed = await recordProcurementExportOutcome(memory.db as never, {
    runId: queued.runId,
    status: "CONFIRMED",
    externalReference: "PROTOCOLO-2026-001",
    actorUsuarioId: "buyer-1",
  });
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal(memory.runs[0].payload.state, "CONFIRMED");
  const outcome = memory.runs[0].payload.outcome as { reference: string; recordedAt: string; source: string };
  assert.equal(outcome.reference, "PROTOCOLO-2026-001");
  assert.equal(outcome.source, "EXTERNAL_OPERATOR_RECORD");
  assert.match(outcome.recordedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(memory.auditEvents.length, 3);
});

test("configuration and source validation persist explicit pending and rejected package states", async () => {
  const pendingMemory = memoryDatabase({ connectionStatus: "CONFIGURANDO" });
  const pending = await queueProcurementExport(pendingMemory.db as never, {
    packageCode: "PNCP_PROCUREMENT",
    targetId: "bidding-1",
    actorUsuarioId: "buyer-1",
  });
  assert.equal(pending.status, "PENDING_CONFIGURATION");
  assert.equal(pendingMemory.runs[0].payload.exportPackage, undefined);

  pendingMemory.connection.status = "ATIVA";
  const released = await queueProcurementExport(pendingMemory.db as never, {
    packageCode: "PNCP_PROCUREMENT",
    targetId: "bidding-1",
    actorUsuarioId: "buyer-1",
  });
  assert.equal(released.status, "QUEUED");
  assert.equal(pendingMemory.runs.length, 2);

  const rejectedMemory = memoryDatabase({ resultReady: false });
  const rejected = await queueProcurementExport(rejectedMemory.db as never, {
    packageCode: "PNCP_PROCEDURE_RESULT",
    targetId: "bidding-1",
    actorUsuarioId: "buyer-1",
  });
  assert.equal(rejected.status, "REJECTED");
  assert.equal(rejectedMemory.runs[0].payload.exportPackage, undefined);
  assert.deepEqual(rejectedMemory.runs[0].payload.validation, {
    code: "CURRENT_RESULT_REQUIRED",
    message: "O pacote de procedimento e resultado exige resultado atual para todos os lotes da licitacao.",
  });
});
