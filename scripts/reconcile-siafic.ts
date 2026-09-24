import "./load-local-environment";

import { prisma } from "@/lib/prisma";
import { getSiaficDemoRuntimeConfig } from "@/lib/siafic/config";

async function main() {
  const config = getSiaficDemoRuntimeConfig();
  if (!config) throw new Error("SIAFIC_ENABLED deve ser true para reconciliar o dataset.");
  const response = await fetch(`${config.receiverBaseUrl}/api/demo/v1/reconciliation`, {
    headers: { Authorization: `Bearer ${config.apiToken}` },
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`O receptor recusou a reconciliacao (HTTP ${response.status}).`);
  const remote = await response.json() as { entities?: Array<{ entityType: string; sourceEntityId: string; latestVersion: number; payloadHash: string }> };
  const local = await prisma.siaficExternalLink.findMany({
    where: { datasetId: config.datasetId },
    select: { entityType: true, entityId: true, latestVersion: true, latestPayloadHash: true },
  });
  const remoteByEntity = new Map((remote.entities ?? []).map((entity) => [`${entity.entityType}:${entity.sourceEntityId}`, entity]));
  const missing = local.filter((entity) => !remoteByEntity.has(`${entity.entityType}:${entity.entityId}`));
  const divergent = local.filter((entity) => {
    const received = remoteByEntity.get(`${entity.entityType}:${entity.entityId}`);
    return received && (received.latestVersion !== entity.latestVersion || received.payloadHash !== entity.latestPayloadHash);
  });
  console.log(JSON.stringify({
    datasetId: config.datasetId,
    localConfirmed: local.length,
    remoteEntities: remoteByEntity.size,
    missing: missing.map((entity) => ({ entityType: entity.entityType, entityId: entity.entityId })),
    divergent: divergent.map((entity) => ({ entityType: entity.entityType, entityId: entity.entityId })),
  }, null, 2));
  if (missing.length || divergent.length) process.exitCode = 2;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha na reconciliacao SIAFIC.");
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
