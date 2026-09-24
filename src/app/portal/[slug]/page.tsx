import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { PortalBreadcrumb, PortalTextContent } from "@/components/portal-institucional/PortalShell";
import { getPublishedPortalPageBySlug } from "@/lib/portal-institucional/public-content";

export const dynamic = "force-dynamic";

export default async function InstitutionalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublishedPortalPageBySlug(slug);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-4xl px-5 py-9 sm:px-6 sm:py-11">
      <PortalBreadcrumb current={page.title} />
      <article className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#07517f]"><FileText className="size-4" aria-hidden="true" /> Página institucional</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{page.title}</h1>
        <div className="mt-8 border-t border-slate-100 pt-8"><PortalTextContent content={page.content} /></div>
      </article>
    </main>
  );
}
