import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getCurrentTenantContext } from "@/lib/platform/tenant-context";
import { getSupplierPriceQuoteReportAccess } from "@/lib/compras/price-research";
import { CompactItemsTable } from "../../../CompactItemsTable";
import { PrintQuoteButton } from "./PrintQuoteButton";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function UnavailableReport({ message }: { message: string }) {
  return <main className="mx-auto flex h-[calc(100vh-4rem)] min-h-0 w-full max-w-xl items-center px-3 py-3"><section className="w-full rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm"><h1 className="text-lg font-semibold text-slate-900">Relatório indisponível</h1><p className="mt-2 text-sm text-slate-600">{message}</p></section></main>;
}

export default async function SupplierPriceQuoteReportPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  let report: Awaited<ReturnType<typeof getSupplierPriceQuoteReportAccess>> | null = null;
  try {
    const context = await getCurrentTenantContext();
    report = await getSupplierPriceQuoteReportAccess(context.prisma, { accessKey: key, authenticatedEmail: context.user.email });
  } catch {
    return <UnavailableReport message="A proposta não foi encontrada ou este acesso não está autorizado." />;
  }

  if (!report) return <UnavailableReport message="A proposta não foi encontrada ou este acesso não está autorizado." />;
  const presentedAt = report.presentedAt;
  if (!presentedAt) return <UnavailableReport message="A proposta ainda não foi apresentada." />;

  const portalUrl = `/compras/pesquisas-precos/portal/${encodeURIComponent(key)}`;
  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] min-h-0 w-full max-w-4xl flex-col gap-2 overflow-hidden bg-slate-50 px-3 py-3 print:block print:h-auto print:max-w-none print:overflow-visible print:bg-white print:p-0">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 print:hidden"><Link href={portalUrl} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-3.5" />Voltar</Link><PrintQuoteButton /></div>
      <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white p-4 shadow-sm print:block print:overflow-visible print:border-0 print:p-0 print:shadow-none">
        <header className="shrink-0 border-b border-slate-200 pb-3"><div className="flex items-center gap-2"><FileText className="size-5 text-emerald-700" /><h1 className="text-xl font-semibold text-slate-900">Relatório da Cotação Apresentada</h1></div><p className="mt-2 text-sm text-slate-600">Processo {report.process.number} · Proposta apresentada em {presentedAt.toLocaleString("pt-BR")}</p></header>
        <dl className="grid shrink-0 gap-3 py-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold text-slate-500">Fornecedor</dt><dd className="mt-1 text-slate-900">{report.supplierName}</dd></div><div><dt className="font-semibold text-slate-500">Solicitação</dt><dd className="mt-1 text-slate-900">{report.process.purchaseRequestNumber ?? "Vinculada ao processo"}</dd></div><div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Objeto</dt><dd className="mt-1 text-slate-900">{report.process.object}</dd></div></dl>
        <CompactItemsTable items={report.process.items} title="Itens abrangidos" description="Consulta compacta da proposta. A impressão preserva todos os itens." className="min-h-0 flex-1 print:mt-2" printAll />
        <section className="shrink-0 border-t border-slate-200 pt-3 print:mt-4"><p className="text-sm font-semibold text-slate-700">Valor global ofertado</p><p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{money.format(report.quoteValue)}</p><p className="mt-2 text-xs leading-5 text-slate-500">Este comprovante preserva o valor global registrado para o conjunto de itens e a data/hora de apresentação definida pelo servidor.</p></section>
      </article>
    </main>
  );
}
