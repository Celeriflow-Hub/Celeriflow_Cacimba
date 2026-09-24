"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { createRole } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default function NovoCargoPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createRole(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <PageFrame className="max-w-3xl space-y-2">
      <PageHeader title="Novo Cargo/Função" action={<Link href="/administracao/cargos" className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-3.5" />Voltar</Link>} />

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="space-y-3 p-3">
          {error && <div className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Nome do Cargo *</label>
            <input type="text" name="name" required placeholder="Ex: Diretor de Escola" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm" />
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nível (Opcional)</label>
              <select name="level" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm bg-white">
                <option value="">Selecione...</option>
                <option value="Secretário">Secretário</option>
                <option value="Diretor">Diretor</option>
                <option value="Coordenador">Coordenador</option>
                <option value="Servidor">Servidor Base</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Pode Assinar Documentos?</label>
              <div className="pt-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="canSign" className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-5 h-5" />
                  <span className="ml-2 text-sm text-slate-700">Sim, possui poder de assinatura (SLA)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Descrição</label>
            <input type="text" name="description" placeholder="Breve descrição das atribuições" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm" />
          </div>
        </div>
        <div className="flex h-10 justify-end border-t border-slate-200 bg-slate-50 px-3">
          <button type="submit" disabled={loading} className="inline-flex h-7 items-center gap-1.5 self-center rounded bg-purple-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-purple-800 disabled:opacity-50">
            <Save className="size-3.5" /> {loading ? "Salvando..." : "Salvar Cargo"}
          </button>
        </div>
      </form>
    </PageFrame>
  );
}
