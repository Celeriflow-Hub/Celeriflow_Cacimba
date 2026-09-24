import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getPublicExpenses,
  getPublicRevenues,
  parsePublicDataFilter,
  type PublicDataFilter,
} from "@/lib/transparencia/portal-fiscal";
import { getPublicBiddings, getPublicContracts, getPublicFinancialReportSnapshots } from "@/lib/transparencia/portal-public";
import { getPublicNotices } from "@/lib/transparencia/public-notices";

export const dynamic = "force-dynamic";

type PortalSearchParams = {
  view?: string;
  year?: string;
  search?: string;
  budgetUnitCode?: string;
  resourceSourceCode?: string;
  expenseNatureCode?: string;
  revenueClassification?: string;
  page?: string;
  pageSize?: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(value) : "-";
}

function queryFor(filter: PublicDataFilter, page?: number, extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (filter.year) params.set("year", String(filter.year));
  if (filter.search) params.set("search", filter.search);
  if (filter.budgetUnitCode) params.set("budgetUnitCode", filter.budgetUnitCode);
  if (filter.resourceSourceCode) params.set("resourceSourceCode", filter.resourceSourceCode);
  if (filter.expenseNatureCode) params.set("expenseNatureCode", filter.expenseNatureCode);
  if (filter.revenueClassification) params.set("revenueClassification", filter.revenueClassification);
  if (filter.pageSize && filter.pageSize !== 50) params.set("pageSize", String(filter.pageSize));
  if (page && page > 1) params.set("page", String(page));
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  return params.toString();
}

function SectionPagination({
  filter,
  currentPage,
  total,
  pageSize,
  view,
}: {
  filter: PublicDataFilter;
  currentPage: number;
  total: number;
  pageSize: number;
  view: "despesas" | "receitas";
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>{total} registro(s) encontrado(s)</span>
      <div className="flex items-center gap-4">
        {currentPage > 1 ? <Link className="font-semibold text-sky-800 hover:underline" href={`/portal-transparencia?${queryFor(filter, currentPage - 1, { view })}`}>Anterior</Link> : <span className="text-slate-400">Anterior</span>}
        <span>Página {currentPage} de {totalPages}</span>
        {currentPage < totalPages ? <Link className="font-semibold text-sky-800 hover:underline" href={`/portal-transparencia?${queryFor(filter, currentPage + 1, { view })}`}>Próxima</Link> : <span className="text-slate-400">Próxima</span>}
      </div>
    </div>
  );
}

export default async function PortalTransparenciaPage({ searchParams }: { searchParams: Promise<PortalSearchParams> }) {
  const rawParams = await searchParams;
  const view = rawParams.view === "receitas" ? "receitas" : "despesas";
  const filter = parsePublicDataFilter(new URLSearchParams(
    Object.entries(rawParams).flatMap(([key, value]) => value === undefined ? [] : [[key, value]]),
  ));
  const expenses = view === "despesas" ? await getPublicExpenses(prisma, filter) : null;
  const revenues = view === "receitas" ? await getPublicRevenues(prisma, filter) : null;
  const activeResult = expenses ?? revenues!;
  const exportPath = `/api/transparencia/${view}?${queryFor(filter, activeResult.page, { format: "csv" })}`;
  const [reports, contracts, biddings, notices, institution] = await Promise.all([
    getPublicFinancialReportSnapshots(prisma),
    getPublicContracts(prisma),
    getPublicBiddings(prisma),
    getPublicNotices(prisma),
    prisma.institution.findFirst({ select: { name: true, phone: true, email: true, address: true, city: true, state: true, website: true } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b-4 border-emerald-500 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Dados abertos</p>
            <h1 className="mt-1 text-2xl font-bold">Portal da Transparência</h1>
            <p className="mt-1 text-sm text-slate-300">Execução orçamentária e financeira de {institution?.name ?? "Prefeitura Municipal de Divino de São Lourenço"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold hover:border-white hover:bg-slate-800" href="/portal">Portal Institucional</Link>
            <a className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold hover:border-white hover:bg-slate-800" href="#consulta">Ir para consulta</a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        <section className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          <strong>Consulta pública sem cadastro.</strong> Valores refletem os registros internos disponíveis para empenho, liquidação, pagamento e arrecadação. Documentos de fornecedores são mascarados e dados pessoais não são publicados.
        </section>

        <section id="consulta" className="mt-6 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-bold">Consulta de execução</h2>
              <p className="text-sm text-slate-500">Filtros aplicados à página e à exportação CSV.</p>
            </div>
            <a className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" href={exportPath}>Exportar página em CSV</a>
          </div>

          <div className="flex border-b border-slate-200 px-5 pt-3">
            <Link className={`border-b-2 px-4 py-3 text-sm font-bold ${view === "despesas" ? "border-emerald-600 text-emerald-800" : "border-transparent text-slate-500 hover:text-slate-900"}`} href={`/portal-transparencia?${queryFor(filter, 1, { view: "despesas" })}`}>Despesas</Link>
            <Link className={`border-b-2 px-4 py-3 text-sm font-bold ${view === "receitas" ? "border-emerald-600 text-emerald-800" : "border-transparent text-slate-500 hover:text-slate-900"}`} href={`/portal-transparencia?${queryFor(filter, 1, { view: "receitas" })}`}>Receitas</Link>
          </div>

          <form className="grid gap-3 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <input type="hidden" name="view" value={view} />
            <label className="text-sm font-medium text-slate-700">Exercício<input name="year" inputMode="numeric" defaultValue={filter.year} placeholder="Ex.: 2026" className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Busca<input name="search" defaultValue={filter.search} placeholder="Número, natureza, unidade ou fonte" className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Unidade orçamentária<input name="budgetUnitCode" defaultValue={filter.budgetUnitCode} placeholder="Código da unidade" className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Fonte de recursos<input name="resourceSourceCode" defaultValue={filter.resourceSourceCode} placeholder="Código da fonte" className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
            {view === "despesas" ? <label className="text-sm font-medium text-slate-700">Natureza da despesa<input name="expenseNatureCode" defaultValue={filter.expenseNatureCode} placeholder="Código da natureza" className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label> : <label className="text-sm font-medium text-slate-700">Classificação<select name="revenueClassification" defaultValue={filter.revenueClassification ?? ""} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Todas</option><option value="ORCAMENTARIA">Orçamentária</option><option value="INTRAORCAMENTARIA">Intraorçamentária</option><option value="REDUTORA">Redutora</option></select></label>}
            <label className="text-sm font-medium text-slate-700">Registros por página<select name="pageSize" defaultValue={filter.pageSize} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label>
            <div className="flex items-end gap-3"><button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Aplicar filtros</button><Link href={`/portal-transparencia?view=${view}`} className="px-2 py-2 text-sm font-semibold text-sky-800 hover:underline">Limpar</Link></div>
          </form>

          {expenses ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Empenho</th><th className="px-4 py-3">Origem da compra</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Classificação</th><th className="px-4 py-3">Unidade / Fonte</th><th className="px-4 py-3 text-right">Empenhado</th><th className="px-4 py-3 text-right">Liquidado</th><th className="px-4 py-3 text-right">Pago</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {expenses.data.map((expense) => <tr key={expense.number} className="align-top hover:bg-slate-50"><td className="px-4 py-3 font-semibold">{expense.number}<span className="block text-xs font-normal text-slate-500">{formatDate(expense.date)} · {expense.status}</span></td><td className="px-4 py-3">{expense.contractNumber}<span className="block text-xs text-slate-500">Recebimento: {expense.receiptNumber} · {formatDate(expense.receiptDate)}</span><span className="block text-xs text-slate-500">Processo: {expense.processNumber}</span></td><td className="px-4 py-3">{expense.supplierName}<span className="block text-xs text-slate-500">{expense.supplierDocumentMasked}</span></td><td className="px-4 py-3">{expense.budgetClassificationCode}<span className="block text-xs text-slate-500">{expense.expenseNatureCode} · {expense.expenseNatureName}</span></td><td className="px-4 py-3">{expense.budgetUnitCode} · {expense.budgetUnitName}<span className="block text-xs text-slate-500">{expense.resourceSourceCode} · {expense.resourceSourceName}</span></td><td className="px-4 py-3 text-right font-medium">{formatMoney(expense.committedValue)}</td><td className="px-4 py-3 text-right">{formatMoney(expense.settledValue)}<span className="block text-xs text-slate-500">{expense.settlementCount} liquidação(ões), {formatDate(expense.latestSettlementDate)}</span></td><td className="px-4 py-3 text-right">{formatMoney(expense.paidValue)}<span className="block text-xs text-slate-500">{expense.paidPaymentCount} pagamento(s), {formatDate(expense.latestPaymentDate)}</span></td></tr>)}
                  {expenses.data.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Nenhuma despesa encontrada para os filtros informados.</td></tr>}
                </tbody>
              </table>
              <SectionPagination filter={filter} currentPage={expenses.page} total={expenses.total} pageSize={expenses.pageSize} view="despesas" />
            </div>
          ) : revenues ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Arrecadação</th><th className="px-4 py-3">Classificação</th><th className="px-4 py-3">Natureza da receita</th><th className="px-4 py-3">Unidade / Fonte</th><th className="px-4 py-3 text-right">Valor</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {revenues.data.map((revenue, index) => <tr key={`${revenue.date.toISOString()}-${revenue.revenueNatureCode}-${index}`} className="align-top hover:bg-slate-50"><td className="px-4 py-3 font-medium">{formatDate(revenue.collectionDate ?? revenue.date)}<span className="block text-xs font-normal text-slate-500">Lançamento: {formatDate(revenue.launchDate)}</span></td><td className="px-4 py-3">{revenue.classification}<span className="block text-xs text-slate-500">{revenue.status}</span></td><td className="px-4 py-3">{revenue.revenueNatureCode}<span className="block text-xs text-slate-500">{revenue.revenueNatureName}</span></td><td className="px-4 py-3">{revenue.budgetUnitCode ? `${revenue.budgetUnitCode} · ${revenue.budgetUnitName}` : "Unidade não informada"}<span className="block text-xs text-slate-500">{revenue.resourceSourceCode} · {revenue.resourceSourceName}</span></td><td className="px-4 py-3 text-right font-medium">{formatMoney(revenue.value)}</td></tr>)}
                  {revenues.data.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Nenhuma receita encontrada para os filtros informados.</td></tr>}
                </tbody>
              </table>
              <SectionPagination filter={filter} currentPage={revenues.page} total={revenues.total} pageSize={revenues.pageSize} view="receitas" />
            </div>
          ) : null}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div><h2 className="text-lg font-bold">Relatórios legais</h2><p className="text-sm text-slate-500">Snapshots CSV gerados internamente e versionados.</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Relatório</th><th className="px-4 py-3">Exercício</th><th className="px-4 py-3">Versão</th><th className="px-4 py-3">Gerado em</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-slate-200">{reports.map((report) => <tr key={`${report.type}-${report.year}`}><td className="px-4 py-3 font-medium">{report.label}</td><td className="px-4 py-3">{report.year}</td><td className="px-4 py-3">v{report.version}</td><td className="px-4 py-3">{formatDate(report.finalizedAt)}</td><td className="px-4 py-3"><a className="font-semibold text-sky-800 hover:underline" href={`/api/transparencia/relatorios?year=${report.year}&reportType=${report.type}&version=${report.version}`}>CSV</a></td></tr>)}{!reports.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Nenhum snapshot publicado.</td></tr>}</tbody></table>
            </div>
          </div>

          <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-bold">Licitações publicadas</h2><p className="text-sm text-slate-500">Somente certames com data de publicação.</p></div><a className="text-sm font-semibold text-sky-800 hover:underline" href="/api/transparencia/licitacoes?format=csv">CSV</a></div>
            <div className="max-h-[420px] overflow-auto"><table className="min-w-full text-left text-sm"><thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Licitação</th><th className="px-4 py-3">Processo / objeto</th><th className="px-4 py-3">Sessão</th></tr></thead><tbody className="divide-y divide-slate-200">{biddings.map((bidding) => <tr key={bidding.number}><td className="px-4 py-3 font-medium">{bidding.number}<span className="block text-xs font-normal text-slate-500">{bidding.modality} · {bidding.status}</span></td><td className="px-4 py-3">{bidding.processNumber}<span className="block max-w-xs truncate text-xs text-slate-500" title={bidding.object}>{bidding.object}</span></td><td className="px-4 py-3">{formatDate(bidding.sessionDate)}</td></tr>)}{!biddings.length && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">Nenhuma licitação publicada.</td></tr>}</tbody></table></div>
          </div>
        </section>

        <section className="mt-6 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-bold">Contratos</h2><p className="text-sm text-slate-500">Contratos não preliminares; pessoas físicas e documentos são protegidos.</p></div><a className="text-sm font-semibold text-sky-800 hover:underline" href="/api/transparencia/contratos?format=csv">Exportar CSV</a></div>
          <div className="max-h-[420px] overflow-auto"><table className="min-w-full text-left text-sm"><thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Contrato</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Objeto / processo</th><th className="px-4 py-3">Vigência</th><th className="px-4 py-3 text-right">Valor atualizado</th></tr></thead><tbody className="divide-y divide-slate-200">{contracts.map((contract) => <tr key={contract.number}><td className="px-4 py-3 font-medium">{contract.number}<span className="block text-xs font-normal text-slate-500">{contract.status}</span></td><td className="px-4 py-3">{contract.supplier.name}<span className="block text-xs text-slate-500">{contract.supplier.documentMasked}</span></td><td className="px-4 py-3"><span className="block max-w-sm truncate" title={contract.object}>{contract.object}</span><span className="block text-xs text-slate-500">{contract.processNumber}{contract.modality ? ` · ${contract.modality}` : ""}</span></td><td className="px-4 py-3">{formatDate(contract.startDate)}<span className="block text-xs text-slate-500">até {formatDate(contract.endDate)}</span></td><td className="px-4 py-3 text-right font-medium">{formatMoney(contract.updatedValue)}</td></tr>)}{!contracts.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Nenhum contrato publicável.</td></tr>}</tbody></table></div>
        </section>

        <section className="mt-6 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold">Avisos públicos</h2><p className="text-sm text-slate-500">Publicações redigidas: título, categoria, data e link de validação. Não há narrativas, interessados, anexos ou downloads.</p></div>
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Título</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Publicação</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-slate-200">{notices.map((notice) => <tr key={notice.validationUrl}><td className="px-4 py-3 font-medium">{notice.title}</td><td className="px-4 py-3">{notice.category}</td><td className="px-4 py-3">{formatDate(notice.publishedAt)}</td><td className="px-4 py-3"><Link className="font-semibold text-sky-800 hover:underline" href={notice.validationUrl}>Validar aviso</Link></td></tr>)}{!notices.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Nenhum aviso público publicado.</td></tr>}</tbody></table></div>
        </section>

        {institution && (institution.phone || institution.email || institution.address || institution.website) && <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><h2 className="font-bold">Contato institucional</h2><p className="mt-1">{institution.name}</p>{institution.address && <p>{institution.address}{institution.city ? `, ${institution.city}` : ""}{institution.state ? `/${institution.state}` : ""}</p>}{institution.phone && <p>Telefone: {institution.phone}</p>}{institution.email && <p>E-mail: <a className="font-semibold text-sky-800 hover:underline" href={`mailto:${institution.email}`}>{institution.email}</a></p>}{institution.website && <p>Site: <a className="font-semibold text-sky-800 hover:underline" href={institution.website}>{institution.website}</a></p>}</section>}

        <p className="mt-6 text-xs leading-5 text-slate-500">API pública: <code>/api/transparencia/despesas</code>, <code>/api/transparencia/receitas</code>, <code>/api/transparencia/contratos</code>, <code>/api/transparencia/licitacoes</code> e <code>/api/transparencia/relatorios</code>. Avisos públicos não expõem arquivos, anexos ou downloads.</p>
      </div>
    </main>
  );
}
