import type { Prisma, PrismaClient } from "@prisma/client";
import type { SupplierListItem } from "./supplier-types";
import { dateInputValue, dateOnly } from "./supplier-utils";

export const SUPPLIER_PAGE_SIZE = 20;

const supplierStatuses = ["ALL", "Ativo", "Inativo", "Suspenso"] as const;
const supplierClassifications = ["ALL", "ME", "EPP", "ME_EPP"] as const;
const certificationFilters = ["ALL", "VENCIDA", "VENCE_EM_BREVE", "VIGENTE", "SEM_VALIDADE"] as const;

export type SupplierStatusFilter = (typeof supplierStatuses)[number];
export type SupplierClassificationFilter = (typeof supplierClassifications)[number];
export type CertificationFilter = (typeof certificationFilters)[number];

export type SupplierFilters = {
  query: string;
  status: SupplierStatusFilter;
  classification: SupplierClassificationFilter;
  certification: CertificationFilter;
  validFrom: string;
  validUntil: string;
  page: number;
};

const supplierSelect = {
  id: true,
  category: true,
  businessBranch: true,
  bankData: true,
  certificationsValidUntil: true,
  notes: true,
  status: true,
  person: {
    select: {
      fullName: true,
      cpf: true,
      documents: {
        select: { title: true, documentType: true, status: true, validUntil: true },
        orderBy: [{ validUntil: "asc" }, { createdAt: "asc" }],
      },
    },
  },
  company: {
    select: {
      corporateName: true,
      tradeName: true,
      cnpj: true,
      companyType: true,
      primaryCnae: true,
      secondaryCnaes: true,
      documents: {
        select: { title: true, documentType: true, status: true, validUntil: true },
        orderBy: [{ validUntil: "asc" }, { createdAt: "asc" }],
      },
    },
  },
} satisfies Prisma.SupplierSelect;

type SupplierRow = Prisma.SupplierGetPayload<{ select: typeof supplierSelect }>;
type SearchParameter = string | string[] | undefined;

function firstValue(value: SearchParameter) {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.trim() : "";
}

function allowedValue<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? value as T : fallback;
}

function validDateParameter(value: string) {
  return dateInputValue(value);
}

function validPage(value: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function endOfUtcDay(value: Date) {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

function supplierItem(row: SupplierRow): SupplierListItem {
  const document = (item: { title: string; documentType: string; status: string; validUntil: Date | null }) => ({
    title: item.title,
    documentType: item.documentType,
    status: item.status,
    validUntil: dateInputValue(item.validUntil) || null,
  });

  return {
    id: row.id,
    category: row.category,
    businessBranch: row.businessBranch,
    bankData: row.bankData,
    certificationsValidUntil: dateInputValue(row.certificationsValidUntil) || null,
    notes: row.notes,
    status: row.status,
    person: row.person ? {
      fullName: row.person.fullName,
      cpf: row.person.cpf,
      documents: (row.person.documents || []).map(document),
    } : null,
    company: row.company ? {
      corporateName: row.company.corporateName,
      tradeName: row.company.tradeName,
      cnpj: row.company.cnpj,
      companyType: row.company.companyType,
      primaryCnae: row.company.primaryCnae,
      secondaryCnaes: row.company.secondaryCnaes,
      documents: (row.company.documents || []).map(document),
    } : null,
  };
}

export function parseSupplierFilters(input: Record<string, SearchParameter>): SupplierFilters {
  const query = firstValue(input.q).slice(0, 150);
  return {
    query,
    status: allowedValue(firstValue(input.status), supplierStatuses, "ALL"),
    classification: allowedValue(firstValue(input.classification), supplierClassifications, "ALL"),
    certification: allowedValue(firstValue(input.certification), certificationFilters, "ALL"),
    validFrom: validDateParameter(firstValue(input.validFrom)),
    validUntil: validDateParameter(firstValue(input.validUntil)),
    page: validPage(firstValue(input.page)),
  };
}

export function supplierFilterSearchParams(filters: SupplierFilters, includePage = true) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status !== "ALL") params.set("status", filters.status);
  if (filters.classification !== "ALL") params.set("classification", filters.classification);
  if (filters.certification !== "ALL") params.set("certification", filters.certification);
  if (filters.validFrom) params.set("validFrom", filters.validFrom);
  if (filters.validUntil) params.set("validUntil", filters.validUntil);
  if (includePage && filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function hasActiveSupplierFilters(filters: SupplierFilters) {
  return Boolean(
    filters.query
    || filters.status !== "ALL"
    || filters.classification !== "ALL"
    || filters.certification !== "ALL"
    || filters.validFrom
    || filters.validUntil,
  );
}

export function buildSupplierWhere(filters: SupplierFilters, referenceDate = new Date()): Prisma.SupplierWhereInput {
  const conditions: Prisma.SupplierWhereInput[] = [];

  if (filters.query) {
    const normalizedIdentifier = filters.query.replace(/\D/g, "");
    const query = filters.query;
    const searchConditions: Prisma.SupplierWhereInput[] = [
      { person: { is: { fullName: { contains: query, mode: "insensitive" } } } },
      { company: { is: { corporateName: { contains: query, mode: "insensitive" } } } },
      { company: { is: { tradeName: { contains: query, mode: "insensitive" } } } },
      { company: { is: { companyType: { contains: query, mode: "insensitive" } } } },
    ];
    if (normalizedIdentifier) {
      searchConditions.push(
        { person: { is: { cpf: { contains: normalizedIdentifier } } } },
        { company: { is: { cnpj: { contains: normalizedIdentifier } } } },
      );
    }

    const exactStatus = supplierStatuses.find((status) => status !== "ALL" && status.toLocaleLowerCase("pt-BR") === query.toLocaleLowerCase("pt-BR"));
    searchConditions.push(exactStatus ? { status: exactStatus } : { status: { contains: query, mode: "insensitive" } });
    if (query.replace(/\s/g, "").toUpperCase() === "ME/EPP") {
      searchConditions.push({ company: { is: { companyType: { in: ["ME", "EPP"] } } } });
    }
    conditions.push({ OR: searchConditions });
  }

  if (filters.status !== "ALL") conditions.push({ status: filters.status });
  if (filters.classification === "ME") conditions.push({ company: { is: { companyType: "ME" } } });
  if (filters.classification === "EPP") conditions.push({ company: { is: { companyType: "EPP" } } });
  if (filters.classification === "ME_EPP") conditions.push({ company: { is: { companyType: { in: ["ME", "EPP"] } } } });

  const today = dateOnly(referenceDate) ?? new Date();
  const thirtyDaysFromToday = new Date(today);
  thirtyDaysFromToday.setUTCDate(thirtyDaysFromToday.getUTCDate() + 30);
  if (filters.certification === "VENCIDA") conditions.push({ certificationsValidUntil: { lt: today } });
  if (filters.certification === "VENCE_EM_BREVE") {
    conditions.push({ certificationsValidUntil: { gte: today, lte: endOfUtcDay(thirtyDaysFromToday) } });
  }
  if (filters.certification === "VIGENTE") conditions.push({ certificationsValidUntil: { gt: endOfUtcDay(thirtyDaysFromToday) } });
  if (filters.certification === "SEM_VALIDADE") conditions.push({ certificationsValidUntil: null });

  const validFrom = dateOnly(filters.validFrom);
  const validUntil = dateOnly(filters.validUntil);
  if (validFrom || validUntil) {
    conditions.push({
      certificationsValidUntil: {
        ...(validFrom ? { gte: validFrom } : {}),
        ...(validUntil ? { lte: endOfUtcDay(validUntil) } : {}),
      },
    });
  }

  return conditions.length ? { AND: conditions } : {};
}

export async function getSupplierList(prisma: PrismaClient, filters: SupplierFilters, referenceDate = new Date()) {
  const where = buildSupplierWhere(filters, referenceDate);
  const total = await prisma.supplier.count({ where });
  const pageCount = Math.ceil(total / SUPPLIER_PAGE_SIZE);
  const page = total ? Math.min(filters.page, pageCount) : 1;
  const rows = await prisma.supplier.findMany({
    where,
    select: supplierSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * SUPPLIER_PAGE_SIZE,
    take: SUPPLIER_PAGE_SIZE,
  });
  return { suppliers: rows.map(supplierItem), total, page, pageCount };
}

export async function getSupplierReportRows(prisma: PrismaClient, filters: SupplierFilters, referenceDate = new Date()) {
  const rows = await prisma.supplier.findMany({
    where: buildSupplierWhere(filters, referenceDate),
    select: supplierSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(supplierItem);
}
