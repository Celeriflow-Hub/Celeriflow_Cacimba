import Link from "next/link";
import { PlugZap } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { getIntegrationDefinition } from "@/lib/integrations/registry";

const HEALTH_CODES = ["MS_RENAME", "HORUS", "SIGAF", "TRANSPARENCIA_SAUDE", "ESUS_VACINACAO", "DISPOSITIVO_ASSISTENCIAL"];
const EXECUTORS: Record<string, { label: string; href: string }> = {
  MS_RENAME: { label: "Cargas e catálogo", href: "/saude/administracao/importacoes" },
  HORUS: { label: "Exportar posição (Farmácia)", href: "/saude/farmacia" },
  SIGAF: { label: "Exportar posição (Farmácia)", href: "/saude/farmacia" },
  TRANSPARENCIA_SAUDE: { label: "Exportar posição (Farmácia)", href: "/saude/farmacia" },
  ESUS_VACINACAO: { label: "Enviar fichas (Vacinação)", href: "/saude/vacinacao" },
  DISPOSITIVO_ASSISTENCIAL: { label: "Equipamentos (Laboratório)", href: "/saude/laboratorio" },
};

export default async function SaudeIntegracoesPage() {
  const context = await getTenantContextForModule("SAUDE");
  const connections = await context.prisma.integrationConnection.findMany({ where: { code: { in: HEALTH_CODES } }, include: { runs: { orderBy: { createdAt: "desc" }, take: 5, select: { operation: true, status: true, message: true, createdAt: true } } }, orderBy: { code: "asc" } });
  const files = await context.prisma.healthSusFile.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { fileType: true, status: true, createdAt: true, competence: { select: { period: true } } } });
  const batches = await context.prisma.healthEsusBatch.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { competence: true, status: true, createdAt: true } });
  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Integrações da Saúde" icon={<PlugZap className="size-4 text-slate-700" />} action={<Link href="/app-domain/configuracoes/integracoes" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700">Configuração global</Link>} />
      <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto md:grid-cols-2">
        <div className="rounded border bg-white p-2"><h2 className="text-xs font-bold uppercase text-slate-500">Conectores</h2>{HEALTH_CODES.map(code => {
          const definition = getIntegrationDefinition(code);
          const connection = connections.find(c => c.code === code);
          const executor = EXECUTORS[code];
          return <article key={code} className="mb-1 rounded border p-2 text-xs"><strong>{definition?.name || code}</strong><p className="text-slate-500">Ambiente {connection?.environment || "não configurado"} · situação {connection?.status || "sem conexão"}{connection?.lastTestedAt ? ` · testado em ${connection.lastTestedAt.toLocaleDateString("pt-BR")}` : ""}</p>{connection?.runs.map((run, idx) => <p key={idx} className="text-slate-400">{run.operation} · {run.status} · {run.createdAt.toLocaleDateString("pt-BR")}</p>)}<div className="mt-1 flex gap-2"><Link href={executor.href} className="text-sky-700 underline">{executor.label}</Link></div></article>;
        })}</div>
        <div className="rounded border bg-white p-2"><h2 className="text-xs font-bold uppercase text-slate-500">Arquivos SUS recentes</h2>{files.map((f, idx) => <p key={idx} className="border-b py-1 text-xs"><strong>{f.fileType} · {f.competence.period}</strong> · {f.status}</p>)}{files.length === 0 && <p className="text-xs text-slate-400">Nenhum arquivo.</p>}<h2 className="pb-2 pt-3 text-xs font-bold uppercase text-slate-500">Lotes SISAB recentes</h2>{batches.map((b, idx) => <p key={idx} className="border-b py-1 text-xs"><strong>{b.competence}</strong> · {b.status}</p>)}{batches.length === 0 && <p className="text-xs text-slate-400">Nenhum lote.</p>}<p className="mt-2 text-[10px] text-slate-400">Execuções ocorrem nas telas de origem; o histórico técnico permanece registrado por conector.</p></div>
      </div>
    </PageFrame>
  );
}
