import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Droplet } from "lucide-react";
import { QualityClient } from "../components/QualityClient";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function QualidadePage() {
  const { prisma } = await getTenantContextForModule("SANEAMENTO");
  const analyses = await prisma.sanWaterQualityAnalysis.findMany({
    select: {
      id: true,
      collectionPoint: true,
      collectedAt: true,
      parameter: true,
      result: true,
      limit: true,
      compliance: true,
      active: true,
    },
    orderBy: { collectedAt: "desc" },
  });

  const serializedAnalyses = analyses.map((analysis) => ({
    ...analysis,
    collectedAt: analysis.collectedAt.toISOString().slice(0, 10),
  }));

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Esgoto e Qualidade" icon={<Droplet className="size-4 shrink-0 text-cyan-500" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <p className="px-1 text-xs text-gray-500 dark:text-gray-400">{analyses.length} análise{analyses.length !== 1 ? "s" : ""} registrada{analyses.length !== 1 ? "s" : ""}</p>
      <div className="min-h-0 flex-1"><QualityClient analyses={serializedAnalyses} /></div>
    </PageFrame>
  );
}
