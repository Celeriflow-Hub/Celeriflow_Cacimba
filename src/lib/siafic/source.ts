import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, type IntegrationConnection, type PrismaClient } from "@prisma/client";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import {
  calendarDate,
  createSiaficIdempotencyKey,
  createSiaficRequestHash,
  decimalText,
  type SiaficDemoEnvelope,
} from "./contract";
import {
  assertSiaficConnectionMatchesRuntime,
  getSiaficDemoRuntimeConfig,
  parseSiaficConnectionConfiguration,
} from "./config";

type Tx = Prisma.TransactionClient;

export type SiaficActor = { usuarioId: string };
export type SiaficOperation = "CREATE" | "UPDATE" | "BASELINE";

export type SupplierCreateInput = {
  personId?: string | null;
  companyId?: string | null;
  category?: string | null;
  businessBranch?: string | null;
  certificationsValidUntil?: Date | null;
  bankData?: string | null;
  notes?: string | null;
  status?: string;
};

export type SupplierUpdateInput = Pick<SupplierCreateInput, "category" | "businessBranch" | "certificationsValidUntil" | "bankData" | "notes">;

export type ContractSaveInput = {
  id?: string;
  number: string;
  object: string;
  initialValue: number;
  updatedValue: number;
  startDate: Date;
  endDate: Date;
  status: string;
  processId: string;
  supplierId: string;
  secretariatId: string;
  sourceBudgetUnitId: string;
};

type PersonSnapshotPayload = Extract<SiaficDemoEnvelope, { entityType: "PERSON" }>["payload"];
type AgreementPartySnapshot = {
  sourcePersonId: string;
  role: string;
  supplierId: string | null;
  personSnapshot: Omit<PersonSnapshotPayload, "sourceUnitCode" | "targetUnitCode"> | null;
};

type CovenantPartyRecord = {
  id: string;
  role: string;
  supplier: { id: string } | null;
  person: { id: string; fullName: string; email: string | null; status: string } | null;
  company: {
    id: string;
    corporateName: string;
    tradeName: string | null;
    emailPrimary: string | null;
    companyType: string | null;
    primaryCnae: string | null;
    secondaryCnaes: string | null;
    status: string;
  } | null;
  employee: { id: string; name: string; email: string | null; isActive: boolean } | null;
};

const SIAFIC_CONNECTION_CODE = "SIAFIC_DEMO";

function supplierStatus(status: string) {
  if (status === "Ativo") return "ACTIVE" as const;
  if (status === "Suspenso") return "SUSPENDED" as const;
  return "INACTIVE" as const;
}

function cnaes(primary: string | null | undefined, secondary: string | null | undefined) {
  return [primary, ...(secondary?.split(/[;,\n]/) ?? [])]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function contractYear(number: string, startDate: Date) {
  const explicitYear = number.match(/(?:19|20)\d{2}/)?.[0];
  return explicitYear ? Number(explicitYear) : startDate.getUTCFullYear();
}

function decimalAmount(value: { toFixed: (scale: number) => string }) {
  const text = value.toFixed(2);
  if (!/^\d+\.\d{2}$/.test(text)) throw new Error("Valor do convenio invalido para integracao SIAFIC.");
  return text;
}

function canonicalAgreementParty(party: CovenantPartyRecord): AgreementPartySnapshot {
  const role = party.role.trim();
  if (!role) throw new Error(`A parte ${party.id} do convenio nao possui papel para integracao SIAFIC.`);
  const identities = [party.supplier, party.person, party.company, party.employee].filter(Boolean);
  if (identities.length !== 1) {
    throw new Error(`A parte ${party.id} do convenio deve possuir exatamente uma identidade canonica para integracao SIAFIC.`);
  }
  if (party.supplier) {
    return { sourcePersonId: party.supplier.id, role, supplierId: party.supplier.id, personSnapshot: null };
  }
  if (party.person) {
    return {
      sourcePersonId: `PERSON:${party.person.id}`,
      role,
      supplierId: null,
      personSnapshot: {
        personKind: "PF",
        identity: { type: "SYNTHETIC", value: `PARTY:PERSON:${party.person.id}` },
        legalName: party.person.fullName,
        tradeName: null,
        roles: ["AGREEMENT_COUNTERPART"],
        registrationStatus: supplierStatus(party.person.status),
        businessActivity: null,
        companyType: null,
        cnaes: [],
        email: party.person.email,
      },
    };
  }
  if (party.company) {
    return {
      sourcePersonId: `COMPANY:${party.company.id}`,
      role,
      supplierId: null,
      personSnapshot: {
        personKind: "PJ",
        identity: { type: "SYNTHETIC", value: `PARTY:COMPANY:${party.company.id}` },
        legalName: party.company.corporateName,
        tradeName: party.company.tradeName,
        roles: ["AGREEMENT_COUNTERPART"],
        registrationStatus: supplierStatus(party.company.status),
        businessActivity: null,
        companyType: party.company.companyType,
        cnaes: cnaes(party.company.primaryCnae, party.company.secondaryCnaes),
        email: party.company.emailPrimary,
      },
    };
  }
  if (!party.employee) throw new Error(`A parte ${party.id} do convenio nao possui identidade para integracao SIAFIC.`);
  return {
    sourcePersonId: `EMPLOYEE:${party.employee.id}`,
    role,
    supplierId: null,
    personSnapshot: {
      personKind: "PF",
      identity: { type: "SYNTHETIC", value: `PARTY:EMPLOYEE:${party.employee.id}` },
      legalName: party.employee.name,
      tradeName: null,
      roles: ["AGREEMENT_COUNTERPART"],
      registrationStatus: party.employee.isActive ? "ACTIVE" : "INACTIVE",
      businessActivity: null,
      companyType: null,
      cnaes: [],
      email: party.employee.email,
    },
  };
}

async function activeConnections(tx: Tx) {
  const runtime = getSiaficDemoRuntimeConfig();
  if (!runtime) return { runtime: null, connections: [] as const };
  const connections = await tx.integrationConnection.findMany({
    where: { code: SIAFIC_CONNECTION_CODE, environment: "DEMO", status: "ATIVA" },
  });
  for (const connection of connections) {
    assertSiaficConnectionMatchesRuntime(connection.baseUrl);
    parseSiaficConnectionConfiguration(connection.configuration);
  }
  return { runtime, connections };
}

async function nextEntityVersion(
  tx: Tx,
  connectionId: string,
  datasetId: string,
  entityType: "PERSON" | "INSTRUMENT",
  entityId: string,
) {
  return tx.siaficEntityVersion.upsert({
    where: { connectionId_datasetId_entityType_entityId: { connectionId, datasetId, entityType, entityId } },
    create: { connectionId, datasetId, entityType, entityId, currentVersion: 1 },
    update: { currentVersion: { increment: 1 } },
    select: { currentVersion: true },
  });
}

async function queueEnvelope(
  tx: Tx,
  actor: SiaficActor,
  input: {
    connection: IntegrationConnection;
    envelope: SiaficDemoEnvelope;
  },
) {
  const { connection, envelope } = input;
  const payloadHash = createSiaficRequestHash(envelope);
  await tx.siaficOutboxEvent.create({
    data: {
      id: envelope.eventId,
      connectionId: connection.id,
      actorUsuarioId: actor.usuarioId,
      datasetId: envelope.datasetId,
      sourceInstanceId: envelope.sourceInstanceId,
      entityType: envelope.entityType,
      entityId: envelope.entityId,
      entityVersion: envelope.entityVersion,
      deliveryRevision: envelope.deliveryRevision,
      eventType: envelope.eventType,
      operation: envelope.operation,
      payload: envelope as Prisma.InputJsonValue,
      payloadHash,
      idempotencyKey: createSiaficIdempotencyKey({
        sourceInstanceId: envelope.sourceInstanceId,
        connectionId: connection.id,
        datasetId: envelope.datasetId,
        entityType: envelope.entityType,
        entityId: envelope.entityId,
        entityVersion: envelope.entityVersion,
        deliveryRevision: envelope.deliveryRevision,
      }),
      destinationSnapshot: {
        connectionId: connection.id,
        environment: connection.environment,
        baseUrl: connection.baseUrl,
        configuration: connection.configuration,
        configurationUpdatedAt: connection.updatedAt.toISOString(),
      } as Prisma.InputJsonValue,
      delivery: { create: { status: "PENDING" } },
    },
  });
  await writeAuditEvent(tx, {
    actorUsuarioId: actor.usuarioId,
    eventType: auditEventTypes.siaficOutboxQueued,
    targetType: "SiaficOutboxEvent",
    targetId: envelope.eventId,
  });
  return envelope.eventId;
}

async function supplierSnapshot(tx: Tx, supplierId: string) {
  const supplier = await tx.supplier.findUnique({
    where: { id: supplierId },
    include: {
      person: { select: { id: true, fullName: true, email: true, status: true } },
      company: {
        select: {
          id: true,
          corporateName: true,
          tradeName: true,
          emailPrimary: true,
          companyType: true,
          primaryCnae: true,
          secondaryCnaes: true,
          status: true,
        },
      },
    },
  });
  if (!supplier || Boolean(supplier.person) === Boolean(supplier.company)) {
    throw new Error("O fornecedor deve possuir exatamente uma identidade PF ou PJ para integracao SIAFIC.");
  }
  return supplier;
}

async function queueSupplierForConnection(
  tx: Tx,
  actor: SiaficActor,
  supplierId: string,
  operation: SiaficOperation,
  connection: IntegrationConnection,
  runtime: NonNullable<ReturnType<typeof getSiaficDemoRuntimeConfig>>,
) {
  // A transaction client may use one physical connection, so keep its queries ordered.
  const supplier = await supplierSnapshot(tx, supplierId);
  const version = await nextEntityVersion(tx, connection.id, runtime.datasetId, "PERSON", supplierId);
  const mapping = parseSiaficConnectionConfiguration(connection.configuration);
  const targetUnitCode = mapping.unitMappings[mapping.defaultSourceUnitCode];
  if (!targetUnitCode) throw new Error("O de-para da unidade padrao do SIAFIC nao foi configurado.");
  const person = supplier.person;
  const company = supplier.company;
  const envelope: SiaficDemoEnvelope = {
    protocol: "ROBONUVEM-SIAFIC-DEMO",
    protocolVersion: "1.0",
    environment: "DEMO",
    eventId: randomUUID(),
    sourceInstanceId: runtime.sourceInstanceId,
    datasetId: runtime.datasetId,
    entityType: "PERSON",
    entityId: supplier.id,
    entityVersion: version.currentVersion,
    deliveryRevision: 1,
    eventType: "person.snapshot",
    operation,
    occurredAt: new Date().toISOString(),
    dataClassification: "SYNTHETIC_DEMO",
    replacesEventId: null,
    payload: {
      personKind: person ? "PF" : "PJ",
      identity: { type: "SYNTHETIC", value: `SUPPLIER:${supplier.id}` },
      legalName: person?.fullName ?? company!.corporateName,
      tradeName: company?.tradeName ?? null,
      roles: ["SUPPLIER"],
      registrationStatus: supplierStatus(supplier.status),
      businessActivity: supplier.businessBranch ?? null,
      companyType: company?.companyType ?? null,
      cnaes: cnaes(company?.primaryCnae, company?.secondaryCnaes),
      email: person?.email ?? company?.emailPrimary ?? null,
      sourceUnitCode: mapping.defaultSourceUnitCode,
      targetUnitCode,
    },
  };
  return queueEnvelope(tx, actor, { connection, envelope });
}

async function queueAgreementPartyForConnection(
  tx: Tx,
  actor: SiaficActor,
  party: AgreementPartySnapshot,
  connection: IntegrationConnection,
  runtime: NonNullable<ReturnType<typeof getSiaficDemoRuntimeConfig>>,
) {
  const version = await tx.siaficEntityVersion.findUnique({
    where: {
      connectionId_datasetId_entityType_entityId: {
        connectionId: connection.id,
        datasetId: runtime.datasetId,
        entityType: "PERSON",
        entityId: party.sourcePersonId,
      },
    },
    select: { id: true },
  });
  if (version) return [];
  if (party.supplierId) {
    return [await queueSupplierForConnection(tx, actor, party.supplierId, "CREATE", connection, runtime)];
  }
  if (!party.personSnapshot) throw new Error("A parte canonica do convenio nao possui snapshot para integracao SIAFIC.");

  const mapping = parseSiaficConnectionConfiguration(connection.configuration);
  const targetUnitCode = mapping.unitMappings[mapping.defaultSourceUnitCode];
  if (!targetUnitCode) throw new Error("O de-para da unidade padrao do SIAFIC nao foi configurado.");
  const nextVersion = await nextEntityVersion(tx, connection.id, runtime.datasetId, "PERSON", party.sourcePersonId);
  const envelope: SiaficDemoEnvelope = {
    protocol: "ROBONUVEM-SIAFIC-DEMO",
    protocolVersion: "1.0",
    environment: "DEMO",
    eventId: randomUUID(),
    sourceInstanceId: runtime.sourceInstanceId,
    datasetId: runtime.datasetId,
    entityType: "PERSON",
    entityId: party.sourcePersonId,
    entityVersion: nextVersion.currentVersion,
    deliveryRevision: 1,
    eventType: "person.snapshot",
    operation: "CREATE",
    occurredAt: new Date().toISOString(),
    dataClassification: "SYNTHETIC_DEMO",
    replacesEventId: null,
    payload: {
      ...party.personSnapshot,
      sourceUnitCode: mapping.defaultSourceUnitCode,
      targetUnitCode,
    },
  };
  return [await queueEnvelope(tx, actor, { connection, envelope })];
}

export async function queueSupplierSnapshot(tx: Tx, actor: SiaficActor, supplierId: string, operation: SiaficOperation) {
  const { runtime, connections } = await activeConnections(tx);
  if (!runtime) return [];
  const eventIds: string[] = [];
  for (const connection of connections) {
    eventIds.push(await queueSupplierForConnection(tx, actor, supplierId, operation, connection, runtime));
  }
  return eventIds;
}

async function ensureSupplierSnapshot(
  tx: Tx,
  actor: SiaficActor,
  supplierId: string,
  connection: IntegrationConnection,
  runtime: NonNullable<ReturnType<typeof getSiaficDemoRuntimeConfig>>,
) {
  const version = await tx.siaficEntityVersion.findUnique({
    where: { connectionId_datasetId_entityType_entityId: { connectionId: connection.id, datasetId: runtime.datasetId, entityType: "PERSON", entityId: supplierId } },
    select: { id: true },
  });
  return version ? [] : [await queueSupplierForConnection(tx, actor, supplierId, "CREATE", connection, runtime)];
}

export async function queueContractSnapshot(tx: Tx, actor: SiaficActor, contractId: string, operation: SiaficOperation) {
  const { runtime, connections } = await activeConnections(tx);
  if (!runtime) return [];
  const contract = await tx.contract.findUnique({
    where: { id: contractId },
    include: {
      sourceBudgetUnit: { select: { code: true } },
      supplier: { select: { id: true } },
      process: {
        select: {
          number: true,
          items: {
            select: {
              id: true,
              customName: true,
              quantity: true,
              estimatedUnitValue: true,
              catalogItem: { select: { name: true, unit: true } },
              material: { select: { name: true, unitOfMeasure: true } },
            },
          },
        },
      },
      amendments: {
        select: { id: true, type: true, justification: true, newValue: true, newEndDate: true, status: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!contract) throw new Error("Contrato nao encontrado para integracao SIAFIC.");
  if (!contract.sourceBudgetUnit) {
    throw new Error("Selecione a Unidade Gestora de origem antes de integrar o contrato ao SIAFIC.");
  }

  const eventIds: string[] = [];
  for (const connection of connections) {
    const mapping = parseSiaficConnectionConfiguration(connection.configuration);
    const targetUnitCode = mapping.unitMappings[contract.sourceBudgetUnit.code];
    if (!targetUnitCode) {
      throw new Error(`A Unidade Gestora ${contract.sourceBudgetUnit.code} nao possui de-para SIAFIC configurado.`);
    }
    eventIds.push(...await ensureSupplierSnapshot(tx, actor, contract.supplier.id, connection, runtime));
    const version = await nextEntityVersion(tx, connection.id, runtime.datasetId, "INSTRUMENT", contract.id);
    const envelope: SiaficDemoEnvelope = {
      protocol: "ROBONUVEM-SIAFIC-DEMO",
      protocolVersion: "1.0",
      environment: "DEMO",
      eventId: randomUUID(),
      sourceInstanceId: runtime.sourceInstanceId,
      datasetId: runtime.datasetId,
      entityType: "INSTRUMENT",
      entityId: contract.id,
      entityVersion: version.currentVersion,
      deliveryRevision: 1,
      eventType: "instrument.snapshot",
      operation,
      occurredAt: new Date().toISOString(),
      dataClassification: "SYNTHETIC_DEMO",
      replacesEventId: null,
      payload: {
        instrumentType: "CONTRACT",
        number: contract.number,
        year: contractYear(contract.number, contract.startDate),
        sourceUnitCode: contract.sourceBudgetUnit.code,
        targetUnitCode,
        processReference: contract.process.number,
        object: contract.object,
        parties: [{ sourcePersonId: contract.supplier.id, role: "SUPPLIER" }],
        signedOn: calendarDate(contract.startDate),
        validFrom: calendarDate(contract.startDate),
        validUntil: calendarDate(contract.endDate),
        status: contract.status,
        currency: "BRL",
        initialAmount: decimalText(contract.initialValue)!,
        currentAmount: decimalText(contract.updatedValue)!,
        items: contract.process.items.map((item) => ({
          sourceItemId: item.id,
          description: item.catalogItem?.name ?? item.material?.name ?? item.customName ?? "Item sem descricao",
          unit: item.catalogItem?.unit ?? item.material?.unitOfMeasure ?? "UN",
          quantity: decimalText(item.quantity, 4)!,
          unitPrice: decimalText(item.estimatedUnitValue, 4),
          totalAmount: null,
        })),
        changes: contract.amendments.map((amendment) => ({
          sourceChangeId: amendment.id,
          type: amendment.type,
          justification: amendment.justification,
          status: amendment.status,
          currentAmount: decimalText(amendment.newValue),
          validUntil: amendment.newEndDate ? calendarDate(amendment.newEndDate) : null,
          occurredAt: amendment.createdAt.toISOString(),
        })),
        documentReferences: [],
      },
    };
    eventIds.push(await queueEnvelope(tx, actor, { connection, envelope }));
  }
  return eventIds;
}

export async function queueCovenantSnapshot(tx: Tx, actor: SiaficActor, covenantId: string, operation: SiaficOperation) {
  const { runtime, connections } = await activeConnections(tx);
  if (!runtime) return [];
  const covenant = await tx.covenant.findUnique({
    where: { id: covenantId },
    include: {
      instrumentParties: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          role: true,
          supplier: { select: { id: true } },
          person: { select: { id: true, fullName: true, email: true, status: true } },
          company: {
            select: {
              id: true,
              corporateName: true,
              tradeName: true,
              emailPrimary: true,
              companyType: true,
              primaryCnae: true,
              secondaryCnaes: true,
              status: true,
            },
          },
          employee: { select: { id: true, name: true, email: true, isActive: true } },
        },
      },
    },
  });
  if (!covenant) throw new Error("Convenio nao encontrado para integracao SIAFIC.");
  const parties = covenant.instrumentParties.map((party) => canonicalAgreementParty(party));
  const eventIds: string[] = [];
  for (const connection of connections) {
    const mapping = parseSiaficConnectionConfiguration(connection.configuration);
    const targetUnitCode = mapping.unitMappings[mapping.defaultSourceUnitCode];
    if (!targetUnitCode) throw new Error("O de-para da unidade padrao do SIAFIC nao foi configurado.");
    const queuedParties = new Set<string>();
    for (const party of parties) {
      if (queuedParties.has(party.sourcePersonId)) continue;
      queuedParties.add(party.sourcePersonId);
      eventIds.push(...await queueAgreementPartyForConnection(tx, actor, party, connection, runtime));
    }
    const version = await nextEntityVersion(tx, connection.id, runtime.datasetId, "INSTRUMENT", covenant.id);
    const totalAmount = decimalAmount(covenant.totalValueDecimal);
    const envelope: SiaficDemoEnvelope = {
      protocol: "ROBONUVEM-SIAFIC-DEMO",
      protocolVersion: "1.0",
      environment: "DEMO",
      eventId: randomUUID(),
      sourceInstanceId: runtime.sourceInstanceId,
      datasetId: runtime.datasetId,
      entityType: "INSTRUMENT",
      entityId: covenant.id,
      entityVersion: version.currentVersion,
      deliveryRevision: 1,
      eventType: "instrument.snapshot",
      operation,
      occurredAt: new Date().toISOString(),
      dataClassification: "SYNTHETIC_DEMO",
      replacesEventId: null,
      payload: {
        instrumentType: "AGREEMENT",
        number: covenant.number,
        year: contractYear(covenant.number, covenant.startDate),
        sourceUnitCode: mapping.defaultSourceUnitCode,
        targetUnitCode,
        processReference: null,
        object: covenant.description,
        parties: parties.map((party) => ({ sourcePersonId: party.sourcePersonId, role: party.role })),
        grantor: covenant.grantor,
        grantorUnitCode: null,
        signedOn: calendarDate(covenant.startDate),
        validFrom: calendarDate(covenant.startDate),
        validUntil: calendarDate(covenant.endDate),
        status: covenant.status,
        currency: "BRL",
        initialAmount: totalAmount,
        currentAmount: totalAmount,
        transferAmount: null,
        counterpartAmount: null,
        items: [],
        changes: [],
        documentReferences: [],
      },
    };
    eventIds.push(await queueEnvelope(tx, actor, { connection, envelope }));
  }
  return eventIds;
}

export async function createSupplierWithSiaficEvent(db: PrismaClient, actor: SiaficActor, input: SupplierCreateInput) {
  const personId = input.personId?.trim() || null;
  const companyId = input.companyId?.trim() || null;
  if (Boolean(personId) === Boolean(companyId)) {
    throw new Error("Selecione exatamente uma pessoa fisica ou juridica para o fornecedor.");
  }
  return db.$transaction(async (tx) => {
    const identity = personId
      ? await tx.person.findUnique({ where: { id: personId }, select: { id: true } })
      : await tx.company.findUnique({ where: { id: companyId! }, select: { id: true } });
    if (!identity) throw new Error("A identidade selecionada para o fornecedor nao existe.");
    const supplier = await tx.supplier.create({
      data: {
        personId,
        companyId,
        category: input.category?.trim() || null,
        businessBranch: input.businessBranch?.trim() || null,
        certificationsValidUntil: input.certificationsValidUntil ?? null,
        bankData: input.bankData?.trim() || null,
        notes: input.notes?.trim() || null,
        status: input.status ?? "Ativo",
      },
    });
    const eventIds = await queueSupplierSnapshot(tx, actor, supplier.id, "CREATE");
    return { supplier, eventIds };
  });
}

export async function updateSupplierWithSiaficEvent(db: PrismaClient, actor: SiaficActor, supplierId: string, data: SupplierUpdateInput) {
  return db.$transaction(async (tx) => {
    const supplier = await tx.supplier.update({ where: { id: supplierId }, data });
    const eventIds = await queueSupplierSnapshot(tx, actor, supplier.id, "UPDATE");
    return { supplier, eventIds };
  });
}

export async function setSupplierStatusWithSiaficEvent(db: PrismaClient, actor: SiaficActor, supplierId: string, status: string) {
  return db.$transaction(async (tx) => {
    const supplier = await tx.supplier.update({ where: { id: supplierId }, data: { status } });
    const eventIds = await queueSupplierSnapshot(tx, actor, supplier.id, "UPDATE");
    return { supplier, eventIds };
  });
}

export async function saveContractWithSiaficEvent(db: PrismaClient, actor: SiaficActor, input: ContractSaveInput) {
  return db.$transaction(async (tx) => {
    const data = {
      number: input.number,
      object: input.object,
      initialValue: input.initialValue,
      updatedValue: input.updatedValue,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      processId: input.processId,
      supplierId: input.supplierId,
      secretariatId: input.secretariatId,
      sourceBudgetUnitId: input.sourceBudgetUnitId,
    };
    const contract = input.id
      ? await tx.contract.update({ where: { id: input.id }, data })
      : await tx.contract.create({ data });
    const eventIds = await queueContractSnapshot(tx, actor, contract.id, input.id ? "UPDATE" : "CREATE");
    return { contract, eventIds };
  });
}

export async function queueSiaficBaseline(
  db: PrismaClient,
  actor: SiaficActor,
  input: { supplierIds: string[]; contractIds: string[]; covenantIds?: string[] },
) {
  return db.$transaction(async (tx) => {
    const eventIds: string[] = [];
    for (const supplierId of input.supplierIds) {
      eventIds.push(...await queueSupplierSnapshot(tx, actor, supplierId, "BASELINE"));
    }
    for (const contractId of input.contractIds) {
      eventIds.push(...await queueContractSnapshot(tx, actor, contractId, "BASELINE"));
    }
    for (const covenantId of input.covenantIds ?? []) {
      eventIds.push(...await queueCovenantSnapshot(tx, actor, covenantId, "BASELINE"));
    }
    return eventIds;
  });
}
