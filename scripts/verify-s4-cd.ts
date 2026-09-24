import { config } from "dotenv";
import type { AppContext } from "../src/lib/platform/tenant-context";
config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { ensureCompetence, captureFacts, processCompetence, closeCompetence, generateSusFile, processSusFile } = await import("../src/lib/saude/production-service");
  const { saveArea, saveMicroarea, saveHousehold, saveFamily, addFamilyMember, createVisit, addVisitParticipant, saveForm, finalizeForm } = await import("../src/lib/saude/territory-service");
  const { createBatch, processBatch } = await import("../src/lib/saude/sisab-service");
  try {
    const usuario = await prisma.usuario.findFirst({ where: { employeeId: { not: null } } });
    if (!usuario?.employeeId) throw new Error("Usuario com employee não encontrado");
    const ctx: AppContext = { prisma, user: { id: usuario.id, firebaseUid: usuario.firebaseUid || "", email: usuario.email, name: usuario.nome, role: "admin", profileCode: "ADMIN", modulePermissions: [], allowedBudgetUnitIds: [], allowedHealthUnitIds: [], hasHealthAccessScope: false, employeeId: usuario.employeeId, departmentId: null, secretariatId: null } };

    const period = "2026-09";
    console.log("== PRODUCAO ==");
    const cap1 = await captureFacts(ctx, period);
    console.log("capture1", cap1);
    const cap2 = await captureFacts(ctx, period);
    console.log("capture2 (idempotente)", cap2);
    if (cap2.created !== 0) throw new Error("Captura duplicou fatos");
    const performed = await prisma.healthPerformedProcedure.count({ where: { medicalRecord: { completedAt: { not: null } } } });
    console.log("performed com atendimento concluído:", performed);

    const comp = await ensureCompetence(ctx, period);
    const { reopenCompetence } = await import("../src/lib/saude/production-service");
    const compState = await prisma.healthProductionCompetence.findUnique({ where: { id: comp.id }, select: { status: true } });
    if (compState?.status === "FECHADA") await reopenCompetence(ctx, comp.id);
    const proc = await processCompetence(ctx, comp.id);
    console.log("competence processada", proc);
    const facts = await prisma.healthProductionFact.count({ where: { competenceId: comp.id } });
    const critics = await prisma.healthProductionCriticism.count({ where: { status: "ABERTA", fact: { competenceId: comp.id } } });
    console.log("facts vinculados:", facts, "criticas abertas:", critics);
    for (const c of await prisma.healthProductionCriticism.findMany({ where: { status: "ABERTA", fact: { competenceId: comp.id } }, select: { code: true } })) console.log("critica:", c.code);

    // Arquivo a partir de fatos válidos com procedimento (pode ser 0 se nenhum fato tem procedimento)
    const validProc = await prisma.healthProductionFact.count({ where: { competenceId: comp.id, status: "VALIDO", procedureId: { not: null } } });
    console.log("fatos válidos com procedimento:", validProc);
    if (validProc > 0) {
      const file = await generateSusFile(ctx, { competenceId: comp.id, fileType: "BPA" });
      console.log("arquivo", file.id, file.hash.slice(0, 12), file.quantity);
      const res1 = await processSusFile(ctx, file.id);
      console.log("processado", res1);
      const res2 = await processSusFile(ctx, file.id);
      console.log("reprocessado (sem duplicar)", res2);
      if (res1.status !== res2.status) throw new Error("Reprocessamento divergiu");
    } else {
      console.log("sem fatos com procedimento: arquivo não gerado (esperado sem SIGTAP vinculado)");
    }
    if (critics === 0) {
      await closeCompetence(ctx, comp.id);
      console.log("competencia fechada");
    } else {
      console.log("competencia com criticas: fechamento bloqueado como esperado");
      try { await closeCompetence(ctx, comp.id); throw new Error("Fechamento deveria falhar"); }
      catch (e: unknown) { if (!String(e instanceof Error ? e.message : e).includes("crítica")) throw e; console.log("bloqueio de fechamento ok"); }
    }

    console.log("== TERRITORIO/SISAB ==");
    const unit = await prisma.healthUnit.findFirst({ where: { isActive: true } });
    const team = await prisma.healthTeam.findFirst({ where: { isActive: true } });
    const professional = await prisma.healthProfessional.findFirst({ where: { isActive: true } });
    const patient = await prisma.patient.findFirst({ where: { status: "Ativo" }, include: { person: true } });
    const patient2 = await prisma.patient.findFirst({ where: { status: "Ativo", id: { not: patient!.id } }, include: { person: true } });
    const stamp = Date.now().toString().slice(-6);
    const area = await saveArea(ctx, { code: `A${stamp}`, name: "Área Norte", unitId: unit!.id, teamId: team?.id || null });
    const micro = await saveMicroarea(ctx, { code: "01", areaId: area.id, agentProfessionalId: professional?.id || null });
    const household = await saveHousehold(ctx, { householdCode: `DOM${stamp}`, microareaId: micro.id });
    const family = await saveFamily(ctx, { familyCode: `FAM${stamp}`, householdId: household.id, responsiblePersonId: patient!.personId });
    await addFamilyMember(ctx, { familyId: family.id, personId: patient!.personId, kinship: "Responsável" });
    if (patient2) await addFamilyMember(ctx, { familyId: family.id, personId: patient2.personId, kinship: "Cônjuge" });
    console.log("territorio ok", area.id, micro.id, household.id, family.id);

    const visit = await createVisit(ctx, { householdId: household.id, familyId: family.id, teamId: team?.id || null, professionalId: professional!.id, microareaId: micro.id, visitedAt: new Date(), actions: "Visita de rotina e orientação", observations: null });
    await addVisitParticipant(ctx, { visitId: visit.id, personId: patient!.personId });
    if (patient2) await addVisitParticipant(ctx, { visitId: visit.id, personId: patient2.personId });
    const parts = await prisma.healthHomeVisitParticipant.count({ where: { visitId: visit.id } });
    console.log("visita com participantes:", parts);
    if (parts < 1) throw new Error("Participantes não registrados");

    const form = await saveForm(ctx, { kind: "VISITA", householdId: household.id, familyId: family.id, personId: patient!.personId, patientId: patient!.id, professionalId: professional!.id, teamId: team?.id || null, unitId: unit!.id, period, details: "Visita domiciliar registrada", originMedicalRecordId: null });
    await finalizeForm(ctx, form.id);
    const factsBefore = await prisma.healthProductionFact.count({ where: { idempotencyKey: `ESUS_FORM:${form.id}` } });
    await finalizeForm(ctx, form.id);
    const factsAfter = await prisma.healthProductionFact.count({ where: { idempotencyKey: `ESUS_FORM:${form.id}` } });
    console.log("producao da ficha:", factsBefore, "->", factsAfter);
    if (factsBefore !== 1 || factsAfter !== 1) throw new Error("Produção da ficha duplicou ou ausente");

    const batch = await createBatch(ctx, period);
    console.log("lote", batch.id);
    const batchRes = await processBatch(ctx, batch.id);
    console.log("lote processado", batchRes);

    // Caso rejeitado: ficha finalizada sem profissional (via prisma direto), depois corrige e reenvia
    const bad = await prisma.healthEsusForm.create({ data: { kind: "INDIVIDUAL", period, status: "FINALIZADA", finalizedAt: new Date(), idempotencyKey: `BAD-${stamp}`, createdByUsuarioId: usuario.id } });
    const batch2 = await createBatch(ctx, period);
    const res2 = await processBatch(ctx, batch2.id);
    console.log("lote com rejeição", res2);
    if (res2.rejected < 1) throw new Error("Rejeição esperada não ocorreu");
    await prisma.healthEsusForm.update({ where: { id: bad.id }, data: { professionalId: professional!.id, unitId: unit!.id, personId: patient!.personId } });
    const res3 = await processBatch(ctx, batch2.id);
    console.log("lote após correção (reenvio)", res3);
    if (res3.rejected !== 0) throw new Error("Correção não foi aceita no reenvio");

    // Limpeza dos dados de teste (mantém fatos de produção reais capturados)
    await prisma.healthEsusBatchItem.deleteMany({ where: { batchId: { in: [batch.id, batch2.id] } } });
    await prisma.healthEsusBatch.deleteMany({ where: { id: { in: [batch.id, batch2.id] } } });
    await prisma.healthProductionFact.deleteMany({ where: { idempotencyKey: `ESUS_FORM:${form.id}` } });
    await prisma.healthEsusForm.deleteMany({ where: { id: { in: [form.id, bad.id] } } });
    await prisma.healthHomeVisitParticipant.deleteMany({ where: { visitId: visit.id } });
    await prisma.healthHomeVisit.deleteMany({ where: { id: visit.id } });
    await prisma.healthFamilyMember.deleteMany({ where: { familyId: family.id } });
    await prisma.healthFamily.deleteMany({ where: { id: family.id } });
    await prisma.healthHousehold.deleteMany({ where: { id: household.id } });
    await prisma.healthMicroarea.deleteMany({ where: { id: micro.id } });
    await prisma.healthTerritoryArea.deleteMany({ where: { id: area.id } });

    console.log(JSON.stringify({ status: "S4-CD READY" }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
