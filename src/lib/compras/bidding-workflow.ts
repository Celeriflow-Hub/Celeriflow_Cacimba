export const BIDDING_MODALITIES = [
  "Pregão Eletrônico",
  "Pregão Presencial",
  "Concorrência",
  "Tomada de Preços",
  "Convite",
  "Leilão",
  "Concurso",
] as const;

export type BiddingModality = (typeof BIDDING_MODALITIES)[number];

export const BIDDING_STATUS = {
  DRAFT: "Em Elaboração",
  PUBLISHED: "Publicado",
  OPEN: "Aberto",
  JUDGMENT: "Em Julgamento",
  HOMOLOGATED: "Homologado",
  CONCLUDED: "Concluída",
  SUSPENDED: "Suspensa",
  ANNULLED: "Anulada",
  CANCELLED: "Cancelada",
  DESERTED: "Deserta",
  FAILED: "Fracassada",
  REVOKED: "Revogada",
  INACTIVE: "Inativa",
} as const;

export type BiddingStatus = (typeof BIDDING_STATUS)[keyof typeof BIDDING_STATUS];

export const BIDDING_PHASE_STATUS = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  SUSPENDED: "Suspensa",
  INTERRUPTED: "Interrompida",
} as const;

export const BIDDING_LOT_STATUS = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  OPEN: "Aberto",
  JUDGMENT: "Em Julgamento",
  AWARDED: "Arrematado",
  HOMOLOGATED: "Homologado",
  CONCLUDED: "Concluído",
  SUSPENDED: "Suspenso",
  CLOSED: "Encerrado",
} as const;

export const BIDDING_ELIGIBILITY_STATUS = {
  ELIGIBLE: "Habilitado",
  INELIGIBLE: "Inabilitado",
} as const;

export const BIDDING_BID_STATUS = {
  ACCEPTED: "Aceito",
} as const;

export const BIDDING_RESULT_STATUS = {
  AWARDED: "Arrematado",
} as const;

export class BiddingWorkflowError extends Error {}

const statuses = new Set<BiddingStatus>(Object.values(BIDDING_STATUS));

const statusAliases = new Map<string, BiddingStatus>([
  ["Rascunho", BIDDING_STATUS.DRAFT],
  ["Em Andamento", BIDDING_STATUS.OPEN],
  ["Em Disputa", BIDDING_STATUS.OPEN],
  ["Publicada", BIDDING_STATUS.PUBLISHED],
  ["Suspenso", BIDDING_STATUS.SUSPENDED],
  ["Cancelado", BIDDING_STATUS.CANCELLED],
  ["Fracassado", BIDDING_STATUS.FAILED],
  ["Concluído", BIDDING_STATUS.CONCLUDED],
  ["Concluido", BIDDING_STATUS.CONCLUDED],
]);

const allowedTransitions: Record<BiddingStatus, readonly BiddingStatus[]> = {
  [BIDDING_STATUS.DRAFT]: [
    BIDDING_STATUS.PUBLISHED,
    BIDDING_STATUS.CANCELLED,
    BIDDING_STATUS.ANNULLED,
    BIDDING_STATUS.REVOKED,
    BIDDING_STATUS.INACTIVE,
  ],
  [BIDDING_STATUS.PUBLISHED]: [
    BIDDING_STATUS.OPEN,
    BIDDING_STATUS.SUSPENDED,
    BIDDING_STATUS.DESERTED,
    BIDDING_STATUS.CANCELLED,
    BIDDING_STATUS.ANNULLED,
    BIDDING_STATUS.REVOKED,
    BIDDING_STATUS.INACTIVE,
  ],
  [BIDDING_STATUS.OPEN]: [
    BIDDING_STATUS.JUDGMENT,
    BIDDING_STATUS.SUSPENDED,
    BIDDING_STATUS.DESERTED,
    BIDDING_STATUS.FAILED,
    BIDDING_STATUS.CANCELLED,
    BIDDING_STATUS.ANNULLED,
    BIDDING_STATUS.REVOKED,
    BIDDING_STATUS.INACTIVE,
  ],
  [BIDDING_STATUS.JUDGMENT]: [
    BIDDING_STATUS.HOMOLOGATED,
    BIDDING_STATUS.SUSPENDED,
    BIDDING_STATUS.FAILED,
    BIDDING_STATUS.CANCELLED,
    BIDDING_STATUS.ANNULLED,
    BIDDING_STATUS.REVOKED,
    BIDDING_STATUS.INACTIVE,
  ],
  [BIDDING_STATUS.HOMOLOGATED]: [BIDDING_STATUS.CONCLUDED],
  [BIDDING_STATUS.CONCLUDED]: [],
  [BIDDING_STATUS.SUSPENDED]: [
    BIDDING_STATUS.PUBLISHED,
    BIDDING_STATUS.OPEN,
    BIDDING_STATUS.JUDGMENT,
    BIDDING_STATUS.CANCELLED,
    BIDDING_STATUS.ANNULLED,
    BIDDING_STATUS.REVOKED,
    BIDDING_STATUS.INACTIVE,
  ],
  [BIDDING_STATUS.ANNULLED]: [],
  [BIDDING_STATUS.CANCELLED]: [],
  [BIDDING_STATUS.DESERTED]: [],
  [BIDDING_STATUS.FAILED]: [],
  [BIDDING_STATUS.REVOKED]: [],
  [BIDDING_STATUS.INACTIVE]: [],
};

const terminalStatuses = new Set<BiddingStatus>([
  BIDDING_STATUS.CONCLUDED,
  BIDDING_STATUS.ANNULLED,
  BIDDING_STATUS.CANCELLED,
  BIDDING_STATUS.DESERTED,
  BIDDING_STATUS.FAILED,
  BIDDING_STATUS.REVOKED,
  BIDDING_STATUS.INACTIVE,
]);

export const BIDDING_PHASES = [
  "Preparação",
  "Publicação",
  "Abertura",
  "Julgamento",
  "Homologação",
  "Conclusão",
] as const;

export const BIDDING_PHASE_DEFINITIONS = [
  { code: "PREPARATION", name: BIDDING_PHASES[0], sequence: 1 },
  { code: "PUBLICATION", name: BIDDING_PHASES[1], sequence: 2 },
  { code: "OPENING", name: BIDDING_PHASES[2], sequence: 3 },
  { code: "JUDGMENT", name: BIDDING_PHASES[3], sequence: 4 },
  { code: "HOMOLOGATION", name: BIDDING_PHASES[4], sequence: 5 },
  { code: "CONCLUSION", name: BIDDING_PHASES[5], sequence: 6 },
] as const;

export type BiddingPhaseCode = (typeof BIDDING_PHASE_DEFINITIONS)[number]["code"];

export type BiddingPhasePlan = {
  code: BiddingPhaseCode;
  name: string;
  sequence: number;
  status: (typeof BIDDING_PHASE_STATUS)[keyof typeof BIDDING_PHASE_STATUS];
  isCurrent: boolean;
};

export function isBiddingModality(value: string): value is BiddingModality {
  return (BIDDING_MODALITIES as readonly string[]).includes(value);
}

export function biddingModalityPrefix(modality: string) {
  const normalized = modality
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");

  switch (normalized) {
    case "pregao eletronico":
      return "PE";
    case "pregao presencial":
      return "PP";
    case "concorrencia":
      return "CC";
    case "tomada de precos":
      return "TP";
    case "convite":
      return "CV";
    case "leilao":
      return "LE";
    case "concurso":
      return "CO";
    default:
      return "LIC";
  }
}

export function biddingSequenceKey(modality: string) {
  return `compras-licitacao:${biddingModalityPrefix(modality)}`;
}

export function normalizeBiddingStatus(status: string | null | undefined): BiddingStatus | null {
  const value = status?.trim();
  if (!value) return null;
  if (statuses.has(value as BiddingStatus)) return value as BiddingStatus;
  return statusAliases.get(value) ?? null;
}

export function biddingStatusLabel(status: string | null | undefined) {
  return normalizeBiddingStatus(status) ?? (status?.trim() || "Não informado");
}

export function getAllowedBiddingStatusTransitions(status: string | null | undefined) {
  const normalized = normalizeBiddingStatus(status);
  return normalized ? [...allowedTransitions[normalized]] : [];
}

export function assertBiddingStatusTransition(currentStatus: string, nextStatus: string) {
  const current = normalizeBiddingStatus(currentStatus);
  const next = statuses.has(nextStatus as BiddingStatus) ? nextStatus as BiddingStatus : null;

  if (!current) throw new BiddingWorkflowError("A situação atual da licitação não é reconhecida pelo fluxo.");
  if (!next) throw new BiddingWorkflowError("A situação de destino da licitação é inválida.");
  if (current === next) throw new BiddingWorkflowError("A licitação já está na situação selecionada.");
  if (!allowedTransitions[current].includes(next)) {
    throw new BiddingWorkflowError(`A transição de ${biddingStatusLabel(current)} para ${biddingStatusLabel(next)} não é permitida.`);
  }

  return { current, next };
}

export function canEditBiddingDetails(status: string | null | undefined) {
  return normalizeBiddingStatus(status) === BIDDING_STATUS.DRAFT;
}

export function isTerminalBiddingStatus(status: string | null | undefined) {
  const normalized = normalizeBiddingStatus(status);
  return Boolean(normalized && terminalStatuses.has(normalized));
}

export function getBiddingPhaseProgress(status: string | null | undefined) {
  switch (normalizeBiddingStatus(status)) {
    case BIDDING_STATUS.DRAFT:
      return 0;
    case BIDDING_STATUS.PUBLISHED:
      return 1;
    case BIDDING_STATUS.OPEN:
      return 2;
    case BIDDING_STATUS.JUDGMENT:
      return 3;
    case BIDDING_STATUS.HOMOLOGATED:
      return 4;
    case BIDDING_STATUS.CONCLUDED:
      return BIDDING_PHASES.length;
    default:
      return null;
  }
}

export function getBiddingPhaseCodeForStatus(status: string | null | undefined): BiddingPhaseCode | null {
  const progress = getBiddingPhaseProgress(status);
  if (progress === null || progress >= BIDDING_PHASE_DEFINITIONS.length) return null;
  return BIDDING_PHASE_DEFINITIONS.find((phase) => phase.sequence === progress + 1)?.code ?? null;
}

export function getBiddingPhasePlan(status: string | null | undefined): BiddingPhasePlan[] | null {
  const progress = getBiddingPhaseProgress(status);
  if (progress === null) return null;

  return BIDDING_PHASE_DEFINITIONS.map((phase, index) => ({
    ...phase,
    isCurrent: progress < BIDDING_PHASE_DEFINITIONS.length && index === progress,
    status: progress === BIDDING_PHASE_DEFINITIONS.length || index < progress
      ? BIDDING_PHASE_STATUS.COMPLETED
      : index === progress
        ? BIDDING_PHASE_STATUS.IN_PROGRESS
        : BIDDING_PHASE_STATUS.PENDING,
  }));
}

export function canConfigureBiddingLots(status: string | null | undefined) {
  return normalizeBiddingStatus(status) === BIDDING_STATUS.DRAFT;
}

export function canRegisterBiddingParticipant(status: string | null | undefined) {
  const normalized = normalizeBiddingStatus(status);
  return normalized === BIDDING_STATUS.DRAFT || normalized === BIDDING_STATUS.PUBLISHED;
}

export function canDecideBiddingEligibility(status: string | null | undefined) {
  const normalized = normalizeBiddingStatus(status);
  return Boolean(normalized && !terminalStatuses.has(normalized));
}

export function canDecideBiddingResult(status: string | null | undefined) {
  return normalizeBiddingStatus(status) === BIDDING_STATUS.JUDGMENT;
}

export function biddingLotStatusForBiddingStatus(status: string | null | undefined) {
  switch (normalizeBiddingStatus(status)) {
    case BIDDING_STATUS.DRAFT:
      return BIDDING_LOT_STATUS.DRAFT;
    case BIDDING_STATUS.PUBLISHED:
      return BIDDING_LOT_STATUS.PUBLISHED;
    case BIDDING_STATUS.OPEN:
      return BIDDING_LOT_STATUS.OPEN;
    case BIDDING_STATUS.JUDGMENT:
      return BIDDING_LOT_STATUS.JUDGMENT;
    case BIDDING_STATUS.HOMOLOGATED:
      return BIDDING_LOT_STATUS.HOMOLOGATED;
    case BIDDING_STATUS.CONCLUDED:
      return BIDDING_LOT_STATUS.CONCLUDED;
    case BIDDING_STATUS.SUSPENDED:
      return BIDDING_LOT_STATUS.SUSPENDED;
    default:
      return BIDDING_LOT_STATUS.CLOSED;
  }
}

export function isBiddingLotOpen(status: string | null | undefined) {
  const normalized = status?.trim().toLocaleLowerCase("pt-BR");
  return normalized === BIDDING_LOT_STATUS.OPEN.toLocaleLowerCase("pt-BR") || normalized === "em disputa";
}

export function isBiddingParticipantEligible(status: string | null | undefined) {
  return status?.trim() === BIDDING_ELIGIBILITY_STATUS.ELIGIBLE;
}

export function isBiddingBidSubmissionOpen(input: {
  biddingStatus: string | null | undefined;
  lotStatus: string | null | undefined;
  deadline: Date | null | undefined;
  now?: Date;
}) {
  const deadline = input.deadline;
  const now = input.now ?? new Date();
  return normalizeBiddingStatus(input.biddingStatus) === BIDDING_STATUS.OPEN
    && isBiddingLotOpen(input.lotStatus)
    && Boolean(deadline && Number.isFinite(deadline.getTime()) && now.getTime() < deadline.getTime());
}
