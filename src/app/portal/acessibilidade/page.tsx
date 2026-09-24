import type { Metadata } from "next";
import Link from "next/link";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "Acessibilidade | Prefeitura de Divino de São Lourenço",
  description: "Recursos de acessibilidade do portal oficial da Prefeitura Municipal de Divino de São Lourenço.",
};

export default function AcessibilidadePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-9 sm:px-6">
      <PortalBreadcrumb current="Acessibilidade" />
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Acessibilidade</h1>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        O portal oficial da Prefeitura Municipal de Divino de São Lourenço adota recursos de acessibilidade para ampliar
        o acesso às informações públicas por todas as pessoas.
      </p>
      <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="font-bold text-slate-900">Barra superior de acessibilidade</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>A+</strong> — aumenta o tamanho da fonte do portal.</li>
            <li><strong>A-</strong> — diminui o tamanho da fonte do portal.</li>
            <li><strong>Aa</strong> — restaura o tamanho padrão da fonte.</li>
            <li><strong>Contraste</strong> — ativa o modo de alto contraste (fundo preto, texto branco e links em amarelo).</li>
          </ul>
          <p className="mt-2">As preferências são salvas no seu navegador e mantidas entre visitas.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-900">Leitores de tela</h2>
          <p className="mt-2">
            O portal é compatível com leitores de tela. Recomendamos o{" "}
            <a href="https://www.nvaccess.org/download/" target="_blank" rel="noreferrer" className="font-bold text-[#0e4c7e] hover:underline">NVDA — Leitor de Telas</a>,
            gratuito e de código aberto, além do atalho “Ir para o conteúdo principal” disponível no topo de todas as páginas.
          </p>
        </section>
        <section>
          <h2 className="font-bold text-slate-900">Navegação por teclado</h2>
          <p className="mt-2">Todos os menus possuem submenu acionável por teclado (Enter/Espaço) e podem ser fechados com a tecla Esc. Os formulários possuem rótulos associados aos campos.</p>
        </section>
      </div>
      <p className="mt-6 text-sm text-slate-600">
        Dúvidas sobre acessibilidade? Fale com a Prefeitura pelo <Link href="/portal/contato" className="font-bold text-[#0e4c7e] hover:underline">Fale Conosco</Link>.
      </p>
    </main>
  );
}
