import { financialReportOptions } from "@/lib/financeiro/report-delivery";
import { canIssueFinancialReports, getTenantContextForModule } from "@/lib/platform/tenant-context";

export const dynamic = "force-dynamic";

const pocReportTypes = new Set(["BALANCETE", "CONCILIACAO_TESOURARIA", "BALANCO_FINANCEIRO"]);

export default async function FinanceiroRelatoriosPage() {
  const context = await getTenantContextForModule("FINANCEIRO");
  const years = await context.prisma.financialYear.findMany({
    select: { id: true, year: true, status: true },
    orderBy: { year: "desc" },
  });
  const canIssue = canIssueFinancialReports(context.user);
  const reportOptions = financialReportOptions.filter((report) => pocReportTypes.has(report.type));

  return (
    <div className="max-w-4xl space-y-2 px-1 py-1 sm:px-2">
      <header className="border-b border-slate-300 bg-white px-3 py-2 shadow-sm">
        <h1 className="text-sm font-bold tracking-tight text-slate-900">Relatórios Financeiros</h1>
        <p className="mt-0.5 text-xs text-slate-500">Prévia e emissão interna em PDF, CSV, XLSX, TXT ou impressão para os relatórios básicos da POC.</p>
      </header>
      <section className="rounded-md border border-slate-200 bg-white p-3">
        <h2 className="font-semibold text-slate-800">Emitir relatório básico</h2>
        {canIssue ? (
          <form action="/api/financeiro/relatorios" method="get" className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Exercício financeiro
              <select name="financialYearId" required defaultValue="" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
                <option value="" disabled>Selecione o exercício</option>
                {years.map((year) => <option key={year.id} value={year.id}>{year.year} - {year.status}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Tipo de relatório
              <select name="reportType" required defaultValue="" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
                <option value="" disabled>Selecione o relatório</option>
                {[...new Set(reportOptions.map((report) => report.group))].map((group) => (
                  <optgroup key={group} label={group}>
                    {reportOptions.filter((report) => report.group === group).map((report) => <option key={report.type} value={report.type}>{report.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Formato
              <select name="format" defaultValue="PDF" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
                <option value="PDF">PDF</option>
                <option value="CSV">CSV</option>
                <option value="XLSX">XLSX</option>
                <option value="TXT">TXT</option>
                <option value="print">Imprimir</option>
                <option value="preview">Prévia</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Mês do balancete mensal
              <select name="month" defaultValue="" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
                <option value="">Não aplicável</option>
                {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
              </select>
            </label>
            <div className="sm:col-span-2 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">Informe o mês somente para Balancete Contábil Mensal. A emissão é auditada e cada arquivo informa escopo, situação e completude; documentos internos não usam leiautes oficiais de TCE/STN.</p>
              <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Gerar relatório</button>
            </div>
          </form>
        ) : (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Relatórios consolidados não estão disponíveis para acessos restritos por Unidade Gestora.</p>
        )}
      </section>
    </div>
  );
}
