import type { Metadata } from "next";
import Link from "next/link";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "Mapa do Site | Prefeitura de Divino de São Lourenço",
  description: "Mapa do site do portal oficial da Prefeitura Municipal de Divino de São Lourenço.",
};

const SECTIONS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Institucional",
    links: [
      { label: "Início", href: "/portal" },
      { label: "História do município", href: "/portal/historia" },
      { label: "Secretarias", href: "/portal/secretarias" },
      { label: "Notícias", href: "/portal/noticias" },
      { label: "Contato", href: "/portal/contato" },
    ],
  },
  {
    title: "Serviços",
    links: [
      { label: "Todos os serviços", href: "/portal/servicos" },
      { label: "Ouvidoria", href: "/portal/ouvidoria" },
      { label: "Acesso à Informação (e-SIC)", href: "/portal/acesso-informacao" },
      { label: "Perguntas Frequentes", href: "/portal/perguntas-frequentes" },
      { label: "Busca no portal", href: "/portal/busca" },
    ],
  },
  {
    title: "Transparência",
    links: [
      { label: "Portal da Transparência", href: "/portal-transparencia" },
      { label: "Licitações e Contratos", href: "/portal/licitacoes-e-contratos" },
      { label: "Leis Municipais", href: "/portal/leis-municipais" },
      { label: "Dados Abertos", href: "/portal/dados-abertos" },
    ],
  },
  {
    title: "Acessibilidade",
    links: [
      { label: "Acessibilidade", href: "/portal/acessibilidade" },
      { label: "Mapa do Site", href: "/portal/mapa-do-site" },
      { label: "Contato", href: "/portal/contato" },
    ],
  },
];

export default function MapaDoSitePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-9 sm:px-6">
      <PortalBreadcrumb current="Mapa do Site" />
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Mapa do Site</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Todas as seções do portal oficial da Prefeitura Municipal de Divino de São Lourenço.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-bold text-[#0e4c7e]">{section.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {section.links.map((link) => (
                <li key={`${section.title}-${link.label}`}>
                  <Link href={link.href} className="font-medium text-slate-700 hover:text-[#0e4c7e] hover:underline">{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
