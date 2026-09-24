import { notFound } from "next/navigation";
import { CalendarDays, Newspaper } from "lucide-react";
import { PortalBreadcrumb, PortalTextContent } from "@/components/portal-institucional/PortalShell";
import { formatPortalDate, getPublishedNewsBySlug } from "@/lib/portal-institucional/public-content";

export const dynamic = "force-dynamic";

export default async function InstitutionalNewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const news = await getPublishedNewsBySlug(slug);
  if (!news) notFound();

  return (
    <main className="mx-auto max-w-4xl px-5 py-9 sm:px-6 sm:py-11">
      <PortalBreadcrumb current="Notícia" />
      <article className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-600"><span className="inline-flex items-center gap-2 text-emerald-800"><Newspaper className="size-4" aria-hidden="true" /> Notícia institucional</span><span className="inline-flex items-center gap-2"><CalendarDays className="size-4 text-slate-400" aria-hidden="true" /> {formatPortalDate(news.publishedAt)}</span></div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{news.title}</h1>
        {news.subtitle && <p className="mt-4 border-l-2 border-emerald-500 pl-4 text-lg leading-8 text-slate-600">{news.subtitle}</p>}
        <div className="mt-8 border-t border-slate-100 pt-8"><PortalTextContent content={news.content} /></div>
      </article>
    </main>
  );
}
