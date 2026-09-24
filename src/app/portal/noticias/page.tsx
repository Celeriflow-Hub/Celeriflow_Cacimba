import Link from "next/link";
import { ArrowLeft, ArrowRight, Newspaper } from "lucide-react";
import { contentExcerpt, formatPortalDate, getPublishedNewsPage } from "@/lib/portal-institucional/public-content";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const dynamic = "force-dynamic";

type SearchParams = { page?: string | string[] };

function requestedPage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(page: number) {
  return page > 1 ? `/portal/noticias?page=${page}` : "/portal/noticias";
}

export default async function InstitutionalNewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const rawParams = await searchParams;
  const result = await getPublishedNewsPage(requestedPage(rawParams.page));

  return (
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-6 sm:py-11">
      <PortalBreadcrumb current="Notícias" />
      <div className="mt-6 border-b border-slate-200 pb-7"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#07517f]">Comunicação institucional</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Notícias</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Comunicados e notícias efetivamente publicados pela administração municipal.</p></div>

      {result.items.length ? (
        <>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((news) => <article key={news.slug} className="flex min-h-64 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><Newspaper className="size-3.5 text-emerald-700" aria-hidden="true" /> Notícia</span><time className="text-xs font-medium text-slate-500">{formatPortalDate(news.publishedAt)}</time></div><h2 className="mt-5 text-xl font-bold leading-7 text-slate-900"><Link href={`/portal/noticias/${encodeURIComponent(news.slug)}`} className="hover:text-emerald-800 hover:underline">{news.title}</Link></h2>{news.subtitle && <p className="mt-2 text-sm font-semibold text-[#07517f]">{news.subtitle}</p>}<p className="mt-3 text-sm leading-6 text-slate-600">{contentExcerpt(news.content, 190)}</p><Link href={`/portal/noticias/${encodeURIComponent(news.slug)}`} className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-bold text-emerald-800 hover:text-emerald-950 hover:underline">Ler notícia <ArrowRight className="size-4" aria-hidden="true" /></Link></article>)}
          </div>
          {result.totalPages > 1 && <nav aria-label="Paginação de notícias" className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm"><span className="text-slate-600">{result.total} notícia(s) · página {result.currentPage} de {result.totalPages}</span><div className="flex items-center gap-4">{result.currentPage > 1 ? <Link href={pageHref(result.currentPage - 1)} className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline"><ArrowLeft className="size-4" aria-hidden="true" /> Anterior</Link> : <span className="inline-flex items-center gap-1 text-slate-400"><ArrowLeft className="size-4" aria-hidden="true" /> Anterior</span>}{result.currentPage < result.totalPages ? <Link href={pageHref(result.currentPage + 1)} className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline">Próxima <ArrowRight className="size-4" aria-hidden="true" /></Link> : <span className="inline-flex items-center gap-1 text-slate-400">Próxima <ArrowRight className="size-4" aria-hidden="true" /></span>}</div></nav>}
        </>
      ) : <div className="mt-7 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><Newspaper className="mx-auto size-7 text-slate-400" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold text-slate-900">Nenhuma notícia publicada</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">As notícias publicadas pela administração aparecerão nesta página.</p></div>}
    </main>
  );
}
