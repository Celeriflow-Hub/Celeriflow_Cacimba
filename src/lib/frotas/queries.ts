import { Prisma } from "@prisma/client";
import type { AppContext } from "@/lib/platform/tenant-context";
import { dateOnly, labels, todayInBrazil, type FleetArea, type FleetQuery } from "./contract";
import { departmentWhere, fleetScope } from "./service";

export type FleetColumn = { key: string; label: string; numeric?: boolean };
export type FleetRow = { id: string; unitId?: string; cells: Record<string, string>; detail: Record<string, string>; data?: Record<string, string>; status?: string; actions: string[] };
export type FleetList = { rows: FleetRow[]; columns: FleetColumn[]; total: number; page: number; pageSize: number; amount: string | null; missingCosts: number; quantities: Record<string, string> };
export type ReferenceOption = { id: string; label: string };
export const areaTitles: Record<FleetArea, string> = { frota: "Frota", utilizacao: "Utilização", rotas: "Rotas", planos: "Planos de manutenção", ordens: "Ordens de serviço", manutencoes: "Manutenções efetuadas", consumos: "Abastecimentos e lubrificantes", gastos: "Gastos realizados", seguros: "Seguros", obrigacoes: "Obrigações", documentos: "Documentos", ocorrencias: "Ocorrências", relatorios: "Relatórios" };
const day = (v: Date | null | undefined) => v ? v.toISOString().slice(0, 10).split("-").reverse().join("/") : "—";
const dateTime = (v: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(v);
export const money = (v: Prisma.Decimal | null | undefined) => v == null ? "Não informado" : `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
const label = (v: string) => labels[v] || v;
const unitLabel = (v: { code: string; name: string }) => `${v.code} · ${v.name}`;
const str = (v: unknown) => v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? "" : String(v);
const dataStrings = (v: object) => Object.fromEntries(Object.entries(v).map(([k, value]) => [k, str(value)]));
function dateRange(q: FleetQuery) { return { ...(q.from ? { gte: dateOnly(q.from) } : {}), ...(q.to ? { lte: dateOnly(q.to) } : {}) }; }
const c = (key: string, label: string, numeric = false): FleetColumn => ({ key, label, numeric });
const common = [c("unit", "Unidade da frota"), c("date", "Data")];
function row(id: string, cells: Record<string, string>, detail: Record<string, string>, actions: string[], unitId?: string, data?: Record<string, string>, status?: string): FleetRow { return { id, cells, detail, actions, unitId, data, status }; }
function documentStatus(v: { kind: string; status: string; dueAt: Date; startsAt: Date | null }) {
  const today = dateOnly(todayInBrazil());
  if (v.status === "CUMPRIDA") return "Cumprida";
  if (v.dueAt < today) return "Vencido";
  if (v.kind === "SEGURO") return v.startsAt && v.startsAt > today ? "Vigência futura" : "Vigente";
  return "Pendente";
}

export async function queryFleet(context: AppContext, q: FleetQuery, full = false): Promise<FleetList> {
  const db = context.prisma, scope = fleetScope(context);
  const area = q.area === "relatorios" ? ({ frota: "frota", vencimentos: "documentos", abastecimentos: "consumos", gastos: "gastos", manutencoes: "manutencoes" } as const)[q.report] : q.area;
  const unit: Prisma.FleetUnitWhereInput = { ...departmentWhere(scope), ...(q.unitId ? { id: q.unitId, ...(q.unitIds ? { AND: [{ id: { in: q.unitIds.split(",") } }] } : {}) } : q.unitIds ? { id: { in: q.unitIds.split(",") } } : {}), ...(q.category ? { category: q.category } : {}) };
  const search = q.q ? { contains: q.q, mode: "insensitive" as const } : undefined;
  const byUnitSearch = search ? [{ unit: { code: search } }, { unit: { name: search } }, { unit: { plate: search } }] : [];
  let total = 0, rows: FleetRow[] = [], columns: FleetColumn[] = [], amount: string | null = null, missingCosts = 0, quantities: Record<string, string> = {};
  let page = q.page;
  const paginate = (count: number): { skip?: number; take?: number } => { total = count; page = Math.min(q.page, Math.max(1, Math.ceil(count / q.pageSize))); return full ? {} : { skip: (page - 1) * q.pageSize, take: q.pageSize }; };
  if (area === "frota") {
    const where: Prisma.FleetUnitWhereInput = { ...unit, ...(q.status ? { status: q.status } : {}), ...(search ? { OR: [{ code: search }, { name: search }, { plate: search }] } : {}) };
    const count = await db.fleetUnit.count({ where });
    const items = await db.fleetUnit.findMany({ where, ...paginate(count), orderBy: [{ code: "asc" }, { id: "asc" }], include: { parent: { select: { code: true, name: true } }, asset: { select: { patrimonyNumber: true, name: true, status: true, brand: true, model: true, responsible: { select: { name: true } }, invoiceNumber: true, purchaseReceiptItemId: true } }, assetEvents: { take: 20, orderBy: [{ createdAt: "desc" }, { id: "desc" }] } } });
    const departments = await db.department.findMany({ where: { id: { in: [...new Set(items.flatMap(v => v.departmentId ? [v.departmentId] : []))] } }, select: { id: true, name: true } });
    const departmentNames = new Map(departments.map(d => [d.id, d.name]));
    columns = [c("code", "Código / placa"), c("name", "Descrição"), c("category", "Categoria"), c("department", "Setor"), c("status", "Situação")];
    rows = items.map(v => row(v.id, { code: `${v.code}${v.plate ? ` / ${v.plate}` : ""}`, name: v.name, category: label(v.category), department: departmentNames.get(v.departmentId || "") || "Sem setor", status: label(v.status) }, {
      "Código": v.code, "Descrição operacional": v.name, "Categoria": label(v.category), "Situação efetiva": label(v.status), "Disponibilidade operacional": label(v.operationalStatus), "Setor · Organograma / Patrimônio": departmentNames.get(v.departmentId || "") || "Sem setor", "Placa": v.plate || "Não aplicável / não informada", "RENAVAM": v.renavam || "—", "Marca / modelo / ano": [v.asset?.brand || v.brand, v.asset?.model || v.model, v.year].filter(Boolean).join(" / ") || "—", "Bem · Patrimônio": v.asset ? `${v.asset.patrimonyNumber} · ${v.asset.name}` : "Cadastro operacional de Frotas", "Situação · Patrimônio": v.patrimonyStatus || "Sem vínculo", "Responsável · Patrimônio": v.asset?.responsible?.name || "Não informado", "Documento de aquisição · Patrimônio": v.asset?.invoiceNumber || "—", "Recebimento de compra · Patrimônio": v.asset?.purchaseReceiptItemId || "—", "Unidade principal": v.parent ? unitLabel(v.parent) : "—", "Últimas 20 alterações de origem · Patrimônio": v.assetEvents.map(e => `${dateTime(e.createdAt)} · setor ${e.fromDepartmentId || "sem setor"} → ${e.toDepartmentId || "sem setor"} · ${e.fromStatus || "—"} → ${e.toStatus || "—"}`).join("\n") || "Nenhuma alteração após o vínculo", "Observações": v.notes || "—"
    }, ["detail", "editUnit", "history", ...(v.assetId && scope.canReadAssets ? ["asset"] : [])], v.id, { ...dataStrings(v), status: v.operationalStatus, departmentLabel: departmentNames.get(v.departmentId || "") || "Sem setor", responsibleLabel: v.asset?.responsible?.name || "Sem responsável", version: v.updatedAt.toISOString() }, v.status));
  } else if (area === "rotas") {
    const where: Prisma.FleetRouteWhereInput = { ...departmentWhere(scope), ...(q.status ? { active: q.status === "ATIVO" } : {}), ...(search ? { OR: [{ code: search }, { name: search }, { itinerary: search }, { origin: search }, { destination: search }] } : {}) };
    const items = await db.fleetRoute.findMany({ where, ...paginate(await db.fleetRoute.count({ where })), orderBy: [{ code: "asc" }, { id: "asc" }] });
    columns = [c("code", "Código"), c("name", "Nome"), c("origin", "Origem"), c("destination", "Destino"), c("status", "Situação")];
    rows = items.map(v => row(v.id, { code: v.code, name: v.name, origin: v.origin, destination: v.destination, status: v.active ? "Ativa" : "Inativa" }, { "Nome": v.name, "Origem": v.origin, "Destino": v.destination, "Percurso": v.itinerary, "Origem dos dados": "Frotas" }, ["detail", "editRoute"], undefined, { ...dataStrings(v), version: v.updatedAt.toISOString() }));
  } else if (area === "utilizacao") {
    const where: Prisma.FleetUsageWhereInput = { unit, ...(q.from || q.to ? { startedAt: { ...(q.from ? { gte: new Date(`${q.from}T00:00:00-03:00`) } : {}), ...(q.to ? { lt: new Date(new Date(`${q.to}T00:00:00-03:00`).valueOf() + 86400000) } : {}) } } : {}), ...(search ? { OR: [...byUnitSearch, { purpose: search }, { routeSnapshot: search }, { employeeName: search }] } : {}) };
    const items = await db.fleetUsage.findMany({ where, ...paginate(await db.fleetUsage.count({ where })), orderBy: [{ startedAt: "desc" }, { id: "desc" }], include: { unit: true } });
    columns = [c("unit", "Veículo"), c("date", "Início / fim"), c("purpose", "Finalidade"), c("distance", "Distância", true)];
    rows = items.map(v => row(v.id, { unit: unitLabel(v.unit), date: `${dateTime(v.startedAt)} → ${dateTime(v.endedAt)}`, purpose: v.purpose, distance: v.initialReading !== null && v.finalReading !== null ? `${v.finalReading.minus(v.initialReading).toString()} km` : "Não informada" }, { "Veículo": unitLabel(v.unit), "Início": dateTime(v.startedAt), "Fim": dateTime(v.endedAt), "Finalidade": v.purpose, "Rota · Frotas (registro histórico)": v.routeSnapshot || "—", "Condutor · Servidores (registro histórico)": v.employeeName || "Não informado", "Hodômetro inicial": v.initialReading ? `${v.initialReading} km` : "—", "Hodômetro final": v.finalReading ? `${v.finalReading} km` : "—" }, ["detail"], v.unitId));
  } else if (area === "planos") {
    const where: Prisma.FleetPlanWhereInput = { unit, ...(q.from || q.to ? { nextDueAt: dateRange(q) } : {}), ...(q.type ? { type: q.type } : {}), ...(search ? { OR: [...byUnitSearch, { title: search }, { services: search }] } : {}) };
    const items = await db.fleetPlan.findMany({ where, ...paginate(await db.fleetPlan.count({ where })), orderBy: [{ nextDueAt: "asc" }, { id: "asc" }], include: { unit: true } });
    columns = [c("unit", "Unidade da frota"), c("title", "Plano"), c("type", "Tipo"), c("date", "Próxima ocorrência"), c("interval", "Periodicidade"), c("estimate", "Previsto", true)];
    rows = items.map(v => row(v.id, { unit: unitLabel(v.unit), title: v.title, type: label(v.type), date: day(v.nextDueAt), interval: `${v.intervalDays} dias`, estimate: money(v.estimatedCost) }, { "Unidade": unitLabel(v.unit), "Plano": v.title, "Tipo": label(v.type), "Primeira ocorrência": day(v.firstDueAt), "Próxima ocorrência": day(v.nextDueAt), "Intervalo": `${v.intervalDays} dias`, "Serviços": v.services, "Previsto (não realizado)": money(v.estimatedCost) }, ["detail", "generate", "emitPlan"], v.unitId, { scheduledAt: str(v.nextDueAt) }));
  } else if (area === "ordens") {
    const where: Prisma.FleetWorkOrderWhereInput = { unit, ...(q.status ? { status: q.status } : {}), ...(q.from || q.to ? { scheduledAt: dateRange(q) } : {}), ...(search ? { OR: [...byUnitSearch, { title: search }, { services: search }, { id: search }] } : {}) };
    const items = await db.fleetWorkOrder.findMany({ where, ...paginate(await db.fleetWorkOrder.count({ where })), orderBy: [{ scheduledAt: "desc" }, { id: "desc" }], include: { unit: true } });
    columns = [c("unit", "Unidade da frota"), c("title", "Ordem de serviço"), c("date", "Programação"), c("status", "Situação"), c("estimate", "Previsto", true), c("actual", "Serviço realizado", true)];
    rows = items.map(v => row(v.id, { unit: unitLabel(v.unit), title: v.title, date: day(v.scheduledAt), status: label(v.status), estimate: money(v.estimatedCost), actual: v.status === "CONCLUIDA" ? money(v.actualCost) : "Ainda não realizado" }, { "OS": v.id, "Unidade": unitLabel(v.unit), "Plano de origem": v.planId, "Tipo": label(v.type), "Programação": day(v.scheduledAt), "Serviços programados (cópia da emissão)": v.services, "Situação": label(v.status), "Início da execução": v.startedAt ? dateTime(v.startedAt) : "—", "Conclusão": day(v.completedAt), "Serviços executados": v.performed || "—", "Resultado": v.result || "—", "Custo realizado dos serviços": v.status === "CONCLUIDA" ? money(v.actualCost) : "Ainda não realizado", "Observação de custos": "Consumos vinculados são apropriados separadamente; não redigite esses valores no custo dos serviços." }, ["detail", "emitOrder", ...(v.status === "EMITIDA" ? ["start"] : []), ...(v.status === "EM_EXECUCAO" ? ["complete"] : [])], v.unitId, { performed: v.services }, v.status));
  } else if (area === "consumos") {
    const fuelReport = q.area === "relatorios" && q.report === "abastecimentos";
    const where: Prisma.FleetConsumptionWhereInput = { unit: fuelReport ? { AND: [unit, { category: "VEICULO" }] } : unit, ...(q.from || q.to ? { occurredAt: dateRange(q) } : {}), ...(fuelReport ? { type: "COMBUSTIVEL" } : q.type ? { type: q.type } : {}), ...(q.origin ? { origin: q.origin } : {}), ...(search ? { OR: [...byUnitSearch, { material: search }, { supplierName: search }, { reference: search }] } : {}) };
    const [count, sums, groups] = await Promise.all([db.fleetConsumption.count({ where }), db.fleetConsumption.aggregate({ where, _sum: { cost: true } }), db.fleetConsumption.groupBy({ by: ["measurementUnit"], where, _sum: { quantity: true } })]);
    missingCosts = await db.fleetConsumption.count({ where: { AND: [where, { cost: null }] } }); amount = sums._sum.cost?.toFixed(2) ?? "0.00";
    quantities = Object.fromEntries(groups.map(g => [g.measurementUnit, g._sum.quantity?.toString() ?? "0"]));
    const items = await db.fleetConsumption.findMany({ where, ...paginate(count), orderBy: [{ occurredAt: "desc" }, { id: "desc" }], include: { unit: true } });
    columns = [...common, c("material", "Material / tipo"), c("origin", "Origem"), c("quantity", "Quantidade", true), c("amount", "Custo realizado", true)];
    rows = items.map(v => row(v.id, { unit: unitLabel(v.unit), date: day(v.occurredAt), material: `${v.material} · ${label(v.type)}`, origin: v.stockMovementId ? "Próprio · Almoxarifado" : label(v.origin), quantity: `${v.quantity} ${v.measurementUnit}`, amount: money(v.cost) }, { "Unidade": unitLabel(v.unit), "Data do consumo": day(v.occurredAt), "Material": v.material, "Tipo": label(v.type), "Origem do material": label(v.origin), "Quantidade": `${v.quantity} ${v.measurementUnit}`, "Custo realizado": money(v.cost), "Fornecedor · Cadastros": v.supplierName || "Não informado", "Referência informada": v.reference || "—", "OS vinculada": v.workOrderId || "—", "Saída · Almoxarifado": v.stockMovementId || "Sem vínculo de estoque", "Origem do registro": v.stockMovementId ? "Consumo apropriado de uma saída real; quantidade e custo de origem, sem segunda baixa." : "Frotas · registro operacional sem baixa de estoque ou pagamento." }, ["detail", ...(v.stockMovementId && scope.canReadAssets ? ["stock"] : [])], v.unitId, { stockMovementId: v.stockMovementId || "" }));
  } else if (area === "gastos" || area === "manutencoes") {
    const where: Prisma.FleetExpenseWhereInput = { unit, ...(q.from || q.to ? { occurredAt: dateRange(q) } : {}), ...(area === "manutencoes" ? { nature: "MANUTENCAO" } : q.type ? { nature: q.type } : {}), ...(search ? { OR: [...byUnitSearch, { description: search }, { reference: search }] } : {}) };
    const [count, sum, unknown] = await Promise.all([db.fleetExpense.count({ where }), db.fleetExpense.aggregate({ where, _sum: { amount: true } }), db.fleetExpense.count({ where: { AND: [where, { amount: null }] } })]);
    amount = sum._sum.amount?.toFixed(2) ?? "0.00"; missingCosts = unknown;
    const items = await db.fleetExpense.findMany({ where, ...paginate(count), orderBy: [{ occurredAt: "desc" }, { id: "desc" }], include: { unit: true } });
    columns = [...common, c("description", "Descrição"), c("nature", "Natureza / origem"), c("amount", "Realizado", true)];
    rows = items.map(v => row(v.id, { unit: unitLabel(v.unit), date: day(v.occurredAt), description: v.description, nature: `${label(v.nature)} / ${label(v.sourceType)}`, amount: money(v.amount) }, { "Unidade": unitLabel(v.unit), "Data do fato": day(v.occurredAt), "Descrição": v.description, "Natureza": label(v.nature), "Valor realizado (não significa pago)": money(v.amount), "Origem": label(v.sourceType), "Identificação do fato": v.sourceId, "Referência informada": v.reference || "—" }, ["detail", "source"], v.unitId, { sourceType: v.sourceType, sourceId: v.sourceId }));
  } else if (["seguros", "obrigacoes", "documentos"].includes(area)) {
    const kind = area === "seguros" ? "SEGURO" : area === "obrigacoes" ? "OBRIGACAO" : undefined;
    const where: Prisma.FleetDocumentWhereInput = { unit, ...(kind ? { kind } : {}), ...(q.from || q.to ? { dueAt: dateRange(q) } : {}), ...(q.status ? { status: q.status } : {}), ...(q.type ? { type: q.type } : {}), ...(search ? { OR: [...byUnitSearch, { title: search }, { reference: search }, { insurerName: search }] } : {}) };
    const items = await db.fleetDocument.findMany({ where, ...paginate(await db.fleetDocument.count({ where })), orderBy: [{ dueAt: "asc" }, { id: "asc" }], include: { unit: true } });
    columns = [c("unit", "Unidade da frota"), c("title", "Documento / referência"), c("kind", "Tipo"), c("scheduled", "Agendamento"), c("date", "Vencimento"), c("status", "Situação")];
    rows = items.map(v => row(v.id, { unit: unitLabel(v.unit), title: `${v.title} / ${v.reference}`, kind: `${label(v.kind)} · ${label(v.type)}`, scheduled: day(v.scheduledAt), date: day(v.dueAt), status: documentStatus(v) }, { "Unidade": unitLabel(v.unit), "Título": v.title, "Tipo": `${label(v.kind)} / ${label(v.type)}`, "Referência / exercício": v.reference, "Seguradora · Cadastros": v.insurerName || "—", "Início da vigência": day(v.startsAt), "Agendamento": day(v.scheduledAt), "Vencimento": day(v.dueAt), "Situação": documentStatus(v), "Cumprimento administrativo": day(v.fulfilledAt), "Referência do cumprimento": v.fulfillmentNote || "—", "Valor informado (não apropriado como gasto)": money(v.value), "Observações": v.notes || "—" }, ["detail", ...(v.status !== "CUMPRIDA" ? ["editDocument", ...(v.kind !== "SEGURO" ? ["fulfill"] : [])] : [])], v.unitId, { ...dataStrings(v), version: v.updatedAt.toISOString() }, v.status));
  } else if (area === "ocorrencias") {
    const where: Prisma.FleetOccurrenceWhereInput = { unit, ...(q.from || q.to ? { occurredAt: dateRange(q) } : {}), ...(q.type ? { type: q.type } : {}), ...(search ? { OR: [...byUnitSearch, { description: search }, { reference: search }] } : {}) };
    const items = await db.fleetOccurrence.findMany({ where, ...paginate(await db.fleetOccurrence.count({ where })), orderBy: [{ occurredAt: "desc" }, { id: "desc" }], include: { unit: true } });
    columns = [...common, c("type", "Tipo"), c("description", "Descrição"), c("value", "Valor envolvido", true)];
    rows = items.map(v => row(v.id, { unit: unitLabel(v.unit), date: day(v.occurredAt), type: label(v.type), description: v.description, value: money(v.involvedValue) }, { "Unidade": unitLabel(v.unit), "Tipo": label(v.type), "Data": day(v.occurredAt), "Descrição": v.description, "Valor envolvido (não é gasto realizado)": money(v.involvedValue), "Referência": v.reference || "—" }, ["detail", "recognizeExpense"], v.unitId, { occurrenceId: v.id }));
  }
  return { rows, columns, total, page, pageSize: q.pageSize, amount, missingCosts, quantities };
}

export async function fleetReferences(context: AppContext, kind: string, search: string, unitId = ""): Promise<ReferenceOption[]> {
  const db = context.prisma, scope = fleetScope(context), contains = { contains: search.slice(0, 100), mode: "insensitive" as const };
  const limit = 20, unit = unitId ? await db.fleetUnit.findFirst({ where: { id: unitId, ...departmentWhere(scope) } }) : null;
  if (unitId && !unit) return [];
  const departmentId = unit?.departmentId;
  if (["units", "allUnits", "vehicles", "allVehicles", "principals"].includes(kind)) {
    const records = await db.fleetUnit.findMany({ where: { ...departmentWhere(scope), ...(["allUnits", "allVehicles"].includes(kind) ? {} : { status: { not: "INATIVO" } }), ...(departmentId ? { departmentId } : {}), ...(["vehicles", "allVehicles"].includes(kind) ? { category: "VEICULO" } : kind === "principals" ? { category: { not: "AGREGADO" } } : {}), OR: [{ code: contains }, { name: contains }, { plate: contains }] }, take: limit, orderBy: [{ code: "asc" }, { id: "asc" }] });
    return records.map(v => ({ id: v.id, label: `${unitLabel(v)} · ${label(v.category)}` }));
  }
  if (kind === "departments") { const records = await db.department.findMany({ where: { isActive: true, ...(scope.administrator ? {} : { id: scope.departmentId! }), name: contains }, take: limit, orderBy: [{ name: "asc" }, { id: "asc" }] }); return records.map(v => ({ id: v.id, label: v.name })); }
  if (kind === "employees") { const records = await db.employee.findMany({ where: { isActive: true, ...departmentWhere(scope), ...(departmentId ? { departmentId } : {}), name: contains }, select: { id: true, name: true }, take: limit, orderBy: [{ name: "asc" }, { id: "asc" }] }); return records.map(v => ({ id: v.id, label: v.name })); }
  if (kind === "routes") { const records = await db.fleetRoute.findMany({ where: { ...departmentWhere(scope), ...(departmentId ? { departmentId } : {}), active: true, OR: [{ code: contains }, { name: contains }] }, take: limit, orderBy: [{ code: "asc" }, { id: "asc" }] }); return records.map(v => ({ id: v.id, label: `${v.code} · ${v.name}` })); }
  if (kind === "suppliers") { const records = await db.supplier.findMany({ where: { status: "Ativo", OR: [{ person: { fullName: contains } }, { company: { tradeName: contains } }, { company: { corporateName: contains } }] }, select: { id: true, person: { select: { fullName: true } }, company: { select: { tradeName: true, corporateName: true } } }, take: limit, orderBy: { id: "asc" } }); return records.map(v => ({ id: v.id, label: v.person?.fullName || v.company?.tradeName || v.company?.corporateName || "Fornecedor" })); }
  if (kind === "assets") {
    if (!scope.canReadAssets) return [];
    const records = await db.asset.findMany({ where: { status: { notIn: ["Baixado", "Inativo"] }, ...departmentWhere(scope), ...(departmentId ? { departmentId } : {}), OR: [{ patrimonyNumber: contains }, { name: contains }] }, select: { id: true, patrimonyNumber: true, name: true }, take: limit, orderBy: { patrimonyNumber: "asc" } }); return records.map(v => ({ id: v.id, label: `${v.patrimonyNumber} · ${v.name}` }));
  }
  if (kind === "stocks") {
    if (!scope.canReadAssets || !scope.canIssueStock || !unit) return [];
    const records = await db.materialStock.findMany({ where: { quantity: { gt: 0 }, warehouse: { isActive: true }, material: { isActive: true, unitOfMeasure: { in: ["L", "KG", "UN"] }, OR: [{ name: contains }, { code: contains }] }, OR: [{ expirationDate: null }, { expirationDate: { gte: dateOnly(todayInBrazil()) } }] }, include: { material: true, warehouse: { select: { name: true } } }, take: limit, orderBy: [{ material: { code: "asc" } }, { id: "asc" }] });
    return records.map(v => ({ id: v.id, label: `${v.material.code} · ${v.material.name} · ${v.warehouse.name} · lote ${v.batchNumber || "sem lote"} · ${v.quantity} ${v.material.unitOfMeasure} · custo unitário ${v.unitCost == null ? "não informado" : `R$ ${v.unitCost.toFixed(2)}`}` }));
  }
  if (kind === "stockMovements") {
    if (!scope.canReadAssets || !unit) return [];
    const records = await db.materialMovement.findMany({ where: { type: "Saída", departmentId: unit.departmentId, obrasServicoId: null, assetAcquisition: null, fleetConsumption: null, material: { isActive: true, unitOfMeasure: { in: ["L", "KG", "UN"] }, OR: [{ name: contains }, { code: contains }] } }, include: { material: true }, take: limit, orderBy: [{ date: "desc" }, { id: "desc" }] });
    return records.map(v => ({ id: v.id, label: `${day(v.date)} · ${v.material.code} · ${v.material.name} · ${v.quantity} ${v.material.unitOfMeasure}` }));
  }
  if (kind === "orders") { const records = await db.fleetWorkOrder.findMany({ where: { unit: departmentWhere(scope), ...(unitId ? { unitId } : {}), OR: [{ title: contains }, { id: contains }] }, include: { unit: { select: { code: true, name: true } } }, take: limit, orderBy: [{ scheduledAt: "desc" }, { id: "desc" }] }); return records.map(v => ({ id: v.id, label: `${unitLabel(v.unit)} · ${v.title} · ${day(v.scheduledAt)}` })); }
  if (kind === "occurrences") { const records = await db.fleetOccurrence.findMany({ where: { unit: departmentWhere(scope), ...(unitId ? { unitId } : {}), description: contains }, take: limit, orderBy: [{ occurredAt: "desc" }, { id: "desc" }] }); return records.map(v => ({ id: v.id, label: `${day(v.occurredAt)} · ${label(v.type)} · ${v.description}` })); }
  return [];
}
