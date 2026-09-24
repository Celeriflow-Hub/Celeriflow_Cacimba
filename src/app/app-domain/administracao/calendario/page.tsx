import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import CalendarioClient from "./CalendarioClient";
import { CalendarDays } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const { prisma } = await getTenantContextForModule("ADMINISTRACAO");
  const events = await prisma.calendarEvent.findMany({
    orderBy: { date: 'asc' }
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-col">
      <PageHeader title="Calendário Institucional" icon={<CalendarDays className="size-4 shrink-0 text-blue-600" />} action={<button type="button" className="inline-flex h-7 items-center rounded bg-blue-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-800">Adicionar evento</button>} />
      <CalendarioClient events={events} />
    </PageFrame>
  );
}
