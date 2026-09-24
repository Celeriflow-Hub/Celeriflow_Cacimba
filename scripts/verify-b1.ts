import { config } from "dotenv";
import type { AppContext } from "../src/lib/platform/tenant-context";
config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const schedule = await import("../src/lib/saude/schedule-service");
  const { createHealthAppointment } = await import("../src/lib/saude/appointment-service");
  try {
    const admin = await prisma.usuario.findFirst({ where: { employeeId: { not: null } } });
    const ctx: AppContext = { prisma, user: { id: admin!.id, firebaseUid: admin!.firebaseUid || "", email: admin!.email, name: admin!.nome, role: "admin", profileCode: "ADMIN", modulePermissions: [], allowedBudgetUnitIds: [], allowedHealthUnitIds: [], hasHealthAccessScope: false, employeeId: admin!.employeeId, departmentId: null, secretariatId: null } };
    const unit = await prisma.healthUnit.findFirst({ where: { isActive: true }, select: { id: true } });
    const professional = await prisma.healthProfessional.findFirst({ where: { isActive: true, unitId: unit!.id }, select: { id: true } });
    const specialty = await prisma.healthSpecialty.findFirst({ where: { isActive: true }, select: { id: true } });

    const candidates = await prisma.patient.findMany({ where: { status: "Ativo", cns: { not: "" } }, select: { id: true, person: { select: { cpf: true } } }, take: 50 });
    const patient = candidates.find(c => c.person.cpf);
    const testPatientIds = candidates.filter(c => c.person.cpf).slice(0, 3).map(c => c.id);
    const stale = await prisma.healthAppointment.findMany({ where: { patientId: { in: testPatientIds }, date: { gte: new Date("2026-10-20T00:00:00"), lt: new Date("2026-10-21T00:00:00") } }, select: { id: true } });
    await prisma.healthAppointmentEvent.deleteMany({ where: { appointmentId: { in: stale.map(s => s.id) } } });
    await prisma.healthAppointment.deleteMany({ where: { id: { in: stale.map(s => s.id) } } });
    await prisma.healthCareSchedule.deleteMany({ where: { kind: "DIARIO", date: new Date("2026-10-20T12:00:00"), totalSlots: 2, startTime: "08:00" } });
    const sched = await schedule.saveSchedule(ctx, { kind: "DIARIO", unitId: unit!.id, specialtyId: specialty?.id || null, professionalId: professional?.id || null, date: "2026-10-20", startTime: "08:00", endTime: "12:00", totalSlots: 2 });
    console.log("cronograma", sched.id);
    const a1 = await createHealthAppointment(ctx, { patientId: patient!.id, unitId: unit!.id, professionalId: professional?.id || null, date: "2026-10-20T08:00", specialtyId: specialty?.id || null, priority: "Normal", specialty: null, schedulingGroupId: null, serviceId: null, scheduleId: sched.id, visitType: "Primeira" });
    const patient2 = candidates.find(c => c.id !== patient!.id && c.person.cpf);
    const a2 = await createHealthAppointment(ctx, { patientId: patient2!.id, unitId: unit!.id, professionalId: professional?.id || null, date: "2026-10-20T08:30", specialtyId: specialty?.id || null, priority: "Normal", specialty: null, schedulingGroupId: null, serviceId: null, scheduleId: sched.id, visitType: "Retorno" });
    console.log("2 vagas ocupadas");
    try {
      const p3 = candidates.find(c => c.id !== patient!.id && c.id !== patient2!.id && c.person.cpf);
      await createHealthAppointment(ctx, { patientId: p3!.id, unitId: unit!.id, professionalId: null, specialtyId: null, visitType: null, date: "2026-10-20T09:00", priority: "Normal", specialty: null, schedulingGroupId: null, serviceId: null, scheduleId: sched.id });
      throw new Error("Overbooking aceito");
    } catch (e: unknown) {
      if (!(e instanceof Error) || !e.message.includes("vagas")) throw e;
      console.log("overbooking bloqueado ok");
    }
    try {
      await createHealthAppointment(ctx, { patientId: patient!.id, unitId: unit!.id, professionalId: null, visitType: null, scheduleId: null, date: "2026-10-21T08:00", specialtyId: specialty?.id || null, priority: "Normal", specialty: null, schedulingGroupId: null, serviceId: null });
      throw new Error("Duplicidade aceita");
    } catch (e: unknown) {
      if (!(e instanceof Error) || !e.message.includes("já possui agendamento")) throw e;
      console.log("limite por paciente ok");
    }
    await prisma.calendarEvent.create({ data: { title: "Feriado B1", date: new Date("2026-11-02T12:00:00"), type: "Nacional", isHoliday: true } });
    try {
      await createHealthAppointment(ctx, { patientId: patient2!.id, unitId: unit!.id, professionalId: null, specialtyId: null, visitType: null, scheduleId: null, date: "2026-11-02T08:00", priority: "Normal", specialty: null, schedulingGroupId: null, serviceId: null });
      throw new Error("Feriado aceito");
    } catch (e: unknown) {
      if (!(e instanceof Error) || !e.message.includes("bloqueado")) throw e;
      console.log("feriado bloqueado ok");
    }
    await prisma.calendarEvent.deleteMany({ where: { title: "Feriado B1" } });

    const moved = await schedule.remanejarAppointment(ctx, { appointmentId: a1.id, date: "2026-10-20T10:00", reason: "Remanejo B1" });
    console.log("remanejado", moved.id);
    const wait = await schedule.addWaitlist(ctx, { patientId: patient2!.id, specialtyId: specialty?.id || null, priority: "Prioridade" });
    await schedule.transitionWaitlist(ctx, wait.id, "Chamado");
    console.log("espera chamada ok");

    await schedule.transitionSchedule(ctx, sched.id, "Bloqueado", "Bloqueio B1");
    const avail = await prisma.$transaction(async tx => schedule.scheduleAvailability(tx, sched.id));
    console.log("bloqueio ok", avail.status);
    await schedule.transitionSchedule(ctx, sched.id, "Ativo");

    // Limpeza
    await prisma.healthAppointmentEvent.deleteMany({ where: { appointmentId: { in: [a1.id, a2.id] } } });
    await prisma.healthAppointment.deleteMany({ where: { id: { in: [a1.id, a2.id] } } });
    await prisma.healthWaitlist.delete({ where: { id: wait.id } });
    await prisma.healthCareSchedule.delete({ where: { id: sched.id } });
    console.log(JSON.stringify({ status: "B1 READY" }));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
