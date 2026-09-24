import { HeartPulse } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import AcolhimentoClient from "./AcolhimentoClient";

export default async function Page() {
  const context = await getTenantContextForModule("SAUDE");
  const unitIds = context.user.hasHealthAccessScope ? context.user.allowedHealthUnitIds || [] : undefined;
  const [appointments, patients, units, professional] = await Promise.all([
    context.prisma.healthAppointment.findMany({
      where: { status: "Aguardando", ...(unitIds ? { unitId: { in: unitIds } } : {}) },
      orderBy: [{ arrivedAt: "asc" }, { date: "asc" }],
      take: 200,
      select: { id: true, date: true, origin: true, status: true, priority: true, arrivedAt: true, calledAt: true, patient: { select: { person: { select: { fullName: true } } } }, unit: { select: { name: true } }, triage: { select: { riskClassification: true, chiefComplaint: true } } },
    }),
    context.prisma.patient.findMany({ where: { status: "Ativo" }, orderBy: { person: { fullName: "asc" } }, select: { id: true, cns: true, person: { select: { fullName: true } } } }),
    context.prisma.healthUnit.findMany({ where: { isActive: true, ...(unitIds ? { id: { in: unitIds } } : {}) }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    context.user.employeeId ? context.prisma.healthProfessional.findFirst({ where: { employeeId: context.user.employeeId, isActive: true }, select: { id: true } }) : null,
  ]);
  return <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden"><PageHeader title="Acolhimento e Fila Assistencial" icon={<HeartPulse className="size-4 text-rose-600" />} /><AcolhimentoClient appointments={appointments.map(item => ({ ...item, date: item.date.toISOString(), arrivedAt: item.arrivedAt?.toISOString() || null, calledAt: item.calledAt?.toISOString() || null }))} patients={patients} units={units} canCreate={canPerformModuleOperation(context.user, "SAUDE", "create")} canUpdate={canPerformModuleOperation(context.user, "SAUDE", "update")} hasProfessional={Boolean(professional)} /></PageFrame>;
}
