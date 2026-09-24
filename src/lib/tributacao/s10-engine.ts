import { Prisma } from "@prisma/client";

export class VafError extends Error {}

const money = (value: Prisma.Decimal | string | number, label = "Valor") => {
  const result = new Prisma.Decimal(String(value)).toDecimalPlaces(2);
  if (!result.isFinite() || result.lessThan(0)) throw new VafError(`${label} inválido.`);
  return result;
};

const num = (value: Prisma.Decimal | string | number | null | undefined) => Number(new Prisma.Decimal(String(value ?? 0)).toFixed(2));

// Cenário obrigatório: VAF = saídas elegíveis - entradas elegíveis
// Empresa A: saídas=15000, entradas=9000 → VAF=6000
// Empresa B: VAF=4000
// Total=10000 → A=60%, B=40%
export function calculateVaf(input: { saidaElegivel: Prisma.Decimal | string | number; entradaElegivel: Prisma.Decimal | string | number }) {
  const saida = money(input.saidaElegivel, "Saídas elegíveis");
  const entrada = money(input.entradaElegivel, "Entradas elegíveis");
  const vaf = saida.minus(entrada).toDecimalPlaces(2);
  if (vaf.lessThan(0)) throw new VafError("VAF não pode ser negativo (entradas > saídas).");
  return { saida, entrada, vaf };
}

export function participation(totalVaf: Prisma.Decimal | string | number, companyVaf: Prisma.Decimal | string | number) {
  const total = money(totalVaf, "VAF total");
  const company = money(companyVaf, "VAF da empresa");
  if (total.lessThanOrEqualTo(0)) return { total, company, participation: new Prisma.Decimal(0) };
  return { total, company, participation: company.div(total).mul(100).toDecimalPlaces(2) };
}

// Fórmula restrita por CFOP: apenas operações aritméticas simples, sem eval.
// Suporta: saida - entrada, saida + entrada, saida * k, etc.
// Gramática: expr := term (("+" | "-") term)* ; term := factor (("*" | "/") factor)*
// factor := número | variável (saida|entrada) | "(" expr ")" | ("+"|"-") factor
export function evaluateFormula(formula: string, variables: Record<string, Prisma.Decimal | string | number>) {
  if (typeof formula !== "string" || formula.trim().length === 0 || formula.length > 200) {
    throw new VafError("Fórmula contém caracteres não permitidos.");
  }
  const vars = new Map<string, Prisma.Decimal>();
  for (const [k, v] of Object.entries(variables)) {
    try {
      vars.set(k.toLowerCase(), new Prisma.Decimal(String(v)));
    } catch {
      throw new VafError("Erro ao avaliar fórmula.");
    }
  }
  const tokenRe = /\s*([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[+\-*/()])\s*/g;
  const tokens: string[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  tokenRe.lastIndex = 0;
  while ((m = tokenRe.exec(formula)) !== null) {
    if (m.index !== lastIndex) throw new VafError("Fórmula contém caracteres não permitidos.");
    tokens.push(m[1]);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex !== formula.length || tokens.length === 0) {
    throw new VafError("Fórmula contém caracteres não permitidos.");
  }
  let pos = 0;
  const peek = () => tokens[pos];
  function parseExpr(): Prisma.Decimal {
    let left = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = tokens[pos++];
      const right = parseTerm();
      left = op === "+" ? left.plus(right) : left.minus(right);
    }
    return left;
  }
  function parseTerm(): Prisma.Decimal {
    let left = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = tokens[pos++];
      const right = parseFactor();
      if (op === "*") {
        left = left.mul(right);
      } else {
        if (right.equals(0)) throw new VafError("Erro ao avaliar fórmula.");
        left = left.div(right);
      }
    }
    return left;
  }
  function parseFactor(): Prisma.Decimal {
    const tok = peek();
    if (tok === "+" || tok === "-") {
      pos++;
      const inner = parseFactor();
      return tok === "-" ? inner.negated() : inner;
    }
    if (tok === "(") {
      pos++;
      const inner = parseExpr();
      if (peek() !== ")") throw new VafError("Erro ao avaliar fórmula.");
      pos++;
      return inner;
    }
    if (tok === undefined || tok === ")" || ["+", "-", "*", "/"].includes(tok)) {
      throw new VafError("Erro ao avaliar fórmula.");
    }
    pos++;
    if (/^\d/.test(tok)) {
      try {
        return new Prisma.Decimal(tok);
      } catch {
        throw new VafError("Erro ao avaliar fórmula.");
      }
    }
    const v = vars.get(tok.toLowerCase());
    if (v === undefined) throw new VafError("Fórmula contém caracteres não permitidos.");
    return v;
  }
  try {
    const result = parseExpr();
    if (pos !== tokens.length) throw new VafError("Erro ao avaliar fórmula.");
    if (!result.isFinite()) throw new VafError("Erro ao avaliar fórmula.");
    return result.toDecimalPlaces(2);
  } catch (e) {
    if (e instanceof VafError) throw e;
    throw new VafError("Erro ao avaliar fórmula.");
  }
}

export function mergeEfdGia(efd: { saida: Prisma.Decimal | string | number; entrada: Prisma.Decimal | string | number } | null, gia: { saida: Prisma.Decimal | string | number; entrada: Prisma.Decimal | string | number } | null, priority: "EFD" | "GIA" | "MERGED" = "EFD") {
  const e = efd ? { saida: money(efd.saida), entrada: money(efd.entrada) } : { saida: money(0), entrada: money(0) };
  const g = gia ? { saida: money(gia.saida), entrada: money(gia.entrada) } : { saida: money(0), entrada: money(0) };
  if (priority === "EFD") return e;
  if (priority === "GIA") return g;
  // MERGED: usa EFD onde existir, senão GIA (não soma)
  return { saida: e.saida.greaterThan(0) ? e.saida : g.saida, entrada: e.entrada.greaterThan(0) ? e.entrada : g.entrada };
}

export function checkContrapartida(cfop: string, requiredCfop: string | undefined, movements: { cfop: string; value: Prisma.Decimal }[]) {
  if (!requiredCfop) return { ok: true, missing: [] as string[] };
  const has = movements.some(m => m.cfop === requiredCfop);
  return { ok: has, missing: has ? [] : [requiredCfop] };
}

export function detectOmission(expectedCompanies: string[], receivedCompanies: string[]) {
  const expected = new Set(expectedCompanies);
  const received = new Set(receivedCompanies);
  return [...expected].filter(c => !received.has(c));
}

export function crossCheck(efdValue: Prisma.Decimal | string | number, giaValue: Prisma.Decimal | string | number, rule: "IGUAL" | "EFD_GTE_GIA" | "DIFERENCA_MAX" = "IGUAL", tolerance = 0) {
  const e = money(efdValue);
  const g = money(giaValue);
  const diff = e.minus(g).abs().toDecimalPlaces(2);
  let ok = false;
  if (rule === "IGUAL") ok = diff.equals(0);
  else if (rule === "EFD_GTE_GIA") ok = e.greaterThanOrEqualTo(g);
  else if (rule === "DIFERENCA_MAX") ok = diff.lessThanOrEqualTo(money(tolerance));
  return { ok, efd: e, gia: g, difference: diff };
}

export function abcCurve(values: { label: string; value: Prisma.Decimal | string | number }[], thresholds = { a: 80, b: 95 }) {
  const sorted = [...values].sort((a, b) => Number(b.value) - Number(a.value));
  const total = sorted.reduce((sum, v) => sum + Number(v.value), 0);
  let acc = 0;
  return sorted.map(v => {
    acc += Number(v.value);
    const pct = total > 0 ? (acc / total) * 100 : 0;
    let curve = "C";
    if (pct <= thresholds.a) curve = "A";
    else if (pct <= thresholds.b) curve = "B";
    return { ...v, value: Number(v.value), accumulated: Number(acc.toFixed(2)), participation: Number(pct.toFixed(2)), curve };
  });
}

export function estimateAnnual(realizedMonths: number, realizedValue: Prisma.Decimal | string | number, method: "LINEAR" | "MEDIA_MOVEL" = "LINEAR", monthsHistory: number[] = []) {
  const r = money(realizedValue);
  if (realizedMonths <= 0) throw new VafError("Meses realizados devem ser > 0.");
  if (method === "LINEAR") {
    const monthly = r.div(realizedMonths).toDecimalPlaces(2);
    return { monthly, annual: monthly.mul(12).toDecimalPlaces(2), method: "LINEAR" };
  }
  if (method === "MEDIA_MOVEL" && monthsHistory.length > 0) {
    const avg = new Prisma.Decimal(monthsHistory.reduce((s, v) => s + v, 0) / monthsHistory.length).toDecimalPlaces(2);
    return { monthly: avg, annual: avg.mul(12).toDecimalPlaces(2), method: "MEDIA_MOVEL" };
  }
  throw new VafError("Método de estimativa inválido ou histórico insuficiente.");
}

export function financialReturn(totalRepasse: Prisma.Decimal | string | number, vafAttribution: Prisma.Decimal | string | number, participations: { companyId: string; vaf: Prisma.Decimal | string | number }[]) {
  const repasse = money(totalRepasse);
  const attr = money(vafAttribution);
  if (attr.lessThanOrEqualTo(0)) throw new VafError("VAF de atribuição deve ser > 0.");
  return participations.map(p => ({
    companyId: p.companyId,
    vaf: money(p.vaf),
    return: repasse.mul(money(p.vaf)).div(attr).toDecimalPlaces(2)
  }));
}

export function protocolNumber(prefix: string, year: number, seq: number) {
  return `${prefix}-${year}-${String(seq).padStart(7, "0")}`;
}

export function academicYearFilter<T extends { exerciseId?: string; competency?: string }>(items: T[], exerciseId?: string, competency?: string) {
  return items.filter(i => (!exerciseId || i.exerciseId === exerciseId) && (!competency || i.competency === competency));
}

export function monthlyTrend(rows: { competency: string; value: Prisma.Decimal | string | number }[]) {
  return [...rows].sort((a, b) => a.competency.localeCompare(b.competency)).map(r => ({ competency: r.competency, value: num(r.value) }));
}