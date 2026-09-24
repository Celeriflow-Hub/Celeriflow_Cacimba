"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="inline-flex h-7 items-center gap-1.5 self-center rounded bg-violet-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-800 disabled:bg-violet-400"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="size-3.5" />
      )}
      {pending ? "Abrindo Chamado..." : "Abrir Chamado"}
    </button>
  );
}
