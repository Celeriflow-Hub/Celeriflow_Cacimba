import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ClipboardList } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import AtendimentosClient from "./AtendimentosClient";

export default async function Page() {
  const context = await getTenantContextForModule("SAUDE");
  const scopedUnitIds = context.user.hasHealthAccessScope ? context.user.allowedHealthUnitIds || [] : undefined;
  const [items, currentProfessional] = await Promise.all([
    context.prisma.medicalRecord.findMany({
      where: scopedUnitIds ? { unitId: { in: scopedUnitIds } } : {},
      orderBy: [{ date: "desc" }, { id: "desc" }],
      select: {
        id: true,
        date: true,
        type: true,
        chiefComplaint: true,
        completedAt: true,
        outcome: true,
        patient: { select: { person: { select: { fullName: true } } } },
        professional: { select: { employee: { select: { name: true } } } },
        unit: { select: { name: true } },
      },
    }),
    context.user.employeeId
      ? context.prisma.healthProfessional.findFirst({
        where: { employeeId: context.user.employeeId, isActive: true },
        select: { id: true, unitId: true, assignments: { where: { isActive: true }, select: { unitId: true } }, employee: { select: { name: true, isActive: true } } },
      })
      : null,
  ]);

  const professional = currentProfessional?.employee.isActive ? currentProfessional : null;
  const professionalUnitIds = professional ? [...new Set([professional.unitId, ...professional.assignments.map(item => item.unitId)].filter((value): value is string => Boolean(value)))] : [];
  const appointments = professional
    ? await context.prisma.healthAppointment.findMany({
      where: {
        status: { in: ["Aguardando", "Em Atendimento"] },
        OR: [{ professionalId: professional.id }, { professionalId: null }],
        ...(professionalUnitIds.length ? { unitId: { in: scopedUnitIds ? professionalUnitIds.filter(id => scopedUnitIds.includes(id)) : professionalUnitIds } } : scopedUnitIds ? { unitId: { in: scopedUnitIds } } : {}),
      },
      orderBy: [{ date: "asc" }, { id: "asc" }],
      select: {
        id: true,
        date: true,
        specialty: true,
        status: true,
        professionalId: true,
        medicalRecord: { select: { id: true } },
        patient: { select: { person: { select: { fullName: true } } } },
        unit: { select: { name: true } },
      },
    })
    : [];

  return (
    <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      <PageHeader title="Atendimentos e Prontuários" icon={<ClipboardList className="size-4 shrink-0 text-emerald-600" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <AtendimentosClient
        records={items.map(item => ({ ...item, date: item.date.toISOString(), completedAt: item.completedAt?.toISOString() || null }))}
        appointments={appointments.map(appointment => ({ ...appointment, date: appointment.date.toISOString() }))}
        currentProfessional={professional ? { id: professional.id, name: professional.employee.name } : null}
        canRegister={canPerformModuleOperation(context.user, "SAUDE", "update")}
      />
    </PageFrame>
  );
}
