export type CertificationStatus = "VENCIDA" | "VENCE_EM_BREVE" | "VIGENTE" | "SEM_VALIDADE";

type DateValue = Date | string | null | undefined;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function dateOnly(value: DateValue) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  if (!match) return null;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (
    date.getUTCFullYear() !== Number(match[1])
    || date.getUTCMonth() !== Number(match[2]) - 1
    || date.getUTCDate() !== Number(match[3])
  ) {
    return null;
  }
  return date;
}

export function dateInputValue(value: DateValue) {
  const date = dateOnly(value);
  if (!date) return "";
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function formatDate(value: DateValue) {
  const date = dateOnly(value);
  if (!date) return "Não informada";
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

export function certificationStatus(validUntil: DateValue, referenceDate: DateValue = new Date()): {
  code: CertificationStatus;
  label: string;
} {
  const validity = dateOnly(validUntil);
  if (!validity) return { code: "SEM_VALIDADE", label: "Sem validade informada" };

  const reference = dateOnly(referenceDate) ?? new Date();
  const warningDate = new Date(reference);
  warningDate.setUTCDate(warningDate.getUTCDate() + 30);
  const formattedValidity = formatDate(validity);

  if (validity < reference) return { code: "VENCIDA", label: `Vencida em ${formattedValidity}` };
  if (validity <= warningDate) return { code: "VENCE_EM_BREVE", label: `Vence em ${formattedValidity}` };
  return { code: "VIGENTE", label: `Vigente até ${formattedValidity}` };
}

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

export function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
