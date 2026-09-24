import { SlidersHorizontal } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpPageTitle as PageHeader } from "@/components/app-ui/erp/ErpPageTitle";
import { HrPayrollSettingsClient, type HrPayrollSettingsView } from "./HrPayrollSettingsClient";

export const dynamic = "force-dynamic";

type SearchParams = { ruleSet?: string | string[] };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function decimalText(value: { toString(): string } | null | undefined) {
  return value?.toString() ?? null;
}

type RuleSetSummary = {
  id: string;
  status: string;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
};

function ruleSetPriority(ruleSet: RuleSetSummary, referenceDate: Date) {
  const isCurrent = ruleSet.effectiveFrom <= referenceDate
    && (!ruleSet.effectiveUntil || ruleSet.effectiveUntil >= referenceDate);

  if (ruleSet.status === "ATIVA" && isCurrent) return 0;
  if (ruleSet.status === "ATIVA") return 1;
  if (ruleSet.status === "RASCUNHO") return 2;
  return 3;
}

export default async function RhParametrizacoesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const params = await searchParams;
  const instance = await prisma.configuracaoInstancia.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  const ruleSets = instance ? await prisma.hrPayrollRuleSet.findMany({
    where: { configuracaoInstanciaId: instance.id },
    orderBy: [{ status: "asc" }, { effectiveFrom: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      scope: true,
      effectiveFrom: true,
      effectiveUntil: true,
      legalReference: true,
      notes: true,
      isDemo: true,
    },
  }) : [];
  const referenceDate = new Date();
  const orderedRuleSets = [...ruleSets].sort((left, right) => {
    const priorityDifference = ruleSetPriority(left, referenceDate) - ruleSetPriority(right, referenceDate);
    if (priorityDifference !== 0) return priorityDifference;
    return right.effectiveFrom.getTime() - left.effectiveFrom.getTime();
  });
  const requestedRuleSetId = firstValue(params.ruleSet);
  const selectedRuleSet = ruleSets.find((ruleSet) => ruleSet.id === requestedRuleSetId) ?? orderedRuleSets[0] ?? null;

  const settings: HrPayrollSettingsView | null = selectedRuleSet
    ? await prisma.hrPayrollRuleSet.findFirst({
      where: { id: selectedRuleSet.id, configuracaoInstanciaId: instance?.id },
      include: {
        rules: { orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { code: "asc" }] },
        rubrics: { orderBy: [{ priority: "asc" }, { code: "asc" }], include: { incidences: { orderBy: { incidenceType: "asc" } } } },
        vacationPolicies: { orderBy: [{ employmentNature: "asc" }, { code: "asc" }] },
        socialSecuritySchemes: { orderBy: [{ regime: "asc" }, { code: "asc" }], include: { bands: { orderBy: { sequence: "asc" } } } },
        calculationPolicy: true,
        employmentRegimes: { orderBy: [{ employmentNature: "asc" }, { code: "asc" }] },
      },
    }).then((ruleSet) => {
      if (!ruleSet) return null;
      return {
        ruleSet: {
          ...ruleSet,
          effectiveFrom: ruleSet.effectiveFrom.toISOString(),
          effectiveUntil: ruleSet.effectiveUntil?.toISOString() ?? null,
        },
        rules: ruleSet.rules.map((rule) => ({ ...rule, value: JSON.stringify(rule.value) })),
        rubrics: ruleSet.rubrics.map((rubric) => ({
          ...rubric,
          fixedValue: decimalText(rubric.fixedValue),
          percentageRate: decimalText(rubric.percentageRate),
          incidences: rubric.incidences.map((incidence) => incidence.incidenceType),
        })),
        vacationPolicies: ruleSet.vacationPolicies.map((policy) => ({ ...policy, additionalPayRate: decimalText(policy.additionalPayRate) ?? "0" })),
        socialSecuritySchemes: ruleSet.socialSecuritySchemes.map((scheme) => ({
          ...scheme,
          ceilingValue: decimalText(scheme.ceilingValue),
          employerContributionRate: decimalText(scheme.employerContributionRate),
          actuarialContributionRate: decimalText(scheme.actuarialContributionRate),
          bands: scheme.bands.map((band) => ({
            ...band,
            lowerLimit: decimalText(band.lowerLimit) ?? "0",
            upperLimit: decimalText(band.upperLimit),
            employeeRate: decimalText(band.employeeRate) ?? "0",
            employerRate: decimalText(band.employerRate),
          })),
        })),
        calculationPolicy: ruleSet.calculationPolicy ? {
          ...ruleSet.calculationPolicy,
          maxConsignmentMarginRate: decimalText(ruleSet.calculationPolicy.maxConsignmentMarginRate),
          remunerationCeiling: decimalText(ruleSet.calculationPolicy.remunerationCeiling),
        } : null,
        employmentRegimes: ruleSet.employmentRegimes,
      };
    })
    : null;

  return (
    <PageFrame className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
      <PageHeader
        title="Parametrizações de RH e Folha"
        icon={<SlidersHorizontal className="size-4 shrink-0 text-emerald-700" />}
      />
      <HrPayrollSettingsClient
        ruleSets={orderedRuleSets.map((ruleSet) => ({
          ...ruleSet,
          effectiveFrom: ruleSet.effectiveFrom.toISOString(),
          effectiveUntil: ruleSet.effectiveUntil?.toISOString() ?? null,
        }))}
        settings={settings}
      />
    </PageFrame>
  );
}
