"use client";

import { LockKeyhole } from "lucide-react";

export default function UploadLicitacoesForm() {
  return (
    <div className="inline-flex h-7 items-center gap-1 rounded-md bg-slate-100 px-2.5 text-xs font-semibold text-slate-500" title="A transparência não cria processos de compra.">
      <LockKeyhole className="w-4 h-4" />
      Importação desabilitada
    </div>
  );
}
