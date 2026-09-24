export type GenericWorkflowStagePolicy = {
  position: number;
  slaCalendarDays: number;
  requiresSignedDocument: boolean;
  requiredDocumentClassId: string | null;
};

export type GenericWorkflowDocumentEvidence = {
  documentClassId: string | null;
  hasSignedFinalVersion: boolean;
};

export function assertGenericWorkflowDefinitionMutable(status: string) {
  if (status !== "DRAFT") throw new Error("Versoes publicadas do fluxo generico sao imutaveis.");
}

export function assertGenericWorkflowDefinitionCanPublish(status: string, stages: GenericWorkflowStagePolicy[]) {
  if (status !== "DRAFT") throw new Error("Somente versoes em rascunho podem ser publicadas.");
  if (!stages.length) throw new Error("Uma versao publicada precisa ter ao menos uma etapa.");
  const ordered = [...stages].sort((left, right) => left.position - right.position);
  ordered.forEach((stage, index) => {
    if (stage.position !== index + 1 || stage.slaCalendarDays < 1) {
      throw new Error("As etapas devem ter posicoes sequenciais e SLA em dias corridos positivos.");
    }
    if (stage.requiresSignedDocument && !stage.requiredDocumentClassId) {
      throw new Error("Etapas com documento obrigatorio precisam informar a classe documental.");
    }
  });
}

export function assertGenericWorkflowTransition(input: {
  action: "APPROVE" | "RETURN" | "REJECT" | "CONCLUDE";
  currentPosition: number;
  totalStages: number;
  openedByUsuarioId: string;
  actorUsuarioId: string;
}) {
  if (input.action === "APPROVE") {
    if (input.actorUsuarioId === input.openedByUsuarioId) throw new Error("Quem abriu o processo nao pode aprovar etapas.");
    if (input.currentPosition >= input.totalStages) throw new Error("A ultima etapa deve ser concluida, nao encaminhada.");
    return { fromPosition: input.currentPosition, toPosition: input.currentPosition + 1 };
  }
  if (input.action === "RETURN") {
    if (input.currentPosition <= 1) throw new Error("A primeira etapa nao pode ser devolvida.");
    return { fromPosition: input.currentPosition, toPosition: input.currentPosition - 1 };
  }
  if (input.action === "CONCLUDE") {
    if (input.actorUsuarioId === input.openedByUsuarioId) throw new Error("Quem abriu o processo nao pode conclui-lo.");
    if (input.currentPosition !== input.totalStages) throw new Error("Somente a ultima etapa pode concluir o processo.");
  }
  return { fromPosition: input.currentPosition, toPosition: null };
}

export function assertRequiredSignedProcessDocument(stage: Pick<GenericWorkflowStagePolicy, "requiresSignedDocument" | "requiredDocumentClassId">, documents: GenericWorkflowDocumentEvidence[]) {
  if (!stage.requiresSignedDocument) return;
  const hasEvidence = documents.some((document) => (
    document.documentClassId === stage.requiredDocumentClassId && document.hasSignedFinalVersion
  ));
  if (!hasEvidence) throw new Error("A etapa exige documento do processo finalizado e assinado.");
}

function assertTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
  } catch {
    throw new Error("Fuso horario da instancia invalido.");
  }
}

function zonedParts(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day"), hour: read("hour"), minute: read("minute"), second: read("second") };
}

function localDateTimeToUtc(timeZone: string, year: number, month: number, day: number, hour: number, minute: number, second: number, millisecond: number) {
  let utc = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  // Re-evaluate the timezone offset so calendar days remain correct across DST changes.
  for (let index = 0; index < 2; index += 1) {
    const actual = zonedParts(new Date(utc), timeZone);
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second, millisecond);
    utc += Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - actualAsUtc;
  }
  return new Date(utc);
}

// SLA is measured in calendar days in the instance timezone and expires at the local end of that day.
export function calculateGenericWorkflowDeadline(startedAt: Date, slaCalendarDays: number, timeZone: string) {
  if (!Number.isInteger(slaCalendarDays) || slaCalendarDays < 1) throw new Error("SLA da etapa invalido.");
  assertTimeZone(timeZone);
  const local = zonedParts(startedAt, timeZone);
  const target = new Date(Date.UTC(local.year, local.month - 1, local.day + slaCalendarDays));
  return localDateTimeToUtc(timeZone, target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate(), 23, 59, 59, 999);
}
