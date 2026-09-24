import type { AppContext } from "@/lib/platform/tenant-context";
import type { ReportRow } from "@/lib/financeiro/report-delivery";
import type { HealthReportInput } from "./health-report-service";

type Ctx = AppContext;
type Period = { gte?: Date; lte?: Date } | undefined;

const dateText = (value: Date | null | undefined) => value ? value.toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Não informado";
const moneyText = (value: { toString(): string } | null | undefined) => value ? Number(value.toString()).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Não informado";

function range(input: HealthReportInput): Period {
  const from = input.from && /^\d{4}-\d{2}-\d{2}$/.test(input.from) ? new Date(`${input.from}T00:00:00-03:00`) : undefined;
  const to = input.to && /^\d{4}-\d{2}-\d{2}$/.test(input.to) ? new Date(`${input.to}T23:59:59.999-03:00`) : undefined;
  return from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;
}

function units(context: Ctx, selected?: string) {
  const scoped = context.user.hasHealthAccessScope ? context.user.allowedHealthUnitIds || [] : undefined;
  if (selected && scoped && !scoped.includes(selected)) throw new Error("A unidade selecionada está fora do seu escopo de acesso.");
  if (selected) return [selected];
  return scoped;
}

function ageBracket(birth: Date | null | undefined, at: Date) {
  if (!birth) return "Não informada";
  let age = at.getFullYear() - birth.getFullYear();
  const m = at.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < birth.getDate())) age -= 1;
  if (age < 0) return "Não informada";
  if (age <= 11) return "0-11";
  if (age <= 17) return "12-17";
  if (age <= 59) return "18-59";
  return "60+";
}

export async function createExtendedRows(context: Ctx, input: HealthReportInput): Promise<{ rows: ReportRow[]; warnings: string[]; chart?: { label: string; value: number; percentage: number }[] } | null> {
  const type = input.reportType as string;
  const unitIds = units(context, input.unitId);
  const period = range(input);
  const query = input.query?.toLocaleLowerCase("pt-BR");
  const match = (text: string) => !query || text.toLocaleLowerCase("pt-BR").includes(query);
  const prisma = context.prisma;

  // ---------- AGENDA ----------
  if (type === "AGENDA_BIRTHDAYS") {
    const records = await prisma.patient.findMany({ where: { status: "Ativo", ...(unitIds ? { referenceUnitId: { in: unitIds } } : {}), person: { birthDate: { not: null } } }, select: { cns: true, person: { select: { fullName: true, birthDate: true, phonePrimary: true } }, referenceUnit: { select: { name: true } } }, take: 2000 });
    const from = period?.gte; const to = period?.lte;
    const rows = records.filter(r => {
      if (!r.person.birthDate) return false;
      const probe = (year: number) => new Date(year, r.person.birthDate!.getMonth(), r.person.birthDate!.getDate());
      if (from && to) { const y = from.getFullYear(); return [y - 1, y, y + 1].some(year => { const d = probe(year); return d >= from && d <= to; }); }
      return true;
    }).filter(r => match(`${r.person.fullName}`)).map(r => ({ Paciente: r.person.fullName, Nascimento: dateText(r.person.birthDate), CNS: r.cns || "Não informado", Telefone: r.person.phonePrimary || "Não informado", Unidade: r.referenceUnit?.name || "Não informada" }));
    return { rows, warnings: [] };
  }
  if (type === "AGENDA_REGISTRATIONS") {
    const records = await prisma.patient.findMany({ where: { ...(period ? { createdAt: period } : {}), ...(unitIds ? { referenceUnitId: { in: unitIds } } : {}) }, orderBy: { createdAt: "desc" }, select: { createdAt: true, cns: true, person: { select: { fullName: true } }, referenceUnit: { select: { name: true } } }, take: 2000 });
    return { rows: records.filter(r => match(r.person.fullName)).map(r => ({ Data: dateText(r.createdAt), Paciente: r.person.fullName, CNS: r.cns || "Não informado", Unidade: r.referenceUnit?.name || "Não informada" })), warnings: [] };
  }
  if (["AGENDA_BY_SPECIALTY", "AGENDA_BY_PROFESSIONAL", "AGENDA_QTY_UNIT", "AGENDA_MISSED", "AGENDA_QTY_VALUE"].includes(type)) {
    const records = await prisma.healthAppointment.findMany({ where: { ...(period ? { date: period } : {}), ...(unitIds ? { unitId: { in: unitIds } } : {}), ...(input.professionalId ? { professionalId: input.professionalId } : {}), ...(input.specialtyId ? { specialtyId: input.specialtyId } : {}), ...(type === "AGENDA_MISSED" ? { status: "Faltou" } : {}) }, include: { patient: { select: { person: { select: { fullName: true } } } }, unit: { select: { name: true } }, professional: { select: { specialty: true, employee: { select: { name: true } } } }, specialtyRef: { select: { name: true } } }, orderBy: { date: "desc" }, take: 2000 });
    if (type === "AGENDA_MISSED") return { rows: records.filter(r => match(r.patient.person.fullName)).map(r => ({ Data: dateText(r.date), Paciente: r.patient.person.fullName, Unidade: r.unit.name, Profissional: r.professional?.employee.name || "Não informado", Situação: r.status })), warnings: [] };
    if (type === "AGENDA_QTY_UNIT") {
      const grouped = new Map<string, { unit: string; count: number; missed: number }>();
      for (const r of records) { const g = grouped.get(r.unit.name) || { unit: r.unit.name, count: 0, missed: 0 }; g.count += 1; if (r.status === "Faltou") g.missed += 1; grouped.set(r.unit.name, g); }
      return { rows: [...grouped.values()].map(g => ({ Unidade: g.unit, Agendamentos: g.count, Faltas: g.missed })), warnings: [] };
    }
    if (type === "AGENDA_QTY_VALUE") {
      const grouped = new Map<string, number>();
      for (const r of records) grouped.set(r.status, (grouped.get(r.status) || 0) + 1);
      const total = [...grouped.values()].reduce((a, b) => a + b, 0);
      return { rows: [...grouped.entries()].map(([status, count]) => ({ Situação: status, Quantidade: count, Percentual: total ? `${(count / total * 100).toFixed(2)}%` : "0%" })), warnings: ["Valores dependem de vínculo com procedimento; use a Produção para valores."] };
    }
    if (type === "AGENDA_BY_SPECIALTY") {
      const grouped = new Map<string, number>();
      for (const r of records) { const key = r.specialtyRef?.name || r.specialty || "Não informada"; grouped.set(key, (grouped.get(key) || 0) + 1); }
      return { rows: [...grouped.entries()].map(([specialty, count]) => ({ Especialidade: specialty, Agendamentos: count })), warnings: [] };
    }
    const grouped = new Map<string, { professional: string; count: number; done: number }>();
    for (const r of records) { const name = r.professional?.employee.name || "Não informado"; const g = grouped.get(name) || { professional: name, count: 0, done: 0 }; g.count += 1; if (r.status === "Atendido") g.done += 1; grouped.set(name, g); }
    return { rows: [...grouped.values()].map(g => ({ Profissional: g.professional, Agendamentos: g.count, Atendidos: g.done })), warnings: [] };
  }
  if (["AGENDA_WAIT_BY_SCHEDULE", "AGENDA_WAIT_BY_SPECIALTY"].includes(type)) {
    const records = await prisma.healthWaitlist.findMany({ where: { ...(period ? { createdAt: period } : {}), ...(input.specialtyId ? { specialtyId: input.specialtyId } : {}), ...(unitIds ? { OR: [{ schedule: { unitId: { in: unitIds } } }, { patient: { referenceUnitId: { in: unitIds } } }] } : {}) }, include: { patient: { select: { person: { select: { fullName: true } } } }, specialty: { select: { name: true } }, schedule: { select: { unit: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 2000 });
    if (type === "AGENDA_WAIT_BY_SPECIALTY") {
      const grouped = new Map<string, number>();
      for (const r of records) { const key = r.specialty?.name || "Não informada"; grouped.set(key, (grouped.get(key) || 0) + 1); }
      return { rows: [...grouped.entries()].map(([specialty, count]) => ({ Especialidade: specialty, "Em espera": count })), warnings: [] };
    }
    return { rows: records.filter(r => match(r.patient.person.fullName)).map(r => ({ Entrada: dateText(r.createdAt), Paciente: r.patient.person.fullName, Especialidade: r.specialty?.name || "Não informada", Unidade: r.schedule?.unit.name || "Não informada", Prioridade: r.priority, Situação: r.status })), warnings: [] };
  }
  if (type === "AGENDA_STATS") {
    const [schedules, appointments, waitlist] = await Promise.all([
      prisma.healthCareSchedule.groupBy({ by: ["status"], where: { ...(unitIds ? { unitId: { in: unitIds } } : {}) }, _count: true }),
      prisma.healthAppointment.groupBy({ by: ["status"], where: { ...(period ? { date: period } : {}), ...(unitIds ? { unitId: { in: unitIds } } : {}) }, _count: true }),
      prisma.healthWaitlist.groupBy({ by: ["status"], where: { ...(unitIds ? { OR: [{ schedule: { unitId: { in: unitIds } } }, { patient: { referenceUnitId: { in: unitIds } } }] } : {}) }, _count: true }),
    ]);
    const rows = [
      ...schedules.map(s => ({ Grupo: "Cronogramas", Categoria: s.status, Quantidade: s._count })),
      ...appointments.map(s => ({ Grupo: "Agendamentos", Categoria: s.status, Quantidade: s._count })),
      ...waitlist.map(s => ({ Grupo: "Espera", Categoria: s.status, Quantidade: s._count })),
    ];
    const total = rows.reduce((a, r) => a + r.Quantidade, 0);
    return { rows, chart: rows.map(r => ({ label: `${r.Grupo} · ${r.Categoria}`, value: r.Quantidade, percentage: total ? r.Quantidade / total * 100 : 0 })), warnings: [] };
  }
  if (type === "AGENDA_MAPS") {
    const records = await prisma.healthAppointment.findMany({ where: { ...(period ? { date: period } : {}), ...(unitIds ? { unitId: { in: unitIds } } : {}) }, select: { status: true, priority: true, visitType: true, unit: { select: { name: true } }, specialtyRef: { select: { name: true } }, professional: { select: { employee: { select: { name: true } } } } }, take: 5000 });
    const byStatus = new Map<string, number>(); const byUnit = new Map<string, number>(); const bySpecialty = new Map<string, number>(); const byPriority = new Map<string, number>();
    for (const r of records) {
      byStatus.set(r.status, (byStatus.get(r.status) || 0) + 1);
      byUnit.set(r.unit.name, (byUnit.get(r.unit.name) || 0) + 1);
      const spec = r.specialtyRef?.name || "Não informada"; bySpecialty.set(spec, (bySpecialty.get(spec) || 0) + 1);
      byPriority.set(r.priority, (byPriority.get(r.priority) || 0) + 1);
    }
    return {
      rows: [
        ...[...byStatus.entries()].map(([k, v]) => ({ Mapa: "Por situação", Categoria: k, Quantidade: v })),
        ...[...byUnit.entries()].map(([k, v]) => ({ Mapa: "Por unidade", Categoria: k, Quantidade: v })),
        ...[...bySpecialty.entries()].map(([k, v]) => ({ Mapa: "Por especialidade", Categoria: k, Quantidade: v })),
        ...[...byPriority.entries()].map(([k, v]) => ({ Mapa: "Por prioridade", Categoria: k, Quantidade: v })),
      ], warnings: [],
    };
  }
  if (["AGENDA_SCHEDULE_FIXED", "AGENDA_SCHEDULE_DAILY"].includes(type)) {
    const kind = type === "AGENDA_SCHEDULE_FIXED" ? "FIXO" : "DIARIO";
    const records = await prisma.healthCareSchedule.findMany({ where: { kind, ...(unitIds ? { unitId: { in: unitIds } } : {}) }, include: { unit: { select: { name: true } }, specialty: { select: { name: true } }, professional: { select: { employee: { select: { name: true } } } }, appointments: { where: { status: { in: ["Agendado", "Confirmado", "Aguardando", "Em Atendimento"] } }, select: { id: true } } }, orderBy: [{ date: "asc" }, { weekday: "asc" }], take: 2000 });
    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return { rows: records.map(r => ({ Unidade: r.unit.name, Especialidade: r.specialty?.name || "Não informada", Profissional: r.professional?.employee.name || "Não informado", Quando: r.date ? dateText(r.date) : r.weekday !== null && r.weekday !== undefined ? `Toda ${weekdays[r.weekday]}` : "Não informado", Horário: [r.startTime, r.endTime].filter(Boolean).join("–") || "Não informado", Vagas: r.totalSlots, Ocupadas: r.appointments.length, Disponíveis: r.totalSlots - r.appointments.length, Situação: r.status })), warnings: [] };
  }
  if (type === "AGENDA_AUDIT") {
    const records = await prisma.auditEvent.findMany({ where: { targetType: "HEALTH_APPOINTMENT", ...(period ? { createdAt: period } : {}) }, orderBy: { createdAt: "desc" }, take: 2000, select: { eventType: true, targetId: true, createdAt: true, actorUsuario: { select: { nome: true } } } });
    return { rows: records.map(r => ({ Data: dateText(r.createdAt), Evento: r.eventType, Agendamento: r.targetId, Autor: r.actorUsuario.nome })), warnings: [] };
  }
  if (type === "AGENDA_TRIAGE_PROF") {
    const records = await prisma.healthTriage.findMany({ where: { ...(period ? { createdAt: period } : {}), ...(unitIds ? { appointment: { unitId: { in: unitIds } } } : {}), ...(input.professionalId ? { professionalId: input.professionalId } : {}) }, include: { professional: { select: { employee: { select: { name: true } } } }, appointment: { select: { unit: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 2000 });
    return { rows: records.filter(r => match(r.professional.employee.name)).map(r => ({ Data: dateText(r.createdAt), Profissional: r.professional.employee.name, Unidade: r.appointment.unit.name, Risco: r.riskClassification || "Não informado" })), warnings: [] };
  }

  // ---------- PRODUÇÃO (estatísticas sobre fatos) ----------
  if (type.startsWith("PRODSTAT_")) {
    const facts = await prisma.healthProductionFact.findMany({ where: { ...(input.unitId ? { unitId: input.unitId } : unitIds ? { unitId: { in: unitIds } } : {}), ...(input.professionalId ? { professionalId: input.professionalId } : {}), ...(input.procedure ? { procedure: { OR: [{ code: { contains: input.procedure, mode: "insensitive" } }, { description: { contains: input.procedure, mode: "insensitive" } }] } } : {}), ...(input.cid ? { cidReference: { OR: [{ code: { contains: input.cid, mode: "insensitive" } }] } } : {}), ...(input.municipality ? { municipality: { contains: input.municipality, mode: "insensitive" } } : {}) }, include: { procedure: { select: { code: true, description: true, financing: true } }, professional: { select: { cbo: true, employee: { select: { name: true } } } }, unit: { select: { name: true } }, cidReference: { select: { code: true } }, patient: { select: { person: { select: { gender: true, birthDate: true } } } } }, orderBy: { occurredAt: "desc" }, take: 5000 });
    const withChart = (rows: ReportRow[]) => {
      const total = rows.reduce((a, r) => a + Number(r.Quantidade || 0), 0);
      return { rows, warnings: [] as string[], chart: ["PRODSTAT_CHART_PROC", "PRODSTAT_CHART_VALUES", "PRODSTAT_CHART_UNIT", "PRODSTAT_CHART_CBO"].includes(type) ? rows.slice(0, 20).map(r => ({ label: String(r[Object.keys(r)[0]]), value: Number(r.Quantidade || 0), percentage: total ? Number(r.Quantidade || 0) / total * 100 : 0 })) : undefined };
    };
    if (type === "PRODSTAT_CID") {
      const grouped = new Map<string, number>();
      for (const f of facts) { const key = f.cidReference?.code || "Sem CID"; grouped.set(key, (grouped.get(key) || 0) + f.quantity); }
      return withChart([...grouped.entries()].map(([cid, count]) => ({ CID: cid, Quantidade: count })));
    }
    if (["PRODSTAT_CBO", "PRODSTAT_CHART_CBO"].includes(type)) {
      const grouped = new Map<string, number>();
      for (const f of facts) { const key = f.professional?.cbo || "Sem CBO"; grouped.set(key, (grouped.get(key) || 0) + f.quantity); }
      return withChart([...grouped.entries()].map(([cbo, count]) => ({ CBO: cbo, Quantidade: count })));
    }
    if (type === "PRODSTAT_PROC_COMP") {
      const grouped = new Map<string, { procedure: string; period: string; count: number }>();
      for (const f of facts) { const key = `${f.procedure?.code || "Sem procedimento"}|${f.period}`; const g = grouped.get(key) || { procedure: f.procedure?.code || "Sem procedimento", period: f.period, count: 0 }; g.count += f.quantity; grouped.set(key, g); }
      return withChart([...grouped.values()].map(g => ({ Procedimento: g.procedure, Competência: g.period, Quantidade: g.count })));
    }
    if (["PRODSTAT_PROF_UNIT", "PRODSTAT_ATT_PROF"].includes(type)) {
      const grouped = new Map<string, number>();
      for (const f of facts) { const key = `${f.professional?.employee.name || "Sem profissional"}|${f.unit?.name || "Sem unidade"}`; grouped.set(key, (grouped.get(key) || 0) + f.quantity); }
      return withChart([...grouped.entries()].map(([key, count]) => { const [professional, unit] = key.split("|"); return { Profissional: professional, Unidade: unit, Quantidade: count }; }));
    }
    if (["PRODSTAT_UNIT", "PRODSTAT_CHART_UNIT"].includes(type)) {
      const grouped = new Map<string, number>();
      for (const f of facts) { const key = f.unit?.name || "Sem unidade"; grouped.set(key, (grouped.get(key) || 0) + f.quantity); }
      return withChart([...grouped.entries()].map(([unit, count]) => ({ Unidade: unit, Quantidade: count })));
    }
    if (["PRODSTAT_VALUES", "PRODSTAT_CHART_VALUES"].includes(type)) {
      const grouped = new Map<string, { period: string; count: number; value: number }>();
      for (const f of facts) { const g = grouped.get(f.period) || { period: f.period, count: 0, value: 0 }; g.count += f.quantity; g.value += f.value != null ? Number(f.value) : 0; grouped.set(f.period, g); }
      return withChart([...grouped.values()].sort((a, b) => a.period.localeCompare(b.period)).map(g => ({ Competência: g.period, Quantidade: g.count, Valor: g.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) })));
    }
    if (type === "PRODSTAT_FINANCING") {
      const grouped = new Map<string, number>();
      for (const f of facts) { const key = f.procedure?.financing || "Não informado"; grouped.set(key, (grouped.get(key) || 0) + f.quantity); }
      return withChart([...grouped.entries()].map(([financing, count]) => ({ Financiamento: financing, Quantidade: count })));
    }
    if (type === "PRODSTAT_EXAMS") {
      const filtered = facts.filter(f => f.originType === "LAB_RESULT");
      const grouped = new Map<string, number>();
      for (const f of filtered) { const key = f.procedure?.code || "Sem procedimento"; grouped.set(key, (grouped.get(key) || 0) + f.quantity); }
      return withChart([...grouped.entries()].map(([procedure, count]) => ({ Exame: procedure, Quantidade: count })));
    }
    if (["PRODSTAT_PROC_GENERAL", "PRODSTAT_CHART_PROC"].includes(type)) {
      const grouped = new Map<string, { code: string; description: string; count: number }>();
      for (const f of facts) { const key = f.procedure?.code || "Sem procedimento"; const g = grouped.get(key) || { code: key, description: f.procedure?.description || "", count: 0 }; g.count += f.quantity; grouped.set(key, g); }
      return withChart([...grouped.values()].sort((a, b) => b.count - a.count).map(g => ({ Procedimento: g.code, Descrição: g.description, Quantidade: g.count })));
    }
    if (type === "PRODSTAT_SEX") {
      const grouped = new Map<string, number>();
      for (const f of facts) { const key = f.patient?.person.gender || "Não informado"; grouped.set(key, (grouped.get(key) || 0) + f.quantity); }
      return withChart([...grouped.entries()].map(([sex, count]) => ({ Sexo: sex, Quantidade: count })));
    }
    if (type === "PRODSTAT_AGE") {
      const grouped = new Map<string, number>();
      for (const f of facts) { const key = ageBracket(f.patient?.person.birthDate, f.occurredAt); grouped.set(key, (grouped.get(key) || 0) + f.quantity); }
      return withChart([...grouped.entries()].map(([bracket, count]) => ({ Faixa: bracket, Quantidade: count })));
    }
    if (type === "PRODSTAT_TYPED") {
      const filtered = facts.filter(f => f.originType === "MANUAL");
      if (!filtered.length) return { rows: [], warnings: ["Nenhum fato de digitação manual no recorte."] };
      return withChart(filtered.map(f => ({ Data: dateText(f.occurredAt), Procedimento: f.procedure?.code || "Sem procedimento", Unidade: f.unit?.name || "Não informada", Quantidade: f.quantity })));
    }
    // PRODSTAT_INDIVIDUAL
    return withChart(facts.slice(0, 2000).map(f => ({ Data: dateText(f.occurredAt), Origem: f.originType, Procedimento: f.procedure?.code || "Sem procedimento", Profissional: f.professional?.employee.name || "Não informado", Unidade: f.unit?.name || "Não informada", Quantidade: f.quantity, Situação: f.status })));
  }

  // ---------- PA ----------
  if (type === "PAREP_ATTENDED") {
    const records = await prisma.medicalRecord.findMany({ where: { completedAt: { not: null }, ...(period ? { date: period } : {}), ...(unitIds ? { unitId: { in: unitIds } } : {}), ...(input.professionalId ? { professionalId: input.professionalId } : {}) }, include: { patient: { select: { person: { select: { fullName: true } } } }, unit: { select: { name: true } }, professional: { select: { employee: { select: { name: true } } } } }, orderBy: { date: "desc" }, take: 2000 });
    return { rows: records.filter(r => match(r.patient.person.fullName)).map(r => ({ Data: dateText(r.date), Paciente: r.patient.person.fullName, Tipo: r.type, Profissional: r.professional.employee.name, Unidade: r.unit.name, Desfecho: r.outcome || "Não informado" })), warnings: [] };
  }
  if (type === "PAREP_PROC_DAY") {
    const records = await prisma.healthPerformedProcedure.findMany({ where: { ...(period ? { performedAt: period } : {}), ...(unitIds ? { medicalRecord: { unitId: { in: unitIds } } } : {}) }, include: { procedure: { select: { code: true, description: true } }, medicalRecord: { select: { unit: { select: { name: true } } } } }, orderBy: { performedAt: "desc" }, take: 2000 });
    const triages = await prisma.healthTriage.count({ where: { ...(period ? { createdAt: period } : {}), ...(unitIds ? { appointment: { unitId: { in: unitIds } } } : {}) } });
    return { rows: records.map(r => ({ Data: dateText(r.performedAt), Procedimento: r.procedure.code, Unidade: r.medicalRecord.unit.name, Quantidade: r.quantity })), warnings: [`Triagens no período: ${triages}.`] };
  }
  if (["PAREP_BILLED", "PAREP_UNBILLED"].includes(type)) {
    const valid = type === "PAREP_BILLED";
    const facts = await prisma.healthProductionFact.findMany({ where: { status: valid ? "VALIDO" : "CRITICADO", ...(unitIds ? { unitId: { in: unitIds } } : {}) }, include: { procedure: { select: { code: true } }, unit: { select: { name: true } } }, orderBy: { occurredAt: "desc" }, take: 2000 });
    return { rows: facts.map(f => ({ Data: dateText(f.occurredAt), Procedimento: f.procedure?.code || "Sem procedimento", Unidade: f.unit?.name || "Não informada", Quantidade: f.quantity, Situação: f.status })), warnings: [] };
  }
  if (type === "PAREP_PROF_HOUR") {
    const records = await prisma.medicalRecord.findMany({ where: { completedAt: { not: null }, ...(period ? { date: period } : {}), ...(unitIds ? { unitId: { in: unitIds } } : {}) }, select: { date: true, professional: { select: { employee: { select: { name: true } } } } }, take: 5000 });
    const grouped = new Map<string, number>();
    for (const r of records) { const key = `${r.professional.employee.name}|${String(r.date.getHours()).padStart(2, "0")}h`; grouped.set(key, (grouped.get(key) || 0) + 1); }
    return { rows: [...grouped.entries()].map(([key, count]) => { const [professional, hour] = key.split("|"); return { Profissional: professional, Hora: hour, Atendimentos: count }; }), warnings: [] };
  }
  if (type === "PAREP_TRIAGE") {
    const records = await prisma.healthTriage.findMany({ where: { ...(period ? { createdAt: period } : {}), ...(unitIds ? { appointment: { unitId: { in: unitIds } } } : {}) }, include: { appointment: { select: { unit: { select: { name: true } }, patient: { select: { person: { select: { fullName: true } } } } } } }, orderBy: { createdAt: "desc" }, take: 2000 });
    return { rows: records.filter(r => match(r.appointment.patient.person.fullName)).map(r => ({ Data: dateText(r.createdAt), Paciente: r.appointment.patient.person.fullName, Unidade: r.appointment.unit.name, Risco: r.riskClassification || "Não informado", Queixa: (r.chiefComplaint || "").slice(0, 120) })), warnings: [] };
  }

  // ---------- PEP ----------
  if (["PEPREP_ATT_PROF", "PEPREP_CONSULT_QTY"].includes(type)) {
    const records = await prisma.medicalRecord.findMany({ where: { completedAt: { not: null }, ...(period ? { date: period } : {}), ...(unitIds ? { unitId: { in: unitIds } } : {}), ...(input.professionalId ? { professionalId: input.professionalId } : {}) }, include: { professional: { select: { employee: { select: { name: true } } } }, unit: { select: { name: true } } }, orderBy: { date: "desc" }, take: 2000 });
    const grouped = new Map<string, { professional: string; unit: string; count: number }>();
    for (const r of records) { const key = `${r.professional.employee.name}|${r.unit.name}`; const g = grouped.get(key) || { professional: r.professional.employee.name, unit: r.unit.name, count: 0 }; g.count += 1; grouped.set(key, g); }
    return { rows: [...grouped.values()].map(g => ({ Profissional: g.professional, Unidade: g.unit, Atendimentos: g.count })), warnings: [] };
  }
  if (type === "PEPREP_PROC_PAT") {
    const records = await prisma.healthPerformedProcedure.findMany({ where: { ...(period ? { performedAt: period } : {}), ...(unitIds ? { medicalRecord: { unitId: { in: unitIds } } } : {}), ...(input.professionalId ? { professionalId: input.professionalId } : {}) }, include: { procedure: { select: { code: true } }, professional: { select: { employee: { select: { name: true } } } }, medicalRecord: { select: { patient: { select: { person: { select: { fullName: true } } } } } } }, orderBy: { performedAt: "desc" }, take: 2000 });
    return { rows: records.filter(r => match(r.medicalRecord.patient.person.fullName)).map(r => ({ Data: dateText(r.performedAt), Paciente: r.medicalRecord.patient.person.fullName, Procedimento: r.procedure.code, Profissional: r.professional.employee.name, Quantidade: r.quantity })), warnings: [] };
  }
  if (type === "PEPREP_PROC_QTY") {
    const records = await prisma.healthPerformedProcedure.findMany({ where: { ...(period ? { performedAt: period } : {}), ...(unitIds ? { medicalRecord: { unitId: { in: unitIds } } } : {}), ...(input.professionalId ? { professionalId: input.professionalId } : {}) }, include: { procedure: { select: { code: true } }, medicalRecord: { select: { unit: { select: { name: true } } } }, professional: { select: { employee: { select: { name: true } } } } }, take: 5000 });
    const grouped = new Map<string, number>();
    for (const r of records) grouped.set(`${r.procedure.code}|${r.medicalRecord.unit.name}|${r.professional.employee.name}`, (grouped.get(`${r.procedure.code}|${r.medicalRecord.unit.name}|${r.professional.employee.name}`) || 0) + r.quantity);
    return { rows: [...grouped.entries()].map(([key, count]) => { const [procedure, unit, professional] = key.split("|"); return { Procedimento: procedure, Unidade: unit, Profissional: professional, Quantidade: count }; }), warnings: [] };
  }
  if (type === "PEPREP_EXAM_MED") {
    const records = await prisma.healthExamRequest.findMany({ where: { ...(period ? { date: period } : {}), ...(unitIds ? { unitId: { in: unitIds } } : {}), ...(input.professionalId ? { professionalId: input.professionalId } : {}) }, include: { professional: { select: { employee: { select: { name: true } } } } }, orderBy: { date: "desc" }, take: 2000 });
    return { rows: records.filter(r => match(r.examName)).map(r => ({ Data: dateText(r.date), Exame: r.examName, Médico: r.professional.employee.name, Situação: r.status })), warnings: [] };
  }

  // ---------- LAB (recortes) ----------
  if (type.startsWith("LABREP_")) {
    const records = await prisma.healthLabOrder.findMany({ where: { ...(period ? { createdAt: period } : {}), ...(unitIds ? { OR: [{ requestUnitId: { in: unitIds } }, { collectionUnitId: { in: unitIds } }] } : {}) }, include: { patient: { include: { person: { select: { fullName: true } } } }, examRequest: { select: { examName: true } }, examModel: { select: { name: true, procedure: { select: { code: true, unitValue: true } } } }, requestUnit: { select: { name: true } }, collectionUnit: { select: { name: true } }, results: { select: { status: true } }, reports: { select: { id: true } } }, orderBy: { createdAt: "desc" }, take: 2000 });
    const examOf = (r: (typeof records)[number]) => r.examRequest?.examName || r.examModel?.name || "Não informado";
    const filtered = records.filter(r => match(`${r.patient.person.fullName} ${examOf(r)}`));
    if (type === "LABREP_DAILY") {
      const grouped = new Map<string, { date: string; exam: string; scheduled: number; collected: number }>();
      for (const r of filtered) { const key = `${r.createdAt.toISOString().slice(0, 10)}|${examOf(r)}`; const g = grouped.get(key) || { date: r.createdAt.toISOString().slice(0, 10), exam: examOf(r), scheduled: 0, collected: 0 }; g.scheduled += 1; if (r.collectedAt) g.collected += 1; grouped.set(key, g); }
      return { rows: [...grouped.values()].map(g => ({ Dia: g.date, Exame: g.exam, Agendados: g.scheduled, Coletados: g.collected })), warnings: [] };
    }
    if (type === "LABREP_QTY") {
      const grouped = new Map<string, number>();
      for (const r of filtered) grouped.set(examOf(r), (grouped.get(examOf(r)) || 0) + 1);
      return { rows: [...grouped.entries()].map(([exam, count]) => ({ Exame: exam, Quantidade: count })), warnings: [] };
    }
    if (type === "LABREP_PCT") {
      const total = filtered.length || 1;
      const grouped = new Map<string, number>();
      for (const r of filtered) grouped.set(examOf(r), (grouped.get(examOf(r)) || 0) + 1);
      return { rows: [...grouped.entries()].map(([exam, count]) => ({ Exame: exam, Quantidade: count, Percentual: `${(count / total * 100).toFixed(2)}%` })), warnings: [] };
    }
    if (type === "LABREP_FIXED") {
      const grouped = new Map<string, { unit: string; exam: string; count: number }>();
      for (const r of filtered) { const key = `${r.collectionUnit?.name || "Sem coleta"}|${examOf(r)}`; const g = grouped.get(key) || { unit: r.collectionUnit?.name || "Sem coleta", exam: examOf(r), count: 0 }; g.count += 1; grouped.set(key, g); }
      return { rows: [...grouped.values()].map(g => ({ Unidade: g.unit, Exame: g.exam, Quantidade: g.count })), warnings: [] };
    }
    if (["LABREP_COLLECTION_UNIT", "LABREP_REQUEST_UNIT"].includes(type)) {
      const byCollection = type === "LABREP_COLLECTION_UNIT";
      const grouped = new Map<string, number>();
      for (const r of filtered) { const key = (byCollection ? r.collectionUnit?.name : r.requestUnit?.name) || "Não informada"; grouped.set(key, (grouped.get(key) || 0) + 1); }
      return { rows: [...grouped.entries()].map(([unit, count]) => ({ Unidade: unit, Quantidade: count })), warnings: [] };
    }
    if (type === "LABREP_PATIENT") {
      const grouped = new Map<string, { patient: string; exams: Set<string>; count: number }>();
      for (const r of filtered) { const g = grouped.get(r.patient.person.fullName) || { patient: r.patient.person.fullName, exams: new Set<string>(), count: 0 }; g.exams.add(examOf(r)); g.count += 1; grouped.set(r.patient.person.fullName, g); }
      return { rows: [...grouped.values()].map(g => ({ Paciente: g.patient, Exames: [...g.exams].join(", "), Quantidade: g.count })), warnings: [] };
    }
    if (type === "LABREP_RESULT") {
      const withResult = filtered.filter(r => r.results.some(result => result.status === "FINAL"));
      return { rows: withResult.map(r => ({ Paciente: r.patient.person.fullName, Exame: examOf(r), Coleta: r.collectionUnit?.name || "Não informada", Laudos: r.reports.length })), warnings: [] };
    }
    if (type === "LABREP_DECL") {
      return { rows: filtered.map(r => ({ Solicitação: dateText(r.createdAt), Paciente: r.patient.person.fullName, Exame: examOf(r), Coleta: r.collectionUnit?.name || "Não informada", Etapa: r.status })), warnings: ["Declaração para impressão a partir dos dados da solicitação/coleta."] };
    }
    if (type === "LABREP_COVID") {
      const covid = filtered.filter(r => examOf(r).toLocaleLowerCase("pt-BR").includes("covid") || examOf(r).toLocaleLowerCase("pt-BR").includes("sars"));
      return { rows: covid.map(r => ({ Paciente: r.patient.person.fullName, Exame: examOf(r), Resultado: r.results.some(result => result.status === "FINAL") ? "Com resultado" : "Sem resultado final" })), warnings: ["Recorte por nome do exame; sem marcador específico de COVID no cadastro."] };
    }
    if (type === "LABREP_COST") {
      const grouped = new Map<string, { patient: string; exams: number; value: number }>();
      for (const r of filtered) { const g = grouped.get(r.patient.person.fullName) || { patient: r.patient.person.fullName, exams: 0, value: 0 }; g.exams += 1; g.value += r.examModel?.procedure?.unitValue != null ? Number(r.examModel.procedure.unitValue) : 0; grouped.set(r.patient.person.fullName, g); }
      return { rows: [...grouped.values()].map(g => ({ Paciente: g.patient, Exames: g.exams, Valor: g.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) })), warnings: ["Valores de referência da tabela de procedimentos."] };
    }
    if (type === "LABREP_PRICES") {
      const records = await prisma.healthSusProcedure.findMany({ where: { isCurrent: true, isActive: true }, orderBy: { code: "asc" }, take: 2000, select: { code: true, description: true, unitValue: true, financing: true } });
      return { rows: records.map(r => ({ Código: r.code, Procedimento: r.description, Valor: moneyText(r.unitValue), Financiamento: r.financing || "Não informado" })), warnings: [] };
    }
    // LABREP_MAPTECH
    const grouped = new Map<string, { date: string; exam: string; unit: string; count: number }>();
    for (const r of filtered) { const key = `${r.scheduledAt ? r.scheduledAt.toISOString().slice(0, 10) : "sem agenda"}|${examOf(r)}|${r.collectionUnit?.name || "Sem coleta"}`; const g = grouped.get(key) || { date: r.scheduledAt ? r.scheduledAt.toISOString().slice(0, 10) : "sem agenda", exam: examOf(r), unit: r.collectionUnit?.name || "Sem coleta", count: 0 }; g.count += 1; grouped.set(key, g); }
    return { rows: [...grouped.values()].map(g => ({ Data: g.date, Exame: g.exam, Coleta: g.unit, Quantidade: g.count })), warnings: [] };
  }

  // ---------- REGULAÇÃO ----------
  if (type.startsWith("REGREP_")) {
    const requests = await prisma.healthRegulationRequest.findMany({ where: { ...(period ? { createdAt: period } : {}), ...(unitIds ? { requestUnitId: { in: unitIds } } : {}), ...(input.professionalId ? { professionalId: input.professionalId } : {}), ...(input.status && ["RECEBIDA", "EM_ANALISE", "AUTORIZADA", "AGENDADA", "EXECUTADA", "CONCLUIDA", "DEVOLVIDA", "CANCELADA", "ARQUIVADA"].includes(input.status) ? { status: input.status } : {}) }, include: { patient: { include: { person: { select: { fullName: true, addresses: { orderBy: { createdAt: "asc" }, take: 1, select: { neighborhood: { select: { city: true } } } } } } } }, specialty: { select: { name: true } }, service: { select: { name: true } }, requestUnit: { select: { name: true } }, quota: { select: { providerSupplierId: true, unitValue: true, provider: { select: { person: { select: { fullName: true } }, company: { select: { corporateName: true } } } } } } }, orderBy: { createdAt: "desc" }, take: 2000 });
    const filtered = requests.filter(r => match(`${r.patient.person.fullName} ${r.guideNumber || ""}`));
    const providerName = (r: (typeof requests)[number]) => r.quota?.provider.company?.corporateName || r.quota?.provider.person?.fullName || "Municipal";
    if (type === "REGREP_REQUESTS") return { rows: filtered.map(r => ({ Data: dateText(r.createdAt), Paciente: r.patient.person.fullName, Unidade: r.requestUnit?.name || "Não informada", Serviço: r.specialty?.name || r.service?.name || "Não informado", Prioridade: r.priority, Situação: r.status, Guia: r.guideNumber || "-" })), warnings: [] };
    if (type === "REGREP_WAIT") return { rows: filtered.filter(r => ["RECEBIDA", "EM_ANALISE"].includes(r.status)).map(r => ({ Data: dateText(r.createdAt), Paciente: r.patient.person.fullName, Serviço: r.specialty?.name || r.service?.name || "Não informado", Prioridade: r.priority, Situação: r.status })), warnings: [] };
    if (type === "REGREP_URGENT") return { rows: filtered.filter(r => r.priority === "Alta" && !["EXECUTADA", "CONCLUIDA", "CANCELADA", "ARQUIVADA"].includes(r.status)).map(r => ({ Data: dateText(r.createdAt), Paciente: r.patient.person.fullName, Serviço: r.specialty?.name || r.service?.name || "Não informado", Situação: r.status })), warnings: [] };
    if (type === "REGREP_PATIENT") {
      const grouped = new Map<string, { patient: string; city: string; count: number }>();
      for (const r of filtered) { const city = r.patient.person.addresses[0]?.neighborhood?.city || "Não informado"; const key = `${r.patient.person.fullName}|${city}`; const g = grouped.get(key) || { patient: r.patient.person.fullName, city, count: 0 }; g.count += 1; grouped.set(key, g); }
      return { rows: [...grouped.values()].map(g => ({ Paciente: g.patient, Município: g.city, Solicitações: g.count })), warnings: [] };
    }
    if (type === "REGREP_COST") {
      const grouped = new Map<string, { provider: string; count: number; value: number }>();
      for (const r of filtered.filter(r => r.quota)) { const key = providerName(r); const g = grouped.get(key) || { provider: key, count: 0, value: 0 }; g.count += 1; g.value += r.quota?.unitValue != null ? Number(r.quota.unitValue) : 0; grouped.set(key, g); }
      return { rows: [...grouped.values()].map(g => ({ Prestador: g.provider, Guias: g.count, Valor: g.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) })), warnings: [] };
    }
    if (type === "REGREP_TRIPS" || type === "REGREP_TRANSPORT") {
      const trips = await prisma.healthTfdTrip.findMany({ where: period ? { date: { gte: period.gte, lt: period.lte } } : {}, include: { fleetUnit: { select: { name: true, plate: true } }, driverEmployee: { select: { name: true } }, passengers: { select: { id: true } } }, orderBy: { date: "desc" }, take: 2000 });
      return { rows: trips.map(t => ({ Data: dateText(t.date), Origem: t.origin, Destino: t.destination, Veículo: `${t.fleetUnit.name}${t.fleetUnit.plate ? ` · ${t.fleetUnit.plate}` : ""}`, Condutor: t.driverEmployee?.name || "Não informado", Passageiros: t.passengers.length, Capacidade: t.capacity, Situação: t.status })), warnings: [] };
    }
    if (type === "REGREP_AUDIT") {
      const events = await prisma.healthRegulationEvent.findMany({ where: { ...(period ? { createdAt: period } : {}), ...(unitIds ? { request: { requestUnitId: { in: unitIds } } } : {}) }, orderBy: { createdAt: "desc" }, take: 2000, select: { eventType: true, fromStatus: true, toStatus: true, notes: true, createdAt: true, request: { select: { patient: { select: { person: { select: { fullName: true } } } } } } } });
      return { rows: events.map(e => ({ Data: dateText(e.createdAt), Paciente: e.request.patient.person.fullName, Evento: e.eventType, De: e.fromStatus, Para: e.toStatus, Observação: e.notes || "" })), warnings: [] };
    }
    if (type === "REGREP_QTY") {
      const grouped = new Map<string, number>();
      for (const r of filtered) grouped.set(r.status, (grouped.get(r.status) || 0) + 1);
      return { rows: [...grouped.entries()].map(([status, count]) => ({ Situação: status, Quantidade: count })), warnings: [] };
    }
    if (type === "REGREP_THIRD") {
      const quotas = await prisma.healthRegulationQuota.findMany({ where: { ...(unitIds ? { unitId: { in: unitIds } } : {}) }, include: { provider: { select: { person: { select: { fullName: true } }, company: { select: { corporateName: true } } } }, unit: { select: { name: true } }, specialty: { select: { name: true } } }, orderBy: { period: "desc" }, take: 2000 });
      return { rows: quotas.map(q => ({ Prestador: q.provider.company?.corporateName || q.provider.person?.fullName || "Não informado", Unidade: q.unit?.name || "Todas", Especialidade: q.specialty?.name || "Todas", Período: q.period, Total: q.totalQuantity, Reservado: q.reservedQuantity, Realizado: q.realizedQuantity, Disponível: q.totalQuantity - q.reservedQuantity - q.realizedQuantity })), warnings: [] };
    }
    if (type === "REGREP_EXAMS" || type === "REGREP_EXAMS_QUEUE" || type === "REGREP_SCHED_SVC") {
      const grouped = new Map<string, { service: string; scheduled: number; waiting: number }>();
      for (const r of filtered) { const key = r.specialty?.name || r.service?.name || "Não informado"; const g = grouped.get(key) || { service: key, scheduled: 0, waiting: 0 }; if (r.status === "AGENDADA") g.scheduled += 1; if (["RECEBIDA", "EM_ANALISE", "AUTORIZADA"].includes(r.status)) g.waiting += 1; grouped.set(key, g); }
      return { rows: [...grouped.values()].map(g => ({ Serviço: g.service, Agendados: g.scheduled, Aguardando: g.waiting })), warnings: [] };
    }
    if (type === "REGREP_REQUEST_UNIT") {
      const grouped = new Map<string, { unit: string; open: number; done: number }>();
      for (const r of filtered) { const key = r.requestUnit?.name || "Não informada"; const g = grouped.get(key) || { unit: key, open: 0, done: 0 }; if (["EXECUTADA", "CONCLUIDA"].includes(r.status)) g.done += 1; else if (!["CANCELADA", "ARQUIVADA"].includes(r.status)) g.open += 1; grouped.set(key, g); }
      return { rows: [...grouped.values()].map(g => ({ Unidade: g.unit, "Em aberto": g.open, Realizadas: g.done })), warnings: [] };
    }
    if (type === "REGREP_STATS") {
      const grouped = new Map<string, number>();
      for (const r of filtered) { const key = r.specialty?.name || r.service?.name || "Não informado"; grouped.set(key, (grouped.get(key) || 0) + 1); }
      const total = [...grouped.values()].reduce((a, b) => a + b, 0);
      return { rows: [...grouped.entries()].sort((a, b) => b[1] - a[1]).map(([service, count]) => ({ Serviço: service, Solicitações: count, Percentual: total ? `${(count / total * 100).toFixed(2)}%` : "0%" })), warnings: [] };
    }
    // REGREP_FIN
    const grouped = new Map<string, { provider: string; guides: number; value: number }>();
    for (const r of filtered.filter(r => r.quota)) { const key = providerName(r); const g = grouped.get(key) || { provider: key, guides: 0, value: 0 }; g.guides += 1; g.value += r.quota?.unitValue != null ? Number(r.quota.unitValue) : 0; grouped.set(key, g); }
    return { rows: [...grouped.values()].map(g => ({ Prestador: g.provider, Guias: g.guides, Valor: g.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) })), warnings: [] };
  }

  // ---------- SISAB ----------
  if (type.startsWith("SISREP_")) {
    const forms = await prisma.healthEsusForm.findMany({ where: { ...(period ? { createdAt: period } : {}), ...(unitIds ? { unitId: { in: unitIds } } : {}), ...(input.professionalId ? { professionalId: input.professionalId } : {}), ...(input.teamId ? { teamId: input.teamId } : {}) }, include: { patient: { select: { person: { select: { fullName: true } } } }, person: { select: { fullName: true } }, professional: { select: { id: true } }, team: { select: { name: true } }, unit: { select: { name: true } }, household: { select: { householdCode: true } }, family: { select: { familyCode: true } } }, orderBy: { createdAt: "desc" }, take: 2000 });
    const citizenOf = (f: (typeof forms)[number]) => f.patient?.person.fullName || f.person?.fullName || "-";
    const filtered = forms.filter(f => match(`${citizenOf(f)} ${f.kind}`));
    if (type === "SISREP_EXPORT") {
      const batches = await prisma.healthEsusBatch.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { competence: true, status: true, total: true, accepted: true, rejected: true, createdAt: true } });
      return { rows: batches.map(b => ({ Competência: b.competence, Total: b.total, Aceitos: b.accepted, Rejeitados: b.rejected, Situação: b.status, Data: dateText(b.createdAt) })), warnings: [] };
    }
    if (["SISREP_AGENTS", "SISREP_PROF"].includes(type)) {
      const grouped = new Map<string, { professional: string; team: string; count: number }>();
      for (const f of filtered) { const key = `${f.professionalId || "-"}|${f.team?.name || "-"}`; const g = grouped.get(key) || { professional: f.professionalId || "Não informado", team: f.team?.name || "Não informada", count: 0 }; g.count += 1; grouped.set(key, g); }
      return { rows: [...grouped.values()].map(g => ({ Profissional: g.professional, Equipe: g.team, Fichas: g.count })), warnings: [] };
    }
    if (["SISREP_PROD", "SISREP_ISSUE", "SISREP_PROCPROF", "SISREP_HOME", "SISREP_VISIT", "SISREP_COLLECTIVE", "SISREP_FOOD", "SISREP_INDIV", "SISREP_ATT_UNIT", "SISREP_VISITS", "SISREP_INDIV_LOCAL", "SISREP_PROC_UNIT"].includes(type)) {
      const kindMap: Record<string, string[] | null> = {
        SISREP_PROD: null, SISREP_ISSUE: null, SISREP_PROCPROF: ["PROCEDIMENTOS"], SISREP_HOME: ["VISITA", "ATENDIMENTO_DOMICILIAR", "DOMICILIAR"],
        SISREP_VISIT: ["VISITA"], SISREP_COLLECTIVE: ["ATIVIDADE_COLETIVA"], SISREP_FOOD: ["CONSUMO_ALIMENTAR"], SISREP_INDIV: ["INDIVIDUAL"],
        SISREP_ATT_UNIT: ["ATENDIMENTO_INDIVIDUAL"], SISREP_VISITS: ["VISITA"], SISREP_INDIV_LOCAL: ["INDIVIDUAL"], SISREP_PROC_UNIT: ["PROCEDIMENTOS"],
      };
      const kinds = kindMap[type];
      const rows = filtered.filter(f => !kinds || kinds.includes(f.kind));
      return { rows: rows.map(f => ({ Data: dateText(f.createdAt), Ficha: f.kind, Cidadão: citizenOf(f), Equipe: f.team?.name || "Não informada", Unidade: f.unit?.name || "Não informada", Situação: f.status })), warnings: [] };
    }
    if (["SISREP_FAMILIES", "SISREP_INDIV_UNIT", "SISREP_HOME2"].includes(type)) {
      const families = await prisma.healthFamily.findMany({ orderBy: { createdAt: "desc" }, take: 2000, select: { familyCode: true, isActive: true, createdAt: true, household: { select: { householdCode: true, microarea: { select: { code: true, area: { select: { code: true } } } } } }, members: { select: { id: true } } } });
      return { rows: families.filter(f => match(f.familyCode || "")).map(f => ({ Família: f.familyCode || "Sem código", Domicílio: f.household?.householdCode || "Sem domicílio", Área: f.household?.microarea?.area.code || "-", Microárea: f.household?.microarea?.code || "-", Membros: f.members.length, Situação: f.isActive ? "Ativa" : "Inativa" })), warnings: [] };
    }
    if (type === "SISREP_HOUSE") {
      const grouped = new Map<string, number>();
      for (const f of filtered) { const key = f.household?.householdCode || "Sem domicílio"; grouped.set(key, (grouped.get(key) || 0) + 1); }
      const sizes = await prisma.healthFamilyMember.groupBy({ by: ["familyId"], _count: true });
      const distribution = new Map<number, number>();
      for (const s of sizes) distribution.set(s._count, (distribution.get(s._count) || 0) + 1);
      return {
        rows: [
          ...[...grouped.entries()].map(([household, count]) => ({ Grupo: "Fichas por domicílio", Categoria: household, Quantidade: count })),
          ...[...distribution.entries()].map(([size, count]) => ({ Grupo: "Tamanho da família (Coelho)", Categoria: `${size} membro(s)`, Quantidade: count })),
        ], warnings: [],
      };
    }
    if (type === "SISREP_GEST") {
      const gest = filtered.filter(f => ["INDIVIDUAL", "ATENDIMENTO_INDIVIDUAL", "VISITA"].includes(f.kind));
      return { rows: gest.map(f => ({ Data: dateText(f.createdAt), Ficha: f.kind, Cidadã: citizenOf(f), Unidade: f.unit?.name || "Não informada" })), warnings: ["Sem marcador de gestante/risco na ficha; recorte por tipo de ficha."] };
    }
    if (["SISREP_ODONTO", "SISREP_ODONTO_QTY"].includes(type)) {
      const odonto = filtered.filter(f => f.kind === "ODONTO");
      if (type === "SISREP_ODONTO_QTY") {
        const grouped = new Map<string, number>();
        for (const f of odonto) { const key = f.team?.name || "Sem equipe"; grouped.set(key, (grouped.get(key) || 0) + 1); }
        return { rows: [...grouped.entries()].map(([team, count]) => ({ Equipe: team, Quantidade: count })), warnings: [] };
      }
      return { rows: odonto.map(f => ({ Data: dateText(f.createdAt), Cidadão: citizenOf(f), Equipe: f.team?.name || "Não informada", Situação: f.status })), warnings: [] };
    }
    // SISREP_SPEC (percentual por especialidade de fichas com equipe)
    const grouped = new Map<string, number>();
    for (const f of filtered) grouped.set(f.kind, (grouped.get(f.kind) || 0) + 1);
    const total = [...grouped.values()].reduce((a, b) => a + b, 0);
    return { rows: [...grouped.entries()].map(([kind, count]) => ({ Ficha: kind, Quantidade: count, Percentual: total ? `${(count / total * 100).toFixed(2)}%` : "0%" })), warnings: [] };
  }

  // ---------- VIGILÂNCIA ----------
  if (type.startsWith("VIGREP_")) {
    if (type === "VIGREP_RISK") {
      const grouped = await prisma.healthVigilanceInspection.groupBy({ by: ["status"], _count: true });
      const establishments = await prisma.healthVigilanceEstablishment.groupBy({ by: ["riskLevel"], _count: true });
      return { rows: [...establishments.map(e => ({ Grupo: "Estabelecimentos por risco", Categoria: e.riskLevel || "Não classificado", Quantidade: e._count })), ...grouped.map(g => ({ Grupo: "Inspeções por situação", Categoria: g.status, Quantidade: g._count }))], warnings: [] };
    }
    if (type === "VIGREP_STATUS") {
      const records = await prisma.healthVigilanceEstablishment.findMany({ orderBy: { name: "asc" }, take: 2000, select: { name: true, document: true, status: true, riskLevel: true } });
      return { rows: records.filter(r => !input.status || r.status === input.status).filter(r => match(r.name)).map(r => ({ Estabelecimento: r.name, Documento: r.document || "Não informado", Risco: r.riskLevel || "Não classificado", Situação: r.status })), warnings: [] };
    }
    if (type === "VIGREP_CNAE") {
      const grouped = await prisma.healthVigilanceEstablishment.groupBy({ by: ["cnae"], _count: true, orderBy: { _count: { cnae: "desc" } } });
      return { rows: grouped.map(g => ({ CNAE: g.cnae || "Não informado", Quantidade: g._count })), warnings: [] };
    }
    if (type === "VIGREP_QTY") {
      const [est, complaints, inspections, licenses] = await Promise.all([
        prisma.healthVigilanceEstablishment.groupBy({ by: ["riskLevel"], _count: true }),
        prisma.healthVigilanceComplaint.groupBy({ by: ["status"], _count: true }),
        prisma.healthVigilanceInspection.groupBy({ by: ["status"], _count: true }),
        prisma.healthVigilanceLicense.groupBy({ by: ["status"], _count: true }),
      ]);
      return {
        rows: [
          ...est.map(e => ({ Grupo: "Estabelecimentos (risco)", Categoria: e.riskLevel || "Não classificado", Quantidade: e._count })),
          ...complaints.map(e => ({ Grupo: "Denúncias", Categoria: e.status, Quantidade: e._count })),
          ...inspections.map(e => ({ Grupo: "Inspeções", Categoria: e.status, Quantidade: e._count })),
          ...licenses.map(e => ({ Grupo: "Alvarás", Categoria: e.status, Quantidade: e._count })),
        ], warnings: [],
      };
    }
    if (type === "VIGREP_COMPLAINTS") {
      const records = await prisma.healthVigilanceComplaint.findMany({ orderBy: { createdAt: "desc" }, take: 2000, select: { createdAt: true, place: true, description: true, isAnonymous: true, status: true, establishment: { select: { name: true } } } });
      return { rows: records.filter(r => match(`${r.establishment?.name || r.place || ""} ${r.description}`)).map(r => ({ Data: dateText(r.createdAt), Estabelecimento: r.establishment?.name || r.place || "Não informado", Denúncia: r.description.slice(0, 160), Identificação: r.isAnonymous ? "Anônima" : "Identificada", Situação: r.status })), warnings: ["Identidade do denunciante nunca exposta neste relatório."] };
    }
    if (["VIGREP_INSPECTIONS", "VIGREP_TECH"].includes(type)) {
      const records = await prisma.healthVigilanceInspection.findMany({ orderBy: { inspectedAt: "desc" }, take: 2000, include: { establishment: { select: { name: true, cnae: true, riskLevel: true } }, items: true } });
      return { rows: records.filter(r => match(r.establishment.name)).map(r => ({ Data: dateText(r.inspectedAt), Estabelecimento: r.establishment.name, CNAE: r.establishment.cnae || "Não informado", Risco: r.establishment.riskLevel || "Não classificado", Itens: r.items.length, Conformidades: r.items.filter(i => i.result === "Conforme").length, NãoConformidades: r.items.filter(i => i.result === "Não conforme").length, Achados: (r.findings || "").slice(0, 160), Situação: r.status })), warnings: [] };
    }
    // VIGREP_LICENSES
    const records = await prisma.healthVigilanceLicense.findMany({ orderBy: { validUntil: "desc" }, take: 2000, include: { establishment: { select: { name: true } } } });
    return { rows: records.map(r => ({ Alvará: r.licenseNumber, Estabelecimento: r.establishment.name, Vigência: `${dateText(r.validFrom)} a ${dateText(r.validUntil)}`, Situação: r.status })), warnings: [] };
  }

  // ---------- DOCUMENTOS / COMPROVANTES (a partir do registro real) ----------
  if (type.startsWith("DOC_")) {
    const recordId = (input.recordId || "").trim();
    if (!recordId) throw new Error("Informe o registro (ID ou protocolo) para emitir o documento.");
    const pair = (campo: string, valor: string | number | null | undefined) => ({ Campo: campo, Valor: valor ?? "Não informado" });
    if (type === "DOC_DISPENSATION") {
      const disp = await prisma.medicineDispensation.findFirst({ where: { OR: [{ id: recordId }, { prescriptionItemId: recordId }] }, include: { patient: { include: { person: true } }, medicine: true, unit: true, stock: true, dispensedByProfessional: { select: { employee: { select: { name: true } } } } } });
      if (!disp) throw new Error("Dispensação não encontrada.");
      if (unitIds && !unitIds.includes(disp.unitId)) throw new Error("Registro fora do seu escopo de acesso.");
      return { rows: [pair("Documento", "Comprovante de dispensação"), pair("Data", dateText(disp.date)), pair("Paciente", disp.patient.person.fullName), pair("Medicamento", disp.medicine.name), pair("Quantidade", disp.quantity), pair("Lote", disp.stock?.batchNumber), pair("Unidade", disp.unit.name), pair("Responsável", disp.dispensedByProfessional?.employee.name), pair("Posologia", disp.dosageSnapshot), pair("Retorno", disp.nextWithdrawalAt ? dateText(disp.nextWithdrawalAt) : null)], warnings: [] };
    }
    if (type === "DOC_TRANSFER_RECEIPT") {
      const transfer = await prisma.healthStockTransfer.findFirst({ where: { OR: [{ id: recordId }, { requestNumber: recordId }] }, include: { originWarehouse: true, destinationWarehouse: true, items: { include: { material: true } } } });
      if (!transfer) throw new Error("Transferência não encontrada.");
      return { rows: [pair("Documento", "Recibo de transferência"), pair("Origem", transfer.originWarehouse.name), pair("Destino", transfer.destinationWarehouse.name), pair("Situação", transfer.status), pair("Pedido", transfer.requestNumber), ...transfer.items.flatMap(item => [pair("Produto", item.material.name), pair("Lote/quantidade", `${item.batchNumber} · ${item.quantity}`)])], warnings: [] };
    }
    if (type === "DOC_APPOINTMENT") {
      const appointment = await prisma.healthAppointment.findUnique({ where: { id: recordId }, include: { patient: { include: { person: true } }, unit: true, professional: { include: { employee: { select: { name: true } } } } } });
      if (!appointment) throw new Error("Agendamento não encontrado.");
      if (unitIds && !unitIds.includes(appointment.unitId)) throw new Error("Registro fora do seu escopo de acesso.");
      return { rows: [pair("Documento", "Comprovante de agendamento"), pair("Data", appointment.date.toLocaleString("pt-BR")), pair("Paciente", appointment.patient.person.fullName), pair("Unidade", appointment.unit.name), pair("Profissional", appointment.professional?.employee.name), pair("Especialidade", appointment.specialty), pair("Situação", appointment.status)], warnings: [] };
    }
    if (type === "DOC_LAB_COLLECTION") {
      const order = await prisma.healthLabOrder.findFirst({ where: { OR: [{ id: recordId }, { sampleBarcode: recordId }] }, include: { patient: { include: { person: true } }, examRequest: true, examModel: true, collectionUnit: true } });
      if (!order) throw new Error("Solicitação/coleta não encontrada.");
      return { rows: [pair("Documento", "Comprovante de coleta"), pair("Paciente", order.patient.person.fullName), pair("Exame", order.examRequest?.examName || order.examModel?.name), pair("Coleta", order.collectionUnit?.name), pair("Amostra", order.sampleBarcode), pair("Agendada", order.scheduledAt ? dateText(order.scheduledAt) : null), pair("Coletada", order.collectedAt ? dateText(order.collectedAt) : null), pair("Etapa", order.status)], warnings: [] };
    }
    if (["DOC_REGULATION_GUIDE", "DOC_REGULATION_SCHEDULE"].includes(type)) {
      const request = await prisma.healthRegulationRequest.findFirst({ where: { OR: [{ id: recordId }, { guideNumber: recordId }] }, include: { patient: { include: { person: true } }, specialty: true, service: true, procedure: { select: { code: true, description: true } }, requestUnit: true, quota: { include: { provider: { include: { person: { select: { fullName: true } }, company: { select: { corporateName: true } } } } } } } });
      if (!request) throw new Error("Solicitação/guia não encontrada.");
      if (unitIds && request.requestUnitId && !unitIds.includes(request.requestUnitId)) throw new Error("Registro fora do seu escopo de acesso.");
      return { rows: [pair("Documento", type === "DOC_REGULATION_GUIDE" ? "Guia de autorização" : "Comprovante de agendamento regulado"), pair("Guia", request.guideNumber), pair("Paciente", request.patient.person.fullName), pair("Serviço", request.specialty?.name || request.service?.name), pair("Procedimento", request.procedure ? `${request.procedure.code} · ${request.procedure.description}` : null), pair("Prestador", request.quota?.provider.company?.corporateName || request.quota?.provider.person?.fullName), pair("Unidade solicitante", request.requestUnit?.name), pair("Agendada", request.scheduledAt ? dateText(request.scheduledAt) : null), pair("Situação", request.status)], warnings: [] };
    }
    if (["DOC_TFD_LIST", "DOC_TFD_PUBLIC", "DOC_TFD_AUTH"].includes(type)) {
      const trip = await prisma.healthTfdTrip.findUnique({ where: { id: recordId }, include: { fleetUnit: true, driverEmployee: { select: { name: true } }, passengers: { include: { patient: { include: { person: { select: { fullName: true } } } } } } } });
      if (trip) {
        return { rows: [pair("Documento", type === "DOC_TFD_AUTH" ? "Autorização de viagem" : "Lista de passageiros"), pair("Data", dateText(trip.date)), pair("Origem", trip.origin), pair("Destino", trip.destination), pair("Veículo", `${trip.fleetUnit.name}${trip.fleetUnit.plate ? ` · ${trip.fleetUnit.plate}` : ""}`), pair("Condutor", trip.driverEmployee?.name), pair("Lotação", `${trip.passengers.length}/${trip.capacity}`), pair("Situação", trip.status), ...trip.passengers.flatMap(p => [pair("Passageiro", `${p.patient.person.fullName}${p.kind === "ACOMPANHANTE" ? " (acompanhante)" : ""}`), pair("Acompanhante", p.companionName)])], warnings: [] };
      }
      const request = await prisma.healthTfdRequest.findFirst({ where: { OR: [{ id: recordId }] }, include: { patient: { include: { person: { select: { fullName: true } } } }, originUnit: true } });
      if (!request) throw new Error("Viagem ou solicitação TFD não encontrada.");
      return { rows: [pair("Documento", "Autorização de TFD"), pair("Paciente", request.patient.person.fullName), pair("Origem", request.originUnit?.name), pair("Destino", request.destination), pair("Motivo", request.reason), pair("Situação", request.status)], warnings: [] };
    }
    if (["DOC_PA_BAU", "DOC_PA_DISCHARGE"].includes(type)) {
      const record = await prisma.medicalRecord.findUnique({ where: { id: recordId }, include: { patient: { include: { person: true } }, professional: { include: { employee: { select: { name: true } } } }, unit: true } });
      if (!record) throw new Error("Atendimento não encontrado.");
      if (unitIds && !unitIds.includes(record.unitId)) throw new Error("Registro fora do seu escopo de acesso.");
      return { rows: [pair("Documento", type === "DOC_PA_BAU" ? "Boletim de atendimento" : "Declaração de alta"), pair("Data", dateText(record.date)), pair("Paciente", record.patient.person.fullName), pair("Unidade", record.unit.name), pair("Profissional", record.professional.employee.name), pair("Queixa", record.chiefComplaint), pair("Conduta", record.conduct), pair("Desfecho", record.outcome)], warnings: [] };
    }
    if (type === "DOC_PATIENT_CARD") {
      const patient = await prisma.patient.findFirst({ where: { OR: [{ id: recordId }, { cns: recordId }] }, include: { person: true, referenceUnit: true } });
      if (!patient) throw new Error("Paciente não encontrado.");
      return { rows: [pair("Documento", "Carteirinha do paciente"), pair("Paciente", patient.person.fullName), pair("CNS", patient.cns), pair("Nascimento", patient.person.birthDate ? dateText(patient.person.birthDate) : null), pair("Unidade de referência", patient.referenceUnit?.name)], warnings: [] };
    }
    // DOC_LICENSE
    const license = await prisma.healthVigilanceLicense.findFirst({ where: { OR: [{ id: recordId }, { licenseNumber: recordId }] }, include: { establishment: true } });
    if (!license) throw new Error("Alvará não encontrado.");
    return { rows: [pair("Documento", "Alvará sanitário"), pair("Número", license.licenseNumber), pair("Estabelecimento", license.establishment.name), pair("Documento", license.establishment.document), pair("Vigência", `${dateText(license.validFrom)} a ${dateText(license.validUntil)}`), pair("Situação", license.status)], warnings: [] };
  }

  // ---------- AUDITORIA ----------
  if (type === "AUDIT_ACCESS_DETAIL") {
    const records = await prisma.auditEvent.findMany({ where: period ? { createdAt: period } : {}, orderBy: { createdAt: "desc" }, take: 2000, select: { eventType: true, targetType: true, targetId: true, createdAt: true, actorUsuario: { select: { nome: true } } } });
    return { rows: records.map(r => ({ Data: dateText(r.createdAt), Usuário: r.actorUsuario.nome, Evento: r.eventType, Alvo: `${r.targetType}:${r.targetId.slice(0, 8)}` })), warnings: [] };
  }
  if (type === "AUDIT_PATIENT_CHANGES") {
    const records = await prisma.auditEvent.findMany({ where: { targetType: "PATIENT", ...(period ? { createdAt: period } : {}) }, orderBy: { createdAt: "desc" }, take: 2000, select: { eventType: true, targetId: true, createdAt: true, actorUsuario: { select: { nome: true } } } });
    return { rows: records.map(r => ({ Data: dateText(r.createdAt), Evento: r.eventType, Paciente: r.targetId, Autor: r.actorUsuario.nome })), warnings: [] };
  }
  return null;
}
