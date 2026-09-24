"use server";

import { Prisma } from "@prisma/client";
import { assertIntegrationEnvironmentPolicy, getIntegrationDefinition } from "@/lib/integrations/registry";
import { getProcurementExportConfigurationStatus } from "@/lib/integrations/procurement-export-contract";
import { executeConfiguredHealthCheck } from "@/lib/integrations/runtime";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { assertSiaficConnectionMatchesRuntime, parseSiaficConnectionConfiguration } from "@/lib/siafic/config";
import { testSiaficDemoConnection } from "@/lib/siafic/dispatcher";
import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult = { error?: string; data?: { id: string; message: string } };

const connectionSchema = z.object({
  code: z.string().min(1),
  environment: z.enum(["MOCK", "DEMO", "SANDBOX", "HOMOLOGACAO", "PRODUCAO"]),
  baseUrl: z.string().trim().max(500).optional(),
  credentialReference: z.string().trim().max(250).optional(),
  configurationJson: z.string().max(20_000).optional(),
  mockScenarioJson: z.string().max(20_000).optional(),
  enabled: z.boolean(),
});

function assertNoSecretValues(value: unknown) {
  if (Array.isArray(value)) {
    value.forEach(assertNoSecretValues);
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, nestedValue] of Object.entries(value)) {
    if (/(secret|senha|password|token|api.?key|private.?key|certificate|certificado|authorization|credential|bearer)/i.test(key)) {
      throw new Error("Use apenas a referência do segredo. Chaves, senhas, tokens e certificados não podem ser gravados nesta configuração.");
    }
    assertNoSecretValues(nestedValue);
  }
}

function parsePublicJson(value: string | undefined, field: string): Prisma.InputJsonValue | undefined {
  if (!value?.trim()) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    assertNoSecretValues(parsed);
    return parsed as Prisma.InputJsonValue;
  } catch (error) {
    if (error instanceof Error && error.message.includes("segredo")) throw error;
    throw new Error(`${field} deve conter JSON válido.`);
  }
}

function validateConnectionInput(input: z.infer<typeof connectionSchema>, configuration: Prisma.InputJsonValue | undefined) {
  const definition = getIntegrationDefinition(input.code);
  if (!definition) throw new Error("Conector externo inválido.");
  assertIntegrationEnvironmentPolicy(definition.code, input.environment);

  if (input.baseUrl) {
    try {
      new URL(input.baseUrl);
    } catch {
      throw new Error("A URL base da integração é inválida.");
    }
  }

  if (definition.code === "SIAFIC_DEMO") {
    if (!input.baseUrl) throw new Error("Informe a URL do receptor SIAFIC DEMO.");
    assertSiaficConnectionMatchesRuntime(input.baseUrl);
    parseSiaficConnectionConfiguration(configuration);
  }

  if (input.credentialReference && !/^(env:|vault:|secret:\/\/)/.test(input.credentialReference)) {
    throw new Error("A referência de credencial deve apontar para env:, vault: ou secret://; não informe o segredo diretamente.");
  }
  return definition;
}

export async function saveIntegrationConnection(rawInput: unknown): Promise<ActionResult> {
  try {
    const input = connectionSchema.parse(rawInput);
    const configuration = parsePublicJson(input.configurationJson, "Parâmetros públicos");
    const mockScenario = parsePublicJson(input.mockScenarioJson, "Cenário mock");
    const definition = validateConnectionInput(input, configuration);
    const procurementConfiguration = getProcurementExportConfigurationStatus({
      code: definition.code,
      credentialReference: input.credentialReference,
      configuration,
    });
    const context = await getTenantContextForSystemAdministration();
    const connection = await context.prisma.integrationConnection.upsert({
      where: { code: definition.code },
      create: {
        code: definition.code,
        name: definition.name,
        category: definition.category,
        provider: definition.provider,
        environment: input.environment,
        status: input.enabled ? "CONFIGURANDO" : "DESATIVADA",
        baseUrl: input.baseUrl || undefined,
        credentialReference: input.credentialReference || undefined,
        configuration,
        mockScenario,
      },
      update: {
        name: definition.name,
        category: definition.category,
        provider: definition.provider,
        environment: input.environment,
        status: input.enabled ? "CONFIGURANDO" : "DESATIVADA",
        baseUrl: input.baseUrl || null,
        credentialReference: input.credentialReference || null,
        configuration: configuration ?? Prisma.JsonNull,
        mockScenario: mockScenario ?? Prisma.JsonNull,
      },
    });
    revalidatePath("/configuracoes/integracoes");
    revalidatePath("/configuracoes");
    const message = procurementConfiguration.supported && !procurementConfiguration.ready
      ? `Conexão salva como CONFIGURANDO. Pacotes de Compras seguem bloqueados: ${procurementConfiguration.issues.join(" ")}`
      : "Conexão salva. Execute o teste antes de ativar o fluxo operacional.";
    return { data: { id: connection.id, message } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar a conexão." };
  }
}

export async function testIntegrationConnection(connectionId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForSystemAdministration();
    const connection = await context.prisma.integrationConnection.findUnique({ where: { id: z.string().min(1).parse(connectionId) } });
    if (!connection) throw new Error("Conexão não encontrada.");
    if (connection.status === "DESATIVADA") throw new Error("Ative a conexão antes de executar o teste.");
    const procurementConfiguration = getProcurementExportConfigurationStatus({
      code: connection.code,
      credentialReference: connection.credentialReference,
      configuration: connection.configuration,
    });
    if (procurementConfiguration.supported && !procurementConfiguration.ready) {
      throw new Error(`A conexão permanece bloqueada até informar credencial, leiaute e operações: ${procurementConfiguration.issues.join(" ")}`);
    }

    const result = connection.code === "SIAFIC_DEMO"
      ? await testSiaficDemoConnection(connection)
      : await executeConfiguredHealthCheck(context.prisma, connection.code, true);

    await context.prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        status: result.status === "SUCESSO" ? "ATIVA" : "CONFIGURANDO",
        lastTestedAt: new Date(),
        lastTestStatus: result.status,
        lastTestMessage: result.message,
      },
    });
    revalidatePath("/configuracoes/integracoes");
    revalidatePath("/configuracoes");
    return { data: { id: connection.id, message: result.message } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível testar a conexão." };
  }
}

export async function retrySiaficDelivery(eventId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForSystemAdministration();
    const delivery = await context.prisma.siaficDelivery.findUnique({
      where: { eventId: z.string().uuid().parse(eventId) },
      include: { event: { select: { connection: { select: { code: true, environment: true } } } } },
    });
    if (!delivery || delivery.event.connection.code !== "SIAFIC_DEMO" || delivery.event.connection.environment !== "DEMO") {
      throw new Error("Entrega SIAFIC DEMO nao encontrada.");
    }
    if (delivery.status === "PROCESSED") throw new Error("Esta entrega ja possui recibo confirmado.");
    if (delivery.status === "SENDING" && delivery.leaseExpiresAt && delivery.leaseExpiresAt > new Date()) {
      throw new Error("A entrega esta em processamento por outro worker.");
    }
    await context.prisma.$transaction(async (tx) => {
      await tx.siaficDelivery.update({
        where: { eventId: delivery.eventId },
        data: { status: "PENDING", nextAttemptAt: new Date(), leaseToken: null, leaseExpiresAt: null },
      });
      await writeAuditEvent(tx, {
        actorUsuarioId: context.user.id,
        eventType: auditEventTypes.siaficDeliveryRetryRequested,
        targetType: "SiaficOutboxEvent",
        targetId: delivery.eventId,
      });
    });
    revalidatePath("/configuracoes/integracoes");
    revalidatePath("/configuracoes");
    return { data: { id: delivery.eventId, message: "Entrega recolocada na fila. O worker validara o recibo antes de reenviar quando houver tentativa anterior." } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nao foi possivel reenfileirar a entrega SIAFIC." };
  }
}
