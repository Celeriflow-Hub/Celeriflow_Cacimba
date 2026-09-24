import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { SYSTEM_ADMIN_PROFILE_CODE, getSystemAdministratorEmail } from "@/lib/administration/c3-policy";
import { canPerformModuleOperation, getTenantContextForModule, isSystemAdministrator } from "@/lib/platform/tenant-context";
import AdministracaoClient, {
  type AdministrationSituation,
  type AdministrationTab,
  type CboRow,
  type GroupRow,
  type HolidayRow,
  type PersonRow,
  type CompanyRow,
  type AccessRow,
  type UsageRow,
  type ProfessionalRow,
  type SchedulingGroupRow,
  type ServiceRow,
  type SpecialtyRow,
  type UnitRow,
} from "./AdministracaoClient";

const PAGE_SIZE = 20;

type SearchParams = {
  aba?: string | string[];
  page?: string | string[];
  q?: string | string[];
  situacao?: string | string[];
  de?: string | string[];
  ate?: string | string[];
};

const tabs: AdministrationTab[] = ["unidades", "profissionais", "especialidades", "grupos", "servicos", "cbo", "agendamentos", "feriados", "pessoas", "empresas", "acessos"];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseTab(value: string | undefined): AdministrationTab {
  return value && tabs.includes(value as AdministrationTab) ? value as AdministrationTab : "unidades";
}

function parseSituation(value: string | undefined): AdministrationSituation {
  return value === "ativo" || value === "inativo" ? value : "";
}

function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function parseDate(value: string | undefined, fallback: Date) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback.toISOString().slice(0, 10);
}

function clampPage(page: number, total: number) {
  return Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)));
}

function activeFilter(situation: AdministrationSituation) {
  return situation ? { isActive: situation === "ativo" } : {};
}

export default async function SaudeAdministracaoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await getTenantContextForModule("SAUDE");
  const params = await searchParams;
  const tab = parseTab(firstValue(params.aba));
  const query = (firstValue(params.q) || "").trim().slice(0, 200);
  const situation = parseSituation(firstValue(params.situacao));
  const requestedPage = parsePage(firstValue(params.page));
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
  const usageFrom = parseDate(firstValue(params.de), thirtyDaysAgo);
  const usageUntil = parseDate(firstValue(params.ate), today);
  const { prisma } = context;
  const canManageAccess = isSystemAdministrator(context.user);
  if (tab === "acessos" && !canManageAccess) throw new Error("Apenas o administrador do sistema pode gerenciar usuários e acessos.");

  const referencesPromise = Promise.all([
    prisma.healthUnit.findMany({
      where: { isActive: true, OR: [{ isThirdParty: false }, { professionals: { some: { isActive: true } } }, { professionalAssignments: { some: { isActive: true } } }, { serviceAssignments: { some: { isActive: true } } }, { habilitations: { some: { isActive: true } } }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
    prisma.healthSpecialty.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.healthService.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.healthCbo.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, description: true },
    }),
    prisma.healthSpecialtyGroup.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.employee.findMany({
      where: { isActive: true, personId: { not: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, registration: true, cpf: true },
    }),
    prisma.configuracaoPerfil.findMany({ where: { ativo: true, codigo: { not: SYSTEM_ADMIN_PROFILE_CODE } }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  let total = 0;
  let page = 1;
  let unitRows: UnitRow[] = [];
  let professionalRows: ProfessionalRow[] = [];
  let specialtyRows: SpecialtyRow[] = [];
  let groupRows: GroupRow[] = [];
  let serviceRows: ServiceRow[] = [];
  let cboRows: CboRow[] = [];
  let schedulingGroupRows: SchedulingGroupRow[] = [];
  let holidayRows: HolidayRow[] = [];
  let personRows: PersonRow[] = [];
  let companyRows: CompanyRow[] = [];
  let accessRows: AccessRow[] = [];
  let usageRows: UsageRow[] = [];

  if (tab === "unidades") {
    const where: Prisma.HealthUnitWhereInput = {
      ...activeFilter(situation),
      ...(query ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { type: { contains: query, mode: "insensitive" } },
          { cnes: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      } : {}),
    };
    total = await prisma.healthUnit.count({ where });
    page = clampPage(requestedPage, total);
    const units = await prisma.healthUnit.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        cnes: true,
        phone: true,
        email: true,
        isActive: true,
        isThirdParty: true,
        shifts: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }], select: { id: true, dayOfWeek: true, startTime: true, endTime: true, isActive: true } },
        specialties: { select: { id: true, isActive: true, specialty: { select: { id: true, code: true, name: true } } } },
        serviceAssignments: { select: { id: true, isActive: true, service: { select: { id: true, code: true, name: true } } } },
        habilitations: { orderBy: { code: "asc" }, select: { id: true, code: true, description: true, isActive: true } },
        statusHistory: { orderBy: { occurredAt: "desc" }, select: { id: true, isActive: true, reason: true, occurredAt: true } },
      },
    });
    unitRows = units.map((unit) => ({
      ...unit,
      services: unit.serviceAssignments.map((assignment) => ({ id: assignment.id, isActive: assignment.isActive, service: assignment.service })),
      statusHistory: unit.statusHistory.map((entry) => ({ ...entry, occurredAt: entry.occurredAt.toISOString() })),
    }));
  }

  if (tab === "profissionais") {
    const where: Prisma.HealthProfessionalWhereInput = {
      ...activeFilter(situation),
      ...(query ? {
        OR: [
          { employee: { is: { name: { contains: query, mode: "insensitive" } } } },
          { employee: { is: { cpf: { contains: query, mode: "insensitive" } } } },
          { cns: { contains: query, mode: "insensitive" } },
          { cbo: { contains: query, mode: "insensitive" } },
          { specialty: { contains: query, mode: "insensitive" } },
          { councilNumber: { contains: query, mode: "insensitive" } },
        ],
      } : {}),
    };
    total = await prisma.healthProfessional.count({ where });
    page = clampPage(requestedPage, total);
    const professionals = await prisma.healthProfessional.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: [{ employee: { name: "asc" } }, { id: "asc" }],
      select: {
        id: true,
        employeeId: true,
        cns: true,
        treatment: true,
        cbo: true,
        councilName: true,
        councilNumber: true,
        specialty: true,
        isAuditor: true,
        consultationIntervalMinutes: true,
        isActive: true,
        employee: {
          select: {
            id: true,
            name: true,
            registration: true,
            cpf: true,
            email: true,
            phone: true,
            isActive: true,
            person: {
              select: {
                rg: true,
                rgIssuer: true,
                phonePrimary: true,
                email: true,
                addresses: { take: 1, select: { streetName: true, number: true, complement: true, zipCode: true, neighborhood: { select: { name: true, city: true, state: true } } } },
                documents: { select: { id: true, title: true, documentType: true } },
              },
            },
          },
        },
        unit: { select: { id: true, name: true } },
        assignments: {
          select: {
            id: true,
            weeklyHours: true,
            isActive: true,
            unit: { select: { id: true, name: true } },
            specialty: { select: { id: true, code: true, name: true } },
          },
        },
        serviceAssignments: { select: { id: true, isActive: true, service: { select: { id: true, code: true, name: true } } } },
        habilitations: { orderBy: { code: "asc" }, select: { id: true, code: true, description: true, isActive: true } },
        statusHistory: { orderBy: { occurredAt: "desc" }, select: { id: true, isActive: true, reason: true, occurredAt: true } },
      },
    });
    professionalRows = professionals.map((professional) => ({
      ...professional,
      statusHistory: professional.statusHistory.map((entry) => ({ ...entry, occurredAt: entry.occurredAt.toISOString() })),
    }));
  }

  if (tab === "especialidades") {
    const where: Prisma.HealthSpecialtyWhereInput = {
      ...activeFilter(situation),
      ...(query ? { OR: [{ code: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }] } : {}),
    };
    total = await prisma.healthSpecialty.count({ where });
    page = clampPage(requestedPage, total);
    specialtyRows = await prisma.healthSpecialty.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: [{ code: "asc" }, { id: "asc" }],
      select: { id: true, code: true, name: true, isActive: true },
    });
  }

  if (tab === "grupos") {
    const where: Prisma.HealthSpecialtyGroupWhereInput = {
      ...activeFilter(situation),
      ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    };
    total = await prisma.healthSpecialtyGroup.count({ where });
    page = clampPage(requestedPage, total);
    const groups = await prisma.healthSpecialtyGroup.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
        specialties: { select: { id: true, specialty: { select: { id: true, code: true, name: true } } } },
        services: { select: { id: true, service: { select: { id: true, code: true, name: true } } } },
        _count: { select: { schedulingGroups: true } },
      },
    });
    groupRows = groups.map((group) => ({
      id: group.id,
      name: group.name,
      isActive: group.isActive,
      specialties: group.specialties,
      services: group.services,
      schedulingGroupCount: group._count.schedulingGroups,
    }));
  }

  if (tab === "servicos") {
    const where: Prisma.HealthServiceWhereInput = {
      ...activeFilter(situation),
      ...(query ? {
        OR: [
          { code: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { classification: { contains: query, mode: "insensitive" } },
        ],
      } : {}),
    };
    total = await prisma.healthService.count({ where });
    page = clampPage(requestedPage, total);
    serviceRows = await prisma.healthService.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: [{ code: "asc" }, { id: "asc" }],
      select: { id: true, code: true, name: true, classification: true, isActive: true },
    });
  }

  if (tab === "cbo") {
    const where: Prisma.HealthCboWhereInput = {
      ...activeFilter(situation),
      ...(query ? { OR: [{ code: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] } : {}),
    };
    total = await prisma.healthCbo.count({ where });
    page = clampPage(requestedPage, total);
    cboRows = await prisma.healthCbo.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: [{ code: "asc" }, { id: "asc" }],
      select: { id: true, code: true, description: true, isActive: true },
    });
  }

  if (tab === "agendamentos") {
    const where: Prisma.HealthSchedulingGroupWhereInput = {
      ...activeFilter(situation),
      ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    };
    total = await prisma.healthSchedulingGroup.count({ where });
    page = clampPage(requestedPage, total);
    schedulingGroupRows = await prisma.healthSchedulingGroup.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
        unit: { select: { id: true, name: true } },
        specialtyGroup: { select: { id: true, name: true } },
      },
    });
  }

  if (tab === "feriados") {
    const where: Prisma.CalendarEventWhereInput = {
      isHoliday: true,
      ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { type: { contains: query, mode: "insensitive" } }] } : {}),
    };
    total = await prisma.calendarEvent.count({ where });
    page = clampPage(requestedPage, total);
    const holidays = await prisma.calendarEvent.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: [{ date: "asc" }, { title: "asc" }],
      select: { id: true, title: true, description: true, date: true, type: true },
    });
    holidayRows = holidays.map(holiday => ({ ...holiday, date: holiday.date.toISOString() }));
  }

  if (tab === "pessoas") {
    const where: Prisma.PersonWhereInput = {
      ...(situation ? { status: situation === "ativo" ? "Ativo" : "Inativo" } : {}),
      ...(query ? { OR: [{ fullName: { contains: query, mode: "insensitive" } }, { cpf: { contains: query } }] } : {}),
    };
    total = await prisma.person.count({ where });
    page = clampPage(requestedPage, total);
    const people = await prisma.person.findMany({
      where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: [{ fullName: "asc" }, { id: "asc" }],
      select: {
        id: true, fullName: true, cpf: true, birthDate: true, gender: true, raceColor: true, motherName: true, email: true, phonePrimary: true, status: true,
        addresses: { select: { id: true, addressType: true, streetName: true, number: true, zipCode: true } },
        _count: { select: { documents: true } }, patientInfo: { select: { id: true } },
        employee: { select: { usuario: { select: { id: true, nome: true, ativo: true } } } },
      },
    });
    personRows = people.map(person => ({ ...person, birthDate: person.birthDate?.toISOString() || null, documentCount: person._count.documents, isPatient: Boolean(person.patientInfo), usuario: person.employee?.usuario || null }));
  }

  if (tab === "empresas") {
    const where: Prisma.CompanyWhereInput = {
      ...(situation ? { status: situation === "ativo" ? "Ativo" : "Inativo" } : {}),
      ...(query ? { OR: [{ corporateName: { contains: query, mode: "insensitive" } }, { tradeName: { contains: query, mode: "insensitive" } }, { cnpj: { contains: query } }, { id: { contains: query } }] } : {}),
    };
    total = await prisma.company.count({ where });
    page = clampPage(requestedPage, total);
    companyRows = await prisma.company.findMany({ where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: [{ corporateName: "asc" }, { id: "asc" }], select: { id: true, corporateName: true, tradeName: true, cnpj: true, phone: true, emailPrimary: true, status: true } });
  }

  if (tab === "acessos") {
    const where: Prisma.UsuarioWhereInput = {
      email: { not: getSystemAdministratorEmail() },
      perfil: { codigo: { not: SYSTEM_ADMIN_PROFILE_CODE } },
      ...(situation ? { ativo: situation === "ativo" } : {}),
      ...(query ? { OR: [{ nome: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }, { employee: { is: { person: { is: { cpf: { contains: query } } } } } }] } : {}),
    };
    total = await prisma.usuario.count({ where });
    page = clampPage(requestedPage, total);
    const users = await prisma.usuario.findMany({
      where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: [{ nome: "asc" }, { id: "asc" }],
      select: {
        id: true, nome: true, email: true, ativo: true, perfilId: true, perfil: { select: { nome: true } }, employeeId: true,
        employee: { select: { person: { select: { fullName: true, cpf: true } } } },
        permissoesModulo: { where: { modulo: { codigo: "SAUDE" } }, select: { canView: true, canEdit: true } },
        healthAccessScopes: { orderBy: { unit: { name: "asc" } }, select: { unitId: true, validFrom: true, validUntil: true, weekdays: true, startTime: true, endTime: true, isActive: true, unit: { select: { name: true } } } },
      },
    });
    accessRows = users.map(user => ({ id: user.id, nome: user.nome, email: user.email, ativo: user.ativo, perfilId: user.perfilId, profileName: user.perfil.nome, employeeId: user.employeeId, personName: user.employee?.person?.fullName || null, cpf: user.employee?.person?.cpf || null, canView: user.permissoesModulo[0]?.canView || false, canEdit: user.permissoesModulo[0]?.canEdit || false, scopes: user.healthAccessScopes.map(scope => ({ ...scope, unitName: scope.unit.name })) }));
    const usageEvents = await prisma.auditEvent.findMany({
      where: { targetType: { startsWith: "HEALTH_" }, createdAt: { gte: new Date(`${usageFrom}T00:00:00.000Z`), lte: new Date(`${usageUntil}T23:59:59.999Z`) } },
      orderBy: { createdAt: "asc" }, select: { createdAt: true },
    });
    const usageByDate = new Map<string, number>();
    for (const event of usageEvents) {
      const date = event.createdAt.toISOString().slice(0, 10);
      usageByDate.set(date, (usageByDate.get(date) || 0) + 1);
    }
    usageRows = [...usageByDate].map(([date, count]) => ({ date, count }));
  }

  const [unitOptions, specialtyOptions, serviceOptions, cboOptions, groupOptions, employeeOptions, profiles] = await referencesPromise;

  return (
    <PageFrame className="flex h-full min-h-0 max-w-none flex-1 flex-col gap-1 overflow-hidden">
      <PageHeader title="Administração da Saúde" icon={<Building2 className="size-4 shrink-0 text-emerald-700" />} className="mb-0 shrink-0" action={<div className="flex flex-wrap justify-end gap-1"><Link href="/app-domain/saude/administracao/documentos" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Documentos</Link><Link href="/app-domain/saude/administracao/unificacoes" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Unificações</Link><Link href="/app-domain/saude/administracao/laboratorio" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Laboratório</Link><Link href="/saude/administracao/importacoes" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cargas SUS</Link><Link href="/saude/administracao/procedimentos" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Procedimentos</Link></div>} />
      <AdministracaoClient
        activeTab={tab}
        query={query}
        situation={situation}
        page={page}
        total={total}
        unitRows={unitRows}
        professionalRows={professionalRows}
        specialtyRows={specialtyRows}
        groupRows={groupRows}
        serviceRows={serviceRows}
        cboRows={cboRows}
        schedulingGroupRows={schedulingGroupRows}
        holidayRows={holidayRows}
        personRows={personRows}
        companyRows={companyRows}
        accessRows={accessRows}
        usageRows={usageRows}
        usageFrom={usageFrom}
        usageUntil={usageUntil}
        unitOptions={unitOptions}
        specialtyOptions={specialtyOptions}
        serviceOptions={serviceOptions}
        cboOptions={cboOptions}
        groupOptions={groupOptions}
        employeeOptions={employeeOptions}
        profileOptions={profiles.map(profile => ({ id: profile.id, name: profile.nome }))}
        canManageAccess={canManageAccess}
        canCreate={canPerformModuleOperation(context.user, "SAUDE", "create")}
        canUpdate={canPerformModuleOperation(context.user, "SAUDE", "update")}
      />
    </PageFrame>
  );
}
