"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Package, Search } from "lucide-react";

type OrdemServico = {
  id: string;
  protocolo: string;
  tipo: string;
  descricao: string;
  local: string;
  status: string;
  active: boolean;
  scheduledFor: string | null;
  completedAt: string | null;
  estimatedCost: number | null;
  department: { name: string } | null;
  targetAsset: {
    patrimonyNumber: string;
    name: string;
    realEstate: {
      municipalInsc: string | null;
      propertyType: string | null;
      streetName: string | null;
      number: string | null;
      complement: string | null;
    } | null;
  } | null;
  employees: { role: string; releasedAt: Date | null; employee: { name: string } }[];
  teams: { releasedAt: Date | null; equipe: { code: string; name: string } }[];
  materials: {
    quantityPlanned: number;
    quantityIssued: number;
    material: { code: string; name: string; unitOfMeasure: string };
  }[];
  materialMoves: {
    type: string;
    quantity: number;
    material: { code: string; name: string; unitOfMeasure: string };
  }[];
  budgetAppropriation: { code: string } | null;
  commitment: { number: string; status: string; value: number } | null;
  documents: { purpose: string; document: { title: string; documentType: string; status: string } }[];
  purchases: {
    purpose: string;
    purchaseRequest: { number: string; status: string } | null;
    purchaseProcess: { number: string; status: string } | null;
  }[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function statusClassName(status: string) {
  if (status === "Concluído") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (status === "Em Andamento") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  if (status === "Cancelado") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : null;
}

function linkedTerms(ordem: OrdemServico) {
  return [
    ordem.protocolo,
    ordem.tipo,
    ordem.descricao,
    ordem.local,
    ordem.status,
    ordem.department?.name,
    ordem.targetAsset?.name,
    ordem.targetAsset?.patrimonyNumber,
    ordem.targetAsset?.realEstate?.municipalInsc,
    ordem.targetAsset?.realEstate?.streetName,
    ...ordem.employees.map(({ employee }) => employee.name),
    ...ordem.teams.map(({ equipe }) => equipe.name),
    ...ordem.materials.map(({ material }) => material.name),
    ...ordem.materialMoves.map(({ material }) => material.name),
    ordem.budgetAppropriation?.code,
    ordem.commitment?.number,
    ...ordem.documents.map(({ document }) => document.title),
    ...ordem.purchases.flatMap(({ purchaseRequest, purchaseProcess }) => [purchaseRequest?.number, purchaseProcess?.number]),
  ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
}

function Relation({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">{children}</dd></div>;
}

export function OrdensServicoClient({ ordens }: { ordens: OrdemServico[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const statuses = Array.from(new Set(ordens.map((ordem) => ordem.status))).sort();
  const filteredOrdens = ordens.filter((ordem) => {
    const matchesSearch = !normalizedSearch || linkedTerms(ordem).includes(normalizedSearch);
    const matchesStatus = statusFilter === "all" || ordem.status === statusFilter;
    const matchesActive = activeFilter === "all" || ordem.active === (activeFilter === "active");
    return matchesSearch && matchesStatus && matchesActive;
  });

  return (
    <main className="space-y-2">
      <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Operação de campo</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Ordens de Serviço</h1>
          <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">Acompanhe a execução das ordens e suas vinculações operacionais, patrimoniais, financeiras, de materiais, documentos e compras.</p>
        </div>
        <Link href="/obras/servicos-urbanos" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700">
          Gerenciar ordem base
          <ExternalLink className="h-4 w-4" />
        </Link>
      </header>

      <section className="overflow-hidden rounded-md border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-label="Ordens de serviço">
        <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Buscar protocolo, local ou entidade vinculada..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:w-auto">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por status" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="all">Todos os status</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)} aria-label="Filtrar por situação" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="all">Ativas e inativas</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filteredOrdens.map((ordem) => {
            const realEstate = ordem.targetAsset?.realEstate;
            const address = realEstate && [realEstate.streetName, realEstate.number, realEstate.complement].filter(Boolean).join(", ");
            const activeEmployees = ordem.employees.filter(({ releasedAt }) => !releasedAt);
            const activeTeams = ordem.teams.filter(({ releasedAt }) => !releasedAt);

            return (
              <article key={ordem.id} className="p-4 md:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">{ordem.protocolo}</span>
                      <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${statusClassName(ordem.status)}`}>{ordem.status}</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ordem.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>{ordem.active ? "Ativa" : "Inativa"}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{ordem.tipo}</h2>
                    <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{ordem.descricao}</p>
                  </div>
                  <div className="grid shrink-0 gap-1 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-1 xl:text-right">
                    <span>Local: <strong className="font-medium text-slate-900 dark:text-white">{ordem.local}</strong></span>
                    {formatDate(ordem.scheduledFor) && <span>Programada: <strong className="font-medium text-slate-900 dark:text-white">{formatDate(ordem.scheduledFor)}</strong></span>}
                    {formatDate(ordem.completedAt) && <span>Concluída: <strong className="font-medium text-slate-900 dark:text-white">{formatDate(ordem.completedAt)}</strong></span>}
                    {ordem.estimatedCost !== null && <span>Estimativa: <strong className="font-medium text-slate-900 dark:text-white">{currencyFormatter.format(ordem.estimatedCost)}</strong></span>}
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Relation label="Setor responsável">{ordem.department?.name ?? "Não vinculado"}</Relation>
                  <Relation label="Patrimônio de destino">
                    {ordem.targetAsset ? <><strong className="font-medium">{ordem.targetAsset.name}</strong><span className="block text-xs text-slate-500">Tombamento {ordem.targetAsset.patrimonyNumber}</span></> : "Não vinculado"}
                  </Relation>
                  <Relation label="Imóvel do patrimônio">
                    {realEstate ? <><strong className="font-medium">{realEstate.municipalInsc ? `Inscrição ${realEstate.municipalInsc}` : realEstate.propertyType ?? "Imóvel vinculado"}</strong>{address && <span className="block text-xs text-slate-500">{address}</span>}</> : "Sem imóvel vinculado"}
                  </Relation>
                  <Relation label="Equipe responsável">
                    {activeTeams.length ? activeTeams.map(({ equipe }) => <span key={equipe.code} className="mr-1 inline-block rounded bg-slate-200 px-1.5 py-0.5 text-xs dark:bg-slate-700">{equipe.name}</span>) : "Nenhuma equipe ativa"}
                  </Relation>
                  <Relation label="Servidores designados">
                    {activeEmployees.length ? activeEmployees.map(({ employee, role }) => <span key={employee.name} className="mr-1 inline-block text-xs">{employee.name} ({role})</span>) : "Nenhum servidor ativo"}
                  </Relation>
                  <Relation label="Financeiro">
                    {ordem.budgetAppropriation || ordem.commitment ? <>{ordem.budgetAppropriation && <span className="block text-xs">Dotação: {ordem.budgetAppropriation.code}</span>}{ordem.commitment && <span className="block text-xs">Empenho {ordem.commitment.number} ({ordem.commitment.status})</span>}</> : "Sem dotação ou empenho"}
                  </Relation>
                  <Relation label="Materiais planejados">
                    {ordem.materials.length ? ordem.materials.map(({ material, quantityPlanned, quantityIssued }) => <span key={material.code} className="block text-xs">{material.name}: {numberFormatter.format(quantityIssued)}/{numberFormatter.format(quantityPlanned)} {material.unitOfMeasure} emitidos</span>) : "Nenhum material planejado"}
                  </Relation>
                  <Relation label="Movimentações de material">
                    {ordem.materialMoves.length ? ordem.materialMoves.map(({ material, type, quantity }, index) => <span key={`${material.code}-${index}`} className="block text-xs">{type}: {numberFormatter.format(quantity)} {material.unitOfMeasure} de {material.name}</span>) : "Nenhuma movimentação"}
                  </Relation>
                  <Relation label="Documentos vinculados">
                    {ordem.documents.length ? ordem.documents.map(({ document, purpose }) => <span key={`${document.title}-${purpose}`} className="block text-xs">{document.title} ({purpose}, {document.status})</span>) : "Nenhum documento"}
                  </Relation>
                  <Relation label="Compras relacionadas">
                    {ordem.purchases.length ? ordem.purchases.map(({ purchaseRequest, purchaseProcess, purpose }, index) => <span key={`${purchaseRequest?.number ?? purchaseProcess?.number}-${index}`} className="block text-xs">{purchaseRequest ? `Solicitação ${purchaseRequest.number}` : `Processo ${purchaseProcess?.number}`} ({purpose})</span>) : "Nenhuma compra vinculada"}
                  </Relation>
                </dl>
              </article>
            );
          })}
          {filteredOrdens.length === 0 && <div className="px-6 py-14 text-center"><Package className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-medium text-slate-700 dark:text-slate-300">Nenhuma ordem encontrada</p><p className="mt-1 text-sm text-slate-500">Ajuste os filtros ou gerencie as ordens base em Serviços Urbanos.</p></div>}
        </div>
      </section>
    </main>
  );
}
