export const healthAppointmentStatuses = [
  "Agendado",
  "Confirmado",
  "Aguardando",
  "Em Atendimento",
  "Atendido",
  "Faltou",
  "Cancelado",
] as const;

export const healthAppointmentTransitionTargets = [
  "Confirmado",
  "Aguardando",
  "Em Atendimento",
  "Faltou",
  "Cancelado",
] as const;

export type HealthAppointmentStatus = (typeof healthAppointmentStatuses)[number];
export type HealthAppointmentTransitionTarget = (typeof healthAppointmentTransitionTargets)[number];

export class HealthAppointmentPolicyError extends Error {}

const allowedTransitions: Record<HealthAppointmentStatus, readonly HealthAppointmentStatus[]> = {
  Agendado: ["Confirmado", "Aguardando", "Em Atendimento", "Faltou", "Cancelado"],
  Confirmado: ["Aguardando", "Em Atendimento", "Faltou", "Cancelado"],
  Aguardando: ["Em Atendimento", "Faltou", "Cancelado"],
  "Em Atendimento": ["Atendido"],
  Atendido: [],
  Faltou: [],
  Cancelado: [],
};

export function parseHealthAppointmentStatus(value: string): HealthAppointmentStatus {
  if ((healthAppointmentStatuses as readonly string[]).includes(value)) {
    return value as HealthAppointmentStatus;
  }
  throw new HealthAppointmentPolicyError("O agendamento possui um status invalido e precisa ser revisado antes de receber nova operacao.");
}

export function assertHealthAppointmentTransition(current: string, next: HealthAppointmentTransitionTarget) {
  const status = parseHealthAppointmentStatus(current);
  if (!allowedTransitions[status].includes(next)) {
    throw new HealthAppointmentPolicyError(`Nao e permitido alterar um agendamento de ${status} para ${next}.`);
  }
}

export function assertHealthAppointmentCanBeCompleted(status: string) {
  const current = parseHealthAppointmentStatus(status);
  if (!["Agendado", "Confirmado", "Aguardando", "Em Atendimento"].includes(current)) {
    throw new HealthAppointmentPolicyError("Somente agendamentos pendentes ou em atendimento podem receber um prontuario.");
  }
}

export function assertHealthAppointmentCanBeCompletedAt(date: Date, now = new Date()) {
  if (date.getTime() > now.getTime()) {
    throw new HealthAppointmentPolicyError("O atendimento nao pode ser concluido antes da data e horario agendados.");
  }
}

export function isBlockingHealthAppointmentStatus(status: string) {
  return !["Cancelado", "Faltou"].includes(status);
}

export function parseBrazilDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new HealthAppointmentPolicyError("Informe data e horario validos.");

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const calendarDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    throw new HealthAppointmentPolicyError("Informe uma data e horario existentes.");
  }

  return new Date(`${value}:00-03:00`);
}
