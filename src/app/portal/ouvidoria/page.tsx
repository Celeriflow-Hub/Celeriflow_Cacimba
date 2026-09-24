import type { Metadata } from "next";
import Link from "next/link";
import { Headset } from "lucide-react";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "Ouvidoria | Prefeitura de Divino de São Lourenço",
  description: "Ouvidoria municipal da Prefeitura de Divino de São Lourenço — canais de manifestação do cidadão.",
};

const CHANNELS = [
  { title: "Denúncias", description: "Comunicação de irregularidades ou atos ilícitos.", href: "/portal/contato" },
  { title: "Reclamações", description: "Insatisfação com serviços ou atendimento.", href: "/portal/contato" },
  { title: "Sugestões", description: "Propostas de melhoria dos serviços públicos.", href: "/portal/contato" },
  { title: "Solicitações e informações", description: "Pedidos de informação pública via e-SIC.", href: "/portal/acesso-informacao" },
];

export default function OuvidoriaPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-9 sm:px-6">
      <PortalBreadcrumb current="Ouvidoria" />
      <p className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0e4c7e]"><Headset className="size-4" aria-hidden="true" /> Participação e controle social</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Ouvidoria municipal</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        A Ouvidoria é o canal oficial de escuta do cidadão da Prefeitura Municipal de Divino de São Lourenço.
        Registre manifestações pelo Fale Conosco institucional e acompanhe os relatórios de atendimento.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {CHANNELS.map((channel) => (
          <article key={channel.title} className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">{channel.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{channel.description}</p>
            <Link href={channel.href} className="mt-3 inline-block text-sm font-bold text-[#0e4c7e] hover:underline">Acessar canal</Link>
          </article>
        ))}
      </div>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
        <h2 className="font-bold text-slate-900">Como acompanhar</h2>
        <p className="mt-2">As manifestações recebidas pelo Fale Conosco são encaminhadas ao setor responsável. Consulte também as <Link href="/portal/noticias" className="font-bold text-[#0e4c7e] hover:underline">notícias oficiais</Link> e o <Link href="/portal-transparencia" className="font-bold text-[#0e4c7e] hover:underline">Portal da Transparência</Link> para acompanhar as ações da administração.</p>
      </div>
    </main>
  );
}
