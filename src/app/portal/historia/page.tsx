import type { Metadata } from "next";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "História | Prefeitura de Divino de São Lourenço",
  description: "História do município de Divino de São Lourenço, Espírito Santo.",
};

export default function HistoriaPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-9 sm:px-6">
      <PortalBreadcrumb current="História" />
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-[#0e4c7e]">O município</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">História de Divino de São Lourenço</h1>
      <div className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700 sm:p-8">
        <p>
          Divino de São Lourenço é um município capixaba localizado na região do Caparaó, marcado pela agricultura familiar,
          pelo café de montanha e pelas paisagens da Mata Atlântica. A formação do município está ligada à ocupação do interior
          do Espírito Santo e à devoção a São Lourenço, padroeiro da comunidade.
        </p>
        <p>
          Ao longo de sua trajetória, o município consolidou sua sede administrativa e seus distritos rurais, com economia baseada
          na cafeicultura, na pecuária e, mais recentemente, no turismo de natureza e no agroturismo.
        </p>
        <section id="sede" aria-labelledby="sede-titulo" className="rounded-lg bg-slate-50 p-5">
          <h2 id="sede-titulo" className="font-bold text-slate-900">Sede do município</h2>
          <p className="mt-2">
            A sede concentra o Paço Municipal, na Praça Dez de Agosto, nº 10 — Centro, onde funcionam o Gabinete do Prefeito,
            as secretarias e os serviços de atendimento ao cidadão. O endereço oficial é Praça Dez de Agosto, 10 — Centro,
            Divino de São Lourenço/ES, CEP 29590-000.
          </p>
        </section>
      </div>
    </main>
  );
}
