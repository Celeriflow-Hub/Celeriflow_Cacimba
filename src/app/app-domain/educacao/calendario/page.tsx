import { Calendar, Plus } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { EducationListClient } from "../EducationListClient";

export const dynamic = "force-dynamic";
const formatDate = (value: Date) => new Intl.DateTimeFormat("pt-BR").format(value);

export default async function CalendarioEscolarPage() {
  const { prisma } = await getTenantContextForModule("EDUCACAO");
  const events = await prisma.schoolCalendarEvent.findMany({ orderBy: { date: "asc" } });
  const rows = events.map((event) => ({ id: event.id, cells: { start: formatDate(event.date), end: event.endDate ? formatDate(event.endDate) : "-", event: event.title, type: event.type }, detail: { Evento: event.title, Início: formatDate(event.date), Término: event.endDate ? formatDate(event.endDate) : "Mesmo dia", Tipo: event.type } }));
  return <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden"><PageHeader title="Calendário Escolar" icon={<Calendar className="size-4 text-purple-600" />} action={<button type="button" className="inline-flex h-8 items-center gap-1.5 rounded bg-purple-600 px-3 text-xs font-semibold text-white"><Plus className="size-3.5" />Novo evento</button>} /><EducationListClient rows={rows} columns={[{ key: "start", label: "Início", width: "medium" }, { key: "end", label: "Término", width: "medium", responsive: "sm" }, { key: "event", label: "Evento" }, { key: "type", label: "Tipo", width: "medium" }]} searchPlaceholder="Buscar evento, data ou tipo..." label="eventos" filterKey="type" filterLabel="Todos os tipos" detailTitleKey="event" /></PageFrame>;
}
