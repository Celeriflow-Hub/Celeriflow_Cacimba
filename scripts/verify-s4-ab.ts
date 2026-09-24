import { config } from "dotenv";
import type { AppContext } from "../src/lib/platform/tenant-context";
config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { saveRegulationQuota, createRegulationRequest, transitionRegulationRequest } = await import("../src/lib/saude/regulation-service");
  const { createTfdRequest, authorizeTfdRequest, createTfdTrip, addPassenger, updateTripStatus } = await import("../src/lib/saude/tfd-service");
  try {
    const usuario = await prisma.usuario.findFirst({ where: { employeeId: { not: null } }, include: { employee: true } });
    if (!usuario?.employeeId) throw new Error("Usuario com employee não encontrado");
    const ctx: AppContext = { prisma, user: { id: usuario.id, firebaseUid: usuario.firebaseUid || "", email: usuario.email, name: usuario.nome, role: "admin", profileCode: "ADMIN", modulePermissions: [], allowedBudgetUnitIds: [], allowedHealthUnitIds: [], hasHealthAccessScope: false, employeeId: usuario.employeeId, departmentId: null, secretariatId: null } };
    const unit = await prisma.healthUnit.findFirst({ where: { isActive: true } });
    const patient = await prisma.patient.findFirst({ where: { status: "Ativo" } });
    const patient2 = await prisma.patient.findFirst({ where: { status: "Ativo", id: { not: patient!.id } } });
    const supplier = await prisma.supplier.findFirst({ where: { status: "Ativo" } });
    const specialty = await prisma.healthSpecialty.findFirst({ where: { isActive: true } });
    let fleet = await prisma.fleetUnit.findFirst({ where: { category: "VEICULO" } });
    if (!fleet) {
      fleet = await prisma.fleetUnit.create({ data: { code: `TFD-${Date.now()}`, name: "Veículo TFD 01", category: "VEICULO", plate: `TST${Date.now().toString().slice(-4)}`, createdById: usuario.id } });
    }
    const driver = await prisma.employee.findFirst({ where: { isActive: true } });
    const professional = await prisma.healthProfessional.findFirst({ where: { isActive: true }, select: { id: true } });
    if (!unit || !patient || !supplier || !fleet) throw new Error("Massa mínima ausente para S4");
    // Cleanup previous test data
    await prisma.healthTfdPassenger.deleteMany({ where: { patientId: patient.id } });
    await prisma.healthTfdTrip.deleteMany({ where: { fleetUnitId: fleet.id } });
    await prisma.healthTfdRequest.deleteMany({ where: { patientId: patient.id } });
    await prisma.healthRegulationEvent.deleteMany({ where: { request: { patientId: patient.id } } });
    await prisma.healthRegulationRequest.deleteMany({ where: { patientId: patient.id } });
    await prisma.healthRegulationQuota.deleteMany({ where: { providerSupplierId: supplier.id, period: "2026-09" } });
    await prisma.healthProductionCriticism.deleteMany({ where: { fact: { patientId: patient.id, originType: "REGULATION" } } });
    await prisma.healthProductionFact.deleteMany({ where: { patientId: patient.id, originType: "REGULATION" } });

    console.log("Creating quota 10");
    const quota = await saveRegulationQuota(ctx, { providerSupplierId: supplier.id, unitId: unit.id, specialtyId: specialty?.id || null, period: "2026-09", totalQuantity: 10 });
    console.log("quota", quota.id);

    console.log("Create request PEP_REFERRAL via direct");
    const req = await createRegulationRequest(ctx, { patientId: patient.id, requestUnitId: unit.id, professionalId: professional?.id || null, specialtyId: specialty?.id || null, priority: "Normal", description: "Avaliação para atenção especializada", origin: "DIRECT" });
    console.log("req", req.id);

    console.log("Authorize");
    await transitionRegulationRequest(ctx, req.id, "AUTORIZADA", { quotaId: quota.id });
    let q = await prisma.healthRegulationQuota.findUnique({ where: { id: quota.id } });
    console.log("after authorize", q);
    if (q!.reservedQuantity !== 1) throw new Error("Reserva falhou");

    console.log("Execute");
    await transitionRegulationRequest(ctx, req.id, "EXECUTADA", {});
    q = await prisma.healthRegulationQuota.findUnique({ where: { id: quota.id } });
    console.log("after exec", q);
    if (q!.reservedQuantity !== 0 || q!.realizedQuantity !== 1) throw new Error("Consumo falhou");

    console.log("Cancel test");
    const req2 = await createRegulationRequest(ctx, { patientId: patient.id, requestUnitId: unit.id, professionalId: professional?.id || null, priority: "Normal", description: "Avaliação de retorno" });
    await transitionRegulationRequest(ctx, req2.id, "AUTORIZADA", { quotaId: quota.id });
    q = await prisma.healthRegulationQuota.findUnique({ where: { id: quota.id } });
    console.log("after 2nd authorize", q);
    await transitionRegulationRequest(ctx, req2.id, "CANCELADA", {});
    q = await prisma.healthRegulationQuota.findUnique({ where: { id: quota.id } });
    console.log("after cancel", q);
    if (q!.reservedQuantity !== 0) throw new Error("Devolução falhou");
    const guide = await prisma.healthRegulationRequest.findUnique({ where: { id: req.id }, select: { guideNumber: true } });
    console.log("guide", guide);
    if (!guide?.guideNumber) throw new Error("Guia não gerada");

    console.log("TFD flow");
    const tfd = await createTfdRequest(ctx, { patientId: patient.id, originUnitId: unit.id, destination: "Hospital Regional de Referência", reason: "Consulta especializada", priority: "Normal" });
    console.log("tfd", tfd.id);
    await authorizeTfdRequest(ctx, tfd.id);
    const trip = await createTfdTrip(ctx, { date: "2026-09-25", origin: unit.name, destination: "Hospital Regional de Referência", fleetUnitId: fleet.id, driverEmployeeId: driver!.id, capacity: 2 });
    console.log("trip", trip.id);
    await addPassenger(ctx, { tripId: trip.id, patientId: patient.id, tfdRequestId: tfd.id, kind: "PACIENTE" });
    // companion for same patient counts as second seat
    await addPassenger(ctx, { tripId: trip.id, patientId: patient.id, companionName: "Acompanhante familiar", kind: "ACOMPANHANTE" });
    const cnt = await prisma.healthTfdPassenger.count({ where: { tripId: trip.id } });
    console.log("passengers", cnt);
    if (cnt !== 2) throw new Error("Passageiros incorretos");
    try {
      const p3 = patient2 || patient;
      await addPassenger(ctx, { tripId: trip.id, patientId: p3.id, kind: "PACIENTE" });
      throw new Error("Deveria falhar capacidade");
    } catch (e: unknown) {
      if (!String(e instanceof Error ? e.message : e).includes("Capacidade")) throw e;
      console.log("capacidade bloqueada ok");
    }
    await updateTripStatus(ctx, trip.id, "EMBARCANDO");
    await updateTripStatus(ctx, trip.id, "EM_TRANSITO");
    await updateTripStatus(ctx, trip.id, "CONCLUIDA");
    console.log("tfd trip concluída");

    console.log(JSON.stringify({ status: "S4-AB READY", quota: q, guide: guide.guideNumber }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
