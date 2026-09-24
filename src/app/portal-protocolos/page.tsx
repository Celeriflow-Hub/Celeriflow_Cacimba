import Link from "next/link";
import { ArrowRight, FileCheck2, LockKeyhole, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type SearchParams = { q?: string | string[]; page?: string | string[] };

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value || "").trim();
}

function hrefFor(query: string, page = 1) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  return `/portal-protocolos${params.size ? `?${params.toString()}` : ""}`;
}

export default async function PortalProtocolosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const q = firstValue(raw.q).slice(0, 120);
  const requestedPage = Number.parseInt(firstValue(raw.page), 10);
  const where = {
    sourceModule: "PROCESSOS",
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };
  const total = await prisma.publicNotice.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
  const notices = await prisma.publicNotice.findMany({
    where,
    select: { title: true, publishedAt: true, validationCode: true },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b-4 border-emerald-500 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Serviços digitais</p><h1 className="mt-1 text-2xl font-bold">Portal de Processos e Protocolos</h1><p className="mt-1 text-sm text-slate-300">Consulta de avisos expressamente publicados pela instituição.</p></div>
          <span className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300">Consulta pública controlada</span>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex gap-3"><FileCheck2 className="mt-0.5 size-5 shrink-0 text-emerald-700" /><div><h2 className="font-bold text-emerald-950">Consulta pública controlada</h2><p className="mt-1 text-sm text-emerald-900">Esta área contém apenas avisos redigidos e publicados por autorização interna. Ela não revela interessado, descrição, documentos, tramitação, tipo interno ou dados pessoais.</p></div></div></section>
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-amber-800" /><div><h2 className="font-bold text-amber-950">Abertura externa em preparação</h2><p className="mt-1 text-sm text-amber-900">O protocolo do cidadão e a manifestação online serão ativados depois da definição da política de identidade, sigilo, aviso de privacidade, acompanhamento seguro, prevenção a abuso e comunicação oficial. Nenhum dado pessoal é solicitado nesta etapa.</p></div></div></section>
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-5"><div className="flex gap-3"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-sky-800" /><div><h2 className="font-bold text-sky-950">Privacidade e proteção de dados</h2><p className="mt-1 text-sm text-sky-900">Esta página é somente de consulta a avisos administrativos previamente redigidos e autorizados. Ela não solicita cadastro, documento, e-mail, anexos ou outros dados pessoais. Os avisos exibidos não contêm interessado, documentos, tramitação ou dados pessoais.</p><p className="mt-2 text-sm text-sky-900">Quando a abertura externa for ativada, serão solicitados somente os dados necessários ao serviço. Os registros e anexos terão acesso restrito aos setores autorizados, não serão publicados no acompanhamento público e serão guardados pelos prazos legais e pela política institucional. O canal oficial para informações e exercício dos direitos previstos na LGPD será divulgado antes da abertura. Não envie dados de terceiros ou informações sensíveis que não sejam necessários à sua demanda.</p></div></div></section>
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="font-bold text-slate-900">Avisos publicados</h2><p className="mt-1 text-sm text-slate-500">Valide a autenticidade de cada aviso pelo código individual.</p></div><form action="/portal-protocolos" method="GET" className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Buscar aviso</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={q} placeholder="Número do aviso ou processo" className="h-10 w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15" /></label><button className="h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700">Buscar</button><Link href="/portal-protocolos" className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white">Limpar</Link></form><div className="divide-y divide-slate-100">{notices.length ? notices.map((notice) => <article key={notice.validationCode} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-slate-900">{notice.title}</h3><p className="mt-1 text-sm text-slate-600">Aviso administrativo · Publicado em {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(notice.publishedAt)}</p></div><Link href={`/validar-aviso/${notice.validationCode}`} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950">Validar aviso <ArrowRight className="size-4" /></Link></article>) : <p className="p-10 text-center text-sm text-slate-500">Nenhum aviso de processo foi publicado para esta consulta.</p>}</div>{total > 0 && <nav aria-label="Paginação de avisos" className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm"><span className="text-slate-600">{total} aviso(s) · página {page} de {totalPages}</span><div className="flex gap-4">{page > 1 ? <Link href={hrefFor(q, page - 1)} className="font-semibold text-emerald-800 hover:underline">Anterior</Link> : <span className="text-slate-400">Anterior</span>}{page < totalPages ? <Link href={hrefFor(q, page + 1)} className="font-semibold text-emerald-800 hover:underline">Próxima</Link> : <span className="text-slate-400">Próxima</span>}</div></nav>}</section>
      </div>
    </main>
  );
}

