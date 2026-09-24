import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";
import { bankIntegrationClient } from "@/lib/financeiro/bank-integration-client";
import type { BankAccountConfig, BankStatementResponse, DateRange } from "@/lib/financeiro/bank-integration-client";
import { buildRunCompletionEnvelope, buildRunStartEnvelope } from "./contract";
import {
  assertIntegrationEnvironmentPolicy,
  assertIntegrationOperation,
  runMockIntegration,
  type IntegrationEnvironment,
  type IntegrationOperation,
} from "./registry";

export class IntegrationExecutionError extends Error {}

type AdapterResult<T> = {
  data: T;
  status: "SUCESSO" | "FALHA";
  message: string;
  externalId?: string;
  evidence?: unknown;
};

type IntegrationAdapter<T> = {
  operation: IntegrationOperation;
  execute: (context: { environment: IntegrationEnvironment; mockScenario: unknown; input: unknown; connection: { baseUrl: string | null; credentialReference: string | null; configuration: unknown } }) => Promise<AdapterResult<T>>;
};

type ExecutionInput = {
  code: string;
  operation: IntegrationOperation;
  payload?: unknown;
  allowUnverifiedConnection?: boolean;
};

const activeExecutionKeys = new Set<string>();

const healthCheckAdapter: IntegrationAdapter<void> = {
  operation: "HEALTH_CHECK",
  async execute({ environment, mockScenario, input }) {
    const code = (input as { code: string }).code;
    if (environment === "MOCK") {
      const mock = runMockIntegration(code, "HEALTH_CHECK", mockScenario);
      return { data: undefined, status: mock.status, message: mock.message, externalId: mock.externalId, evidence: mock.evidence };
    }
    await bankIntegrationClient.checkSandboxHealth();
    return {
      data: undefined,
      status: "SUCESSO",
      message: "Banco Virtual Robonuvem disponível no ambiente SANDBOX.",
      evidence: { dispatch: "SANDBOX", health: "UP" },
    };
  },
};

const statementDownloadAdapter: IntegrationAdapter<BankStatementResponse> = {
  operation: "DOWNLOAD_STATEMENT",
  async execute({ input }) {
    const request = input as { account: BankAccountConfig; range: DateRange };
    const data = await bankIntegrationClient.fetchBankStatement(request.account, request.range);
    return {
      data,
      status: "SUCESSO",
      message: "Extrato obtido do Banco Virtual Robonuvem no ambiente SANDBOX.",
      externalId: data.hashSHA256,
      evidence: { dispatch: "SANDBOX", format: data.formato, hashSHA256: data.hashSHA256, itemCount: data.items.length, sizeBytes: data.tamanhoBytes },
    };
  },
};

export async function executeConfiguredIntegration<T>(
  prisma: PrismaClient,
  input: ExecutionInput,
  adapter: IntegrationAdapter<T>,
): Promise<AdapterResult<T>> {
  const connection = await prisma.integrationConnection.findUnique({ where: { code: input.code } });
  if (!connection) throw new IntegrationExecutionError(`A integração ${input.code} não está configurada nesta instalação.`);

  const environment = connection.environment as IntegrationEnvironment;
  const started = buildRunStartEnvelope({
    code: input.code,
    operation: input.operation,
    environment,
    payload: input.payload,
  });
  const executionKey = `${connection.id}:${started.idempotencyKey}`;
  if (activeExecutionKeys.has(executionKey)) {
    throw new IntegrationExecutionError("Uma execução idêntica já está em andamento para esta conexão.");
  }
  const inFlight = await prisma.integrationRun.findMany({
    where: { connectionId: connection.id, status: "EXECUTANDO" },
    select: { payload: true },
  });
  if (inFlight.some((run) => (run.payload as { idempotencyKey?: unknown } | null)?.idempotencyKey === started.idempotencyKey)) {
    throw new IntegrationExecutionError("Uma execução idêntica já está em andamento para esta conexão.");
  }

  activeExecutionKeys.add(executionKey);
  const run = await prisma.integrationRun.create({
    data: {
      connectionId: connection.id,
      operation: input.operation,
      environment,
      status: "EXECUTANDO",
      message: "Execução iniciada pelo contrato C1-005.",
      payload: started as Prisma.InputJsonValue,
    },
  });

  try {
    if (!input.allowUnverifiedConnection && connection.status !== "ATIVA") {
      throw new IntegrationExecutionError(`A integração ${input.code} não está ativa nesta instalação.`);
    }
    if (connection.status === "DESATIVADA") throw new IntegrationExecutionError(`A integração ${input.code} está desativada.`);
    try {
      assertIntegrationOperation(input.code, input.operation);
      assertIntegrationEnvironmentPolicy(input.code, environment);
    } catch (error) {
      throw new IntegrationExecutionError(error instanceof Error ? error.message : "A operação solicitada não atende à política de integração.");
    }
    if (adapter.operation !== input.operation) throw new IntegrationExecutionError("Adaptador incompatível com a operação solicitada.");

    const adapterInput = input.payload && typeof input.payload === "object" && !Array.isArray(input.payload)
      ? { ...input.payload as Record<string, unknown>, code: input.code }
      : { code: input.code };
    const result = await adapter.execute({ environment, mockScenario: connection.mockScenario, input: adapterInput, connection });
    await prisma.integrationRun.update({
      where: { id: run.id },
      data: {
        status: result.status,
        message: result.message,
        externalId: result.externalId,
        payload: buildRunCompletionEnvelope(started, result) as Prisma.InputJsonValue,
      },
    });
    return result;
  } catch (error) {
    const message = error instanceof IntegrationExecutionError
      ? error.message
      : "Falha na execução da integração. Consulte o ambiente configurado e a evidência sanitizada.";
    await prisma.integrationRun.update({
      where: { id: run.id },
      data: {
        status: "FALHA",
        message,
        payload: buildRunCompletionEnvelope(started, { status: "FALHA" }) as Prisma.InputJsonValue,
      },
    });
    throw error;
  } finally {
    activeExecutionKeys.delete(executionKey);
  }
}

export function executeConfiguredHealthCheck(prisma: PrismaClient, code: string, allowUnverifiedConnection = false) {
  return executeConfiguredIntegration(prisma, {
    code,
    operation: "HEALTH_CHECK",
    payload: { code },
    allowUnverifiedConnection,
  }, healthCheckAdapter);
}

export function executeConfiguredStatementDownload(prisma: PrismaClient, account: BankAccountConfig, range: DateRange) {
  return executeConfiguredIntegration(prisma, {
    code: "BANCO_API",
    operation: "DOWNLOAD_STATEMENT",
    payload: { account, range },
  }, statementDownloadAdapter);
}

export function executeConfiguredHealthHttp<T>(prisma: PrismaClient, input: { code: string; operation: IntegrationOperation; payload: unknown }) {
  const adapter: IntegrationAdapter<T> = {
    operation: input.operation,
    async execute({ connection, input: adapterInput }) {
      if (!connection.baseUrl) throw new IntegrationExecutionError("O endpoint controlado não está configurado.");
      const configuration = connection.configuration && typeof connection.configuration === "object" && !Array.isArray(connection.configuration)
        ? connection.configuration as Record<string, unknown>
        : {};
      const timeoutMs = typeof configuration.timeoutMs === "number" ? Math.min(Math.max(configuration.timeoutMs, 1000), 60000) : 10000;
      const retries = typeof configuration.retries === "number" ? Math.min(Math.max(Math.trunc(configuration.retries), 0), 3) : 2;
      const token = connection.credentialReference ? process.env[connection.credentialReference] : undefined;
      let lastError: unknown;
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(connection.baseUrl, {
            method: "POST",
            headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(adapterInput),
            signal: controller.signal,
          });
          const text = await response.text();
          if (!response.ok) throw new IntegrationExecutionError(`O endpoint controlado respondeu HTTP ${response.status}.`);
          let data: unknown = null;
          if (text) {
            try { data = JSON.parse(text); } catch { data = { responseHash: await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(buffer => Buffer.from(buffer).toString("hex")) }; }
          }
          const externalId = response.headers.get("x-correlation-id") || response.headers.get("x-request-id") || undefined;
          return { data: data as T, status: "SUCESSO", message: "Despacho concluído pelo endpoint controlado configurado.", externalId, evidence: { dispatch: "HTTP", status: response.status, attempt: attempt + 1 } };
        } catch (error) {
          lastError = error;
          if (attempt === retries) break;
        } finally {
          clearTimeout(timer);
        }
      }
      throw lastError instanceof Error ? lastError : new IntegrationExecutionError("Falha no despacho ao endpoint controlado.");
    },
  };
  return executeConfiguredIntegration<T>(prisma, input, adapter);
}
