import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPublicBiddings, getPublicContracts } from "@/lib/transparencia/portal-public";
import { PortalBreadcrumb } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "Licitações e Contratos | Prefeitura de Divino de São Lourenço",
  description: "Licitações e contratos publicados pela Prefeitura Municipal de Divino de São Lourenço.",
};

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(value) : "-";
}

export default async function LicitacoesContratosPage() {
  const [biddings, contracts] = await Promise.all([getPublicBiddings(prisma), getPublicContracts(prisma)]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
      <PortalBreadcrumb current="Licitações e Contratos" />
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Licitações e Contratos</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Publicações oficiais de licitações e contratos. Dados ao vivo do <Link href="/portal-transparencia" className="font-bold text-[#0e4c7e] hover:underline">Portal da Transparência</Link>, com exportação em CSV.
      </p>

      <section id="licitacoes" aria-labelledby="licitacoes-titulo" className="mt-6 scroll-mt-28 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 id="licitacoes-titulo" className="text-lg font-bold">Licitações publicadas</h2>
          <a href="/api/transparencia/licitacoes?format=csv" className="text-sm font-bold text-[#0e4c7e] hover:underline">Exportar CSV</a>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Licitação</th><th className="px-4 py-3">Processo / objeto</th><th className="px-4 py-3">Sessão</th></tr></thead>
            <tbody className="divide-y divide-slate-200">
              {biddings.map((bidding) => (
                <tr key={bidding.number}>
                  <td className="px-4 py-3 font-medium">{bidding.number}<span className="block text-xs font-normal text-slate-500">{bidding.modality} · {bidding.status}</span></td>
                  <td className="px-4 py-3">{bidding.processNumber}<span className="block max-w-xs truncate text-xs text-slate-500" title={bidding.object}>{bidding.object}</span></td>
                  <td className="px-4 py-3">{formatDate(bidding.sessionDate)}</td>
                </tr>
              ))}
              {!biddings.length && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">Nenhuma licitação publicada.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section id="contratos" aria-labelledby="contratos-titulo" className="mt-6 scroll-mt-28 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 id="contratos-titulo" className="text-lg font-bold">Contratos</h2>
          <a href="/api/transparencia/contratos?format=csv" className="text-sm font-bold text-[#0e4c7e] hover:underline">Exportar CSV</a>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Contrato</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Vigência</th><th className="px-4 py-3 text-right">Valor atualizado</th></tr></thead>
            <tbody className="divide-y divide-slate-200">
              {contracts.map((contract) => (
                <tr key={contract.number}>
                  <td className="px-4 py-3 font-medium">{contract.number}<span className="block text-xs font-normal text-slate-500">{contract.status}</span></td>
                  <td className="px-4 py-3">{contract.supplier.name}<span className="block text-xs text-slate-500">{contract.supplier.documentMasked}</span></td>
                  <td className="px-4 py-3">{formatDate(contract.startDate)}<span className="block text-xs text-slate-500">até {formatDate(contract.endDate)}</span></td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(contract.updatedValue)}</td>
                </tr>
              ))}
              {!contracts.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Nenhum contrato publicável.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
