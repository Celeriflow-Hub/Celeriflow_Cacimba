import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";

export const EXCEL_DEMO_FILES = [
  "CeleriFlow_v2_01_Pessoas_Territorio_RH.xlsx",
  "CeleriFlow_v2_02_Educacao_Saude_Compras.xlsx",
  "CeleriFlow_v2_03_Estoque_Patrimonio_Frota.xlsx",
] as const;

export const EXCEL_DEMO_CHECKSUM = "5cfeaf287bf3a49585a74f18d2841f5ff1c1a63110f8906c99be267606c3122b";

export type DemoScalar = string | number | boolean | Date | null;
export type DemoRow = Record<string, DemoScalar>;

export type DemoTable = {
  fileName: string;
  name: string;
  headers: string[];
  rows: DemoRow[];
  primaryKey: string;
};

export type DemoValidationIssue = {
  code: string;
  message: string;
  sheet?: string;
  row?: number;
};

export type ExcelDemoSource = {
  directory: string;
  files: string[];
  tables: Map<string, DemoTable>;
  checksum: string;
  totalRows: number;
  issues: DemoValidationIssue[];
  foreignKeyChecks: number;
};

const BUSINESS_SHEET = /^(\d{2})_/;

function scalar(value: ExcelJS.CellValue): DemoScalar {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") {
    if ("result" in value) return scalar(value.result as ExcelJS.CellValue);
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("hyperlink" in value && typeof value.hyperlink === "string") {
      return "text" in value && typeof value.text === "string" ? value.text : value.hyperlink;
    }
  }
  return String(value);
}

function stableScalar(value: DemoScalar) {
  return value instanceof Date ? value.toISOString() : value;
}

function isBusinessSheet(name: string) {
  const match = BUSINESS_SHEET.exec(name);
  if (!match) return false;
  const number = Number(match[1]);
  return number >= 5 && number <= 73;
}

async function readWorkbook(filePath: string) {
  const input = await readFile(filePath);
  const zip = await JSZip.loadAsync(input);
  let normalized = false;

  // Os arquivos fornecidos usam o prefixo `x:` para o namespace principal do
  // SpreadsheetML. O Excel aceita essa forma, mas o parser do ExcelJS 4 espera
  // as tags principais sem prefixo. A normalização ocorre apenas em memória.
  for (const entry of Object.values(zip.files)) {
    if (entry.dir || !entry.name.endsWith(".xml")) continue;
    const xml = await entry.async("string");
    if (!xml.includes("<x:")) continue;
    zip.file(entry.name, xml
      .replace(/(<\/?)(?:x):/g, "$1")
      .replace(/\sxmlns:x=(['"])(.*?)\1/, " xmlns=$1$2$1"));
    normalized = true;
  }

  const workbook = new ExcelJS.Workbook();
  const readOptions = { ignoreNodes: ["tableParts"] };
  if (normalized) {
    const normalizedBuffer = await zip.generateAsync({ type: "nodebuffer" });
    await workbook.xlsx.load(normalizedBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0], readOptions);
  } else {
    await workbook.xlsx.load(input as unknown as Parameters<typeof workbook.xlsx.load>[0], readOptions);
  }
  return workbook;
}

function readTable(fileName: string, worksheet: ExcelJS.Worksheet): DemoTable {
  const firstRowValues = worksheet.getRow(1).values;
  const headers = (Array.isArray(firstRowValues) ? firstRowValues : [])
    .slice(1)
    .map((value) => String(scalar(value as ExcelJS.CellValue) ?? "").trim());
  while (headers.at(-1) === "") headers.pop();
  if (!headers.length || headers.some((header) => !header)) {
    throw new Error(`Cabeçalho inválido em ${worksheet.name}.`);
  }
  const duplicateHeader = headers.find((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeader) throw new Error(`Cabeçalho duplicado em ${worksheet.name}: ${duplicateHeader}.`);

  const rows: DemoRow[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values = headers.map((_, index) => scalar(row.getCell(index + 1).value));
    if (values.every((value) => value === null || value === "")) continue;
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index]])));
  }
  return { fileName, name: worksheet.name, headers, rows, primaryKey: headers[0] };
}

function readExpectedVolumes(workbook: ExcelJS.Workbook) {
  const worksheet = workbook.getWorksheet("02_Volumes");
  if (!worksheet) throw new Error("A aba 02_Volumes não foi encontrada.");
  const table = readTable("controle", worksheet);
  return new Map(table.rows.map((row) => [String(row.aba), Number(row.registros_gerados)]));
}

function readForeignKeys(workbook: ExcelJS.Workbook) {
  const worksheet = workbook.getWorksheet("03_Dicionario");
  if (!worksheet) throw new Error("A aba 03_Dicionario não foi encontrada.");
  const table = readTable("controle", worksheet);
  return table.rows.flatMap((row) => {
    const relation = String(row.chave_ou_relacao ?? "");
    if (!relation.includes("FK")) return [];
    const targets = relation.match(/\b\d{2}_[A-Za-z_]+\b/g) ?? [];
    return targets.length
      ? [{ source: String(row.aba), field: String(row.campo), targets }]
      : [];
  });
}

function validateSource(
  tables: Map<string, DemoTable>,
  expectedVolumes: Map<string, number>,
  foreignKeys: Array<{ source: string; field: string; targets: string[] }>,
) {
  const issues: DemoValidationIssue[] = [];

  for (const [sheet, expected] of expectedVolumes) {
    const table = tables.get(sheet);
    if (!table) {
      issues.push({ code: "MISSING_SHEET", sheet, message: `Tabela ${sheet} ausente no conjunto.` });
      continue;
    }
    if (table.rows.length !== expected) {
      issues.push({
        code: "ROW_COUNT_MISMATCH",
        sheet,
        message: `${sheet}: ${table.rows.length} registros; esperado ${expected}.`,
      });
    }
  }

  for (const table of tables.values()) {
    const seen = new Set<string>();
    table.rows.forEach((row, index) => {
      const key = row[table.primaryKey];
      if (key === null || key === "") {
        issues.push({ code: "EMPTY_PK", sheet: table.name, row: index + 2, message: "Chave primária vazia." });
        return;
      }
      const normalized = String(key);
      if (seen.has(normalized)) {
        issues.push({ code: "DUPLICATE_PK", sheet: table.name, row: index + 2, message: `Chave duplicada: ${normalized}.` });
      }
      seen.add(normalized);
      if ("origem_dado" in row && row.origem_dado !== "SINTETICO") {
        issues.push({ code: "INVALID_ORIGIN", sheet: table.name, row: index + 2, message: "origem_dado deve ser SINTETICO." });
      }
    });
  }

  let foreignKeyChecks = 0;
  for (const relation of foreignKeys) {
    const source = tables.get(relation.source);
    const targetTables = relation.targets.map((target) => tables.get(target)).filter(Boolean) as DemoTable[];
    if (!source || !source.headers.includes(relation.field) || !targetTables.length) continue;
    const valid = new Set(targetTables.flatMap((target) => target.rows.map((row) => String(row[target.primaryKey]))));
    foreignKeyChecks += 1;
    source.rows.forEach((row, index) => {
      const value = row[relation.field];
      if (value === null || value === "") return;
      if (!valid.has(String(value))) {
        issues.push({
          code: "ORPHAN_FK",
          sheet: source.name,
          row: index + 2,
          message: `${relation.field}=${String(value)} não existe em ${relation.targets.join(" ou ")}.`,
        });
      }
    });
  }
  return { issues, foreignKeyChecks };
}

export async function loadExcelDemoSource(directory = path.join(process.cwd(), "docs", "POC")): Promise<ExcelDemoSource> {
  const tables = new Map<string, DemoTable>();
  const workbooks: ExcelJS.Workbook[] = [];

  for (const fileName of EXCEL_DEMO_FILES) {
    const workbook = await readWorkbook(path.join(directory, fileName));
    workbooks.push(workbook);
    workbook.eachSheet((worksheet) => {
      if (!isBusinessSheet(worksheet.name)) return;
      if (tables.has(worksheet.name)) throw new Error(`Tabela repetida entre arquivos: ${worksheet.name}.`);
      tables.set(worksheet.name, readTable(fileName, worksheet));
    });
  }

  const expectedVolumes = readExpectedVolumes(workbooks[0]);
  const foreignKeys = readForeignKeys(workbooks[0]);
  const { issues, foreignKeyChecks } = validateSource(tables, expectedVolumes, foreignKeys);
  const ordered = [...tables.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const checksum = createHash("sha256")
    .update(JSON.stringify(ordered.map((table) => [
      table.name,
      table.headers,
      table.rows.map((row) => table.headers.map((header) => stableScalar(row[header]))),
    ])))
    .digest("hex");
  if (checksum !== EXCEL_DEMO_CHECKSUM) {
    issues.push({
      code: "CHECKSUM_MISMATCH",
      message: `Checksum da fonte Excel divergente: ${checksum}.`,
    });
  }

  return {
    directory,
    files: [...EXCEL_DEMO_FILES],
    tables,
    checksum,
    totalRows: ordered.reduce((total, table) => total + table.rows.length, 0),
    issues,
    foreignKeyChecks,
  };
}

export function requireTable(source: ExcelDemoSource, name: string) {
  const table = source.tables.get(name);
  if (!table) throw new Error(`Tabela obrigatória ausente: ${name}.`);
  return table;
}

export function text(row: DemoRow, field: string, fallback = "") {
  const value = row[field];
  return value === null || value === undefined ? fallback : String(value).trim();
}

export function numberValue(row: DemoRow, field: string, fallback = 0) {
  const value = row[field];
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function dateValue(row: DemoRow, field: string) {
  const value = row[field];
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === "number") return new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) throw new Error(`Data inválida em ${field}: ${String(value)}.`);
  return parsed;
}

export function optionalDateValue(row: DemoRow, field: string) {
  const value = row[field];
  return value === null || value === "" ? null : dateValue(row, field);
}

export function activeStatus(value: DemoScalar) {
  return !/inativ|cancelad|baixad|vago/i.test(String(value ?? ""));
}
