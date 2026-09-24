import Link from "next/link";
import { DatabaseZap } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { AccessError, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ImportHistory, type ImportBatchRow } from "./ImportHistory";
import { ImportPanel } from "./ImportPanel";

export default async function HealthSusImportsPage() {
  const context = await getTenantContextForModule("SAUDE");
  if (context.user.hasHealthAccessScope) throw new AccessError("Cargas globais do SUS exigem acesso administrativo sem restrição por unidade.", 403);
  const { prisma } = context;
  const batches = await prisma.healthSusImportBatch.findMany({
    take: 20,
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    include: {
      actorUsuario: { select: { nome: true } },
      issues: { take: 100, orderBy: [{ rowNumber: "asc" }, { id: "asc" }], select: { id: true, rowNumber: true, entityType: true, reason: true } },
    },
  });
  const rows: ImportBatchRow[] = batches.map(batch => ({
    id: batch.id, source: batch.source, competence: batch.competence, origin: batch.origin, fileName: batch.fileName,
    fileFormat: batch.fileFormat, contractVersion: batch.contractVersion, status: batch.status,
    processedCount: batch.processedCount, insertedCount: batch.insertedCount, updatedCount: batch.updatedCount,
    ignoredCount: batch.ignoredCount, issueCount: batch.issueCount, startedAt: batch.startedAt.toISOString(),
    completedAt: batch.completedAt?.toISOString() || null, actorName: batch.actorUsuario.nome, issues: batch.issues,
  }));
  return (
    <PageFrame className="flex min-h-0 max-w-none flex-1 flex-col gap-2 overflow-y-auto lg:h-full lg:overflow-hidden">
      <PageHeader title="Importações e Cargas SUS" icon={<DatabaseZap className="size-4 shrink-0 text-emerald-700" />} className="mb-0 shrink-0" action={<div className="flex gap-1"><Link href="/saude/administracao/procedimentos" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Procedimentos</Link><Link href="/saude/administracao" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Administração</Link></div>} />
      <ImportPanel />
      <ImportHistory rows={rows} />
    </PageFrame>
  );
}
