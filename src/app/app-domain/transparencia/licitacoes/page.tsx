import { Gavel } from "lucide-react";
import Link from "next/link";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import UploadLicitacoesForm from "./UploadLicitacoesForm";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { LicitacoesClient, type BiddingRow } from "./LicitacoesClient";

export const dynamic = "force-dynamic";

export default async function LicitacoesPage() {
  const { prisma } = await getTenantContextForModule("TRANSPARENCIA");
  const biddings = await prisma.bidding.findMany({
    orderBy: { publicationDate: 'desc' },
    include: {
      process: {
        select: {
          number: true,
          object: true,
          estimatedValue: true,
        }
      }
    }
  });

  const now = new Date();
  const rows: BiddingRow[] = biddings.map((bidding) => {
    let status = "Em Elaboração";
    if (bidding.status === "Concluída" || bidding.status === "Suspensa") status = bidding.status;
    else if (bidding.sessionDate) status = bidding.sessionDate > now ? "Previsto (Aberto)" : "Realizado (Em Julgamento)";
    return {
      id: bidding.id,
      number: bidding.number,
      processNumber: bidding.process.number,
      modality: bidding.modality,
      object: bidding.process.object,
      estimatedValue: bidding.process.estimatedValue || 0,
      openingDate: bidding.sessionDate?.toISOString() || null,
      status,
    };
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      <PageHeader
        title="Licitações abertas"
        icon={<Gavel className="size-4 shrink-0 text-blue-600" />}
        action={<Link href="/compras" className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700">Nova licitação</Link>}
      />
      <div className="mb-1 flex shrink-0 justify-end"><UploadLicitacoesForm /></div>
      <LicitacoesClient rows={rows} />
    </PageFrame>
  );
}
