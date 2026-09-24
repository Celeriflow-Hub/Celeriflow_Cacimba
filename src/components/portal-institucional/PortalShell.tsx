"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Accessibility,
  ChevronDown,
  ChevronRight,
  Contrast,
  FileText,
  Headset,
  Home,
  Mail,
  Menu,
  MessagesSquare,
  Newspaper,
  Scale,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type SubItem = { label: string; href: string; external?: boolean };
type MenuItem = { label: string; href: string; home?: boolean; children?: SubItem[] };

const MAIN_MENU: MenuItem[] = [
  { label: "Home", href: "/portal", home: true },
  {
    label: "História",
    href: "/portal/historia",
    children: [
      { label: "História do município", href: "/portal/historia" },
      { label: "Sede do município", href: "/portal/historia#sede" },
    ],
  },
  {
    label: "Acesso Rápido",
    href: "/portal/servicos",
    children: [
      { label: "Portal da Transparência", href: "/portal-transparencia" },
      { label: "Ouvidoria (e-Ouv)", href: "/portal/ouvidoria" },
      { label: "Acesso à Informação (e-SIC)", href: "/portal/acesso-informacao" },
      { label: "Perguntas Frequentes", href: "/portal/perguntas-frequentes" },
      { label: "Nota Fiscal Eletrônica", href: "https://es-divinodesaolourenco-pm-nfs.cloud.el.com.br//paginas/sistema/login.jsf", external: true },
      { label: "Diário Oficial", href: "https://ioes.dio.es.gov.br/buscanova/#/p=1&q=Divino%20de%20S%C3%A3o%20Louren%C3%A7o", external: true },
    ],
  },
  {
    label: "Secretarias",
    href: "/portal/secretarias",
    children: [
      { label: "Todas as secretarias", href: "/portal/secretarias" },
      { label: "Saúde", href: "/portal/secretarias#saude" },
      { label: "Educação", href: "/portal/secretarias#educacao" },
      { label: "Assistência Social", href: "/portal/secretarias#assistencia-social" },
      { label: "Administração", href: "/portal/secretarias#administracao" },
      { label: "Finanças", href: "/portal/secretarias#financas" },
      { label: "Obras e Transportes", href: "/portal/secretarias#obras" },
    ],
  },
  {
    label: "Serviços",
    href: "/portal/servicos",
    children: [
      { label: "Todos os serviços", href: "/portal/servicos" },
      { label: "Certidão Negativa", href: "/portal/servicos#certidoes" },
      { label: "Alvará e IPTU", href: "/portal/servicos#tributos" },
      { label: "Contracheque do servidor", href: "/portal/servicos#servidor" },
      { label: "Acesso à Informação", href: "/portal/acesso-informacao" },
    ],
  },
  {
    label: "Transparência",
    href: "/portal-transparencia",
    children: [
      { label: "Portal da Transparência", href: "/portal-transparencia" },
      { label: "Despesas", href: "/portal-transparencia?view=despesas" },
      { label: "Receitas", href: "/portal-transparencia?view=receitas" },
      { label: "Dados Abertos (CSV)", href: "/portal/dados-abertos" },
      { label: "Acesso à Informação", href: "/portal/acesso-informacao" },
    ],
  },
  {
    label: "Comunicação",
    href: "/portal/noticias",
    children: [
      { label: "Notícias", href: "/portal/noticias" },
      { label: "Ouvidoria (e-Ouv)", href: "/portal/ouvidoria" },
      { label: "Fale Conosco", href: "/portal/contato" },
      { label: "Perguntas Frequentes", href: "/portal/perguntas-frequentes" },
    ],
  },
  {
    label: "Licitações e Contratos",
    href: "/portal/licitacoes-e-contratos",
    children: [
      { label: "Licitações", href: "/portal/licitacoes-e-contratos#licitacoes" },
      { label: "Contratos", href: "/portal/licitacoes-e-contratos#contratos" },
      { label: "Exportar dados (CSV)", href: "/portal/dados-abertos" },
    ],
  },
  {
    label: "Leis Municipais",
    href: "/portal/leis-municipais",
    children: [
      { label: "Leis e atos compilados (SPL)", href: "https://divinodesaolourenco.legonline.com.br", external: true },
      { label: "Decretos e portarias", href: "/portal/leis-municipais#decretos" },
      { label: "Lei Orgânica", href: "/portal/leis-municipais#lei-organica" },
    ],
  },
];

const SECONDARY_MENU = [
  { label: "Notícias", href: "/portal/noticias", icon: Newspaper },
  { label: "Ouvidoria", href: "/portal/ouvidoria", icon: Headset },
  { label: "Acesso à Informação", href: "/portal/acesso-informacao", icon: FileText },
  { label: "Todos Serviços", href: "/portal/servicos", icon: MessagesSquare },
];

const FONT_STEPS = [0.875, 1, 1.125, 1.25];

function TopAccessibilityBar({
  highContrast,
  onIncrease,
  onDecrease,
  onResetFont,
  onToggleContrast,
}: {
  highContrast: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onResetFont: () => void;
  onToggleContrast: () => void;
}) {
  return (
    <div className="bg-[#0e4c7e] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5 text-[12.5px] sm:px-6">
        <p className="font-semibold tracking-wide">Poder Executivo Municipal</p>
        <nav aria-label="Acessibilidade e links institucionais" className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1" role="group" aria-label="Tamanho da fonte">
            <button type="button" onClick={onIncrease} className="rounded px-1.5 py-0.5 font-bold hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white" aria-label="Aumentar tamanho da fonte (A+)">A+</button>
            <button type="button" onClick={onDecrease} className="rounded px-1.5 py-0.5 font-bold hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white" aria-label="Diminuir tamanho da fonte (A-)">A-</button>
            <button type="button" onClick={onResetFont} className="rounded px-1.5 py-0.5 font-bold hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white" aria-label="Restaurar tamanho padrão da fonte (Aa)">Aa</button>
          </span>
          <button
            type="button"
            onClick={onToggleContrast}
            aria-pressed={highContrast}
            title="Alto contraste"
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
          >
            <Contrast className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Contraste</span>
          </button>
          <Link href="/portal/acessibilidade" className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-semibold hover:bg-white/15 hover:underline">
            <Accessibility className="size-3.5" aria-hidden="true" /> Acessibilidade
          </Link>
          <a href="https://www.nvaccess.org/download/" target="_blank" rel="noreferrer" title="NVDA - Leitor de Telas" className="rounded px-1 py-0.5 font-semibold hover:bg-white/15 hover:underline">NVDA</a>
          <Link href="/portal/dados-abertos" className="rounded px-1 py-0.5 font-semibold hover:bg-white/15 hover:underline">Dados Abertos</Link>
          <Link href="/portal/mapa-do-site" className="rounded px-1 py-0.5 font-semibold hover:bg-white/15 hover:underline">Mapa do Site</Link>
          <Link href="/portal/contato" title="Contato" aria-label="Contato institucional" className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-semibold hover:bg-white/15 hover:underline">
            <Mail className="size-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Contato</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

function InstitutionalBrand() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <div className="bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_auto_minmax(280px,0.9fr)] lg:gap-8">
        <Link href="/portal" className="flex items-center gap-4 rounded-md focus-visible:outline-2 focus-visible:outline-[#0e4c7e] focus-visible:outline-offset-4" aria-label="Página inicial — Prefeitura de Divino de São Lourenço">
          <Image
            src="/brasao-divino.png"
            alt="Brasão oficial da Prefeitura Municipal de Divino de São Lourenço"
            width={420}
            height={120}
            priority
            className="h-16 w-auto sm:h-[76px]"
          />
        </Link>

        <div className="flex items-center justify-start gap-2.5 lg:justify-center" aria-label="Redes sociais e canais oficiais">
          <a
            href="https://www.facebook.com/profile.php?id=100068793926806"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook oficial da Prefeitura"
            title="Facebook oficial"
            className="flex size-10 items-center justify-center rounded-full bg-[#0e4c7e] text-white transition hover:bg-[#0a3a5f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4c7e]"
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/prefdivinosaolourenco/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram oficial da Prefeitura"
            title="Instagram oficial"
            className="flex size-10 items-center justify-center rounded-full bg-[#0e4c7e] text-white transition hover:bg-[#0a3a5f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4c7e]"
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
          <Link
            href="/portal/ouvidoria"
            aria-label="Ouvidoria municipal"
            title="Ouvidoria"
            className="flex size-10 items-center justify-center rounded-full bg-[#00843d] text-white transition hover:bg-[#006e33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00843d]"
          >
            <Headset className="size-5" aria-hidden="true" />
          </Link>
          <Link
            href="/portal/acesso-informacao"
            aria-label="Acesso à Informação (e-SIC)"
            title="Acesso à Informação (e-SIC)"
            className="flex size-10 items-center justify-center rounded-full bg-[#5b6b7a] text-white transition hover:bg-[#45525f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b6b7a]"
          >
            <FileText className="size-5" aria-hidden="true" />
          </Link>
        </div>

        <div className="w-full">
          <form
            role="search"
            aria-label="Pesquisa institucional"
            onSubmit={(event) => {
              event.preventDefault();
              router.push(`/portal/busca?q=${encodeURIComponent(query.trim())}`);
            }}
            className="flex w-full overflow-hidden rounded-md border border-slate-300 focus-within:border-[#0e4c7e] focus-within:ring-2 focus-within:ring-[#0e4c7e]/25"
          >
            <label htmlFor="pesquisa-portal" className="sr-only">Pesquisar no portal</label>
            <input
              id="pesquisa-portal"
              name="q"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar no portal…"
              className="min-w-0 flex-1 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button type="submit" aria-label="Pesquisar" className="flex items-center gap-2 bg-[#0e4c7e] px-4 text-sm font-bold text-white transition hover:bg-[#0a3a5f]">
              <Search className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </form>
          <a
            href="https://divinodesaolourenco.legonline.com.br"
            target="_blank"
            rel="noreferrer"
            title="Sistema de Processos Legislativos (SPL) — legislação compilada"
            className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#0e4c7e]/25 bg-[#eef4f9] px-3 py-2 text-[13px] font-bold text-[#0e4c7e] transition hover:bg-[#0e4c7e] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4c7e]"
          >
            <Scale className="size-4" aria-hidden="true" />
            Sistema de Processos Legislativos (SPL)
          </a>
        </div>
      </div>
    </div>
  );
}

function MainMenu() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    if (!openDropdown) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenDropdown(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openDropdown]);

  const toggle = useCallback((label: string) => {
    setOpenDropdown((current) => (current === label ? null : label));
  }, []);

  return (
    <nav aria-label="Menu principal" className="border-y border-slate-200 bg-[#f7f8f9]">
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        <div className="flex items-center justify-between lg:hidden">
          <span className="px-2 py-3 text-sm font-bold uppercase tracking-wide text-slate-700">Menu</span>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="menu-principal-movel"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            className="m-1 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800"
          >
            {mobileOpen ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
            {mobileOpen ? "Fechar" : "Opções"}
          </button>
        </div>

        {/* Desktop */}
        <ul className="hidden items-stretch lg:flex">
          {MAIN_MENU.map((item, index) => {
            const isOpen = openDropdown === item.label;
            const isActive = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <li key={item.label} className={`relative flex items-stretch ${index > 0 ? "border-l border-slate-300/80" : ""}`}>
                {item.children ? (
                  <div className="flex items-stretch" onMouseLeave={() => setOpenDropdown(null)}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-1.5 px-3 py-[15px] text-[13.5px] font-semibold transition xl:px-3.5 ${isActive ? "bg-white text-[#0e4c7e]" : "text-slate-800 hover:bg-white hover:text-[#0e4c7e]"}`}
                    >
                      {item.home && <Home className="size-4" aria-hidden="true" />}
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggle(item.label)}
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onFocus={() => setOpenDropdown(item.label)}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      aria-label={`Abrir submenu de ${item.label}`}
                      className={`px-1.5 text-slate-600 hover:bg-white hover:text-[#0e4c7e] ${isOpen ? "bg-white text-[#0e4c7e]" : ""}`}
                    >
                      <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                    {isOpen && (
                      <ul className="absolute left-0 top-full z-40 min-w-64 rounded-b-lg border border-slate-200 bg-white py-1.5 shadow-xl" role="menu" aria-label={`Submenu ${item.label}`}>
                        {item.children.map((sub) => (
                          <li key={sub.label} role="none">
                            {sub.external ? (
                              <a href={sub.href} target="_blank" rel="noreferrer" role="menuitem" className="block px-4 py-2.5 text-[13.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-[#0e4c7e]">
                                {sub.label}
                              </a>
                            ) : (
                              <Link href={sub.href} role="menuitem" className="block px-4 py-2.5 text-[13.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-[#0e4c7e]">
                                {sub.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-1.5 px-3 py-[15px] text-[13.5px] font-semibold transition xl:px-3.5 ${isActive ? "bg-white text-[#0e4c7e]" : "text-slate-800 hover:bg-white hover:text-[#0e4c7e]"}`}
                  >
                    {item.home && <Home className="size-4" aria-hidden="true" />}
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
          <li className="ml-auto flex items-stretch border-l border-slate-300/80">
            <Link href="/portal/mapa-do-site" aria-label="Todos os menus — mapa do site" title="Todos os menus" className="flex items-center px-4 text-slate-700 hover:bg-white hover:text-[#0e4c7e]">
              <Menu className="size-5" aria-hidden="true" />
            </Link>
          </li>
        </ul>

        {/* Mobile */}
        {mobileOpen && (
          <ul id="menu-principal-movel" className="divide-y divide-slate-200 border-t border-slate-200 bg-white pb-2 lg:hidden">
            {MAIN_MENU.map((item) => {
              const expanded = mobileExpanded === item.label;
              return (
                <li key={item.label}>
                  <div className="flex items-center">
                    <Link href={item.href} className="flex flex-1 items-center gap-2 px-3 py-3 text-sm font-bold text-slate-800">
                      {item.home && <Home className="size-4" aria-hidden="true" />}
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-label={`${expanded ? "Recolher" : "Expandir"} submenu de ${item.label}`}
                        onClick={() => setMobileExpanded((c) => (c === item.label ? null : item.label))}
                        className="mr-2 rounded p-2 text-slate-600 hover:bg-slate-100"
                      >
                        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  {item.children && expanded && (
                    <ul className="bg-slate-50 py-1">
                      {item.children.map((sub) => (
                        <li key={sub.label}>
                          {sub.external ? (
                            <a href={sub.href} target="_blank" rel="noreferrer" className="block px-6 py-2.5 text-sm text-slate-700 hover:text-[#0e4c7e]">
                              {sub.label}
                            </a>
                          ) : (
                            <Link href={sub.href} className="block px-6 py-2.5 text-sm text-slate-700 hover:text-[#0e4c7e]">
                              {sub.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            <li>
              <Link href="/portal/mapa-do-site" className="flex items-center gap-2 px-3 py-3 text-sm font-bold text-[#0e4c7e]">
                <Menu className="size-4" aria-hidden="true" /> Mapa do site
              </Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const [fontStep, setFontStep] = useState(1);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    try {
      const savedScale = Number(window.localStorage.getItem("portal-a11y-font-step") ?? "1");
      if (Number.isInteger(savedScale) && savedScale >= 0 && savedScale < FONT_STEPS.length) setFontStep(savedScale);
      setHighContrast(window.localStorage.getItem("portal-a11y-contrast") === "1");
    } catch {
      // sem armazenamento disponível
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("portal-a11y-font-step", String(fontStep));
      window.localStorage.setItem("portal-a11y-contrast", highContrast ? "1" : "0");
    } catch {
      // sem armazenamento disponível
    }
  }, [fontStep, highContrast]);

  const fontScale = FONT_STEPS[fontStep] ?? 1;

  return (
    <div
      className={`min-h-screen bg-[#eef1f4] text-slate-900 ${highContrast ? "portal-high-contrast" : ""}`}
      style={{ fontSize: `${fontScale}rem` }}
    >
      {highContrast && (
        <style>{`.portal-high-contrast, .portal-high-contrast main, .portal-high-contrast header, .portal-high-contrast nav, .portal-high-contrast footer, .portal-high-contrast section, .portal-high-contrast aside, .portal-high-contrast div { background-color: #000 !important; background-image: none !important; color: #fff !important; border-color: #fff !important; } .portal-high-contrast a, .portal-high-contrast button { color: #ffe600 !important; } .portal-high-contrast img { filter: contrast(1.15); }`}</style>
      )}
      <a
        href="#conteudo-principal"
        className="sr-only z-50 rounded-md bg-white px-4 py-2 font-semibold text-slate-950 shadow focus:not-sr-only focus:absolute focus:left-5 focus:top-4"
      >
        Ir para o conteúdo principal
      </a>

      <TopAccessibilityBar
        highContrast={highContrast}
        onIncrease={() => setFontStep((s) => Math.min(FONT_STEPS.length - 1, s + 1))}
        onDecrease={() => setFontStep((s) => Math.max(0, s - 1))}
        onResetFont={() => setFontStep(1)}
        onToggleContrast={() => setHighContrast((v) => !v)}
      />

      <header>
        <InstitutionalBrand />
        <MainMenu />
        <div className="h-[6px] bg-[#00843d]" aria-hidden="true" />
        <nav aria-label="Acesso rápido institucional" className="bg-white shadow-sm">
          <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-1 px-4 py-2.5 sm:px-6">
            {SECONDARY_MENU.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="inline-flex items-center gap-2 text-[13.5px] font-bold text-[#0e4c7e] hover:text-[#00843d] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0e4c7e]">
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div id="conteudo-principal" tabIndex={-1} className="outline-none">
        {children}
      </div>

      <footer className="mt-14 bg-[#0a3a5c] text-slate-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
          <div>
            <Image src="/brasao-divino-claro.png" alt="Prefeitura Municipal de Divino de São Lourenço" width={320} height={96} className="h-14 w-auto" />
            <p className="mt-4 text-sm leading-6 text-slate-200">
              Portal oficial da Prefeitura Municipal de Divino de São Lourenço, Espírito Santo. Acesso público às informações institucionais, serviços e transparência.
            </p>
          </div>
          <nav aria-label="Menu geral do rodapé">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-200">Menu geral</h2>
            <ul className="mt-4 grid grid-cols-1 gap-2 text-sm">
              <li><Link href="/portal" className="hover:text-white hover:underline">Início</Link></li>
              <li><Link href="/portal/historia" className="hover:text-white hover:underline">História</Link></li>
              <li><Link href="/portal/secretarias" className="hover:text-white hover:underline">Secretarias</Link></li>
              <li><Link href="/portal/servicos" className="hover:text-white hover:underline">Serviços</Link></li>
              <li><Link href="/portal-transparencia" className="hover:text-white hover:underline">Portal da Transparência</Link></li>
              <li><Link href="/portal/noticias" className="hover:text-white hover:underline">Notícias</Link></li>
              <li><Link href="/portal/mapa-do-site" className="hover:text-white hover:underline">Mapa do Site</Link></li>
            </ul>
          </nav>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-200">Atendimento</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/portal/ouvidoria" className="hover:text-white hover:underline">Ouvidoria municipal</Link></li>
              <li><Link href="/portal/acesso-informacao" className="hover:text-white hover:underline">Acesso à Informação (e-SIC)</Link></li>
              <li><Link href="/portal/contato" className="hover:text-white hover:underline">Fale Conosco</Link></li>
              <li><Link href="/portal/dados-abertos" className="hover:text-white hover:underline">Dados Abertos</Link></li>
              <li><Link href="/portal/acessibilidade" className="hover:text-white hover:underline">Acessibilidade</Link></li>
            </ul>
            <p className="mt-5 text-[13px] leading-5 text-slate-300">Praça Dez de Agosto, 10 — Centro<br />Divino de São Lourenço/ES — CEP 29590-000</p>
          </div>
        </div>
        <div className="border-t border-white/15 px-4 py-4 text-center text-xs text-slate-300">
          Prefeitura Municipal de Divino de São Lourenço — Poder Executivo Municipal. Conteúdo institucional publicado e dados públicos autorizados.
        </div>
      </footer>
    </div>
  );
}

export function PortalBreadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Caminho de navegação" className="flex items-center gap-1.5 text-sm text-slate-600">
      <Link href="/portal" className="font-medium hover:text-emerald-800 hover:underline">Portal</Link>
      <ChevronRight className="size-4 text-slate-400" aria-hidden="true" />
      <span aria-current="page" className="truncate text-slate-700">{current}</span>
    </nav>
  );
}

export function PortalTextContent({ content }: { content: string }) {
  const paragraphs = content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <div className="space-y-5 text-[1.02rem] leading-8 text-slate-700">
      {(paragraphs.length ? paragraphs : [content]).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}
    </div>
  );
}
