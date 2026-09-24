import Link from "next/link";
import { AssetLifecycleClient } from "./AssetLifecycleClient";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import {
  clampPatrimonioListPage,
  patrimonioListHref,
  parsePatrimonioListPage,
  PATRIMONIO_LIST_PAGE_SIZE,
} from "../listing";

type LifecycleView = "posicao" | "baixas" | "ajustes";

type SearchParams = {
  page?: string;
  view?: string;
};

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function parseLifecycleView(value: string | undefined): LifecycleView {
  if (value === "baixas" || value === "ajustes") return value;
  return "posicao";
}

function lifecycleHref(view: LifecycleView, page: number) {
  return patrimonioListHref("/patrimonio/ciclo-vida", page, { view });
}

function viewLabel(view: LifecycleView) {
  if (view === "baixas") return "baixa(s) e alienação(ões)";
  if (view === "ajustes") return "ajuste(s) de valor";
  return "bem(ns) patrimonial(is)";
}

function adjustmentLabel(type: string) {
  return {
    REVALUATION: "Reavaliação",
    IMPAIRMENT: "Impairment",
    SUBSEQUENT_COST: "Custo subsequente",
  }[type] ?? type;
}

export default async function AssetLifecyclePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const { prisma } = await getTenantContextForModule("PATRIMONIO");
  const params = await searchParams;
  const view = parseLifecycleView(params?.view);
  const requestedPage = parsePatrimonioListPage(params?.page);
  const activeAssetWhere = { status: { notIn: ["Baixado", "Inativo"] } };

  const [assetTotal, activeAssetValue, writeOffTotal, adjustmentTotal] = await Promise.all([
    view === "posicao" ? prisma.asset.count() : Promise.resolve(0),
    view === "posicao" ? prisma.asset.aggregate({ where: activeAssetWhere, _sum: { currentValue: true } }) : Promise.resolve({ _sum: { currentValue: 0 } }),
    view === "baixas" ? prisma.assetWriteOff.count() : Promise.resolve(0),
    view === "ajustes" ? prisma.assetValueAdjustment.count() : Promise.resolve(0),
  ]);

  const total = view === "posicao" ? assetTotal : view === "baixas" ? writeOffTotal : adjustmentTotal;
  const page = clampPatrimonioListPage(requestedPage, total);
  const pageWindow = {
    skip: (page - 1) * PATRIMONIO_LIST_PAGE_SIZE,
    take: PATRIMONIO_LIST_PAGE_SIZE,
  };

  const [assets, writeOffs, adjustments] = await Promise.all([
    view === "posicao"
      ? prisma.asset.findMany({
          ...pageWindow,
          orderBy: { patrimonyNumber: "asc" },
          select: {
            id: true,
            patrimonyNumber: true,
            name: true,
            currentValue: true,
            status: true,
            category: { select: { name: true, lifeSpan: true } },
            valueHistory: {
              orderBy: { referenceMonth: "desc" },
              take: 1,
              select: { referenceMonth: true, depreciation: true },
            },
          },
        })
      : Promise.resolve([]),
    view === "baixas"
      ? prisma.assetWriteOff.findMany({
          ...pageWindow,
          orderBy: { date: "desc" },
          select: {
            id: true,
            date: true,
            type: true,
            disposalValue: true,
            bookValue: true,
            gainLoss: true,
            asset: { select: { patrimonyNumber: true, name: true } },
            integrationPending: { select: { id: true, status: true, expectedEventCode: true } },
            accountingTransaction: { select: { id: true } },
          },
        })
      : Promise.resolve([]),
    view === "ajustes"
      ? prisma.assetValueAdjustment.findMany({
          ...pageWindow,
          orderBy: { date: "desc" },
          select: {
            id: true,
            date: true,
            type: true,
            adjustmentValue: true,
            closingValue: true,
            evidence: true,
            asset: { select: { patrimonyNumber: true, name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const totalBookValue = activeAssetValue._sum?.currentValue ?? 0;
  const initialCompetence = new Date().toISOString().slice(0, 7);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-3">
      <ErpPageTitle
        title="Ciclo de vida patrimonial"
      />

      <details className="shrink-0 border border-slate-300 bg-white shadow-sm">
        <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-slate-800 marker:text-slate-500">
          Operações de ciclo de vida (depreciação, baixas e reavaliação)
        </summary>
        <div className="border-t border-slate-200 p-3">
          <AssetLifecycleClient initialCompetence={initialCompetence} />
        </div>
      </details>

      <ErpListFrame
        toolbar={
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <Link
              href={lifecycleHref("posicao", 1)}
              className={`rounded border px-2.5 py-1 transition-colors ${
                view === "posicao"
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              Posição patrimonial
            </Link>
            <Link
              href={lifecycleHref("baixas", 1)}
              className={`rounded border px-2.5 py-1 transition-colors ${
                view === "baixas"
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              Baixas e alienações ({writeOffTotal})
            </Link>
            <Link
              href={lifecycleHref("ajustes", 1)}
              className={`rounded border px-2.5 py-1 transition-colors ${
                view === "ajustes"
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              Ajustes de valor ({adjustmentTotal})
            </Link>
          </div>
        }
        summary={
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
            <p>
              Exibindo <strong className="text-slate-900">{total}</strong> {viewLabel(view)}
            </p>
            {view === "posicao" && (
              <p>
                Valor contábil total: <strong className="text-emerald-800">{currency(totalBookValue)}</strong>
              </p>
            )}
          </div>
        }
        pagination={
          <ErpPagination
            page={page}
            total={total}
            pageSize={PATRIMONIO_LIST_PAGE_SIZE}
            label={viewLabel(view)}
            previousHref={lifecycleHref(view, page - 1)}
            nextHref={lifecycleHref(view, page + 1)}
          />
        }
      >
        {view === "posicao" && (
          <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <tr className="h-7">
                <th className="w-[14%] px-3 text-left">Tombamento</th>
                <th className="w-[36%] px-3 text-left">Descrição</th>
                <th className="hidden w-[16%] px-3 text-left md:table-cell">Categoria</th>
                <th className="w-[12%] px-3 text-left">Situação</th>
                <th className="hidden w-[10%] px-3 text-right lg:table-cell">Vida útil</th>
                <th className="w-[12%] px-3 text-right">Valor líquido</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                    Nenhum bem patrimonial encontrado.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="h-[clamp(24px,2.8vh,34px)] border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-0 font-semibold text-emerald-800">
                      <Link className="block truncate underline-offset-2 hover:underline" href={`/patrimonio/bens/${encodeURIComponent(asset.id)}`}>
                        {asset.patrimonyNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-0 font-medium">
                      <span className="block truncate">{asset.name}</span>
                    </td>
                    <td className="hidden px-3 py-0 md:table-cell">
                      <span className="block truncate">{asset.category?.name || "—"}</span>
                    </td>
                    <td className="px-3 py-0">
                      <span className="block truncate font-semibold text-slate-700">{asset.status}</span>
                    </td>
                    <td className="hidden px-3 py-0 text-right tabular-nums lg:table-cell">
                      {asset.category?.lifeSpan ? `${asset.category.lifeSpan} anos` : "—"}
                    </td>
                    <td className="px-3 py-0 text-right font-semibold tabular-nums text-emerald-800">
                      {currency(asset.currentValue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {view === "baixas" && (
          <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <tr className="h-7">
                <th className="w-[12%] px-3 text-left">Data</th>
                <th className="w-[13%] px-3 text-left">Tombamento</th>
                <th className="w-[30%] px-3 text-left">Descrição do bem</th>
                <th className="w-[10%] px-3 text-left">Tipo</th>
                <th className="w-[12%] px-3 text-right">Valor contábil</th>
                <th className="w-[11%] px-3 text-right">Recebido</th>
                <th className="w-[12%] px-3 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {writeOffs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    Nenhuma baixa ou alienação registrada.
                  </td>
                </tr>
              ) : (
                writeOffs.map((writeOff) => (
                  <tr key={writeOff.id} className="h-[clamp(24px,2.8vh,34px)] border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-0 tabular-nums">{new Date(writeOff.date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                    <td className="px-3 py-0 font-semibold text-emerald-800">
                      <span className="block truncate">{writeOff.asset.patrimonyNumber}</span>
                    </td>
                    <td className="px-3 py-0 font-medium">
                      <span className="block truncate">{writeOff.asset.name}</span>
                    </td>
                    <td className="px-3 py-0">
                      <span className="block truncate font-semibold">{writeOff.type}</span>
                    </td>
                    <td className="px-3 py-0 text-right tabular-nums">{currency(writeOff.bookValue)}</td>
                    <td className="px-3 py-0 text-right tabular-nums">{currency(writeOff.disposalValue)}</td>
                    <td className={`px-3 py-0 text-right font-semibold tabular-nums ${writeOff.gainLoss < 0 ? "text-rose-700" : writeOff.gainLoss > 0 ? "text-emerald-700" : "text-slate-600"}`}>
                      {currency(writeOff.gainLoss)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {view === "ajustes" && (
          <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <tr className="h-7">
                <th className="w-[12%] px-3 text-left">Data</th>
                <th className="w-[13%] px-3 text-left">Tombamento</th>
                <th className="w-[32%] px-3 text-left">Descrição do bem</th>
                <th className="w-[15%] px-3 text-left">Tipo de ajuste</th>
                <th className="w-[14%] px-3 text-right">Valor ajuste</th>
                <th className="w-[14%] px-3 text-right">Novo valor contábil</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                    Nenhum ajuste de valor registrado.
                  </td>
                </tr>
              ) : (
                adjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="h-[clamp(24px,2.8vh,34px)] border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-0 tabular-nums">{new Date(adjustment.date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                    <td className="px-3 py-0 font-semibold text-emerald-800">
                      <span className="block truncate">{adjustment.asset.patrimonyNumber}</span>
                    </td>
                    <td className="px-3 py-0 font-medium">
                      <span className="block truncate">{adjustment.asset.name}</span>
                    </td>
                    <td className="px-3 py-0">
                      <span className="block truncate font-semibold">{adjustmentLabel(adjustment.type)}</span>
                    </td>
                    <td className="px-3 py-0 text-right font-semibold tabular-nums text-emerald-800">
                      {currency(adjustment.adjustmentValue)}
                    </td>
                    <td className="px-3 py-0 text-right font-bold tabular-nums">
                      {currency(adjustment.closingValue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </ErpListFrame>
    </div>
  );
}
