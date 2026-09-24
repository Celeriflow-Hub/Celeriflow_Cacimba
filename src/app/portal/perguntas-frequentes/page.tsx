import type { Metadata } from "next";
import Link from "next/link";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "Perguntas Frequentes | Prefeitura de Divino de São Lourenço",
  description: "Perguntas frequentes sobre serviços e canais da Prefeitura Municipal de Divino de São Lourenço.",
};

const FAQS = [
  { q: "Como acompanho as despesas e receitas do município?", a: "Pelo Portal da Transparência, com filtros por exercício e exportação em CSV, além da seção Dados Abertos." },
  { q: "Como solicito uma informação pública?", a: "Pelo Acesso à Informação (e-SIC). Registre o pedido pelo Fale Conosco e acompanhe a resposta." },
  { q: "Como registro uma reclamação ou denúncia?", a: "Pela Ouvidoria municipal, escolhendo o tipo de manifestação mais adequado." },
  { q: "Onde encontro licitações e contratos?", a: "Na página Licitações e Contratos, com dados ao vivo do Portal da Transparência." },
  { q: "Onde consulto leis municipais?", a: "No Sistema de Processos Legislativos (SPL), com a legislação compilada do município." },
];

export default function PerguntasFrequentesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-9 sm:px-6">
      <PortalBreadcrumb current="Perguntas Frequentes" />
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Perguntas Frequentes</h1>
      <div className="mt-6 space-y-3">
        {FAQS.map((faq) => (
          <details key={faq.q} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <summary className="cursor-pointer text-sm font-bold text-slate-900">{faq.q}</summary>
            <p className="mt-2 text-sm leading-6 text-slate-600">{faq.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-600">
        Não encontrou sua dúvida? Acesse o <Link href="/portal/contato" className="font-bold text-[#0e4c7e] hover:underline">Fale Conosco</Link>.
      </p>
    </main>
  );
}
