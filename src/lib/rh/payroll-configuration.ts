import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";

export type HrPayrollConfigurationDb = PrismaClient | Prisma.TransactionClient;

export const HR_RULE_SET_STATUSES = ["RASCUNHO", "ATIVA", "ARQUIVADA"] as const;
export const HR_RULE_SET_SCOPES = ["DEMONSTRACAO", "HOMOLOGACAO", "PRODUCAO"] as const;
export const HR_RULE_CATEGORIES = ["GERAL", "CALCULO", "FERIAS", "PREVIDENCIA", "CONSIGNACAO", "PORTAL"] as const;
export const HR_RULE_VALUE_TYPES = ["BOOLEAN", "INTEGER", "DECIMAL", "CURRENCY", "PERCENTAGE", "TEXT", "JSON", "DATE"] as const;
export const HR_RUBRIC_TYPES = ["PROVENTO", "DESCONTO", "INFORMATIVA", "BASE"] as const;
export const HR_RUBRIC_CALCULATION_METHODS = ["MANUAL", "VALOR_FIXO", "PERCENTUAL", "FORMULA_CONTROLADA"] as const;
export const HR_SOCIAL_SECURITY_REGIMES = ["RPPS", "RGPS", "COMPLEMENTAR"] as const;
export const HR_SOCIAL_SECURITY_METHODS = ["PROGRESSIVA", "LINEAR"] as const;
export const HR_EMPLOYMENT_NATURES = ["ESTATUTARIO", "CLT", "COMISSIONADO", "TEMPORARIO", "ESTAGIARIO"] as const;
export const HR_NEGATIVE_NET_PAY_POLICIES = ["BLOQUEAR", "PERMITIR", "GERAR_SALDO"] as const;
export const HR_ROUNDING_MODES = ["HALF_UP", "HALF_EVEN", "DOWN", "UP"] as const;
export const HR_INCIDENT_TYPES = ["RGPS", "RPPS", "IRRF", "FGTS", "FERIAS", "DECIMO_TERCEIRO", "TETO_REMUNERATORIO"] as const;

const stableCodeSchema = z.string().trim().toUpperCase().min(1).max(64).regex(/^[A-Z0-9_.-]+$/, "Use letras, números, ponto, hífen ou sublinhado no código.");
const labelSchema = z.string().trim().min(2).max(160);
const nullableTextSchema = z.string().trim().max(4_000).optional().transform((value) => value || null);
const nullableShortTextSchema = z.string().trim().max(500).optional().transform((value) => value || null);
const optionalCodeSchema = z.string().trim().optional().transform((value) => value ? stableCodeSchema.parse(value) : null);
const optionalIdentifierSchema = z.string().trim().optional().transform((value) => value || null);
const decimalStringSchema = z.union([z.string(), z.number()]).transform((value, context) => {
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
  if (normalized === "") return null;
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) {
    context.addIssue({ code: "custom", message: "Informe um número válido." });
    return z.NEVER;
  }
  return numeric;
});
const optionalNonNegativeDecimalSchema = decimalStringSchema.refine((value) => value === null || value >= 0, "O valor não pode ser negativo.");
const percentageSchema = optionalNonNegativeDecimalSchema.refine((value) => value === null || value <= 100, "O percentual deve estar entre 0 e 100.");
const optionalPositiveIntSchema = z.union([z.string(), z.number(), z.null(), z.undefined()]).transform((value, context) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    context.addIssue({ code: "custom", message: "Informe um inteiro positivo." });
    return z.NEVER;
  }
  return numeric;
});

const controlledFormulaSchema = z.string().trim().max(500).regex(
  /^[A-Z0-9_+\-*/()., %]+$/,
  "A fórmula de referência aceita apenas identificadores em maiúsculo, números e operadores básicos.",
).optional().transform((value) => value || null);

export const hrPayrollRuleInputSchema = z.object({
  id: z.string().min(1).optional(),
  ruleSetId: z.string().min(1),
  category: z.enum(HR_RULE_CATEGORIES),
  code: stableCodeSchema,
  name: labelSchema,
  description: nullableTextSchema,
  valueType: z.enum(HR_RULE_VALUE_TYPES),
  value: z.unknown(),
  unit: nullableShortTextSchema,
  sortOrder: z.coerce.number().int().min(0).max(100_000).default(100),
  legalReference: nullableTextSchema,
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
}).strict();

export const hrPayrollRubricInputSchema = z.object({
  id: z.string().min(1).optional(),
  ruleSetId: z.string().min(1),
  code: stableCodeSchema,
  name: labelSchema,
  type: z.enum(HR_RUBRIC_TYPES),
  esocialNatureCode: nullableShortTextSchema,
  calculationMethod: z.enum(HR_RUBRIC_CALCULATION_METHODS).default("MANUAL"),
  formulaExpression: controlledFormulaSchema,
  calculationBaseCode: optionalCodeSchema,
  fixedValue: optionalNonNegativeDecimalSchema,
  percentageRate: percentageSchema,
  priority: z.coerce.number().int().min(0).max(100_000).default(100),
  legalReference: nullableTextSchema,
  notes: nullableTextSchema,
  incidences: z.array(z.enum(HR_INCIDENT_TYPES)).max(HR_INCIDENT_TYPES.length).default([]),
  isActive: z.boolean().default(true),
}).strict().superRefine((input, context) => {
  if (new Set(input.incidences).size !== input.incidences.length) {
    context.addIssue({ code: "custom", path: ["incidences"], message: "Cada incidência pode ser informada apenas uma vez." });
  }
  if (input.calculationMethod === "VALOR_FIXO" && input.fixedValue === null) {
    context.addIssue({ code: "custom", path: ["fixedValue"], message: "Informe o valor fixo da rubrica." });
  }
  if (input.calculationMethod === "PERCENTUAL" && input.percentageRate === null) {
    context.addIssue({ code: "custom", path: ["percentageRate"], message: "Informe o percentual da rubrica." });
  }
  if (input.calculationMethod === "FORMULA_CONTROLADA" && !input.formulaExpression) {
    context.addIssue({ code: "custom", path: ["formulaExpression"], message: "Informe a fórmula de referência da rubrica." });
  }
});

export const hrVacationPolicyInputSchema = z.object({
  id: z.string().min(1).optional(),
  ruleSetId: z.string().min(1),
  code: stableCodeSchema,
  name: labelSchema,
  employmentNature: z.enum(HR_EMPLOYMENT_NATURES),
  acquisitionMonths: z.coerce.number().int().min(1).max(60),
  concessionMonths: z.coerce.number().int().min(1).max(60),
  entitlementDays: z.coerce.number().int().min(1).max(90),
  maxSplits: z.coerce.number().int().min(1).max(12),
  minFirstSplitDays: z.coerce.number().int().min(1).max(90),
  minOtherSplitDays: z.coerce.number().int().min(1).max(90),
  additionalPayRate: percentageSchema.refine((value) => value !== null, "Informe o percentual do adicional."),
  allowsCashAbono: z.boolean().default(false),
  maxCashAbonoDays: z.coerce.number().int().min(0).max(90).default(0),
  allowsAdvanceThirteenth: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
  legalReference: nullableTextSchema,
  notes: nullableTextSchema,
  isActive: z.boolean().default(true),
}).strict().superRefine((input, context) => {
  if (input.minFirstSplitDays > input.entitlementDays) {
    context.addIssue({ code: "custom", path: ["minFirstSplitDays"], message: "O primeiro período não pode exceder o total de dias." });
  }
  if (!input.allowsCashAbono && input.maxCashAbonoDays !== 0) {
    context.addIssue({ code: "custom", path: ["maxCashAbonoDays"], message: "Informe zero quando o abono não for permitido." });
  }
});

export const hrSocialSecuritySchemeInputSchema = z.object({
  id: z.string().min(1).optional(),
  ruleSetId: z.string().min(1),
  code: stableCodeSchema,
  name: labelSchema,
  regime: z.enum(HR_SOCIAL_SECURITY_REGIMES),
  employeeCalculationMethod: z.enum(HR_SOCIAL_SECURITY_METHODS),
  ceilingValue: optionalNonNegativeDecimalSchema,
  employerContributionRate: percentageSchema,
  actuarialContributionRate: percentageSchema,
  legalReference: nullableTextSchema,
  notes: nullableTextSchema,
  isActive: z.boolean().default(true),
}).strict();

export const hrSocialSecurityBandInputSchema = z.object({
  id: z.string().min(1).optional(),
  socialSecuritySchemeId: z.string().min(1),
  sequence: z.coerce.number().int().min(1).max(100),
  lowerLimit: optionalNonNegativeDecimalSchema.refine((value) => value !== null, "Informe o limite inferior."),
  upperLimit: optionalNonNegativeDecimalSchema,
  employeeRate: percentageSchema.refine((value) => value !== null, "Informe a alíquota do servidor."),
  employerRate: percentageSchema,
}).strict().superRefine((input, context) => {
  if (input.upperLimit !== null && input.lowerLimit !== null && input.upperLimit <= input.lowerLimit) {
    context.addIssue({ code: "custom", path: ["upperLimit"], message: "O limite superior deve ser maior que o limite inferior." });
  }
});

export const hrCalculationPolicyInputSchema = z.object({
  ruleSetId: z.string().min(1),
  currency: z.literal("BRL").default("BRL"),
  roundingMode: z.enum(HR_ROUNDING_MODES),
  roundingScale: z.coerce.number().int().min(0).max(6),
  movementCutoffDay: z.coerce.number().int().min(1).max(31),
  paymentDay: optionalPositiveIntSchema.refine((value) => value === null || value <= 31, "O dia deve estar entre 1 e 31."),
  negativeNetPayPolicy: z.enum(HR_NEGATIVE_NET_PAY_POLICIES),
  maxConsignmentMarginRate: percentageSchema,
  remunerationCeiling: optionalNonNegativeDecimalSchema,
  freezeOnClose: z.boolean().default(true),
  legalReference: nullableTextSchema,
  notes: nullableTextSchema,
}).strict();

export const hrEmploymentRegimeInputSchema = z.object({
  id: z.string().min(1).optional(),
  ruleSetId: z.string().min(1),
  code: stableCodeSchema,
  name: labelSchema,
  employmentNature: z.enum(HR_EMPLOYMENT_NATURES),
  esocialCategory: nullableShortTextSchema,
  defaultMonthlyHours: optionalPositiveIntSchema.refine((value) => value === null || value <= 744, "A jornada mensal não pode exceder 744 horas."),
  socialSecuritySchemeId: optionalIdentifierSchema,
  vacationPolicyId: optionalIdentifierSchema,
  legalReference: nullableTextSchema,
  isActive: z.boolean().default(true),
}).strict();

export const hrRuleSetInputSchema = z.object({
  id: z.string().min(1).optional(),
  code: stableCodeSchema,
  name: labelSchema,
  status: z.enum(HR_RULE_SET_STATUSES).default("RASCUNHO"),
  scope: z.enum(HR_RULE_SET_SCOPES).default("DEMONSTRACAO"),
  effectiveFrom: z.coerce.date(),
  effectiveUntil: z.coerce.date().optional().nullable(),
  legalReference: nullableTextSchema,
  notes: nullableTextSchema,
  isDemo: z.boolean().default(true),
}).strict().superRefine((input, context) => {
  if (input.effectiveUntil && input.effectiveUntil < input.effectiveFrom) {
    context.addIssue({ code: "custom", path: ["effectiveUntil"], message: "A vigência final não pode ser anterior à inicial." });
  }
  if (input.status === "ATIVA" && input.scope === "PRODUCAO" && input.isDemo) {
    context.addIssue({ code: "custom", path: ["isDemo"], message: "Uma regra ativa de produção não pode ser marcada como demonstração." });
  }
  if (input.status === "ATIVA" && input.scope === "PRODUCAO" && !input.legalReference) {
    context.addIssue({ code: "custom", path: ["legalReference"], message: "Informe a referência legal antes de ativar uma regra de produção." });
  }
});

function decimal(value: number | null) {
  return value === null ? null : new Prisma.Decimal(value);
}

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function parseRuleValue(valueType: z.infer<typeof hrPayrollRuleInputSchema>["valueType"], rawValue: unknown): Prisma.InputJsonValue {
  const raw = typeof rawValue === "string" ? rawValue.trim() : rawValue;

  if (valueType === "TEXT") {
    return z.string().trim().min(1).max(4_000).parse(raw);
  }
  if (valueType === "BOOLEAN") {
    if (raw === true || raw === "true") return true;
    if (raw === false || raw === "false") return false;
    throw new Error("O valor da regra deve ser verdadeiro ou falso.");
  }
  if (valueType === "INTEGER") {
    return z.coerce.number().int().parse(raw);
  }
  if (valueType === "DECIMAL" || valueType === "CURRENCY" || valueType === "PERCENTAGE") {
    const normalized = typeof raw === "string" ? raw.replace(",", ".") : raw;
    const value = z.coerce.number().finite().parse(normalized);
    if (valueType === "PERCENTAGE" && (value < 0 || value > 100)) throw new Error("O percentual da regra deve estar entre 0 e 100.");
    return value;
  }
  if (valueType === "DATE") {
    return z.string().date().parse(raw);
  }
  if (typeof raw !== "string") {
    if (raw === null) throw new Error("A regra JSON não pode ser nula.");
    return asInputJson(raw);
  }
  const parsed = JSON.parse(raw) as unknown;
  if (parsed === null) throw new Error("A regra JSON não pode ser nula.");
  return asInputJson(parsed);
}

export function serializeHrConfigurationSnapshot(value: unknown): Prisma.InputJsonValue {
  return asInputJson(value);
}

export async function getOrCreateHrConfigurationInstance(db: HrPayrollConfigurationDb) {
  const existing = await db.configuracaoInstancia.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;

  const institution = await db.institution.findFirst({
    orderBy: { createdAt: "asc" },
    select: { name: true, cnpj: true, city: true, state: true, website: true },
  });

  if (!institution?.name?.trim() || !institution.city?.trim() || !institution.state?.trim()) {
    throw new Error("Cadastre o nome, município e UF em Administração > Dados da Prefeitura antes de iniciar as parametrizações de RH.");
  }

  return db.configuracaoInstancia.create({
    data: {
      nomePrefeitura: institution.name.trim(),
      cnpj: institution.cnpj?.trim() || null,
      municipio: institution.city.trim(),
      uf: institution.state.trim().toUpperCase(),
      dominio: institution.website?.trim() || null,
      status: "Ativa",
    },
  });
}

function isPrismaClient(db: HrPayrollConfigurationDb): db is PrismaClient {
  return "$transaction" in db && typeof db.$transaction === "function";
}

async function lockHrConfigurationBootstrap(db: HrPayrollConfigurationDb) {
  // Serializa o bootstrap por transação no PostgreSQL/Neon e evita duas
  // requisições criarem conjuntos demonstrativos simultâneos.
  await db.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(1921002026)`);
}

async function ensureHrPayrollDemoRuleSetInTransaction(db: HrPayrollConfigurationDb, actorUsuarioId?: string) {
  await lockHrConfigurationBootstrap(db);
  const instance = await getOrCreateHrConfigurationInstance(db);
  const effectiveFrom = new Date("2026-01-01T00:00:00.000Z");
  let createdRuleSet = false;
  let ruleSet = await db.hrPayrollRuleSet.findFirst({
    where: { configuracaoInstanciaId: instance.id, code: "MUNICIPAL_DEMO_2026", effectiveFrom },
  });

  if (!ruleSet) {
    try {
      ruleSet = await db.hrPayrollRuleSet.create({
        data: {
          configuracaoInstanciaId: instance.id,
          code: "MUNICIPAL_DEMO_2026",
          name: "Regras municipais — demonstração 2026",
          status: "ATIVA",
          scope: "DEMONSTRACAO",
          effectiveFrom,
          legalReference: "Configuração didática. Substituir por estatuto, plano de cargos, normas previdenciárias e atos municipais vigentes.",
          notes: "Não representa folha oficial, remessa bancária, eSocial ou cálculo homologado.",
          isDemo: true,
        },
      });
      createdRuleSet = true;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      ruleSet = await db.hrPayrollRuleSet.findFirst({
        where: { configuracaoInstanciaId: instance.id, code: "MUNICIPAL_DEMO_2026", effectiveFrom },
      });
      if (!ruleSet) throw error;
    }
  }

  await db.hrCalculationPolicy.upsert({
    where: { ruleSetId: ruleSet.id },
    create: {
      ruleSetId: ruleSet.id,
      currency: "BRL",
      roundingMode: "HALF_UP",
      roundingScale: 2,
      movementCutoffDay: 20,
      paymentDay: 30,
      negativeNetPayPolicy: "BLOQUEAR",
      maxConsignmentMarginRate: new Prisma.Decimal(30),
      freezeOnClose: true,
      legalReference: "Valores de demonstração para conferência. Validar calendário, margem e teto com RH, Contabilidade e Jurídico.",
      notes: "A política deverá ser copiada para o snapshot imutável da competência no futuro motor de folha.",
    },
    update: {},
  });

  await db.hrPayrollRule.createMany({
    data: [
      { ruleSetId: ruleSet.id, category: "CALCULO", code: "COMPETENCIA_PADRAO", name: "Tipo padrão de competência", description: "Referência usada na demonstração de cálculo.", valueType: "TEXT", value: "MENSAL", sortOrder: 10, isRequired: true },
      { ruleSetId: ruleSet.id, category: "CALCULO", code: "ORDEM_RUBRICAS", name: "Ordem das rubricas", description: "A folha futura deve avaliar rubricas em prioridade crescente.", valueType: "TEXT", value: "PRIORIDADE_CRESCENTE", sortOrder: 20, isRequired: true },
      { ruleSetId: ruleSet.id, category: "CALCULO", code: "CONGELAR_CONFIGURACAO_NO_FECHAMENTO", name: "Congelar regras ao fechar", description: "Impede que alteração de parâmetro reescreva competência fechada.", valueType: "BOOLEAN", value: true, sortOrder: 30, isRequired: true },
      { ruleSetId: ruleSet.id, category: "FERIAS", code: "ADICIONAL_FERIAS_PERCENTUAL", name: "Adicional de férias", description: "Valor demonstrativo de um terço, editável por política e rubrica.", valueType: "PERCENTAGE", value: 33.333333, unit: "%", sortOrder: 40, legalReference: "Demonstrativo. Validar com a norma do vínculo.", isRequired: true },
      { ruleSetId: ruleSet.id, category: "CONSIGNACAO", code: "MARGEM_MAXIMA_PERCENTUAL", name: "Margem consignável máxima", description: "Percentual demonstrativo; convênio e legislação local prevalecem.", valueType: "PERCENTAGE", value: 30, unit: "%", sortOrder: 50, legalReference: "Demonstração. Substituir pelo limite vigente aplicável.", isRequired: true },
      { ruleSetId: ruleSet.id, category: "PORTAL", code: "PUBLICAR_SOMENTE_FOLHA_FECHADA", name: "Publicar somente após fechamento", description: "O Portal do Servidor só pode receber demonstrativos autorizados.", valueType: "BOOLEAN", value: true, sortOrder: 60, isRequired: true },
      { ruleSetId: ruleSet.id, category: "PORTAL", code: "PORTAL_DEMONSTRATIVOS_HABILITADOS", name: "Disponibilizar demonstrativos no Portal", description: "Controla a consulta de demonstrativos pelo próprio servidor no Portal do Servidor.", valueType: "BOOLEAN", value: true, sortOrder: 65, legalReference: "Demonstração. Não altera o filtro de folhas fechadas ou pagas.", isRequired: true },
      { ruleSetId: ruleSet.id, category: "PREVIDENCIA", code: "VALIDAR_PREVIDENCIA_ANTES_PRODUCAO", name: "Validação de previdência obrigatória", description: "As alíquotas e faixas abaixo são exclusivamente demonstrativas.", valueType: "BOOLEAN", value: true, sortOrder: 70, legalReference: "Não utilizar para recolhimento sem homologação municipal.", isRequired: true },
    ],
    skipDuplicates: true,
  });

  const statutoryVacation = await db.hrVacationPolicy.upsert({
    where: { ruleSetId_code: { ruleSetId: ruleSet.id, code: "ESTATUTARIO_DEMO" } },
    create: { ruleSetId: ruleSet.id, code: "ESTATUTARIO_DEMO", name: "Férias estatutárias — demonstração", employmentNature: "ESTATUTARIO", acquisitionMonths: 12, concessionMonths: 12, entitlementDays: 30, maxSplits: 3, minFirstSplitDays: 14, minOtherSplitDays: 5, additionalPayRate: new Prisma.Decimal("33.333333"), allowsCashAbono: false, maxCashAbonoDays: 0, allowsAdvanceThirteenth: false, requiresApproval: true, legalReference: "Demonstração. O estatuto municipal e atos vigentes devem substituir estes valores antes de produção.", notes: "Abono e antecipação ficam desativados até validação normativa." },
    update: {},
  });
  const cltVacation = await db.hrVacationPolicy.upsert({
    where: { ruleSetId_code: { ruleSetId: ruleSet.id, code: "CLT_PADRAO" } },
    create: {
      ruleSetId: ruleSet.id,
      code: "CLT_PADRAO",
      name: "Férias CLT — referência parametrizável",
      employmentNature: "CLT",
      acquisitionMonths: 12,
      concessionMonths: 12,
      entitlementDays: 30,
      maxSplits: 3,
      minFirstSplitDays: 14,
      minOtherSplitDays: 5,
      additionalPayRate: new Prisma.Decimal("33.333333"),
      allowsCashAbono: true,
      maxCashAbonoDays: 10,
      allowsAdvanceThirteenth: true,
      requiresApproval: true,
      legalReference: "Referência demonstrativa da CLT. Confirmar regras aplicáveis, convenções e atos municipais antes de produção.",
      notes: "Abono e antecipação do décimo terceiro exigem validação do RH antes do uso em folha oficial.",
    },
    update: {},
  });

  const rppsScheme = await db.hrSocialSecurityScheme.upsert({
    where: { ruleSetId_code: { ruleSetId: ruleSet.id, code: "RPPS_MUNICIPAL_DEMO" } },
    create: {
      ruleSetId: ruleSet.id,
      code: "RPPS_MUNICIPAL_DEMO",
      name: "RPPS municipal — demonstração",
      regime: "RPPS",
      employeeCalculationMethod: "PROGRESSIVA",
      ceilingValue: new Prisma.Decimal(4_000),
      employerContributionRate: new Prisma.Decimal(20),
      actuarialContributionRate: null,
      legalReference: "Faixas sintéticas de demonstração. Substituir pela legislação e avaliação atuarial vigentes do ente.",
      notes: "Não utilizar estas alíquotas para retenção ou recolhimento oficial.",
    },
    update: {},
  });

  await db.hrSocialSecurityBand.createMany({
    data: [
      { socialSecuritySchemeId: rppsScheme.id, sequence: 1, lowerLimit: new Prisma.Decimal(0), upperLimit: new Prisma.Decimal(1_000), employeeRate: new Prisma.Decimal(5), employerRate: new Prisma.Decimal(20) },
      { socialSecuritySchemeId: rppsScheme.id, sequence: 2, lowerLimit: new Prisma.Decimal("1000.01"), upperLimit: new Prisma.Decimal(3_000), employeeRate: new Prisma.Decimal(10), employerRate: new Prisma.Decimal(20) },
      { socialSecuritySchemeId: rppsScheme.id, sequence: 3, lowerLimit: new Prisma.Decimal("3000.01"), upperLimit: new Prisma.Decimal(4_000), employeeRate: new Prisma.Decimal(15), employerRate: new Prisma.Decimal(20) },
    ],
    skipDuplicates: true,
  });

  const baseSalaryRubric = await db.hrPayrollRubric.upsert({
    where: { ruleSetId_code: { ruleSetId: ruleSet.id, code: "VENCIMENTO_BASE_DEMO" } },
    create: {
      ruleSetId: ruleSet.id,
      code: "VENCIMENTO_BASE_DEMO",
      name: "Vencimento-base — demonstração",
      type: "PROVENTO",
      calculationMethod: "MANUAL",
      priority: 10,
      legalReference: "Rubrica demonstrativa. Validar natureza, incidências e mapeamento eSocial antes de produção.",
      notes: "Base ilustrativa para testar a configuração versionada; não integra o motor de folha legado.",
    },
    update: {},
  });

  await db.hrPayrollRubricIncidence.createMany({
    data: ["RPPS", "IRRF", "FERIAS", "DECIMO_TERCEIRO", "TETO_REMUNERATORIO"].map((incidenceType) => ({
      rubricId: baseSalaryRubric.id,
      incidenceType,
    })),
    skipDuplicates: true,
  });

  await db.hrPayrollRubric.createMany({
    data: [
      {
        ruleSetId: ruleSet.id,
        code: "ADICIONAL_FERIAS_DEMO",
        name: "Adicional de férias — demonstração",
        type: "PROVENTO",
        calculationMethod: "PERCENTUAL",
        calculationBaseCode: "VENCIMENTO_BASE_DEMO",
        percentageRate: new Prisma.Decimal("33.333333"),
        priority: 20,
        legalReference: "Demonstração de um terço. Confirmar incidências e critérios do vínculo antes de produção.",
        notes: "A política de férias mantém a fonte de verdade deste percentual.",
      },
      {
        ruleSetId: ruleSet.id,
        code: "PREVIDENCIA_SERVIDOR_DEMO",
        name: "Contribuição do servidor — demonstração",
        type: "DESCONTO",
        calculationMethod: "FORMULA_CONTROLADA",
        formulaExpression: "VENCIMENTO_BASE_DEMO * 10 / 100",
        calculationBaseCode: "VENCIMENTO_BASE_DEMO",
        priority: 30,
        legalReference: "Alíquota exclusivamente didática. A tabela previdenciária vigente deve ser parametrizada e homologada.",
        notes: "Usada apenas para conferir o catálogo e as prioridades da demonstração.",
      },
      {
        ruleSetId: ruleSet.id,
        code: "ENCARGO_PATRONAL_DEMO",
        name: "Encargo patronal — demonstração",
        type: "INFORMATIVA",
        calculationMethod: "FORMULA_CONTROLADA",
        formulaExpression: "VENCIMENTO_BASE_DEMO * 20 / 100",
        calculationBaseCode: "VENCIMENTO_BASE_DEMO",
        priority: 40,
        legalReference: "Valor ilustrativo, separado do líquido do servidor e sujeito à validação atuarial e contábil.",
        notes: "Não representa guia, obrigação de recolhimento ou lançamento contábil oficial.",
      },
      {
        ruleSetId: ruleSet.id,
        code: "CONSIGNACAO_DEMO",
        name: "Consignação — demonstração",
        type: "DESCONTO",
        calculationMethod: "MANUAL",
        priority: 50,
        legalReference: "Demonstração. Convênio, margem e autorização do servidor devem ser validados antes de produção.",
        notes: "A política de cálculo contém a margem máxima demonstrativa.",
      },
    ],
    skipDuplicates: true,
  });

  await db.hrEmploymentRegime.upsert({
    where: { ruleSetId_code: { ruleSetId: ruleSet.id, code: "ESTATUTARIO_DEMO" } },
    create: {
      ruleSetId: ruleSet.id,
      code: "ESTATUTARIO_DEMO",
      name: "Vínculo estatutário — demonstração",
      employmentNature: "ESTATUTARIO",
      defaultMonthlyHours: null,
      socialSecuritySchemeId: rppsScheme.id,
      vacationPolicyId: statutoryVacation.id,
      legalReference: "Demonstração. A vinculação efetiva depende do estatuto e do enquadramento previdenciário municipal.",
    },
    update: {},
  });

  await db.hrEmploymentRegime.upsert({
    where: { ruleSetId_code: { ruleSetId: ruleSet.id, code: "CLT_DEMO" } },
    create: {
      ruleSetId: ruleSet.id,
      code: "CLT_DEMO",
      name: "Vínculo CLT — demonstração",
      employmentNature: "CLT",
      defaultMonthlyHours: null,
      socialSecuritySchemeId: null,
      vacationPolicyId: cltVacation.id,
      legalReference: "Demonstração. O enquadramento RGPS, jornada e categoria eSocial devem ser validados antes de produção.",
    },
    update: {},
  });

  if (createdRuleSet && actorUsuarioId) {
    await db.hrPayrollConfigurationChange.create({
      data: {
        ruleSetId: ruleSet.id,
        entityType: "HR_PAYROLL_RULE_SET",
        entityId: ruleSet.id,
        operation: "CRIADA",
        afterValue: serializeHrConfigurationSnapshot(ruleSet),
        actorUsuarioId,
      },
    });
  }

  return ruleSet;
}

export async function ensureHrPayrollDemoRuleSet(db: HrPayrollConfigurationDb, actorUsuarioId?: string) {
  if (isPrismaClient(db)) {
    return db.$transaction((tx) => ensureHrPayrollDemoRuleSetInTransaction(tx, actorUsuarioId));
  }
  return ensureHrPayrollDemoRuleSetInTransaction(db, actorUsuarioId);
}

export function toDecimal(value: number | null) {
  return decimal(value);
}

export async function arePortalPayrollStatementsEnabled(db: HrPayrollConfigurationDb) {
  const instance = await db.configuracaoInstancia.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!instance) return true;

  const now = new Date();
  const ruleSet = await db.hrPayrollRuleSet.findFirst({
    where: {
      configuracaoInstanciaId: instance.id,
      status: "ATIVA",
      effectiveFrom: { lte: now },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }],
      rules: {
        some: {
          category: "PORTAL",
          code: "PORTAL_DEMONSTRATIVOS_HABILITADOS",
          isActive: true,
        },
      },
    },
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
    select: {
      rules: {
        where: {
          category: "PORTAL",
          code: "PORTAL_DEMONSTRATIVOS_HABILITADOS",
          isActive: true,
        },
        select: { value: true },
      },
    },
  });

  // Preserve existing Portal access until a current RH rule explicitly disables it.
  const value = ruleSet?.rules[0]?.value;
  return value !== false && value !== "false";
}
