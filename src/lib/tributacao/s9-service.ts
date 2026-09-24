import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { concessionSituation, executionNext, formatCdaNumber, graveHasVacancy, internalProtocol, nextCdaVersion, occupancyStats, protestNext, sumBy, trendByMonth, validateEnrollmentEligibility, TributarioS9Error } from "./s9-engine";
import { confirmTaxPayment, createTaxAssessment, enrollAssessmentInActiveDebt, generateTaxGuide } from "./index";

type Actor = { usuarioId: string; employeeId?: string | null };
const fullActor = (actor: Actor) => ({ usuarioId: actor.usuarioId, employeeId: actor.employeeId ?? null });
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const money = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(String(value)).toDecimalPlaces(2);
const code = (prefix: string) => `${prefix}-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

async function nextSequence(tx: Prisma.TransactionClient, year: number, documentType: string) {
  const sequence = await tx.taxDocumentSequence.upsert({
    where: { year_documentType: { year, documentType } },
    create: { year, documentType, currentValue: 1 },
    update: { currentValue: { increment: 1 } },
  });
  return sequence.currentValue;
}

async function debtEvent(tx: Prisma.TransactionClient, actor: Actor, activeDebtId: string, eventType: string, description: string, payload?: unknown) {
  return tx.taxActiveDebtEvent.create({ data: { activeDebtId, eventType, description, payload: payload === undefined ? undefined : json(payload), actorUsuarioId: actor.usuarioId } });
}

function taxpayerName(taxpayer: { person?: { fullName?: string | null; cpf?: string | null } | null; company?: { corporateName?: string | null; cnpj?: string | null } | null } | null) {
  return taxpayer?.company?.corporateName ?? taxpayer?.person?.fullName ?? "Contribuinte";
}

function taxpayerDocument(taxpayer: { person?: { cpf?: string | null } | null; company?: { cnpj?: string | null } | null } | null) {
  return taxpayer?.company?.cnpj ?? taxpayer?.person?.cpf ?? "-";
}

// Defaults demonstrativos controlados: tributo de sepultamento, estrutura mínima de cemitério, causas e funerária.
export async function ensureS9Defaults(db: PrismaClient, actor: Actor) {
  const tax = await db.tax.upsert({ where: { id: "tax-sepultamento-s9" }, update: {}, create: { id: "tax-sepultamento-s9", name: "Taxa de Sepultamento", taxType: "Taxa", isActive: true } });
  const cemetery = await db.taxCemetery.upsert({ where: { code: "CEM-MUNICIPAL" }, update: {}, create: { code: "CEM-MUNICIPAL", name: "Cemitério Municipal São Lourenço", address: "Alto do Cemitério, Divino de São Lourenço/ES", wakePlace: "Capela municipal" } });
  const sector = await db.taxCemeterySector.upsert({ where: { cemeteryId_code: { cemeteryId: cemetery.id, code: "QUADRA-A" } }, update: {}, create: { cemeteryId: cemetery.id, code: "QUADRA-A", name: "Quadra A" } });
  for (const [code, description] of [["NATURAL", "Causa natural"], ["ACIDENTE", "Acidente"], ["VIOLENTA", "Causa violenta"], ["INFANTIL", "Óbito infantil"], ["FETAL", "Óbito fetal"], ["IGNORADA", "Causa ignorada"]] as [string, string][]) {
    await db.taxDeathCause.upsert({ where: { code }, update: {}, create: { code, description } });
  }
  await db.taxFuneralHome.upsert({ where: { id: "funeraria-s9" }, update: {}, create: { id: "funeraria-s9", name: "Funerária Paz Eterna", phone: "(27) 90000-0000" } });
  await db.taxCemeteryEmployee.upsert({ where: { id: "coveiro-s9" }, update: {}, create: { id: "coveiro-s9", cemeteryId: cemetery.id, name: "Zelador do cemitério", role: "Coveiro" } });
  return { tax, cemetery, sector };
}

// S9-A — Débitos elegíveis com validação prévia (TRI-340/341). Reutiliza lançamentos e dívida existentes.
export async function listEnrollmentCandidates(db: PrismaClient) {
  const assessments = await db.taxAssessment.findMany({
    where: { status: { in: ["Lançado", "Emitido", "Parcial"] } },
    include: { tax: { select: { name: true } }, activeDebt: { select: { id: true } }, taxpayer: { include: { person: { include: { addresses: true } }, company: { include: { addresses: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return assessments.map((row) => {
    const taxpayer = row.taxpayer;
    const addresses = [...(taxpayer.person?.addresses ?? []), ...(taxpayer.company?.addresses ?? [])];
    const check = validateEnrollmentEligibility({
      taxpayerActive: taxpayer.status === "Ativo",
      hasIdentification: Boolean(taxpayer.person || taxpayer.company),
      hasAddress: addresses.length > 0,
      debtStatus: row.status,
      debtValue: row.finalValueDecimal ?? row.originalValueDecimal ?? row.originalValue,
      alreadyEnrolled: Boolean(row.activeDebt),
      suspended: false,
    });
    return { id: row.id, number: row.assessmentNumber ?? row.id, taxpayerId: row.taxpayerId, taxpayer: taxpayerName(taxpayer), origin: row.tax.name, year: row.year, value: Number(row.finalValueDecimal ?? row.originalValueDecimal ?? row.originalValue), status: row.status, eligible: check.eligible, reasons: check.reasons, enrolledDebtId: row.activeDebt?.id ?? null };
  });
}

// Inscrição a partir de lançamento: reaproveita o motor existente, que devolve a dívida atual sem duplicar.
export async function enrollAssessmentDebt(db: PrismaClient, actor: Actor, assessmentId: string) {
  const debt = await enrollAssessmentInActiveDebt(db, fullActor(actor), assessmentId);
  await db.$transaction(async (tx) => {
    await debtEvent(tx, actor, debt.id, "INSCRICAO", `Débito inscrito em dívida ativa a partir do lançamento ${assessmentId}.`, { assessmentId });
  });
  return debt;
}

// Inscrição manual/arquivo com chave de origem idempotente: mesma origem nunca cria segunda dívida.
export async function enrollManualDebt(db: PrismaClient, actor: Actor, input: { taxpayerId: string; originDebtType: string; year: number; value: number; sourceKey: string; competence?: Date }) {
  if (!input.sourceKey.trim()) throw new TributarioS9Error("A chave de origem é obrigatória para inscrição manual/arquivo.");
  const key = input.sourceKey.trim();
  const existing = await db.activeDebt.findUnique({ where: { sourceKey: key } });
  if (existing) return { debt: existing, created: false as const };
  const taxpayer = await db.taxpayer.findUnique({ where: { id: input.taxpayerId } });
  if (!taxpayer || taxpayer.status !== "Ativo") throw new TributarioS9Error("Contribuinte ativo é obrigatório.");
  const value = money(input.value);
  if (value.lessThanOrEqualTo(0)) throw new TributarioS9Error("Valor do débito inválido.");
  const debt = await db.$transaction(async (tx) => {
    const created = await tx.activeDebt.create({ data: { taxpayerId: taxpayer.id, originDebtType: input.originDebtType.trim() || "Débito manual", year: input.year, originalValue: Number(value), originalValueDecimal: value, updatedValue: Number(value), updatedValueDecimal: value, sourceKey: key, status: "PENDENTE_DE_VALIDACAO" } });
    await debtEvent(tx, actor, created.id, "INSCRICAO", `Inscrição manual/arquivo registrada com chave ${key}.`, { sourceKey: key, competence: input.competence ?? null });
    return created;
  });
  return { debt, created: true as const };
}

export async function validateDebt(db: PrismaClient, actor: Actor, debtId: string) {
  return db.$transaction(async (tx) => {
    const debt = await tx.activeDebt.findUnique({ where: { id: debtId }, include: { taxpayer: { include: { person: { include: { addresses: true } }, company: { include: { addresses: true } } } } } });
    if (!debt) throw new TributarioS9Error("Dívida não encontrada.");
    const addresses = [...(debt.taxpayer.person?.addresses ?? []), ...(debt.taxpayer.company?.addresses ?? [])];
    const suspensions = await tx.taxDebtSuspension.findMany({ where: { activeDebtId: debt.id, status: "VIGENTE" }, select: { id: true } });
    const check = validateEnrollmentEligibility({
      taxpayerActive: debt.taxpayer.status === "Ativo",
      hasIdentification: Boolean(debt.taxpayer.person || debt.taxpayer.company),
      hasAddress: addresses.length > 0,
      debtStatus: debt.status === "PENDENTE_DE_VALIDACAO" ? "Lançado" : debt.status,
      debtValue: debt.updatedValueDecimal ?? debt.updatedValue,
      alreadyEnrolled: false,
      suspended: suspensions.length > 0,
    });
    if (!check.eligible) throw new TributarioS9Error(`Validação reprovada: ${check.reasons.join(" ")}`);
    const updated = await tx.activeDebt.update({ where: { id: debt.id }, data: { status: "VALIDADA" } });
    await debtEvent(tx, actor, debt.id, "VALIDACAO", "Débito validado para inscrição com cadastro suficiente.", { reasons: [] });
    return updated;
  });
}

function cdaSnapshot(debt: { id: string; originDebtType: string; year: number; originalValueDecimal: unknown; updatedValueDecimal: unknown; taxpayerId: string }, taxpayer: { name: string; document: string }, cdaNumber: string, version: number) {
  return json({ cdaNumber, version, debtId: debt.id, origin: debt.originDebtType, year: debt.year, originalValue: String(debt.originalValueDecimal), updatedValue: String(debt.updatedValueDecimal), taxpayerId: debt.taxpayerId, taxpayer, scope: "CERTIDAO_DIVIDA_ATIVA" });
}

// Emissão da CDA com numeração sequencial e primeira versão (TRI-347/349).
export async function issueCda(db: PrismaClient, actor: Actor, debtId: string) {
  return db.$transaction(async (tx) => {
    const debt = await tx.activeDebt.findUnique({ where: { id: debtId }, include: { taxpayer: { include: { person: true, company: true } } } });
    if (!debt) throw new TributarioS9Error("Dívida não encontrada.");
    if (!["VALIDADA", "PENDENTE_DE_VALIDACAO", "INSCRITA"].includes(debt.status)) throw new TributarioS9Error("Dívida fora do estágio de emissão de CDA.");
    if (debt.cdaNumber) return debt;
    const sequence = await nextSequence(tx, debt.year, "CDA");
    const cdaNumber = formatCdaNumber(debt.year, sequence);
    const taxpayer = { name: taxpayerName(debt.taxpayer), document: taxpayerDocument(debt.taxpayer) };
    const updated = await tx.activeDebt.update({ where: { id: debt.id }, data: { cdaNumber, status: "INSCRITA" } });
    await tx.taxCdaVersion.create({ data: { activeDebtId: debt.id, versionNumber: 1, cdaNumber, contentSnapshot: cdaSnapshot(debt, taxpayer, cdaNumber, 1) } });
    await debtEvent(tx, actor, debt.id, "CDA_EMITIDA", `CDA ${cdaNumber} emitida (versão 1).`, { cdaNumber });
    return updated;
  });
}

export async function annotateCda(db: PrismaClient, actor: Actor, input: { debtId: string; annotation: string }) {
  if (!input.annotation.trim()) throw new TributarioS9Error("Informe a anotação da CDA.");
  return db.$transaction(async (tx) => {
    const latest = await tx.taxCdaVersion.findFirst({ where: { activeDebtId: input.debtId }, orderBy: { versionNumber: "desc" } });
    if (!latest) throw new TributarioS9Error("Emita a CDA antes de anotar.");
    const updated = await tx.taxCdaVersion.update({ where: { id: latest.id }, data: { annotation: input.annotation.trim() } });
    await debtEvent(tx, actor, input.debtId, "CDA_ANOTADA", input.annotation.trim(), { version: latest.versionNumber });
    return updated;
  });
}

// Versionamento: nova versão preserva o conteúdo anterior (TRI-348/383).
export async function createCdaVersion(db: PrismaClient, actor: Actor, debtId: string) {
  return db.$transaction(async (tx) => {
    const debt = await tx.activeDebt.findUnique({ where: { id: debtId }, include: { taxpayer: { include: { person: true, company: true } } } });
    if (!debt?.cdaNumber) throw new TributarioS9Error("Emita a CDA antes de versionar.");
    const count = await tx.taxCdaVersion.count({ where: { activeDebtId: debt.id } });
    const version = nextCdaVersion(count);
    const taxpayer = { name: taxpayerName(debt.taxpayer), document: taxpayerDocument(debt.taxpayer) };
    const created = await tx.taxCdaVersion.create({ data: { activeDebtId: debt.id, versionNumber: version, cdaNumber: debt.cdaNumber, contentSnapshot: cdaSnapshot(debt, taxpayer, debt.cdaNumber, version) } });
    await debtEvent(tx, actor, debt.id, "CDA_VERSIONADA", `CDA versionada para a versão ${version} sem reutilizar numeração.`, { version });
    return created;
  });
}

// Assinatura registrada como interna: sem ICP-Brasil configurado, sem presunção oficial (TRI-384/385).
export async function signCdaInternal(db: PrismaClient, actor: Actor, versionId: string) {
  const version = await db.taxCdaVersion.findUnique({ where: { id: versionId } });
  if (!version) throw new TributarioS9Error("Versão de CDA não encontrada.");
  if (version.signatureStatus !== "NAO_ASSINADA") return version;
  return db.$transaction(async (tx) => {
    const updated = await tx.taxCdaVersion.update({ where: { id: version.id }, data: { signatureStatus: "ASSINATURA_INTERNA", signedByUsuarioId: actor.usuarioId, signedAt: new Date() } });
    await debtEvent(tx, actor, version.activeDebtId, "OBSERVACAO", "CDA assinada internamente; certificação ICP-Brasil não configurada.", { version: version.versionNumber });
    return updated;
  });
}

// Carteiras de dívida ativa com atualização (TRI-342/343).
export async function createDaPortfolio(db: PrismaClient, actor: Actor, input: { name: string; minValue?: number; statuses?: string[] }) {
  const debts = await db.activeDebt.findMany({ where: { status: { in: input.statuses?.length ? input.statuses : ["INSCRITA", "VALIDADA", "EM_COBRANCA"] } }, orderBy: { createdAt: "asc" }, take: 300 });
  const eligible = debts.filter((row) => Number(row.updatedValueDecimal ?? row.updatedValue) >= (input.minValue ?? 0));
  if (!eligible.length) throw new TributarioS9Error("Nenhuma dívida elegível para a carteira.");
  return db.taxDaPortfolio.create({
    data: { name: input.name.trim() || "Carteira de dívida ativa", criteria: json({ minValue: input.minValue ?? 0, statuses: input.statuses ?? [], createdAt: new Date() }), createdByUsuarioId: actor.usuarioId, items: { create: eligible.map((row) => ({ activeDebtId: row.id, outstandingDecimal: row.updatedValueDecimal ?? row.updatedValue })) } },
    include: { items: true },
  });
}

export async function refreshDaPortfolio(db: PrismaClient, portfolioId: string) {
  const items = await db.taxDaPortfolioItem.findMany({ where: { portfolioId } });
  return db.$transaction(async (tx) => {
    for (const item of items) {
      const debt = await tx.activeDebt.findUnique({ where: { id: item.activeDebtId }, select: { updatedValueDecimal: true, updatedValue: true, status: true } });
      if (!debt) { await tx.taxDaPortfolioItem.delete({ where: { id: item.id } }); continue; }
      if (["PAGA", "CANCELADA", "BAIXADA", "BAIXADA_PRESCRICAO", "DEVOLVIDA"].includes(debt.status)) { await tx.taxDaPortfolioItem.delete({ where: { id: item.id } }); continue; }
      await tx.taxDaPortfolioItem.update({ where: { id: item.id }, data: { outstandingDecimal: debt.updatedValueDecimal ?? debt.updatedValue } });
    }
    return tx.taxDaPortfolioItem.count({ where: { portfolioId } });
  });
}

// DAM da dívida inscrita pelo motor de guias (TRI-353/354).
export async function issueDaGuide(db: PrismaClient, actor: Actor, input: { debtId: string; dueDate: Date }) {
  const debt = await db.activeDebt.findUnique({ where: { id: input.debtId } });
  if (!debt?.cdaNumber) throw new TributarioS9Error("Emita a CDA antes da guia.");
  if (debt.assessmentId) return generateTaxGuide(db, fullActor(actor), { assessmentId: debt.assessmentId, dueDate: input.dueDate });
  const tax = await db.tax.findFirst({ where: { name: debt.originDebtType, isActive: true } });
  if (!tax) throw new TributarioS9Error(`Cadastre o tributo "${debt.originDebtType}" para gerar a guia pelo motor.`);
  const value = money(debt.updatedValueDecimal ?? debt.updatedValue);
  const assessment = await createTaxAssessment(db, fullActor(actor), { year: debt.year, taxId: tax.id, taxpayerId: debt.taxpayerId, taxableBase: value, rate: 100, competence: new Date(Date.UTC(debt.year, 0, 1, 12)) });
  await db.activeDebt.update({ where: { id: debt.id }, data: { assessmentId: assessment.id } });
  await debtEvent(db as unknown as Prisma.TransactionClient, actor, debt.id, "GUIA_EMITIDA", "Lançamento de origem regularizado pelo motor para emissão da DAM.", { assessmentId: assessment.id });
  return generateTaxGuide(db, fullActor(actor), { assessmentId: assessment.id, dueDate: input.dueDate });
}

export async function suspendDebt(db: PrismaClient, actor: Actor, input: { debtId: string; reason: string; legalGround?: string; endsAt?: Date }) {
  if (!input.reason.trim()) throw new TributarioS9Error("Informe o motivo da suspensão.");
  return db.$transaction(async (tx) => {
    const suspension = await tx.taxDebtSuspension.create({ data: { activeDebtId: input.debtId, reason: input.reason.trim(), legalGround: input.legalGround?.trim() || null, endsAt: input.endsAt || null, createdByUsuarioId: actor.usuarioId } });
    await tx.activeDebt.update({ where: { id: input.debtId }, data: { status: "SUSPENSA" } });
    await debtEvent(tx, actor, input.debtId, "SUSPENSAO", input.reason.trim(), { suspensionId: suspension.id });
    return suspension;
  });
}

export async function resumeDebt(db: PrismaClient, actor: Actor, debtId: string) {
  return db.$transaction(async (tx) => {
    await tx.taxDebtSuspension.updateMany({ where: { activeDebtId: debtId, status: "VIGENTE" }, data: { status: "ENCERRADA" } });
    const updated = await tx.activeDebt.update({ where: { id: debtId }, data: { status: "INSCRITA" } });
    await debtEvent(tx, actor, debtId, "SUSPENSAO_ENCERRADA", "Suspensão encerrada; cobrança retomada.");
    return updated;
  });
}

// Devolução ao órgão de origem sem apagar o histórico (TRI-359).
export async function returnDebtToOrigin(db: PrismaClient, actor: Actor, input: { debtId: string; reason: string }) {
  if (!input.reason.trim()) throw new TributarioS9Error("Informe o motivo da devolução.");
  return db.$transaction(async (tx) => {
    const updated = await tx.activeDebt.update({ where: { id: input.debtId }, data: { status: "DEVOLVIDA" } });
    await debtEvent(tx, actor, input.debtId, "DEVOLUCAO_ORIGEM", input.reason.trim(), {});
    return updated;
  });
}

// Pagamento da dívida inscrita pela guia confirmada no motor (TRI-360).
export async function settleDebtByGuide(db: PrismaClient, actor: Actor, input: { debtId: string; guideId: string; amount: number; paymentMethod: string; idempotencyKey: string }) {
  const debt = await db.activeDebt.findUnique({ where: { id: input.debtId } });
  if (!debt) throw new TributarioS9Error("Dívida não encontrada.");
  const guide = await confirmTaxPayment(db, fullActor(actor), { guideId: input.guideId, amountPaid: input.amount, paymentDate: new Date(), paymentMethod: input.paymentMethod, idempotencyKey: input.idempotencyKey });
  return db.$transaction(async (tx) => {
    const paid = guide.status === "Paga";
    const updated = await tx.activeDebt.update({ where: { id: debt.id }, data: paid ? { status: "PAGA", updatedValue: 0, updatedValueDecimal: new Prisma.Decimal(0) } : { status: "EM_COBRANCA" } });
    if (debt.assessmentId) await tx.taxAssessment.update({ where: { id: debt.assessmentId }, data: { status: paid ? "Pago" : "Parcial" } });
    await debtEvent(tx, actor, debt.id, "PAGAMENTO", `Baixa de R$ ${money(input.amount).toFixed(2)} pela guia ${guide.guideNumber ?? guide.id}.`, { guideId: guide.id });
    return updated;
  });
}

// Baixa manual justificada (TRI-361) e automática por prescrição (TRI-362).
export async function writeOffDebt(db: PrismaClient, actor: Actor, input: { debtId: string; reason: string }) {
  if (!input.reason.trim()) throw new TributarioS9Error("A baixa manual exige justificativa.");
  return db.$transaction(async (tx) => {
    const updated = await tx.activeDebt.update({ where: { id: input.debtId }, data: { status: "BAIXADA" } });
    await debtEvent(tx, actor, input.debtId, "BAIXA_MANUAL", input.reason.trim(), {});
    return updated;
  });
}

export async function runPrescription(db: PrismaClient, actor: Actor, years = 5) {
  if (!Number.isInteger(years) || years < 1) throw new TributarioS9Error("Prazo prescricional inválido.");
  const limit = new Date();
  limit.setUTCFullYear(limit.getUTCFullYear() - years);
  const debts = await db.activeDebt.findMany({ where: { status: { in: ["INSCRITA", "VALIDADA", "EM_COBRANCA"] }, createdAt: { lt: limit } }, select: { id: true } });
  for (const row of debts) {
    await db.$transaction(async (tx) => {
      await tx.activeDebt.update({ where: { id: row.id }, data: { status: "BAIXADA_PRESCRICAO" } });
      await debtEvent(tx, actor, row.id, "BAIXA_PRESCRICAO", `Baixa automática por prescrição (${years} anos).`, { years });
    });
  }
  return { count: debts.length, years };
}

// Livro de dívida ativa por exercício e origem (TRI-351) e relatórios gerenciais (TRI-365/403..407).
export async function daBook(db: PrismaClient, year?: number) {
  const debts = await db.activeDebt.findMany({ where: year ? { year } : {}, include: { taxpayer: { include: { person: true, company: true } } }, orderBy: [{ year: "asc" }, { createdAt: "asc" }], take: 500 });
  return debts.map((row) => ({ id: row.id, year: row.year, cda: row.cdaNumber ?? "SEM CDA", origin: row.originDebtType, taxpayer: taxpayerName(row.taxpayer), original: Number(row.originalValueDecimal ?? row.originalValue), updated: Number(row.updatedValueDecimal ?? row.updatedValue), status: row.status }));
}

// S9-B — Protesto com status internos e retorno controlado (TRI-373..380/386).
export async function selectProtestCandidates(db: PrismaClient) {
  const open = await db.taxProtestItem.findMany({ where: { status: { in: ["SELECIONADA", "REMESSA_PREPARADA", "EM_ACOMPANHAMENTO"] } }, select: { activeDebtId: true } });
  const busy = new Set(open.map((row) => row.activeDebtId));
  const debts = await db.activeDebt.findMany({ where: { status: { in: ["INSCRITA", "EM_COBRANCA"] }, cdaNumber: { not: null } }, include: { taxpayer: { include: { person: true, company: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return debts.filter((row) => !busy.has(row.id)).map((row) => ({ id: row.id, cda: row.cdaNumber!, taxpayer: taxpayerName(row.taxpayer), value: Number(row.updatedValueDecimal ?? row.updatedValue), status: row.status }));
}

export async function createProtestBatch(db: PrismaClient, actor: Actor, debtIds: string[]) {
  if (!debtIds.length) throw new TributarioS9Error("Selecione ao menos uma CDA.");
  return db.$transaction(async (tx) => {
    const debts = await tx.activeDebt.findMany({ where: { id: { in: debtIds }, status: { in: ["INSCRITA", "EM_COBRANCA"] }, cdaNumber: { not: null } }, include: { taxpayer: { include: { person: true, company: true } } } });
    if (debts.length !== debtIds.length) throw new TributarioS9Error("Somente CDAs inscritas participam da seleção.");
    const sequence = await nextSequence(tx, new Date().getUTCFullYear(), "PROTESTO");
    const batchNumber = `PROT-${new Date().getUTCFullYear()}-${String(sequence).padStart(5, "0")}`;
    const batch = await tx.taxProtestBatch.create({
      data: {
        batchNumber, status: "PREPARADA", createdByUsuarioId: actor.usuarioId,
        fileContent: json({ batchNumber, generatedAt: new Date(), layout: "REMESSA_INTERNA_CONTROLADA", scope: "SEM_CONVENIO — retorno controlado, sem protesto efetivado presumido", items: debts.map((row) => ({ debtId: row.id, cda: row.cdaNumber, taxpayer: taxpayerName(row.taxpayer), document: taxpayerDocument(row.taxpayer), value: String(row.updatedValueDecimal ?? row.updatedValue) })) }),
        items: { create: debts.map((row) => ({ activeDebtId: row.id, status: protestNext("SELECIONADA", "PREPARAR_REMESSA") })) },
      },
      include: { items: true },
    });
    for (const row of debts) {
      await tx.activeDebt.update({ where: { id: row.id }, data: { status: "EM_PROTESTO" } });
      await debtEvent(tx, actor, row.id, "PROTESTO", `CDA incluída na remessa interna ${batchNumber}.`, { batchId: batch.id });
    }
    return batch;
  });
}

export async function registerProtestReturn(db: PrismaClient, actor: Actor, input: { batchId: string; returns: { itemId: string; code: string; message: string }[] }) {
  return db.$transaction(async (tx) => {
    for (const row of input.returns) {
      const item = await tx.taxProtestItem.findFirst({ where: { id: row.itemId, batchId: input.batchId } });
      if (!item) throw new TributarioS9Error("Item de protesto não encontrado no lote.");
      const status = protestNext(item.status, "REGISTRAR_RETORNO");
      await tx.taxProtestItem.update({ where: { id: item.id }, data: { status, returnCode: row.code, returnMessage: row.message } });
      await debtEvent(tx, actor, item.activeDebtId, "PROTESTO", `Retorno controlado do cartório: ${row.code} — ${row.message}.`, { batchId: input.batchId, code: row.code });
    }
    const open = await tx.taxProtestItem.count({ where: { batchId: input.batchId, status: "REMESSA_PREPARADA" } });
    await tx.taxProtestBatch.update({ where: { id: input.batchId }, data: { status: open ? "RETORNO_PARCIAL" : "RETORNO_TOTAL" } });
    return tx.taxProtestBatch.findUniqueOrThrow({ where: { id: input.batchId }, include: { items: true } });
  });
}

export async function resolveProtestItem(db: PrismaClient, actor: Actor, input: { itemId: string; action: "BAIXAR_PAGAMENTO" | "CANCELAR" | "ANUIR"; reason: string }) {
  if (!input.reason.trim()) throw new TributarioS9Error("Informe a justificativa.");
  return db.$transaction(async (tx) => {
    const item = await tx.taxProtestItem.findUnique({ where: { id: input.itemId } });
    if (!item) throw new TributarioS9Error("Item de protesto não encontrado.");
    const status = protestNext("EM_ACOMPANHAMENTO", input.action === "BAIXAR_PAGAMENTO" ? "BAIXAR_PAGAMENTO" : input.action === "CANCELAR" ? "CANCELAR" : "ANUIR");
    const updated = await tx.taxProtestItem.update({ where: { id: item.id }, data: { status, resolvedAt: new Date(), consentIssuedAt: input.action === "ANUIR" ? new Date() : undefined } });
    if (input.action === "BAIXAR_PAGAMENTO") {
      const debt = await tx.activeDebt.findUnique({ where: { id: item.activeDebtId } });
      await tx.activeDebt.update({ where: { id: item.activeDebtId }, data: { status: "PAGA", updatedValue: 0, updatedValueDecimal: new Prisma.Decimal(0) } });
      if (debt?.assessmentId) await tx.taxAssessment.update({ where: { id: debt.assessmentId }, data: { status: "Pago" } });
      await debtEvent(tx, actor, item.activeDebtId, "PAGAMENTO", `Protesto baixado por pagamento: ${input.reason.trim()}.`, { itemId: item.id });
    } else if (input.action === "CANCELAR") {
      await tx.activeDebt.update({ where: { id: item.activeDebtId }, data: { status: "INSCRITA" } });
      await debtEvent(tx, actor, item.activeDebtId, "PROTESTO", `Protesto cancelado/desistido: ${input.reason.trim()}.`, { itemId: item.id });
    } else {
      await debtEvent(tx, actor, item.activeDebtId, "PROTESTO", `Carta de anuência emitida: ${input.reason.trim()}.`, { itemId: item.id, consent: true });
    }
    return updated;
  });
}

// S9-C — Execução fiscal com protocolo interno (TRI-346/388..398). Sem TJES: sem processo oficial presumido.
export async function createExecutionBatch(db: PrismaClient, actor: Actor, input: { debtIds: string[]; prosecutor: string }) {
  if (!input.prosecutor.trim()) throw new TributarioS9Error("Informe o procurador responsável.");
  if (!input.debtIds.length) throw new TributarioS9Error("Selecione ao menos uma CDA para o lote.");
  return db.$transaction(async (tx) => {
    const year = new Date().getUTCFullYear();
    const sequence = await nextSequence(tx, year, "EXECUCAO");
    const batchNumber = `EXEC-${year}-${String(sequence).padStart(5, "0")}`;
    const protocolSequence = await nextSequence(tx, year, "PROTOCOLO_EXECUCAO");
    const batch = await tx.taxExecutionBatch.create({ data: { batchNumber, internalProtocol: internalProtocol("EXEC", year, protocolSequence), prosecutor: input.prosecutor.trim(), createdByUsuarioId: actor.usuarioId } });
    for (const debtId of input.debtIds) {
      await openExecutionCaseTx(tx, actor, { debtId, batchId: batch.id, prosecutor: input.prosecutor.trim(), attorneyReference: "", attachments: [] });
    }
    return tx.taxExecutionBatch.findUniqueOrThrow({ where: { id: batch.id }, include: { cases: true } });
  });
}

async function openExecutionCaseTx(tx: Prisma.TransactionClient, actor: Actor, input: { debtId: string; batchId?: string; prosecutor: string; attorneyReference: string; attachments: unknown[] }) {
  const debt = await tx.activeDebt.findUnique({ where: { id: input.debtId }, include: { taxpayer: { include: { person: true, company: true } } } });
  if (!debt?.cdaNumber) throw new TributarioS9Error("Somente CDA emitida segue para execução.");
  if (!["INSCRITA", "EM_COBRANCA", "EM_PROTESTO"].includes(debt.status)) throw new TributarioS9Error("Dívida fora do estágio de execução.");
  const year = new Date().getUTCFullYear();
  const sequence = await nextSequence(tx, year, "PROCESSO_EXECUCAO");
  const internalProtocolNumber = internalProtocol("EXEC", year, sequence);
  const snapshot = json({ debtId: debt.id, cda: debt.cdaNumber, taxpayer: taxpayerName(debt.taxpayer), value: String(debt.updatedValueDecimal ?? debt.updatedValue), prosecutor: input.prosecutor, attorneyReference: input.attorneyReference, attachments: input.attachments, scope: "PROTOCOLO_INTERNO" });
  const executionCase = await tx.taxExecutionCase.create({ data: { batchId: input.batchId || null, activeDebtId: debt.id, internalProtocol: internalProtocolNumber, prosecutor: input.prosecutor, attorneyReference: input.attorneyReference || null, attachments: json(input.attachments), caseSnapshot: snapshot, createdByUsuarioId: actor.usuarioId, events: { create: { eventType: "ABERTURA", description: `Peças reunidas para ${input.prosecutor}. Protocolo interno ${internalProtocolNumber}.`, actorUsuarioId: actor.usuarioId } } } });
  await tx.activeDebt.update({ where: { id: debt.id }, data: { status: "AJUIZADA" } });
  await debtEvent(tx, actor, debt.id, "EXECUCAO", `Execução aberta sob protocolo interno ${internalProtocolNumber}.`, { caseId: executionCase.id });
  return executionCase;
}

export async function openExecutionCase(db: PrismaClient, actor: Actor, input: { debtId: string; prosecutor: string; attorneyReference?: string; attachments?: unknown[] }) {
  if (!input.prosecutor.trim()) throw new TributarioS9Error("Informe o procurador responsável.");
  return db.$transaction(async (tx) => openExecutionCaseTx(tx, actor, { debtId: input.debtId, prosecutor: input.prosecutor.trim(), attorneyReference: input.attorneyReference?.trim() ?? "", attachments: input.attachments ?? [] }));
}

export async function advanceExecutionCase(db: PrismaClient, actor: Actor, input: { caseId: string; action: "ENVIAR_PROCURADORIA" | "DEVOLVER" | "REGISTRAR_PROTOCOLO" | "ACOMPANHAR" | "REGISTRAR_RETORNO" | "REABRIR" | "ENCERRAR"; description: string }) {
  if (!input.description.trim()) throw new TributarioS9Error("Descreva o andamento.");
  return db.$transaction(async (tx) => {
    const executionCase = await tx.taxExecutionCase.findUnique({ where: { id: input.caseId } });
    if (!executionCase) throw new TributarioS9Error("Caso de execução não encontrado.");
    const status = executionNext(executionCase.status, input.action);
    const updated = await tx.taxExecutionCase.update({ where: { id: executionCase.id }, data: { status, events: { create: { eventType: input.action === "ENVIAR_PROCURADORIA" ? "ENVIO_PROCURADORIA" : input.action === "REGISTRAR_PROTOCOLO" ? "PROTOCOLO" : input.action === "REGISTRAR_RETORNO" ? "RETORNO" : input.action === "ENCERRAR" ? "ENCERRAMENTO" : "ANDAMENTO", description: input.description.trim(), actorUsuarioId: actor.usuarioId } } } });
    await debtEvent(tx, actor, executionCase.activeDebtId, "EXECUCAO", input.description.trim(), { caseId: executionCase.id, status });
    return updated;
  });
}

// MNI como registro interno controlado: sem credencial TJES, sem envio oficial presumido (TRI-389).
export async function registerMni(db: PrismaClient, actor: Actor, caseId: string) {
  return db.$transaction(async (tx) => {
    const executionCase = await tx.taxExecutionCase.findUnique({ where: { id: caseId } });
    if (!executionCase) throw new TributarioS9Error("Caso de execução não encontrado.");
    const status = executionNext(executionCase.status, "REGISTRAR_MNI");
    const year = new Date().getUTCFullYear();
    const sequence = await nextSequence(tx, year, "MNI");
    const updated = await tx.taxExecutionCase.update({ where: { id: executionCase.id }, data: { status, mniStatus: "MNI_REGISTRO_INTERNO", events: { create: { eventType: "MNI", description: `Registro MNI interno ${internalProtocol("MNI", year, sequence)}; adaptador interno, sem credencial TJES.`, payload: json({ adapter: "INTERNAL_ADAPTER", reference: internalProtocol("MNI", year, sequence) }), actorUsuarioId: actor.usuarioId } } } });
    await debtEvent(tx, actor, executionCase.activeDebtId, "EXECUCAO", "Intercâmbio MNI registrado internamente.", { caseId });
    return updated;
  });
}

export async function scheduleHearing(db: PrismaClient, actor: Actor, input: { caseId: string; date: Date; notes?: string }) {
  return db.$transaction(async (tx) => {
    const updated = await tx.taxExecutionCase.update({ where: { id: input.caseId }, data: { nextHearingAt: input.date, hearingNotes: input.notes?.trim() || null, events: { create: { eventType: "AUDIENCIA", description: `Agenda do procurador: ${input.date.toLocaleString("pt-BR")}${input.notes?.trim() ? ` — ${input.notes.trim()}` : ""}.`, actorUsuarioId: actor.usuarioId } } } });
    return updated;
  });
}

// S9-D — Cemitérios com taxas pelo motor tributário (TRI-408..436).
export async function createCemetery(db: PrismaClient, input: { code: string; name: string; address?: string; phone?: string; wakePlace?: string }) {
  if (!input.code.trim() || !input.name.trim()) throw new TributarioS9Error("Código e nome do cemitério são obrigatórios.");
  return db.taxCemetery.create({ data: { code: input.code.trim().toUpperCase(), name: input.name.trim(), address: input.address?.trim() || null, phone: input.phone?.trim() || null, wakePlace: input.wakePlace?.trim() || null } });
}

export async function createSector(db: PrismaClient, input: { cemeteryId: string; parentId?: string; code: string; name: string }) {
  if (!input.code.trim() || !input.name.trim()) throw new TributarioS9Error("Código e nome do setor são obrigatórios.");
  return db.taxCemeterySector.create({ data: { cemeteryId: input.cemeteryId, parentId: input.parentId || null, code: input.code.trim().toUpperCase(), name: input.name.trim() } });
}

export async function createGrave(db: PrismaClient, input: { cemeteryId: string; sectorId?: string; code: string; graveType: string; capacity?: number; notes?: string }) {
  if (!input.code.trim()) throw new TributarioS9Error("Identificação da sepultura é obrigatória.");
  const capacity = input.capacity ?? 1;
  if (!Number.isInteger(capacity) || capacity < 1) throw new TributarioS9Error("Capacidade inválida.");
  return db.taxGrave.create({ data: { cemeteryId: input.cemeteryId, sectorId: input.sectorId || null, code: input.code.trim().toUpperCase(), graveType: input.graveType, capacity, notes: input.notes?.trim() || null } });
}

export async function registerEmployee(db: PrismaClient, input: { cemeteryId: string; name: string; role: string; phone?: string }) {
  if (!input.name.trim() || !input.role.trim()) throw new TributarioS9Error("Nome e função são obrigatórios.");
  return db.taxCemeteryEmployee.create({ data: { cemeteryId: input.cemeteryId, name: input.name.trim(), role: input.role.trim(), phone: input.phone?.trim() || null } });
}

export async function registerFuneralHome(db: PrismaClient, input: { name: string; cnpj?: string; phone?: string }) {
  if (!input.name.trim()) throw new TributarioS9Error("Nome da funerária é obrigatório.");
  return db.taxFuneralHome.create({ data: { name: input.name.trim(), cnpj: input.cnpj?.trim() || null, phone: input.phone?.trim() || null } });
}

const DEATH_GROUPS = ["falecido", "nascimento", "documentos", "endereco", "obito", "local", "medico", "causas", "funeraria", "sepultamento", "observacoes"];

export async function registerDeceased(db: PrismaClient, actor: Actor, input: {
  fullName: string; birthDate?: Date; deathDate: Date; deathTime?: string; gender?: string; document?: string; maritalStatus?: string; fatherName?: string; motherName?: string; address?: string;
  cemeteryId: string; graveId: string; funeralHomeId?: string; funeralHomeName?: string; causeId?: string; causeText?: string;
  doctorName: string; doctorCrm: string; groups?: Record<string, unknown>; taxpayerId?: string;
}) {
  if (!input.fullName.trim()) throw new TributarioS9Error("Nome do falecido é obrigatório.");
  if (!input.doctorName.trim() || !input.doctorCrm.trim()) throw new TributarioS9Error("Médico declarante com CRM é obrigatório.");
  return db.$transaction(async (tx) => {
    const grave = await tx.taxGrave.findUnique({ where: { id: input.graveId } });
    if (!grave || grave.cemeteryId !== input.cemeteryId) throw new TributarioS9Error("Sepultura fora do cemitério informado.");
    if (!graveHasVacancy(grave)) throw new TributarioS9Error("Sepultura sem vaga: ocupada, cheia ou interditada.");
    const groups = { ...(input.groups ?? {}) };
    for (const group of DEATH_GROUPS) if (groups[group] === undefined) groups[group] = null;
    const deceased = await tx.taxDeceased.create({
      data: {
        fullName: input.fullName.trim(), birthDate: input.birthDate || null, deathDate: input.deathDate, deathTime: input.deathTime || null, gender: input.gender || null, document: input.document || null,
        maritalStatus: input.maritalStatus || null, fatherName: input.fatherName || null, motherName: input.motherName || null, address: input.address || null,
        cemeteryId: input.cemeteryId, graveId: grave.id, funeralHomeId: input.funeralHomeId || null, funeralHomeName: input.funeralHomeName || null,
        causeId: input.causeId || null, causeText: input.causeText || null, doctorName: input.doctorName.trim(), doctorCrm: input.doctorCrm.trim(),
        groups: json({ ...groups, _version: "OBITO_11_GRUPOS_V1" }), taxpayerId: input.taxpayerId || null, createdByUsuarioId: actor.usuarioId,
      },
    });
    const occupantCount = grave.occupantCount + 1;
    await tx.taxGrave.update({ where: { id: grave.id }, data: { occupantCount, status: occupantCount >= grave.capacity ? "OCUPADA" : grave.status } });
    await tx.taxBurialMovement.create({ data: { deceasedId: deceased.id, graveId: grave.id, toGraveId: grave.id, movementType: "SEPULTAMENTO", movementDate: input.deathDate, notes: "Sepultamento registrado com vaga controlada.", createdByUsuarioId: actor.usuarioId } });
    return deceased;
  });
}

export async function registerMovement(db: PrismaClient, actor: Actor, input: { deceasedId?: string; graveId: string; toGraveId?: string; movementType: "EXUMACAO" | "REMOCAO" | "TRASLADO"; notes?: string }) {
  return db.$transaction(async (tx) => {
    const grave = await tx.taxGrave.findUnique({ where: { id: input.graveId } });
    if (!grave) throw new TributarioS9Error("Sepultura de origem não encontrada.");
    if (input.movementType === "EXUMACAO") {
      const occupantCount = Math.max(0, grave.occupantCount - 1);
      await tx.taxGrave.update({ where: { id: grave.id }, data: { occupantCount, status: occupantCount === 0 && grave.status === "OCUPADA" ? "LIVRE" : grave.status } });
      if (input.deceasedId) await tx.taxDeceased.update({ where: { id: input.deceasedId }, data: { status: "EXUMADO", graveId: null } });
      return tx.taxBurialMovement.create({ data: { deceasedId: input.deceasedId || null, graveId: grave.id, fromGraveId: grave.id, movementType: "EXUMACAO", notes: input.notes?.trim() || null, createdByUsuarioId: actor.usuarioId } });
    }
    if (!input.toGraveId) throw new TributarioS9Error("Destino é obrigatório para remoção/traslado.");
    const destination = await tx.taxGrave.findUnique({ where: { id: input.toGraveId } });
    if (!destination || destination.cemeteryId !== grave.cemeteryId) throw new TributarioS9Error("Destino fora do cemitério de origem.");
    if (!graveHasVacancy(destination)) throw new TributarioS9Error("Sepultura de destino sem vaga.");
    await tx.taxGrave.update({ where: { id: grave.id }, data: { occupantCount: Math.max(0, grave.occupantCount - 1) } });
    const occupantCount = destination.occupantCount + 1;
    await tx.taxGrave.update({ where: { id: destination.id }, data: { occupantCount, status: occupantCount >= destination.capacity ? "OCUPADA" : destination.status } });
    if (input.deceasedId) await tx.taxDeceased.update({ where: { id: input.deceasedId }, data: { status: "REMOVIDO", graveId: destination.id } });
    return tx.taxBurialMovement.create({ data: { deceasedId: input.deceasedId || null, graveId: destination.id, fromGraveId: grave.id, toGraveId: destination.id, movementType: input.movementType, notes: input.notes?.trim() || null, createdByUsuarioId: actor.usuarioId } });
  });
}

export async function grantConcession(db: PrismaClient, actor: Actor, input: { graveId: string; holderName: string; taxpayerId?: string; concessionType: "TEMPORARIA" | "INDETERMINADA"; endsAt?: Date }) {
  if (!input.holderName.trim()) throw new TributarioS9Error("Titular da concessão é obrigatório.");
  if (input.concessionType === "TEMPORARIA" && !input.endsAt) throw new TributarioS9Error("Concessão temporária exige término.");
  return db.taxGraveConcession.create({ data: { graveId: input.graveId, holderName: input.holderName.trim(), taxpayerId: input.taxpayerId || null, concessionType: input.concessionType, endsAt: input.endsAt || null, createdByUsuarioId: actor.usuarioId } });
}

// Guia da taxa de sepultamento/exumação/movimentação pelo motor tributário (TRI-426/427/430).
export async function issueCemeteryFee(db: PrismaClient, actor: Actor, input: { taxpayerId: string; amount: number; dueDate: Date; movementId?: string; concessionId?: string; label?: string }) {
  const fee = money(input.amount);
  if (fee.lessThanOrEqualTo(0)) throw new TributarioS9Error("Valor da taxa inválido.");
  const tax = await db.tax.findFirst({ where: { name: "Taxa de Sepultamento", isActive: true } });
  if (!tax) throw new TributarioS9Error("Cadastre a Taxa de Sepultamento antes de emitir a guia.");
  const year = input.dueDate.getUTCFullYear();
  const assessment = await createTaxAssessment(db, fullActor(actor), { year, taxId: tax.id, taxpayerId: input.taxpayerId, taxableBase: fee, rate: 100, competence: new Date() });
  const guide = await generateTaxGuide(db, fullActor(actor), { assessmentId: assessment.id, dueDate: input.dueDate });
  await db.$transaction(async (tx) => {
    if (input.movementId) await tx.taxBurialMovement.update({ where: { id: input.movementId }, data: { feeAssessmentId: assessment.id } });
    if (input.concessionId) await tx.taxGraveConcession.update({ where: { id: input.concessionId }, data: { feeAssessmentId: assessment.id } });
  });
  return { assessment, guide };
}

// Taxa de cemitério não paga segue para dívida ativa (TRI-436).
export async function enrollCemeteryFeeInDebt(db: PrismaClient, actor: Actor, assessmentId: string) {
  const debt = await enrollAssessmentInActiveDebt(db, fullActor(actor), assessmentId);
  await db.$transaction(async (tx) => {
    await debtEvent(tx, actor, debt.id, "INSCRICAO", "Taxa de cemitério inscrita em dívida ativa.", { assessmentId });
  });
  return debt;
}

export function cemeteryOccupancy(graves: { capacity: number; occupantCount: number }[]) {
  return occupancyStats(graves);
}

export function concessionCurrentSituation(concession: { concessionType: string; status: string; endsAt?: Date | string | null }, now = new Date()) {
  return concessionSituation(concession, now);
}

// S9-E — BI com dados reais da base, filtros e drill-down (TRI-437..445).
export async function tributarioBi(db: PrismaClient, filters: { year?: number; taxName?: string; debtStatus?: string }) {
  const year = filters.year;
  const [assessments, payments, debts, agreements, legacyPlans, cases, protestItems, declarations, activities] = await Promise.all([
    db.taxAssessment.findMany({ where: { ...(year ? { year } : {}), ...(filters.taxName ? { tax: { name: filters.taxName } } : {}) }, select: { finalValueDecimal: true, originalValueDecimal: true, originalValue: true, status: true, year: true, taxpayerId: true, tax: { select: { name: true } }, realEstate: { select: { fiscalZone: true, propertyUse: true } } }, take: 2000 }),
    db.taxPayment.findMany({ where: { status: "Confirmado", ...(year ? { guide: { assessment: { year } } } : {}) }, select: { amountPaidDecimal: true, amountPaid: true, paymentDate: true, paymentMethod: true, guide: { select: { assessment: { select: { year: true, tax: { select: { name: true } } } } } } }, take: 2000 }),
    db.activeDebt.findMany({ where: { ...(year ? { year } : {}), ...(filters.debtStatus ? { status: filters.debtStatus } : {}) }, select: { updatedValueDecimal: true, updatedValue: true, status: true, originDebtType: true, year: true, cdaNumber: true, taxpayerId: true }, orderBy: { updatedAt: "desc" }, take: 1000 }),
    db.taxInstallmentAgreement.findMany({ select: { status: true, totalAgreementDecimal: true, balanceDecimal: true, paidDecimal: true }, take: 1000 }),
    db.debtInstallment.findMany({ select: { status: true, totalValueDecimal: true, totalValue: true }, take: 1000 }),
    db.taxExecutionCase.findMany({ select: { status: true, internalProtocol: true, activeDebtId: true }, take: 500 }),
    db.taxProtestItem.findMany({ select: { status: true, batchId: true, activeDebtId: true }, take: 1000 }),
    db.taxDeclaration.findMany({ where: year ? { competence: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } } : {}, select: { competence: true, issValueDecimal: true, activityId: true }, take: 2000 }),
    db.taxServiceActivity.findMany({ select: { id: true, code: true } }),
  ]);
  const activityNames = new Map(activities.map((row) => [row.id, row.code ?? row.id]));
  const previsto = assessments.reduce((sum, row) => sum.plus(new Prisma.Decimal(String(row.finalValueDecimal ?? row.originalValueDecimal ?? row.originalValue ?? 0))), new Prisma.Decimal(0));
  const realizado = payments.reduce((sum, row) => sum.plus(new Prisma.Decimal(String(row.amountPaidDecimal ?? row.amountPaid ?? 0))), new Prisma.Decimal(0));
  const rate = previsto.greaterThan(0) ? Number(realizado.div(previsto).mul(100).toFixed(2)) : 0;
  return {
    previsto: Number(previsto.toFixed(2)),
    realizado: Number(realizado.toFixed(2)),
    collectionRate: rate,
    byTax: sumBy(assessments, (row) => row.tax.name, (row) => row.finalValueDecimal ?? row.originalValueDecimal ?? row.originalValue),
    paidByTax: sumBy(payments, (row) => row.guide.assessment.tax.name, (row) => row.amountPaidDecimal ?? row.amountPaid),
    paymentTrend: trendByMonth(payments.map((row) => ({ date: row.paymentDate, value: row.amountPaidDecimal ?? row.amountPaid }))),
    debtsByStatus: sumBy(debts, (row) => row.status, (row) => row.updatedValueDecimal ?? row.updatedValue),
    debtsByOrigin: sumBy(debts, (row) => row.originDebtType, (row) => row.updatedValueDecimal ?? row.updatedValue),
    agreementsByStatus: sumBy(agreements, (row) => row.status, (row) => row.totalAgreementDecimal),
    agreementsBalance: Number(agreements.reduce((sum, row) => sum.plus(row.balanceDecimal), new Prisma.Decimal(0)).toFixed(2)),
    legacyPlansByStatus: sumBy(legacyPlans, (row) => row.status, (row) => row.totalValueDecimal ?? row.totalValue),
    executionByStatus: sumBy(cases, (row) => row.status, () => 0),
    protestByStatus: sumBy(protestItems, (row) => row.status, () => 0),
    iptuByZone: sumBy(assessments.filter((row) => row.realEstate), (row) => row.realEstate?.fiscalZone ?? "SEM ZONA", (row) => row.finalValueDecimal ?? row.originalValueDecimal ?? row.originalValue),
    iptuByUse: sumBy(assessments.filter((row) => row.realEstate), (row) => row.realEstate?.propertyUse ?? "SEM USO", (row) => row.finalValueDecimal ?? row.originalValueDecimal ?? row.originalValue),
    issTrend: trendByMonth(declarations.map((row) => ({ date: row.competence, value: row.issValueDecimal }))),
    issByActivity: sumBy(declarations, (row) => activityNames.get(row.activityId) ?? row.activityId, (row) => row.issValueDecimal),
    drillDebts: debts.slice(0, 20).map((row) => ({ cda: row.cdaNumber ?? "SEM CDA", origin: row.originDebtType, status: row.status, value: Number(row.updatedValueDecimal ?? row.updatedValue), taxpayerId: row.taxpayerId })),
    counts: { assessments: assessments.length, payments: payments.length, debts: debts.length, agreements: agreements.length, cases: cases.length, protestItems: protestItems.length, declarations: declarations.length },
  };
}
