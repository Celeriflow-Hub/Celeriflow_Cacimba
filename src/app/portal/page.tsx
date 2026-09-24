import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileSearch,
  Mail,
  MapPin,
  Newspaper,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  contentExcerpt,
  formatPortalDate,
  getInstitutionalPortalHome,
  safeExternalUrl,
} from "@/lib/portal-institucional/public-content";

export const dynamic = "force-dynamic";

function PortalAccessCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof BarChart3;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
      <span className="flex size-10 items-center justify-center rounded-lg bg-[#eaf3fa] text-[#07517f] group-hover:bg-emerald-50 group-hover:text-emerald-800"><Icon className="size-5" aria-hidden="true" /></span>
      <h2 className="mt-5 flex items-center justify-between gap-3 text-base font-bold text-slate-900">{title}<ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" aria-hidden="true" /></h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}

export default async function InstitutionalPortalHome() {
  const { institution, latestNews, pages } = await getInstitutionalPortalHome();
  const website = safeExternalUrl(institution.website);
  const location = [institution.address, [institution.city, institution.state].filter(Boolean).join("/")].filter(Boolean).join(" · ");

  return (
    <main>
      <section className="border-b border-slate-200 bg-[linear-gradient(120deg,#edf5fb_0%,#ffffff_58%,#e8f6ef_100%)]">
        <div className="mx-auto grid max-w-7xl gap-9 px-5 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)] lg:items-center lg:py-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#bdd7e8] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#07517f]"><ShieldCheck className="size-3.5 text-emerald-700" aria-hidden="true" /> Portal Oficial da Prefeitura</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-[#073b64] sm:text-5xl">Prefeitura de Divino de São Lourenço</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Informações institucionais, serviços, notícias e transparência em um portal simples de consultar.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/portal-transparencia" className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Acessar transparência <ArrowRight className="size-4" aria-hidden="true" /></Link>
              <Link href="/portal/noticias" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Ver notícias</Link>
            </div>
          </div>
          <aside className="rounded-2xl border border-[#c5ddea] bg-white/90 p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#07517f]">Acesso público responsável</p>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="border-l-2 border-emerald-500 pl-3"><dt className="font-bold text-slate-900">Consulta sem cadastro</dt><dd className="mt-1 leading-5 text-slate-600">Os canais deste portal não pedem dados pessoais para consulta pública.</dd></div>
              <div className="border-l-2 border-sky-500 pl-3"><dt className="font-bold text-slate-900">Dados autorizados</dt><dd className="mt-1 leading-5 text-slate-600">A transparência apresenta apenas projeções públicas e agregadas.</dd></div>
              <div className="border-l-2 border-slate-400 pl-3"><dt className="font-bold text-slate-900">Avisos preservados</dt><dd className="mt-1 leading-5 text-slate-600">Processos externos seguem somente em consulta de avisos publicados.</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-800">Acessos principais</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Serviços de consulta</h2></div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">Atalhos para as informações públicas já disponíveis neste ambiente.</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <PortalAccessCard href="/portal-transparencia" icon={BarChart3} title="Portal da Transparência" description="Consulte receitas, despesas, contratos, licitações e relatórios públicos." />
          <PortalAccessCard href="/portal-protocolos" icon={FileSearch} title="Avisos de Processos" description="Consulte somente avisos administrativos previamente publicados e redigidos." />
          <PortalAccessCard href="/portal/noticias" icon={Newspaper} title="Notícias institucionais" description="Acompanhe as comunicações que foram efetivamente publicadas pela administração." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-6" aria-labelledby="transparencia-titulo">
        <div className="relative overflow-hidden rounded-2xl bg-[#073b64] px-6 py-8 text-white shadow-sm sm:px-8 sm:py-9">
          <div className="absolute -right-12 -top-20 size-64 rounded-full border-[28px] border-white/10" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Dados abertos e controle social</p>
              <h2 id="transparencia-titulo" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Portal da Transparência</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">Acesse a execução orçamentária e financeira, exporte dados em CSV e acompanhe registros publicáveis com proteção de informações pessoais.</p>
            </div>
            <Link href="/portal-transparencia" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#073b64] transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#073b64]">Ir para o Portal da Transparência <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white" aria-labelledby="noticias-titulo">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#07517f]">Comunicação institucional</p><h2 id="noticias-titulo" className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Últimas notícias</h2></div><Link href="/portal/noticias" className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800 hover:text-emerald-950 hover:underline">Todas as notícias <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
          {latestNews.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {latestNews.map((news) => <article key={news.slug} className="flex min-h-60 flex-col rounded-xl border border-slate-200 bg-[#fbfcfd] p-5 shadow-sm"><p className="text-xs font-semibold text-slate-500">{formatPortalDate(news.publishedAt)}</p><h3 className="mt-3 text-lg font-bold leading-6 text-slate-900"><Link href={`/portal/noticias/${encodeURIComponent(news.slug)}`} className="hover:text-emerald-800 hover:underline">{news.title}</Link></h3>{news.subtitle && <p className="mt-2 text-sm font-medium text-[#07517f]">{news.subtitle}</p>}<p className="mt-3 text-sm leading-6 text-slate-600">{contentExcerpt(news.content)}</p><Link href={`/portal/noticias/${encodeURIComponent(news.slug)}`} className="mt-auto pt-5 text-sm font-bold text-emerald-800 hover:text-emerald-950 hover:underline">Ler notícia</Link></article>)}
            </div>
          ) : <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">Nenhuma notícia publicada no momento.</div>}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.58fr)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#07517f]">Informações institucionais</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Páginas publicadas</h2>
          {pages.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{pages.map((page) => <Link key={page.slug} href={`/portal/${encodeURIComponent(page.slug)}`} className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-900"><span>{page.title}</span><ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" aria-hidden="true" /></Link>)}</div> : <p className="mt-4 text-sm leading-6 text-slate-600">As páginas institucionais aparecerão aqui quando forem publicadas pela administração.</p>}
        </div>
        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Contato institucional</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{institution.name}</p>
          <dl className="mt-5 space-y-4 text-sm text-slate-700">
            {location && <div className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" /><dd>{location}</dd></div>}
            {institution.phone && <div className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" /><dd>{institution.phone}</dd></div>}
            {institution.email && <div className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" /><dd><a href={`mailto:${institution.email}`} className="font-semibold text-emerald-800 hover:underline">{institution.email}</a></dd></div>}
          </dl>
          {website && <a href={website} rel="noreferrer" className="mt-5 inline-flex text-sm font-bold text-emerald-800 hover:underline">Site institucional cadastrado</a>}
        </aside>
      </section>
    </main>
  );
}
