import { requireValidCnpj, requireValidCpf } from "@/lib/identifiers/brazilian-identifiers";
import { dateOnly } from "./supplier-utils";

export type SupplierIdentitySelection = {
  supplierType: "PF" | "PJ";
  personId: string | null;
  companyId: string | null;
};

function trimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function formText(formData: FormData, name: string) {
  return trimmed(formData.get(name));
}

export function optionalSupplierText(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error("Valor de fornecedor inválido.");
  return value.trim() || null;
}

export function parseSupplierIdentity(input: {
  supplierType: unknown;
  personId: unknown;
  companyId: unknown;
}): SupplierIdentitySelection {
  const supplierType = trimmed(input.supplierType);
  const personId = trimmed(input.personId) || null;
  const companyId = trimmed(input.companyId) || null;

  if (supplierType !== "PF" && supplierType !== "PJ") {
    throw new Error("Tipo de fornecedor inválido.");
  }
  if (supplierType === "PF") {
    if (!personId) throw new Error("Selecione a pessoa física do fornecedor.");
    if (companyId) throw new Error("Fornecedor pessoa física não aceita pessoa jurídica ou CNPJ.");
    return { supplierType, personId, companyId: null };
  }
  if (!companyId) throw new Error("Selecione a pessoa jurídica do fornecedor.");
  if (personId) throw new Error("Fornecedor pessoa jurídica não aceita pessoa física ou CPF.");
  return { supplierType, personId: null, companyId };
}

export function validateSupplierIdentityDocument(
  selection: SupplierIdentitySelection,
  identity: { cpf?: string | null; cnpj?: string | null },
) {
  if (selection.supplierType === "PF") {
    if (!identity.cpf) throw new Error("A pessoa física selecionada não possui CPF.");
    return requireValidCpf(identity.cpf);
  }
  if (!identity.cnpj) throw new Error("A pessoa jurídica selecionada não possui CNPJ.");
  return requireValidCnpj(identity.cnpj);
}

export function validateSubmittedSupplierDocument(
  selection: SupplierIdentitySelection,
  submitted: { cpf?: unknown; cnpj?: unknown },
  canonicalDocument: string,
) {
  const cpf = trimmed(submitted.cpf);
  const cnpj = trimmed(submitted.cnpj);
  if (selection.supplierType === "PF") {
    if (cnpj) throw new Error("Fornecedor pessoa física não aceita CNPJ.");
    if (cpf && requireValidCpf(cpf) !== canonicalDocument) throw new Error("O CPF informado não corresponde à pessoa física selecionada.");
    return;
  }
  if (cpf) throw new Error("Fornecedor pessoa jurídica não aceita CPF.");
  if (cnpj && requireValidCnpj(cnpj) !== canonicalDocument) throw new Error("O CNPJ informado não corresponde à pessoa jurídica selecionada.");
}

export function parseSupplierDate(value: unknown) {
  const raw = trimmed(value);
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error("Informe uma validade de certidão válida.");
  const date = dateOnly(raw);
  if (!date) throw new Error("Informe uma validade de certidão válida.");
  date.setUTCHours(12);
  return date;
}

export function parseSupplierCnaes(input: { primaryCnae?: unknown; secondaryCnaes?: unknown }) {
  return {
    primaryCnae: optionalSupplierText(input.primaryCnae),
    secondaryCnaes: optionalSupplierText(input.secondaryCnaes),
  };
}
