import { ClipboardList } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { NewAttendanceSheet } from "../components/NewAttendanceSheet";
import { AtendimentosClient } from "./AtendimentosClient";

export default async function SocialAtendimentosPage() {
  const { prisma } = await getTenantContextForModule("SOCIAL");
  const [attendances, families, units, professionals] = await Promise.all([
    prisma.socialAttendance.findMany({
      include: { family: { include: { representative: true } }, person: true, unit: true, professional: { include: { person: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.socialFamily.findMany({ include: { representative: { select: { fullName: true } } }, orderBy: { representative: { fullName: "asc" } } }),
    prisma.socialUnit.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.employee.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const rows = attendances.map((attendance) => ({
    id: attendance.id,
    date: attendance.date.toISOString(),
    familyName: attendance.family.representative.fullName,
    personName: attendance.person?.fullName ?? null,
    type: attendance.type,
    unitName: attendance.unit.name,
    professionalName: attendance.professional.person?.fullName ?? attendance.professional.name ?? null,
    description: attendance.description,
    secrecyLevel: attendance.secrecyLevel,
  }));

  return <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3">
    <PageHeader title="Atendimentos e acompanhamentos" icon={<ClipboardList className="size-4 shrink-0 text-emerald-600" />} action={<NewAttendanceSheet families={families} units={units} professionals={professionals} />} />
    <AtendimentosClient rows={rows} />
  </PageFrame>;
}
