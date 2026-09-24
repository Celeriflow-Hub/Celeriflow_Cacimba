import type { Metadata } from "next";
import Link from "next/link";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "Serviços | Prefeitura de Divino de São Lourenço",
  description: "Todos os serviços do portal oficial da Prefeitura Municipal de Divino de São Lourenço.",
};

const GROUPS: { id: string; title: string; items: { label: string; href: string; external?: boolean }[] }[] = [
  {
    id: "informacao",
    title: "Informação e participação",
    items: [
      { label: "Acesso à Informação (e-SIC)", href: "/portal/acesso-informacao" },
      { label: "Ouvidoria", href: "/portal/ouvidoria" },
      { label: "Notícias oficiais", href: "/portal/noticias" },
      { label: "Perguntas Frequentes", href: "/portal/perguntas-frequentes" },
    ],
  },
  {
    id: "transparencia",
    title: "Transparência e contas públicas",
    items: [
      { label: "Portal da Transparência", href: "/portal-transparencia" },
      { label: "Licitações e Contratos", href: "/portal/licitacoes-e-contratos" },
      { label: "Leis Municipais", href: "/portal/leis-municipais" },
      { label: "Dados Abertos (CSV)", href: "/portal/dados-abertos" },
    ],
  },
  {
    id: "certidoes",
    title: "Certidões e documentos",
    items: [
      { label: "Certidão Negativa", href: "https://gpi20.cloud.el.com.br/ServerExec/acessoBase/?idPortal=f00300e4-c405-47a6-abce-555b09f8400a", external: true },
      { label: "Diário Oficial", href: "https://ioes.dio.es.gov.br/buscanova/#/p=1&q=Divino%20de%20S%C3%A3o%20Louren%C3%A7o", external: true },
      { label: "Código de Ética dos Servidores", href: "https://pmdsl.s3.sa-east-1.amazonaws.com/diversos/Lei-1.122-de-2025-Codigo-de-etica.pdf", external: true },
    ],
  },
  {
    id: "tributos",
    title: "Tributos e empresas",
    items: [
      { label: "Alvará e IPTU", href: "https://gpi20.cloud.el.com.br/ServerExec/acessoBase/?idPortal=f00300e4-c405-47a6-abce-555b09f8400a", external: true },
      { label: "Nota Fiscal Eletrônica", href: "https://es-divinodesaolourenco-pm-nfs.cloud.el.com.br//paginas/sistema/login.jsf", external: true },
      { label: "Cadastro de Fornecedores", href: "https://forms.gle/MSEqRMo9DUhaPU4L7", external: true },
    ],
  },
  {
    id: "servidor",
    title: "Servidor municipal",
    items: [
      { label: "Contracheque PM", href: "https://servicos1.cloud.el.com.br/es-divinosaolourenco-pm/portal/login", external: true },
      { label: "Contracheque Saúde", href: "https://servicos.cloud.el.com.br/es-divinosaolourenco-saude/portal/", external: true },
      { label: "Contracheque Assistência Social", href: "https://servicos.cloud.el.com.br/es-divinosaolourenco-social/portal/", external: true },
      { label: "Portal do Servidor", href: "https://servicos1.cloud.el.com.br/es-divinosaolourenco-pm/portal/login", external: true },
    ],
  },
];

export default function ServicosPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
      <PortalBreadcrumb current="Todos Serviços" />
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Todos os serviços</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Acesso rápido aos serviços e sistemas utilizados pela Prefeitura Municipal de Divino de São Lourenço.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {GROUPS.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-[#0e4c7e]">{group.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {group.items.map((item) => (
                <li key={item.label}>
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noreferrer" className="font-medium text-slate-700 hover:text-[#0e4c7e] hover:underline">{item.label}</a>
                  ) : (
                    <Link href={item.href} className="font-medium text-slate-700 hover:text-[#0e4c7e] hover:underline">{item.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
