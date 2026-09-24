import type { SupplierListItem } from "./supplier-types";
import { certificationStatus, formatCnpj, formatCpf, formatDate } from "./supplier-utils";

function csvCell(value: string | number) {
  const stringValue = String(value);
  const safeValue = /^[\t\r\n ]*[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function supplierIdentity(supplier: SupplierListItem) {
  if (supplier.person) return { type: "PF", name: supplier.person.fullName, document: formatCpf(supplier.person.cpf), documents: supplier.person.documents };
  if (supplier.company) return { type: "PJ", name: supplier.company.corporateName, document: formatCnpj(supplier.company.cnpj), documents: supplier.company.documents };
  return { type: "Não informado", name: "Identidade não informada", document: "", documents: [] };
}

export function buildSupplierCertificationCsv(suppliers: SupplierListItem[], referenceDate = new Date()) {
  const headers = [
    "Fornecedor",
    "Tipo",
    "CPF/CNPJ",
    "Situação cadastral",
    "Enquadramento empresarial",
    "Categoria",
    "Ramo de atividade",
    "CNAE principal",
    "CNAEs secundários",
    "Validade das certidões",
    "Situação da validade",
    "Evidências da identidade",
  ];
  const rows = suppliers.map((supplier) => {
    const identity = supplierIdentity(supplier);
    const certification = certificationStatus(supplier.certificationsValidUntil, referenceDate);
    const evidence = identity.documents
      .map((document) => `${document.title} (${document.documentType}; ${document.status}; ${document.validUntil ? formatDate(document.validUntil) : "sem validade"})`)
      .join(" | ");
    return [
      identity.name,
      identity.type,
      identity.document,
      supplier.status,
      supplier.company?.companyType ?? "Não se aplica",
      supplier.category ?? "",
      supplier.businessBranch ?? "",
      supplier.company?.primaryCnae ?? "",
      supplier.company?.secondaryCnaes ?? "",
      supplier.certificationsValidUntil ? formatDate(supplier.certificationsValidUntil) : "",
      certification.label,
      evidence,
    ];
  });
  return `${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
