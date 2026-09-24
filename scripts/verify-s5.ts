import { config } from "dotenv";
import type { AppContext } from "../src/lib/platform/tenant-context";
config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const portal = await import("../src/lib/saude/patient-portal-service");
  const timeline = await import("../src/lib/saude/patient-timeline-service");
  const provider = await import("../src/lib/saude/provider-service");
  const vigilance = await import("../src/lib/saude/vigilance-service");
  const { transitionHealthAppointment } = await import("../src/lib/saude/appointment-service");
  try {
    const admin = await prisma.usuario.findFirst({ where: { employeeId: { not: null } } });
    if (!admin?.employeeId) throw new Error("Usuario admin não encontrado");
    const ctx: AppContext = { prisma, user: { id: admin.id, firebaseUid: admin.firebaseUid || "", email: admin.email, name: admin.nome, role: "admin", profileCode: "ADMIN", modulePermissions: [], allowedBudgetUnitIds: [], allowedHealthUnitIds: [], hasHealthAccessScope: false, employeeId: admin.employeeId, departmentId: null, secretariatId: null } };

    // Massas mínimas de demonstração (idempotentes, documentadas)
    const demoUser = await prisma.usuario.findUnique({ where: { id: "USR-SIM-026" }, select: { id: true } });
    await prisma.patient.update({ where: { id: "PAC-SIM-00002" }, data: { usuarioId: demoUser?.id || null } });
    const supplier = await prisma.supplier.findFirst({ where: { status: "Ativo" }, select: { id: true } });
    if (demoUser && supplier) await prisma.healthProviderAccess.upsert({ where: { supplierId_usuarioId: { supplierId: supplier.id, usuarioId: demoUser.id } }, create: { supplierId: supplier.id, usuarioId: demoUser.id }, update: { isActive: true } });
    console.log("vinculos portal/prestador ok");

    // Vigilância: fluxo completo idempotente
    const est = await vigilance.saveEstablishment(ctx, { name: "Mercado Central", document: "12345678000199", cnae: "4711-3/02", activity: "Comércio varejista", riskLevel: "Médio" });
    const prevInspections = await prisma.healthVigilanceInspection.findMany({ where: { establishmentId: est.id }, select: { id: true } });
    for (const prev of prevInspections) await prisma.healthVigilanceInspection.delete({ where: { id: prev.id } });
    await prisma.healthVigilanceComplaint.deleteMany({ where: { establishmentId: est.id } });
    await prisma.healthVigilanceLicense.deleteMany({ where: { establishmentId: est.id } });
    const complaint = await vigilance.saveComplaint(ctx, { establishmentId: est.id, place: null, description: "Higiene inadequada no local de manipulação.", isAnonymous: true, reporterPersonId: null });
    await vigilance.transitionComplaint(ctx, complaint.id, "Em apuração");
    const inspection = await vigilance.saveInspection(ctx, { establishmentId: est.id, complaintId: complaint.id, professionalId: null, inspectedAt: new Date(), reason: "Denúncia", findings: "Constatações registradas na inspeção.", items: [{ description: "Higiene do ambiente", result: "Conforme" }, { description: "Acondicionamento", result: "Não conforme", notes: "Ajustar" }] });
    await vigilance.transitionInspection(ctx, inspection.id, "Com pendências");
    const license = await vigilance.issueLicense(ctx, { establishmentId: est.id, licenseNumber: "ALV-2026-0001", validFrom: "2026-01-01", validUntil: "2026-12-31" });
    console.log("vigilancia ok", { est: est.id, complaint: complaint.id, inspection: inspection.id, license: license.id });

    // Isolamento paciente A x B (jornada 9 + segurança)
    const patientA = "PAC-SIM-00002";
    const patientBRow = await prisma.patient.findFirst({ where: { status: "Ativo", id: { not: patientA } }, select: { id: true } });
    const patientB = patientBRow!.id;
    const [apptA, vacA, dispA, repA] = await Promise.all([
      portal.portalAppointments(ctx, patientA), portal.portalVaccinations(ctx, patientA),
      portal.portalDispensations(ctx, patientA), portal.portalLabReports(ctx, patientA),
    ]);
    const checkOwner = async (ids: string[], model: "appointment" | "vaccination" | "dispensation" | "report") => {
      for (const id of ids) {
        const owner = model === "appointment" ? (await prisma.healthAppointment.findUnique({ where: { id }, select: { patientId: true } }))?.patientId
          : model === "vaccination" ? (await prisma.vaccinationRecord.findUnique({ where: { id }, select: { patientId: true } }))?.patientId
          : model === "dispensation" ? (await prisma.medicineDispensation.findUnique({ where: { id }, select: { patientId: true } }))?.patientId
          : (await prisma.healthLabReport.findUnique({ where: { id }, select: { order: { select: { patientId: true } } } }))?.order.patientId;
        if (owner !== patientA) throw new Error(`Vazamento em ${model}:${id}`);
      }
    };
    await checkOwner(apptA.map(a => a.id), "appointment");
    await checkOwner(vacA.map(a => a.id), "vaccination");
    await checkOwner(dispA.map(a => a.id), "dispensation");
    await checkOwner(repA.map(a => a.id), "report");
    for (const r of repA) {
      const full = await prisma.healthLabReport.findUnique({ where: { id: r.id }, select: { status: true, publishedAt: true } });
      if (full?.status !== "RELEASED" || !full.publishedAt) throw new Error("Laudo não liberado visível no portal");
    }
    const apptB = await portal.portalAppointments(ctx, patientB);
    if (apptA.some(a => apptB.some(b => b.id === a.id))) throw new Error("Interseção indevida entre pacientes");
    console.log(`isolamento portal ok (A:${apptA.length}/${vacA.length}/${dispA.length}/${repA.length} B:${apptB.length})`);

    // Timeline preserva tipos distintos
    const events = await timeline.listPatientTimeline(prisma, patientA, 50);
    const kinds = new Set(events.map(e => e.kind));
    console.log("timeline:", events.length, "eventos,", [...kinds].join(",") || "vazia");
    if (events.some(e => e.kind === "CONSULTA")) throw new Error("Evento genérico indevido");

    // Prestador A x B
    const supplierB = await prisma.supplier.findFirst({ where: { status: "Ativo", id: { not: supplier!.id } }, select: { id: true } });
    const guidesA = await provider.providerGuides(ctx, supplier!.id);
    for (const g of guidesA) {
      const full = await prisma.healthRegulationRequest.findUnique({ where: { id: g.id }, select: { quota: { select: { providerSupplierId: true } } } });
      if (full?.quota?.providerSupplierId !== supplier!.id) throw new Error("Guia de outro prestador visível");
    }
    if (supplierB && guidesA.length) {
      try {
        await provider.providerExecuteGuide(ctx, supplierB.id, { requestId: guidesA[0].id });
        throw new Error("Prestador B executou guia de A");
      } catch (e: unknown) {
        if (!(e instanceof Error) || !e.message.includes("não encontrada")) throw e;
        console.log("isolamento prestador ok");
      }
    } else console.log("isolamento prestador: sem guias/segundo prestador para cruzar");

    // Cancelamento não duplica (segunda chamada falha sem efeito)
    const fresh = await portal.portalRequestAppointment(ctx, patientA, { unitId: (await prisma.healthUnit.findFirst({ where: { isActive: true }, select: { id: true } }))!.id, date: "2026-10-05T09:00", specialty: null });
    await portal.portalTransitionAppointment(ctx, patientA, fresh.id, "Cancelado", "Desistência do paciente");
    try {
      await transitionHealthAppointment(ctx, { appointmentId: fresh.id, status: "Cancelado", cancellationReason: "repetido" });
      throw new Error("Cancelamento duplicado aceito");
    } catch (e: unknown) {
      if (!(e instanceof Error) || e.message.includes("duplicado aceito")) throw e;
      console.log("cancelamento idempotente ok");
    }
    await prisma.healthAppointmentEvent.deleteMany({ where: { appointmentId: fresh.id } });
    await prisma.healthAppointment.delete({ where: { id: fresh.id } });

    // Ouvidoria via portal (anônima oculta + identificada visível; remove registros de teste)
    const personId = (await prisma.patient.findUnique({ where: { id: patientA }, select: { personId: true } }))!.personId;
    const anon = await portal.portalCreateManifestation(ctx, personId, { type: "Sugestão", subject: "Sugestão sobre o atendimento", description: "Registro de sugestão para melhoria do atendimento.", isAnonymous: true });
    const identified = await portal.portalCreateManifestation(ctx, personId, { type: "Elogio", subject: "Elogio ao atendimento recebido", description: "Registro de elogio ao atendimento recebido na unidade.", isAnonymous: false });
    const own = await portal.portalManifestations(ctx, personId);
    console.log("ouvidoria portal:", anon.protocolNumber, identified.protocolNumber, "visíveis:", own.length);
    if (!own.some(o => o.id === identified.id)) throw new Error("Manifestação identificada deveria ser acompanhada");
    if (own.some(o => o.id === anon.id)) throw new Error("Manifestação anônima não deveria ser listada");
    for (const id of [anon.id, identified.id]) {
      await prisma.ombudsmanAuditLog.deleteMany({ where: { ombudsmanId: id } });
      await prisma.ombudsmanIdentity.deleteMany({ where: { ombudsmanId: id } });
      await prisma.ombudsman.delete({ where: { id } });
    }

    // Carga SIGTAP repetida não duplica (dedup por checksum)
    const { execSync } = await import("node:child_process");
    const out = execSync("npx tsx --conditions=react-server scripts/load-sigtap-base.ts", { encoding: "utf-8" });
    if (!out.includes("SKIPPED_DUPLICATE")) throw new Error("Dedup da carga falhou");
    console.log("integração repetida sem duplicar ok");

    console.log(JSON.stringify({ status: "S5 READY" }));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
