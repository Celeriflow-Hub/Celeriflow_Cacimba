"use client";

import { useState } from "react";
import {
  Building2,
  CalendarDays,
  FileText,
  Lightbulb,
  MapPin,
  Package,
  Search,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react";

type IluminacaoServico = {
  id: string;
  protocolo: string;
  descricao: string;
  local: string;
  status: string;
  active: boolean;
  scheduledFor: Date | null;
  completedAt: Date | null;
  estimatedCost: number | null;
  department: { name: string } | null;
  targetAsset: {
    patrimonyNumber: string;
    name: string;
    status: string;
    realEstate: {
      municipalInsc: string | null;
      registration: string | null;
      streetName: string | null;
      number: string | null;
    } | null;
  } | null;
  budgetAppropriation: {
    code: string;
    initialValue: number;
    updatedValue: number;
    committedValue: number;
  } | null;
  commitment: { number: string; value: number; status: string; history: string } | null;
  employees: { role: string; releasedAt: Date | null; employee: { name: string; registration: string | null; isActive: boolean } }[];
  teams: { releasedAt: Date | null; equipe: { code: string; name: string; isActive: boolean } }[];
  equipment: { releasedAt: Date | null; operatingHours: number | null; asset: { patrimonyNumber: string; name: string; status: string } }[];
  materials: {
    quantityPlanned: number;
    quantityIssued: number;
    unitCost: number | null;
    material: { code: string; name: string; unitOfMeasure: string };
    stock: { quantity: number; unitCost: number | null; batchNumber: string | null } | null;
  }[];
  documents: { purpose: string; document: { title: string; documentType: string; status: string } }[];
  purchases: {
    purpose: string;
    purchaseRequest: { number: string; object: string; status: string; estimatedValue: number | null } | null;
    purchaseProcess: { number: string; object: string; status: string; estimatedValue: number | null } | null;
  }[];
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function statusClassName(status: string) {
  if (status === "Concluído") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (status === "Em Andamento") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  if (status === "Cancelado") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200";
}

function formatDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "Não programado";
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-slate-100">{children}</dd></div>;
}

function ResourceSection({ icon: Icon, title, count, children }: { icon: typeof Users; title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"><Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />{title}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">{count}</span>
      </div>
      {children}
    </section>
  );
}

function EmptyReference({ children = "Nenhum vínculo registrado." }: { children?: string }) {
  return <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>;
}

export function IluminacaoEnergiaClient({ servicos }: { servicos: IluminacaoServico[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [active, setActive] = useState("Todos");
  const statuses = Array.from(new Set(servicos.map((servico) => servico.status))).sort();
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const filteredServicos = servicos.filter((servico) => {
    const references = [
      servico.protocolo,
      servico.descricao,
      servico.local,
      servico.department?.name,
      servico.targetAsset?.patrimonyNumber,
      servico.targetAsset?.name,
      servico.budgetAppropriation?.code,
      servico.commitment?.number,
      ...servico.employees.map(({ employee }) => employee.name),
      ...servico.teams.map(({ equipe }) => `${equipe.code} ${equipe.name}`),
      ...servico.materials.map(({ material }) => `${material.code} ${material.name}`),
      ...servico.documents.map(({ document }) => document.title),
      ...servico.purchases.flatMap(({ purchaseRequest, purchaseProcess }) => [purchaseRequest?.number, purchaseProcess?.number]),
    ];
    const matchesSearch = !query || references.some((reference) => reference?.toLocaleLowerCase("pt-BR").includes(query));
    return matchesSearch && (status === "Todos" || servico.status === status) && (active === "Todos" || servico.active === (active === "Ativos"));
  });

  return (
    <main className="space-y-2">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400"><Lightbulb className="h-5 w-5" /><span className="text-sm font-semibold">Obras</span></div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Iluminação e Energia</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Acompanhamento operacional das ordens de iluminação pública e suas referências integradas.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"><strong>{servicos.length}</strong> {servicos.length === 1 ? "ordem encontrada" : "ordens encontradas"}</div>
      </header>

      <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:flex-row md:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Buscar protocolo, local ou referência..." className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" /></div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:w-auto"><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por status" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"><option>Todos</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select><select value={active} onChange={(event) => setActive(event.target.value)} aria-label="Filtrar por situação" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"><option>Todos</option><option>Ativos</option><option>Inativos</option></select></div>
      </div>

      <div className="space-y-3">
        {filteredServicos.map((servico) => {
          const imovel = servico.targetAsset?.realEstate;
          const enderecoImovel = imovel ? [imovel.streetName, imovel.number].filter(Boolean).join(", ") : "";
          return (
            <article key={servico.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70 md:p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">{servico.protocolo}</span><span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClassName(servico.status)}`}>{servico.status}</span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${servico.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>{servico.active ? "Ativo" : "Inativo"}</span></div><h2 className="text-lg font-bold text-slate-900 dark:text-white">{servico.descricao}</h2><p className="mt-2 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{servico.local}</p></div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><CalendarDays className="h-4 w-4" /><span>Programado: {formatDate(servico.scheduledFor)}</span></div>
                </div>
              </div>

              <div className="space-y-5 p-4 md:p-6">
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><InfoBlock label="Departamento">{servico.department?.name ?? "Não vinculado"}</InfoBlock><InfoBlock label="Custo estimado">{currency.format(servico.estimatedCost ?? 0)}</InfoBlock><InfoBlock label="Conclusão">{formatDate(servico.completedAt)}</InfoBlock><InfoBlock label="Bem alvo">{servico.targetAsset ? `${servico.targetAsset.patrimonyNumber} - ${servico.targetAsset.name}` : "Não vinculado"}</InfoBlock></dl>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"><Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />Patrimônio e imóvel</h3>{servico.targetAsset ? <dl className="grid gap-3 sm:grid-cols-2"><InfoBlock label="Bem patrimonial">{servico.targetAsset.patrimonyNumber} - {servico.targetAsset.name}</InfoBlock><InfoBlock label="Situação do bem">{servico.targetAsset.status}</InfoBlock><InfoBlock label="Inscrição municipal">{imovel?.municipalInsc ?? "Não informado"}</InfoBlock><InfoBlock label="Imóvel">{enderecoImovel || imovel?.registration || "Não vinculado"}</InfoBlock></dl> : <EmptyReference />}</section>
                  <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"><FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />Financeiro</h3><dl className="grid gap-3 sm:grid-cols-2"><InfoBlock label="Dotação">{servico.budgetAppropriation?.code ?? "Não vinculada"}</InfoBlock><InfoBlock label="Valor inicial">{currency.format(servico.budgetAppropriation?.initialValue ?? 0)}</InfoBlock><InfoBlock label="Valor atualizado">{currency.format(servico.budgetAppropriation?.updatedValue ?? 0)}</InfoBlock><InfoBlock label="Dotação empenhada">{currency.format(servico.budgetAppropriation?.committedValue ?? 0)}</InfoBlock><InfoBlock label="Empenho">{servico.commitment ? `${servico.commitment.number} (${servico.commitment.status})` : "Não vinculado"}</InfoBlock><InfoBlock label="Valor do empenho">{currency.format(servico.commitment?.value ?? 0)}</InfoBlock></dl>{servico.commitment && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Histórico: {servico.commitment.history}</p>}</section>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <ResourceSection icon={Users} title="Servidores" count={servico.employees.length}>{servico.employees.length ? <ul className="space-y-2">{servico.employees.map(({ employee, role, releasedAt }) => <li key={employee.name} className="text-sm text-slate-700 dark:text-slate-300"><strong>{employee.name}</strong><span className="text-slate-500 dark:text-slate-400"> · {employee.registration ?? "Matrícula não informada"} · {role} · {releasedAt ? "Liberado" : employee.isActive ? "Ativo" : "Inativo"}</span></li>)}</ul> : <EmptyReference />}</ResourceSection>
                  <ResourceSection icon={Users} title="Equipes" count={servico.teams.length}>{servico.teams.length ? <ul className="space-y-2">{servico.teams.map(({ equipe, releasedAt }) => <li key={equipe.code} className="text-sm text-slate-700 dark:text-slate-300"><strong>{equipe.code}</strong><span className="text-slate-500 dark:text-slate-400"> · {equipe.name} · {releasedAt ? "Liberada" : equipe.isActive ? "Ativa" : "Inativa"}</span></li>)}</ul> : <EmptyReference />}</ResourceSection>
                  <ResourceSection icon={Wrench} title="Equipamentos" count={servico.equipment.length}>{servico.equipment.length ? <ul className="space-y-2">{servico.equipment.map(({ asset, operatingHours, releasedAt }) => <li key={asset.patrimonyNumber} className="text-sm text-slate-700 dark:text-slate-300"><strong>{asset.patrimonyNumber}</strong><span className="text-slate-500 dark:text-slate-400"> · {asset.name} · {asset.status} · {number.format(operatingHours ?? 0)} h · {releasedAt ? "Liberado" : "Em uso"}</span></li>)}</ul> : <EmptyReference />}</ResourceSection>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <ResourceSection icon={Package} title="Materiais" count={servico.materials.length}>{servico.materials.length ? <ul className="space-y-3">{servico.materials.map(({ material, stock, quantityPlanned, quantityIssued, unitCost }) => <li key={material.code} className="text-sm text-slate-700 dark:text-slate-300"><strong>{material.code} · {material.name}</strong><p className="text-slate-500 dark:text-slate-400">Planejado: {number.format(quantityPlanned)} {material.unitOfMeasure} · Baixado: {number.format(quantityIssued)} {material.unitOfMeasure} · Custo: {currency.format(unitCost ?? 0)}</p><p className="text-slate-500 dark:text-slate-400">Estoque: {stock ? `${number.format(stock.quantity)} ${material.unitOfMeasure}${stock.batchNumber ? ` · Lote ${stock.batchNumber}` : ""} · ${currency.format(stock.unitCost ?? 0)}` : "Não vinculado"}</p></li>)}</ul> : <EmptyReference />}</ResourceSection>
                  <ResourceSection icon={FileText} title="Documentos" count={servico.documents.length}>{servico.documents.length ? <ul className="space-y-2">{servico.documents.map(({ document, purpose }) => <li key={document.title} className="text-sm text-slate-700 dark:text-slate-300"><strong>{document.title}</strong><span className="text-slate-500 dark:text-slate-400"> · {document.documentType} · {document.status} · {purpose}</span></li>)}</ul> : <EmptyReference />}</ResourceSection>
                  <ResourceSection icon={ShoppingCart} title="Compras" count={servico.purchases.length}>{servico.purchases.length ? <ul className="space-y-3">{servico.purchases.map(({ purchaseRequest, purchaseProcess, purpose }, index) => <li key={`${purchaseRequest?.number ?? ""}-${purchaseProcess?.number ?? ""}-${index}`} className="text-sm text-slate-700 dark:text-slate-300">{purchaseRequest && <p><strong>Solicitação {purchaseRequest.number}</strong><span className="text-slate-500 dark:text-slate-400"> · {purchaseRequest.status} · {currency.format(purchaseRequest.estimatedValue ?? 0)}</span><span className="block text-slate-500 dark:text-slate-400">{purchaseRequest.object}</span></p>}{purchaseProcess && <p className="mt-2"><strong>Processo {purchaseProcess.number}</strong><span className="text-slate-500 dark:text-slate-400"> · {purchaseProcess.status} · {currency.format(purchaseProcess.estimatedValue ?? 0)}</span><span className="block text-slate-500 dark:text-slate-400">{purchaseProcess.object}</span></p>}<p className="mt-1 text-slate-500 dark:text-slate-400">Finalidade: {purpose}</p></li>)}</ul> : <EmptyReference />}</ResourceSection>
                </div>
              </div>
            </article>
          );
        })}
        {filteredServicos.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">Nenhuma ordem de iluminação encontrada para os filtros selecionados.</div>}
      </div>
    </main>
  );
}
