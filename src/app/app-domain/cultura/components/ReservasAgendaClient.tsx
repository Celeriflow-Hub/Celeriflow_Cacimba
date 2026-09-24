"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, CalendarDays, Clock3, FileText, MapPin, Search, UserRound } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

type Reserva = {
  id: string;
  startsAt: string;
  endsAt: string;
  purpose: string;
  status: string;
  active: boolean;
  notes: string | null;
  space: {
    nome: string;
    tipo: string;
    endereco: string | null;
    realEstate: {
      municipalInsc: string | null;
      propertyType: string | null;
      streetName: string | null;
      number: string | null;
      complement: string | null;
    } | null;
  };
  person: { fullName: string; cpf: string } | null;
  company: { corporateName: string; tradeName: string | null; cnpj: string } | null;
  event: { nome: string; tipo: string; status: string } | null;
  documentos: { id: string; purpose: string; document: { title: string; documentType: string; status: string } }[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function statusClassName(status: string) {
  if (["Confirmada", "Confirmado", "Aprovada", "Aprovado"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (["Cancelada", "Cancelado", "Recusada", "Recusado"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
}

function formatSchedule(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();

  return {
    date: sameDay ? dateFormatter.format(start) : `${dateFormatter.format(start)} a ${dateFormatter.format(end)}`,
    time: `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`,
  };
}

function requester(reserva: Reserva) {
  if (reserva.person) return { name: reserva.person.fullName, source: "Cadastro Geral - Pessoa Física", document: reserva.person.cpf };
  if (reserva.company) return { name: reserva.company.tradeName || reserva.company.corporateName, source: "Cadastro Geral - Pessoa Jurídica", document: reserva.company.cnpj };
  return { name: "Solicitante não vinculado", source: "Sem vínculo no Cadastro Geral", document: null };
}

function realEstateDescription(reserva: Reserva) {
  const realEstate = reserva.space.realEstate;
  if (!realEstate) return reserva.space.endereco || "Imóvel não vinculado";

  const address = [realEstate.streetName, realEstate.number, realEstate.complement].filter(Boolean).join(", ");
  const reference = [realEstate.propertyType, realEstate.municipalInsc && `Inscrição ${realEstate.municipalInsc}`].filter(Boolean).join(" | ");
  return [address || reserva.space.endereco, reference].filter(Boolean).join(" | ") || "Imóvel vinculado sem identificação";
}

function searchableTerms(reserva: Reserva) {
  const requesterInfo = requester(reserva);
  return [
    reserva.id,
    reserva.purpose,
    reserva.status,
    reserva.space.nome,
    reserva.space.tipo,
    reserva.space.endereco,
    realEstateDescription(reserva),
    requesterInfo.name,
    requesterInfo.source,
    requesterInfo.document,
    reserva.event?.nome,
    reserva.event?.tipo,
    reserva.notes,
    ...reserva.documentos.flatMap(({ purpose, document }) => [purpose, document.title, document.documentType, document.status]),
  ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
}

export function ReservasAgendaClient({ reservas }: { reservas: Reserva[] }) {
  const [search, setSearch] = useState("");
  const [spaceFilter, setSpaceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const spaces = Array.from(new Set(reservas.map((reserva) => reserva.space.nome))).sort();
  const statuses = Array.from(new Set(reservas.map((reserva) => reserva.status))).sort();
  const filteredReservas = reservas.filter((reserva) => {
    const matchesSearch = !normalizedSearch || searchableTerms(reserva).includes(normalizedSearch);
    return matchesSearch
      && (spaceFilter === "all" || reserva.space.nome === spaceFilter)
      && (statusFilter === "all" || reserva.status === statusFilter);
  });

  return (
    <PageFrame className="space-y-3 px-1 py-1 md:px-2">
      <PageHeader title="Espaços e Reservas" icon={<CalendarDays className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" />} className="dark:border-slate-700 dark:bg-slate-800 dark:[&>h1]:text-white" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Consulta da agenda dos espaços, das solicitações do Cadastro Geral e dos termos vinculados no GED.</p>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Buscar espaço, solicitante, evento ou termo do GED..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:w-auto">
            <select value={spaceFilter} onChange={(event) => setSpaceFilter(event.target.value)} aria-label="Filtrar por espaço" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="all">Todos os espaços</option>
              {spaces.map((space) => <option key={space} value={space}>{space}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por status" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="all">Todos os status</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>

        <div className="p-3 md:p-4">
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{filteredReservas.length} {filteredReservas.length === 1 ? "reserva encontrada" : "reservas encontradas"} na agenda.</p>
          {filteredReservas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="font-medium text-slate-600 dark:text-slate-300">Nenhuma reserva encontrada.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ajuste os filtros ou a busca para consultar outra reserva.</p>
            </div>
          ) : (
            <ol className="space-y-4">
              {filteredReservas.map((reserva) => {
                const schedule = formatSchedule(reserva.startsAt, reserva.endsAt);
                const requesterInfo = requester(reserva);
                const termLabel = reserva.documentos.length === 1 ? "1 termo vinculado no GED" : `${reserva.documentos.length} termos vinculados no GED`;

                return (
                  <li key={reserva.id} className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/20 dark:border-slate-700 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/10 md:p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900 dark:text-white">{reserva.purpose}</h2>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassName(reserva.status)}`}>{reserva.status}</span>
                          {!reserva.active && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">Inativa</span>}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Reserva {reserva.id}</p>
                      </div>
                      <div className="flex shrink-0 items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                        <div><p className="font-semibold">{schedule.date}</p><p className="mt-0.5 flex items-center gap-1 text-xs"><Clock3 className="h-3.5 w-3.5" />{schedule.time}</p></div>
                      </div>
                    </div>

                    <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                        <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><MapPin className="h-3.5 w-3.5" />Espaço</dt>
                        <dd className="mt-1 truncate font-semibold text-slate-800 dark:text-slate-100">{reserva.space.nome}</dd>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{reserva.space.tipo}</p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                        <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><Building2 className="h-3.5 w-3.5" />Imóvel vinculado</dt>
                        <dd className="mt-1 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">{realEstateDescription(reserva)}</dd>
                      </div>
                      <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                        <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><UserRound className="h-3.5 w-3.5" />Solicitante</dt>
                        <dd className="mt-1 truncate font-semibold text-slate-800 dark:text-slate-100">{requesterInfo.name}</dd>
                        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{requesterInfo.source}</p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                        <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><FileText className="h-3.5 w-3.5" />Termos e evento</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{reserva.event?.nome || "Sem evento vinculado"}</dd>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{termLabel}</p>
                      </div>
                    </dl>

                    {(reserva.notes || reserva.documentos.length > 0) && <details className="mt-4 rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700">
                      <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-200">Observações e documentos vinculados</summary>
                      {reserva.notes && <p className="mt-3 text-slate-600 dark:text-slate-300">{reserva.notes}</p>}
                      {reserva.documentos.length > 0 && <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                        {reserva.documentos.map(({ id, purpose, document }) => <li key={id} className="flex flex-wrap items-center justify-between gap-2 text-slate-600 dark:text-slate-300"><span><span className="font-medium text-slate-800 dark:text-slate-100">{document.title}</span> <span className="text-slate-400">|</span> {purpose}</span><span className="text-xs text-slate-500">{document.documentType} - {document.status}</span></li>)}
                      </ul>}
                      <Link href="/documentos/ged" className="mt-3 inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">Consultar documentos no GED</Link>
                    </details>}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </PageFrame>
  );
}
