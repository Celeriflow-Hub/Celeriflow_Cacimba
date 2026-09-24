import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";

export class ProductionError extends Error {}

const periodOf = (date: Date) => date.toISOString().slice(0, 7);

export async function ensureCompetence(context: AppContext, period: string) {
  if (!/^\d{4}-\d{2}$/.test(period)) throw new ProductionError("Informe a competência no formato AAAA-MM.");
  const existing = await context.prisma.healthProductionCompetence.findUnique({ where: { period }, select: { id: true } });
  if (existing) return existing;
  return context.prisma.healthProductionCompetence.create({ data: { period, createdByUsuarioId: context.user.id }, select: { id: true } });
}

type Candidate = {
  originType: string;
  originId: string;
  patientId?: string | null;
  unitId?: string | null;
  professionalId?: string | null;
  procedureId?: string | null;
  cidReferenceId?: string | null;
  municipality?: string | null;
  state?: string | null;
  quantity: number;
  value?: number | null;
  occurredAt: Date;
};

type ClinicalContext = { cidReferenceId: string | null; municipality: string | null; state: string | null };

// CID e município/UF vêm do prontuário de origem quando determinável com
// segurança (diagnóstico principal + snapshot do agendamento). Sem origem
// clínica, mantém nulo em vez de inventar.
type ClinicalReader = Pick<Prisma.TransactionClient, "medicalRecord" | "healthRegulationRequest">;

async function clinicalContextForRecord(tx: ClinicalReader, medicalRecordId: string | null): Promise<ClinicalContext> {
  const empty = { cidReferenceId: null, municipality: null, state: null };
  if (!medicalRecordId) return empty;
  const record = await tx.medicalRecord.findUnique({
    where: { id: medicalRecordId },
    select: {
      appointment: { select: { municipalitySnapshot: true, stateSnapshot: true } },
      diagnoses: { orderBy: [{ isPrimary: "desc" }, { id: "asc" }], take: 1, select: { cidReferenceId: true } },
    },
  });
  if (!record) return empty;
  return {
    cidReferenceId: record.diagnoses[0]?.cidReferenceId || null,
    municipality: record.appointment?.municipalitySnapshot || null,
    state: record.appointment?.stateSnapshot || null,
  };
}

async function clinicalContextForRegulation(tx: ClinicalReader, requestId: string): Promise<{ medicalRecordId: string | null } & ClinicalContext> {
  const request = await tx.healthRegulationRequest.findUnique({
    where: { id: requestId },
    select: { referral: { select: { medicalRecordId: true } }, examRequest: { select: { medicalRecordId: true } } },
  });
  const medicalRecordId = request?.referral?.medicalRecordId || request?.examRequest?.medicalRecordId || null;
  return { medicalRecordId, ...(await clinicalContextForRecord(tx, medicalRecordId)) };
}

export async function captureFacts(context: AppContext, period?: string | null) {
  const candidates: Candidate[] = [];
  const inPeriod = period ? { gte: new Date(`${period}-01T00:00:00`), lt: new Date(nextMonth(period)) } : undefined;
  // PEP: procedimentos realizados (somente atendimento concluído conta como realizado)
  const performed = await context.prisma.healthPerformedProcedure.findMany({
    where: { ...(inPeriod ? { performedAt: inPeriod } : {}), medicalRecord: { completedAt: { not: null } } },
    select: { id: true, quantity: true, performedAt: true, procedureId: true, professionalId: true, medicalRecordId: true, medicalRecord: { select: { patientId: true, unitId: true, completedAt: true } }, procedure: { select: { unitValue: true } } },
    take: 2000,
  });
  for (const p of performed) {
    if (!p.medicalRecord.completedAt) continue;
    const clinical = await clinicalContextForRecord(context.prisma, p.medicalRecordId);
    candidates.push({ originType: "PEP_PROCEDURE", originId: p.id, patientId: p.medicalRecord.patientId, unitId: p.medicalRecord.unitId, professionalId: p.professionalId, procedureId: p.procedureId, ...clinical, quantity: p.quantity, value: p.procedure?.unitValue ? Number(p.procedure.unitValue) * p.quantity : null, occurredAt: p.performedAt });
  }
  // Laboratório: ordens com resultado final (fato realizado = laudo final)
  const labOrders = await context.prisma.healthLabOrder.findMany({
    where: { results: { some: { status: "FINAL", ...(inPeriod ? { enteredAt: inPeriod } : {}) } } },
    select: { id: true, patientId: true, collectionUnitId: true, collectorProfessionalId: true, examModel: { select: { procedureId: true } }, results: { where: { status: "FINAL" }, orderBy: { version: "desc" }, take: 1, select: { id: true, enteredAt: true } } },
    take: 2000,
  });
  for (const o of labOrders) {
    const r = o.results[0];
    if (!r) continue;
    if (inPeriod && (r.enteredAt < inPeriod.gte || r.enteredAt >= inPeriod.lt)) continue;
    candidates.push({ originType: "LAB_RESULT", originId: r.id, patientId: o.patientId, unitId: o.collectionUnitId, professionalId: o.collectorProfessionalId, procedureId: o.examModel?.procedureId || null, quantity: 1, occurredAt: r.enteredAt });
  }
  // Vacinação: aplicações (fato realizado por definição)
  const vaccinations = await context.prisma.vaccinationRecord.findMany({
    where: inPeriod ? { date: inPeriod } : {},
    select: { id: true, date: true, patientId: true, unitId: true, professionalId: true },
    take: 2000,
  });
  for (const v of vaccinations) {
    candidates.push({ originType: "VACCINATION", originId: v.id, patientId: v.patientId, unitId: v.unitId, professionalId: v.professionalId, procedureId: null, quantity: 1, occurredAt: v.date });
  }
  // Regulação: solicitações executadas/concluídas
  const regs = await context.prisma.healthRegulationRequest.findMany({
    where: { status: { in: ["EXECUTADA", "CONCLUIDA"] }, ...(inPeriod ? { executedAt: inPeriod } : {}) },
    select: { id: true, executedAt: true, patientId: true, requestUnitId: true, professionalId: true, procedureId: true },
    take: 2000,
  });
  for (const r of regs) {
    if (!r.executedAt) continue;
    const clinical = await clinicalContextForRegulation(context.prisma, r.id);
    candidates.push({ originType: "REGULATION", originId: r.id, patientId: r.patientId, unitId: r.requestUnitId, professionalId: r.professionalId, procedureId: r.procedureId, cidReferenceId: clinical.cidReferenceId, municipality: clinical.municipality, state: clinical.state, quantity: 1, occurredAt: r.executedAt });
  }
  const closedPeriods = new Set((await context.prisma.healthProductionCompetence.findMany({ where: { status: "FECHADA" }, select: { period: true } })).map(c => c.period));
  let created = 0;
  let blocked = 0;
  for (const c of candidates) {
    const key = `${c.originType}:${c.originId}`;
    const p = periodOf(c.occurredAt);
    if (period && p !== period) continue;
    if (closedPeriods.has(p)) { blocked += 1; continue; }
    const exists = await context.prisma.healthProductionFact.findUnique({ where: { idempotencyKey: key }, select: { id: true } });
    if (exists) continue;
    await context.prisma.healthProductionFact.create({
      data: { originType: c.originType, originId: c.originId, patientId: c.patientId || null, unitId: c.unitId || null, professionalId: c.professionalId || null, procedureId: c.procedureId || null, cidReferenceId: c.cidReferenceId || null, municipality: c.municipality || null, state: c.state || null, quantity: c.quantity, value: c.value ?? null, occurredAt: c.occurredAt, period: p, idempotencyKey: key },
    });
    created += 1;
  }
  return { candidates: candidates.length, created, blocked };
}

const manualFactSchema = z.object({
  procedureId: z.string().min(1),
  unitId: z.string().min(1),
  professionalId: z.string().min(1).nullable().optional(),
  patientId: z.string().min(1).nullable().optional(),
  quantity: z.number().int().positive().max(9999),
  value: z.number().nonnegative().nullable().optional(),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  idempotencyKey: z.string().min(1).max(120).nullable().optional(),
}).strict();

// Digitação manual (ROA/BAU/consolidado): fato avulso com trava de
// competência fechada. Retroativo permitido somente em competência aberta.
export async function captureManualFact(context: AppContext, raw: unknown) {
  const input = manualFactSchema.parse(raw);
  assertHealthUnitAccess(context.user, input.unitId);
  const procedure = await context.prisma.healthSusProcedure.findFirst({ where: { id: input.procedureId, isActive: true, isCurrent: true }, select: { id: true, unitValue: true } });
  if (!procedure) throw new ProductionError("Procedimento SUS ativo não encontrado.");
  if (!await context.prisma.healthUnit.findFirst({ where: { id: input.unitId, isActive: true }, select: { id: true } })) throw new ProductionError("Unidade ativa não encontrada.");
  const occurredAt = new Date(`${input.occurredAt}T12:00:00`);
  const p = periodOf(occurredAt);
  const competence = await context.prisma.healthProductionCompetence.findUnique({ where: { period: p }, select: { id: true, status: true } });
  if (competence?.status === "FECHADA") throw new ProductionError(`Competência ${p} fechada: digitação retroativa bloqueada.`);
  const key = `MANUAL:${input.idempotencyKey || randomUUID()}`;
  const exists = await context.prisma.healthProductionFact.findUnique({ where: { idempotencyKey: key }, select: { id: true } });
  if (exists) return exists;
  return context.prisma.healthProductionFact.create({
    data: { originType: "MANUAL", originId: key, patientId: input.patientId || null, unitId: input.unitId, professionalId: input.professionalId || null, procedureId: procedure.id, quantity: input.quantity, value: input.value ?? (procedure.unitValue != null ? Number(procedure.unitValue) * input.quantity : null), occurredAt, period: p, idempotencyKey: key },
    select: { id: true },
  });
}

export async function saveProductionTarget(context: AppContext, raw: unknown) {
  const input = z.object({ competenceId: z.string().min(1), procedureId: z.string().min(1), contractedQuantity: z.number().positive().max(999999) }).strict().parse(raw);
  const competence = await context.prisma.healthProductionCompetence.findUnique({ where: { id: input.competenceId }, select: { id: true, status: true } });
  if (!competence) throw new ProductionError("Competência não encontrada.");
  if (competence.status === "FECHADA") throw new ProductionError("Competência fechada.");
  return context.prisma.healthProductionTarget.upsert({ where: { competenceId_procedureId: { competenceId: input.competenceId, procedureId: input.procedureId } }, create: { competenceId: input.competenceId, procedureId: input.procedureId, contractedQuantity: input.contractedQuantity, createdByUsuarioId: context.user.id }, update: { contractedQuantity: input.contractedQuantity }, select: { id: true } });
}

export async function saveUnitCeiling(context: AppContext, raw: unknown) {
  const input = z.object({ unitId: z.string().min(1), period: z.string().regex(/^\d{4}-\d{2}$/), value: z.number().nonnegative().max(999999999) }).strict().parse(raw);
  assertHealthUnitAccess(context.user, input.unitId);
  return context.prisma.healthUnitCeiling.upsert({ where: { unitId_period: { unitId: input.unitId, period: input.period } }, create: { unitId: input.unitId, period: input.period, value: input.value, createdByUsuarioId: context.user.id }, update: { value: input.value }, select: { id: true } });
}

// Sincroniza campos nulos do fato com a origem (correção na origem +
// reprocesso reflete no fato). Nunca sobrescreve histórico já capturado.
async function syncFactFromOrigin(tx: Prisma.TransactionClient, fact: { id: string; originType: string; originId: string; procedureId: string | null; professionalId: string | null; unitId: string | null; patientId: string | null; cidReferenceId: string | null; municipality: string | null; state: string | null }) {
  const patch: { procedureId?: string; professionalId?: string; unitId?: string; patientId?: string; cidReferenceId?: string; municipality?: string; state?: string } = {};
  if (fact.originType === "PEP_PROCEDURE") {
    const performed = await tx.healthPerformedProcedure.findUnique({ where: { id: fact.originId }, select: { procedureId: true, professionalId: true, medicalRecord: { select: { patientId: true, unitId: true, id: true } } } });
    if (!performed) return;
    if (!fact.procedureId) patch.procedureId = performed.procedureId;
    if (!fact.professionalId) patch.professionalId = performed.professionalId;
    if (!fact.unitId) patch.unitId = performed.medicalRecord.unitId;
    if (!fact.patientId) patch.patientId = performed.medicalRecord.patientId;
    if (!fact.cidReferenceId || !fact.municipality) {
      const clinical = await clinicalContextForRecord(tx, performed.medicalRecord.id);
      if (!fact.cidReferenceId && clinical.cidReferenceId) patch.cidReferenceId = clinical.cidReferenceId;
      if (!fact.municipality && clinical.municipality) { patch.municipality = clinical.municipality; if (clinical.state) patch.state = clinical.state; }
    }
  } else if (fact.originType === "LAB_RESULT") {
    const result = await tx.healthLabResult.findUnique({ where: { id: fact.originId }, select: { order: { select: { patientId: true, collectionUnitId: true, collectorProfessionalId: true, examModel: { select: { procedureId: true } } } } } });
    if (!result) return;
    if (!fact.procedureId && result.order.examModel?.procedureId) patch.procedureId = result.order.examModel.procedureId;
    if (!fact.professionalId && result.order.collectorProfessionalId) patch.professionalId = result.order.collectorProfessionalId;
    if (!fact.unitId && result.order.collectionUnitId) patch.unitId = result.order.collectionUnitId;
    if (!fact.patientId) patch.patientId = result.order.patientId;
  } else if (fact.originType === "REGULATION") {
    const request = await tx.healthRegulationRequest.findUnique({ where: { id: fact.originId }, select: { procedureId: true, professionalId: true, requestUnitId: true, patientId: true } });
    if (!request) return;
    if (!fact.procedureId && request.procedureId) patch.procedureId = request.procedureId;
    if (!fact.professionalId && request.professionalId) patch.professionalId = request.professionalId;
    if (!fact.unitId && request.requestUnitId) patch.unitId = request.requestUnitId;
    if (!fact.patientId) patch.patientId = request.patientId;
    if (!fact.cidReferenceId || !fact.municipality) {
      const clinical = await clinicalContextForRegulation(tx, fact.originId);
      if (!fact.cidReferenceId && clinical.cidReferenceId) patch.cidReferenceId = clinical.cidReferenceId;
      if (!fact.municipality && clinical.municipality) { patch.municipality = clinical.municipality; if (clinical.state) patch.state = clinical.state; }
    }
  } else {
    return;
  }
  if (Object.keys(patch).length) await tx.healthProductionFact.update({ where: { id: fact.id }, data: patch });
}

function nextMonth(period: string) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return d.toISOString().slice(0, 10);
}

export async function processCompetence(context: AppContext, competenceId: string) {
  const competence = await context.prisma.healthProductionCompetence.findUnique({ where: { id: competenceId }, select: { id: true, period: true, status: true } });
  if (!competence) throw new ProductionError("Competência não encontrada.");
  if (competence.status === "FECHADA") throw new ProductionError("Competência fechada. Reabra antes de reprocessar.");
  return context.prisma.$transaction(async tx => {
    const facts = await tx.healthProductionFact.findMany({ where: { period: competence.period }, select: { id: true, originType: true, originId: true, unitId: true, professionalId: true, procedureId: true, patientId: true, cidReferenceId: true, municipality: true, state: true, quantity: true } });
    for (const f of facts) {
      if (f.unitId) assertHealthUnitAccess(context.user, f.unitId);
      await syncFactFromOrigin(tx, f);
      const fresh = await tx.healthProductionFact.findUnique({ where: { id: f.id }, select: { unitId: true, professionalId: true, procedureId: true, quantity: true, occurredAt: true } });
      if (!fresh) continue;
      if (fresh.unitId) assertHealthUnitAccess(context.user, fresh.unitId);
      await tx.healthProductionFact.update({ where: { id: f.id }, data: { competenceId: competence.id } });
      await tx.healthProductionCriticism.deleteMany({ where: { factId: f.id, status: "ABERTA" } });
      const issues: Array<{ code: string; message: string; actionNeeded: string }> = [];
      // Vacinação (SI-PNI) e fichas e-SUS alimentam outros sistemas: não exigem procedimento BPA.
      if (!fresh.procedureId && ["PEP_PROCEDURE", "LAB_RESULT", "REGULATION"].includes(f.originType)) issues.push({ code: "SEM_PROCEDIMENTO", message: "Fato sem procedimento SUS vinculado.", actionNeeded: "Vincular procedimento SIGTAP na origem e reprocessar." });
      if (!fresh.professionalId) issues.push({ code: "SEM_PROFISSIONAL", message: "Fato sem profissional responsável.", actionNeeded: "Identificar o profissional executor na origem e reprocessar." });
      if (!fresh.unitId) issues.push({ code: "SEM_UNIDADE", message: "Fato sem unidade de realização.", actionNeeded: "Informar a unidade de realização na origem e reprocessar." });
      if (!Number.isInteger(fresh.quantity) || fresh.quantity <= 0) issues.push({ code: "QUANTIDADE_INVALIDA", message: "Quantidade inválida.", actionNeeded: "Corrigir a quantidade na origem e reprocessar." });
      // Consistências SUS a partir dos vínculos do procedimento (CBO, CID, idade, sexo).
      if (fresh.procedureId) {
        const [procedure, professional, patient] = await Promise.all([
          tx.healthSusProcedure.findUnique({ where: { id: fresh.procedureId }, select: { minimumAge: true, maximumAge: true, allowedSex: true, referenceLinks: { select: { relationType: true, reference: { select: { code: true } } } } } }),
          fresh.professionalId ? tx.healthProfessional.findUnique({ where: { id: fresh.professionalId }, select: { cbo: true } }) : null,
          f.patientId ? tx.patient.findUnique({ where: { id: f.patientId }, select: { person: { select: { gender: true, birthDate: true } } } }) : null,
        ]);
        if (procedure) {
          const cbos = procedure.referenceLinks.filter(l => l.relationType === "CBO").map(l => l.reference.code);
          if (cbos.length && professional?.cbo && !cbos.includes(professional.cbo)) issues.push({ code: "CBO_INCOMPATIVEL", message: `CBO ${professional.cbo} incompatível com o procedimento.`, actionNeeded: "Verificar o executor ou o vínculo CBO do procedimento." });
          const cids = procedure.referenceLinks.filter(l => l.relationType === "CID").map(l => l.reference.code);
          const factCid = f.cidReferenceId ? await tx.healthSusReference.findUnique({ where: { id: f.cidReferenceId }, select: { code: true } }) : null;
          if (cids.length && factCid && !cids.includes(factCid.code)) issues.push({ code: "CID_INCOMPATIVEL", message: `CID ${factCid.code} incompatível com o procedimento.`, actionNeeded: "Revisar o diagnóstico ou o vínculo CID do procedimento." });
          const birth = patient?.person.birthDate;
          if (birth && (procedure.minimumAge !== null || procedure.maximumAge !== null)) {
            let age = fresh.occurredAt.getFullYear() - birth.getFullYear();
            const m = fresh.occurredAt.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && fresh.occurredAt.getDate() < birth.getDate())) age -= 1;
            if ((procedure.minimumAge !== null && age < procedure.minimumAge) || (procedure.maximumAge !== null && age > procedure.maximumAge)) issues.push({ code: "IDADE_INCOMPATIVEL", message: `Idade ${age} fora da faixa do procedimento.`, actionNeeded: "Verificar a indicação ou a faixa etária do procedimento." });
          }
          const sex = patient?.person.gender;
          if (procedure.allowedSex && sex && !procedure.allowedSex.toLocaleLowerCase("pt-BR").includes(sex.toLocaleLowerCase("pt-BR").slice(0, 1)) && procedure.allowedSex.trim().length <= 3) issues.push({ code: "SEXO_INCOMPATIVEL", message: "Sexo incompatível com o procedimento.", actionNeeded: "Verificar a indicação ou o sexo permitido do procedimento." });
        }
      }
      for (const issue of issues) {
        await tx.healthProductionCriticism.create({ data: { factId: f.id, code: issue.code, message: issue.message, actionNeeded: issue.actionNeeded } });
      }
      await tx.healthProductionFact.update({ where: { id: f.id }, data: { status: issues.length ? "CRITICADO" : "VALIDO" } });
    }
    return tx.healthProductionCompetence.update({ where: { id: competence.id }, data: { status: "PROCESSADA", processedAt: new Date() }, select: { id: true, status: true } });
  });
}

export async function closeCompetence(context: AppContext, competenceId: string) {
  const competence = await context.prisma.healthProductionCompetence.findUnique({ where: { id: competenceId }, select: { id: true, period: true, status: true } });
  if (!competence) throw new ProductionError("Competência não encontrada.");
  const open = await context.prisma.healthProductionCriticism.count({ where: { status: "ABERTA", fact: { competenceId } } });
  if (open > 0) throw new ProductionError(`Há ${open} crítica(s) aberta(s). Resolva na origem e reprocesse antes de fechar.`);
  return context.prisma.healthProductionCompetence.update({ where: { id: competenceId }, data: { status: "FECHADA", closedAt: new Date() }, select: { id: true, status: true } });
}

export async function reopenCompetence(context: AppContext, competenceId: string) {
  const competence = await context.prisma.healthProductionCompetence.findUnique({ where: { id: competenceId }, select: { id: true, status: true } });
  if (!competence) throw new ProductionError("Competência não encontrada.");
  if (competence.status !== "FECHADA") throw new ProductionError("Somente competências fechadas podem ser reabertas.");
  return context.prisma.healthProductionCompetence.update({ where: { id: competenceId }, data: { status: "ABERTA", closedAt: null }, select: { id: true, status: true } });
}

export async function resolveCriticism(context: AppContext, criticismId: string) {
  const criticism = await context.prisma.healthProductionCriticism.findUnique({ where: { id: criticismId }, include: { fact: { select: { id: true, unitId: true } } } });
  if (!criticism) throw new ProductionError("Crítica não encontrada.");
  if (criticism.fact.unitId) assertHealthUnitAccess(context.user, criticism.fact.unitId);
  await context.prisma.healthProductionCriticism.update({ where: { id: criticismId }, data: { status: "RESOLVIDA", resolvedAt: new Date() } });
  const remaining = await context.prisma.healthProductionCriticism.count({ where: { factId: criticism.factId, status: "ABERTA" } });
  if (remaining === 0) await context.prisma.healthProductionFact.update({ where: { id: criticism.factId }, data: { status: "VALIDO" } });
  return { id: criticismId };
}

export async function generateSusFile(context: AppContext, input: { competenceId: string; fileType: string; unitId?: string | null; financing?: string | null }) {
  const type = input.fileType.toUpperCase();
  if (!["BPA", "FPO", "RAAS", "AIH", "OUTRO"].includes(type)) throw new ProductionError("Tipo de arquivo inválido.");
  const competence = await context.prisma.healthProductionCompetence.findUnique({ where: { id: input.competenceId }, select: { id: true, period: true } });
  if (!competence) throw new ProductionError("Competência não encontrada.");
  if (input.unitId) assertHealthUnitAccess(context.user, input.unitId);
  // Arquivos tipo BPA/RAAS/AIH/FPO consolidam apenas fatos com procedimento SUS.
  const facts = await context.prisma.healthProductionFact.findMany({
    where: { competenceId: competence.id, status: "VALIDO", procedureId: { not: null }, ...(input.unitId ? { unitId: input.unitId } : {}), ...(input.financing ? { procedure: { financing: input.financing } } : {}) },
    include: { procedure: { select: { code: true, financing: true } }, unit: { select: { cnes: true, name: true } }, professional: { select: { cns: true } }, patient: { select: { cns: true } } },
    orderBy: { occurredAt: "asc" },
  });
  if (facts.length === 0) throw new ProductionError("Não há fatos válidos para gerar o arquivo.");
  const institution = await context.prisma.institution.findFirst({ orderBy: { createdAt: "asc" }, select: { name: true, cnpj: true } });
  const targets = type === "FPO" ? await context.prisma.healthProductionTarget.findMany({ where: { competenceId: competence.id }, select: { procedureId: true, contractedQuantity: true } }) : [];
  const targetOf = new Map(targets.map(t => [t.procedureId, t.contractedQuantity]));
  const lines = facts.map(f => [
    type,
    competence.period.replace("-", ""),
    f.unit?.cnes || f.unit?.name || "",
    f.procedure?.code || "",
    f.professional?.cns || "",
    f.occurredAt.toISOString().slice(0, 10),
    String(f.quantity),
    f.value != null ? Number(f.value).toFixed(2) : "",
    type === "FPO" && f.procedureId ? `META:${targetOf.get(f.procedureId) ?? 0}` : `${f.originType}:${f.originId}`,
  ].join("|"));
  const header = `#${type}|COMPETENCIA:${competence.period}|QTDE:${facts.length}|ESTABELECIMENTO:${institution?.name || ""}|CNPJ:${institution?.cnpj || ""}${input.financing ? `|FINANCIAMENTO:${input.financing}` : ""}|GERADO_EM:${new Date().toISOString()}`;
  const content = [header, ...lines].join("\n");
  const hash = createHash("sha256").update(content).digest("hex");
  const totalValue = facts.reduce((sum, f) => sum + (f.value != null ? Number(f.value) : 0), 0);
  return context.prisma.healthSusFile.create({
    data: { fileType: type, competenceId: competence.id, unitId: input.unitId || null, content, hash, quantity: facts.length, totalValue: totalValue || null, createdByUsuarioId: context.user.id },
    select: { id: true, hash: true, quantity: true },
  });
}

// Importação de arquivo no leiaute local (consistência de BPA recebido):
// cada linha válida vira fato MANUAL idempotente para processamento normal.
export async function importProductionFile(context: AppContext, content: string) {
  const fileHash = createHash("sha256").update(content).digest("hex");
  const lines = content.split("\n").map(line => line.trim()).filter(line => line && !line.startsWith("#"));
  if (!lines.length) throw new ProductionError("O arquivo não contém linhas de produção.");
  let created = 0;
  const errors: Array<{ line: number; reason: string }> = [];
  for (const [index, line] of lines.entries()) {
    const parts = line.split("|");
    const [, competenceRaw, unitRef, procedureCode, , dateRaw, qtyRaw] = parts;
    const period = /^\d{6}$/.test(competenceRaw || "") ? `${competenceRaw.slice(0, 4)}-${competenceRaw.slice(4)}` : null;
    const quantity = Number(qtyRaw);
    if (!period || !unitRef || !procedureCode || !dateRaw || Number.isNaN(Date.parse(dateRaw)) || !Number.isInteger(quantity) || quantity <= 0) {
      errors.push({ line: index + 1, reason: "Linha fora do leiaute esperado." });
      continue;
    }
    const [unit, procedure] = await Promise.all([
      context.prisma.healthUnit.findFirst({ where: { OR: [{ cnes: unitRef }, { name: unitRef }], isActive: true }, select: { id: true } }),
      context.prisma.healthSusProcedure.findFirst({ where: { code: procedureCode, isActive: true, isCurrent: true }, select: { id: true, unitValue: true } }),
    ]);
    if (!unit || !procedure) {
      errors.push({ line: index + 1, reason: "Unidade ou procedimento não localizado na base." });
      continue;
    }
    if (unit) assertHealthUnitAccess(context.user, unit.id);
    const key = `BPA:${fileHash.slice(0, 12)}:${index + 1}`;
    if (await context.prisma.healthProductionFact.findUnique({ where: { idempotencyKey: key }, select: { id: true } })) continue;
    const competence = await context.prisma.healthProductionCompetence.findUnique({ where: { period }, select: { status: true } });
    if (competence?.status === "FECHADA") {
      errors.push({ line: index + 1, reason: `Competência ${period} fechada.` });
      continue;
    }
    await context.prisma.healthProductionFact.create({
      data: { originType: "MANUAL", originId: key, unitId: unit.id, procedureId: procedure.id, quantity, value: procedure.unitValue != null ? Number(procedure.unitValue) * quantity : null, occurredAt: new Date(dateRaw), period, idempotencyKey: key },
    });
    created += 1;
  }
  return { created, rejected: errors.length, errors };
}

// Adaptador/validador controlado: valida estrutura real do arquivo gerado e
// devolve aceites/rejeições por linha. Troca futura de endpoint/credenciais
// ocorre na camada de integração sem alterar o arquivo.
export async function processSusFile(context: AppContext, fileId: string) {
  const file = await context.prisma.healthSusFile.findUnique({ where: { id: fileId }, select: { id: true, fileType: true, content: true, competenceId: true } });
  if (!file) throw new ProductionError("Arquivo não encontrado.");
  const lines = file.content.split("\n").slice(1).filter(Boolean);
  const errors: Array<{ line: number; reason: string }> = [];
  let accepted = 0;
  lines.forEach((line, index) => {
    const parts = line.split("|");
    const [, competence, unit, procedure, , date, qty] = parts;
    if (!competence || !/^\d{6}$/.test(competence)) errors.push({ line: index + 1, reason: "Competência inválida na linha." });
    else if (!unit) errors.push({ line: index + 1, reason: "Unidade não identificada na linha." });
    else if (!procedure) errors.push({ line: index + 1, reason: "Procedimento SUS ausente na linha." });
    else if (!date || Number.isNaN(Date.parse(date))) errors.push({ line: index + 1, reason: "Data inválida na linha." });
    else if (!qty || Number(qty) <= 0) errors.push({ line: index + 1, reason: "Quantidade inválida na linha." });
    else accepted += 1;
  });
  const rejected = errors.length;
  const status = rejected === 0 ? "PROCESSADO" : accepted === 0 ? "REJEITADO" : "PARCIAL";
  return context.prisma.healthSusFile.update({
    where: { id: fileId },
    data: { status, processedCount: accepted, rejectedCount: rejected, errors, processedAt: new Date() },
    select: { id: true, status: true, processedCount: true, rejectedCount: true },
  });
}

export type { Prisma };
