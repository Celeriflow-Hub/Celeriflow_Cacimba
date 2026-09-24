"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Upload } from "lucide-react";
import { generateEducacensoExportAction, processEducacensoImportAction } from "../s1-actions";

export function EducacensoClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const run = (action: typeof processEducacensoImportAction, data: FormData) => startTransition(async () => {
    const result = await action(data);
    setMessage(result.error || result.message || "");
    if (result.download) {
      const blob = new Blob([result.download.content], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob); link.download = result.download.fileName; link.click(); URL.revokeObjectURL(link.href);
    }
    if (!result.error) router.refresh();
  });
  const inputClass = "h-8 w-full rounded border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950";
  return <div className="grid gap-2 lg:grid-cols-2">
    <form className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" onSubmit={(event) => { event.preventDefault(); run(processEducacensoImportAction, new FormData(event.currentTarget)); }}>
      <h2 className="text-sm font-semibold">Importar arquivo</h2><p className="text-xs text-slate-500">Leitura local com resumo, críticas por linha e proteção contra reprocessamento.</p>
      <div className="grid gap-2 sm:grid-cols-2"><input name="fileName" required placeholder="Nome do arquivo" className={inputClass} /><input name="competence" required placeholder="Competência (2026)" className={inputClass} /><input name="layoutVersion" required placeholder="Versão do leiaute" className={inputClass} /></div>
      <textarea name="content" required className="min-h-32 w-full rounded border border-slate-200 p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950" placeholder={"ESCOLA;41000123;Escola Central\nESTUDANTE;ALU-001;Ana Silva;00000000000"} />
      <button disabled={pending} className="inline-flex h-8 items-center gap-1.5 rounded bg-blue-600 px-3 text-xs font-semibold text-white">{pending ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}Processar importação</button>
    </form>
    <form className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" onSubmit={(event) => { event.preventDefault(); run(generateEducacensoExportAction, new FormData(event.currentTarget)); }}>
      <h2 className="text-sm font-semibold">Gerar arquivo para conferência</h2><p className="text-xs text-slate-500">Gera dados de matrícula inicial ou situação final. A aceitação oficial depende do leiaute e dos validadores vigentes do INEP.</p>
      <input name="competence" required placeholder="Competência (2026)" className={inputClass} /><input name="layoutVersion" required placeholder="Versão do leiaute" className={inputClass} /><select name="exportType" className={inputClass}><option>Matrícula inicial</option><option>Situação final</option></select>
      <button disabled={pending} className="inline-flex h-8 items-center gap-1.5 rounded bg-emerald-600 px-3 text-xs font-semibold text-white">{pending ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}Gerar e baixar</button>
    </form>
    {message && <p role="status" className="text-xs text-slate-700 lg:col-span-2">{message}</p>}
  </div>;
}
