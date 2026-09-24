"use client";

import { useState } from "react";

export default function DocumentUpload({ entityType, entityId }: { entityType: "ticket" | "ombudsman"; entityId: string }) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(formData: FormData) {
    setUploading(true);
    setError("");
    const response = await fetch("/api/atendimento/upload", { method: "POST", body: formData });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error || "Nao foi possivel anexar o arquivo.");
      setUploading(false);
      return;
    }
    window.location.reload();
  }

  return <form action={upload} className="space-y-2 rounded border border-slate-200 bg-slate-50 p-2.5">
    <input type="hidden" name="entityType" value={entityType} />
    <input type="hidden" name="entityId" value={entityId} />
    <input name="title" required placeholder="Titulo do documento" className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15" />
    <div className="grid gap-2 sm:grid-cols-2"><input name="documentType" defaultValue="Anexo" className="h-7 rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15" /><input name="purpose" placeholder="Finalidade" className="h-7 rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15" /></div>
    <input name="file" type="file" required className="w-full text-sm" />
    {error && <p className="text-sm text-red-600">{error}</p>}
    <button disabled={uploading} className="h-7 w-full rounded border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">{uploading ? "Enviando..." : "Anexar via GED"}</button>
  </form>;
}
