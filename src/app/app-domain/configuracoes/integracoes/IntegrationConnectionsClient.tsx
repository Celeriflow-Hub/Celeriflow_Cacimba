"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cable, FlaskConical, Save, ShieldCheck, Eye, Layers, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { integrationEnvironments, isEnvironmentAllowedForIntegration, isIntegrationEnvironment, type IntegrationEnvironment } from "@/lib/integrations/registry";
import {
  getProcurementExportConfigurationStatus,
  getProcurementExportConfigurationTemplate,
  parseProcurementExportConfigurationJson,
} from "@/lib/integrations/procurement-export-contract";
import { retrySiaficDelivery, testIntegrationConnection, saveIntegrationConnection } from "./actions";
import IntegrationRunModal from "./IntegrationRunModal";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

type CatalogItem = {
  code: string;
  name: string;
  category: string;
  provider: string;
  description: string;
};

type ConnectionRun = {
  id: string;
  operation: string;
  environment: string;
  status: string;
  message: string;
  createdAt: Date;
  payload?: string | null;
};

type SiaficDelivery = {
  status: string;
  attemptCount: number;
  nextAttemptAt: Date;
  lastError: string | null;
  receiptId: string | null;
};

type SiaficEvent = {
  id: string;
  entityType: string;
  entityId: string;
  entityVersion: number;
  eventType: string;
  operation: string;
  createdAt: Date;
  delivery: SiaficDelivery | null;
};

type Connection = {
  id: string;
  code: string;
  name: string;
  category: string;
  provider: string;
  environment: string;
  status: string;
  baseUrl: string | null;
  credentialReference: string | null;
  configuration: string;
  mockScenario: string;
  lastTestedAt: Date | null;
  lastTestStatus: string | null;
  lastTestMessage: string | null;
  runs: ConnectionRun[];
  siaficOutboxEvents: SiaficEvent[];
};

type FormState = {
  code: string;
  environment: IntegrationEnvironment;
  baseUrl: string;
  credentialReference: string;
  configurationJson: string;
  mockScenarioJson: string;
  enabled: boolean;
};

function formFor(connection: Connection | undefined, code: string): FormState {
  const configuredEnvironment = connection?.environment;
  return {
    code,
    environment: configuredEnvironment && isIntegrationEnvironment(configuredEnvironment)
      ? configuredEnvironment
      : code === "BANCO_API" ? "SANDBOX" : code === "SIAFIC_DEMO" ? "DEMO" : "MOCK",
    baseUrl: connection?.baseUrl ?? "",
    credentialReference: connection?.credentialReference ?? "",
    configurationJson: connection?.configuration ?? getProcurementExportConfigurationTemplate(code),
    mockScenarioJson: connection?.mockScenario ?? (code === "SIAFIC_DEMO" ? "" : '{\n  "scenario": "success"\n}'),
    enabled: connection?.status !== "DESATIVADA",
  };
}

export default function IntegrationConnectionsClient({ catalog, connections }: { catalog: CatalogItem[]; connections: Connection[] }) {
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState(catalog[0]?.code ?? "");
  const selectedConnection = connections.find((connection) => connection.code === selectedCode);
  const [form, setForm] = useState<FormState>(() => formFor(selectedConnection, selectedCode));
  const [pending, setPending] = useState(false);
  const [activeModalRun, setActiveModalRun] = useState<ConnectionRun | null>(null);

  const selectConnection = (code: string) => {
    setSelectedCode(code);
    setForm(formFor(connections.find((connection) => connection.code === code), code));
  };

  const save = async () => {
    setPending(true);
    const result = await saveIntegrationConnection(form);
    setPending(false);
    if (result.error) return alert(result.error);
    alert(result.data?.message);
    router.refresh();
  };

  const test = async () => {
    if (!selectedConnection) return alert("Salve a conexão antes de testá-la.");
    setPending(true);
    const result = await testIntegrationConnection(selectedConnection.id);
    setPending(false);
    if (result.error) return alert(result.error);
    alert(result.data?.message);
    router.refresh();
  };

  const retryDelivery = async (eventId: string) => {
    setPending(true);
    const result = await retrySiaficDelivery(eventId);
    setPending(false);
    if (result.error) return alert(result.error);
    alert(result.data?.message);
    router.refresh();
  };

  const selectedDefinition = catalog.find((connection) => connection.code === selectedCode);
  const procurementConfiguration = getProcurementExportConfigurationStatus({
    code: selectedCode,
    credentialReference: form.credentialReference,
    configuration: parseProcurementExportConfigurationJson(form.configurationJson),
  });

  return (
    <PageFrame className="space-y-3 bg-slate-950 px-1 py-1 text-slate-100 md:px-2">
      <PageHeader title="Console Técnico de Integrações" icon={<Cable className="size-4 shrink-0 text-indigo-400" />} action={<><Link href="/compras/exportacoes" className="hidden rounded-md border border-indigo-800/40 bg-indigo-950/40 px-2 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-900/60 sm:inline">Pacotes de Compras</Link><span className="hidden items-center gap-2 rounded-md border border-indigo-800/40 bg-indigo-950/40 px-2 py-1 font-mono text-xs text-indigo-300 sm:flex"><Layers className="h-3.5 w-3.5" />Modo POC ativo</span></>} className="border-slate-800 bg-slate-900 text-white [&>h1]:text-white" />
      <p className="text-sm text-slate-400">Catálogo central de ambientes, parâmetros e evidências técnicas auditáveis para a comissão de avaliação da POC.</p>

      <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 backdrop-blur-md">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Conectores Disponíveis</h3>
          {catalog.map((connection) => {
            const configured = connections.find((item) => item.code === connection.code);
            const isSelected = selectedCode === connection.code;
            return (
              <button
                key={connection.code}
                onClick={() => selectConnection(connection.code)}
                className={`mb-1.5 w-full rounded-xl p-3 text-left transition-all ${
                  isSelected
                    ? "bg-indigo-600/30 border border-indigo-500/40 text-white shadow-lg"
                    : "bg-slate-950/40 border border-slate-800/40 hover:bg-slate-800/60 text-slate-300"
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-sm">{connection.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {configured?.environment ?? "NOVA"}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{connection.category}</span>
                  <span className={`w-2 h-2 rounded-full ${configured?.status === "DESATIVADA" ? "bg-rose-500" : "bg-emerald-400"}`} />
                </div>
              </button>
            );
          })}
        </aside>

        {selectedDefinition && (
          <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedDefinition.name}</h2>
                <p className="text-sm text-slate-400">
                  {selectedDefinition.provider}. {selectedDefinition.description}
                </p>
              </div>
              <span className="rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 text-xs font-semibold">
                {selectedConnection?.status ?? "NÃO CONFIGURADA"}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Ambiente Utilizado</Label>
                <select
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                  value={form.environment}
                  onChange={(event) => setForm({ ...form, environment: event.target.value as FormState["environment"] })}
                >
                  {integrationEnvironments.map((environment) => (
                    <option key={environment} value={environment} disabled={!isEnvironmentAllowedForIntegration(selectedCode, environment)}>
                       {environment === "MOCK" ? "Mock Local (Simulação POC)" : null}
                       {environment === "DEMO" ? "Receptor SIAFIC - Robonuvem DEMO" : null}
                      {environment === "SANDBOX" ? "Sandbox Banco Virtual Robonuvem" : null}
                      {environment === "HOMOLOGACAO" ? "Homologação Órgão Externo (bloqueada)" : null}
                      {environment === "PRODUCAO" ? "Produção Real (bloqueada)" : null}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Endpoint API</Label>
                <Input
                  placeholder="https://api.fornecedor.gov.br"
                  className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
                  value={form.baseUrl}
                  onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Referência de Credencial</Label>
                <Input
                  placeholder="secret://cliente/tce-pb"
                  className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
                  value={form.credentialReference}
                  onChange={(event) => setForm({ ...form, credentialReference: event.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 pt-7 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  checked={form.enabled}
                  onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
                />
                Habilitar Conector
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Parâmetros Públicos (JSON)</Label>
                <Textarea
                  className="min-h-32 font-mono text-xs bg-slate-950 border-slate-800 text-indigo-300"
                  value={form.configurationJson}
                  onChange={(event) => setForm({ ...form, configurationJson: event.target.value })}
                  placeholder='{"layoutVersion":"2026.1"}'
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Cenário Mock (JSON)</Label>
                <Textarea
                  className="min-h-32 font-mono text-xs bg-slate-950 border-slate-800 text-emerald-300"
                  value={form.mockScenarioJson}
                  onChange={(event) => setForm({ ...form, mockScenarioJson: event.target.value })}
                />
              </div>
            </div>

            {procurementConfiguration.supported ? (
              <div className={`rounded-xl border p-3.5 text-xs ${procurementConfiguration.ready ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-200" : "border-amber-500/30 bg-amber-950/30 text-amber-200"}`}>
                <p className="font-semibold">Pacotes de Compras {procurementConfiguration.ready ? "liberados para preparo POC" : "bloqueados por configuracao"}</p>
                <p className="mt-1 leading-5">TCE e PNCP exigem referencia de credencial, leiaute identificado e operacoes declaradas. O preparo gera somente um pacote para entrega externa manual; nao transmite nem confirma remessa.</p>
                {procurementConfiguration.issues.length ? <ul className="mt-2 list-disc space-y-1 pl-4">{procurementConfiguration.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <p className="mt-2">Escopo declarado: {procurementConfiguration.operations.join(", ")}.</p>}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={save} disabled={pending} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Save className="mr-2 h-4 w-4" /> Salvar Conexão
              </Button>
              <Button variant="outline" onClick={test} disabled={pending || !selectedConnection || (procurementConfiguration.supported && !procurementConfiguration.ready)} className="border-slate-700 text-slate-200 hover:bg-slate-800">
                <FlaskConical className="mr-2 h-4 w-4 text-emerald-400" /> Testar Execução
              </Button>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3.5 text-xs text-amber-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Segredo, senha e chaves privadas permanecem retidos no cofre externo (`secret://`).</span>
            </div>

            {selectedCode === "SIAFIC_DEMO" && selectedConnection ? (
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">Fila SIAFIC DEMO</h3>
                    <p className="text-xs text-slate-400">Snapshots sinteticos imutaveis; o retry preserva evento, hash e chave de idempotencia.</p>
                  </div>
                  <span className="rounded bg-indigo-950 px-2 py-1 font-mono text-[10px] text-indigo-300">ultimos 8 eventos</span>
                </div>
                {selectedConnection.siaficOutboxEvents.length ? (
                  <div className="space-y-2">
                    {selectedConnection.siaficOutboxEvents.map((event) => {
                      const delivery = event.delivery;
                      const canRetry = Boolean(delivery && delivery.status !== "PROCESSED" && delivery.status !== "SENDING");
                      return (
                        <div key={event.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-mono text-xs text-slate-200">{event.entityType} v{event.entityVersion} · {event.operation}</p>
                              <p className="mt-1 truncate text-[11px] text-slate-500" title={event.entityId}>{event.entityId}</p>
                            </div>
                            <span className={`rounded px-2 py-1 text-[10px] font-bold ${delivery?.status === "PROCESSED" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                              {delivery?.status ?? "SEM ENTREGA"}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                            <span>{new Date(event.createdAt).toLocaleString("pt-BR")} · tentativa {delivery?.attemptCount ?? 0}</span>
                            {delivery?.receiptId ? <span className="font-mono text-emerald-400">recibo confirmado</span> : null}
                            {canRetry ? (
                              <Button variant="outline" size="sm" disabled={pending} onClick={() => retryDelivery(event.id)} className="h-7 border-slate-700 px-2 text-xs text-slate-200 hover:bg-slate-800">
                                <RotateCcw className="mr-1 size-3" /> Reenfileirar
                              </Button>
                            ) : null}
                          </div>
                          {delivery?.lastError ? <p className="mt-2 line-clamp-2 text-[11px] text-amber-300">{delivery.lastError}</p> : null}
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="rounded-lg border border-dashed border-slate-800 p-3 text-xs text-slate-500">Nenhum evento SIAFIC DEMO foi enfileirado nesta conexao.</p>}
              </div>
            ) : null}

            {/* Run History with Evidences */}
            {selectedConnection?.runs.length ? (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">Histórico de Execuções e Evidências Técnicas</h3>
                  <span className="text-xs text-slate-400">Clique para inspecionar Payloads & Protocolo</span>
                </div>
                <div className="space-y-2">
                  {selectedConnection.runs.map((run) => (
                    <div
                      key={run.id}
                      onClick={() => setActiveModalRun(run)}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-950 cursor-pointer transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-200">{run.operation}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {run.environment}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{run.message}</p>
                      </div>

                      <div className="flex items-center gap-3">
                         <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                           run.status === "SUCCESS" || run.status === "SUCESSO" || run.status === "CONFIRMED"
                             ? "bg-emerald-500/20 text-emerald-300"
                             : run.status === "QUEUED" || run.status === "PENDING_CONFIGURATION"
                               ? "bg-amber-500/20 text-amber-300"
                               : "bg-rose-500/20 text-rose-300"
                         }`}>
                          {run.status}
                        </span>
                        <Eye className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        )}
      </div>

      {/* Modal for Technical Evidence Inspection */}
      <IntegrationRunModal
        isOpen={!!activeModalRun}
        onClose={() => setActiveModalRun(null)}
        connectionName={selectedDefinition?.name || "Integração"}
        environment={form.environment}
        endpoint={form.baseUrl}
        run={activeModalRun}
          onReprocess={activeModalRun?.operation.startsWith("EXPORT_") ? undefined : async () => {
            if (selectedConnection) {
              const result = await testIntegrationConnection(selectedConnection.id);
              if (result.error) alert(result.error);
              router.refresh();
            }
          }}
      />
    </PageFrame>
  );
}
