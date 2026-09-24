export type IdentifierValidation = {
  normalized: string;
  valid: boolean;
};

function digits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function hasRepeatedDigits(value: string) {
  return /^(\d)\1+$/.test(value);
}

function calculateCpfDigit(value: string, factor: number) {
  const sum = value.split("").reduce((total, digit, index) => total + Number(digit) * (factor - index), 0);
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

function calculateCnpjDigit(value: string, weights: number[]) {
  const sum = value.split("").reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function validateCpf(value: string | null | undefined): IdentifierValidation {
  const normalized = digits(value);
  if (normalized.length !== 11 || hasRepeatedDigits(normalized)) return { normalized, valid: false };

  const firstDigit = calculateCpfDigit(normalized.slice(0, 9), 10);
  const secondDigit = calculateCpfDigit(normalized.slice(0, 9) + firstDigit, 11);
  return { normalized, valid: normalized === normalized.slice(0, 9) + firstDigit + secondDigit };
}

export function validateCnpj(value: string | null | undefined): IdentifierValidation {
  const normalized = digits(value);
  if (normalized.length !== 14 || hasRepeatedDigits(normalized)) return { normalized, valid: false };

  const firstDigit = calculateCnpjDigit(normalized.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateCnpjDigit(normalized.slice(0, 12) + firstDigit, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return { normalized, valid: normalized === normalized.slice(0, 12) + firstDigit + secondDigit };
}

export function validateCep(value: string | null | undefined): IdentifierValidation {
  const normalized = digits(value);
  // Brazilian CEPs have no check digit; the eight-digit format is the offline validation.
  return { normalized, valid: normalized.length === 8 };
}

export function requireValidCpf(value: string | null | undefined) {
  const result = validateCpf(value);
  if (!result.valid) throw new Error("CPF inválido.");
  return result.normalized;
}

export function requireValidCnpj(value: string | null | undefined) {
  const result = validateCnpj(value);
  if (!result.valid) throw new Error("CNPJ inválido.");
  return result.normalized;
}

export function requireValidCep(value: string | null | undefined) {
  const result = validateCep(value);
  if (!result.valid) throw new Error("CEP inválido.");
  return result.normalized;
}

// Identifier validation is deliberately local. CEP, CPF, and CNPJ lookups stay MOCK.
export const externalIdentifierLookupEnvironment = "MOCK" as const;
