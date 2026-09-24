"use client";

import { useState } from "react";
import { FileText, Save } from "lucide-react";
import type { ReportTemplatePresentation } from "@/lib/reports/report-template";
import { saveReportTemplate } from "./actions";

export function ReportTemplateForm({ template }: { template: ReportTemplatePresentation }) {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setMessage(null);
    const result = await saveReportTemplate({
      version: template.version,
      values: {
        header: String(formData.get("header") ?? ""),
        footer: String(formData.get("footer") ?? ""),
        orientation: formData.get("orientation"),
        includeEmissionMetadata: formData.get("includeEmissionMetadata") === "on",
      },
    });
    setMessage(result.error ? { type: "error", text: result.error } : { type: "success", text: result.message ?? "Modelo salvo." });
    setIsSaving(false);
  }

  return <form action={handleSubmit} className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-start sm:justify-between dark:border-slate-700">
      <div className="flex gap-3"><div className="rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><FileText className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Modelo global de relatórios</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Versão {template.version} · fingerprint {template.fingerprint}</p></div></div>
      <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"><Save className="h-4 w-4" />{isSaving ? "Salvando..." : "Salvar modelo"}</button>
    </div>
    <div className="grid gap-4 p-4 md:grid-cols-2">
      {message && <p role={message.type === "error" ? "alert" : "status"} className={`md:col-span-2 rounded-lg border px-4 py-3 text-sm ${message.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message.text}</p>}
      <label className="space-y-2 md:col-span-2"><span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cabeçalho adicional</span><textarea name="header" maxLength={1000} defaultValue={template.header} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /><span className="block text-xs text-slate-500">A identidade exibida é sempre lida do cadastro da instituição.</span></label>
      <label className="space-y-2 md:col-span-2"><span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Rodapé</span><textarea name="footer" maxLength={1000} defaultValue={template.footer} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /></label>
      <label className="space-y-2"><span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Orientação</span><select name="orientation" defaultValue={template.orientation} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"><option value="LANDSCAPE">Paisagem</option><option value="PORTRAIT">Retrato</option></select></label>
      <label className="flex gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700"><input name="includeEmissionMetadata" type="checkbox" defaultChecked={template.includeEmissionMetadata} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /><span><span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Identificar emissão</span><span className="mt-1 block text-xs text-slate-500">Inclui data, hora e emissor em PDF, impressão e exportações.</span></span></label>
    </div>
  </form>;
}
