import "./load-local-environment";

import { prisma } from "@/lib/prisma";
import { assertSiaficConnectionMatchesRuntime, getSiaficDemoRuntimeConfig, parseSiaficConnectionConfiguration } from "@/lib/siafic/config";

async function main() {
  const config = getSiaficDemoRuntimeConfig({ requireEnabled: false });
  if (!config) throw new Error("A configuracao SIAFIC DEMO nao esta disponivel.");
  const workerToken = process.env.SIAFIC_WORKER_TOKEN?.trim();
  if (!workerToken || workerToken === config.apiToken) {
    throw new Error("SIAFIC_WORKER_TOKEN deve existir e ser diferente da credencial do receptor.");
  }
  const connection = await prisma.integrationConnection.findUnique({ where: { code: "SIAFIC_DEMO" } });
  if (!connection) throw new Error("A conexao SIAFIC_DEMO ainda nao foi cadastrada.");
  assertSiaficConnectionMatchesRuntime(connection.baseUrl);
  const mapping = parseSiaficConnectionConfiguration(connection.configuration);
  if (!mapping.unitMappings[mapping.defaultSourceUnitCode]) {
    throw new Error("A unidade padrao SIAFIC nao possui destino configurado no de-para.");
  }
  console.log(JSON.stringify({
    valid: true,
    environment: config.appEnvironment,
    enabled: config.enabled,
    datasetId: config.datasetId,
    sourceInstanceId: config.sourceInstanceId,
    receiverHost: new URL(config.receiverBaseUrl).host,
    connectionStatus: connection.status,
    mappedUnits: Object.keys(mapping.unitMappings).length,
  }, null, 2));
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha ao validar a configuracao SIAFIC.");
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
