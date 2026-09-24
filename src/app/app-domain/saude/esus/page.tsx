import { Activity } from 'lucide-react';
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function Page() {
  await getTenantContextForModule("SAUDE");
  return (
    <PageFrame className="space-y-2 px-1 py-1 md:px-2">
      <PageHeader title="Integração e-SUS" icon={<Activity className="size-4 shrink-0 text-emerald-600" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <section className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">A geração de lote e-SUS depende do leiaute vigente, credenciais e ambiente autorizado de homologação. Nenhum arquivo oficial é emitido por esta tela enquanto esse contrato não estiver configurado.</p>
        <button type="button" disabled className="h-9 w-fit rounded-md bg-slate-300 px-3 text-sm font-medium text-slate-600" title="Integração e-SUS ainda não configurada">Gerar Lote e-SUS indisponível</button>
      </section>
    </PageFrame>
  );
}
