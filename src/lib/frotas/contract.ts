import { z } from "zod";

export const categories = ["VEICULO", "MAQUINA", "EQUIPAMENTO", "AGREGADO"] as const;
export const areas = ["frota", "utilizacao", "rotas", "planos", "ordens", "manutencoes", "consumos", "gastos", "seguros", "obrigacoes", "documentos", "ocorrencias", "relatorios"] as const;
export type FleetArea = (typeof areas)[number];
export const labels: Record<string, string> = {
  VEICULO: "Veículo", MAQUINA: "Máquina", EQUIPAMENTO: "Equipamento", AGREGADO: "Agregado",
  ATIVO: "Ativo", INATIVO: "Inativo", EM_MANUTENCAO: "Em manutenção",
  REVISAO: "Revisão periódica", PREVENTIVA: "Manutenção preventiva",
  EMITIDA: "Emitida", EM_EXECUCAO: "Em execução", CONCLUIDA: "Concluída",
  COMBUSTIVEL: "Combustível", LUBRIFICANTE: "Lubrificante", PROPRIO: "Próprio", TERCEIRO: "Terceiro",
  SEGURO: "Seguro", OBRIGACAO: "Obrigação", DOCUMENTO: "Documento", PENDENTE: "Pendente", CUMPRIDA: "Cumprida",
  IPVA: "IPVA", LICENCIAMENTO: "Licenciamento", OUTRO: "Outro", MULTA: "Multa", ACIDENTE: "Acidente",
  MANUTENCAO: "Manutenção", OUTROS: "Outros", CONSUMO: "Consumo", OS: "Ordem de serviço", LOCAL: "Registro operacional",
  PATRIMONIO: "Patrimônio", STOCK_EXIT: "Baixar estoque ao confirmar", STOCK_MOVEMENT: "Vincular saída existente",
};
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Data inexistente.");
const text = z.string().trim().min(1, "Campo obrigatório.").max(200);
const description = z.string().trim().min(1, "Campo obrigatório.").max(10000);
const optionalText = z.string().trim().max(200).optional().transform(v => v || null);
const optionalNote = z.string().trim().max(10000).optional().transform(v => v || null);
export const moneySchema = z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, "Use um valor positivo com até duas casas decimais.");
const optionalMoney = z.union([z.literal(""), moneySchema]).optional().transform(v => v || null);
const optionalDate = z.union([z.literal(""), dateSchema]).optional().transform(v => v || null);
const reading = z.string().regex(/^\d{1,10}(\.\d{1,3})?$/, "Leitura inválida.");
const optionalReading = z.union([z.literal(""), reading]).optional().transform(v => v || null);
const edit = { id: z.string().optional(), version: z.string().optional() };
const base = { requestId: z.uuid() };

export const fleetMutationSchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("unit"), data: z.object({ ...edit,
    code: text, name: text, category: z.enum(categories), status: z.enum(["ATIVO", "EM_MANUTENCAO", "INATIVO"]),
    departmentId: text, plate: z.string().trim().toUpperCase().optional().transform(v => v?.replace(/[- ]/g, "") || null).refine(v => !v || /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(v), "Placa inválida."),
    renavam: z.string().trim().optional().transform(v => v || null).refine(v => !v || /^\d{9,11}$/.test(v), "RENAVAM deve ter 9 a 11 dígitos."),
    brand: optionalText, model: optionalText, year: z.string().optional().transform(v => v ? Number(v) : null).refine(v => v === null || (Number.isInteger(v) && v >= 1900 && v <= 2100), "Ano inválido."),
    assetId: optionalText, responsibleId: optionalText, parentId: optionalText, notes: optionalNote,
  }).strict() }).strict(),
  z.object({ ...base, kind: z.literal("route"), data: z.object({ ...edit, code: text, name: text, origin: text, destination: text, itinerary: description, departmentId: text, active: z.enum(["true", "false"]).transform(v => v === "true") }).strict() }).strict(),
  z.object({ ...base, kind: z.literal("usage"), data: z.object({ unitId: text, routeId: optionalText, employeeId: optionalText,
    startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/), endedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    purpose: description, initialReading: optionalReading, finalReading: optionalReading,
  }).strict() }).strict(),
  z.object({ ...base, kind: z.literal("plan"), data: z.object({ unitId: text, title: text, type: z.enum(["REVISAO", "PREVENTIVA"]), services: description,
    firstDueAt: dateSchema, intervalDays: z.string().regex(/^\d+$/).transform(Number).refine(v => v >= 1 && v <= 3660, "Intervalo deve ter entre 1 e 3660 dias."), estimatedCost: optionalMoney,
  }).strict() }).strict(),
  z.object({ ...base, kind: z.literal("generateOrder"), planId: text, scheduledAt: dateSchema }).strict(),
  z.object({ ...base, kind: z.literal("startOrder"), orderId: text }).strict(),
  z.object({ ...base, kind: z.literal("completeOrder"), data: z.object({ orderId: text, completedAt: dateSchema, performed: description, result: description, actualCost: optionalMoney, reference: optionalText }).strict() }).strict(),
  z.object({ ...base, kind: z.literal("consumption"), data: z.object({ unitId: text, type: z.enum(["COMBUSTIVEL", "LUBRIFICANTE"]), origin: z.enum(["PROPRIO", "TERCEIRO"]), occurredAt: dateSchema,
    material: text, quantity: reading.refine(v => Number(v) > 0, "Quantidade deve ser maior que zero."), measurementUnit: z.enum(["L", "KG", "UN"]), cost: optionalMoney,
    supplierId: optionalText, reference: optionalText, workOrderId: optionalText,
    stockMode: z.enum(["LOCAL", "STOCK_EXIT", "STOCK_MOVEMENT"]).default("LOCAL"), stockId: optionalText, stockMovementId: optionalText,
  }).strict() }).strict(),
  z.object({ ...base, kind: z.literal("document"), data: z.object({ ...edit, unitId: text, kind: z.enum(["SEGURO", "OBRIGACAO", "DOCUMENTO"]), type: text,
    title: text, reference: text, insurerId: optionalText, startsAt: optionalDate, scheduledAt: optionalDate, dueAt: dateSchema, value: optionalMoney, notes: optionalNote,
  }).strict() }).strict(),
  z.object({ ...base, kind: z.literal("fulfillDocument"), data: z.object({ documentId: text, fulfilledAt: dateSchema, fulfillmentNote: description }).strict() }).strict(),
  z.object({ ...base, kind: z.literal("occurrence"), data: z.object({ unitId: text, type: z.enum(["MULTA", "ACIDENTE", "OUTRO"]), occurredAt: dateSchema,
    description, involvedValue: optionalMoney, reference: optionalText,
  }).strict() }).strict(),
  z.object({ ...base, kind: z.literal("expense"), data: z.object({ unitId: text, occurredAt: dateSchema, amount: optionalMoney, description,
    occurrenceId: optionalText, reference: optionalText,
  }).strict() }).strict(),
]);
export type FleetMutation = z.output<typeof fleetMutationSchema>;
export type FleetMutationInput = z.input<typeof fleetMutationSchema>;
export function fleetMutationOperation(input: FleetMutation): "create" | "update" {
  return ["startOrder", "completeOrder", "fulfillDocument"].includes(input.kind) || ((input.kind === "unit" || input.kind === "route" || input.kind === "document") && !!input.data.id) ? "update" : "create";
}

export const fleetQuerySchema = z.object({
  area: z.enum(areas).default("frota"), q: z.string().trim().max(200).default(""),
  unitId: z.string().max(200).default(""), unitIds: z.string().max(4100).default("").refine(v => !v || (v.split(",").length <= 50 && v.split(",").every(id => /^[a-zA-Z0-9_-]{1,80}$/.test(id))), "Selecione até 50 unidades válidas."), category: z.enum([...categories, ""]).default(""),
  status: z.string().max(40).default(""), type: z.string().max(40).default(""), origin: z.enum(["PROPRIO", "TERCEIRO", ""]).default(""),
  from: z.union([dateSchema, z.literal("")]).default(""), to: z.union([dateSchema, z.literal("")]).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1), pageSize: z.coerce.number().int().min(1).max(20).default(20).transform(() => 20),
  report: z.enum(["frota", "vencimentos", "abastecimentos", "gastos", "manutencoes"]).default("frota"),
}).refine(v => !v.from || !v.to || v.from <= v.to, { message: "A data final deve ser igual ou posterior à inicial.", path: ["to"] });
export type FleetQuery = z.output<typeof fleetQuerySchema>;
export function dateOnly(value: string) { return new Date(`${dateSchema.parse(value)}T00:00:00.000Z`); }
export function todayInBrazil() { return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date()); }
export function nextOccurrence(value: Date, intervalDays: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + intervalDays);
  return next;
}
