import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { PersonMergeClient } from "./PersonMergeClient";
import { Combine } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function PersonMergePage() {
  const { prisma } = await getTenantContextForSystemAdministration();
  const [people, requests] = await Promise.all([
    prisma.person.findMany({ where: { status: { not: "Arquivado por mesclagem" } }, select: { id: true, fullName: true, cpf: true }, orderBy: { fullName: "asc" }, take: 250 }),
    prisma.personMergeRequest.findMany({
      select: { id: true, status: true, sourcePerson: { select: { fullName: true } }, targetPerson: { select: { fullName: true } }, proposedByUsuario: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return <PageFrame className="max-w-5xl space-y-3 px-1 py-1 md:px-2"><PageHeader title="Mesclagem de duplicidades PF" icon={<Combine className="size-4 shrink-0 text-indigo-600 dark:text-indigo-300" />} className="dark:border-slate-700 dark:bg-slate-800 dark:[&>h1]:text-white" /><p className="text-sm text-slate-500 dark:text-slate-400">Fluxo restrito a administradores do sistema, com dupla aprovação e reversão controlada.</p><PersonMergeClient people={people} requests={requests.map((request) => ({ id: request.id, status: request.status, sourceName: request.sourcePerson.fullName, targetName: request.targetPerson.fullName, proposedBy: request.proposedByUsuario.nome }))} /></PageFrame>;
}
