import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "Acesso à Informação | Prefeitura de Divino de São Lourenço",
  description: "Serviço de Informação ao Cidadão (e-SIC) da Prefeitura Municipal de Divino de São Lourenço.",
};

export default function AcessoInformacaoPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-9 sm:px-6">
      <PortalBreadcrumb current="Acesso à Informação" />
      <p className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0e4c7e]"><FileText className="size-4" aria-hidden="true" /> Lei nº 12.527/2011</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Acesso à Informação (e-SIC)</h1>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        O Serviço de Informação ao Cidadão recebe pedidos de acesso a informações públicas produzidas ou custodiadas
        pela Prefeitura Municipal de Divino de São Lourenço, nos termos da Lei de Acesso à Informação.
      </p>
      <div className="mt-6 grid gap-3">
        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Como pedir informação</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
            <li>Registre seu pedido pelo <Link href="/portal/contato" className="font-bold text-[#0e4c7e] hover:underline">Fale Conosco</Link>, identificando a informação desejada.</li>
            <li>Acompanhe a resposta pelo e-mail informado e pelos canais oficiais.</li>
            <li>Consulte antes o <Link href="/portal-transparencia" className="font-bold text-[#0e4c7e] hover:underline">Portal da Transparência</Link> e os <Link href="/portal/dados-abertos" className="font-bold text-[#0e4c7e] hover:underline">Dados Abertos</Link> — a informação pode já estar publicada.</li>
          </ol>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Transparência ativa</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">Receitas, despesas, contratos, licitações e relatórios legais estão disponíveis para consulta pública e exportação em CSV, sem necessidade de cadastro.</p>
          <Link href="/portal-transparencia" className="mt-3 inline-block rounded-md bg-[#00843d] px-4 py-2 text-sm font-bold text-white hover:bg-[#006e33]">Abrir Portal da Transparência</Link>
        </article>
      </div>
    </main>
  );
}
