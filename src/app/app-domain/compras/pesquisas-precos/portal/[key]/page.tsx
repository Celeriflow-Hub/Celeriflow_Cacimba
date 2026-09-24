import Link from "next/link";
import { CheckCircle2, LockKeyhole, ReceiptText, SearchCheck } from "lucide-react";
import { getCurrentTenantContext } from "@/lib/platform/tenant-context";
import { getSupplierPriceResearchPortalAccess } from "@/lib/compras/price-research";
import { SupplierQuoteForm } from "./SupplierQuoteForm";

export const dynamic = "force-dynamic";

function PortalUnavailable({ reason }: { reason?: "SUPPLIER_INACTIVE" | "RESEARCH_CLOSED" | "QUOTE_SUBMITTED" }) {
  const message = reason === "SUPPLIER_INACTIVE"
    ? "Este fornecedor não está ativo para responder pesquisas de preços."
    : reason === "RESEARCH_CLOSED"
      ? "O prazo desta pesquisa foi encerrado. Nenhuma nova resposta pode ser registrada."
      : "O acesso à cotação está indisponível.";

  return <main className="mx-auto flex h-[calc(100vh-4rem)] min-h-0 w-full max-w-xl items-center px-3 py-3"><section className="w-full rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm"><div className="mx-auto flex size-10 items-center justify-center rounded-full bg-amber-50 text-amber-800"><LockKeyhole className="size-5" /></div><h1 className="mt-3 text-lg font-semibold text-slate-900">Cotação indisponível</h1><p className="mt-2 text-sm leading-6 text-slate-600">{message}</p><Link href="/login" className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Entrar com outra conta</Link></section></main>;
}

export default async function SupplierPriceQuotePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  let access;
  try {
    const context = await getCurrentTenantContext();
    access = await getSupplierPriceResearchPortalAccess(context.prisma, { accessKey: key, authenticatedEmail: context.user.email });
  } catch {
    return <PortalUnavailable />;
  }

  const reportUrl = `/compras/pesquisas-precos/portal/${encodeURIComponent(key)}/relatorio`;
  if (access.unavailableReason === "QUOTE_SUBMITTED") {
    const presentedAt = access.presentedAt;
    return <main className="mx-auto flex h-[calc(100vh-4rem)] min-h-0 w-full max-w-2xl items-center px-3 py-3"><section className="w-full rounded-lg border border-emerald-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><CheckCircle2 className="size-5" /></div><div><h1 className="text-lg font-semibold text-slate-900">Cotação apresentada</h1><p className="mt-1 text-sm leading-6 text-slate-600">Sua proposta para o processo {access.process.number} foi registrada em {presentedAt ? presentedAt.toLocaleString("pt-BR") : "horário registrado pelo servidor"} e não pode ser alterada.</p></div></div><Link href={reportUrl} className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"><ReceiptText className="size-4" />Emitir meu relatório</Link></section></main>;
  }
  if (!access.canRespond) return <PortalUnavailable reason={access.unavailableReason ?? undefined} />;

  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] min-h-0 w-full max-w-4xl flex-col gap-2 overflow-hidden bg-slate-50 px-3 py-3">
      <header className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"><div className="flex size-8 items-center justify-center rounded-md bg-emerald-700 text-white"><SearchCheck className="size-4" /></div><div><p className="text-sm font-bold text-slate-900">Portal do Fornecedor</p><p className="text-[11px] text-slate-500">Resposta de pesquisa de preços</p></div></header>
      <SupplierQuoteForm accessKey={key} quote={{ invitationId: access.invitationId, supplierName: access.supplierName, quoteValue: access.quoteValue, process: access.process }} />
    </main>
  );
}
