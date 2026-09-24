"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Newspaper, Save, ArrowLeft } from "lucide-react";
import { createNews } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default function NovaNoticiaPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    try {
      await createNews(formData);
      router.push("/transparencia/noticias");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao salvar a notícia.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <PageFrame className="max-w-4xl space-y-2">
      <PageHeader
        title="Nova notícia"
        icon={<Newspaper className="size-4 shrink-0 text-blue-600" />}
        action={<Link href="/transparencia/noticias" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="size-3.5" />Voltar</Link>}
      />
      <p className="px-1 text-sm text-slate-500">Escreva e publique uma nova notícia no portal.</p>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 col-span-full">
              <label className="text-sm font-semibold text-slate-700">Título da Notícia</label>
              <input 
                name="title"
                required
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                placeholder="Ex: Prefeitura inaugura nova escola..."
              />
            </div>

            <div className="space-y-2 col-span-full">
              <label className="text-sm font-semibold text-slate-700">Resumo (Subtítulo)</label>
              <input 
                name="subtitle"
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                placeholder="Ex: Obra vai beneficiar mais de 500 crianças da região."
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select 
                name="status"
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="Rascunho">Salvar como Rascunho</option>
                <option value="Publicado">Publicar Imediatamente</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Conteúdo Completo</label>
            <textarea 
              name="content"
              required
              rows={8}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              placeholder="Digite o texto da notícia aqui..."
            ></textarea>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
            <Link 
              href="/transparencia/noticias"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Notícia</>}
            </button>
          </div>
        </form>
      </div>
    </PageFrame>
  );
}
