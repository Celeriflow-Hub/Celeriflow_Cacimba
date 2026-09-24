import { BarChart3 } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { HealthReportsClient } from "./HealthReportsClient";

export default async function HealthReportsPage() {
  const context = await getTenantContextForModule("SAUDE");
  const unitScope = context.user.hasHealthAccessScope ? context.user.allowedHealthUnitIds || [] : undefined;
  const [units, specialties, professionals, teams, financingRows, municipalities, covenantStatuses, appointmentStatuses] = await Promise.all([
    context.prisma.healthUnit.findMany({ where: { isActive: true, ...(unitScope ? { id: { in: unitScope } } : {}) }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    context.prisma.healthSpecialty.findMany({ where: { isActive: true, ...(unitScope ? { OR: [{ unitLinks: { some: { unitId: { in: unitScope }, isActive: true } } }, { professionalAssignments: { some: { unitId: { in: unitScope }, isActive: true } } }] } : {}) }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    context.prisma.healthProfessional.findMany({ where: { isActive: true, ...(unitScope ? { OR: [{ unitId: { in: unitScope } }, { assignments: { some: { unitId: { in: unitScope }, isActive: true } } }] } : {}) }, orderBy: { employee: { name: "asc" } }, select: { id: true, employee: { select: { name: true } } } }),
    context.prisma.healthTeam.findMany({ where: { isActive: true, ...(unitScope ? { unitId: { in: unitScope } } : {}) }, orderBy: [{ unit: { name: "asc" } }, { name: "asc" }], select: { id: true, name: true, unit: { select: { name: true } } } }),
    context.prisma.healthSusProcedure.findMany({ where: { isCurrent: true, financing: { not: null } }, distinct: ["financing"], orderBy: { financing: "asc" }, select: { financing: true } }),
    context.prisma.neighborhood.findMany({ where: { city: { not: "" } }, distinct: ["city", "state"], orderBy: [{ city: "asc" }, { state: "asc" }], select: { city: true, state: true } }),
    context.prisma.covenant.findMany({ distinct: ["status"], orderBy: { status: "asc" }, select: { status: true } }),
    context.prisma.healthAppointment.findMany({ distinct: ["status"], orderBy: { status: "asc" }, select: { status: true } }),
  ]);
  return <PageFrame className="flex h-full min-h-0 max-w-none flex-1 flex-col gap-2 overflow-hidden"><PageHeader title="Relatórios Administrativos" icon={<BarChart3 className="size-4 shrink-0 text-emerald-700" />} className="mb-0 shrink-0" /><HealthReportsClient canIssue={canPerformModuleOperation(context.user, "SAUDE", "issueReports")} options={{ units, specialties, professionals: professionals.map(item => ({ id: item.id, name: item.employee.name })), teams: teams.map(item => ({ id: item.id, name: `${item.name} · ${item.unit.name}` })), financing: financingRows.flatMap(item => item.financing ? [item.financing] : []), municipalities: municipalities.map(item => ({ value: item.city, label: `${item.city}/${item.state}` })), covenantStatuses: covenantStatuses.map(item => item.status), appointmentStatuses: appointmentStatuses.map(item => item.status) }} /></PageFrame>;
}
