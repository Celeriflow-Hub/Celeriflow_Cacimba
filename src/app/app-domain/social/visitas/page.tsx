import { Calendar, Home } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { VisitasClient } from "./VisitasClient";

export default async function SocialVisitasPage() {
  const { prisma } = await getTenantContextForModule("SOCIAL");
  const visits = await prisma.socialVisit.findMany({
    include: { family: { include: { representative: true, address: true } }, professional: { include: { person: true } } },
    orderBy: { scheduledDate: "asc" },
  });
  const rows = visits.map((visit) => ({
    id: visit.id,
    date: visit.scheduledDate.toISOString(),
    familyName: visit.family.representative.fullName,
    address: visit.family.address?.streetName || "Endereço não cadastrado",
    professionalName: visit.professional.person?.fullName || visit.professional.name || "Técnico",
    objective: visit.objective,
    status: visit.status,
  }));

  return <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3">
    <PageHeader title="Visitas domiciliares" icon={<Home className="size-4 shrink-0 text-teal-600" />} action={<button className="inline-flex h-7 items-center gap-1 rounded-md bg-teal-600 px-2.5 text-xs font-semibold text-white hover:bg-teal-700"><Calendar className="size-3.5" />Agendar visita</button>} />
    <VisitasClient rows={rows} />
  </PageFrame>;
}
