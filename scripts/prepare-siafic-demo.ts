import "./load-local-environment";

import { prisma } from "@/lib/prisma";
import { testSiaficDemoConnection, dispatchSiaficEvents } from "@/lib/siafic/dispatcher";
import { getSiaficDemoRuntimeConfig } from "@/lib/siafic/config";
import { queueSiaficBaseline } from "@/lib/siafic/source";
import { syntheticCnpj } from "@/lib/poc/fixture-catalog";

const fixtureTag = "SIAFIC-POC-2026";
const sourceUnits = [
  { id: "siafic-poc-ug-01", code: "SIAFIC-UG-01", name: "Unidade Gestora SIAFIC DEMO 01", targetCode: "UG-EXTERNA-01" },
  { id: "siafic-poc-ug-02", code: "SIAFIC-UG-02", name: "Unidade Gestora SIAFIC DEMO 02", targetCode: "UG-EXTERNA-02" },
] as const;
const supplierDefinitions = [
  { alias: "FOR-A", id: "siafic-poc-fornecedor-a", companyId: "siafic-poc-empresa-a", seed: 9801, name: "Fornecedor A Materiais Sinteticos Ltda." },
  { alias: "FOR-B", id: "siafic-poc-fornecedor-b", companyId: "siafic-poc-empresa-b", seed: 9802, name: "Fornecedor B Servicos Sinteticos Ltda." },
  { alias: "FOR-C", id: "siafic-poc-fornecedor-c", companyId: "siafic-poc-empresa-c", seed: 9803, name: "Fornecedor C Tecnologia Sintetica Ltda." },
  { alias: "FOR-D", id: "siafic-poc-fornecedor-d", companyId: "siafic-poc-empresa-d", seed: 9804, name: "Fornecedor D Suprimentos Sinteticos Ltda." },
] as const;
const contractDefinitions = [
  { number: "SIAFIC-POC-CT-001/2026", supplierAlias: "FOR-A", unitCode: "SIAFIC-UG-01", value: 12840, description: "fornecimento sintetico de materiais de expediente" },
  { number: "SIAFIC-POC-CT-002/2026", supplierAlias: "FOR-B", unitCode: "SIAFIC-UG-02", value: 18750, description: "prestacao sintetica de servicos administrativos" },
  { number: "SIAFIC-POC-CT-003/2026", supplierAlias: "FOR-C", unitCode: "SIAFIC-UG-01", value: 24400, description: "fornecimento sintetico de equipamentos de tecnologia" },
  { number: "SIAFIC-POC-CT-004/2026", supplierAlias: "FOR-D", unitCode: "SIAFIC-UG-02", value: 9600, description: "fornecimento sintetico de suprimentos operacionais" },
  { number: "SIAFIC-POC-CT-005/2026", supplierAlias: "FOR-A", unitCode: "SIAFIC-UG-01", value: 15320, description: "fornecimento sintetico de itens complementares" },
] as const;

function hasArgument(argument: string) {
  return process.argv.includes(argument);
}

async function ensureRequestItem(requestId: string, catalogItemId: string, quantity: number, estimatedUnitValue: number) {
  const existing = await prisma.purchaseRequestItem.findFirst({ where: { purchaseRequestId: requestId, catalogItemId }, select: { id: true } });
  if (existing) return prisma.purchaseRequestItem.update({ where: { id: existing.id }, data: { quantity, estimatedUnitValue } });
  return prisma.purchaseRequestItem.create({ data: { purchaseRequestId: requestId, catalogItemId, quantity, estimatedUnitValue } });
}

async function ensureProcessItem(purchaseProcessId: string, catalogItemId: string, quantity: number, estimatedUnitValue: number) {
  const existing = await prisma.purchaseProcessItem.findFirst({ where: { purchaseProcessId, catalogItemId }, select: { id: true } });
  if (existing) return prisma.purchaseProcessItem.update({ where: { id: existing.id }, data: { quantity, estimatedUnitValue } });
  return prisma.purchaseProcessItem.create({ data: { purchaseProcessId, catalogItemId, quantity, estimatedUnitValue } });
}

async function main() {
  if (process.env.SIAFIC_DEMO_FIXTURES_ENABLED !== "true") {
    throw new Error("Defina SIAFIC_DEMO_FIXTURES_ENABLED=true para criar somente a massa sintetica SIAFIC DEMO.");
  }
  const config = getSiaficDemoRuntimeConfig();
  if (!config) throw new Error("Defina SIAFIC_ENABLED=true para preparar e enfileirar a demonstracao.");
  if (!config.datasetId.startsWith("SIAFIC-POC-")) {
    throw new Error("SIAFIC_DATASET_ID deve iniciar com SIAFIC-POC- para impedir carga de fixture fora do dataset DEMO.");
  }

  const secretariat = await prisma.secretariat.upsert({
    where: { id: "siafic-poc-secretariat" },
    create: { id: "siafic-poc-secretariat", name: "Secretaria SIAFIC POC Sintetica", acronym: "SIAFIC" },
    update: { name: "Secretaria SIAFIC POC Sintetica", acronym: "SIAFIC" },
  });
  const department = await prisma.department.upsert({
    where: { id: "siafic-poc-department" },
    create: { id: "siafic-poc-department", name: "Compras SIAFIC POC", secretariatId: secretariat.id },
    update: { name: "Compras SIAFIC POC", secretariatId: secretariat.id },
  });
  const budgetUnits = await Promise.all(sourceUnits.map((unit) => prisma.budgetUnit.upsert({
    where: { code: unit.code },
    create: { id: unit.id, code: unit.code, name: unit.name, secretariatId: secretariat.id },
    update: { name: unit.name, secretariatId: secretariat.id },
  })));
  const profile = await prisma.configuracaoPerfil.upsert({
    where: { codigo: "SIAFIC_POC_OPERATOR" },
    create: { id: "siafic-poc-profile", codigo: "SIAFIC_POC_OPERATOR", nome: "Operador SIAFIC POC", permissoes: "{}", ativo: true },
    update: { nome: "Operador SIAFIC POC", permissoes: "{}", ativo: true },
  });
  const employee = await prisma.employee.upsert({
    where: { id: "siafic-poc-employee" },
    create: { id: "siafic-poc-employee", name: "Operador SIAFIC POC", email: "operador.siafic@demo.invalid", secretariatId: secretariat.id, departmentId: department.id },
    update: { name: "Operador SIAFIC POC", email: "operador.siafic@demo.invalid", secretariatId: secretariat.id, departmentId: department.id, isActive: true },
  });
  const actor = await prisma.usuario.upsert({
    where: { email: "operador.siafic@demo.invalid" },
    create: { id: "siafic-poc-user", nome: "Operador SIAFIC POC", email: "operador.siafic@demo.invalid", perfilId: profile.id, employeeId: employee.id },
    update: { nome: "Operador SIAFIC POC", perfilId: profile.id, employeeId: employee.id, ativo: true },
  });
  await Promise.all(budgetUnits.map((unit) => prisma.usuarioUnidadeGestora.upsert({
    where: { usuarioId_budgetUnitId: { usuarioId: actor.id, budgetUnitId: unit.id } },
    create: { usuarioId: actor.id, budgetUnitId: unit.id },
    update: {},
  })));

  const unitMappings = Object.fromEntries(sourceUnits.map((unit) => [unit.code, unit.targetCode]));
  const connection = await prisma.integrationConnection.upsert({
    where: { code: "SIAFIC_DEMO" },
    create: {
      code: "SIAFIC_DEMO",
      name: "SIAFIC DEMO",
      category: "GOVERNAMENTAL",
      provider: "Receptor SIAFIC - Robonuvem DEMO",
      environment: "DEMO",
      status: "CONFIGURANDO",
      baseUrl: config.receiverBaseUrl,
      credentialReference: "env:SIAFIC_API_TOKEN",
      configuration: { defaultSourceUnitCode: sourceUnits[0].code, unitMappings },
    },
    update: {
      name: "SIAFIC DEMO",
      category: "GOVERNAMENTAL",
      provider: "Receptor SIAFIC - Robonuvem DEMO",
      environment: "DEMO",
      status: "CONFIGURANDO",
      baseUrl: config.receiverBaseUrl,
      credentialReference: "env:SIAFIC_API_TOKEN",
      configuration: { defaultSourceUnitCode: sourceUnits[0].code, unitMappings },
    },
  });
  const health = await testSiaficDemoConnection(connection);
  if (health.status !== "SUCESSO") {
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastTestedAt: new Date(), lastTestStatus: health.status, lastTestMessage: health.message },
    });
    throw new Error(`O receptor SIAFIC DEMO nao foi validado: ${health.message}`);
  }
  const activeConnection = await prisma.integrationConnection.update({
    where: { id: connection.id },
    data: { status: "ATIVA", lastTestedAt: new Date(), lastTestStatus: health.status, lastTestMessage: health.message },
  });

  const suppliers = [] as Array<{ id: string }>;
  for (const definition of supplierDefinitions) {
    const company = await prisma.company.upsert({
      where: { id: definition.companyId },
      create: {
        id: definition.companyId,
        corporateName: definition.name,
        tradeName: definition.alias,
        cnpj: syntheticCnpj(definition.seed),
        companyType: "DEMO",
        primaryCnae: "0000-0/00",
        emailPrimary: `${definition.alias.toLowerCase()}@demo.invalid`,
      },
      update: {
        corporateName: definition.name,
        tradeName: definition.alias,
        companyType: "DEMO",
        primaryCnae: "0000-0/00",
        emailPrimary: `${definition.alias.toLowerCase()}@demo.invalid`,
        status: "Ativo",
      },
    });
    suppliers.push(await prisma.supplier.upsert({
      where: { id: definition.id },
      create: { id: definition.id, companyId: company.id, category: `${fixtureTag} fornecedor sintetico`, businessBranch: "Demonstracao SIAFIC", notes: `${fixtureTag}:${definition.alias}`, status: "Ativo" },
      update: { companyId: company.id, category: `${fixtureTag} fornecedor sintetico`, businessBranch: "Demonstracao SIAFIC", notes: `${fixtureTag}:${definition.alias}`, status: "Ativo" },
    }));
  }

  const budgetUnitByCode = new Map(budgetUnits.map((unit) => [unit.code, unit]));
  const supplierByAlias = new Map(supplierDefinitions.map((definition, index) => [definition.alias, suppliers[index]]));
  const contracts = [] as Array<{ id: string }>;
  for (const [index, definition] of contractDefinitions.entries()) {
    const sequence = String(index + 1).padStart(2, "0");
    const catalog = await prisma.catalogItem.upsert({
      where: { code: `${fixtureTag}-ITEM-${sequence}` },
      create: { code: `${fixtureTag}-ITEM-${sequence}`, name: `${fixtureTag} item sintetico ${sequence}`, unit: "UN", estimatedValue: definition.value / 100 },
      update: { name: `${fixtureTag} item sintetico ${sequence}`, unit: "UN", estimatedValue: definition.value / 100, isActive: true },
    });
    const request = await prisma.purchaseRequest.upsert({
      where: { number: `${fixtureTag}-SOL-${sequence}` },
      create: {
        number: `${fixtureTag}-SOL-${sequence}`,
        object: `${fixtureTag} ${definition.description}`,
        justification: "Registro exclusivamente sintetico para demonstracao de interoperabilidade.",
        estimatedValue: definition.value,
        status: "Aprovada",
        secretariatId: secretariat.id,
        departmentId: department.id,
        requesterId: employee.id,
        approvedByEmployeeId: employee.id,
        approvedAt: new Date("2026-09-01T12:00:00.000Z"),
      },
      update: {
        object: `${fixtureTag} ${definition.description}`,
        justification: "Registro exclusivamente sintetico para demonstracao de interoperabilidade.",
        estimatedValue: definition.value,
        status: "Aprovada",
        secretariatId: secretariat.id,
        departmentId: department.id,
        requesterId: employee.id,
        approvedByEmployeeId: employee.id,
        approvedAt: new Date("2026-09-01T12:00:00.000Z"),
      },
    });
    await ensureRequestItem(request.id, catalog.id, 100, definition.value / 100);
    const process = await prisma.purchaseProcess.upsert({
      where: { number: `${fixtureTag}-PROC-${sequence}` },
      create: {
        number: `${fixtureTag}-PROC-${sequence}`,
        object: request.object,
        type: "Comum",
        modality: "Pregao",
        estimatedValue: definition.value,
        status: "Homologado",
        secretariatId: secretariat.id,
        purchaseRequestId: request.id,
      },
      update: {
        object: request.object,
        type: "Comum",
        modality: "Pregao",
        estimatedValue: definition.value,
        status: "Homologado",
        secretariatId: secretariat.id,
        purchaseRequestId: request.id,
      },
    });
    await ensureProcessItem(process.id, catalog.id, 100, definition.value / 100);
    const supplier = supplierByAlias.get(definition.supplierAlias);
    const budgetUnit = budgetUnitByCode.get(definition.unitCode);
    if (!supplier || !budgetUnit) throw new Error("Fixture SIAFIC inconsistente.");
    contracts.push(await prisma.contract.upsert({
      where: { number: definition.number },
      create: {
        number: definition.number,
        object: `${fixtureTag} ${definition.description}`,
        initialValue: definition.value,
        updatedValue: definition.value,
        startDate: new Date("2026-09-01T12:00:00.000Z"),
        endDate: new Date("2026-12-31T12:00:00.000Z"),
        status: "Vigente",
        processId: process.id,
        supplierId: supplier.id,
        secretariatId: secretariat.id,
        sourceBudgetUnitId: budgetUnit.id,
      },
      update: {
        object: `${fixtureTag} ${definition.description}`,
        initialValue: definition.value,
        updatedValue: definition.value,
        startDate: new Date("2026-09-01T12:00:00.000Z"),
        endDate: new Date("2026-12-31T12:00:00.000Z"),
        status: "Vigente",
        processId: process.id,
        supplierId: supplier.id,
        secretariatId: secretariat.id,
        sourceBudgetUnitId: budgetUnit.id,
      },
    }));
  }

  const requeue = hasArgument("--requeue");
  const knownVersions = await prisma.siaficEntityVersion.findMany({
    where: {
      connectionId: activeConnection.id,
      datasetId: config.datasetId,
      OR: [
        { entityType: "PERSON", entityId: { in: suppliers.map((supplier) => supplier.id) } },
        { entityType: "INSTRUMENT", entityId: { in: contracts.map((contract) => contract.id) } },
      ],
    },
    select: { entityType: true, entityId: true },
  });
  const alreadyQueued = new Set(knownVersions.map((version) => `${version.entityType}:${version.entityId}`));
  const supplierIds = suppliers.filter((supplier) => requeue || !alreadyQueued.has(`PERSON:${supplier.id}`)).map((supplier) => supplier.id);
  const contractIds = contracts.filter((contract) => requeue || !alreadyQueued.has(`INSTRUMENT:${contract.id}`)).map((contract) => contract.id);
  const eventIds = await queueSiaficBaseline(prisma, { usuarioId: actor.id }, { supplierIds, contractIds });
  const dispatch = hasArgument("--dispatch") && eventIds.length
    ? await dispatchSiaficEvents(prisma, eventIds)
    : [];

  console.log(JSON.stringify({
    fixture: fixtureTag,
    datasetId: config.datasetId,
    sourceInstanceId: config.sourceInstanceId,
    connectionStatus: "ATIVA",
    suppliers: suppliers.length,
    contracts: contracts.length,
    eventsQueued: eventIds.length,
    eventsProcessed: dispatch.filter((result) => result.processed).length,
    requeue,
    dispatched: hasArgument("--dispatch"),
  }, null, 2));
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha ao preparar a demonstracao SIAFIC.");
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
