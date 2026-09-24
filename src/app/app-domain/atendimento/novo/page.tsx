import { ArrowLeft, Headphones } from "lucide-react";
import Link from "next/link";
import { getAttendanceContext } from "@/lib/attendance/access";
import { createTicket } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import NovoChamadoForm from "./NovoChamadoForm";

export const dynamic = "force-dynamic";

export default async function NovoChamadoPage() {
  const { prisma } = await getAttendanceContext("edit");
  const [channels, departments, subjects] = await Promise.all([
    prisma.supportChannel.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.serviceSubject.findMany({ where: { isActive: true }, select: { id: true, name: true, defaultDepartmentId: true, defaultPriority: true, defaultDueDays: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <PageFrame className="max-w-4xl space-y-2">
      <PageHeader title="Novo Atendimento" icon={<Headphones className="size-4 shrink-0 text-violet-600" />} action={<Link href="/atendimento/central" className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-3.5" />Voltar</Link>} />
      <NovoChamadoForm channels={channels} departments={departments} subjects={subjects} createTicketAction={createTicket} />
    </PageFrame>
  );
}
