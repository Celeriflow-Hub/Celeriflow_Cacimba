export type MergeCandidatePerson = {
  id: string;
  fullName: string;
  cpf: string;
  birthDate?: Date | null;
  email?: string | null;
  phonePrimary?: string | null;
  status?: string;
};

export type MergeCandidate = {
  personId: string;
  score: number;
  reasons: string[];
};

export type PersonMergeEligibilityInput = {
  fiscal: boolean;
  financial: boolean;
  rh: boolean;
  health: boolean;
  education: boolean;
  social: boolean;
  process: boolean;
  attendance: boolean;
  signedDocument: boolean;
};

export type PersonMergeManifest = {
  version: 1;
  sourcePersonId: string;
  targetPersonId: string;
  sourcePreviousStatus: string;
  executedAt: string;
  addressIds: string[];
  documentIds: string[];
};

export type MovedMergeRecord = {
  id: string;
  personId: string | null;
  updatedAt: Date | string;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function normalizedPhone(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function sameDate(left?: Date | null, right?: Date | null) {
  return Boolean(left && right && left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10));
}

export function rankPersonMergeCandidates(source: MergeCandidatePerson, people: MergeCandidatePerson[]): MergeCandidate[] {
  return people
    .filter((person) => person.id !== source.id && person.status !== "Arquivado por mesclagem")
    .map((person) => {
      let score = 0;
      const reasons: string[] = [];
      if (normalizeText(source.fullName) && normalizeText(source.fullName) === normalizeText(person.fullName)) {
        score += 60;
        reasons.push("NOME_NORMALIZADO");
      }
      if (source.cpf && source.cpf === person.cpf) {
        score += 100;
        reasons.push("CPF_IGUAL");
      }
      if (sameDate(source.birthDate, person.birthDate)) {
        score += 20;
        reasons.push("DATA_NASCIMENTO");
      }
      if (source.email && normalizeText(source.email) === normalizeText(person.email)) {
        score += 10;
        reasons.push("EMAIL_NORMALIZADO");
      }
      if (normalizedPhone(source.phonePrimary) && normalizedPhone(source.phonePrimary) === normalizedPhone(person.phonePrimary)) {
        score += 10;
        reasons.push("TELEFONE_NORMALIZADO");
      }
      return { personId: person.id, score, reasons };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.personId.localeCompare(right.personId));
}

export function getPersonMergeEligibilityBlocks(input: PersonMergeEligibilityInput) {
  return (Object.keys(input) as (keyof PersonMergeEligibilityInput)[])
    .filter((key) => input[key])
    .map((key) => key.toUpperCase());
}

export function assertPersonMergeEligible(input: PersonMergeEligibilityInput) {
  const blocks = getPersonMergeEligibilityBlocks(input);
  if (blocks.length) throw new Error(`Pessoa de origem não elegível para mesclagem: ${blocks.join(", ")}.`);
}

export function assertDifferentSystemAdministrators(proposerUsuarioId: string, approverUsuarioId: string) {
  if (!proposerUsuarioId || !approverUsuarioId || proposerUsuarioId === approverUsuarioId) {
    throw new Error("A aprovação e execução exigem um administrador do sistema diferente do proponente.");
  }
}

export function assertMergeReversalAllowed(
  manifest: PersonMergeManifest,
  sourceStatus: string,
  targetUpdatedAt: Date | string,
  movedRecords: MovedMergeRecord[],
  sourceUpdatedAt?: Date | string,
) {
  if (sourceStatus !== "Arquivado por mesclagem") throw new Error("A origem não está arquivada por esta mesclagem.");
  const executedAt = new Date(manifest.executedAt).getTime();
  if (!Number.isFinite(executedAt)) throw new Error("Manifesto de mesclagem inválido.");
  if (sourceUpdatedAt && new Date(sourceUpdatedAt).getTime() > executedAt) throw new Error("Não é possível reverter: a pessoa de origem recebeu alterações posteriores.");
  if (new Date(targetUpdatedAt).getTime() > executedAt) throw new Error("Não é possível reverter: a pessoa de destino recebeu alterações posteriores.");
  if (movedRecords.some((record) => record.personId !== manifest.targetPersonId || new Date(record.updatedAt).getTime() > executedAt)) {
    throw new Error("Não é possível reverter: há alterações posteriores nos itens transferidos.");
  }
}
