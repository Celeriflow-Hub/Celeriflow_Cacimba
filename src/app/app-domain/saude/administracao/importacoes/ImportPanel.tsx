"use client";

import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { importHealthSusFile } from "./actions";

export function ImportPanel() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const result = await importHealthSusFile(formData);
      if ("error" in result) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      formRef.current?.reset();
      setMessage({ kind: "success", text: result.duplicate ? "Este arquivo já foi processado para a competência informada." : "Carga processada e registrada no histórico." });
      startTransition(() => router.refresh());
    } catch {
      setMessage({ kind: "error", text: "A comunicação foi interrompida. Verifique o histórico antes de reenviar o arquivo." });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="shrink-0 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <form ref={formRef} action={submit} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[160px_150px_1fr_1.4fr_auto]">
        <label className="grid gap-1 text-[11px] font-semibold text-slate-600">
          Origem do catálogo
          <select name="source" required className="h-8 rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800">
            <option value="CNES">SCNES / CNES</option>
            <option value="CADSUS">CADSUS</option>
            <option value="SIA">SIA/SUS</option>
            <option value="SIGTAP">SIGTAP</option>
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-semibold text-slate-600">
          Competência
          <input name="competence" type="month" required className="h-8 rounded border border-slate-300 px-2 text-xs text-slate-800" />
        </label>
        <label className="grid gap-1 text-[11px] font-semibold text-slate-600">
          Identificação da origem
          <input name="origin" required maxLength={120} placeholder="Arquivo recebido do setor responsável" className="h-8 rounded border border-slate-300 px-2 text-xs text-slate-800" />
        </label>
        <label className="grid gap-1 text-[11px] font-semibold text-slate-600">
          Arquivo XML, CSV ou TXT
          <input name="file" type="file" required accept=".xml,.csv,.txt,text/csv,text/xml,application/xml,text/plain" className="h-8 min-w-0 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 file:mr-2 file:border-0 file:bg-transparent file:text-[11px] file:font-semibold" />
        </label>
        <button type="submit" disabled={pending} className="mt-auto inline-flex h-8 items-center justify-center gap-1.5 rounded bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
          <Upload className="size-3.5" />{pending ? "Processando..." : "Processar carga"}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <p className="text-slate-500">Contrato local controlado em UTF-8, até 700 KB e 2.000 registros. A carga não comprova processamento em ambiente governamental.</p>
        {message && <p role="status" className={message.kind === "error" ? "font-semibold text-rose-700" : "font-semibold text-emerald-700"}>{message.text}</p>}
      </div>
      <details className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-700">Campos aceitos pelo contrato local</summary>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          <p><strong>CNES:</strong> tipo; cnes/código; nome; unidade_cnes; CPF; CNS; CBO; equipe_codigo; habilitação.</p>
          <p><strong>CADSUS:</strong> tipo=paciente; CPF; nome; nascimento; sexo; mãe; CNS; unidade_cnes; equipe_codigo.</p>
          <p><strong>SIA/SUS e SIGTAP:</strong> tipo; código; descrição; grupo; subgrupo; complexidade; instrumento; valor; idades; sexo; vínculos.</p>
          <p><strong>Tipos de referência:</strong> especialidade, serviço, CBO, CID e classificação. O cabeçalho pode usar ponto e vírgula, vírgula ou tabulação.</p>
        </div>
      </details>
    </section>
  );
}
