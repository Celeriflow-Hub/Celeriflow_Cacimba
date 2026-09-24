import "dotenv/config";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const CID_URL = "https://raw.githubusercontent.com/SidneyBissoli/cid10-br-mcp/master/data/CID-10-SUBCATEGORIAS.CSV";
const SIGTAP_URL = "https://raw.githubusercontent.com/RicardoHerrero/SIGTAP-dataSUS/main/tabelas/TabelaUnificada_202310_v2310101444/tb_procedimento.txt";

async function source(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao obter catálogo (${response.status}): ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return { content: new TextDecoder("windows-1252").decode(bytes), checksum: createHash("sha256").update(bytes).digest("hex") };
}

function chunks<T>(items: T[], size = 1000) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function cidCode(raw: string) {
  const code = raw.trim().toUpperCase();
  return code.length > 3 ? `${code.slice(0, 3)}.${code.slice(3)}` : code;
}

async function importCids(actorUsuarioId: string) {
  const file = await source(CID_URL);
  const existing = await prisma.healthSusImportBatch.findUnique({ where: { source_competence_checksum: { source: "SIA", competence: "2022-01", checksum: file.checksum } }, select: { id: true } });
  if (existing) return prisma.healthSusReference.count({ where: { sourceBatchId: existing.id, kind: "CID" } });
  const records = file.content.split(/\r?\n/).slice(1).map(line => line.split(";")).filter(columns => columns[0]?.trim() && columns[4]?.trim()).map(columns => ({ code: cidCode(columns[0]), classification: columns[1]?.trim() || null, description: columns[4].trim() }));
  await prisma.$transaction(async tx => {
    const batch = await tx.healthSusImportBatch.create({ data: { source: "SIA", competence: "2022-01", origin: `Ministério da Saúde/DATASUS CID-10 · ${CID_URL}`, fileName: "CID-10-SUBCATEGORIAS.CSV", fileFormat: "CSV", contractVersion: "F1-C/catalog-v1", checksum: file.checksum, actorUsuarioId }, select: { id: true } });
    await tx.healthSusReference.updateMany({ where: { source: "SIA", kind: "CID", isCurrent: true }, data: { isCurrent: false } });
    for (const group of chunks(records)) await tx.healthSusReference.createMany({ data: group.map(item => ({ ...item, source: "SIA", competence: "2022-01", kind: "CID", sourceBatchId: batch.id })) });
    await tx.healthSusImportBatch.update({ where: { id: batch.id }, data: { status: "COMPLETED", processedCount: records.length, insertedCount: records.length, completedAt: new Date() } });
  }, { timeout: 120_000 });
  return records.length;
}

async function importProcedures(actorUsuarioId: string) {
  const file = await source(SIGTAP_URL);
  const existing = await prisma.healthSusImportBatch.findUnique({ where: { source_competence_checksum: { source: "SIGTAP", competence: "2023-10", checksum: file.checksum } }, select: { id: true } });
  if (existing) return prisma.healthSusProcedure.count({ where: { sourceBatchId: existing.id } });
  const complexity: Record<string, string> = { "0": "Não se aplica", "1": "Atenção básica", "2": "Média complexidade", "3": "Alta complexidade" };
  const records = file.content.split(/\r?\n/).filter(line => line.length >= 260).map(line => ({ code: line.slice(0, 10).trim(), description: line.slice(10, 260).trim(), complexity: complexity[line.slice(260, 261)] || null, allowedSex: line.slice(261, 262).trim() || null, groupCode: line.slice(0, 2), subgroupCode: line.slice(0, 4), financing: line.slice(312, 314).trim() || null })).filter(item => item.code && item.description);
  await prisma.$transaction(async tx => {
    const batch = await tx.healthSusImportBatch.create({ data: { source: "SIGTAP", competence: "2023-10", origin: `Ministério da Saúde/DATASUS SIGTAP · ${SIGTAP_URL}`, fileName: "tb_procedimento.txt", fileFormat: "TXT", contractVersion: "F1-C/catalog-v1", checksum: file.checksum, actorUsuarioId }, select: { id: true } });
    await tx.healthSusProcedure.updateMany({ where: { source: "SIGTAP", isCurrent: true }, data: { isCurrent: false } });
    for (const group of chunks(records)) await tx.healthSusProcedure.createMany({ data: group.map(item => ({ ...item, source: "SIGTAP", competence: "2023-10", sourceBatchId: batch.id })) });
    await tx.healthSusImportBatch.update({ where: { id: batch.id }, data: { status: "COMPLETED", processedCount: records.length, insertedCount: records.length, completedAt: new Date() } });
  }, { timeout: 120_000 });
  return records.length;
}

async function main() {
  const actor = await prisma.usuario.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Não existe usuário ativo para registrar a autoria da carga SUS.");
  const [cids, procedures] = await Promise.all([importCids(actor.id), importProcedures(actor.id)]);
  console.log(`Catálogos persistidos: ${cids} CIDs e ${procedures} procedimentos SIGTAP.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
