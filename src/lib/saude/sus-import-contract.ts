import { z } from "zod";

export const healthSusSources = ["CNES", "CADSUS", "SIA", "SIGTAP"] as const;
export type HealthSusSource = (typeof healthSusSources)[number];

export const healthSusImportInputSchema = z.object({
  source: z.enum(healthSusSources),
  competence: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Informe a competência no formato AAAA-MM."),
  origin: z.string().trim().min(2, "Informe a origem do arquivo.").max(120),
}).strict();

export type HealthSusRecord = {
  rowNumber: number;
  values: Record<string, string>;
};

const MAX_RECORDS = 2_000;

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === "\"") {
      if (quoted && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (quoted) throw new Error("O arquivo possui aspas não encerradas.");
  values.push(current.trim());
  return values;
}

function delimiterFor(header: string) {
  const candidates = [";", ",", "\t"];
  return candidates.sort((left, right) => header.split(right).length - header.split(left).length)[0];
}

function csvRows(content: string) {
  const rows: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === "\"") {
      current += character;
      if (quoted && content[index + 1] === "\"") {
        current += content[index + 1];
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && content[index + 1] === "\n") index += 1;
      if (current.trim()) rows.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  if (quoted) throw new Error("O arquivo possui aspas não encerradas.");
  if (current.trim()) rows.push(current);
  return rows;
}

function parseCsv(content: string): HealthSusRecord[] {
  const lines = csvRows(content.replace(/^\uFEFF/, ""));
  if (lines.length < 2) throw new Error("O arquivo deve conter cabeçalho e ao menos um registro.");
  const delimiter = delimiterFor(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeKey);
  if (headers.some(header => !header) || new Set(headers).size !== headers.length) throw new Error("O cabeçalho possui colunas vazias ou repetidas.");
  const records = lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line, delimiter);
    if (cells.length !== headers.length) throw new Error(`A linha ${index + 2} possui quantidade de colunas diferente do cabeçalho.`);
    const values = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]?.trim() || ""]));
    return { rowNumber: index + 2, values };
  });
  if (records.length > MAX_RECORDS) throw new Error(`O arquivo excede o limite de ${MAX_RECORDS} registros por carga.`);
  return records;
}

function parseXml(content: string): HealthSusRecord[] {
  const records: HealthSusRecord[] = [];
  const recordPattern = /<(registro|unidade|profissional|equipe|habilitacao|paciente|procedimento|cbo|especialidade|servico|cid|classificacao)(?:\s+[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = recordPattern.exec(content)) !== null) {
    const values: Record<string, string> = {};
    const openingTag = match[0].slice(0, match[0].indexOf(">") + 1);
    const typeAttribute = openingTag.match(/\btipo\s*=\s*["']([^"']+)["']/i)?.[1];
    values.tipo = normalizeKey(typeAttribute || match[1]);
    const fieldPattern = /<([a-zA-Z_][\w.-]*)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/\1>/g;
    let field: RegExpExecArray | null;
    while ((field = fieldPattern.exec(match[2])) !== null) values[normalizeKey(field[1])] = decodeXml(field[2]);
    records.push({ rowNumber: records.length + 1, values });
  }
  if (!records.length) throw new Error("O XML não contém registros reconhecidos pelo contrato local controlado.");
  if (records.length > MAX_RECORDS) throw new Error(`O arquivo excede o limite de ${MAX_RECORDS} registros por carga.`);
  return records;
}

export function parseHealthSusImport(content: string, extension: string) {
  if (!content.trim()) throw new Error("O arquivo está vazio.");
  if (extension === "xml") return parseXml(content);
  if (extension === "csv" || extension === "txt") return parseCsv(content);
  throw new Error("Use um arquivo XML, CSV ou TXT.");
}

export function healthSusRecordValue(record: HealthSusRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record.values[normalizeKey(key)];
    if (value?.trim()) return value.trim();
  }
  return "";
}

export function healthSusRecordHas(record: HealthSusRecord, ...keys: string[]) {
  return keys.some(key => Object.hasOwn(record.values, normalizeKey(key)));
}

export function normalizeHealthSusEntity(value: string) {
  const normalized = normalizeKey(value);
  const aliases: Record<string, string> = {
    health_unit: "unidade",
    unidade_saude: "unidade",
    professional: "profissional",
    health_professional: "profissional",
    team: "equipe",
    health_team: "equipe",
    patient: "paciente",
    procedure: "procedimento",
    specialty: "especialidade",
    service: "servico",
  };
  return aliases[normalized] || normalized;
}
