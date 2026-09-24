import { Building2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getTenantContextForModule, isSystemAdministrator } from "@/lib/platform/tenant-context";
import { getInstanceConfigurationDefaults, type InstanceConfigurationValues } from "@/lib/platform/instance-configuration";
import { InstanceConfigurationForm } from "./InstanceConfigurationForm";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

function getInitialValues(parameters: { chave: string; valor: unknown }[]): InstanceConfigurationValues {
  const values = getInstanceConfigurationDefaults();
  for (const parameter of parameters) {
    if (parameter.chave === "WORKFLOW_DEFAULT_SLA_DAYS" && typeof parameter.valor === "number") values.WORKFLOW_DEFAULT_SLA_DAYS = parameter.valor;
    if (parameter.chave === "WORKFLOW_INSTANCE_TIME_ZONE" && typeof parameter.valor === "string") values.WORKFLOW_INSTANCE_TIME_ZONE = parameter.valor;
    if (parameter.chave === "DOCUMENT_DEFAULT_RETENTION_MONTHS" && typeof parameter.valor === "number") values.DOCUMENT_DEFAULT_RETENTION_MONTHS = parameter.valor;
    if (parameter.chave === "NOTIFICATION_DEFAULT_PRIORITY" && ["BAIXA", "NORMAL", "ALTA"].includes(String(parameter.valor))) values.NOTIFICATION_DEFAULT_PRIORITY = parameter.valor as InstanceConfigurationValues["NOTIFICATION_DEFAULT_PRIORITY"];
    if (parameter.chave === "REPORT_INCLUDE_EMISSION_METADATA" && typeof parameter.valor === "boolean") values.REPORT_INCLUDE_EMISSION_METADATA = parameter.valor;
  }
  return values;
}

export default async function InstanciaPage() {
  const { prisma, user } = await getTenantContextForModule("CONFIGURACOES");
  const instance = await prisma.configuracaoInstancia.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      parametros: {
        select: { chave: true, valor: true },
      },
    },
  });

  return (
    <PageFrame className="space-y-3 px-1 py-1 md:px-2">
      <PageHeader title="Instância do sistema" icon={<Building2 className="size-4 shrink-0 text-slate-700 dark:text-slate-300" />} className="dark:border-slate-700 dark:bg-slate-800 dark:[&>h1]:text-white" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Parâmetros operacionais reutilizáveis da prefeitura configurada nesta instalação.</p>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Dados institucionais e identidade visual</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Nome, CNPJ, brasão e contatos são administrados separadamente para evitar duas fontes de verdade.</p>
        <Link href="/administracao/instituicao" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">
          Abrir dados da instituição <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Modelo global de relatórios</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Cabeçalho, rodapé, orientação e metadados de emissão são configurados em um único modelo, sem duplicar a identidade institucional.</p>
        <Link href="/configuracoes/relatorios" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">Configurar modelo de relatórios <ExternalLink className="h-4 w-4" /></Link>
      </div>

      {!isSystemAdministrator(user) ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Os parâmetros operacionais desta instância são gerenciados pelo administrador do sistema.
        </div>
      ) : !instance ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
          Nenhuma instância operacional foi encontrada. Crie e aprove a instância inicial antes de configurar parâmetros comuns.
        </div>
      ) : (
        <InstanceConfigurationForm instanceId={instance.id} initialValues={getInitialValues(instance.parametros)} />
      )}
    </PageFrame>
  );
}
