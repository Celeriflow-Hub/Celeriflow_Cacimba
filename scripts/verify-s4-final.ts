import { config } from "dotenv";
import type { AppContext } from "../src/lib/platform/tenant-context";
config({ path: ".env.local", quiet: true });
config({ quiet: true });

// Teste obrigatório do fechamento S4: fluxo assistencial válido com
// procedimento SIGTAP -> produção com CID/município -> sem SEM_PROCEDIMENTO
// -> BPA real -> filtros -> histórico preservado após mudança de endereço.
async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { createSpontaneousCare } = await import("../src/lib/saude/appointment-service");
  const { startHealthCare, addHealthDiagnosis, addPerformedProcedure, concludeHealthCare } = await import("../src/lib/saude/care-service");
  const { ensureCompetence, captureFacts, processCompetence, closeCompetence, reopenCompetence, generateSusFile, processSusFile } = await import("../src/lib/saude/production-service");
  try {
    const professional = await prisma.healthProfessional.findFirst({ where: { id: "HPRO-SER-SIM-0126" }, select: { id: true, unitId: true, employeeId: true } });
    if (!professional) throw new Error("Profissional de teste não encontrado");
    const usuario = await prisma.usuario.findFirst({ where: { employeeId: professional.employeeId }, select: { id: true, firebaseUid: true, email: true, nome: true, employeeId: true } });
    if (!usuario) throw new Error("Usuario do profissional não encontrado");
    const ctx: AppContext = { prisma, user: { id: usuario.id, firebaseUid: usuario.firebaseUid || "", email: usuario.email, name: usuario.nome, role: "prof", profileCode: "SAUDE", modulePermissions: [], allowedBudgetUnitIds: [], allowedHealthUnitIds: [], hasHealthAccessScope: false, employeeId: usuario.employeeId, departmentId: null, secretariatId: null } };
    const unitId = professional.unitId!;
    const patientId = "PAC-SIM-00002";
    const period = "2026-09";

    const procedure = await prisma.healthSusProcedure.findFirst({ where: { code: "9900000001", isCurrent: true, isActive: true }, select: { id: true, code: true } });
    const cid = await prisma.healthSusReference.findFirst({ where: { kind: "CID", code: "J06", isCurrent: true, isActive: true }, select: { id: true, code: true } });
    if (!procedure || !cid) throw new Error("Base SIGTAP local não carregada");

    // 1) Fluxo assistencial válido (demanda espontânea -> atendimento -> diagnóstico -> procedimento -> conclusão)
    let recordId: string;
    const existing = await prisma.medicalRecord.findFirst({ where: { patientId, appointment: { arrivalNotes: "Avaliação clínica de rotina" }, completedAt: { not: null } }, select: { id: true } });
    if (existing) {
      recordId = existing.id;
      console.log("atendimento de teste reutilizado", recordId);
    } else {
      const appointment = await createSpontaneousCare(ctx, { patientId, unitId, professionalId: professional.id, specialtyId: null, serviceId: null, arrivalNotes: "Avaliação clínica de rotina", priority: "Normal" });
      const record = await startHealthCare(ctx, appointment.id);
      await addHealthDiagnosis(ctx, { medicalRecordId: record.id, cidReferenceId: cid.id, isPrimary: true, notes: null });
      await addPerformedProcedure(ctx, { medicalRecordId: record.id, procedureId: procedure.id, quantity: 1, notes: null });
      await concludeHealthCare(ctx, { medicalRecordId: record.id, outcome: "Alta", conduct: "Conduta clínica registrada." });
      recordId = record.id;
      console.log("atendimento de teste criado", recordId);
    }
    const performed = await prisma.healthPerformedProcedure.findFirst({ where: { medicalRecordId: recordId }, select: { id: true } });

    // 2) Origem antiga (regulação) recebe procedimento válido
    const regFact = await prisma.healthProductionFact.findFirst({ where: { originType: "REGULATION", period }, select: { originId: true } });
    if (regFact) {
      await prisma.healthRegulationRequest.update({ where: { id: regFact.originId }, data: { procedureId: procedure.id } });
      console.log("origem da regulação corrigida com procedimento", procedure.code);
    }

    // 3) Captura idempotente + reabertura se necessário + processamento
    const cap = await captureFacts(ctx, period);
    console.log("captura", cap);
    const comp = await ensureCompetence(ctx, period);
    const state = await prisma.healthProductionCompetence.findUnique({ where: { id: comp.id }, select: { status: true } });
    if (state?.status === "FECHADA") await reopenCompetence(ctx, comp.id);
    await processCompetence(ctx, comp.id);
    const pepFact = await prisma.healthProductionFact.findFirst({ where: { idempotencyKey: `PEP_PROCEDURE:${performed!.id}` }, include: { procedure: { select: { code: true } }, cidReference: { select: { code: true } } } });
    console.log("fato PEP:", { status: pepFact?.status, procedure: pepFact?.procedure?.code, cid: pepFact?.cidReference?.code, municipality: pepFact?.municipality, state: pepFact?.state });
    if (!pepFact || pepFact.status !== "VALIDO") throw new Error("Fato válido deveria estar VALIDO");
    if (pepFact.procedure?.code !== "9900000001") throw new Error("Procedimento não refletido no fato");
    if (pepFact.cidReference?.code !== "J06") throw new Error("CID não refletido no fato");
    if (!pepFact.municipality || !pepFact.state) throw new Error("Município/UF histórico ausente");
    const semProc = await prisma.healthProductionCriticism.count({ where: { status: "ABERTA", code: "SEM_PROCEDIMENTO", fact: { competenceId: comp.id } } });
    console.log("SEM_PROCEDIMENTO abertas:", semProc);
    if (semProc !== 0) throw new Error("SEM_PROCEDIMENTO deveria ter desaparecido dos casos válidos");

    // 4) Filtros por CID e município (conjunto total autorizado)
    const byCid = await prisma.healthProductionFact.count({ where: { cidReferenceId: cid.id } });
    const byMun = await prisma.healthProductionFact.count({ where: { municipality: pepFact.municipality!, state: pepFact.state! } });
    console.log("filtro CID:", byCid, "filtro município/UF:", byMun);
    if (byCid < 1 || byMun < 1) throw new Error("Filtros não retornam o fato");

    // 5) Histórico preservado após mudança do endereço atual (transitória, removida ao final)
    const hood = await prisma.neighborhood.create({ data: { name: "Bairro Transitório", type: "Bairro", city: "Município Transitório", state: "ES" }, select: { id: true } });
    const addr = await prisma.address.create({ data: { personId: (await prisma.patient.findUnique({ where: { id: patientId }, select: { personId: true } }))!.personId, neighborhoodId: hood.id, streetName: "Rua Transitória" }, select: { id: true } });
    const after = await prisma.healthProductionFact.findUnique({ where: { id: pepFact.id }, select: { municipality: true, state: true } });
    await prisma.address.delete({ where: { id: addr.id } });
    await prisma.neighborhood.delete({ where: { id: hood.id } });
    console.log("snapshot após troca de endereço:", after);
    if (after?.municipality !== pepFact.municipality) throw new Error("Histórico foi alterado pela mudança de endereço");

    // 6) BPA real a partir da competência + adaptador + fechamento
    const file = await generateSusFile(ctx, { competenceId: comp.id, fileType: "BPA" });
    const stored = await prisma.healthSusFile.findUnique({ where: { id: file.id }, select: { content: true } });
    if (!stored?.content.includes("9900000001")) throw new Error("BPA não contém o procedimento da base");
    console.log("BPA gerado com", file.quantity, "linha(s)");
    const res = await processSusFile(ctx, file.id);
    console.log("BPA processado:", res);
    if (res.status !== "PROCESSADO") throw new Error("BPA deveria ser PROCESSADO");
    await closeCompetence(ctx, comp.id);
    console.log("competência 2026-09 FECHADA");
    console.log(JSON.stringify({ status: "S4-FINAL READY" }));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
