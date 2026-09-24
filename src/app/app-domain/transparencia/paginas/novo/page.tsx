"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileOutput, Save, ArrowLeft } from "lucide-react";
import { createPage } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default function NovaPaginaPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    try {
      await createPage(formData);
      router.push("/transparencia/paginas");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao salvar a página.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <PageFrame className="max-w-4xl space-y-2">
      <PageHeader
        title="Nova página"
        icon={<FileOutput className="size-4 shrink-0 text-purple-600" />}
        action={<Link href="/transparencia/paginas" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="size-3.5" />Voltar</Link>}
      />
      <p className="px-1 text-sm text-slate-500">Crie uma nova página institucional para o portal.</p>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 col-span-full">
              <label className="text-sm font-semibold text-slate-700">Título da Página</label>
              <input
                name="title"
                required
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                placeholder="Ex: História do Município"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select 
                name="status"
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
              >
                <option value="Rascunho">Salvar como Rascunho</option>
                <option value="Publicado">Publicar Imediatamente</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Conteúdo</label>
            <textarea 
              name="content"
              required
              rows={12}
              className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
              placeholder="Escreva o conteúdo institucional que será publicado no portal."
            ></textarea>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
            <Link 
              href="/transparencia/paginas"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Página</>}
            </button>
          </div>
        </form>
      </div>
    </PageFrame>
  );
}
