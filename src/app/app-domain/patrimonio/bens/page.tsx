import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import type { Prisma } from "@prisma/client";
import { Box, FileCheck, Plus, Search } from "lucide-react";
import Link from "next/link";
import {
  clampPatrimonioListPage,
  patrimonioListHref,
  parsePatrimonioListPage,
  PATRIMONIO_LIST_PAGE_SIZE,
} from "../listing";
import { AssetRowActions } from "./AssetRowActions";

type SearchParams = { q?: string; status?: string; page?: string; tab?: string };

export default async function BensPatrimoniaisPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const context = await getTenantContextForModule("PATRIMONIO");
  const { prisma } = context;
  const params = await searchParams;
  const q = params?.q?.trim() || "";
  const status = params?.status || "";
  const activeTab = params?.tab === "tombamento" ? "tombamento" : "lista";
  const requestedPage = parsePatrimonioListPage(params?.page);

  const where: Prisma.AssetWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { patrimonyNumber: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  const [total, tombamentoTotal] = await Promise.all([
    prisma.asset.count({ where }),
    prisma.asset.count(),
  ]);

  const page = clampPatrimonioListPage(requestedPage, total);
  const assets = await prisma.asset.findMany({
    where,
    skip: (page - 1) * PATRIMONIO_LIST_PAGE_SIZE,
    take: PATRIMONIO_LIST_PAGE_SIZE,
    orderBy: activeTab === "tombamento" ? { acquisitionDate: "desc" } : { createdAt: "desc" },
    include: {
      category: true,
      department: true,
      responsible: true,
      realEstate: true,
      supplier: {
        include: { company: true }
      }
    },
  });

  const hrefValues = { q, status, tab: activeTab };
  const canUpdate = canPerformModuleOperation(context.user, "PATRIMONIO", "update");

  function tabHref(tab: "lista" | "tombamento") {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (status) search.set("status", status);
    if (tab !== "lista") search.set("tab", tab);
    const query = search.toString();
    return query ? `/patrimonio/bens?${query}` : "/patrimonio/bens";
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
      <ErpPageTitle
        title="Bens Patrimoniais e Equipamentos"
        action={
          <>
            <Link href="/patrimonio/ciclo-vida" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <span className="hidden sm:inline">Ciclo de vida</span>
              <span className="sm:hidden">Ciclo</span>
            </Link>
            <Link href="/patrimonio/bens/novo" className={buttonVariants({ size: "sm" })}>
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Tombar novo bem</span>
              <span className="sm:hidden">Novo</span>
            </Link>
          </>
        }
      />

      {/* Cards de Navegação / Abas */}
      <div className="grid grid-cols-2 gap-2 sm:w-96">
        <Link
          href={tabHref("lista")}
          className={`flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors ${
            activeTab === "lista"
              ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Box className={`size-4 shrink-0 ${activeTab === "lista" ? "text-emerald-700" : "text-slate-400"}`} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold leading-none">Lista de Bens</p>
            <p className="mt-1 text-[10px] text-slate-500">{total} bens cadastrados</p>
          </div>
        </Link>

        <Link
          href={tabHref("tombamento")}
          className={`flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors ${
            activeTab === "tombamento"
              ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileCheck className={`size-4 shrink-0 ${activeTab === "tombamento" ? "text-emerald-700" : "text-slate-400"}`} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold leading-none">Histórico de Tombamento</p>
            <p className="mt-1 text-[10px] text-slate-500">{tombamentoTotal} registros tombados</p>
          </div>
        </Link>
      </div>

      <ErpListFrame
        toolbar={
          <form className="flex flex-wrap items-center gap-2" role="search">
            <input type="hidden" name="tab" value={activeTab} />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Tombamento, marca, modelo ou descrição..."
              className="h-8 min-w-0 flex-1 bg-white text-xs sm:min-w-72"
            />
            <select
              name="status"
              defaultValue={status}
              aria-label="Filtrar por situação"
              className="h-8 w-36 rounded-md border border-input bg-white px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todas as situações</option>
              <option value="Ativo">Ativo</option>
              <option value="Em uso">Em uso</option>
              <option value="Ocioso">Ocioso</option>
              <option value="Em manutenção">Em manutenção</option>
              <option value="Inativo">Inativo</option>
              <option value="Baixado">Baixado</option>
            </select>
            <button type="submit" className={buttonVariants({ size: "sm" })}>
              <Search className="size-3.5" />
              Filtrar
            </button>
          </form>
        }
        summary={<p className="text-[11px] text-slate-600"><strong className="text-slate-900">{total}</strong> registros na exibição de {activeTab === "tombamento" ? "Histórico de Tombamentos" : "Lista de Bens"}</p>}
        pagination={
          <ErpPagination
            page={page}
            total={total}
            pageSize={PATRIMONIO_LIST_PAGE_SIZE}
            label="bens"
            previousHref={patrimonioListHref("/patrimonio/bens", page - 1, hrefValues)}
            nextHref={patrimonioListHref("/patrimonio/bens", page + 1, hrefValues)}
          />
        }
      >
        {activeTab === "tombamento" ? (
          /* Tabela de Histórico de Tombamento */
          <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <tr className="h-7">
                <th className="w-[12%] px-3 text-left">Nº Tombamento</th>
                <th className="w-[10%] px-3 text-left">Data Tombo</th>
                <th className="w-[30%] px-3 text-left">Equipamento / Descrição</th>
                <th className="hidden w-[14%] px-3 text-left xl:table-cell">Marca / Modelo</th>
                <th className="hidden w-[15%] px-3 text-left 2xl:table-cell">Departamento / Setor</th>
                <th className="w-[12%] px-3 text-right">Valor Aquisição</th>
                <th className="w-[3.5rem] px-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    Nenhum registro de tombamento encontrado.
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
                    <td className="px-3 py-0 tabular-nums text-slate-600">
                      {asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—"}
                    </td>
                    <td className="px-3 py-0 font-medium"><span className="block truncate">{asset.name}</span></td>
                    <td className="hidden px-3 py-0 xl:table-cell"><span className="block truncate">{asset.brand ? `${asset.brand} ${asset.model || ""}` : "—"}</span></td>
                    <td className="hidden px-3 py-0 text-slate-600 2xl:table-cell">
                      <span className="block truncate">{asset.department?.name || "Não atribuído"}</span>
                    </td>
                    <td className="px-3 py-0 text-right font-medium tabular-nums">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(asset.acquisitionValue)}
                    </td>
                    <td className="px-2 py-0"><AssetRowActions asset={{ id: asset.id, name: asset.name, status: asset.status }} canUpdate={canUpdate} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          /* Tabela Principal: Lista de Bens */
          <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <tr className="h-7">
                <th className="w-[12%] px-3 text-left">Tombamento</th>
                <th className="w-[32%] px-3 text-left">Descrição do Equipamento</th>
                <th className="hidden w-[14%] px-3 text-left xl:table-cell">Categoria</th>
                <th className="hidden w-[18%] px-3 text-left 2xl:table-cell">Localização</th>
                <th className="w-[12%] px-3 text-left">Situação</th>
                <th className="w-[12%] px-3 text-right">Valor Atual</th>
                <th className="w-[3.5rem] px-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    Nenhum bem patrimonial encontrado para os filtros informados.
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
                    <td className="px-3 py-0 font-medium"><span className="block truncate">{asset.name}</span></td>
                    <td className="hidden px-3 py-0 xl:table-cell"><span className="block truncate">{asset.category?.name || "—"}</span></td>
                    <td className="hidden px-3 py-0 text-slate-600 2xl:table-cell">
                      <span className="block truncate">
                        {asset.realEstate
                          ? `${asset.realEstate.propertyType || "Imóvel"} · ${asset.realEstate.streetName || "Sem endereço"}`
                          : asset.department?.name || "Não vinculado"}
                      </span>
                    </td>
                    <td className="px-3 py-0">
                      <Badge
                        variant={asset.status === "Ativo" || asset.status === "Em uso" ? "default" : asset.status === "Baixado" ? "destructive" : "secondary"}
                        className="max-w-full truncate px-1.5 py-0 text-[10px] leading-4"
                      >
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-0 text-right font-medium tabular-nums">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(asset.currentValue)}
                    </td>
                    <td className="px-2 py-0"><AssetRowActions asset={{ id: asset.id, name: asset.name, status: asset.status }} canUpdate={canUpdate} /></td>
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
