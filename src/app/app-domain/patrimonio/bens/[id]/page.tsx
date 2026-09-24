import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContextForModule, canPerformModuleOperation, canViewModule } from "@/lib/platform/tenant-context";
import { assetOperationWhere } from "@/lib/patrimonio/asset-operations";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { AssetOperationsClient } from "./AssetOperationsClient";

export const dynamic = "force-dynamic";
const day = (v: Date | null) => v?.toISOString().slice(0, 10).split("-").reverse().join("/") || "—";
export default async function AssetDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const context = await getTenantContextForModule("PATRIMONIO"), { id } = await params;
  const page = Math.min(100000, Math.max(1, Number.parseInt((await searchParams).page || "1", 10) || 1));
  const asset = await context.prisma.asset.findFirst({ where: { id, ...assetOperationWhere(context) }, include: { department: true, responsible: { select: { name: true } }, fleetUnit: { select: { id: true, code: true, name: true, status: true } } } });
  if (!asset) notFound();
  const [maintenances, count, open, transfers] = await Promise.all([
    context.prisma.assetMaintenance.findMany({ where: { assetId: id }, orderBy: [{ startDate: "desc" }, { id: "desc" }], take: 10, skip: (page - 1) * 10, include: { fleetOrder: { select: { id: true } } } }),
    context.prisma.assetMaintenance.count({ where: { assetId: id } }),
    context.prisma.assetMaintenance.findMany({ where: { assetId: id, status: { in: ["Solicitada", "Em manutenção"] } }, orderBy: [{ startDate: "asc" }, { id: "asc" }], include: { fleetOrder: { select: { id: true } } } }),
    context.prisma.assetTransfer.findMany({ where: { assetId: id }, take: 10, orderBy: [{ date: "desc" }, { id: "desc" }], include: { fromDepartment: { select: { name: true } }, toDepartment: { select: { name: true } }, toResponsible: { select: { name: true } } } }),
  ]);
  return <PageFrame className="space-y-3">
    <PageHeader title={`${asset.patrimonyNumber} · ${asset.name}`} action={<Link href="/patrimonio/bens" className="rounded border bg-white px-3 py-2 text-sm">Bens patrimoniais</Link>} />
    <dl className="grid gap-3 rounded-md border bg-white p-4 text-sm sm:grid-cols-3">{Object.entries({ "Setor de origem": asset.department?.name || "Sem setor", "Responsável": asset.responsible?.name || "Não informado", "Situação patrimonial": asset.status, "Marca / modelo": [asset.brand, asset.model].filter(Boolean).join(" / ") || "—", "Documento de aquisição": asset.invoiceNumber || "—", "Valor contábil": asset.currentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }).map(([title, value]) => <div key={title}><dt className="text-xs text-slate-500">{title}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl>
    {asset.fleetUnit && canViewModule(context.user, "FROTAS") && <Link href={`/frotas?unitId=${encodeURIComponent(asset.fleetUnit.id)}`} className="block rounded border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">Abrir unidade em Frotas · {asset.fleetUnit.code} · {asset.fleetUnit.name}</Link>}
    <AssetOperationsClient key={asset.updatedAt.toISOString()} assetId={id} version={asset.updatedAt.toISOString()} canUpdate={!['Baixado', 'Inativo'].includes(asset.status) && canPerformModuleOperation(context.user, "PATRIMONIO", "update")} maintenances={open.map(m => ({ id: m.id, description: m.description, startDate: m.startDate.toISOString().slice(0, 10), status: m.status, fleetOrderId: m.fleetOrder?.id || null }))} />
    <section className="rounded-md border bg-white"><h2 className="border-b p-3 text-sm font-semibold">Histórico de manutenções · origem compartilhada</h2><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50"><tr>{["Início / conclusão", "Serviços", "Situação", "Custo de serviços", "OS de origem"].map(v => <th key={v} className="p-3 font-medium">{v}</th>)}</tr></thead><tbody>{maintenances.map(m => <tr key={m.id} className="border-t"><td className="p-3">{day(m.startDate)} / {day(m.endDate)}</td><td className="max-w-80 whitespace-pre-wrap p-3">{m.description}</td><td className="p-3">{m.status}</td><td className="p-3">{m.cost == null ? "Não informado" : m.cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td><td className="p-3">{m.fleetOrder?.id || "Patrimônio"}</td></tr>)}{!maintenances.length && <tr><td colSpan={5} className="p-4 text-slate-500">Nenhuma manutenção neste recorte.</td></tr>}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t p-3 text-xs"><span>{count} manutenção(ões) · página {page}</span><div className="flex gap-3">{page > 1 && <Link href={`?page=${page - 1}`}>Anterior</Link>}{page * 10 < count && <Link href={`?page=${page + 1}`}>Próxima</Link>}</div></div></section>
    <section className="rounded-md border bg-white p-4"><h2 className="text-sm font-semibold">Últimas 10 transferências aprovadas</h2><ul className="mt-3 space-y-3 text-sm">{transfers.map(t => <li key={t.id}>{day(t.date)} · {t.fromDepartment?.name || "Sem setor"} → {t.toDepartment?.name || "Sem setor"} · {t.toResponsible?.name || "Sem responsável"}<p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{t.reason}</p></li>)}{!transfers.length && <li className="text-slate-500">Nenhuma transferência registrada.</li>}</ul></section>
    <Link href="/patrimonio/ciclo-vida" className="inline-block rounded border bg-white px-3 py-2 text-sm">Depreciação, ajustes e baixa patrimonial</Link>
  </PageFrame>;
}
