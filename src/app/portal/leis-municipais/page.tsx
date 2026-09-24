import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "Leis Municipais | Prefeitura de Divino de São Lourenço",
  description: "Leis, decretos e atos normativos do município de Divino de São Lourenço.",
};

export default function LeisMunicipaisPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-9 sm:px-6">
      <PortalBreadcrumb current="Leis Municipais" />
      <p className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0e4c7e]"><Scale className="size-4" aria-hidden="true" /> Legislação compilada</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Leis Municipais</h1>
      <p className="mt-3 text-sm leading-7 text-slate-700">A legislação municipal compilada está disponível no Sistema de Processos Legislativos (SPL), com leis, decretos e atos normativos.</p>
      <a href="https://divinodesaolourenco.legonline.com.br" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#0e4c7e] px-5 py-3 text-sm font-bold text-white hover:bg-[#0a3a5f]">
        <Scale className="size-4" aria-hidden="true" /> Abrir SPL — Leis e atos compilados
      </a>
      <div className="mt-6 grid gap-3">
        <section id="decretos" className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Decretos e portarias</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Decretos e portarias vigentes são publicados na legislação compilada do SPL e nos canais oficiais da Prefeitura.</p>
        </section>
        <section id="lei-organica" className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Lei Orgânica Municipal</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">A Lei Orgânica do município encontra-se disponível para consulta na coletânea oficial do SPL.</p>
          <a href="https://divinodesaolourenco.legonline.com.br" target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-[#0e4c7e] hover:underline">Consultar Lei Orgânica no SPL</a>
        </section>
      </div>
    </main>
  );
}
