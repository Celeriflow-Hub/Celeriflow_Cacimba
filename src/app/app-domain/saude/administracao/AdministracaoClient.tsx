"use client";

import Link from "next/link";
import { useState } from "react";
import { FilterX, Plus, Search } from "lucide-react";
import UnitsTab from "./UnitsTab";
import ProfessionalsTab from "./ProfessionalsTab";
import CatalogTab from "./CatalogTab";
import GroupsTab from "./GroupsTab";
import SchedulingGroupsTab from "./SchedulingGroupsTab";
import HolidaysTab from "./HolidaysTab";
import PeopleTab from "./PeopleTab";
import AccessTab from "./AccessTab";

export type AdministrationTab = "unidades" | "profissionais" | "especialidades" | "grupos" | "servicos" | "cbo" | "agendamentos" | "feriados" | "pessoas" | "empresas" | "acessos";
export type AdministrationSituation = "" | "ativo" | "inativo";

type StatusHistoryRow = { id: string; isActive: boolean; reason: string | null; occurredAt: string };
type ReferenceOption = { id: string; name: string };
type CodedReferenceOption = ReferenceOption & { code: string };

export type UnitRow = {
  id: string; name: string; type: string; cnes: string | null; phone: string | null; email: string | null; isActive: boolean; isThirdParty: boolean;
  shifts: { id: string; dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[];
  specialties: { id: string; isActive: boolean; specialty: CodedReferenceOption }[];
  services: { id: string; isActive: boolean; service: CodedReferenceOption }[];
  habilitations: { id: string; code: string; description: string; isActive: boolean }[];
  statusHistory: StatusHistoryRow[];
};

export type ProfessionalRow = {
  id: string; employeeId: string; cns: string | null; treatment: string | null; cbo: string | null; councilName: string | null;
  councilNumber: string | null; specialty: string | null; isAuditor: boolean; consultationIntervalMinutes: number | null; isActive: boolean;
  employee: {
    id: string; name: string; registration: string | null; cpf: string | null; email: string | null; phone: string | null; isActive: boolean;
    person: {
      rg: string | null; rgIssuer: string | null; phonePrimary: string | null; email: string | null;
      addresses: { streetName: string | null; number: string | null; complement: string | null; zipCode: string | null; neighborhood: { name: string; city: string; state: string } | null }[];
      documents: { id: string; title: string; documentType: string }[];
    } | null;
  };
  unit: ReferenceOption | null;
  assignments: { id: string; weeklyHours: number; isActive: boolean; unit: ReferenceOption; specialty: CodedReferenceOption | null }[];
  serviceAssignments: { id: string; isActive: boolean; service: CodedReferenceOption }[];
  habilitations: { id: string; code: string; description: string; isActive: boolean }[];
  statusHistory: StatusHistoryRow[];
};

export type SpecialtyRow = { id: string; code: string; name: string; isActive: boolean };
export type ServiceRow = { id: string; code: string; name: string; classification: string | null; isActive: boolean };
export type CboRow = { id: string; code: string; description: string; isActive: boolean };
export type GroupRow = {
  id: string; name: string; isActive: boolean; schedulingGroupCount: number;
  specialties: { id: string; specialty: CodedReferenceOption }[];
  services: { id: string; service: CodedReferenceOption }[];
};
export type SchedulingGroupRow = { id: string; name: string; isActive: boolean; unit: ReferenceOption; specialtyGroup: ReferenceOption };
export type HolidayRow = { id: string; title: string; description: string | null; date: string; type: string };
export type PersonRow = {
  id: string; fullName: string; cpf: string; birthDate: string | null; gender: string | null; raceColor: string | null; motherName: string | null; email: string | null; phonePrimary: string | null; status: string;
  addresses: { id: string; addressType: string | null; streetName: string | null; number: string | null; zipCode: string | null }[];
  documentCount: number; isPatient: boolean; usuario: { id: string; nome: string; ativo: boolean } | null;
};
export type CompanyRow = { id: string; corporateName: string; tradeName: string | null; cnpj: string; phone: string | null; emailPrimary: string | null; status: string };
export type AccessRow = {
  id: string; nome: string; email: string; ativo: boolean; perfilId: string; profileName: string; employeeId: string | null; personName: string | null; cpf: string | null;
  canView: boolean; canEdit: boolean;
  scopes: { unitId: string; unitName: string; validFrom: string | null; validUntil: string | null; weekdays: string; startTime: string; endTime: string; isActive: boolean }[];
};
export type UsageRow = { date: string; count: number };

export type AdministrationClientProps = {
  activeTab: AdministrationTab;
  query: string;
  situation: AdministrationSituation;
  page: number;
  total: number;
  unitRows: UnitRow[];
  professionalRows: ProfessionalRow[];
  specialtyRows: SpecialtyRow[];
  groupRows: GroupRow[];
  serviceRows: ServiceRow[];
  cboRows: CboRow[];
  schedulingGroupRows: SchedulingGroupRow[];
  holidayRows: HolidayRow[];
  personRows: PersonRow[];
  companyRows: CompanyRow[];
  accessRows: AccessRow[];
  usageRows: UsageRow[];
  usageFrom: string;
  usageUntil: string;
  unitOptions: { id: string; name: string; type: string }[];
  specialtyOptions: CodedReferenceOption[];
  serviceOptions: CodedReferenceOption[];
  cboOptions: { id: string; code: string; description: string }[];
  groupOptions: ReferenceOption[];
  employeeOptions: { id: string; name: string; registration: string | null; cpf: string | null }[];
  profileOptions: { id: string; name: string }[];
  canManageAccess: boolean;
  canCreate: boolean;
  canUpdate: boolean;
};

const tabLabels: Record<AdministrationTab, string> = {
  unidades: "Unidades",
  profissionais: "Profissionais",
  especialidades: "Especialidades",
  grupos: "Grupos",
  servicos: "Serviços SUS",
  cbo: "CBO",
  agendamentos: "Grupos de agendamento",
  feriados: "Feriados",
  pessoas: "Pessoas físicas",
  empresas: "Pessoas jurídicas",
  acessos: "Usuários e acessos",
};

function routeFor(tab: AdministrationTab, page = 1, query = "", situation: AdministrationSituation = "") {
  const params = new URLSearchParams({ aba: tab });
  if (page > 1) params.set("page", String(page));
  if (query) params.set("q", query);
  if (situation) params.set("situacao", situation);
  return `/saude/administracao?${params.toString()}`;
}

function Pagination({ activeTab, page, total, query, situation }: Pick<AdministrationClientProps, "activeTab" | "page" | "total" | "query" | "situation">) {
  const pages = Math.max(1, Math.ceil(total / 20));
  const start = total === 0 ? 0 : (page - 1) * 20 + 1;
  const end = Math.min(page * 20, total);
  const visible = Array.from({ length: pages }, (_, index) => index + 1).filter(value => value === 1 || value === pages || Math.abs(value - page) <= 1);
  return (
    <footer className="flex h-10 shrink-0 items-center justify-between border-t border-slate-200 px-3 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
      <span>{start}–{end} de {total} registros</span>
      <div className="flex items-center gap-1">
        <Link aria-disabled={page === 1} className={`rounded border px-2 py-1 ${page === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`} href={routeFor(activeTab, page - 1, query, situation)}>Anterior</Link>
        {visible.map((value, index) => (
          <span key={value} className="contents">
            {index > 0 && visible[index - 1] !== value - 1 && <span className="px-1">…</span>}
            <Link className={`min-w-7 rounded border px-2 py-1 text-center ${value === page ? "border-emerald-700 bg-emerald-700 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`} href={routeFor(activeTab, value, query, situation)}>{value}</Link>
          </span>
        ))}
        <Link aria-disabled={page === pages} className={`rounded border px-2 py-1 ${page === pages ? "pointer-events-none opacity-40" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`} href={routeFor(activeTab, page + 1, query, situation)}>Próxima</Link>
      </div>
    </footer>
  );
}

function EmptyState() {
  return <div className="flex h-full items-center justify-center p-8 text-sm text-slate-500">Nenhum registro encontrado.</div>;
}

export default function AdministracaoClient(props: AdministrationClientProps) {
  const [editor, setEditor] = useState<{ kind: string; id?: string } | null>(null);
  const canAdd = props.canCreate;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <nav className="flex shrink-0 flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-950" aria-label="Cadastros administrativos da Saúde">
        {(Object.keys(tabLabels) as AdministrationTab[]).filter(tab => tab !== "acessos" || props.canManageAccess).map(tab => (
          <Link key={tab} href={routeFor(tab)} className={`rounded px-2.5 py-1.5 text-xs font-semibold ${tab === props.activeTab ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"}`}>{tabLabels[tab]}</Link>
        ))}
      </nav>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 p-2 dark:border-slate-700">
        <form className="flex min-w-0 flex-1 flex-wrap items-center gap-2" action="/saude/administracao">
          <input type="hidden" name="aba" value={props.activeTab} />
          <label className="relative min-w-52 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-2 size-3.5 text-slate-400" />
            <input name="q" defaultValue={props.query} className="h-8 w-full rounded border border-slate-300 bg-white pl-8 pr-2 text-xs outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-950" placeholder={`Buscar em ${tabLabels[props.activeTab].toLowerCase()}...`} />
          </label>
          {props.activeTab !== "feriados" && <select name="situacao" defaultValue={props.situation} className="h-8 rounded border border-slate-300 bg-white px-2 text-xs dark:border-slate-600 dark:bg-slate-950"><option value="">Todas as situações</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option></select>}
          <button className="h-8 rounded bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700" type="submit">Filtrar</button>
          {(props.query || props.situation) && <Link title="Limpar filtros" className="inline-flex size-8 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800" href={routeFor(props.activeTab)}><FilterX className="size-4" /></Link>}
        </form>
        {canAdd && !["pessoas", "empresas", "acessos"].includes(props.activeTab) && <button type="button" onClick={() => setEditor({ kind: props.activeTab })} className="inline-flex h-8 items-center gap-1.5 rounded bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800"><Plus className="size-3.5" />Novo</button>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {props.activeTab === "unidades" ? (
          <UnitsTab rows={props.unitRows} specialtyOptions={props.specialtyOptions} serviceOptions={props.serviceOptions} editor={editor} canUpdate={props.canUpdate} onEdit={id => setEditor({ kind: "unidades", id })} onClose={() => setEditor(null)} />
        ) : props.activeTab === "profissionais" ? (
          <ProfessionalsTab rows={props.professionalRows} editor={editor} unitOptions={props.unitOptions} specialtyOptions={props.specialtyOptions} serviceOptions={props.serviceOptions} cboOptions={props.cboOptions} employeeOptions={props.employeeOptions} canUpdate={props.canUpdate} onEdit={id => setEditor({ kind: "profissionais", id })} onClose={() => setEditor(null)} />
        ) : props.activeTab === "especialidades" ? (
          <CatalogTab kind="especialidades" rows={props.specialtyRows} editor={editor} canUpdate={props.canUpdate} onEdit={id => setEditor({ kind: "especialidades", id })} onClose={() => setEditor(null)} />
        ) : props.activeTab === "servicos" ? (
          <CatalogTab kind="servicos" rows={props.serviceRows} editor={editor} canUpdate={props.canUpdate} onEdit={id => setEditor({ kind: "servicos", id })} onClose={() => setEditor(null)} />
        ) : props.activeTab === "cbo" ? (
          <CatalogTab kind="cbo" rows={props.cboRows} editor={editor} canUpdate={props.canUpdate} onEdit={id => setEditor({ kind: "cbo", id })} onClose={() => setEditor(null)} />
        ) : props.activeTab === "grupos" ? (
          <GroupsTab rows={props.groupRows} editor={editor} specialties={props.specialtyOptions} services={props.serviceOptions} canUpdate={props.canUpdate} onEdit={id => setEditor({ kind: "grupos", id })} onClose={() => setEditor(null)} />
        ) : props.activeTab === "agendamentos" ? (
          <SchedulingGroupsTab rows={props.schedulingGroupRows} editor={editor} units={props.unitOptions} groups={props.groupOptions} canUpdate={props.canUpdate} onEdit={id => setEditor({ kind: "agendamentos", id })} onClose={() => setEditor(null)} />
        ) : props.activeTab === "feriados" ? (
          <HolidaysTab rows={props.holidayRows} editor={editor} canUpdate={props.canUpdate} onEdit={id => setEditor({ kind: "feriados", id })} onClose={() => setEditor(null)} />
        ) : props.activeTab === "pessoas" ? (
          <PeopleTab kind="person" people={props.personRows} companies={[]} canManage={props.canManageAccess} />
        ) : props.activeTab === "empresas" ? (
          <PeopleTab kind="company" people={[]} companies={props.companyRows} canManage={props.canManageAccess} />
        ) : props.activeTab === "acessos" ? (
          <AccessTab rows={props.accessRows} profiles={props.profileOptions} employees={props.employeeOptions} units={props.unitOptions} canManage={props.canManageAccess} usage={props.usageRows} usageFrom={props.usageFrom} usageUntil={props.usageUntil} />
        ) : props.total === 0 ? <EmptyState /> : <div className="p-3 text-sm text-slate-500">Conteúdo de {tabLabels[props.activeTab]} em preparação.</div>}
      </div>
      <Pagination activeTab={props.activeTab} page={props.page} total={props.total} query={props.query} situation={props.situation} />

    </section>
  );
}
