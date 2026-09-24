import { Mic } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function AudienciasPage() {
  const { prisma } = await getTenantContextForModule("CAMARA");
  const audiencias = await prisma.camAudiencia.findMany({
    include: { sessao: true, legislatura: true },
    orderBy: { data: "desc" },
  });

  return (
    <PageFrame className="space-y-3 px-1 py-1 md:px-2">
      <PageHeader title="Audiências Públicas" icon={<Mic className="size-4 shrink-0 text-[#9333EA]" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {audiencias.map((audiencia) => <article key={audiencia.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div className="mb-3 flex items-start justify-between gap-3"><h2 className="font-semibold text-slate-900 dark:text-white">{audiencia.tema}</h2><span className="whitespace-nowrap rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">{audiencia.status}</span></div><p className="mb-4 text-sm text-slate-600 dark:text-gray-300">{audiencia.descricao || "Sem descrição."}</p><dl className="space-y-1 text-sm text-slate-500 dark:text-gray-400"><div>Data: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(audiencia.data)}</div><div>Local: {audiencia.local}</div><div>Tipo: {audiencia.tipo}</div>{audiencia.legislatura && <div>Legislatura: {audiencia.legislatura.numero}ª</div>}</dl></article>)}
      </div>
      {audiencias.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">Nenhuma audiência cadastrada.</p>}
    </PageFrame>
  );
}
