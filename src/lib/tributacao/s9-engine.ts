import { Prisma } from "@prisma/client";

export class TributarioS9Error extends Error {}

const money = (value: Prisma.Decimal | string | number, label: string) => {
  const result = new Prisma.Decimal(String(value)).toDecimalPlaces(2);
  if (!result.isFinite() || result.lessThan(0)) throw new TributarioS9Error(`${label} inválido.`);
  return result;
};

const num = (value: Prisma.Decimal | string | number | null | undefined) => Number(money(value ?? 0, "Valor").toString());

// TRI-341 — Validação antes da inscrição: cadastro suficiente para identificar e localizar.
export function validateEnrollmentEligibility(input: {
  taxpayerActive: boolean;
  hasIdentification: boolean;
  hasAddress: boolean;
  debtStatus: string;
  debtValue: Prisma.Decimal | string | number;
  alreadyEnrolled: boolean;
  suspended: boolean;
}) {
  const reasons: string[] = [];
  if (!input.taxpayerActive) reasons.push("Contribuinte inativo.");
  if (!input.hasIdentification) reasons.push("Identificação do contribuinte insuficiente.");
  if (!input.hasAddress) reasons.push("Endereço para localização insuficiente.");
  if (["Pago", "Cancelado"].includes(input.debtStatus)) reasons.push("Débito pago ou cancelado não é elegível.");
  if (money(input.debtValue, "Débito").lessThanOrEqualTo(0)) reasons.push("Valor do débito inválido.");
  if (input.alreadyEnrolled) reasons.push("Débito já inscrito — nova inscrição duplicaria a dívida.");
  if (input.suspended) reasons.push("Suspensão impeditiva vigente.");
  return { eligible: reasons.length === 0, reasons };
}

// TRI-347/348 — Numeração e versionamento da CDA.
export function formatCdaNumber(year: number, sequence: number) {
  if (!Number.isInteger(year) || !Number.isInteger(sequence) || sequence < 1) throw new TributarioS9Error("Numeração de CDA inválida.");
  return `CDA-${year}-${String(sequence).padStart(7, "0")}`;
}

export function nextCdaVersion(existingVersions: number) {
  if (!Number.isInteger(existingVersions) || existingVersions < 0) throw new TributarioS9Error("Contagem de versões inválida.");
  return existingVersions + 1;
}

// TRI-373..380 — Máquina de estados do protesto. Sem convênio real: nenhum estado afirma protesto efetivado.
const PROTEST_FLOW: Record<string, Record<string, string>> = {
  SELECIONADA: { PREPARAR_REMESSA: "REMESSA_PREPARADA" },
  REMESSA_PREPARADA: { REGISTRAR_RETORNO: "EM_ACOMPANHAMENTO" },
  EM_ACOMPANHAMENTO: { BAIXAR_PAGAMENTO: "BAIXADA_PAGAMENTO", CANCELAR: "CANCELADA", ANUIR: "ANUIDA" },
};

export function protestNext(current: string, action: "PREPARAR_REMESSA" | "REGISTRAR_RETORNO" | "BAIXAR_PAGAMENTO" | "CANCELAR" | "ANUIR") {
  const next = PROTEST_FLOW[current]?.[action];
  if (!next) throw new TributarioS9Error(`Transição de protesto inválida: ${current} + ${action}.`);
  return next;
}

// TRI-346/388..398 — Máquina de estados da execução fiscal. Protocolos sempre internos.
const EXECUTION_FLOW: Record<string, Record<string, string>> = {
  EM_PREPARO: { ENVIAR_PROCURADORIA: "NA_PROCURADORIA" },
  NA_PROCURADORIA: { REGISTRAR_PROTOCOLO: "PROTOCOLADO_INTERNO", DEVOLVER: "EM_PREPARO" },
  PROTOCOLADO_INTERNO: { REGISTRAR_MNI: "MNI_REGISTRO_INTERNO", ACOMPANHAR: "EM_ACOMPANHAMENTO" },
  MNI_REGISTRO_INTERNO: { ACOMPANHAR: "EM_ACOMPANHAMENTO" },
  EM_ACOMPANHAMENTO: { REGISTRAR_RETORNO: "RETORNADO", ENCERRAR: "ENCERRADO" },
  RETORNADO: { ENCERRAR: "ENCERRADO", REABRIR: "EM_ACOMPANHAMENTO" },
};

export function executionNext(current: string, action: "ENVIAR_PROCURADORIA" | "DEVOLVER" | "REGISTRAR_PROTOCOLO" | "REGISTRAR_MNI" | "ACOMPANHAR" | "REGISTRAR_RETORNO" | "REABRIR" | "ENCERRAR") {
  const next = EXECUTION_FLOW[current]?.[action];
  if (!next) throw new TributarioS9Error(`Transição de execução inválida: ${current} + ${action}.`);
  return next;
}

export function internalProtocol(prefix: "EXEC" | "MNI", year: number, sequence: number) {
  if (!Number.isInteger(year) || !Number.isInteger(sequence) || sequence < 1) throw new TributarioS9Error("Protocolo interno inválido.");
  return `INT-${prefix}-${year}-${String(sequence).padStart(6, "0")}`;
}

// TRI-415/432/434 — Ocupação de sepulturas e vagas.
export function graveHasVacancy(grave: { status: string; capacity: number; occupantCount: number }) {
  return grave.status !== "INTERDITADA" && grave.occupantCount < grave.capacity;
}

export function occupancyStats(graves: { capacity: number; occupantCount: number }[]) {
  const capacity = graves.reduce((sum, row) => sum + Math.max(0, row.capacity), 0);
  const occupied = graves.reduce((sum, row) => sum + Math.min(Math.max(0, row.occupantCount), Math.max(0, row.capacity)), 0);
  const free = capacity - occupied;
  return { graves: graves.length, capacity, occupied, free, rate: capacity ? Number(((occupied / capacity) * 100).toFixed(2)) : 0 };
}

// TRI-428 — Situação da concessão temporária/indeterminada.
export function concessionSituation(concession: { concessionType: string; status: string; endsAt?: Date | string | null }, now = new Date()) {
  if (concession.status === "CANCELADA") return "CANCELADA";
  if (concession.concessionType === "INDETERMINADA") return "VIGENTE";
  if (!concession.endsAt) return "VIGENTE";
  return new Date(concession.endsAt).getTime() < now.getTime() ? "VENCIDA" : "VIGENTE";
}

// TRI-437..444 — Agregações do BI sobre linhas reais (sem arrays hard-coded).
export function sumBy<T extends Record<string, unknown>>(rows: T[], key: (row: T) => string, value: (row: T) => Prisma.Decimal | string | number | null | undefined) {
  const grouped = new Map<string, { count: number; total: number }>();
  for (const row of rows) {
    const label = key(row);
    const current = grouped.get(label) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total = Number(new Prisma.Decimal(current.total).plus(num(value(row))).toFixed(2));
    grouped.set(label, current);
  }
  return [...grouped.entries()].map(([label, aggregates]) => ({ label, ...aggregates })).sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

export function trendByMonth(rows: { date: Date | string; value: Prisma.Decimal | string | number | null | undefined }[]) {
  return sumBy(rows, (row) => { const date = new Date(row.date); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }, (row) => row.value)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function collectionRate(predicted: Prisma.Decimal | string | number, realized: Prisma.Decimal | string | number) {
  const expected = money(predicted, "Previsto");
  const actual = money(realized, "Realizado");
  return { predicted: expected, realized: actual, rate: expected.greaterThan(0) ? Number(actual.div(expected).mul(100).toFixed(2)) : 0 };
}
