import ExcelJS from "exceljs";
import type { InternalReportDataset, ReportRow } from "@/lib/financeiro/report-delivery";
import type { ReportEmissionMetadata, ReportInstitutionIdentity, ReportTemplatePresentation } from "./report-template";

export type TabularReportPresentation = {
  institution: ReportInstitutionIdentity | null;
  template: ReportTemplatePresentation;
  emission: ReportEmissionMetadata | null;
};

type TabularSection = { title: string; rows: ReportRow[] };

function headers(rows: ReportRow[]) {
  return [...new Set(rows.flatMap((row) => Object.keys(row)))];
}

export function formulaSafeCell(value: string | number) {
  if (typeof value === "number") return value;
  return /^[\t\r\n ]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number) {
  const safe = String(formulaSafeCell(value));
  return `"${safe.replace(/"/g, '""')}"`;
}

function templateMetadataRows(dataset: InternalReportDataset, presentation: TabularReportPresentation): ReportRow[] {
  const identity = presentation.institution;
  return [{
    titulo: dataset.title,
    exercicio: dataset.year,
    instituicao: identity?.name ?? "Instituição não configurada",
    cnpj: identity?.cnpj ?? "",
    situacaoRelatorio: dataset.metadata.status,
    escopo: dataset.metadata.scope,
    periodoReferencia: dataset.metadata.referencePeriod,
    completudeEstatutaria: dataset.metadata.statutoryCompleteness,
    snapshotPublicoElegivel: dataset.metadata.publicSnapshotEligible ? "Sim" : "Não",
    condicaoSnapshotPublico: dataset.metadata.publicSnapshotCondition,
    versaoTemplate: presentation.template.version,
    fingerprintTemplate: presentation.template.fingerprint,
    emitidoEm: presentation.emission?.issuedAt ?? "",
    emitidoPor: presentation.emission?.issuedBy ?? "",
    avisos: dataset.warnings.join(" | "),
  }];
}

function sectionsForExport(dataset: InternalReportDataset, presentation: TabularReportPresentation): TabularSection[] {
  return [{ title: "Metadados do relatório", rows: templateMetadataRows(dataset, presentation) }, ...dataset.sections];
}

function flatRows(dataset: InternalReportDataset, presentation: TabularReportPresentation) {
  const rows: ReportRow[] = sectionsForExport(dataset, presentation).flatMap((section) => section.rows.map((row) => ({ secao: section.title, ...row })));
  const rowHeaders = headers(rows);
  return { headers: rowHeaders, rows: rows.map((row) => rowHeaders.map((header) => row[header] ?? "")) };
}

export function renderTabularCsv(dataset: InternalReportDataset, presentation: TabularReportPresentation) {
  const table = flatRows(dataset, presentation);
  return `${[table.headers, ...table.rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function renderTabularTxt(dataset: InternalReportDataset, presentation: TabularReportPresentation) {
  const table = flatRows(dataset, presentation);
  const sanitize = (value: string | number) => String(formulaSafeCell(value)).replace(/[\t\r\n]+/g, " ");
  return `${[table.headers, ...table.rows].map((row) => row.map(sanitize).join("\t")).join("\r\n")}\r\n`;
}

function worksheetName(title: string, usedNames: Set<string>) {
  const base = title.replace(/[\\/?*\[\]:]/g, " ").trim().slice(0, 31) || "Dados";
  let name = base;
  let index = 2;
  while (usedNames.has(name)) {
    const suffix = ` ${index++}`;
    name = `${base.slice(0, 31 - suffix.length)}${suffix}`;
  }
  usedNames.add(name);
  return name;
}

export async function renderTabularXlsx(dataset: InternalReportDataset, presentation: TabularReportPresentation): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = presentation.institution?.name ?? "CeleriFlow";
  workbook.title = dataset.title;
  workbook.subject = `${dataset.metadata.scope} - ${dataset.metadata.referencePeriod}`;
  workbook.keywords = `template:${presentation.template.fingerprint}`;
  workbook.created = new Date();
  workbook.modified = new Date();

  const usedNames = new Set<string>();
  for (const section of sectionsForExport(dataset, presentation)) {
    const sheet = workbook.addWorksheet(worksheetName(section.title, usedNames), {
      pageSetup: { orientation: presentation.template.orientation === "LANDSCAPE" ? "landscape" : "portrait" },
    });
    const rowHeaders = headers(section.rows);
    sheet.addRow(rowHeaders);
    for (const row of section.rows) sheet.addRow(rowHeaders.map((header) => formulaSafeCell(row[header] ?? "")));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.columns = rowHeaders.map((header) => ({ key: header, width: Math.min(48, Math.max(12, header.length + 2)) }));
  }

  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

function escapeHtml(value: string | number) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function formattedInstitution(identity: ReportInstitutionIdentity | null) {
  if (!identity) return "Instituição não configurada";
  return [identity.name, identity.legalName, identity.cnpj ? `CNPJ: ${identity.cnpj}` : null, [identity.address, identity.city, identity.state].filter(Boolean).join(" - ")].filter(Boolean).join(" | ");
}

export function renderTabularPrintHtml(dataset: InternalReportDataset, presentation: TabularReportPresentation) {
  const orientation = presentation.template.orientation.toLowerCase();
  const sections = dataset.sections.map((section) => {
    const rowHeaders = headers(section.rows);
    const rows = section.rows.length
      ? section.rows.map((row) => `<tr>${rowHeaders.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${Math.max(rowHeaders.length, 1)}">Sem dados registrados para o exercício.</td></tr>`;
    return `<section><h2>${escapeHtml(section.title)}</h2><table><thead><tr>${rowHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></section>`;
  }).join("");
  const templateHeader = presentation.template.header ? `<p>${escapeHtml(presentation.template.header).replace(/\n/g, "<br>")}</p>` : "";
  const templateFooter = presentation.template.footer ? `<p>${escapeHtml(presentation.template.footer).replace(/\n/g, "<br>")}</p>` : "";
  const emission = presentation.emission ? `<p>Emitido em ${escapeHtml(presentation.emission.issuedAt)} por ${escapeHtml(presentation.emission.issuedBy)}.</p>` : "";

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(dataset.title)}</title><style>@page { size: A4 ${orientation}; margin: 14mm; } body { color: #111827; font: 11px Arial, sans-serif; } header, footer { color: #374151; } h1 { font-size: 18px; margin: 0 0 4px; } h2 { font-size: 13px; margin: 20px 0 6px; } p { margin: 3px 0; } .warning { color: #92400e; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #d1d5db; padding: 5px; text-align: left; vertical-align: top; } th { background: #f3f4f6; } section { break-inside: avoid; }</style></head><body><header>${templateHeader}<h1>${escapeHtml(dataset.title)}</h1><p>${escapeHtml(formattedInstitution(presentation.institution))}</p><p>Exercício ${dataset.year} | ${escapeHtml(dataset.metadata.scope)} | ${escapeHtml(dataset.metadata.referencePeriod)}</p><p>Template v${presentation.template.version} (${presentation.template.fingerprint})</p>${dataset.warnings.map((warning) => `<p class="warning">${escapeHtml(warning)}</p>`).join("")}</header><main>${sections}</main><footer>${templateFooter}${emission}</footer></body></html>`;
}
