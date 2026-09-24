import path from "node:path";
import { loadExcelDemoSource } from "../src/lib/demo-seed/excel-source";
import { EXCEL_DEMO_IMPORT_MANIFEST, validateImportManifest } from "../src/lib/demo-seed/import-manifest";

function argumentValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function validateArguments() {
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--validate-only" || argument === "--dry-run") continue;
    if (argument === "--source") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Informe um diretório após --source.");
      index += 1;
      continue;
    }
    throw new Error(`Argumento desconhecido: ${argument}.`);
  }
}

async function main() {
  validateArguments();
  const validateOnly = process.argv.includes("--validate-only") || process.argv.includes("--dry-run");
  const sourceDirectory = path.resolve(argumentValue("--source") ?? path.join(process.cwd(), "docs", "POC"));
  const source = await loadExcelDemoSource(sourceDirectory);
  const manifest = validateImportManifest(source.tables.keys());
  const modes = Object.values(EXCEL_DEMO_IMPORT_MANIFEST).reduce<Record<string, number>>((totals, item) => {
    totals[item.mode] = (totals[item.mode] ?? 0) + 1;
    return totals;
  }, {});

  console.log(JSON.stringify({
    sourceDirectory,
    files: source.files,
    tables: source.tables.size,
    rows: source.totalRows,
    checksum: source.checksum,
    foreignKeyChecks: source.foreignKeyChecks,
    validationIssues: source.issues.length,
    manifest: { ...modes, missing: manifest.missing, stale: manifest.stale },
  }, null, 2));

  if (source.issues.length || manifest.missing.length || manifest.stale.length) {
    for (const issue of source.issues.slice(0, 50)) console.error(`[${issue.code}] ${issue.sheet ?? ""}:${issue.row ?? ""} ${issue.message}`);
    throw new Error("A base Excel ou o manifesto de importação não passou na validação.");
  }
  if (validateOnly) return;

  await import("./load-local-environment");
  process.env.DATABASE_URL ??= process.env.DATABASE_URL_UNPOOLED;
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_UNPOOLED ou DATABASE_URL não configurada.");
  const { createPrismaClient } = await import("../src/lib/prisma");
  const prisma = createPrismaClient(process.env.DATABASE_URL);
  try {
    const { seedExcelDemo } = await import("../src/lib/demo-seed/seed");
    const result = await seedExcelDemo(prisma, source);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

