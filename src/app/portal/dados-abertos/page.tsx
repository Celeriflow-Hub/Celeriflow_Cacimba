import type { Metadata } from "next";
import Link from "next/link";
import { Database, Download } from "lucide-react";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "Dados Abertos | Prefeitura de Divino de São Lourenço",
  description: "Dados abertos do Portal da Transparência da Prefeitura Municipal de Divino de São Lourenço, com exportação em CSV.",
};

const DATASETS = [
  { title: "Despesas — execução orçamentária", href: "/api/transparencia/despesas?format=csv", description: "Empenhos, liquidações e pagamentos com filtros por exercício, unidade e fonte." },
  { title: "Receitas — arrecadação", href: "/api/transparencia/receitas?format=csv", description: "Receitas lançadas e arrecadadas por classificação e natureza." },
  { title: "Contratos", href: "/api/transparencia/contratos?format=csv", description: "Contratos vigentes e encerrados, com fornecedor e vigência." },
  { title: "Licitações", href: "/api/transparencia/licitacoes?format=csv", description: "Certames publicados, com modalidade, processo e sessão." },
  { title: "Relatórios legais", href: "/portal-transparencia", description: "Snapshots versionados em CSV na seção Relatórios legais do Portal da Transparência." },
];

export default function DadosAbertosPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-9 sm:px-6">
      <PortalBreadcrumb current="Dados Abertos" />
      <p className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0e4c7e]"><Database className="size-4" aria-hidden="true" /> Transparência e controle social</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Dados Abertos</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Conjuntos de dados publicados pelo Portal da Transparência da Prefeitura Municipal de Divino de São Lourenço.
        Os arquivos utilizam o formato CSV e refletem os mesmos filtros da consulta pública, sem exposição de dados pessoais.
      </p>
      <div className="mt-6 grid gap-3">
        {DATASETS.map((item) => (
          <article key={item.title} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4">
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            </div>
            <a href={item.href} className="inline-flex items-center gap-2 rounded-md bg-[#00843d] px-4 py-2 text-sm font-bold text-white hover:bg-[#006e33]">
              <Download className="size-4" aria-hidden="true" /> Baixar CSV
            </a>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-600">
        Para consulta interativa, acesse o <Link href="/portal-transparencia" className="font-bold text-[#0e4c7e] hover:underline">Portal da Transparência</Link>.
      </p>
    </main>
  );
}
