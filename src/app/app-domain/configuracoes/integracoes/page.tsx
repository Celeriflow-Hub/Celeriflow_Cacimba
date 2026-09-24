import { integrationCatalog } from "@/lib/integrations/registry";
import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import IntegrationConnectionsClient from "./IntegrationConnectionsClient";

export const dynamic = "force-dynamic";

export default async function IntegrationConnectionsPage() {
  const { prisma } = await getTenantContextForSystemAdministration();
  const connections = await prisma.integrationConnection.findMany({
    include: {
      runs: { orderBy: { createdAt: "desc" }, take: 3 },
      siaficOutboxEvents: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          entityType: true,
          entityId: true,
          entityVersion: true,
          eventType: true,
          operation: true,
          createdAt: true,
          delivery: { select: { status: true, attemptCount: true, nextAttemptAt: true, lastError: true, receiptId: true } },
        },
      },
    },
    orderBy: { category: "asc" },
  });

  return <IntegrationConnectionsClient catalog={[...integrationCatalog]} connections={connections.map((connection) => ({
    ...connection,
    configuration: connection.configuration ? JSON.stringify(connection.configuration, null, 2) : "",
    mockScenario: connection.mockScenario ? JSON.stringify(connection.mockScenario, null, 2) : "",
    runs: connection.runs.map((run) => ({
      ...run,
      payload: run.payload ? JSON.stringify(run.payload, null, 2) : null,
    })),
  }))} />;
}
