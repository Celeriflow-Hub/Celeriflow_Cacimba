import test from "node:test";
import assert from "node:assert/strict";
import { createSiaficRequestHash, siaficDemoEnvelopeSchema } from "../src/lib/siafic/contract";
import { createSupplierWithSiaficEvent, queueCovenantSnapshot, saveContractWithSiaficEvent } from "../src/lib/siafic/source";
import { configureSiaficDemoEnvironment, createSiaficTestDatabase, seedSiaficSourceFixture } from "./helpers/siafic-test-environment";

test("SIAFIC DEMO · outbox transacional e snapshots imutaveis", { timeout: 180000 }, async (t) => {
  const cleanupEnvironment = configureSiaficDemoEnvironment("http://127.0.0.1:4010");
  const database = await createSiaficTestDatabase();
  try {
    const fixture = await seedSiaficSourceFixture(database.prisma, "http://127.0.0.1:4010");
    const actor = { usuarioId: fixture.actor.id };

    await t.test("CLC-008 · fornecedor cria snapshot, versao e entrega pendente", async () => {
      const result = await createSupplierWithSiaficEvent(database.prisma, actor, {
        companyId: fixture.company.id,
        category: "Materiais",
        businessBranch: "Papelaria DEMO",
      });
      assert.equal(result.eventIds.length, 1);
      const event = await database.prisma.siaficOutboxEvent.findUniqueOrThrow({
        where: { id: result.eventIds[0] },
        include: { delivery: true },
      });
      const envelope = siaficDemoEnvelopeSchema.parse(event.payload);
      assert.equal(envelope.entityType, "PERSON");
      assert.equal(envelope.entityId, result.supplier.id);
      assert.equal(envelope.entityVersion, 1);
      assert.equal(event.payloadHash, createSiaficRequestHash(envelope));
      assert.equal(event.delivery?.status, "PENDING");
    });

    await t.test("CLC-052/075 · contrato referencia fornecedor canonicamente", async () => {
      const supplier = await database.prisma.supplier.findFirstOrThrow({ where: { companyId: fixture.company.id } });
      const result = await saveContractWithSiaficEvent(database.prisma, actor, {
        number: "CT-M-TESTE/2026",
        object: "Contrato sintetico de materiais SIAFIC",
        initialValue: 2260,
        updatedValue: 2260,
        startDate: new Date("2026-09-01T12:00:00.000Z"),
        endDate: new Date("2026-09-30T12:00:00.000Z"),
        status: "Vigente",
        processId: fixture.process.id,
        supplierId: supplier.id,
        secretariatId: fixture.secretariat.id,
        sourceBudgetUnitId: fixture.budgetUnit.id,
      });
      assert.equal(result.eventIds.length, 1);
      const event = await database.prisma.siaficOutboxEvent.findUniqueOrThrow({ where: { id: result.eventIds[0] } });
      const envelope = siaficDemoEnvelopeSchema.parse(event.payload);
      assert.equal(envelope.entityType, "INSTRUMENT");
      assert.equal(envelope.payload.parties[0].sourcePersonId, supplier.id);
      assert.equal(envelope.payload.initialAmount, "2260.00");
      assert.equal(envelope.payload.items[0].quantity, "100.0000");
    });

    await t.test("CLC-052/075 · convenio gera AGREEMENT com partes canonicas e snapshot imutavel", async () => {
      const supplier = await database.prisma.supplier.findFirstOrThrow({ where: { companyId: fixture.company.id } });
      const covenant = await database.prisma.covenant.create({
        data: {
          number: "CV-M-TESTE/2026",
          grantor: "Concedente DEMO",
          description: "Convenio sintetico para integracao SIAFIC",
          totalValueDecimal: "1000.00",
          startDate: new Date("2026-09-01T12:00:00.000Z"),
          endDate: new Date("2026-11-30T12:00:00.000Z"),
          status: "Ativo",
        },
      });
      await database.prisma.instrumentParty.create({
        data: { covenantId: covenant.id, supplierId: supplier.id, role: "AGREEMENT_COUNTERPART" },
      });

      const firstEventIds = await database.prisma.$transaction((tx) => queueCovenantSnapshot(tx, actor, covenant.id, "CREATE"));
      assert.equal(firstEventIds.length, 1);
      const firstEvent = await database.prisma.siaficOutboxEvent.findUniqueOrThrow({ where: { id: firstEventIds[0] } });
      const firstEnvelope = siaficDemoEnvelopeSchema.parse(firstEvent.payload);
      assert.equal(firstEnvelope.entityType, "INSTRUMENT");
      assert.equal(firstEnvelope.payload.instrumentType, "AGREEMENT");
      assert.equal(firstEnvelope.payload.grantor, "Concedente DEMO");
      assert.equal(firstEnvelope.payload.processReference, null);
      assert.deepEqual(firstEnvelope.payload.parties, [{ sourcePersonId: supplier.id, role: "AGREEMENT_COUNTERPART" }]);
      assert.equal(firstEnvelope.payload.initialAmount, "1000.00");
      assert.equal(firstEnvelope.payload.transferAmount, null);
      assert.equal(firstEvent.payloadHash, createSiaficRequestHash(firstEnvelope));

      const partner = await database.prisma.company.create({
        data: { corporateName: "Parte direta DEMO", cnpj: "88123456789012", emailPrimary: "parte-direta@example.invalid" },
      });
      await database.prisma.instrumentParty.create({
        data: { covenantId: covenant.id, companyId: partner.id, role: "Convenente" },
      });
      const updateEventIds = await database.prisma.$transaction((tx) => queueCovenantSnapshot(tx, actor, covenant.id, "UPDATE"));
      assert.equal(updateEventIds.length, 2);
      const partyEvent = await database.prisma.siaficOutboxEvent.findUniqueOrThrow({ where: { id: updateEventIds[0] } });
      const partyEnvelope = siaficDemoEnvelopeSchema.parse(partyEvent.payload);
      assert.equal(partyEnvelope.entityType, "PERSON");
      assert.equal(partyEnvelope.entityId, `COMPANY:${partner.id}`);
      assert.deepEqual(partyEnvelope.payload.roles, ["AGREEMENT_COUNTERPART"]);

      const updateEvent = await database.prisma.siaficOutboxEvent.findUniqueOrThrow({ where: { id: updateEventIds[1] } });
      const updateEnvelope = siaficDemoEnvelopeSchema.parse(updateEvent.payload);
      assert.equal(updateEnvelope.entityType, "INSTRUMENT");
      assert.equal(updateEnvelope.entityVersion, 2);
      assert.equal(updateEnvelope.payload.instrumentType, "AGREEMENT");
      assert.equal(updateEnvelope.payload.parties.length, 2);
      assert.ok(updateEnvelope.payload.parties.some((party) => party.sourcePersonId === `COMPANY:${partner.id}` && party.role === "Convenente"));
      assert.ok(updateEnvelope.payload.parties.some((party) => party.sourcePersonId === supplier.id && party.role === "AGREEMENT_COUNTERPART"));
    });

    await t.test("T23 · falha local reverte fornecedor e evento juntos", async () => {
      const company = await database.prisma.company.create({ data: { corporateName: "Falha atomica DEMO", cnpj: "99123456789012" } });
      const before = await database.prisma.supplier.count();
      await database.memory.exec(`
        CREATE FUNCTION siafic_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Falha SIAFIC de teste'; END $$;
        CREATE TRIGGER siafic_fail_outbox BEFORE INSERT ON "SiaficOutboxEvent" FOR EACH ROW EXECUTE FUNCTION siafic_test_failure();
      `);
      await assert.rejects(createSupplierWithSiaficEvent(database.prisma, actor, { companyId: company.id }), /Falha SIAFIC de teste/);
      await database.memory.exec('DROP TRIGGER siafic_fail_outbox ON "SiaficOutboxEvent"; DROP FUNCTION siafic_test_failure();');
      assert.equal(await database.prisma.supplier.count(), before);
      assert.equal(await database.prisma.supplier.count({ where: { companyId: company.id } }), 0);
    });
  } finally {
    cleanupEnvironment();
    await database.close();
  }
});
