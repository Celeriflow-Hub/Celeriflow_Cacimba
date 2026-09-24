import { Prisma, type PrismaClient } from "@prisma/client";
import { writeAuditEvent, auditEventTypes } from "@/lib/platform/audit-evidence";
import {
  assertDifferentSystemAdministrators,
  assertMergeReversalAllowed,
  assertPersonMergeEligible,
  rankPersonMergeCandidates,
  type MergeCandidatePerson,
  type PersonMergeEligibilityInput,
  type PersonMergeManifest,
} from "./person-merge-policy";

type Db = PrismaClient | Prisma.TransactionClient;

type MergeActor = { id: string };

const sourceEligibilitySelect = {
  id: true,
  status: true,
  updatedAt: true,
  taxpayerInfo: { select: { id: true } },
  supplierInfo: { select: { id: true } },
  creditorInfo: { select: { id: true } },
  employee: { select: { id: true } },
  dependents: { select: { id: true }, take: 1 },
  patientInfo: { select: { id: true } },
  studentInfo: { select: { id: true } },
  guardianFor: { select: { id: true }, take: 1 },
  socialFamily: { select: { id: true } },
  socialFamilyMember: { select: { id: true } },
  socialAttendances: { select: { id: true }, take: 1 },
  socialConcessions: { select: { id: true }, take: 1 },
  processes: { select: { id: true }, take: 1 },
  tickets: { select: { id: true }, take: 1 },
  ombudsmans: { select: { id: true }, take: 1 },
  ombudsmanIdentities: { select: { id: true }, take: 1 },
  documents: {
    select: {
      id: true,
      signatures: { where: { status: "SIGNED" }, select: { id: true }, take: 1 },
      versions: { where: { lockedAt: { not: null } }, select: { id: true }, take: 1 },
    },
  },
} satisfies Prisma.PersonSelect;

async function getSourceEligibility(prisma: Db, sourcePersonId: string) {
  const source = await prisma.person.findUnique({ where: { id: sourcePersonId }, select: sourceEligibilitySelect });
  if (!source) throw new Error("Pessoa de origem não encontrada.");
  if (source.status === "Arquivado por mesclagem") throw new Error("A pessoa de origem já está arquivada por mesclagem.");

  const input: PersonMergeEligibilityInput = {
    fiscal: Boolean(source.taxpayerInfo),
    financial: Boolean(source.supplierInfo || source.creditorInfo),
    rh: Boolean(source.employee || source.dependents.length),
    health: Boolean(source.patientInfo),
    education: Boolean(source.studentInfo || source.guardianFor.length),
    social: Boolean(source.socialFamily || source.socialFamilyMember || source.socialAttendances.length || source.socialConcessions.length),
    process: Boolean(source.processes.length),
    attendance: Boolean(source.tickets.length || source.ombudsmans.length || source.ombudsmanIdentities.length),
    signedDocument: source.documents.some((document) => document.signatures.length > 0),
  };
  assertPersonMergeEligible(input);
  return source;
}

export async function getPersonMergeCandidates(prisma: Db, sourcePersonId: string) {
  const people = await prisma.person.findMany({
    where: { status: { not: "Arquivado por mesclagem" } },
    select: { id: true, fullName: true, cpf: true, birthDate: true, email: true, phonePrimary: true, status: true },
    take: 250,
  });
  const source = people.find((person) => person.id === sourcePersonId);
  if (!source) throw new Error("Pessoa de origem não encontrada.");
  return rankPersonMergeCandidates(source as MergeCandidatePerson, people as MergeCandidatePerson[]);
}

export async function proposePersonMerge(prisma: PrismaClient, actor: MergeActor, sourcePersonId: string, targetPersonId: string) {
  if (!sourcePersonId || !targetPersonId || sourcePersonId === targetPersonId) throw new Error("Selecione pessoas de origem e destino diferentes.");
  await getSourceEligibility(prisma, sourcePersonId);
  const target = await prisma.person.findUnique({ where: { id: targetPersonId }, select: { id: true, status: true } });
  if (!target || target.status === "Arquivado por mesclagem") throw new Error("Pessoa de destino inválida.");

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.personMergeRequest.create({
      data: { sourcePersonId, targetPersonId, proposedByUsuarioId: actor.id },
    });
    await tx.personMergeLedger.create({
      data: {
        requestId: created.id,
        eventType: "PROPOSED",
        sourcePersonId,
        targetPersonId,
        actorUsuarioId: actor.id,
        manifest: { version: 1, requestId: created.id },
      },
    });
    await writeAuditEvent(tx, { actorUsuarioId: actor.id, eventType: auditEventTypes.personMergeProposed, targetType: "PERSON_MERGE_REQUEST", targetId: created.id });
    return created;
  });
  return request.id;
}

export async function approveAndExecutePersonMerge(prisma: PrismaClient, actor: MergeActor, requestId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.personMergeRequest.findUnique({ where: { id: requestId } });
    if (!request || request.status !== "PROPOSED") throw new Error("Proposta de mesclagem não está pendente.");
    assertDifferentSystemAdministrators(request.proposedByUsuarioId, actor.id);

    const source = await getSourceEligibility(tx, request.sourcePersonId);
    const target = await tx.person.findUnique({ where: { id: request.targetPersonId }, select: { id: true, status: true } });
    if (!target || target.status === "Arquivado por mesclagem") throw new Error("Pessoa de destino inválida.");

    const documents = source.documents.filter((document) => document.signatures.length === 0 && document.versions.length === 0);
    const addresses = await tx.address.findMany({ where: { personId: source.id }, select: { id: true } });
    const executedAt = new Date();
    const manifest: PersonMergeManifest = {
      version: 1,
      sourcePersonId: source.id,
      targetPersonId: target.id,
      sourcePreviousStatus: source.status,
      executedAt: executedAt.toISOString(),
      addressIds: addresses.map((address) => address.id),
      documentIds: documents.map((document) => document.id),
    };

    const claimed = await tx.personMergeRequest.updateMany({
      where: { id: request.id, status: "PROPOSED", proposedByUsuarioId: { not: actor.id } },
      data: { status: "EXECUTED", approvedByUsuarioId: actor.id, approvedAt: executedAt, executedAt },
    });
    if (claimed.count !== 1) throw new Error("A proposta foi alterada antes da aprovação.");

    await tx.address.updateMany({ where: { id: { in: manifest.addressIds }, personId: source.id }, data: { personId: target.id, updatedAt: executedAt } });
    await tx.document.updateMany({ where: { id: { in: manifest.documentIds }, personId: source.id }, data: { personId: target.id, updatedAt: executedAt } });
    await tx.person.update({ where: { id: source.id }, data: { status: "Arquivado por mesclagem", updatedAt: executedAt } });
    await tx.personMergeLedger.create({
      data: { requestId: request.id, eventType: "EXECUTED", sourcePersonId: source.id, targetPersonId: target.id, actorUsuarioId: actor.id, manifest },
    });
    await writeAuditEvent(tx, { actorUsuarioId: actor.id, eventType: auditEventTypes.personMergeExecuted, targetType: "PERSON_MERGE_REQUEST", targetId: request.id });
    return request.id;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function reversePersonMerge(prisma: PrismaClient, actor: MergeActor, requestId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.personMergeRequest.findUnique({ where: { id: requestId } });
    if (!request || request.status !== "EXECUTED" || !request.executedAt) throw new Error("Mesclagem não pode ser revertida.");
    const ledger = await tx.personMergeLedger.findFirst({ where: { requestId, eventType: "EXECUTED" }, orderBy: { createdAt: "desc" } });
    if (!ledger) throw new Error("Manifesto de mesclagem não encontrado.");
    const manifest = ledger.manifest as unknown as PersonMergeManifest;
    const [source, target, addresses, documents] = await Promise.all([
      tx.person.findUnique({ where: { id: manifest.sourcePersonId }, select: { id: true, status: true, updatedAt: true } }),
      tx.person.findUnique({ where: { id: manifest.targetPersonId }, select: { id: true, updatedAt: true } }),
      tx.address.findMany({ where: { id: { in: manifest.addressIds } }, select: { id: true, personId: true, updatedAt: true } }),
      tx.document.findMany({ where: { id: { in: manifest.documentIds } }, select: { id: true, personId: true, updatedAt: true, signatures: { select: { createdAt: true } }, versions: { select: { lockedAt: true } } } }),
    ]);
    if (!source || !target) throw new Error("Pessoas da mesclagem não foram encontradas.");
    if (addresses.length !== manifest.addressIds.length || documents.length !== manifest.documentIds.length) throw new Error("Não é possível reverter: itens do manifesto não foram encontrados.");
    if (documents.some((document) => document.signatures.some((signature) => signature.createdAt > request.executedAt!) || document.versions.some((version) => version.lockedAt && version.lockedAt > request.executedAt!))) {
      throw new Error("Não é possível reverter: documento transferido recebeu assinatura ou bloqueio posterior.");
    }
    assertMergeReversalAllowed(manifest, source.status, target.updatedAt, [...addresses, ...documents], source.updatedAt);

    const reversedAt = new Date();
    const changed = await tx.personMergeRequest.updateMany({ where: { id: request.id, status: "EXECUTED" }, data: { status: "REVERSED", reversedAt, reversedByUsuarioId: actor.id } });
    if (changed.count !== 1) throw new Error("A mesclagem foi alterada antes da reversão.");
    await tx.address.updateMany({ where: { id: { in: manifest.addressIds }, personId: target.id }, data: { personId: source.id } });
    await tx.document.updateMany({ where: { id: { in: manifest.documentIds }, personId: target.id }, data: { personId: source.id } });
    await tx.person.update({ where: { id: source.id }, data: { status: manifest.sourcePreviousStatus, updatedAt: reversedAt } });
    await tx.personMergeLedger.create({
      data: { requestId: request.id, eventType: "REVERSED", sourcePersonId: source.id, targetPersonId: target.id, actorUsuarioId: actor.id, manifest: { version: 1, requestId: request.id, reversedAt: reversedAt.toISOString() } },
    });
    await writeAuditEvent(tx, { actorUsuarioId: actor.id, eventType: auditEventTypes.personMergeReversed, targetType: "PERSON_MERGE_REQUEST", targetId: request.id });
    return request.id;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
