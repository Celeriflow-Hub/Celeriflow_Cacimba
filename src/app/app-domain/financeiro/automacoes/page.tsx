import Link from "next/link";
import { Activity, Archive, CircleAlert, CircleCheck, ExternalLink } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { pocVirtualBank } from "@/lib/poc/poc-config";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(value);
}

type DownloadSummary = {
  id: string;
  banco: string;
  agencia: string;
  contaNumero: string;
  hashSHA256: string;
  status: string;
  createdAt: Date;
};

type RunSummary = {
  id: string;
  operation: string;
  environment: string;
  status: string;
  message: string;
  createdAt: Date;
  connection: { name: string; code: string };
};

export default async function AutomacoesFinanceirasPage() {
  let downloads: DownloadSummary[] = [];
  let runs: RunSummary[] = [];
  let loadError: string | null = null;

  try {
    const { prisma } = await getTenantContextForModule("FINANCEIRO");
    [downloads, runs] = await Promise.all([
      prisma.automatedBankDownload.findMany({ where: { banco: pocVirtualBank.name }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.integrationRun.findMany({
        where: { connection: { category: "BANCARIA" } },
        include: { connection: { select: { name: true, code: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
  } catch (error) {
    console.error("Erro ao carregar automações financeiras:", error);
    loadError = "Não foi possível carregar o histórico agora. Tente novamente em instantes.";
  }
  const failures = runs.filter((run) => run.status === "FALHA").length;

  return (
    <main className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 sm:px-2">
      <header className="border-b border-slate-300 bg-white px-3 py-2 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">POC São João do Ivaí</p>
        <h1 className="mt-0.5 text-sm font-bold tracking-tight text-slate-900">Central de Automações Financeiras</h1>
        <p className="mt-0.5 text-xs text-slate-600">Histórico operacional, falhas e evidências do banco simulado externo.</p>
      </header>

      {loadError && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{loadError}</p>}

      <section className="grid shrink-0 gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-none"><Archive className="h-4 w-4 text-emerald-600" /><p className="mt-2 text-xl font-bold">{downloads.length}</p><p className="text-xs text-slate-600">Extratos arquivados</p></div>
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-none"><Activity className="h-4 w-4 text-blue-600" /><p className="mt-2 text-xl font-bold">{runs.length}</p><p className="text-xs text-slate-600">Execuções bancárias</p></div>
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-none"><CircleAlert className="h-4 w-4 text-rose-600" /><p className="mt-2 text-xl font-bold">{failures}</p><p className="text-xs text-slate-600">Falhas registradas</p></div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-none">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2"><h2 className="font-bold text-slate-900">Extratos e evidências</h2><Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-800" href="/financeiro/download-extratos">Nova automação</Link></div>
        <div className="min-h-0 flex-1 overflow-y-auto"><table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-1.5">Execução</th><th className="px-3 py-1.5">Conta</th><th className="px-3 py-1.5">Integridade</th><th className="px-3 py-1.5">Status</th><th className="px-3 py-1.5"></th></tr></thead><tbody>{downloads.map((download) => <tr key={download.id} className="border-t border-slate-100"><td className="px-3 py-1.5">{displayDate(download.createdAt)}</td><td className="px-3 py-1.5"><p className="font-medium">{download.banco}</p><p className="text-xs text-slate-500">{download.agencia} / {download.contaNumero}</p></td><td className="max-w-48 truncate px-3 py-1.5 font-mono text-xs" title={download.hashSHA256}>{download.hashSHA256}</td><td className="px-3 py-1.5"><span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800"><CircleCheck className="h-3 w-3" />{download.status}</span></td><td className="px-3 py-1.5"><a className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800" href={`/api/financeiro/extratos/${download.id}`}><ExternalLink className="h-4 w-4" />Abrir</a></td></tr>)}{downloads.length === 0 && <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={5}>Nenhum extrato arquivado.</td></tr>}</tbody></table></div>
      <ErpPagination page={1} total={downloads.length} pageSize={20} previousHref="#" nextHref="#" />
      </section>

      <details className="shrink-0 rounded-md border border-slate-200 bg-white shadow-none"><summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700">Execuções da integração bancária ({runs.length})</summary>
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">Execuções da integração bancária</h2></div>
        <div className="divide-y divide-slate-100">{runs.map((run) => <article key={run.id} className="flex gap-3 px-5 py-4"><span className={run.status === "SUCESSO" ? "mt-0.5 text-emerald-600" : "mt-0.5 text-rose-600"}>{run.status === "SUCESSO" ? <CircleCheck className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}</span><div><p className="font-semibold text-slate-900">{run.connection.name} · {run.operation}</p><p className="text-sm text-slate-600">{run.message}</p><p className="mt-1 text-xs text-slate-500">{displayDate(run.createdAt)} · {run.environment}</p></div></article>)}{runs.length === 0 && <p className="px-5 py-8 text-center text-slate-500">Nenhuma execução bancária registrada.</p>}</div>
      </details>
    </main>
  );
}
