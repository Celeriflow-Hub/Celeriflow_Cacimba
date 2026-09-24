import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { dispatchSiaficEvent, testSiaficDemoConnection } from "../src/lib/siafic/dispatcher";
import { siaficDemoEnvelopeSchema } from "../src/lib/siafic/contract";
import { createSupplierWithSiaficEvent, queueCovenantSnapshot, saveContractWithSiaficEvent } from "../src/lib/siafic/source";
import { configureSiaficDemoEnvironment, createSiaficTestDatabase, seedSiaficSourceFixture } from "./helpers/siafic-test-environment";

type FaultScenario = "FAIL_BEFORE_COMMIT_ONCE" | "FAIL_AFTER_COMMIT_ONCE" | null;

function sha256(value: string) {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

async function startReceiver(fault: FaultScenario) {
  const token = "siafic-e2e-token";
  const databasePath = await mkdtemp(join(tmpdir(), "celeriflow-siafic-receiver-"));
  const receiverRoot = resolve("tools/siafic-demo-receiver");
  const child = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
    cwd: receiverRoot,
    env: {
      ...process.env,
      APP_ENV: "DEMO",
      PORT: "0",
      SIAFIC_RECEIVER_ID: "ROBONUVEM-SIAFIC-RECEIVER-E2E",
      SIAFIC_ALLOWED_SOURCE_INSTANCE: "CELERIFLOW-DEMO-01",
      SIAFIC_ALLOWED_DATASET: "SIAFIC-POC-2026-TEST",
      SIAFIC_CLIENT_TOKEN_HASH: sha256(token),
      SIAFIC_RECEIVER_DATABASE_PATH: databasePath,
      SIAFIC_FAULT_INJECTION_ENABLED: fault ? "true" : "false",
      SIAFIC_FAULT_SCENARIO: fault ?? "",
      SIAFIC_FAULT_DATASET_ID: "SIAFIC-POC-2026-TEST",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let diagnostics = "";
  const baseUrl = await new Promise<string>((resolvePromise, reject) => {
    const timeout = setTimeout(() => reject(new Error(`O receptor SIAFIC nao iniciou. ${diagnostics}`)), 20_000);
    const resolveReady = (chunk: Buffer) => {
      diagnostics += chunk.toString("utf8");
      const match = diagnostics.match(/RECEIVER_READY\s+(http:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolvePromise(match[1]);
      }
    };
    child.stdout?.on("data", resolveReady);
    child.stderr?.on("data", (chunk: Buffer) => { diagnostics += chunk.toString("utf8"); });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`O receptor SIAFIC terminou antes de iniciar (${code}). ${diagnostics}`));
    });
  });
  return {
    baseUrl,
    token,
    close: async () => {
      if (child.exitCode === null) {
        child.kill();
        await once(child, "exit");
      }
      await rm(databasePath, { recursive: true, force: true });
    },
  };
}

async function retryNow(prisma: Awaited<ReturnType<typeof createSiaficTestDatabase>>["prisma"], eventId: string) {
  await prisma.siaficDelivery.update({ where: { eventId }, data: { nextAttemptAt: new Date(0) } });
}

test("SIAFIC DEMO · ERP e receptor independente", { timeout: 180000 }, async (t) => {
  await t.test("T01/T14/T30 · entrega autenticada, contrato dependente e idempotencia", async () => {
    const receiver = await startReceiver(null);
    const cleanupEnvironment = configureSiaficDemoEnvironment(receiver.baseUrl, receiver.token);
    const database = await createSiaficTestDatabase();
    try {
      const fixture = await seedSiaficSourceFixture(database.prisma, receiver.baseUrl);
      const connection = await database.prisma.integrationConnection.findUniqueOrThrow({ where: { code: "SIAFIC_DEMO" } });
      assert.deepEqual(await testSiaficDemoConnection(connection), {
        status: "SUCESSO",
        message: "Receptor SIAFIC DEMO autenticado e compativel com o contrato 1.0.",
      });

      const supplierResult = await createSupplierWithSiaficEvent(database.prisma, { usuarioId: fixture.actor.id }, { companyId: fixture.company.id });
      const supplierEventId = supplierResult.eventIds[0];
      assert.equal((await dispatchSiaficEvent(database.prisma, supplierEventId)).processed, true);

      const contractResult = await saveContractWithSiaficEvent(database.prisma, { usuarioId: fixture.actor.id }, {
        number: "CT-E2E/2026",
        object: "Contrato E2E SIAFIC DEMO",
        initialValue: 2260,
        updatedValue: 2260,
        startDate: new Date("2026-09-01T12:00:00.000Z"),
        endDate: new Date("2026-09-30T12:00:00.000Z"),
        status: "Vigente",
        processId: fixture.process.id,
        supplierId: supplierResult.supplier.id,
        secretariatId: fixture.secretariat.id,
        sourceBudgetUnitId: fixture.budgetUnit.id,
      });
      const contractEventId = contractResult.eventIds.at(-1)!;
      assert.equal((await dispatchSiaficEvent(database.prisma, contractEventId)).processed, true);

      const supplierEvent = await database.prisma.siaficOutboxEvent.findUniqueOrThrow({ where: { id: supplierEventId } });
      const duplicate = await fetch(`${receiver.baseUrl}/api/demo/v1/events`, {
        method: "POST",
        headers: { Authorization: `Bearer ${receiver.token}`, "Content-Type": "application/json", "Idempotency-Key": supplierEvent.idempotencyKey },
        body: JSON.stringify(siaficDemoEnvelopeSchema.parse(supplierEvent.payload)),
      });
      assert.equal(duplicate.status, 200);

      const instruments = await fetch(`${receiver.baseUrl}/api/demo/v1/instruments`, { headers: { Authorization: `Bearer ${receiver.token}` } });
      assert.equal(instruments.status, 200);
      assert.equal((await instruments.json() as { total: number }).total, 1);
      const loginPage = await fetch(`${receiver.baseUrl}/dashboard`);
      assert.equal(loginPage.status, 200);
      assert.match(await loginPage.text(), /Abrir painel/);
      const login = await fetch(`${receiver.baseUrl}/dashboard/session`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: receiver.token }).toString(),
        redirect: "manual",
      });
      assert.equal(login.status, 303);
      const cookie = login.headers.get("set-cookie");
      assert.ok(cookie);
      assert.match(cookie, /HttpOnly/);
      const dashboard = await fetch(`${receiver.baseUrl}/dashboard`, { headers: { Cookie: cookie.split(";", 1)[0] } });
      assert.equal(dashboard.status, 200);
      assert.match(await dashboard.text(), /Fornecedores \/ partes \(1\)/);
      const forbidden = await fetch(`${receiver.baseUrl}/api/demo/v1/persons`, { headers: { Authorization: "Bearer token-invalido" } });
      assert.equal(forbidden.status, 401);
      assert.equal((await database.prisma.siaficExternalLink.count()), 2);

      const agreementCompany = await database.prisma.company.create({
        data: { corporateName: "Contraparte de convenio E2E", cnpj: "77123456789012", emailPrimary: "contraparte-e2e@example.invalid" },
      });
      const agreementSupplier = await database.prisma.supplier.create({ data: { companyId: agreementCompany.id, status: "Ativo" } });
      const covenant = await database.prisma.covenant.create({
        data: {
          number: "CV-E2E/2026",
          grantor: "Concedente E2E",
          description: "Convenio E2E SIAFIC DEMO",
          totalValueDecimal: "1000.00",
          startDate: new Date("2026-09-01T12:00:00.000Z"),
          endDate: new Date("2026-11-30T12:00:00.000Z"),
          status: "Ativo",
        },
      });
      await database.prisma.instrumentParty.create({
        data: { covenantId: covenant.id, supplierId: agreementSupplier.id, role: "Convenente" },
      });
      const agreementEventIds = await database.prisma.$transaction((tx) => queueCovenantSnapshot(tx, { usuarioId: fixture.actor.id }, covenant.id, "CREATE"));
      assert.equal(agreementEventIds.length, 2);
      const partyEvent = await database.prisma.siaficOutboxEvent.findUniqueOrThrow({ where: { id: agreementEventIds[0] } });
      const partyEnvelope = siaficDemoEnvelopeSchema.parse(partyEvent.payload);
      assert.equal(partyEnvelope.entityType, "PERSON");
      assert.equal(partyEnvelope.entityId, agreementSupplier.id);
      const agreementEvent = await database.prisma.siaficOutboxEvent.findUniqueOrThrow({ where: { id: agreementEventIds[1] } });
      const agreementEnvelope = siaficDemoEnvelopeSchema.parse(agreementEvent.payload);
      assert.equal(agreementEnvelope.entityType, "INSTRUMENT");
      assert.equal(agreementEnvelope.payload.instrumentType, "AGREEMENT");
      assert.deepEqual(agreementEnvelope.payload.parties, [{ sourcePersonId: agreementSupplier.id, role: "Convenente" }]);

      const receiverDependency = await fetch(`${receiver.baseUrl}/api/demo/v1/events`, {
        method: "POST",
        headers: { Authorization: `Bearer ${receiver.token}`, "Content-Type": "application/json", "Idempotency-Key": agreementEvent.idempotencyKey },
        body: JSON.stringify(agreementEnvelope),
      });
      assert.equal(receiverDependency.status, 409);
      assert.equal((await receiverDependency.json() as { error: { code: string } }).error.code, "DEPENDENCY_MISSING");

      const waiting = await dispatchSiaficEvent(database.prisma, agreementEvent.id);
      assert.equal(waiting.processed, false);
      assert.equal(waiting.reason, "WAITING_DEPENDENCY");
      assert.equal((await dispatchSiaficEvent(database.prisma, partyEvent.id)).processed, true);
      await retryNow(database.prisma, agreementEvent.id);
      assert.equal((await dispatchSiaficEvent(database.prisma, agreementEvent.id)).processed, true);

      const agreementReceipt = await fetch(`${receiver.baseUrl}/api/demo/v1/receipts/by-event/${agreementEvent.id}`, { headers: { Authorization: `Bearer ${receiver.token}` } });
      assert.equal(agreementReceipt.status, 200);
      const agreementReceiptBody = await agreementReceipt.json() as {
        eventId: string;
        entityId: string;
        entityVersion: number;
        remoteEntityId: string;
        receiptId: string;
        processingStatus: string;
        requestHash: string;
        simulation: boolean;
        notice: string;
      };
      const agreementDelivery = await database.prisma.siaficDelivery.findUniqueOrThrow({ where: { eventId: agreementEvent.id } });
      assert.equal(agreementReceiptBody.eventId, agreementEvent.id);
      assert.equal(agreementReceiptBody.entityId, covenant.id);
      assert.equal(agreementReceiptBody.entityVersion, 1);
      assert.equal(agreementReceiptBody.processingStatus, "PROCESSED");
      assert.equal(agreementReceiptBody.remoteEntityId, agreementDelivery.remoteEntityId);
      assert.equal(agreementReceiptBody.receiptId, agreementDelivery.receiptId);
      assert.match(agreementReceiptBody.requestHash, /^sha256:[a-f0-9]{64}$/);
      assert.equal(agreementReceiptBody.simulation, true);
      assert.equal(agreementReceiptBody.notice, "SIMULADO - SEM VALIDADE OFICIAL");

      const agreementReplay = await fetch(`${receiver.baseUrl}/api/demo/v1/events`, {
        method: "POST",
        headers: { Authorization: `Bearer ${receiver.token}`, "Content-Type": "application/json", "Idempotency-Key": agreementEvent.idempotencyKey },
        body: JSON.stringify(agreementEnvelope),
      });
      assert.equal(agreementReplay.status, 200);
      const reconciliation = await fetch(`${receiver.baseUrl}/api/demo/v1/reconciliation`, { headers: { Authorization: `Bearer ${receiver.token}` } });
      assert.equal(reconciliation.status, 200);
      const reconciliationBody = await reconciliation.json() as {
        entities: Array<{
          entityType: string;
          sourceEntityId: string;
          entityData: { payload: { instrumentType?: string } };
        }>;
      };
      assert.ok(reconciliationBody.entities.some((entity) => entity.entityType === "INSTRUMENT" && entity.sourceEntityId === covenant.id && entity.entityData.payload.instrumentType === "AGREEMENT"));
      const agreementInstruments = await fetch(`${receiver.baseUrl}/api/demo/v1/instruments`, { headers: { Authorization: `Bearer ${receiver.token}` } });
      assert.equal((await agreementInstruments.json() as { total: number }).total, 2);
      const agreementDashboard = await fetch(`${receiver.baseUrl}/dashboard`, { headers: { Cookie: cookie.split(";", 1)[0] } });
      assert.match(await agreementDashboard.text(), /Convenio/);
      assert.equal((await database.prisma.siaficExternalLink.count()), 4);
    } finally {
      cleanupEnvironment();
      await database.close();
      await receiver.close();
    }
  });

  for (const scenario of ["FAIL_BEFORE_COMMIT_ONCE", "FAIL_AFTER_COMMIT_ONCE"] as const) {
    await t.test(`T17/T18 · ${scenario} confirma sem duplicar`, async () => {
      const receiver = await startReceiver(scenario);
      const cleanupEnvironment = configureSiaficDemoEnvironment(receiver.baseUrl, receiver.token);
      const database = await createSiaficTestDatabase();
      try {
        const fixture = await seedSiaficSourceFixture(database.prisma, receiver.baseUrl);
        const result = await createSupplierWithSiaficEvent(database.prisma, { usuarioId: fixture.actor.id }, { companyId: fixture.company.id });
        const eventId = result.eventIds[0];
        assert.equal((await dispatchSiaficEvent(database.prisma, eventId)).processed, false);
        assert.equal((await database.prisma.siaficDelivery.findUniqueOrThrow({ where: { eventId } })).status, "RETRY_SCHEDULED");
        await retryNow(database.prisma, eventId);
        assert.equal((await dispatchSiaficEvent(database.prisma, eventId)).processed, true);

        const persons = await fetch(`${receiver.baseUrl}/api/demo/v1/persons`, { headers: { Authorization: `Bearer ${receiver.token}` } });
        assert.equal((await persons.json() as { total: number }).total, 1);
        const delivery = await database.prisma.siaficDelivery.findUniqueOrThrow({ where: { eventId } });
        assert.equal(delivery.status, "PROCESSED");
        assert.equal(delivery.attemptCount, 2);
      } finally {
        cleanupEnvironment();
        await database.close();
        await receiver.close();
      }
    });
  }
});
