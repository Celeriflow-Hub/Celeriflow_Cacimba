import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

type Db = PrismaClient;

export const publicFinancialReportOptions = [
  { type: "RREO", label: "RREO" },
  { type: "RGF", label: "RGF" },
  { type: "BALANCETE", label: "Balancete Contábil" },
  { type: "BALANCO_ORCAMENTARIO", label: "Balanço Orçamentário" },
  { type: "BALANCO_PATRIMONIAL", label: "Balanço Patrimonial" },
  { type: "PCA", label: "Prestação de Contas Anual (PCA)" },
] as const;

export type PublicFinancialReportType = (typeof publicFinancialReportOptions)[number]["type"];

const annualReportTypes = new Set<PublicFinancialReportType>(["BALANCO_ORCAMENTARIO", "BALANCO_PATRIMONIAL"]);

export function isPublicFinancialReportType(value: string | null): value is PublicFinancialReportType {
  return publicFinancialReportOptions.some((option) => option.type === value);
}

// A deterministic type associates a generated report document to its exercise without relying on its title.
export function publicFinancialReportDocumentType(financialYearId: string, reportType: PublicFinancialReportType) {
  return `PUBLIC_FINANCIAL_REPORT:${financialYearId}:${reportType}`;
}

function maskDocument(doc?: string | null): string {
  if (!doc) return "NÃO INFORMADO";
  const clean = doc.replace(/\D/g, "");
  if (clean.length === 11) return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
  if (clean.length === 14) return `${clean.slice(0, 2)}.***.${clean.slice(5, 8)}/${clean.slice(8, 12)}-**`;
  return "PROTEGIDO POR LGPD";
}

function publicSupplier(supplier: {
  person: { fullName: string; cpf: string } | null;
  company: { corporateName: string; tradeName: string | null; cnpj: string } | null;
}) {
  if (supplier.person) return { name: "PESSOA FÍSICA", documentMasked: maskDocument(supplier.person.cpf) };
  if (supplier.company) return { name: supplier.company.tradeName || supplier.company.corporateName, documentMasked: maskDocument(supplier.company.cnpj) };
  return { name: "NÃO INFORMADO", documentMasked: "NÃO INFORMADO" };
}

export async function getPublicFinancialReportSnapshots(db: Db) {
  const years = await db.financialYear.findMany({
    select: {
      id: true,
      year: true,
      annualAccountingCloses: { select: { status: true, closedAt: true } },
    },
    orderBy: { year: "desc" },
  });
  const documents = await db.document.findMany({
    where: {
      status: "Publicado",
      documentType: { in: years.flatMap((year) => publicFinancialReportOptions.map((report) => publicFinancialReportDocumentType(year.id, report.type))) },
    },
    select: {
      id: true,
      documentType: true,
      versions: {
        where: { status: { in: ["FINAL", "SIGNED"] } },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true, finalizedAt: true },
      },
    },
  });
  const documentsByType = new Map(documents.map((document) => [document.documentType, document]));

  return years.flatMap((year) => publicFinancialReportOptions.flatMap((report) => {
    if (annualReportTypes.has(report.type) && !year.annualAccountingCloses.some((close) => close.status === "ENCERRADO")) return [];
    const document = documentsByType.get(publicFinancialReportDocumentType(year.id, report.type));
    const version = document?.versions[0];
    if (!document || !version) return [];
    return [{
      year: year.year,
      type: report.type,
      label: report.label,
      version: version.versionNumber,
      finalizedAt: version.finalizedAt,
      annualCloseAt: annualReportTypes.has(report.type) ? year.annualAccountingCloses.find((close) => close.status === "ENCERRADO")?.closedAt ?? null : null,
    }];
  }));
}

export async function getPublicFinancialReportSnapshot(
  db: Db,
  input: { year: number; reportType: PublicFinancialReportType; version?: number },
) {
  const financialYear = await db.financialYear.findUnique({
    where: { year: input.year },
    select: { id: true, annualAccountingCloses: { select: { status: true } } },
  });
  if (!financialYear) return null;
  if (annualReportTypes.has(input.reportType) && !financialYear.annualAccountingCloses.some((close) => close.status === "ENCERRADO")) return null;

  const document = await db.document.findFirst({
    where: {
      status: "Publicado",
      documentType: publicFinancialReportDocumentType(financialYear.id, input.reportType),
    },
    select: {
      versions: {
        where: {
          status: { in: ["FINAL", "SIGNED"] },
          ...(input.version ? { versionNumber: input.version } : {}),
        },
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: { fileUrl: true, versionNumber: true },
      },
    },
  });
  return document?.versions[0] ?? null;
}

export async function getPublicContracts(db: Db) {
  const contracts = await db.contract.findMany({
    where: { status: { notIn: ["Minuta", "Rascunho", "Em Elaboração"] } },
    include: {
      supplier: { include: { person: { select: { fullName: true, cpf: true } }, company: { select: { corporateName: true, tradeName: true, cnpj: true } } } },
      process: { select: { number: true, modality: true } },
      secretariat: { select: { name: true } },
    },
    orderBy: { startDate: "desc" },
    take: 100,
  });
  return contracts.map((contract) => ({
    number: contract.number,
    object: contract.object,
    initialValue: contract.initialValue,
    updatedValue: contract.updatedValue,
    startDate: contract.startDate,
    endDate: contract.endDate,
    status: contract.status,
    supplier: publicSupplier(contract.supplier),
    processNumber: contract.process.number,
    modality: contract.process.modality,
    secretariat: contract.secretariat.name,
  }));
}

export async function getPublicBiddings(db: Db) {
  const biddings = await db.bidding.findMany({
    where: { publicationDate: { not: null }, status: { notIn: ["Em Elaboração", "Rascunho"] } },
    include: { process: { select: { number: true, object: true, estimatedValue: true, secretariat: { select: { name: true } } } } },
    orderBy: { publicationDate: "desc" },
    take: 100,
  });
  return biddings.map((bidding) => ({
    number: bidding.number,
    modality: bidding.modality,
    status: bidding.status,
    publicationDate: bidding.publicationDate!,
    sessionDate: bidding.sessionDate,
    processNumber: bidding.process.number,
    object: bidding.process.object,
    estimatedValue: bidding.process.estimatedValue,
    secretariat: bidding.process.secretariat.name,
  }));
}

export async function publishApprovedSnapshot(
  db: Db,
  input: {
    financialYearId: string;
    reportType: PublicFinancialReportType;
    title: string;
    fileUrl: string;
    versionNumber?: number;
  },
) {
  const year = await db.financialYear.findUnique({ where: { id: input.financialYearId } });
  if (!year) throw new Error("Exercício financeiro não encontrado.");

  if (annualReportTypes.has(input.reportType)) {
    const closed = await db.annualAccountingClose.findFirst({ where: { financialYearId: year.id, status: "ENCERRADO" } });
    if (!closed) throw new Error("Balanços anuais e PCA exigem o encerramento anual concluído.");
  }

  const docType = publicFinancialReportDocumentType(year.id, input.reportType);
  let document = await db.document.findFirst({ where: { documentType: docType } });

  if (!document) {
    document = await db.document.create({
      data: {
        title: input.title,
        documentType: docType,
        fileUrl: input.fileUrl,
        status: "Publicado",
      },
    });
  }

  const lastVersion = await db.documentVersion.findFirst({
    where: { documentId: document.id },
    orderBy: { versionNumber: "desc" },
  });

  const nextVersion = input.versionNumber ?? (lastVersion ? lastVersion.versionNumber + 1 : 1);
  const hashSha256 = createHash("sha256").update(input.fileUrl).digest("hex");

  const version = await db.documentVersion.create({
    data: {
      documentId: document.id,
      versionNumber: nextVersion,
      fileUrl: input.fileUrl,
      hashSha256,
      status: "FINAL",
      finalizedAt: new Date(),
    },
  });

  return { documentId: document.id, versionId: version.id, versionNumber: version.versionNumber };
}

export function getPublicHelpFaqAndContactInfo() {
  return {
    portalInfo: {
      title: "Portal da Transparência Pública — Município de Lagoa Seca / PB",
      lawRef: "Lei Complementar nº 131/2009 & Lei nº 12.527/2011 (Lei de Acesso à Informação - LAI)",
      description: "Garantia de acesso amplo, simultâneo e em tempo real a todas as informações financeiras, orçamentárias, patrimoniais, licitações e contratos públicos.",
    },
    faq: [
      {
        question: "Como consultar os gastos públicos da Prefeitura?",
        answer: "Acesse a aba 'Despesas Públicas' e filtre por ano, unidade gestora, natureza de despesa ou fornecedor. Todos os campos de processo, empenho, liquidação e pagamento estão disponíveis.",
      },
      {
        question: "Onde encontro os balanços anuais, RREO e RGF oficiais?",
        answer: "Na seção 'Demonstrativos Fiscais', são publicados automaticamente os snapshots oficiais do RREO, RGF, Balancetes e Prestação de Contas Anual (PCA).",
      },
      {
        question: "Os dados públicos são idênticos aos dados da contabilidade interna?",
        answer: "Sim. O sistema utiliza um Motor de Reconciliação em Tempo Real que valida que o valor total de despesas e receitas expostas no portal bate centavo a centavo (R$ 0,00 de divergência) com o razão contábil.",
      },
      {
        question: "Como solicitar dados adicionais via e-SIC (Transparência Passiva)?",
        answer: "Acesse o módulo e-SIC, preencha o requerimento com seu identificador público e receba o número de protocolo com prazo legal de resposta monitorado.",
      },
    ],
    contact: {
      ombudsmanName: "Ouvidoria Geral e Serviço de Informação ao Cidadão (e-SIC)",
      address: "Rua Cicero Faustino da Silva, 647 - Centro, Lagoa Seca - PB, CEP 58117-000",
      email: "transparencia@lagoaseca.pb.gov.br",
      phone: "(83) 3366-1020",
      openingHours: "Segunda a Sexta-feira, das 07h00 às 13h00",
    },
  };
}
