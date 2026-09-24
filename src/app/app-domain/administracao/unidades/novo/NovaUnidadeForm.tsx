"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { createUnit } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

type Secretariat = { id: string; name: string };

export default function NovaUnidadeForm({ secretariats }: { secretariats: Secretariat[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createUnit(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <PageFrame className="max-w-3xl space-y-2">
      <PageHeader title="Nova Unidade Administrativa" action={<Link href="/administracao/unidades" className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-3.5" />Voltar</Link>} />

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="space-y-3 p-3">
          {error && <div className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{error}</div>}
          
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Secretaria Vinculada *</label>
              <select name="secretariatId" required className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white">
                <option value="">Selecione...</option>
                {secretariats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tipo de Unidade *</label>
              <select name="type" required className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white">
                <option value="">Selecione...</option>
                <option value="Escola">Escola</option>
                <option value="UBS">Unidade Básica de Saúde (UBS)</option>
                <option value="CRAS">CRAS / CREAS</option>
                <option value="Almoxarifado">Almoxarifado</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Nome da Unidade *</label>
            <input type="text" name="name" required placeholder="Ex: Escola Municipal Joãozinho" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Responsável (Diretor/Coordenador)</label>
              <input type="text" name="managerName" placeholder="Nome do responsável" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Endereço</label>
              <input type="text" name="address" placeholder="Endereço da unidade" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
            </div>
          </div>
        </div>
        <div className="flex h-10 justify-end border-t border-slate-200 bg-slate-50 px-3">
          <button type="submit" disabled={loading} className="inline-flex h-7 items-center gap-1.5 self-center rounded bg-indigo-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:opacity-50">
            <Save className="size-3.5" /> {loading ? "Salvando..." : "Salvar Unidade"}
          </button>
        </div>
      </form>
    </PageFrame>
  );
}
