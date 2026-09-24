"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Save, ArrowLeft } from "lucide-react";
import { createDiary } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default function NovoDiarioPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    try {
      await createDiary(formData);
      router.push("/transparencia/diario-oficial");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao salvar o diário oficial.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <PageFrame className="max-w-4xl space-y-2">
      <PageHeader
        title="Nova edição"
        icon={<FileText className="size-4 shrink-0 text-emerald-600" />}
        action={<Link href="/transparencia/diario-oficial" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="size-3.5" />Voltar</Link>}
      />
      <p className="px-1 text-sm text-slate-500">Publique uma nova edição do Diário Oficial.</p>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Número da Edição</label>
              <input 
                name="editionNumber"
                type="number"
                min="1"
                required
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                placeholder="Ex: 1543"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select 
                name="status"
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              >
                <option value="Rascunho">Rascunho</option>
                <option value="Publicado">Publicado</option>
              </select>
            </div>

            <div className="space-y-2 col-span-full">
              <label className="text-sm font-semibold text-slate-700">URL do PDF</label>
              <input 
                name="pdfUrl"
                type="url"
                required
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                placeholder="https://exemplo.com/diario-1543.pdf"
              />
              <p className="text-xs text-slate-500">Insira o link direto para visualizar o arquivo PDF do diário.</p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
            <Link 
              href="/transparencia/diario-oficial"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Edição</>}
            </button>
          </div>
        </form>
      </div>
    </PageFrame>
  );
}
