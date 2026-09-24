"use client";

import { useState } from "react";
import {
  Building2,
  ClipboardList,
  Search,
  Tractor,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";

type Service = {
  protocolo: string;
  descricao: string;
  status: string;
  active: boolean;
};

type Team = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  department: { name: string } | null;
  members: {
    isLeader: boolean;
    isActive: boolean;
    employee: {
      id: string;
      name: string;
      registration: string | null;
      role: { name: string } | null;
    };
  }[];
  assignments: { obrasServico: Service }[];
};

type Asset = {
  id: string;
  patrimonyNumber: string;
  name: string;
  brand: string | null;
  model: string | null;
  status: string;
  category: { name: string };
  department: { name: string } | null;
  responsible: { name: string } | null;
  serviceEquipment: { obrasServico: Service }[];
};

function matchesSearch(values: Array<string | null | undefined>, query: string) {
  return values.some((value) => value?.toLocaleLowerCase("pt-BR").includes(query));
}

function serviceStatusClassName(status: string) {
  if (status === "Em Andamento") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  if (status === "Concluído") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (status === "Cancelado") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
  return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300";
}

export function MaquinasEquipesClient({ teams, assets }: { teams: Team[]; assets: Asset[] }) {
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [assetFilter, setAssetFilter] = useState("all");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const departments = Array.from(new Set([
    ...teams.map((team) => team.department?.name),
    ...assets.map((asset) => asset.department?.name),
  ].filter((department): department is string => Boolean(department)))).sort();

  const filteredTeams = teams.filter((team) => {
    const matchesDepartment = departmentFilter === "all" || team.department?.name === departmentFilter;
    const matchesSituation = teamFilter === "all" || (teamFilter === "active" ? team.isActive : !team.isActive);
    const matchesQuery = !normalizedQuery || matchesSearch([
      team.code,
      team.name,
      team.department?.name,
      ...team.members.flatMap((member) => [member.employee.name, member.employee.registration, member.employee.role?.name]),
      ...team.assignments.flatMap((assignment) => [assignment.obrasServico.protocolo, assignment.obrasServico.descricao]),
    ], normalizedQuery);

    return matchesDepartment && matchesSituation && matchesQuery;
  });

  const filteredAssets = assets.filter((asset) => {
    const isAllocated = asset.serviceEquipment.length > 0;
    const matchesDepartment = departmentFilter === "all" || asset.department?.name === departmentFilter;
    const matchesAllocation = assetFilter === "all" || (assetFilter === "allocated" ? isAllocated : !isAllocated);
    const matchesQuery = !normalizedQuery || matchesSearch([
      asset.patrimonyNumber,
      asset.name,
      asset.brand,
      asset.model,
      asset.status,
      asset.category.name,
      asset.department?.name,
      asset.responsible?.name,
      ...asset.serviceEquipment.flatMap((assignment) => [assignment.obrasServico.protocolo, assignment.obrasServico.descricao]),
    ], normalizedQuery);

    return matchesDepartment && matchesAllocation && matchesQuery;
  });

  const activeMembers = teams.reduce((total, team) => total + team.members.filter((member) => member.isActive).length, 0);
  const allocatedAssets = assets.filter((asset) => asset.serviceEquipment.length > 0).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <Tractor className="h-4 w-4" />
            Recursos de campo
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Máquinas e Equipes</h1>
          <p className="mt-1 max-w-2xl text-slate-500 dark:text-slate-400">Acompanhe os equipamentos e as equipes vinculados aos serviços de Obras.</p>
        </div>
        <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">Cadastros gerenciados em Patrimônio e RH. Atribuições são feitas nas ações de Obras.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><UsersRound className="h-5 w-5" /></span><div><p className="text-sm text-slate-500 dark:text-slate-400">Equipes ativas</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{teams.filter((team) => team.isActive).length}</p></div></div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-sky-100 p-2.5 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"><UserRound className="h-5 w-5" /></span><div><p className="text-sm text-slate-500 dark:text-slate-400">Integrantes ativos</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{activeMembers}</p></div></div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-violet-100 p-2.5 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"><Wrench className="h-5 w-5" /></span><div><p className="text-sm text-slate-500 dark:text-slate-400">Equipamentos em serviço</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{allocatedAssets}</p></div></div>
        </div>
      </div>

      <div className="rounded-md border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_190px_220px]">
          <label className="relative block"><span className="sr-only">Buscar máquinas e equipes</span><Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por equipe, servidor, patrimônio ou serviço..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" /></label>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} aria-label="Filtrar por departamento" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"><option value="all">Todos os departamentos</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select>
          <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} aria-label="Filtrar equipes por situação" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"><option value="all">Todas as equipes</option><option value="active">Equipes ativas</option><option value="inactive">Equipes inativas</option></select>
          <select value={assetFilter} onChange={(event) => setAssetFilter(event.target.value)} aria-label="Filtrar equipamentos por alocação" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"><option value="all">Todos os equipamentos</option><option value="available">Sem serviço atribuído</option><option value="allocated">Em serviço</option></select>
        </div>
      </div>

      <section aria-labelledby="teams-heading">
        <div className="mb-3 flex items-center justify-between"><div><h2 id="teams-heading" className="text-lg font-bold text-slate-900 dark:text-white">Equipes de campo</h2><p className="text-sm text-slate-500 dark:text-slate-400">{filteredTeams.length} de {teams.length} equipe{teams.length === 1 ? "" : "s"}</p></div><UsersRound className="h-5 w-5 text-amber-600" /></div>
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredTeams.map((team) => (
            <article key={team.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold tracking-wider text-amber-700 dark:text-amber-400">{team.code}</p><h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">{team.name}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"><Building2 className="h-4 w-4" />{team.department?.name ?? "Sem departamento vinculado"}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${team.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>{team.isActive ? "Ativa" : "Inativa"}</span></div>
              <div className="mt-5 grid gap-5 border-t border-slate-100 pt-4 dark:border-slate-700 sm:grid-cols-2"><div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Integrantes</p><div className="space-y-2">{team.members.filter((member) => member.isActive).map((member) => <div key={member.employee.id} className="flex items-start gap-2 text-sm"><UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><div><p className="font-medium text-slate-700 dark:text-slate-200">{member.employee.name}{member.isLeader && <span className="ml-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">Liderança</span>}</p><p className="text-xs text-slate-500">{member.employee.role?.name ?? member.employee.registration ?? "Função não informada"}</p></div></div>)}{team.members.filter((member) => member.isActive).length === 0 && <p className="text-sm text-slate-500">Sem integrantes ativos.</p>}</div></div><div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Serviços atuais</p><div className="space-y-2">{team.assignments.map(({ obrasServico: service }) => <div key={service.protocolo} className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-700/50"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{service.protocolo}</p><span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${serviceStatusClassName(service.status)}`}>{service.status}</span></div><p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{service.descricao}</p></div>)}{team.assignments.length === 0 && <p className="text-sm text-slate-500">Nenhum serviço atribuído.</p>}</div></div></div>
            </article>
          ))}
          {filteredTeams.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-600">Nenhuma equipe encontrada para os filtros selecionados.</p>}
        </div>
      </section>

      <section aria-labelledby="assets-heading">
        <div className="mb-3 flex items-center justify-between"><div><h2 id="assets-heading" className="text-lg font-bold text-slate-900 dark:text-white">Máquinas e equipamentos</h2><p className="text-sm text-slate-500 dark:text-slate-400">Bens das categorias Obras e Iluminação</p></div><Tractor className="h-5 w-5 text-violet-600" /></div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredAssets.map((asset) => (
            <article key={asset.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold tracking-wider text-violet-700 dark:text-violet-400">{asset.patrimonyNumber}</p><h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">{asset.name}</h3></div><span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">{asset.status}</span></div><p className="mt-3 w-fit rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300">{asset.category.name}</p><dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-700"><div className="flex gap-2"><dt className="w-24 shrink-0 text-slate-500">Departamento</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{asset.department?.name ?? "Não informado"}</dd></div><div className="flex gap-2"><dt className="w-24 shrink-0 text-slate-500">Responsável</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{asset.responsible?.name ?? "Não informado"}</dd></div>{(asset.brand || asset.model) && <div className="flex gap-2"><dt className="w-24 shrink-0 text-slate-500">Marca/modelo</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{[asset.brand, asset.model].filter(Boolean).join(" / ")}</dd></div>}</dl><div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700"><p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500"><ClipboardList className="h-3.5 w-3.5" />Serviços atuais</p>{asset.serviceEquipment.length > 0 ? <div className="space-y-2">{asset.serviceEquipment.map(({ obrasServico: service }) => <div key={service.protocolo} className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-700/50"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{service.protocolo}</p><span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${serviceStatusClassName(service.status)}`}>{service.status}</span></div><p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{service.descricao}</p></div>)}</div> : <p className="text-sm text-slate-500">Sem serviço atribuído.</p>}</div></article>
          ))}
          {filteredAssets.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-600">Nenhum equipamento encontrado para os filtros selecionados.</p>}
        </div>
      </section>
    </div>
  );
}
