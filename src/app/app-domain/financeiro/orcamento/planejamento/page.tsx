import { canEditModule, getTenantContextForModule, isSystemAdministrator } from "@/lib/platform/tenant-context";
import PlanejamentoClient from "./PlanejamentoClient";

export const dynamic = "force-dynamic";

export default async function PlanejamentoPage() {
  const context = await getTenantContextForModule("FINANCEIRO");
  const budgetUnitFilter = isSystemAdministrator(context.user)
    ? {}
    : { id: { in: context.user.allowedBudgetUnitIds } };
  const [plans, financialYears, budgetUnits, expenseNatures, resourceSources, amendments] = await Promise.all([
    context.prisma.multiYearPlan.findMany({
      include: {
        programs: {
          include: {
            objectives: { include: { indicators: true }, orderBy: { code: "asc" } },
            actions: { include: { goals: { orderBy: { year: "asc" } } }, orderBy: { code: "asc" } },
          },
          orderBy: { code: "asc" },
        },
        budgetGuidelines: {
          include: {
            financialYear: { select: { year: true, status: true } },
            priorities: true,
            risks: true,
            annualBudgetLaws: {
              include: {
                revenueForecasts: true,
                expenseFixations: {
                  include: {
                    appropriations: { select: { id: true, initialValue: true, initialValueDecimal: true, code: true, programPPA: { select: { code: true, name: true } }, actionPPA: { select: { code: true, name: true } } } },
                  },
                },
                cmdSchedules: { orderBy: { month: "asc" } },
                mbaTargets: { orderBy: { bimonth: "asc" } },
              },
            },
          },
        },
      },
      orderBy: { startYear: "desc" },
    }),
    context.prisma.financialYear.findMany({ select: { id: true, year: true, status: true }, orderBy: { year: "desc" } }),
    context.prisma.budgetUnit.findMany({ where: budgetUnitFilter, select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
    context.prisma.expenseNature.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
    context.prisma.resourceSource.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
    context.prisma.planningAmendment.findMany({
      select: { id: true, entityType: true, entityId: true, version: true, reason: true, originalSnapshot: true, amendedSnapshot: true, createdAt: true },
      orderBy: [{ entityType: "asc" }, { entityId: "asc" }, { version: "desc" }],
    }),
  ]);

  const budgetUnitById = new Map(budgetUnits.map((unit) => [unit.id, unit]));
  const fixations = plans.flatMap((plan) => plan.budgetGuidelines.flatMap((guideline) => guideline.annualBudgetLaws.flatMap((law) => law.expenseFixations.map((fixation) => {
    const allocated = fixation.appropriations.reduce((total, appropriation) => total + Number(appropriation.initialValueDecimal ?? appropriation.initialValue), 0);
    return {
      id: fixation.id,
      code: fixation.code,
      name: fixation.name,
      fixedValue: Number(fixation.fixedValue),
      allocatedValue: allocated,
      annualBudgetLaw: { lawNumber: law.lawNumber, financialYear: guideline.financialYear.year },
      plan: { code: plan.code, name: plan.name },
    };
  }))));

  return <PlanejamentoClient
    plans={plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      startYear: plan.startYear,
      endYear: plan.endYear,
       programs: plan.programs.map((program) => ({
         id: program.id,
         code: program.code,
         name: program.name,
         objectives: program.objectives.map((objective) => ({
           id: objective.id,
           code: objective.code,
           description: objective.description,
           indicators: objective.indicators.map((indicator) => ({ id: indicator.id, name: indicator.name, unit: indicator.unit, baselineValue: indicator.baselineValue, targetValue: indicator.targetValue })),
         })),
         actions: program.actions.map((action) => ({ id: action.id, code: action.code, name: action.name, goals: action.goals.map((goal) => ({ id: goal.id, year: goal.year, physical: goal.physical, financial: Number(goal.financial) })) })),
       })),
       guidelines: plan.budgetGuidelines.map((guideline) => ({
         id: guideline.id,
         financialYear: guideline.financialYear,
         priorities: guideline.priorities.map((priority) => ({ id: priority.id, description: priority.description, targetValue: priority.targetValue === null ? null : Number(priority.targetValue) })),
         risks: guideline.risks.map((risk) => ({ id: risk.id, description: risk.description, estimatedImpact: Number(risk.estimatedImpact), mitigation: risk.mitigation })),
         laws: guideline.annualBudgetLaws.map((law) => ({
          id: law.id,
          lawNumber: law.lawNumber,
            publicationDate: law.publicationDate?.toISOString() ?? "",
           totalRevenue: Number(law.totalRevenue),
           totalExpense: Number(law.totalExpense),
           revenueForecasts: law.revenueForecasts.map((forecast) => ({ id: forecast.id, code: forecast.code, name: forecast.name, estimatedValue: Number(forecast.estimatedValue) })),
           expenseFixations: law.expenseFixations.map((fixation) => ({ id: fixation.id, code: fixation.code, name: fixation.name, fixedValue: Number(fixation.fixedValue) })),
          cmdSchedules: law.cmdSchedules.map((schedule) => ({ id: schedule.id, month: schedule.month, limitValue: Number(schedule.limitValue), budgetUnit: budgetUnitById.get(schedule.budgetUnitId) ?? { code: "UG removida", name: "Unidade nao encontrada" } })),
          mbaTargets: law.mbaTargets.map((target) => ({ id: target.id, bimonth: target.bimonth, targetValue: Number(target.targetValue) })),
        })),
      })),
    }))}
    financialYears={financialYears}
    fixations={fixations}
    budgetUnits={budgetUnits}
    expenseNatures={expenseNatures}
    resourceSources={resourceSources}
    amendments={amendments.map((amendment) => ({ ...amendment, createdAt: amendment.createdAt.toISOString() }))}
    canEdit={canEditModule(context.user, "FINANCEIRO")}
  />;
}
