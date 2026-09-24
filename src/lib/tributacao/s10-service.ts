import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { abcCurve, calculateVaf, checkContrapartida, crossCheck, detectOmission, estimateAnnual, evaluateFormula, financialReturn, mergeEfdGia, monthlyTrend, participation, protocolNumber, VafError } from "./s10-engine";

type Actor = { usuarioId: string };
const json = (v: unknown) => JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
const money = (v: number | string | Prisma.Decimal) => new Prisma.Decimal(String(v)).toDecimalPlaces(2);
const num = (v: unknown) => Number(new Prisma.Decimal(String(v ?? 0)).toFixed(2));

export type Movement = { cfop: string; cfopDescription?: string; operationType: "ENTRADA" | "SAIDA"; value: number };

// Defaults: exercícios, contador, empresas A/B do cenário obrigatório e regras CFOP versionadas.
export async function ensureS10Defaults(db: PrismaClient, actor: Actor) {
  for (const year of [2024, 2025, 2026, 2027, 2028]) {
    await db.vafExercise.upsert({ where: { year }, update: { active: true }, create: { year, label: `Exercício ${year}`, active: true } });
  }
  const exercise = await db.vafExercise.findUniqueOrThrow({ where: { year: 2026 } });
  const accountant = await db.vafAccountant.upsert({
    where: { cpfCnpj: "12345678909" },
    update: {},
    create: { cpfCnpj: "12345678909", name: "Contador Demonstração", email: "contador@demo.local", phone: "(27) 90000-0001" },
  });
  const companyA = await db.vafCompany.upsert({
    where: { cnpj: "11111111000191" },
    update: { accountantId: accountant.id },
    create: { cnpj: "11111111000191", corporateName: "Empresa A Demonstração", tradeName: "Empresa A", stateInsc: "08200001", address: "Rua A, 100", phone: "(27) 90000-0002", email: "a@demo.local", cnae: "4711-3/02", taxRegime: "NORMAL", accountantId: accountant.id },
  });
  const companyB = await db.vafCompany.upsert({
    where: { cnpj: "22222222000191" },
    update: { accountantId: accountant.id },
    create: { cnpj: "22222222000191", corporateName: "Empresa B Demonstração", tradeName: "Empresa B", stateInsc: "08200002", address: "Rua B, 200", phone: "(27) 90000-0003", email: "b@demo.local", cnae: "4711-3/02", taxRegime: "SIMPLES", accountantId: accountant.id },
  });
  const from = new Date(Date.UTC(2026, 0, 1));
  for (const [cfop, desc, formula, contra] of [
    ["5102", "Venda de mercadoria (saída)", "saida - entrada", "1102"],
    ["1102", "Compra para comercialização (entrada)", "saida - entrada", undefined],
    ["5929", "Outras saídas não especificadas", "saida - entrada", undefined],
  ] as [string, string, string, string | undefined][]) {
    const existing = await db.vafRule.findFirst({ where: { exerciseId: exercise.id, cfop, situation: "VIGENTE" } });
    if (!existing) {
      await db.vafRule.create({ data: { exerciseId: exercise.id, cfop, cfopDescription: desc, composesVaf: true, formula, formulaVersion: "1", contrapartidaCfop: contra, effectiveFrom: from, situation: "VIGENTE" } });
    }
  }
  return { exercise, accountant, companyA, companyB, actor };
}

// S10-A — empresas / contador / carteira / contatos.
export async function upsertAccountant(db: PrismaClient, input: { cpfCnpj: string; name: string; email?: string; phone?: string }) {
  if (!input.cpfCnpj || !input.name) throw new VafError("Identificador e nome do contador são obrigatórios.");
  return db.vafAccountant.upsert({ where: { cpfCnpj: input.cpfCnpj }, update: { name: input.name, email: input.email, phone: input.phone }, create: { cpfCnpj: input.cpfCnpj, name: input.name, email: input.email, phone: input.phone } });
}

export async function upsertCompany(db: PrismaClient, input: { cnpj: string; corporateName: string; tradeName?: string; stateInsc?: string; address?: string; phone?: string; email?: string; cnae?: string; taxRegime?: string; accountantId?: string }) {
  if (!input.cnpj || !input.corporateName) throw new VafError("CNPJ e razão social são obrigatórios.");
  return db.vafCompany.upsert({ where: { cnpj: input.cnpj }, update: { ...input }, create: { cnpj: input.cnpj, corporateName: input.corporateName, tradeName: input.tradeName, stateInsc: input.stateInsc, address: input.address, phone: input.phone, email: input.email, cnae: input.cnae, taxRegime: input.taxRegime, accountantId: input.accountantId } });
}

export async function linkCompanyAccountant(db: PrismaClient, companyId: string, accountantId: string | null) {
  return db.vafCompany.update({ where: { id: companyId }, data: { accountantId } });
}

// S10-B — CFOP / contrapartida / regra / fórmula restrita / vigência / versão / situação.
export async function upsertRule(db: PrismaClient, input: { exerciseId: string; cfop: string; cfopDescription?: string; composesVaf?: boolean; formula: string; formulaVersion?: string; contrapartidaCfop?: string; contrapartidaRule?: string; effectiveFrom: Date; effectiveUntil?: Date; situation?: string }) {
  evaluateFormula(input.formula, { saida: 1, entrada: 0 }); // valida sintaxe restrita
  const current = await db.vafRule.findFirst({ where: { exerciseId: input.exerciseId, cfop: input.cfop, situation: "VIGENTE" } });
  if (current && (current.formula !== input.formula || current.contrapartidaCfop !== (input.contrapartidaCfop ?? null))) {
    await db.vafRule.update({ where: { id: current.id }, data: { situation: "SUBSTITUIDA", effectiveUntil: input.effectiveFrom } });
  }
  return db.vafRule.create({ data: { exerciseId: input.exerciseId, cfop: input.cfop, cfopDescription: input.cfopDescription, composesVaf: input.composesVaf ?? true, formula: input.formula, formulaVersion: input.formulaVersion ?? String((Number(current?.formulaVersion ?? 0)) + 1), contrapartidaCfop: input.contrapartidaCfop, contrapartidaRule: input.contrapartidaRule, effectiveFrom: input.effectiveFrom, effectiveUntil: input.effectiveUntil, situation: input.situation ?? "VIGENTE" } });
}

// S10-C — importações EFD / GIA-DOT / repasses / índices, com versão, competência e histórico.
async function nextProtocol(db: PrismaClient, exerciseId: string, prefix: string, year: number) {
  const count = await db.vafProtocol.count({ where: { exerciseId, documentType: prefix } });
  return protocolNumber(prefix, year, count + 1);
}

export async function importMovements(db: PrismaClient, actor: Actor, kind: "EFD" | "GIA", input: { companyId: string; exerciseId: string; competency: string; fileName: string; movements: Movement[]; version?: string; substituteId?: string }) {
  if (!/^\d{6}$/.test(input.competency)) throw new VafError("Competência deve ser AAAAMM.");
  if (!input.movements.length) throw new VafError("Informe ao menos um movimento por CFOP.");
  for (const m of input.movements) {
    if (!/^\d{4}$/.test(m.cfop)) throw new VafError(`CFOP inválido: ${m.cfop}.`);
    money(m.value);
  }
  const hash = createHash("sha256").update(JSON.stringify(input.movements)).digest("hex");
  const parsed = { movements: input.movements };
  const exercise = await db.vafExercise.findUniqueOrThrow({ where: { id: input.exerciseId } });
  const proto = await nextProtocol(db, input.exerciseId, kind, exercise.year);
  if (kind === "EFD") {
    const created = await db.vafEfdImport.create({ data: { companyId: input.companyId, exerciseId: input.exerciseId, competency: input.competency, version: input.version ?? "1", fileName: input.fileName, fileHash: hash, rawData: json(parsed), parsedData: json(parsed), status: "IMPORTADO", importedBy: actor.usuarioId, parentImportId: input.substituteId } });
    if (input.substituteId) await db.vafEfdImport.update({ where: { id: input.substituteId }, data: { status: "SUBSTITUIDO" } });
    await db.vafProtocol.create({ data: { protocolNumber: proto, companyId: input.companyId, documentType: kind, competency: input.competency, exerciseId: input.exerciseId, status: "RECEBIDO", metadata: json({ importId: created.id, fileName: input.fileName }) } });
    return created;
  }
  const created = await db.vafGiaImport.create({ data: { companyId: input.companyId, exerciseId: input.exerciseId, competency: input.competency, version: input.version ?? "1", fileName: input.fileName, fileHash: hash, rawData: json(parsed), parsedData: json(parsed), status: "IMPORTADO", importedBy: actor.usuarioId, parentImportId: input.substituteId } });
  if (input.substituteId) await db.vafGiaImport.update({ where: { id: input.substituteId }, data: { status: "SUBSTITUIDO" } });
  await db.vafProtocol.create({ data: { protocolNumber: proto, companyId: input.companyId, documentType: kind, competency: input.competency, exerciseId: input.exerciseId, status: "RECEBIDO", metadata: json({ importId: created.id, fileName: input.fileName }) } });
  return created;
}

export async function importRepasse(db: PrismaClient, actor: Actor, input: { exerciseId: string; competency: string; weekNumber?: number; municipalValue: number; stateTotalValue: number; sourceFile?: string; version?: string; correctId?: string }) {
  if (!/^\d{6}$/.test(input.competency)) throw new VafError("Competência deve ser AAAAMM.");
  const created = await db.vafRepasse.create({ data: { exerciseId: input.exerciseId, competency: input.competency, weekNumber: input.weekNumber, municipalValue: money(input.municipalValue), stateTotalValue: money(input.stateTotalValue), sourceFile: input.sourceFile ?? `repasse-${input.competency}.csv`, version: input.version ?? "1", parentRepasseId: input.correctId } });
  await db.vafActivity.create({ data: { exerciseId: input.exerciseId, companyId: (await db.vafCompany.findFirstOrThrow()).id, competency: input.competency, activityType: "REPASSE", title: `Repasse importado ${input.competency}`, description: `Municipal ${input.municipalValue} / Estado ${input.stateTotalValue} por ${actor.usuarioId}.`, status: "CONCLUIDA" } });
  return created;
}

export async function importIndices(db: PrismaClient, input: { exerciseId: string; competency: string; municipalProvisorio?: number; municipalDefinitivo?: number; companies?: { companyId: string; provisorio?: number; definitivo?: number }[] }) {
  const totals = await db.vafResult.aggregate({ where: { exerciseId: input.exerciseId, competency: input.competency }, _sum: { vafValue: true } });
  await db.vafMunicipalIndex.upsert({
    where: { exerciseId_competency: { exerciseId: input.exerciseId, competency: input.competency } },
    update: { indexProvisorio: input.municipalProvisorio, indexDefinitivo: input.municipalDefinitivo, totalVafProvisorio: totals._sum.vafValue ?? undefined },
    create: { exerciseId: input.exerciseId, competency: input.competency, indexProvisorio: input.municipalProvisorio, indexDefinitivo: input.municipalDefinitivo, totalVafProvisorio: totals._sum.vafValue ?? undefined },
  });
  for (const c of input.companies ?? []) {
    await db.vafCompanyIndex.upsert({
      where: { exerciseId_companyId_competency: { exerciseId: input.exerciseId, companyId: c.companyId, competency: input.competency } },
      update: { indexProvisorio: c.provisorio, indexDefinitivo: c.definitivo },
      create: { exerciseId: input.exerciseId, companyId: c.companyId, competency: input.competency, indexProvisorio: c.provisorio, indexDefinitivo: c.definitivo },
    });
  }
  return { ok: true };
}

function movementsOf(imp: { parsedData: unknown; rawData: unknown } | null): Movement[] {
  const data = (imp?.parsedData ?? imp?.rawData) as { movements?: Movement[] } | null;
  return Array.isArray(data?.movements) ? data.movements! : [];
}

// S10-D — cruzamento EFD x GIA/DOT, diferenças, omissos, inconsistências, notificação, correção.
export async function processCompetency(db: PrismaClient, actor: Actor, input: { exerciseId: string; competency: string; sourceType?: string }) {
  const sourceType = input.sourceType ?? "PROVISORIO";
  const companies = await db.vafCompany.findMany({ where: { active: true } });
  const rules = await db.vafRule.findMany({ where: { exerciseId: input.exerciseId, situation: "VIGENTE" } });
  const ruleByCfop = new Map(rules.map((r) => [r.cfop, r]));
  const received: string[] = [];
  let total = new Prisma.Decimal(0);

  for (const company of companies) {
    const efd = await db.vafEfdImport.findFirst({ where: { companyId: company.id, exerciseId: input.exerciseId, competency: input.competency, status: { notIn: ["SUBSTITUIDO"] } }, orderBy: { importedAt: "desc" } });
    const gia = await db.vafGiaImport.findFirst({ where: { companyId: company.id, exerciseId: input.exerciseId, competency: input.competency, status: { notIn: ["SUBSTITUIDO"] } }, orderBy: { importedAt: "desc" } });
    if (efd || gia) received.push(company.id);
    const efdByCfop = new Map<string, { saida: number; entrada: number }>();
    const giaByCfop = new Map<string, { saida: number; entrada: number }>();
    for (const m of movementsOf(efd)) {
      const cur = efdByCfop.get(m.cfop) ?? { saida: 0, entrada: 0 };
      if (m.operationType === "SAIDA") cur.saida += m.value; else cur.entrada += m.value;
      efdByCfop.set(m.cfop, cur);
    }
    for (const m of movementsOf(gia)) {
      const cur = giaByCfop.get(m.cfop) ?? { saida: 0, entrada: 0 };
      if (m.operationType === "SAIDA") cur.saida += m.value; else cur.entrada += m.value;
      giaByCfop.set(m.cfop, cur);
    }
    const cfops = new Set([...efdByCfop.keys(), ...giaByCfop.keys()]);
    let saidaElegivel = new Prisma.Decimal(0);
    let entradaElegivel = new Prisma.Decimal(0);
    for (const cfop of cfops) {
      const e = efdByCfop.get(cfop) ?? { saida: 0, entrada: 0 };
      const g = giaByCfop.get(cfop) ?? { saida: 0, entrada: 0 };
      const merged = mergeEfdGia({ saida: e.saida, entrada: e.entrada }, { saida: g.saida, entrada: g.entrada }, "MERGED");
      const rule = ruleByCfop.get(cfop);
      const composes = rule?.composesVaf ?? true;
      const formula = rule?.formula ?? "saida - entrada";
      const vafCfop = composes ? evaluateFormula(formula, { saida: String(merged.saida), entrada: String(merged.entrada) }) : new Prisma.Decimal(0);
      if (composes) {
        saidaElegivel = saidaElegivel.plus(merged.saida);
        entradaElegivel = entradaElegivel.plus(merged.entrada);
      }
      await db.vafMonthlySummary.upsert({
        where: { exerciseId_companyId_competency_cfop: { exerciseId: input.exerciseId, companyId: company.id, competency: input.competency, cfop } },
        update: { efdSaida: e.saida, efdEntrada: e.entrada, giaSaida: g.saida, giaEntrada: g.entrada, composesVaf: composes, vafCalculated: vafCfop, formulaApplied: formula, sourcePriority: "MERGED", divergences: json({ efd: e, gia: g }) },
        create: { exerciseId: input.exerciseId, companyId: company.id, competency: input.competency, cfop, cfopDescription: rule?.cfopDescription, efdSaida: e.saida, efdEntrada: e.entrada, giaSaida: g.saida, giaEntrada: g.entrada, composesVaf: composes, vafCalculated: vafCfop, formulaApplied: formula, sourcePriority: "MERGED", divergences: json({ efd: e, gia: g }) },
      });
      await db.vafCfopEntry.upsert({
        where: { id: `${input.exerciseId}-${company.id}-${input.competency}-${cfop}-SAIDA` },
        update: { efdValue: e.saida, giaValue: g.saida, composesVaf: composes, formulaDetail: formula },
        create: { id: `${input.exerciseId}-${company.id}-${input.competency}-${cfop}-SAIDA`, exerciseId: input.exerciseId, companyId: company.id, competency: input.competency, cfop, cfopDescription: rule?.cfopDescription, operationType: "SAIDA", efdValue: e.saida, giaValue: g.saida, composesVaf: composes, formulaDetail: formula },
      });
      const check = crossCheck(e.saida + e.entrada, g.saida + g.entrada, "DIFERENCA_MAX", 0.01);
      if ((efd || gia) && !check.ok) {
        await db.vafCrossCheck.create({ data: { exerciseId: input.exerciseId, companyId: company.id, competency: input.competency, cfop, checkType: "EFD_X_GIA", description: `Divergência EFD x GIA no CFOP ${cfop}: diferença ${check.difference}.`, severity: "ALERTA", efdValue: check.efd, giaValue: check.gia, difference: check.difference, status: "ABERTA" } });
      }
      const contra = checkContrapartida(cfop, rule?.contrapartidaCfop ?? undefined, [...cfops].map((c) => ({ cfop: c, value: new Prisma.Decimal(0) })));
      if (!contra.ok) {
        await db.vafCrossCheck.create({ data: { exerciseId: input.exerciseId, companyId: company.id, competency: input.competency, cfop, checkType: "CONTRAPARTIDA", description: `CFOP ${cfop} exige contrapartida ${contra.missing.join(", ")} não localizada.`, severity: "ERRO", status: "ABERTA" } });
      }
      if (cfop === "5929" && (e.saida + g.saida + e.entrada + g.entrada) > 0) {
        await db.vafCrossCheck.create({ data: { exerciseId: input.exerciseId, companyId: company.id, competency: input.competency, cfop, checkType: "GENERICO", description: `CFOP genérico ${cfop} exige conferência da base de cálculo.`, severity: "ALERTA", efdValue: e.saida + e.entrada, giaValue: g.saida + g.entrada, status: "ABERTA" } });
      }
    }
    const calc = calculateVaf({ saidaElegivel: saidaElegivel.toString(), entradaElegivel: entradaElegivel.toString() });
    total = total.plus(calc.vaf);
    await db.vafResult.upsert({
      where: { exerciseId_companyId_competency_sourceType: { exerciseId: input.exerciseId, companyId: company.id, competency: input.competency, sourceType } },
      update: { saidaElegivel: calc.saida, entradaElegivel: calc.entrada, vafValue: calc.vaf, isSimples: (company.taxRegime ?? "").includes("SIMPLES") },
      create: { exerciseId: input.exerciseId, companyId: company.id, competency: input.competency, sourceType, saidaElegivel: calc.saida, entradaElegivel: calc.entrada, vafValue: calc.vaf, isSimples: (company.taxRegime ?? "").includes("SIMPLES") },
    });
    if (efd) await db.vafEfdImport.update({ where: { id: efd.id }, data: { status: "PROCESSADO", processedAt: new Date() } });
    if (gia) await db.vafGiaImport.update({ where: { id: gia.id }, data: { status: "PROCESSADO", processedAt: new Date() } });
  }

  // Participação + ranking (sem duplicar fontes: base única já mesclada).
  const results = await db.vafResult.findMany({ where: { exerciseId: input.exerciseId, competency: input.competency, sourceType }, orderBy: { vafValue: "desc" } });
  let rank = 1;
  for (const r of results) {
    const p = participation(total.toString(), r.vafValue.toString());
    await db.vafResult.update({ where: { id: r.id }, data: { participation: p.participation, rank: rank++ } });
  }

  // Omissos: esperadas sem arquivo no lote.
  const omitted = detectOmission(companies.map((c) => c.id), received);
  for (const companyId of omitted) {
    await db.vafNotification.create({ data: { companyId, type: "OMISSAO", title: `Declaração ausente em ${input.competency}`, content: `Nenhum arquivo EFD/GIA localizado para a competência ${input.competency}. Regularize ou justifique.`, competency: input.competency, exerciseId: input.exerciseId, status: "ENVIADA" } });
  }
  await db.vafActivity.create({ data: { exerciseId: input.exerciseId, companyId: companies[0]?.id ?? (await db.vafCompany.findFirstOrThrow()).id, competency: input.competency, activityType: "CRUZAMENTO", title: `Apuração ${input.competency} (${sourceType})`, description: `Total VAF ${total.toFixed(2)} em ${results.length} empresas; ${omitted.length} omissas.`, status: "ANALISADA", analyzedAt: new Date() } });
  return { total: total.toFixed(2), companies: results.length, omitted: omitted.length };
}

export async function notifyCorrection(db: PrismaClient, input: { companyId: string; exerciseId: string; competency: string; title: string; content: string; accountantId?: string }) {
  return db.vafNotification.create({ data: { companyId: input.companyId, exerciseId: input.exerciseId, competency: input.competency, accountantId: input.accountantId, type: "CORRECAO", title: input.title, content: input.content, status: "ENVIADA" } });
}

export async function markNotificationRead(db: PrismaClient, id: string) {
  return db.vafNotification.update({ where: { id }, data: { status: "LIDA", readAt: new Date() } });
}

export async function resolveCrossCheck(db: PrismaClient, actor: Actor, id: string, status: "CORRIGIDA" | "IGNORADA") {
  return db.vafCrossCheck.update({ where: { id }, data: { status, resolvedAt: new Date(), resolvedBy: actor.usuarioId } });
}

export async function createEstimate(db: PrismaClient, actor: Actor, input: { exerciseId: string; competency: string; companyId?: string; method: "LINEAR" | "MEDIA_MOVEL"; realizedMonths: number; realizedValue: number; history?: number[]; hypothesis?: string }) {
  const est = estimateAnnual(input.realizedMonths, input.realizedValue, input.method, input.history ?? []);
  return db.vafEstimate.create({ data: { exerciseId: input.exerciseId, companyId: input.companyId, competency: input.competency, method: est.method, realizedMonths: input.realizedMonths, realizedValue: money(input.realizedValue), estimatedValue: est.annual, hypothesis: input.hypothesis, createdBy: actor.usuarioId } });
}

// Cenário obrigatório idempotente: A 15000/9000=6000, B 4000, total 10000, 60/40.
export async function seedMandatoryScenario(db: PrismaClient, actor: Actor) {
  const { exercise, companyA, companyB } = await ensureS10Defaults(db, actor);
  const competency = "202601";
  await importMovements(db, actor, "EFD", { companyId: companyA.id, exerciseId: exercise.id, competency, fileName: "efd-empresa-a-202601.txt", movements: [{ cfop: "5102", operationType: "SAIDA", value: 15000 }, { cfop: "1102", operationType: "ENTRADA", value: 9000 }], version: "1" }).catch(() => undefined);
  await importMovements(db, actor, "GIA", { companyId: companyA.id, exerciseId: exercise.id, competency, fileName: "gia-empresa-a-202601.txt", movements: [{ cfop: "5102", operationType: "SAIDA", value: 15000 }, { cfop: "1102", operationType: "ENTRADA", value: 9000 }], version: "1" }).catch(() => undefined);
  await importMovements(db, actor, "EFD", { companyId: companyB.id, exerciseId: exercise.id, competency, fileName: "efd-empresa-b-202601.txt", movements: [{ cfop: "5102", operationType: "SAIDA", value: 4000 }], version: "1" }).catch(() => undefined);
  return processCompetency(db, actor, { exerciseId: exercise.id, competency, sourceType: "PROVISORIO" });
}

// S10-E — ranking, atividade, ABC, evolução, índices, repasses, margem, CFOP, empresa, Simples, estimativas, comparativos.
export async function vafReports(db: PrismaClient, exerciseId: string, competency?: string) {
  const [results, summaries, repasses, indices, estimates, crossChecks] = await Promise.all([
    db.vafResult.findMany({ where: { exerciseId, ...(competency ? { competency } : {}) }, include: { company: true }, orderBy: [{ competency: "asc" }, { rank: "asc" }] }),
    db.vafMonthlySummary.findMany({ where: { exerciseId, ...(competency ? { competency } : {}) } }),
    db.vafRepasse.findMany({ where: { exerciseId, ...(competency ? { competency } : {}) }, orderBy: { competency: "asc" } }),
    db.vafMunicipalIndex.findMany({ where: { exerciseId }, orderBy: { competency: "asc" } }),
    db.vafEstimate.findMany({ where: { exerciseId, ...(competency ? { competency } : {}) }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.vafCrossCheck.findMany({ where: { exerciseId, ...(competency ? { competency } : {}), status: "ABERTA" }, take: 200 }),
  ]);
  const byCompany = new Map<string, { company: string; vaf: number }>();
  for (const r of results) {
    const cur = byCompany.get(r.companyId) ?? { company: r.company.corporateName, vaf: 0 };
    cur.vaf = Number((cur.vaf + num(r.vafValue)).toFixed(2));
    byCompany.set(r.companyId, cur);
  }
  const ranking = [...byCompany.entries()].map(([companyId, v]) => ({ companyId, ...v })).sort((a, b) => b.vaf - a.vaf);
  const total = ranking.reduce((s, r) => s + r.vaf, 0);
  const ranked = ranking.map((r, i) => ({ ...r, participation: total > 0 ? Number(((r.vaf / total) * 100).toFixed(2)) : 0, rank: i + 1 }));
  const monthly = new Map<string, number>();
  for (const r of results) monthly.set(r.competency, Number(((monthly.get(r.competency) ?? 0) + num(r.vafValue)).toFixed(2)));
  const evolution = monthlyTrend([...monthly.entries()].map(([competency, value]) => ({ competency, value })));
  const abc = abcCurve(ranked.map((r) => ({ label: r.company, value: r.vaf })));
  const repasseTotal = repasses.reduce((s, r) => s + num(r.municipalValue), 0);
  const attributed = financialReturn(repasseTotal || 0, total || 1, ranked.map((r) => ({ companyId: r.companyId, vaf: r.vaf })));
  const simples = results.filter((r) => r.isSimples).map((r) => ({ company: r.company.corporateName, competency: r.competency, vaf: num(r.vafValue) }));
  const byCfop = new Map<string, { saida: number; entrada: number; vaf: number }>();
  for (const s of summaries) {
    const cur = byCfop.get(s.cfop) ?? { saida: 0, entrada: 0, vaf: 0 };
    cur.saida += num(s.efdSaida) || num(s.giaSaida);
    cur.entrada += num(s.efdEntrada) || num(s.giaEntrada);
    cur.vaf += num(s.vafCalculated);
    byCfop.set(s.cfop, cur);
  }
  return { ranking: ranked, total: Number(total.toFixed(2)), evolution, abc, repasses: repasses.map((r) => ({ competency: r.competency, week: r.weekNumber, municipal: num(r.municipalValue), state: num(r.stateTotalValue) })), repasseTotal: Number(repasseTotal.toFixed(2)), attributed, indices, estimates: estimates.map((e) => ({ id: e.id, competency: e.competency, method: e.method, realized: num(e.realizedValue), estimated: num(e.estimatedValue) })), simples, byCfop: [...byCfop.entries()].map(([cfop, v]) => ({ cfop, ...v })), openIssues: crossChecks.length, resultsCount: results.length };
}

export async function listVafOverview(db: PrismaClient, year?: number) {
  const exercises = await db.vafExercise.findMany({ orderBy: { year: "asc" } });
  const exercise = (year ? exercises.find((e) => e.year === year) : exercises.find((e) => e.year === 2026)) ?? exercises[0];
  if (!exercise) return { exercises, exercise: null as never, companies: [], rules: [], imports: [], results: [], repasses: [], notifications: [], crossChecks: [], reports: null as never };
  const [companies, rules, efd, gia, results, repasses, notifications, crossChecks, protocols, activities] = await Promise.all([
    db.vafCompany.findMany({ include: { accountant: true }, orderBy: { corporateName: "asc" }, take: 200 }),
    db.vafRule.findMany({ where: { exerciseId: exercise.id }, orderBy: [{ cfop: "asc" }, { createdAt: "desc" }], take: 200 }),
    db.vafEfdImport.findMany({ where: { exerciseId: exercise.id }, orderBy: { importedAt: "desc" }, take: 100 }),
    db.vafGiaImport.findMany({ where: { exerciseId: exercise.id }, orderBy: { importedAt: "desc" }, take: 100 }),
    db.vafResult.findMany({ where: { exerciseId: exercise.id }, include: { company: true }, orderBy: [{ competency: "asc" }, { rank: "asc" }], take: 200 }),
    db.vafRepasse.findMany({ where: { exerciseId: exercise.id }, orderBy: { competency: "asc" }, take: 100 }),
    db.vafNotification.findMany({ where: { exerciseId: exercise.id }, orderBy: { sentAt: "desc" }, take: 100 }),
    db.vafCrossCheck.findMany({ where: { exerciseId: exercise.id }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.vafProtocol.findMany({ where: { exerciseId: exercise.id }, orderBy: { receivedAt: "desc" }, take: 100 }),
    db.vafActivity.findMany({ where: { exerciseId: exercise.id }, orderBy: { openedAt: "desc" }, take: 100 }),
  ]);
  const reports = await vafReports(db, exercise.id);
  return { exercises, exercise, companies, rules, imports: [...efd.map((i) => ({ ...i, kind: "EFD" as const })), ...gia.map((i) => ({ ...i, kind: "GIA" as const }))], results, repasses, notifications, crossChecks, protocols, activities, reports };
}
