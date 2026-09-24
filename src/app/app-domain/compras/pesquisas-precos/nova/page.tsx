import Link from "next/link";
import { ArrowLeft, SearchCheck } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PriceResearchCreateForm } from "../PriceResearchCreateForm";

export default async function NewPriceResearchPage() {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const processes = await prisma.purchaseProcess.findMany({
    where: { purchaseRequestId: { not: null } },
    select: {
      id: true,
      number: true,
      object: true,
      purchaseRequest: { select: { number: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageFrame className="flex h-[calc(100vh-4rem)] min-h-0 flex-col gap-2 overflow-hidden">
      <ErpPageTitle title="Nova Pesquisa de Preços" icon={<SearchCheck className="size-4 shrink-0 text-emerald-700" />} action={<Link href="/compras/pesquisas-precos" className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-3.5" />Voltar</Link>} />
      <section className="flex min-h-0 flex-1 flex-col overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="shrink-0 border-b border-slate-200 px-3 py-2.5"><h2 className="text-sm font-semibold text-slate-900">Origem e prazo</h2><p className="mt-0.5 text-[11px] text-slate-500">Defina o processo de origem e a janela de recebimento das propostas.</p></div>
        <div className="p-3">
          {processes.length ? <PriceResearchCreateForm processes={processes.flatMap((process) => process.purchaseRequest && process._count.items ? [{ id: process.id, number: process.number, object: process.object, purchaseRequestNumber: process.purchaseRequest.number, itemCount: process._count.items }] : [])} /> : <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Não há processos vinculados a solicitações com itens para iniciar uma pesquisa de preços.</p>}
        </div>
      </section>
    </PageFrame>
  );
}
