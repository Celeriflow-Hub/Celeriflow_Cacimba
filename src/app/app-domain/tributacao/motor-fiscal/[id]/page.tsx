import Link from "next/link";
import { ArrowLeft, Landmark } from "lucide-react";
import { notFound } from "next/navigation";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpStatusBadge, ErpTableContainer, ErpTableTd, ErpTableTh, ErpTableThead, ErpTableTr } from "@/components/app-ui/erp/ErpTable";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { getAssessmentAccount } from "@/lib/tributacao/s2-service";

export const dynamic = "force-dynamic";
const money = (value: string | number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export default async function AssessmentAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const result = await getAssessmentAccount(prisma, id).catch(() => null); if (!result) notFound();
  const { assessment, events, position } = result;
  const name = assessment.taxpayer.company?.corporateName ?? assessment.taxpayer.person?.fullName ?? "Contribuinte";
  const movements = [
    { id: `origin-${assessment.id}`, date: assessment.createdAt, type: "CONSTITUIÇÃO", reference: assessment.assessmentNumber ?? assessment.id, amount: position.total.toFixed(2), status: assessment.status },
    ...events.map((event) => ({ id: event.id, date: event.createdAt, type: String(data(event.data).eventType ?? event.title), reference: event.processId ?? event.documentId ?? event.id, amount: String(data(event.data).amount ?? "0"), status: event.status })),
    ...assessment.guides.flatMap((guide) => guide.payments.map((payment) => ({ id: payment.id, date: payment.paymentDate, type: "PAGAMENTO", reference: guide.guideNumber ?? guide.id, amount: `-${payment.amountPaidDecimal?.toFixed(2) ?? payment.amountPaid}`, status: payment.status }))),
  ].sort((a,b) => a.date.getTime()-b.date.getTime());
  return <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-2.5"><ErpPageTitle title={`Conta-corrente ${assessment.assessmentNumber ?? assessment.id}`} description={`${assessment.tax.name} · ${name}`} icon={<Landmark className="size-4 text-emerald-600"/>} action={<Link href="/tributacao/motor-fiscal" className="inline-flex h-7 items-center gap-1 rounded border bg-white px-2 text-xs font-semibold"><ArrowLeft className="size-3.5"/>Voltar</Link>}/><div className="grid shrink-0 grid-cols-2 gap-2 rounded-md border bg-white p-3 sm:grid-cols-5"><div><small className="text-slate-400">Constituído</small><b className="block text-sm">{money(position.total.toFixed(2))}</b></div><div><small className="text-slate-400">Pago</small><b className="block text-sm">{money(position.paid.toFixed(2))}</b></div><div><small className="text-slate-400">Extinto sem caixa</small><b className="block text-sm">{money(position.extinct.toFixed(2))}</b></div><div><small className="text-slate-400">Saldo</small><b className="block text-sm">{money(position.balance.toFixed(2))}</b></div><div><small className="text-slate-400">Situação</small><div><ErpStatusBadge variant={position.balance.equals(0) ? "success" : "info"}>{assessment.status}</ErpStatusBadge></div></div></div><ErpTableContainer><ErpTableThead><tr><ErpTableTh className="w-[14%]">Data</ErpTableTh><ErpTableTh className="w-[20%]">Movimento</ErpTableTh><ErpTableTh>Referência/processo</ErpTableTh><ErpTableTh className="w-[16%] text-right">Valor</ErpTableTh><ErpTableTh className="w-[14%]">Situação</ErpTableTh></tr></ErpTableThead><tbody>{movements.map((movement) => <ErpTableTr key={movement.id}><ErpTableTd>{movement.date.toLocaleDateString("pt-BR")}</ErpTableTd><ErpTableTd>{movement.type}</ErpTableTd><ErpTableTd>{movement.reference}</ErpTableTd><ErpTableTd className="text-right tabular-nums">{money(movement.amount)}</ErpTableTd><ErpTableTd>{movement.status}</ErpTableTd></ErpTableTr>)}</tbody></ErpTableContainer></div>;
}
