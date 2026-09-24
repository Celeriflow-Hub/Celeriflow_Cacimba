"use client";

import { useState } from "react";
import { Save, SlidersHorizontal } from "lucide-react";
import type { InstanceConfigurationValues } from "@/lib/platform/instance-configuration";
import { saveInstanceConfiguration } from "./actions";

type InstanceConfigurationFormProps = {
  instanceId: string;
  initialValues: InstanceConfigurationValues;
};

export function InstanceConfigurationForm({ instanceId, initialValues }: InstanceConfigurationFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setMessage(null);

    const result = await saveInstanceConfiguration({
      instanceId,
      values: {
        WORKFLOW_DEFAULT_SLA_DAYS: Number(formData.get("WORKFLOW_DEFAULT_SLA_DAYS")),
        WORKFLOW_INSTANCE_TIME_ZONE: formData.get("WORKFLOW_INSTANCE_TIME_ZONE"),
        DOCUMENT_DEFAULT_RETENTION_MONTHS: Number(formData.get("DOCUMENT_DEFAULT_RETENTION_MONTHS")),
        NOTIFICATION_DEFAULT_PRIORITY: formData.get("NOTIFICATION_DEFAULT_PRIORITY"),
        REPORT_INCLUDE_EMISSION_METADATA: formData.get("REPORT_INCLUDE_EMISSION_METADATA") === "on",
      },
    });

    setMessage(result.error
      ? { type: "error", text: result.error }
      : { type: "success", text: result.message ?? "Parâmetros salvos." });
    setIsSaving(false);
  }

  return (
    <form action={handleSubmit} className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-start sm:justify-between dark:border-slate-700">
        <div className="flex gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Parâmetros operacionais</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Os valores são aplicados como padrão para novas configurações e não substituem regras específicas dos módulos.</p>
          </div>
        </div>
        <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
          <Save className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar parâmetros"}
        </button>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        {message && (
          <p role={message.type === "error" ? "alert" : "status"} className={`md:col-span-2 rounded-lg border px-4 py-3 text-sm ${message.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {message.text}
          </p>
        )}

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">SLA padrão de novos fluxos</span>
          <input name="WORKFLOW_DEFAULT_SLA_DAYS" type="number" min="1" max="365" required defaultValue={initialValues.WORKFLOW_DEFAULT_SLA_DAYS} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
          <span className="block text-xs text-slate-500 dark:text-slate-400">Dias sugeridos ao criar um novo fluxo configurável.</span>
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fuso horário dos fluxos</span>
          <input name="WORKFLOW_INSTANCE_TIME_ZONE" required defaultValue={initialValues.WORKFLOW_INSTANCE_TIME_ZONE} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
          <span className="block text-xs text-slate-500 dark:text-slate-400">Identificador IANA aplicado aos dias corridos do SLA dos novos fluxos genéricos.</span>
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Retenção padrão de documentos</span>
          <input name="DOCUMENT_DEFAULT_RETENTION_MONTHS" type="number" min="1" max="1200" required defaultValue={initialValues.DOCUMENT_DEFAULT_RETENTION_MONTHS} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
          <span className="block text-xs text-slate-500 dark:text-slate-400">Meses sugeridos para novos tipos documentais.</span>
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Prioridade padrão de notificações</span>
          <select name="NOTIFICATION_DEFAULT_PRIORITY" defaultValue={initialValues.NOTIFICATION_DEFAULT_PRIORITY} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
            <option value="BAIXA">Baixa</option>
            <option value="NORMAL">Normal</option>
            <option value="ALTA">Alta</option>
          </select>
          <span className="block text-xs text-slate-500 dark:text-slate-400">Aplicada quando o evento não informar sua prioridade.</span>
        </label>

        <label className="flex gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <input name="REPORT_INCLUDE_EMISSION_METADATA" type="checkbox" defaultChecked={initialValues.REPORT_INCLUDE_EMISSION_METADATA} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          <span>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Identificar emissão em relatórios</span>
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Inclui data, hora e usuário emissor em relatórios compatíveis.</span>
          </span>
        </label>
      </div>
    </form>
  );
}
