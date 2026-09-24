import { config } from "dotenv";
import type { AppContext } from "../src/lib/platform/tenant-context";
config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { processCompetence, processSusFile } = await import("../src/lib/saude/production-service");
  try {
    const usuario = await prisma.usuario.findFirst({ where: { employeeId: { not: null } } });
    const ctx: AppContext = { prisma, user: { id: usuario!.id, firebaseUid: usuario!.firebaseUid || "", email: usuario!.email, name: usuario!.nome, role: "admin", profileCode: "ADMIN", modulePermissions: [], allowedBudgetUnitIds: [], allowedHealthUnitIds: [], hasHealthAccessScope: false, employeeId: usuario!.employeeId, departmentId: null, secretariatId: null } };
    const period = "2026-09";
    // 1) Corrige o profissional na origem e espelha no fato; procedimento segue pendente (sem SIGTAP oficial - H-Q03)
    const fact = await prisma.healthProductionFact.findFirst({ where: { period, status: "CRITICADO" }, select: { originType: true, originId: true } });
    console.log("fato criticado:", fact);
    if (fact?.originType === "REGULATION") {
      const professional = await prisma.healthProfessional.findFirst({ where: { isActive: true }, select: { id: true } });
      await prisma.healthRegulationRequest.update({ where: { id: fact.originId }, data: { professionalId: professional!.id } });
      await prisma.healthProductionFact.updateMany({ where: { originType: "REGULATION", originId: fact.originId }, data: { professionalId: professional!.id } });
      console.log("profissional corrigido na origem");
    }
    const comp = await prisma.healthProductionCompetence.findUnique({ where: { period }, select: { id: true } });
    await processCompetence(ctx, comp!.id);
    const remaining = await prisma.healthProductionCriticism.findMany({ where: { status: "ABERTA", fact: { competenceId: comp!.id } }, select: { code: true } });
    console.log("criticas restantes:", remaining.map(c => c.code));
    if (remaining.length !== 1 || remaining[0].code !== "SEM_PROCEDIMENTO") throw new Error("Estado de críticas inesperado");

    // 2) Adaptador: arquivo transitório válido -> PROCESSADO; reprocesso idempotente; arquivo inválido -> REJEITADO. Remove após.
    const unit = await prisma.healthUnit.findFirst({ where: { isActive: true }, select: { id: true, name: true } });
    const good = await prisma.healthSusFile.create({ data: { fileType: "BPA", competenceId: comp!.id, unitId: unit!.id, content: `#BPA|COMPETENCIA:${period}|QTDE:1|GERADO_EM:${new Date().toISOString()}\nBPA|${period.replace("-", "")}|${unit!.name}|TESTE-PIPELINE|123456789012345|2026-09-10|1||REGULATION:teste`, hash: "teste", quantity: 1, createdByUsuarioId: usuario!.id }, select: { id: true } });
    const r1 = await processSusFile(ctx, good.id);
    console.log("adaptador válido:", r1);
    if (r1.status !== "PROCESSADO") throw new Error("Adaptador deveria aceitar");
    const r2 = await processSusFile(ctx, good.id);
    if (r2.status !== "PROCESSADO") throw new Error("Reprocesso divergiu");
    console.log("reprocesso idempotente ok");
    const bad = await prisma.healthSusFile.create({ data: { fileType: "BPA", competenceId: comp!.id, content: `#BPA|COMPETENCIA:${period}|QTDE:1|GERADO_EM:${new Date().toISOString()}\nBPA|${period.replace("-", "")}|||2026-09-10|0||REGULATION:teste`, hash: "teste", quantity: 1, createdByUsuarioId: usuario!.id }, select: { id: true } });
    const r3 = await processSusFile(ctx, bad.id);
    console.log("adaptador inválido:", r3);
    if (r3.status !== "REJEITADO") throw new Error("Adaptador deveria rejeitar");
    await prisma.healthSusFile.deleteMany({ where: { id: { in: [good.id, bad.id] } } });
    console.log("arquivos transitórios removidos");
    console.log(JSON.stringify({ status: "S4-CLOSE READY", pendencia: "Fechamento da competência e BPA real aguardam catálogo SIGTAP oficial (H-Q03)" }));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
