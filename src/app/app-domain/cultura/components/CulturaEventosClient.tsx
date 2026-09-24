"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { CalendarDays, ExternalLink, FileText, MapPin, Search, UserRound } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

type Evento = {
  id: string;
  nome: string;
  tipo: string;
  data: string;
  local: string | null;
  publicoAlvo: string | null;
  status: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  space: {
    id: string;
    nome: string;
    tipo: string;
    endereco: string | null;
    capacidade: number | null;
    realEstate: {
      id: string;
      municipalInsc: string | null;
      registration: string | null;
      propertyType: string | null;
      streetName: string | null;
      number: string | null;
      complement: string | null;
    } | null;
  } | null;
  responsibleEmployee: { id: string; name: string; registration: string | null } | null;
  project: {
    id: string;
    numero: string;
    nome: string;
    categoria: string;
    status: string;
    agente: { id: string; nome: string; tipo: string };
  } | null;
  reservas: {
    id: string;
    startsAt: string;
    endsAt: string;
    purpose: string;
    status: string;
    space: { id: string; nome: string };
  }[];
  documentos: {
    id: string;
    purpose: string;
    document: { id: string; title: string; documentType: string; fileUrl: string; status: string };
  }[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });

function statusClassName(status: string) {
  if (status === "Realizado") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (status === "Em Andamento") return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
  if (status === "Cancelado") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
}

function formatPeriod(evento: Evento) {
  const start = evento.startsAt ?? evento.data;
  if (!evento.endsAt) return evento.startsAt ? dateTimeFormatter.format(new Date(start)) : dateFormatter.format(new Date(start));

  const startsOnSameDay = dateFormatter.format(new Date(start)) === dateFormatter.format(new Date(evento.endsAt));
  return startsOnSameDay
    ? `${dateTimeFormatter.format(new Date(start))} - ${new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(evento.endsAt))}`
    : `${dateTimeFormatter.format(new Date(start))} a ${dateTimeFormatter.format(new Date(evento.endsAt))}`;
}

function formatReservationPeriod(startsAt: string, endsAt: string) {
  const startsOnSameDay = dateFormatter.format(new Date(startsAt)) === dateFormatter.format(new Date(endsAt));
  return startsOnSameDay
    ? `${dateTimeFormatter.format(new Date(startsAt))} - ${new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(endsAt))}`
    : `${dateTimeFormatter.format(new Date(startsAt))} a ${dateTimeFormatter.format(new Date(endsAt))}`;
}

function linkedTerms(evento: Evento) {
  return [
    evento.nome,
    evento.tipo,
    evento.status,
    evento.local,
    evento.publicoAlvo,
    evento.space?.nome,
    evento.space?.endereco,
    evento.space?.realEstate?.municipalInsc,
    evento.space?.realEstate?.registration,
    evento.space?.realEstate?.streetName,
    evento.responsibleEmployee?.name,
    evento.project?.numero,
    evento.project?.nome,
    evento.project?.agente.nome,
    ...evento.reservas.flatMap((reserva) => [reserva.purpose, reserva.status, reserva.space.nome]),
    ...evento.documentos.map(({ document }) => document.title),
  ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
}

function documentHref(fileUrl: string) {
  return fileUrl.startsWith("http") ? `/api/download?url=${encodeURIComponent(fileUrl)}` : fileUrl;
}

export function CulturaEventosClient({ eventos }: { eventos: Evento[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("pt-BR"));
  const statuses = Array.from(new Set(eventos.map((evento) => evento.status))).sort();
  const types = Array.from(new Set(eventos.map((evento) => evento.tipo))).sort();
  const filteredEventos = eventos.filter((evento) => (
    (!deferredSearch || linkedTerms(evento).includes(deferredSearch))
    && (statusFilter === "all" || evento.status === statusFilter)
    && (typeFilter === "all" || evento.tipo === typeFilter)
  ));

  return (
    <PageFrame className="space-y-3 px-1 py-1 md:px-2">
      <PageHeader title="Eventos oficiais" icon={<CalendarDays className="size-4 shrink-0 text-amber-600 dark:text-amber-300" />} className="dark:border-slate-700 dark:bg-slate-800 dark:[&>h1]:text-white" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Agenda de eventos e suas vinculações a espaços, responsáveis, projetos, reservas e documentos.</p>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Buscar evento, local, responsável ou vínculo..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:w-auto">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por status" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="all">Todos os status</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filtrar por tipo" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="all">Todos os tipos</option>
              {types.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filteredEventos.map((evento) => {
            const realEstate = evento.space?.realEstate;
            const address = realEstate && [realEstate.streetName, realEstate.number, realEstate.complement].filter(Boolean).join(", ");

            return (
              <article key={evento.id} className="p-4 md:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${statusClassName(evento.status)}`}>{evento.status}</span>
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">{evento.tipo}</span>
                      {!evento.active && <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-slate-700">Inativo</span>}
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{evento.nome}</h2>
                    {evento.publicoAlvo && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Público-alvo: {evento.publicoAlvo}</p>}
                  </div>
                  <div className="flex shrink-0 items-start gap-2 text-sm text-slate-600 dark:text-slate-300 xl:max-w-xs xl:text-right">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>{formatPeriod(evento)}</span>
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Local do evento</dt>
                    <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {evento.space ? <Link href="/cultura/gestao-cultural" className="inline-flex items-center gap-1 font-medium text-amber-700 hover:underline dark:text-amber-400"><MapPin className="h-3.5 w-3.5" />{evento.space.nome}<ExternalLink className="h-3 w-3" /></Link> : evento.local ?? "Não informado"}
                      {evento.space?.endereco && <span className="block text-xs text-slate-500">{evento.space.endereco}</span>}
                      {evento.space && (evento.space.tipo || evento.space.capacidade) && <span className="block text-xs text-slate-500">{[evento.space.tipo, evento.space.capacidade ? `capacidade ${evento.space.capacidade}` : null].filter(Boolean).join(" · ")}</span>}
                      {!evento.space && evento.local && <span className="block text-xs text-slate-500">Local informado no evento</span>}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Responsável</dt>
                    <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {evento.responsibleEmployee ? <Link href="/administracao/servidores" className="inline-flex items-center gap-1 font-medium text-amber-700 hover:underline dark:text-amber-400"><UserRound className="h-3.5 w-3.5" />{evento.responsibleEmployee.name}<ExternalLink className="h-3 w-3" /></Link> : "Não vinculado"}
                      {evento.responsibleEmployee?.registration && <span className="block text-xs text-slate-500">Matrícula {evento.responsibleEmployee.registration}</span>}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Projeto e agente</dt>
                    <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {evento.project ? <Link href="/cultura/fomento-projetos" className="font-medium text-amber-700 hover:underline dark:text-amber-400">{evento.project.numero} · {evento.project.nome}<ExternalLink className="ml-1 inline h-3 w-3" /></Link> : "Sem projeto vinculado"}
                      {evento.project && <span className="block text-xs text-slate-500">{evento.project.agente.nome} · {evento.project.status}</span>}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Imóvel do espaço</dt>
                    <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {realEstate ? <Link href="/cadastros/imoveis" className="font-medium text-amber-700 hover:underline dark:text-amber-400">{realEstate.municipalInsc ? `Inscrição ${realEstate.municipalInsc}` : realEstate.registration ? `Matrícula ${realEstate.registration}` : realEstate.propertyType ?? "Imóvel vinculado"}<ExternalLink className="ml-1 inline h-3 w-3" /></Link> : "Sem imóvel vinculado"}
                      {address && <span className="block text-xs text-slate-500">{address}</span>}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Reservas vinculadas</dt>
                    <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {evento.reservas.length ? evento.reservas.map((reserva) => <Link key={reserva.id} href="/cultura/espacos-reservas" className="block text-xs text-amber-700 hover:underline dark:text-amber-400">{reserva.purpose} · {reserva.space.nome}: {formatReservationPeriod(reserva.startsAt, reserva.endsAt)} ({reserva.status}) <ExternalLink className="inline h-3 w-3" /></Link>) : "Nenhuma reserva vinculada"}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Documentos vinculados</dt>
                    <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {evento.documentos.length ? evento.documentos.map(({ id, purpose, document }) => <a key={id} href={documentHref(document.fileUrl)} target="_blank" rel="noopener noreferrer" className="block text-xs text-amber-700 hover:underline dark:text-amber-400"><FileText className="mr-1 inline h-3 w-3" />{document.title} ({document.documentType}, {purpose}, {document.status}) <ExternalLink className="inline h-3 w-3" /></a>) : "Nenhum documento vinculado"}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
          {filteredEventos.length === 0 && <div className="px-6 py-14 text-center"><CalendarDays className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-medium text-slate-700 dark:text-slate-300">Nenhum evento encontrado</p><p className="mt-1 text-sm text-slate-500">Ajuste a busca ou os filtros para consultar os eventos cadastrados.</p></div>}
        </div>
      </section>
    </PageFrame>
  );
}
