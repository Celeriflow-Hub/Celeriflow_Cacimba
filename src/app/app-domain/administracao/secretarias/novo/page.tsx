"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { createSecretariat } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default function NovaSecretariaPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createSecretariat(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <PageFrame className="max-w-3xl space-y-2">
      <PageHeader title="Nova Secretaria" action={<Link href="/administracao/secretarias" className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-3.5" />Voltar</Link>} />

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="space-y-3 p-3">
          {error && <div className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Nome da Secretaria *</label>
            <input type="text" name="name" required placeholder="Ex: Secretaria de Saúde" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm" />
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Sigla</label>
              <input type="text" name="acronym" placeholder="Ex: SMS" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm uppercase" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Responsável (Secretário/a)</label>
              <input type="text" name="managerName" placeholder="Nome do responsável" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm" />
            </div>
          </div>
        </div>
        <div className="flex h-10 justify-end border-t border-slate-200 bg-slate-50 px-3">
          <button type="submit" disabled={loading} className="inline-flex h-7 items-center gap-1.5 self-center rounded bg-blue-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 disabled:opacity-50">
            <Save className="size-3.5" /> {loading ? "Salvando..." : "Salvar Secretaria"}
          </button>
        </div>
      </form>
    </PageFrame>
  );
}
