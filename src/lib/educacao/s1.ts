export type EducacensoRow = {
  line: number;
  type: string;
  fields: string[];
};

export function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function parseEducacensoFile(content: string): EducacensoRow[] {
  return content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((raw, index) => ({ raw: raw.trim(), line: index + 1 }))
    .filter(({ raw }) => raw.length > 0)
    .map(({ raw, line }) => {
      const separator = raw.includes(";") ? ";" : ",";
      const fields = raw.split(separator).map((field) => field.trim());
      return { line, type: (fields.shift() || "").toUpperCase(), fields };
    });
}

export function validateEducacensoRows(rows: EducacensoRow[]) {
  const supported = new Set(["ESCOLA", "PROFISSIONAL", "TURMA", "ESTUDANTE"]);
  const issues: { line: number; message: string }[] = [];
  for (const row of rows) {
    if (!supported.has(row.type)) issues.push({ line: row.line, message: `Tipo de registro ${row.type || "vazio"} não reconhecido.` });
    if (row.fields.length < 2) issues.push({ line: row.line, message: "Registro sem identificador e nome." });
  }
  return issues;
}

export function intervalsOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

export function validateScheduleInterval(startTime: string, endTime: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)
    && startTime < endTime;
}

export function makeSupportCode(year: number, studentCode: string) {
  return `MAT-${year}-${studentCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-12)}`;
}
