"use server";

import { FinanceError } from "@/lib/financeiro";
import {
  createMultiYearPlan,
  addProgramPPA,
  addActionPPA,
  addObjectivePPA,
  addIndicatorPPA,
  addGoalPPA,
  createBudgetGuideline,
  createAnnualBudgetLaw,
  createBudgetAppropriationFromFixation,
  saveBimonthlyRevenueTarget,
  saveMonthlyDisbursementSchedule,
  createPlanningAmendment,
  createCreditRequest,
  approveCreditRequest,
  executeCreditRequest,
  submitCreditRequest,
  sanctionCreditRequest,
  publishCreditRequest,
  transitionPlanningLegalWorkflow,
} from "@/lib/financeiro/planejamento";
import { getTenantContextForModuleOperation, isSystemAdministrator, type AppContext } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

type ActionResult<T = undefined> = { error?: string; data?: T };

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof FinanceError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function financeActor(context: AppContext) {
  return {
    usuarioId: context.user.id,
    employeeId: context.user.employeeId,
    allowedBudgetUnitIds: isSystemAdministrator(context.user) ? undefined : context.user.allowedBudgetUnitIds,
  };
}

const creditRequestSchema = z.object({
  number: z.string().trim().min(1),
  financialYearId: z.string().min(1),
  type: z.enum(["Suplementar", "Especial", "Extraordinário", "Remanejamento", "Transposição", "Transferência"]),
  lawNumber: z.string().trim().min(1).optional(),
  legalActNumber: z.string().trim().min(1),
  legalActDate: z.string().min(1),
  legalDocumentId: z.string().min(1),
  fundingSourceId: z.string().min(1),
  justification: z.string().trim().min(1),
  items: z.array(z.object({
    appropriationId: z.string().min(1),
    type: z.enum(["Acréscimo", "Anulação"]),
    value: z.number().finite().positive(),
  })).min(1),
});

const multiYearPlanSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  startYear: z.number().int(),
  endYear: z.number().int(),
  description: z.string().trim().min(1).optional(),
});

const programSchema = z.object({
  multiYearPlanId: z.string().min(1),
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.string().trim().min(1).optional(),
});

const actionSchema = z.object({
  programId: z.string().min(1),
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.string().trim().min(1).optional(),
});

const objectiveSchema = z.object({
  programId: z.string().min(1),
  code: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

const indicatorSchema = z.object({
  objectiveId: z.string().min(1),
  name: z.string().trim().min(1),
  unit: z.string().trim().min(1),
  baselineValue: z.number().finite().nonnegative(),
  targetValue: z.number().finite().nonnegative(),
});

const goalSchema = z.object({
  actionId: z.string().min(1),
  year: z.number().int(),
  physical: z.number().finite().nonnegative(),
  financial: z.number().finite().nonnegative(),
});

const guidelineSchema = z.object({
  financialYearId: z.string().min(1),
  multiYearPlanId: z.string().min(1),
  priorities: z.array(z.object({
    description: z.string().trim().min(1),
    targetValue: z.number().finite().positive().optional(),
  })).optional(),
  risks: z.array(z.object({
    description: z.string().trim().min(1),
    estimatedImpact: z.number().finite().positive(),
    mitigation: z.string().trim().min(1),
  })).optional(),
});

const annualBudgetLawSchema = z.object({
  lawNumber: z.string().trim().min(1),
  publicationDate: z.string().min(1),
  financialYearId: z.string().min(1),
  budgetGuidelineId: z.string().min(1),
  totalRevenue: z.number().finite().positive(),
  totalExpense: z.number().finite().positive(),
  revenueForecasts: z.array(z.object({
    code: z.string().trim().min(1),
    name: z.string().trim().min(1),
    estimatedValue: z.number().finite().positive(),
  })).min(1).optional(),
  expenseFixations: z.array(z.object({
    code: z.string().trim().min(1),
    name: z.string().trim().min(1),
    fixedValue: z.number().finite().positive(),
  })).min(1).optional(),
});

const planningAmendmentSchema = z.object({
  entityType: z.enum(["PPA", "LDO", "LOA"]),
  entityId: z.string().min(1),
  reason: z.string().trim().min(1),
  amendedSnapshot: z.record(z.string(), z.unknown()),
});

const planningTransitionSchema = z.object({
  entityType: z.enum(["PPA", "LDO", "LOA"]),
  entityId: z.string().min(1),
  stage: z.enum(["SUBMITTED", "APPROVED", "SANCTIONED", "PUBLISHED"]),
  legalEvidence: z.object({
    legalActNumber: z.string().trim().min(1),
    legalActDate: z.string().min(1),
    legalDocumentId: z.string().min(1),
  }).optional(),
  publication: z.object({
    publicationDate: z.string().min(1),
    publicationReference: z.string().trim().min(1),
  }).optional(),
});

export async function actionCreateMultiYearPlan(input: {
  code: string;
  name: string;
  startYear: number;
  endYear: number;
  description?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const actor = financeActor(context);
    const plan = await createMultiYearPlan(context.prisma, actor, multiYearPlanSchema.parse(input));
    revalidatePath("/financeiro/orcamento/planejamento");
    return { data: { id: plan.id } };
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível criar o Plano Plurianual.") };
  }
}

export async function actionAddProgramPPA(input: {
  multiYearPlanId: string;
  code: string;
  name: string;
  type?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const actor = financeActor(context);
    const program = await addProgramPPA(context.prisma, actor, programSchema.parse(input));
    revalidatePath("/financeiro/orcamento/planejamento");
    return { data: { id: program.id } };
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível adicionar o programa ao PPA.") };
  }
}

export async function actionAddActionPPA(input: {
  programId: string;
  code: string;
  name: string;
  type?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const action = await addActionPPA(context.prisma, financeActor(context), actionSchema.parse(input));
    revalidatePath("/financeiro/orcamento/planejamento");
    return { data: { id: action.id } };
  } catch (error) {
    return { error: errorMessage(error, "Nao foi possivel adicionar a acao ao PPA.") };
  }
}

export async function actionAddObjectivePPA(input: {
  programId: string;
  code: string;
  description: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const objective = await addObjectivePPA(context.prisma, financeActor(context), objectiveSchema.parse(input));
    revalidatePath("/financeiro/orcamento/planejamento");
    return { data: { id: objective.id } };
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível adicionar o objetivo ao PPA.") };
  }
}

export async function actionAddIndicatorPPA(input: {
  objectiveId: string;
  name: string;
  unit: string;
  baselineValue: number;
  targetValue: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const indicator = await addIndicatorPPA(context.prisma, financeActor(context), indicatorSchema.parse(input));
    revalidatePath("/financeiro/orcamento/planejamento");
    return { data: { id: indicator.id } };
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível adicionar o indicador ao PPA.") };
  }
}

export async function actionAddGoalPPA(input: {
  actionId: string;
  year: number;
  physical: number;
  financial: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const goal = await addGoalPPA(context.prisma, financeActor(context), goalSchema.parse(input));
    revalidatePath("/financeiro/orcamento/planejamento");
    return { data: { id: goal.id } };
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível adicionar a meta da ação do PPA.") };
  }
}

export async function actionCreateBudgetGuideline(input: {
  financialYearId: string;
  multiYearPlanId: string;
  priorities?: { description: string; targetValue?: number }[];
  risks?: { description: string; estimatedImpact: number; mitigation: string }[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const actor = financeActor(context);
    const guideline = await createBudgetGuideline(context.prisma, actor, guidelineSchema.parse(input));
    revalidatePath("/financeiro/orcamento/planejamento");
    return { data: { id: guideline.id } };
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível salvar a LDO.") };
  }
}

export async function actionCreateAnnualBudgetLaw(input: {
  lawNumber: string;
  publicationDate: string;
  financialYearId: string;
  budgetGuidelineId: string;
  totalRevenue: number;
  totalExpense: number;
  revenueForecasts?: { code: string; name: string; estimatedValue: number }[];
  expenseFixations?: { code: string; name: string; fixedValue: number }[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const actor = financeActor(context);
    const parsedInput = annualBudgetLawSchema.parse(input);
    const loa = await createAnnualBudgetLaw(context.prisma, actor, {
      ...parsedInput,
      publicationDate: new Date(parsedInput.publicationDate),
    });
    revalidatePath("/financeiro/orcamento/planejamento");
    return { data: { id: loa.id } };
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível cadastrar a LOA.") };
  }
}

export async function actionTransitionPlanningLegalWorkflow(input: {
  entityType: "PPA" | "LDO" | "LOA";
  entityId: string;
  stage: "SUBMITTED" | "APPROVED" | "SANCTIONED" | "PUBLISHED";
  legalEvidence?: { legalActNumber: string; legalActDate: string; legalDocumentId: string };
  publication?: { publicationDate: string; publicationReference: string };
}): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    const parsedInput = planningTransitionSchema.parse(input);
    await transitionPlanningLegalWorkflow(context.prisma, financeActor(context), {
      ...parsedInput,
      legalEvidence: parsedInput.legalEvidence && { ...parsedInput.legalEvidence, legalActDate: new Date(parsedInput.legalEvidence.legalActDate) },
      publication: parsedInput.publication && { ...parsedInput.publication, publicationDate: new Date(parsedInput.publication.publicationDate) },
    });
    revalidatePath("/financeiro/orcamento/planejamento");
    return {};
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível alterar a etapa legal do planejamento.") };
  }
}

export async function actionCreatePlanningAmendment(input: {
  entityType: "PPA" | "LDO" | "LOA";
  entityId: string;
  reason: string;
  amendedSnapshot: Record<string, unknown>;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const parsedInput = planningAmendmentSchema.parse(input);
    const amendment = await createPlanningAmendment(context.prisma, financeActor(context), {
      ...parsedInput,
      amendedSnapshot: parsedInput.amendedSnapshot as Prisma.InputJsonObject,
    });
    revalidatePath("/financeiro/orcamento/planejamento");
    return { data: { id: amendment.id } };
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível registrar a alteração interna de planejamento.") };
  }
}

export async function actionCreateBudgetAppropriationFromFixation(input: {
  annualBudgetExpenseFixationId: string;
  programPPAId: string;
  actionPPAId: string;
  code: string;
  budgetUnitId: string;
  expenseNatureId: string;
  resourceSourceId: string;
  initialValue: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const appropriation = await createBudgetAppropriationFromFixation(context.prisma, financeActor(context), input);
    revalidatePath("/financeiro/orcamento");
    return { data: { id: appropriation.id } };
  } catch (error) {
    return { error: errorMessage(error, "Nao foi possivel criar a dotacao orcamentaria.") };
  }
}

export async function actionSaveMonthlyDisbursementSchedule(input: {
  annualBudgetLawId: string;
  month: number;
  budgetUnitId: string;
  limitValue: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    const schedule = await saveMonthlyDisbursementSchedule(context.prisma, financeActor(context), input);
    revalidatePath("/financeiro/orcamento/planejamento");
    return { data: { id: schedule.id } };
  } catch (error) {
    return { error: errorMessage(error, "Nao foi possivel salvar o CMD.") };
  }
}

export async function actionSaveBimonthlyRevenueTarget(input: {
  annualBudgetLawId: string;
  bimonth: number;
  targetValue: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    const target = await saveBimonthlyRevenueTarget(context.prisma, financeActor(context), input);
    revalidatePath("/financeiro/orcamento/planejamento");
    return { data: { id: target.id } };
  } catch (error) {
    return { error: errorMessage(error, "Nao foi possivel salvar a MBA.") };
  }
}

export async function actionCreateCreditRequest(input: {
  number: string;
  financialYearId: string;
  type: "Suplementar" | "Especial" | "Extraordinário" | "Remanejamento" | "Transposição" | "Transferência";
  lawNumber?: string;
  legalActNumber: string;
  legalActDate: string;
  legalDocumentId: string;
  fundingSourceId: string;
  justification: string;
  items: { appropriationId: string; type: "Acréscimo" | "Anulação"; value: number }[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const parsedInput = creditRequestSchema.parse(input);
    const credit = await createCreditRequest(context.prisma, financeActor(context), { ...parsedInput, legalActDate: new Date(parsedInput.legalActDate) });
    revalidatePath("/financeiro/orcamento");
    return { data: { id: credit.id } };
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível criar a solicitação de crédito.") };
  }
}

export async function actionSubmitCreditRequest(creditRequestId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    await submitCreditRequest(context.prisma, financeActor(context), z.string().min(1).parse(creditRequestId));
    revalidatePath("/financeiro/orcamento");
    return {};
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível submeter a solicitação de crédito.") };
  }
}

export async function actionApproveCreditRequest(creditRequestId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    await approveCreditRequest(context.prisma, financeActor(context), z.string().min(1).parse(creditRequestId));
    revalidatePath("/financeiro/orcamento");
    return {};
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível aprovar a solicitação de crédito.") };
  }
}

export async function actionExecuteCreditRequest(creditRequestId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    await executeCreditRequest(context.prisma, financeActor(context), z.string().min(1).parse(creditRequestId));
    revalidatePath("/financeiro/orcamento");
    return {};
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível efetivar o crédito adicional.") };
  }
}

export async function actionSanctionCreditRequest(creditRequestId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    await sanctionCreditRequest(context.prisma, financeActor(context), z.string().min(1).parse(creditRequestId));
    revalidatePath("/financeiro/orcamento");
    return {};
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível sancionar a solicitação de crédito.") };
  }
}

export async function actionPublishCreditRequest(input: {
  creditRequestId: string;
  publicationDate: string;
  publicationReference: string;
}): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    const parsedInput = z.object({ creditRequestId: z.string().min(1), publicationDate: z.string().min(1), publicationReference: z.string().trim().min(1) }).parse(input);
    await publishCreditRequest(context.prisma, financeActor(context), parsedInput.creditRequestId, {
      publicationDate: new Date(parsedInput.publicationDate),
      publicationReference: parsedInput.publicationReference,
    });
    revalidatePath("/financeiro/orcamento");
    return {};
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível publicar a solicitação de crédito.") };
  }
}
