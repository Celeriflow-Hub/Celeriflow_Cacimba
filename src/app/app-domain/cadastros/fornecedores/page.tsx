import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import Link from "next/link";
import { Download, Plus, Search, Truck } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import FornecedoresClient from "./FornecedoresClient";
import { getSupplierList, hasActiveSupplierFilters, parseSupplierFilters, SUPPLIER_PAGE_SIZE, supplierFilterSearchParams, type SupplierFilters } from "./supplier-query";

export const dynamic = "force-dynamic";

const filterControlClass = "h-9 w-full rounded border border-slate-300 bg-white px-2 text-base text-slate-700 outline-none focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-600/15 sm:h-7 sm:w-auto sm:text-[11px]";

function supplierListHref(filters: SupplierFilters, page: number) {
  const params = supplierFilterSearchParams({ ...filters, page });
  const query = params.toString();
  return query ? `/cadastros/fornecedores?${query}` : "/cadastros/fornecedores";
}

export default async function FornecedoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getTenantContextForModule("CADASTROS");
  const rawParams = searchParams ? await searchParams : {};
  const filters = parseSupplierFilters(rawParams);
  const referenceDate = new Date();
  const list = await getSupplierList(context.prisma, filters, referenceDate);
  const canCreate = canPerformModuleOperation(context.user, "CADASTROS", "create");
  const canUpdate = canPerformModuleOperation(context.user, "CADASTROS", "update");
  const canIssueReports = canPerformModuleOperation(context.user, "CADASTROS", "issueReports");
  const activeFilters = hasActiveSupplierFilters(filters);
  const reportParams = supplierFilterSearchParams(filters, false).toString();
  const reportHref = reportParams ? `/cadastros/fornecedores/relatorio?${reportParams}` : "/cadastros/fornecedores/relatorio";
  const safePageCount = Math.max(1, list.pageCount || 1);
  const safePage = Math.max(1, list.page || 1);
  const pageStart = Math.max(1, Math.min(safePageCount - 4, safePage - 3));
  const pages = Array.from({ length: Math.min(5, safePageCount) }, (_, index) => pageStart + index).filter((p) => p >= 1 && p <= safePageCount);
  const firstRecord = list.total ? (safePage - 1) * SUPPLIER_PAGE_SIZE + 1 : 0;
  const lastRecord = Math.min(safePage * SUPPLIER_PAGE_SIZE, list.total);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <PageHeader
        className="mb-0 shrink-0"
        title="Fornecedores"
        icon={<Truck className="size-4 shrink-0 text-fuchsia-600" />}
        action={(
          <div className="flex items-center gap-1">
            {canIssueReports && (
              <Link href={reportHref} prefetch={false} aria-label="Baixar relatório CSV de fornecedores" className="inline-flex min-h-9 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:h-7 sm:min-h-0">
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Relatório CSV</span>
              </Link>
            )}
            {canCreate && (
              <Link href="/cadastros/fornecedores/novo" className="inline-flex min-h-9 items-center gap-1 rounded bg-fuchsia-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-fuchsia-800 sm:h-7 sm:min-h-0">
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Adicionar fornecedor</span>
                <span className="sm:hidden">Adicionar</span>
              </Link>
            )}
          </div>
        )}
      />

      <ErpListFrame
        toolbar={(
          <form method="get" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <div className="relative col-span-2 min-w-0 sm:min-w-72 sm:flex-1 sm:max-w-xl">
              <label htmlFor="supplier-search" className="sr-only">Buscar fornecedor</label>
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="supplier-search"
                name="q"
                type="search"
                defaultValue={filters.query}
                placeholder="Nome, CPF, CNPJ, ME/EPP ou situação"
                className="h-9 w-full rounded border border-slate-300 bg-white py-1 pl-9 pr-2 text-base outline-none focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-600/15 sm:h-7 sm:text-[11px]"
              />
            </div>
            <label className="min-w-0">
              <span className="sr-only">Enquadramento empresarial</span>
              <select aria-label="Enquadramento empresarial" name="classification" defaultValue={filters.classification} className={filterControlClass}>
                <option value="ALL">ME/EPP: todos</option>
                <option value="ME">ME</option>
                <option value="EPP">EPP</option>
                <option value="ME_EPP">ME ou EPP</option>
              </select>
            </label>
            <label className="min-w-0">
              <span className="sr-only">Situação cadastral</span>
              <select aria-label="Situação cadastral" name="status" defaultValue={filters.status} className={filterControlClass}>
                <option value="ALL">Situação: todas</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Suspenso">Suspenso</option>
              </select>
            </label>
            <label className="min-w-0">
              <span className="sr-only">Situação das certidões</span>
              <select aria-label="Situação das certidões" name="certification" defaultValue={filters.certification} className={filterControlClass}>
                <option value="ALL">Certidões: todas</option>
                <option value="VENCIDA">Vencidas</option>
                <option value="VENCE_EM_BREVE">Vencem em 30 dias</option>
                <option value="VIGENTE">Vigentes acima de 30 dias</option>
                <option value="SEM_VALIDADE">Sem validade</option>
              </select>
            </label>
            <label className="min-w-0">
              <span className="sr-only">Vencimento a partir de</span>
              <input aria-label="Vencimento a partir de" name="validFrom" type="date" defaultValue={filters.validFrom} className={filterControlClass} />
            </label>
            <label className="min-w-0">
              <span className="sr-only">Vencimento até</span>
              <input aria-label="Vencimento até" name="validUntil" type="date" defaultValue={filters.validUntil} className={filterControlClass} />
            </label>
            <button type="submit" className="inline-flex h-9 items-center justify-center rounded bg-fuchsia-700 px-3 text-xs font-semibold text-white hover:bg-fuchsia-800 sm:h-7">Buscar</button>
            {activeFilters && <Link href="/cadastros/fornecedores" className="inline-flex h-9 items-center justify-center rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:h-7">Limpar</Link>}
          </form>
        )}
        summary={(
          <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-600">
            <p role="status" className="min-w-0 truncate">{activeFilters ? "Filtros aplicados no cadastro completo" : "Consulta no cadastro completo"}</p>
            <span className="shrink-0 text-[11px] text-slate-500">{list.total} registro{list.total === 1 ? "" : "s"}</span>
          </div>
        )}
        pagination={(
          <nav aria-label="Paginação de fornecedores" className="flex min-h-8 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[11px] text-slate-600">
              {list.total ? `Exibindo ${firstRecord} a ${lastRecord} de ${list.total}` : "0 registros"}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {list.total > 0 ? (
                <>
                  {list.page > 1 ? <Link href={supplierListHref(filters, list.page - 1)} className="inline-flex h-8 items-center rounded border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 sm:h-7">Anterior</Link> : <span aria-disabled="true" className="inline-flex h-8 items-center rounded border border-slate-200 bg-slate-100 px-2 text-[11px] text-slate-400 sm:h-7">Anterior</span>}
                  {pages.map((page) => page === list.page ? (
                    <span key={page} aria-current="page" className="inline-flex h-8 items-center rounded bg-fuchsia-700 px-2 text-[11px] font-semibold text-white sm:h-7">{page}</span>
                  ) : (
                    <Link key={page} href={supplierListHref(filters, page)} className="inline-flex h-8 items-center rounded border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 sm:h-7">{page}</Link>
                  ))}
                  {list.page < list.pageCount ? <Link href={supplierListHref(filters, list.page + 1)} className="inline-flex h-8 items-center rounded border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 sm:h-7">Próxima</Link> : <span aria-disabled="true" className="inline-flex h-8 items-center rounded border border-slate-200 bg-slate-100 px-2 text-[11px] text-slate-400 sm:h-7">Próxima</span>}
                </>
              ) : <span className="text-[11px] text-slate-500">Página 1 de 1</span>}
            </div>
          </nav>
        )}
      >
        <FornecedoresClient
          suppliers={list.suppliers}
          canUpdate={canUpdate}
          hasFilters={activeFilters}
          referenceDate={referenceDate.toISOString()}
        />
      </ErpListFrame>
    </PageFrame>
  );
}
