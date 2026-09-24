import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export async function createSiaficTestDatabase() {
  const memory = await PGlite.create();
  const generated = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (generated.status !== 0) throw new Error(generated.stderr);
  await memory.exec(generated.stdout);
  const socket = new PGLiteSocketServer({ db: memory, port: 0, host: "127.0.0.1", maxConnections: 1 });
  await socket.start();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: `postgresql://postgres:postgres@${socket.getServerConn()}/postgres?sslmode=disable`, max: 1 }),
  });
  return {
    memory,
    prisma,
    close: async () => {
      await prisma.$disconnect();
      await socket.stop();
      await memory.close();
    },
  };
}

export function configureSiaficDemoEnvironment(baseUrl: string, token = "siafic-test-token") {
  const values = {
    APP_ENV: "DEMO",
    SIAFIC_ENABLED: "true",
    SIAFIC_PROVIDER: "robonuvem_demo",
    SIAFIC_SOURCE_INSTANCE_ID: "CELERIFLOW-DEMO-01",
    SIAFIC_DATASET_ID: "SIAFIC-POC-2026-TEST",
    SIAFIC_RECEIVER_BASE_URL: baseUrl,
    SIAFIC_ALLOWED_HOSTS: new URL(baseUrl).hostname,
    SIAFIC_API_TOKEN: token,
    SIAFIC_PROTOCOL_VERSION: "1.0",
    SIAFIC_HTTP_TIMEOUT_MS: "2000",
    SIAFIC_WORKER_BATCH_SIZE: "25",
    SIAFIC_WORKER_LEASE_SECONDS: "6",
    SIAFIC_WORKER_TOKEN: "siafic-test-worker-token",
    SIAFIC_DEMO_FIXTURES_ENABLED: "true",
  } as const;
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

export async function seedSiaficSourceFixture(prisma: PrismaClient, baseUrl: string) {
  const suffix = randomUUID().slice(0, 8);
  const secretariat = await prisma.secretariat.create({ data: { name: `Secretaria SIAFIC ${suffix}` } });
  const department = await prisma.department.create({ data: { name: `Compras SIAFIC ${suffix}`, secretariatId: secretariat.id } });
  const profile = await prisma.configuracaoPerfil.create({ data: { codigo: `SIAFIC_${suffix}`, nome: "Operador SIAFIC DEMO", permissoes: "{}", ativo: true } });
  const actor = await prisma.usuario.create({ data: { nome: "Operador SIAFIC DEMO", email: `siafic-${suffix}@example.invalid`, senha: "fixture", perfilId: profile.id } });
  const employee = await prisma.employee.create({ data: { name: "Solicitante SIAFIC DEMO", departmentId: department.id, secretariatId: secretariat.id } });
  const budgetUnit = await prisma.budgetUnit.create({ data: { code: `UG${suffix.slice(0, 5).toUpperCase()}`, name: "Unidade Gestora SIAFIC DEMO", secretariatId: secretariat.id } });
  const catalog = await prisma.catalogItem.create({ data: { code: `MAT-${suffix}`, name: "Material SIAFIC DEMO", unit: "UN", estimatedValue: 22.6 } });
  const request = await prisma.purchaseRequest.create({
    data: {
      number: `SOL-${suffix}`,
      object: "Aquisicao sintetica para integracao SIAFIC",
      justification: "Fixture isolada de integracao.",
      estimatedValue: 2260,
      status: "Aprovada",
      secretariatId: secretariat.id,
      departmentId: department.id,
      requesterId: employee.id,
      items: { create: { catalogItemId: catalog.id, quantity: 100, estimatedUnitValue: 22.6 } },
    },
  });
  const process = await prisma.purchaseProcess.create({
    data: {
      number: `PROC-${suffix}`,
      object: request.object,
      type: "Comum",
      modality: "Pregao",
      estimatedValue: 2260,
      status: "Em Planejamento",
      secretariatId: secretariat.id,
      purchaseRequestId: request.id,
      items: { create: { catalogItemId: catalog.id, quantity: 100, estimatedUnitValue: 22.6 } },
    },
  });
  const company = await prisma.company.create({
    data: {
      corporateName: "Fornecedor SIAFIC DEMO",
      tradeName: "FOR-A DEMO",
      cnpj: `${suffix.replace(/[^0-9]/g, "").padEnd(14, "1").slice(0, 14)}`,
      companyType: "ME",
      primaryCnae: "4751-2/01",
      emailPrimary: `fornecedor-${suffix}@example.invalid`,
    },
  });
  await prisma.integrationConnection.create({
    data: {
      code: "SIAFIC_DEMO",
      name: "SIAFIC DEMO",
      category: "GOVERNAMENTAL",
      provider: "Receptor SIAFIC - Robonuvem DEMO",
      environment: "DEMO",
      status: "ATIVA",
      baseUrl,
      credentialReference: "env:SIAFIC_API_TOKEN",
      configuration: {
        defaultSourceUnitCode: budgetUnit.code,
        unitMappings: { [budgetUnit.code]: "UG-EXT-01" },
      },
    },
  });
  return { actor, company, process, secretariat, budgetUnit };
}
