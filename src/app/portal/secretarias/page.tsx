import type { Metadata } from "next";
import Link from "next/link";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "Secretarias | Prefeitura de Divino de São Lourenço",
  description: "Secretarias municipais da Prefeitura de Divino de São Lourenço.",
};

const SECRETARIAS = [
  { id: "saude", name: "Secretaria de Saúde", description: "Atenção básica, vigilância em saúde e Estratégias de Saúde da Família." },
  { id: "educacao", name: "Secretaria de Educação", description: "Rede municipal de ensino, magistério e programas educacionais." },
  { id: "assistencia-social", name: "Secretaria de Assistência Social", description: "Proteção social, benefícios e acompanhamento das famílias." },
  { id: "administracao", name: "Secretaria de Administração", description: "Gestão de pessoas, patrimônio, protocolos e atendimento." },
  { id: "financas", name: "Secretaria de Finanças", description: "Tributos, arrecadação, contabilidade e execução orçamentária." },
  { id: "obras", name: "Secretaria de Obras e Transportes", description: "Obras públicas, manutenção viária e frota municipal." },
  { id: "agricultura", name: "Secretaria de Agricultura", description: "Apoio ao produtor rural, café de montanha e agroturismo." },
  { id: "meio-ambiente", name: "Secretaria de Meio Ambiente", description: "Licenciamento, Mata Atlântica e saneamento básico." },
  { id: "cultura", name: "Secretaria de Cultura", description: "Patrimônio cultural, eventos e ações comunitárias." },
  { id: "esportes", name: "Secretaria de Esportes", description: "Esporte educacional, lazer e eventos esportivos." },
  { id: "turismo", name: "Secretaria de Turismo", description: "Turismo de natureza, Caparaó e desenvolvimento local." },
  { id: "planejamento", name: "Secretaria de Planejamento", description: "Planejamento, PPA, LDO, LOA e controle interno." },
  { id: "gabinete", name: "Chefe do Gabinete do Prefeito", description: "Assessoramento direto ao Prefeito e articulação institucional." },
  { id: "controle-interno", name: "Controle Interno", description: "Auditoria, transparência e integridade administrativa." },
];

export default function SecretariasPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
      <PortalBreadcrumb current="Secretarias" />
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Secretarias municipais</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Estrutura administrativa da Prefeitura Municipal de Divino de São Lourenço. Para atendimento, utilize o <Link href="/portal/contato" className="font-bold text-[#0e4c7e] hover:underline">Fale Conosco</Link> ou a <Link href="/portal/ouvidoria" className="font-bold text-[#0e4c7e] hover:underline">Ouvidoria</Link>.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SECRETARIAS.map((item) => (
          <article key={item.id} id={item.id} className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">{item.name}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
