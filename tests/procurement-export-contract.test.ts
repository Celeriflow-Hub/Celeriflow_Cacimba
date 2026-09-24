import assert from "node:assert/strict";
import test from "node:test";
import { assertIntegrationOperation } from "../src/lib/integrations/registry.ts";
import {
  getProcurementExportConfigurationStatus,
  getProcurementExportPackageDefinition,
  procurementExportPackageDefinitions,
  resolveProcurementExportQueueState,
} from "../src/lib/integrations/procurement-export-contract.ts";
import {
  createProcurementExportIdempotencyKey,
  procurementExportConfigurationFingerprint,
} from "../src/lib/integrations/procurement-export-keys.ts";

const tceConfiguration = {
  layout: {
    code: "SAGRES-LIC-CONTR",
    version: "2026.1",
    specificationReference: "https://example.test/tce/layout",
    competence: "2026-09",
  },
  operations: ["BIDDING_ACCOUNTABILITY", "CONTRACT_ACCOUNTABILITY"],
};

test("CLC-038 keeps Tribunal packages blocked without credential and official layout metadata", () => {
  const blocked = getProcurementExportConfigurationStatus({
    code: "TCE_PB_SAGRES",
    credentialReference: "",
    configuration: { layout: { code: "SAGRES" } },
    requestedOperation: "BIDDING_ACCOUNTABILITY",
  });

  assert.equal(blocked.supported, true);
  assert.equal(blocked.ready, false);
  assert.equal(blocked.issues.some((issue) => issue.includes("credencial")), true);
  assert.equal(blocked.issues.some((issue) => issue.includes("layout")), true);

  const ready = getProcurementExportConfigurationStatus({
    code: "TCE_PB_SAGRES",
    credentialReference: "secret://integracoes/tce",
    configuration: tceConfiguration,
    requestedOperation: "BIDDING_ACCOUNTABILITY",
  });
  assert.equal(ready.ready, true);
  assert.equal(ready.layout?.competence, "2026-09");

  const template = getProcurementExportConfigurationStatus({
    code: "TCE_PB_SAGRES",
    credentialReference: "secret://integracoes/tce",
    configuration: {
      layout: {
        code: "IDENTIFICADOR_OFICIAL_DO_LEIAUTE",
        version: "VERSAO_OFICIAL",
        specificationReference: "URL_OU_REFERENCIA_DA_ESPECIFICACAO_OFICIAL",
        competence: "AAAA-MM",
      },
      operations: ["BIDDING_ACCOUNTABILITY"],
    },
  });
  assert.equal(template.ready, false);
  assert.match(template.issues.join(" "), /valores de exemplo/);
});

test("CLC-040/048/079 reuse one PNCP connector and only release declared operations", () => {
  const pncpConfiguration = {
    layout: {
      code: "PNCP-CONTRATACOES",
      version: "2026.1",
      specificationReference: "https://example.test/pncp/contract",
    },
    operations: ["PROCUREMENT"],
  };
  const procurement = getProcurementExportConfigurationStatus({
    code: "PNCP",
    credentialReference: "vault:pncp/client",
    configuration: pncpConfiguration,
    requestedOperation: "PROCUREMENT",
  });
  const contract = getProcurementExportConfigurationStatus({
    code: "PNCP",
    credentialReference: "vault:pncp/client",
    configuration: pncpConfiguration,
    requestedOperation: "CONTRACT",
  });

  assert.equal(procurement.ready, true);
  assert.equal(contract.ready, false);
  assert.match(contract.issues.join(" "), /CONTRACT/);
  assert.equal(procurementExportPackageDefinitions.filter((definition) => definition.integrationCode === "PNCP").length, 3);
  assert.equal(getProcurementExportPackageDefinition("PNCP_PROCEDURE_RESULT")?.requirementIds[0], "CLC-048");
});

test("export package keys are deterministic and connection-specific", () => {
  const first = createProcurementExportIdempotencyKey({
    packageCode: "PNCP_PROCUREMENT",
    connectionId: "connection-1",
    configurationFingerprint: "config-a",
    sourceFingerprint: "source-a",
  });
  const repeated = createProcurementExportIdempotencyKey({
    packageCode: "PNCP_PROCUREMENT",
    connectionId: "connection-1",
    configurationFingerprint: "config-a",
    sourceFingerprint: "source-a",
  });
  const otherConnection = createProcurementExportIdempotencyKey({
    packageCode: "PNCP_PROCUREMENT",
    connectionId: "connection-2",
    configurationFingerprint: "config-a",
    sourceFingerprint: "source-a",
  });

  assert.equal(first, repeated);
  assert.notEqual(first, otherConnection);

  const pendingConfiguration = procurementExportConfigurationFingerprint({
    connectionId: "connection-1",
    connectionStatus: "CONFIGURANDO",
    environment: "MOCK",
    credentialReference: "secret://integracoes/pncp",
    layout: { code: "PNCP-CONTRATACOES", version: "2026.1", specificationReference: "https://example.test/pncp" },
    operations: ["PROCUREMENT"],
  });
  const activeConfiguration = procurementExportConfigurationFingerprint({
    connectionId: "connection-1",
    connectionStatus: "ATIVA",
    environment: "MOCK",
    credentialReference: "secret://integracoes/pncp",
    layout: { code: "PNCP-CONTRATACOES", version: "2026.1", specificationReference: "https://example.test/pncp" },
    operations: ["PROCUREMENT"],
  });
  assert.notEqual(pendingConfiguration, activeConfiguration);
});

test("registry rejects a procurement operation for the wrong destination", () => {
  assert.doesNotThrow(() => assertIntegrationOperation("PNCP", "EXPORT_PNCP_CONTRACT"));
  assert.doesNotThrow(() => assertIntegrationOperation("TCE_PB_SAGRES", "EXPORT_TCE_BIDDING_ACCOUNTABILITY"));
  assert.throws(() => assertIntegrationOperation("PNCP", "EXPORT_TCE_BIDDING_ACCOUNTABILITY"));
});

test("package preparation preserves pending configuration and local result rejection states", () => {
  assert.equal(resolveProcurementExportQueueState({
    hasConfigurationIssues: true,
    requiresCurrentResult: true,
    resultReady: true,
  }), "PENDING_CONFIGURATION");
  assert.equal(resolveProcurementExportQueueState({
    hasConfigurationIssues: false,
    requiresCurrentResult: true,
    resultReady: false,
  }), "REJECTED");
  assert.equal(resolveProcurementExportQueueState({
    hasConfigurationIssues: false,
    requiresCurrentResult: true,
    resultReady: true,
  }), "QUEUED");
});
