"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpenCheck, CalendarClock, FileCog, History, Landmark, LayoutDashboard, Plus } from "lucide-react";
import {
  actionAddActionPPA,
  actionAddGoalPPA,
  actionAddIndicatorPPA,
  actionAddObjectivePPA,
  actionAddProgramPPA,
  actionCreateAnnualBudgetLaw,
  actionCreateBudgetAppropriationFromFixation,
  actionCreateBudgetGuideline,
  actionCreatePlanningAmendment,
  actionCreateMultiYearPlan,
  actionSaveBimonthlyRevenueTarget,
  actionSaveMonthlyDisbursementSchedule,
} from "../planejamento-actions";

type Option = { id: string; code: string; name: string };
type Fixation = {
  id: string;
  code: string;
  name: string;
  fixedValue: number;
  allocatedValue: number;
  annualBudgetLaw: { lawNumber: string; financialYear: number };
  plan: { code: string; name: string };
};
type Plan = {
  id: string;
  code: string;
  name: string;
  startYear: number;
  endYear: number;
  programs: {
    id: string;
    code: string;
    name: string;
    objectives: { id: string; code: string; description: string; indicators: { id: string; name: string; unit: string; baselineValue: number; targetValue: number }[] }[];
    actions: { id: string; code: string; name: string; goals: { id: string; year: number; physical: number; financial: number }[] }[];
  }[];
  guidelines: {
    id: string;
    financialYear: { year: number; status: string };
    priorities: { id: string; description: string; targetValue: number | null }[];
    risks: { id: string; description: string; estimatedImpact: number; mitigation: string }[];
    laws: {
      id: string;
      lawNumber: string;
      publicationDate: string;
      totalRevenue: number;
      totalExpense: number;
      revenueForecasts: { id: string; code: string; name: string; estimatedValue: number }[];
      expenseFixations: { id: string; code: string; name: string; fixedValue: number }[];
      cmdSchedules: { id: string; month: number; limitValue: number; budgetUnit: { code: string; name: string } }[];
      mbaTargets: { id: string; bimonth: number; targetValue: number }[];
    }[];
  }[];
};
type FinancialYear = { id: string; year: number; status: string };
type PlanningAmendment = { id: string; entityType: string; entityId: string; version: number; reason: string; originalSnapshot: unknown; amendedSnapshot: unknown; createdAt: string };

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const emptyForecast = () => ({ code: "", name: "", estimatedValue: 0 });
const emptyFixation = () => ({ code: "", name: "", fixedValue: 0 });

export default function PlanejamentoClient({ plans, financialYears, fixations, budgetUnits, expenseNatures, resourceSources, amendments, canEdit }: {
  plans: Plan[];
  financialYears: FinancialYear[];
  fixations: Fixation[];
  budgetUnits: Option[];
  expenseNatures: Option[];
  resourceSources: Option[];
  amendments: PlanningAmendment[];
  canEdit: boolean;
}) {
  const [appropriationForm, setAppropriationForm] = useState({ annualBudgetExpenseFixationId: "", programPPAId: "", actionPPAId: "", code: "", budgetUnitId: "", expenseNatureId: "", resourceSourceId: "", initialValue: 0 });
  const [planForm, setPlanForm] = useState({ code: "", name: "", startYear: "", endYear: "", description: "" });
  const [programForm, setProgramForm] = useState({ multiYearPlanId: "", code: "", name: "" });
  const [actionForm, setActionForm] = useState({ programId: "", code: "", name: "", type: "Projeto" });
  const [objectiveForm, setObjectiveForm] = useState({ programId: "", code: "", description: "" });
  const [indicatorForm, setIndicatorForm] = useState({ objectiveId: "", name: "", unit: "", baselineValue: 0, targetValue: 0 });
  const [goalForm, setGoalForm] = useState({ actionId: "", year: "", physical: 0, financial: 0 });
  const [guidelineForm, setGuidelineForm] = useState({ multiYearPlanId: "", financialYearId: "", priorities: [{ description: "", targetValue: undefined as number | undefined }], risks: [] as { description: string; estimatedImpact: number; mitigation: string }[] });
  const [lawForm, setLawForm] = useState({ budgetGuidelineId: "", financialYearId: "", lawNumber: "", publicationDate: "", revenueForecasts: [emptyForecast()], expenseFixations: [emptyFixation()] });
  const [cmdForm, setCmdForm] = useState({ annualBudgetLawId: "", month: "1", budgetUnitId: "", limitValue: 0 });
  const [mbaForm, setMbaForm] = useState({ annualBudgetLawId: "", bimonth: "1", targetValue: 0 });
  const [amendmentForm, setAmendmentForm] = useState({ entityType: "PPA" as "PPA" | "LDO" | "LOA", entityId: "", reason: "", amendedSnapshot: "{}" });
  const [pending, setPending] = useState(false);
  const [activeSection, setActiveSection] = useState("visao-geral");

  const programs = plans.flatMap((plan) => plan.programs);
  const objectives = programs.flatMap((program) => program.objectives);
  const selectedFixation = fixations.find((fixation) => fixation.id === appropriationForm.annualBudgetExpenseFixationId);
  const selectedProgram = programs.find((program) => program.id === appropriationForm.programPPAId);
  const laws = plans.flatMap((plan) => plan.guidelines.flatMap((guideline) => guideline.laws.map((law) => ({ ...law, year: guideline.financialYear.year }))));
  const totalRevenue = lawForm.revenueForecasts.reduce((total, forecast) => total + forecast.estimatedValue, 0);
  const totalExpense = lawForm.expenseFixations.reduce((total, fixation) => total + fixation.fixedValue, 0);
  const amendmentEntities = amendmentForm.entityType === "PPA"
    ? plans.map((plan) => ({ id: plan.id, label: `${plan.code} - ${plan.name}`, snapshot: plan }))
    : amendmentForm.entityType === "LDO"
      ? plans.flatMap((plan) => plan.guidelines.map((guideline) => ({ id: guideline.id, label: `LDO ${guideline.financialYear.year}`, snapshot: guideline })))
      : laws.map((law) => ({ id: law.id, label: `${law.year} / ${law.lawNumber}`, snapshot: law }));
  const selectedAmendmentEntity = amendmentEntities.find((entity) => entity.id === amendmentForm.entityId);
  const sectionNav = [
    { id: "visao-geral", label: "Visão geral", icon: LayoutDashboard },
    { id: "ppa", label: "PPA", icon: BookOpenCheck },
    { id: "ldo-loa", label: "LDO e LOA", icon: Landmark },
    { id: "dotacoes", label: "Dotações", icon: FileCog },
    { id: "execucao", label: "CMD e MBA", icon: CalendarClock },
    { id: "historico", label: "Histórico", icon: History },
  ];

  async function run(action: () => Promise<{ error?: string }>) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (result.error) alert(result.error);
    return !result.error;
  }

  const submitAppropriation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (await run(() => actionCreateBudgetAppropriationFromFixation(appropriationForm))) {
      setAppropriationForm({ annualBudgetExpenseFixationId: "", programPPAId: "", actionPPAId: "", code: "", budgetUnitId: "", expenseNatureId: "", resourceSourceId: "", initialValue: 0 });
    }
  };
  const submitPlan = async (event: React.FormEvent) => {
    event.preventDefault();
    if (await run(() => actionCreateMultiYearPlan({ ...planForm, startYear: Number(planForm.startYear), endYear: Number(planForm.endYear), description: planForm.description || undefined }))) {
      setPlanForm({ code: "", name: "", startYear: "", endYear: "", description: "" });
    }
  };
  const submitProgram = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!programForm.multiYearPlanId) return alert("Selecione o PPA.");
    if (await run(() => actionAddProgramPPA(programForm))) setProgramForm({ multiYearPlanId: "", code: "", name: "" });
  };
  const submitAction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!actionForm.programId) return alert("Selecione o programa do PPA.");
    if (await run(() => actionAddActionPPA(actionForm))) setActionForm({ programId: "", code: "", name: "", type: "Projeto" });
  };
  const submitObjective = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!objectiveForm.programId) return alert("Selecione o programa do PPA.");
    if (await run(() => actionAddObjectivePPA(objectiveForm))) setObjectiveForm({ programId: "", code: "", description: "" });
  };
  const submitIndicator = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!indicatorForm.objectiveId) return alert("Selecione o objetivo do PPA.");
    if (await run(() => actionAddIndicatorPPA(indicatorForm))) setIndicatorForm({ objectiveId: "", name: "", unit: "", baselineValue: 0, targetValue: 0 });
  };
  const submitGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!goalForm.actionId || !goalForm.year) return alert("Selecione a ação e informe o ano da meta.");
    if (await run(() => actionAddGoalPPA({ ...goalForm, year: Number(goalForm.year) }))) setGoalForm({ actionId: "", year: "", physical: 0, financial: 0 });
  };
  const submitGuideline = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!guidelineForm.multiYearPlanId || !guidelineForm.financialYearId) return alert("Selecione o PPA e o exercício da LDO.");
    if (await run(() => actionCreateBudgetGuideline(guidelineForm))) setGuidelineForm({ multiYearPlanId: "", financialYearId: "", priorities: [{ description: "", targetValue: undefined }], risks: [] });
  };
  const submitLaw = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lawForm.budgetGuidelineId || !lawForm.financialYearId) return alert("Selecione a LDO e o exercício da LOA.");
    if (totalRevenue !== totalExpense) return alert("A soma das receitas previstas deve ser igual à soma das despesas fixadas.");
    if (await run(() => actionCreateAnnualBudgetLaw({ ...lawForm, totalRevenue, totalExpense }))) {
      setLawForm({ budgetGuidelineId: "", financialYearId: "", lawNumber: "", publicationDate: "", revenueForecasts: [emptyForecast()], expenseFixations: [emptyFixation()] });
    }
  };
  const submitCmd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cmdForm.annualBudgetLawId || !cmdForm.budgetUnitId) return alert("Selecione a LOA e a unidade orçamentária.");
    if (await run(() => actionSaveMonthlyDisbursementSchedule({ ...cmdForm, month: Number(cmdForm.month) }))) setCmdForm({ annualBudgetLawId: "", month: "1", budgetUnitId: "", limitValue: 0 });
  };
  const submitMba = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mbaForm.annualBudgetLawId) return alert("Selecione a LOA.");
    if (await run(() => actionSaveBimonthlyRevenueTarget({ ...mbaForm, bimonth: Number(mbaForm.bimonth) }))) setMbaForm({ annualBudgetLawId: "", bimonth: "1", targetValue: 0 });
  };
  const submitAmendment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!amendmentForm.entityId || !amendmentForm.reason.trim()) return alert("Selecione o registro e informe a justificativa da alteração.");
    try {
      const amendedSnapshot = JSON.parse(amendmentForm.amendedSnapshot) as Record<string, unknown>;
      if (Array.isArray(amendedSnapshot) || amendedSnapshot === null) throw new Error();
      if (await run(() => actionCreatePlanningAmendment({ entityType: amendmentForm.entityType, entityId: amendmentForm.entityId, reason: amendmentForm.reason, amendedSnapshot }))) {
        setAmendmentForm({ entityType: "PPA", entityId: "", reason: "", amendedSnapshot: "{}" });
      }
    } catch {
      alert("A versão proposta deve ser um objeto JSON válido.");
    }
  };

  return <div className="h-full min-h-0 overflow-y-auto px-1 py-1 sm:px-2 [&>*+*]:mt-2 [&_[data-slot=card]]:rounded-md [&_[data-slot=card]]:shadow-none [&_[data-slot=select-trigger]]:w-full [&_[data-slot=table-container]]:overflow-x-hidden [&_[data-slot=table]]:table-fixed">
    <header className="border-b border-slate-300 bg-white px-3 py-2 shadow-sm sm:flex sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Financeiro e contábil / Orçamento</p>
        <h1 className="mt-0.5 text-sm font-bold tracking-tight text-slate-900">Planejamento Orçamentário</h1>
        <p className="mt-0.5 text-xs text-slate-600">Cadastre, acompanhe e vincule o PPA, a LDO, a LOA e as dotações.</p>
      </div>
      {canEdit && (
        <Button type="button" size="sm" className="mt-3 bg-emerald-700 hover:bg-emerald-800 sm:mt-0" onClick={() => setActiveSection("ppa")}>
          <Plus className="size-3.5" />
          Novo cadastro
        </Button>
      )}
    </header>

    <nav className="flex flex-wrap gap-1 border border-slate-300 bg-white p-1" aria-label="Etapas do planejamento orçamentário">
      {sectionNav.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              isActive ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon className="size-3.5" />
            {section.label}
          </button>
        );
      })}
    </nav>

    {activeSection === "visao-geral" && <>
      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do planejamento">
        <div className="border border-slate-300 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">PPAs cadastrados</p><p className="mt-1 text-2xl font-bold text-slate-900">{plans.length}</p></div>
        <div className="border border-slate-300 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Programas</p><p className="mt-1 text-2xl font-bold text-slate-900">{programs.length}</p></div>
        <div className="border border-slate-300 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">LOAs vinculadas</p><p className="mt-1 text-2xl font-bold text-slate-900">{laws.length}</p></div>
        <div className="border border-slate-300 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Fixações de despesa</p><p className="mt-1 text-2xl font-bold text-slate-900">{fixations.length}</p></div>
      </section>

      <Card size="sm">
        <CardHeader className="border-b border-slate-200"><CardTitle>Cadeia PPA, LDO e LOA</CardTitle><p className="text-xs text-slate-500">Visão consolidada dos instrumentos já registrados.</p></CardHeader>
        <CardContent className="space-y-3 pt-3">
          {plans.length === 0 && <p className="text-sm text-muted-foreground">Nenhum PPA cadastrado. Use a aba PPA para iniciar o planejamento.</p>}
          {plans.map((plan) => <div key={plan.id} className="border border-slate-300 bg-slate-50 p-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="font-semibold text-slate-900">{plan.code} - {plan.name}</p><span className="w-fit rounded bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">{plan.startYear}-{plan.endYear}</span></div>
            {plan.programs.map((program) => <div key={program.id} className="mt-3 border-l-2 border-emerald-600 pl-3 text-sm"><p className="font-medium text-slate-800">Programa {program.code} - {program.name}</p>{program.objectives.map((objective) => <div key={objective.id} className="mt-2 text-slate-600"><p>Objetivo {objective.code}: {objective.description}</p>{objective.indicators.map((indicator) => <p key={indicator.id} className="pl-3 text-xs">Indicador {indicator.name} ({indicator.unit}): referência {indicator.baselineValue}, meta {indicator.targetValue}</p>)}</div>)}{program.actions.map((action) => <div key={action.id} className="mt-2 text-slate-600"><p>Ação {action.code}: {action.name}</p>{action.goals.map((goal) => <p key={goal.id} className="pl-3 text-xs">Meta {goal.year}: física {goal.physical}, financeira {currency.format(goal.financial)}</p>)}</div>)}</div>)}
            {plan.guidelines.map((guideline) => <div key={guideline.id} className="mt-3 border-l-2 border-blue-600 pl-3 text-sm"><p className="font-medium text-slate-800">LDO {guideline.financialYear.year} ({guideline.financialYear.status})</p>{guideline.priorities.map((priority) => <p key={priority.id} className="text-slate-600">Prioridade: {priority.description}{priority.targetValue !== null ? ` - ${currency.format(priority.targetValue)}` : ""}</p>)}{guideline.risks.map((risk) => <p key={risk.id} className="text-slate-600">Risco: {risk.description} ({currency.format(risk.estimatedImpact)}) - mitigação: {risk.mitigation}</p>)}{guideline.laws.map((law) => <p key={law.id} className="text-slate-600">LOA {law.lawNumber}: receita {currency.format(law.totalRevenue)}, despesa {currency.format(law.totalExpense)}, {law.revenueForecasts.length} previsão(ões) e {law.expenseFixations.length} fixação(ões).</p>)}</div>)}
          </div>)}
        </CardContent>
      </Card>
    </>}

    {activeSection === "historico" && <Card size="sm">
      <CardHeader><CardTitle>Histórico Interno de Alterações</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Registro interno de versões para comparação. Não gera PDF nem substitui publicação, aprovação ou vigência legal.</p>
        {canEdit && <form onSubmit={submitAmendment} className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
          <Select value={amendmentForm.entityType} onValueChange={(entityType) => setAmendmentForm({ ...amendmentForm, entityType: (entityType ?? "PPA") as "PPA" | "LDO" | "LOA", entityId: "", amendedSnapshot: "{}" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PPA">PPA</SelectItem><SelectItem value="LDO">LDO</SelectItem><SelectItem value="LOA">LOA</SelectItem></SelectContent></Select>
          <Select value={amendmentForm.entityId} onValueChange={(entityId) => { const entity = amendmentEntities.find((item) => item.id === entityId); setAmendmentForm({ ...amendmentForm, entityId: entityId ?? "", amendedSnapshot: entity ? JSON.stringify(entity.snapshot, null, 2) : "{}" }); }}><SelectTrigger><SelectValue placeholder="Registro a alterar" /></SelectTrigger><SelectContent>{amendmentEntities.map((entity) => <SelectItem key={entity.id} value={entity.id}>{entity.label}</SelectItem>)}</SelectContent></Select>
          <Input required placeholder="Justificativa da alteração" value={amendmentForm.reason} onChange={(event) => setAmendmentForm({ ...amendmentForm, reason: event.target.value })} />
          <Button type="button" variant="outline" disabled={!selectedAmendmentEntity} onClick={() => selectedAmendmentEntity && setAmendmentForm({ ...amendmentForm, amendedSnapshot: JSON.stringify(selectedAmendmentEntity.snapshot, null, 2) })}>Carregar versão atual</Button>
          <Textarea required className="min-h-48 font-mono text-xs md:col-span-2" aria-label="Versão proposta em JSON" value={amendmentForm.amendedSnapshot} onChange={(event) => setAmendmentForm({ ...amendmentForm, amendedSnapshot: event.target.value })} />
          <Button type="submit" disabled={pending}>Registrar nova versão interna</Button>
        </form>}
        {amendments.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma alteração interna registrada.</p> : amendments.map((amendment) => <details key={amendment.id} className="rounded-md border p-3"><summary className="cursor-pointer font-medium">{amendment.entityType} versão {amendment.version}: {amendment.reason}</summary><p className="mt-2 text-xs text-muted-foreground">Registrada em {new Date(amendment.createdAt).toLocaleString("pt-BR")}</p><div className="mt-3 grid gap-3 lg:grid-cols-2"><div><Label>Original preservado</Label><pre className="mt-1 max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(amendment.originalSnapshot, null, 2)}</pre></div><div><Label>Versão proposta</Label><pre className="mt-1 max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(amendment.amendedSnapshot, null, 2)}</pre></div></div></details>)}
      </CardContent>
    </Card>}

    {canEdit && activeSection === "ppa" && <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      <Card><CardHeader><CardTitle>Novo PPA</CardTitle></CardHeader><CardContent><form onSubmit={submitPlan} className="space-y-3">
        <Input required placeholder="Código" value={planForm.code} onChange={(event) => setPlanForm({ ...planForm, code: event.target.value })} />
        <Input required placeholder="Nome" value={planForm.name} onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })} />
        <div className="grid grid-cols-2 gap-3"><Input required type="number" placeholder="Ano inicial" value={planForm.startYear} onChange={(event) => setPlanForm({ ...planForm, startYear: event.target.value })} /><Input required type="number" placeholder="Ano final" value={planForm.endYear} onChange={(event) => setPlanForm({ ...planForm, endYear: event.target.value })} /></div>
        <Input placeholder="Descrição (opcional)" value={planForm.description} onChange={(event) => setPlanForm({ ...planForm, description: event.target.value })} />
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Criar PPA"}</Button>
      </form></CardContent></Card>

      <Card><CardHeader><CardTitle>Programa e Ação</CardTitle></CardHeader><CardContent className="space-y-4">
        <form onSubmit={submitProgram} className="space-y-2"><Select value={programForm.multiYearPlanId} onValueChange={(value) => setProgramForm({ ...programForm, multiYearPlanId: value ?? "" })}><SelectTrigger><SelectValue placeholder="PPA" /></SelectTrigger><SelectContent>{plans.map((plan) => <SelectItem key={plan.id} value={plan.id}>{plan.code}</SelectItem>)}</SelectContent></Select><Input required placeholder="Código do programa" value={programForm.code} onChange={(event) => setProgramForm({ ...programForm, code: event.target.value })} /><Input required placeholder="Nome do programa" value={programForm.name} onChange={(event) => setProgramForm({ ...programForm, name: event.target.value })} /><Button type="submit" disabled={pending}>Adicionar programa</Button></form>
        <form onSubmit={submitAction} className="space-y-2 border-t pt-4"><Select value={actionForm.programId} onValueChange={(value) => setActionForm({ ...actionForm, programId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Programa" /></SelectTrigger><SelectContent>{programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.code} - {program.name}</SelectItem>)}</SelectContent></Select><Select value={actionForm.type} onValueChange={(value) => setActionForm({ ...actionForm, type: value ?? "Projeto" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Projeto">Projeto</SelectItem><SelectItem value="Atividade">Atividade</SelectItem><SelectItem value="Operação Especial">Operação Especial</SelectItem></SelectContent></Select><Input required placeholder="Código da ação" value={actionForm.code} onChange={(event) => setActionForm({ ...actionForm, code: event.target.value })} /><Input required placeholder="Nome da ação" value={actionForm.name} onChange={(event) => setActionForm({ ...actionForm, name: event.target.value })} /><Button type="submit" disabled={pending}>Adicionar ação</Button></form>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Objetivos, Indicadores e Metas</CardTitle></CardHeader><CardContent className="space-y-4">
        <form onSubmit={submitObjective} className="space-y-2"><Select value={objectiveForm.programId} onValueChange={(value) => setObjectiveForm({ ...objectiveForm, programId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Programa" /></SelectTrigger><SelectContent>{programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.code} - {program.name}</SelectItem>)}</SelectContent></Select><Input required placeholder="Código do objetivo" value={objectiveForm.code} onChange={(event) => setObjectiveForm({ ...objectiveForm, code: event.target.value })} /><Input required placeholder="Descrição do objetivo" value={objectiveForm.description} onChange={(event) => setObjectiveForm({ ...objectiveForm, description: event.target.value })} /><Button type="submit" disabled={pending}>Adicionar objetivo</Button></form>
        <form onSubmit={submitIndicator} className="space-y-2 border-t pt-4"><Select value={indicatorForm.objectiveId} onValueChange={(value) => setIndicatorForm({ ...indicatorForm, objectiveId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Objetivo" /></SelectTrigger><SelectContent>{objectives.map((objective) => <SelectItem key={objective.id} value={objective.id}>{objective.code} - {objective.description}</SelectItem>)}</SelectContent></Select><Input required placeholder="Nome do indicador" value={indicatorForm.name} onChange={(event) => setIndicatorForm({ ...indicatorForm, name: event.target.value })} /><Input required placeholder="Unidade de medida" value={indicatorForm.unit} onChange={(event) => setIndicatorForm({ ...indicatorForm, unit: event.target.value })} /><div className="grid grid-cols-2 gap-2"><Input required type="number" min="0" placeholder="Referência" value={indicatorForm.baselineValue} onChange={(event) => setIndicatorForm({ ...indicatorForm, baselineValue: Number(event.target.value) })} /><Input required type="number" min="0" placeholder="Meta" value={indicatorForm.targetValue} onChange={(event) => setIndicatorForm({ ...indicatorForm, targetValue: Number(event.target.value) })} /></div><Button type="submit" disabled={pending}>Adicionar indicador</Button></form>
        <form onSubmit={submitGoal} className="space-y-2 border-t pt-4"><Select value={goalForm.actionId} onValueChange={(value) => setGoalForm({ ...goalForm, actionId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Ação" /></SelectTrigger><SelectContent>{programs.flatMap((program) => program.actions).map((action) => <SelectItem key={action.id} value={action.id}>{action.code} - {action.name}</SelectItem>)}</SelectContent></Select><div className="grid grid-cols-2 gap-2"><Input required type="number" placeholder="Ano" value={goalForm.year} onChange={(event) => setGoalForm({ ...goalForm, year: event.target.value })} /><Input required type="number" min="0" placeholder="Meta física" value={goalForm.physical} onChange={(event) => setGoalForm({ ...goalForm, physical: Number(event.target.value) })} /></div><MoneyInput value={goalForm.financial} onChange={(financial) => setGoalForm({ ...goalForm, financial })} /><Button type="submit" disabled={pending}>Adicionar meta anual</Button></form>
      </CardContent></Card>
    </div>}

    {canEdit && activeSection === "ldo-loa" && <div className="grid gap-3 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Nova LDO</CardTitle></CardHeader><CardContent><form onSubmit={submitGuideline} className="space-y-3">
        <Select value={guidelineForm.multiYearPlanId} onValueChange={(value) => setGuidelineForm({ ...guidelineForm, multiYearPlanId: value ?? "" })}><SelectTrigger><SelectValue placeholder="PPA" /></SelectTrigger><SelectContent>{plans.map((plan) => <SelectItem key={plan.id} value={plan.id}>{plan.code} - {plan.name}</SelectItem>)}</SelectContent></Select>
        <Select value={guidelineForm.financialYearId} onValueChange={(value) => setGuidelineForm({ ...guidelineForm, financialYearId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Exercício" /></SelectTrigger><SelectContent>{financialYears.map((year) => <SelectItem key={year.id} value={year.id}>{year.year} ({year.status})</SelectItem>)}</SelectContent></Select>
        <div className="space-y-2 border-t pt-3"><Label>Prioridades</Label>{guidelineForm.priorities.map((priority, index) => <div key={index} className="flex gap-2"><Input required placeholder="Descrição" value={priority.description} onChange={(event) => setGuidelineForm({ ...guidelineForm, priorities: guidelineForm.priorities.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) })} /><MoneyInput value={priority.targetValue ?? 0} onChange={(targetValue) => setGuidelineForm({ ...guidelineForm, priorities: guidelineForm.priorities.map((item, itemIndex) => itemIndex === index ? { ...item, targetValue } : item) })} />{guidelineForm.priorities.length > 1 && <Button type="button" variant="outline" onClick={() => setGuidelineForm({ ...guidelineForm, priorities: guidelineForm.priorities.filter((_, itemIndex) => itemIndex !== index) })}>Remover</Button>}</div>)}<Button type="button" variant="outline" onClick={() => setGuidelineForm({ ...guidelineForm, priorities: [...guidelineForm.priorities, { description: "", targetValue: undefined }] })}>Adicionar prioridade</Button></div>
        <div className="space-y-2 border-t pt-3"><Label>Riscos fiscais</Label>{guidelineForm.risks.map((risk, index) => <div key={index} className="space-y-2 rounded border p-2"><Input required placeholder="Descrição do risco" value={risk.description} onChange={(event) => setGuidelineForm({ ...guidelineForm, risks: guidelineForm.risks.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) })} /><MoneyInput value={risk.estimatedImpact} onChange={(estimatedImpact) => setGuidelineForm({ ...guidelineForm, risks: guidelineForm.risks.map((item, itemIndex) => itemIndex === index ? { ...item, estimatedImpact } : item) })} /><Input required placeholder="Mitigação" value={risk.mitigation} onChange={(event) => setGuidelineForm({ ...guidelineForm, risks: guidelineForm.risks.map((item, itemIndex) => itemIndex === index ? { ...item, mitigation: event.target.value } : item) })} /><Button type="button" variant="outline" onClick={() => setGuidelineForm({ ...guidelineForm, risks: guidelineForm.risks.filter((_, itemIndex) => itemIndex !== index) })}>Remover</Button></div>)}<Button type="button" variant="outline" onClick={() => setGuidelineForm({ ...guidelineForm, risks: [...guidelineForm.risks, { description: "", estimatedImpact: 0, mitigation: "" }] })}>Adicionar risco</Button></div>
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Criar LDO"}</Button>
      </form></CardContent></Card>

      <Card><CardHeader><CardTitle>Nova LOA</CardTitle></CardHeader><CardContent><form onSubmit={submitLaw} className="space-y-3">
        <Select value={lawForm.budgetGuidelineId} onValueChange={(value) => setLawForm({ ...lawForm, budgetGuidelineId: value ?? "" })}><SelectTrigger><SelectValue placeholder="LDO" /></SelectTrigger><SelectContent>{plans.flatMap((plan) => plan.guidelines).map((guideline) => <SelectItem key={guideline.id} value={guideline.id}>LDO {guideline.financialYear.year}</SelectItem>)}</SelectContent></Select>
        <Select value={lawForm.financialYearId} onValueChange={(value) => setLawForm({ ...lawForm, financialYearId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Exercício" /></SelectTrigger><SelectContent>{financialYears.map((year) => <SelectItem key={year.id} value={year.id}>{year.year} ({year.status})</SelectItem>)}</SelectContent></Select>
        <Input required placeholder="Número da lei" value={lawForm.lawNumber} onChange={(event) => setLawForm({ ...lawForm, lawNumber: event.target.value })} /><Input required type="date" value={lawForm.publicationDate} onChange={(event) => setLawForm({ ...lawForm, publicationDate: event.target.value })} />
        <div className="space-y-2 border-t pt-3"><Label>Previsões de receita</Label>{lawForm.revenueForecasts.map((forecast, index) => <div key={index} className="grid gap-2 md:grid-cols-[1fr_2fr_1fr_auto]"><Input required placeholder="Código" value={forecast.code} onChange={(event) => setLawForm({ ...lawForm, revenueForecasts: lawForm.revenueForecasts.map((item, itemIndex) => itemIndex === index ? { ...item, code: event.target.value } : item) })} /><Input required placeholder="Nome" value={forecast.name} onChange={(event) => setLawForm({ ...lawForm, revenueForecasts: lawForm.revenueForecasts.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} /><MoneyInput value={forecast.estimatedValue} onChange={(estimatedValue) => setLawForm({ ...lawForm, revenueForecasts: lawForm.revenueForecasts.map((item, itemIndex) => itemIndex === index ? { ...item, estimatedValue } : item) })} />{lawForm.revenueForecasts.length > 1 && <Button type="button" variant="outline" onClick={() => setLawForm({ ...lawForm, revenueForecasts: lawForm.revenueForecasts.filter((_, itemIndex) => itemIndex !== index) })}>Remover</Button>}</div>)}<p className="text-sm text-muted-foreground">Total previsto: {currency.format(totalRevenue)}</p><Button type="button" variant="outline" onClick={() => setLawForm({ ...lawForm, revenueForecasts: [...lawForm.revenueForecasts, emptyForecast()] })}>Adicionar previsão</Button></div>
        <div className="space-y-2 border-t pt-3"><Label>Fixações de despesa</Label>{lawForm.expenseFixations.map((fixation, index) => <div key={index} className="grid gap-2 md:grid-cols-[1fr_2fr_1fr_auto]"><Input required placeholder="Código" value={fixation.code} onChange={(event) => setLawForm({ ...lawForm, expenseFixations: lawForm.expenseFixations.map((item, itemIndex) => itemIndex === index ? { ...item, code: event.target.value } : item) })} /><Input required placeholder="Nome" value={fixation.name} onChange={(event) => setLawForm({ ...lawForm, expenseFixations: lawForm.expenseFixations.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} /><MoneyInput value={fixation.fixedValue} onChange={(fixedValue) => setLawForm({ ...lawForm, expenseFixations: lawForm.expenseFixations.map((item, itemIndex) => itemIndex === index ? { ...item, fixedValue } : item) })} />{lawForm.expenseFixations.length > 1 && <Button type="button" variant="outline" onClick={() => setLawForm({ ...lawForm, expenseFixations: lawForm.expenseFixations.filter((_, itemIndex) => itemIndex !== index) })}>Remover</Button>}</div>)}<p className="text-sm text-muted-foreground">Total fixado: {currency.format(totalExpense)}</p><Button type="button" variant="outline" onClick={() => setLawForm({ ...lawForm, expenseFixations: [...lawForm.expenseFixations, emptyFixation()] })}>Adicionar fixação</Button></div>
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Criar LOA"}</Button>
      </form></CardContent></Card>
    </div>}

    {activeSection === "dotacoes" && <>
    {canEdit && <Card size="sm"><CardHeader className="border-b border-slate-200"><CardTitle>Nova Dotação a Partir da LOA</CardTitle><p className="text-xs text-slate-500">Vincule a dotação à fixação da LOA, ao programa e à ação do PPA.</p></CardHeader><CardContent className="pt-3"><form onSubmit={submitAppropriation} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <div className="space-y-2 xl:col-span-2"><Label>Fixação de despesa da LOA</Label><Select value={appropriationForm.annualBudgetExpenseFixationId} onValueChange={(value) => setAppropriationForm({ ...appropriationForm, annualBudgetExpenseFixationId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Selecione a fixação" /></SelectTrigger><SelectContent>{fixations.map((fixation) => <SelectItem key={fixation.id} value={fixation.id}>{fixation.annualBudgetLaw.financialYear} / {fixation.annualBudgetLaw.lawNumber} - {fixation.code} - saldo {currency.format(fixation.fixedValue - fixation.allocatedValue)}</SelectItem>)}</SelectContent></Select>{selectedFixation && <p className="text-xs text-muted-foreground">{selectedFixation.plan.code} - {selectedFixation.plan.name}: {selectedFixation.name}. Fixado {currency.format(selectedFixation.fixedValue)}, já alocado {currency.format(selectedFixation.allocatedValue)}.</p>}</div>
      <div className="space-y-2"><Label>Programa do PPA</Label><Select value={appropriationForm.programPPAId} onValueChange={(value) => setAppropriationForm({ ...appropriationForm, programPPAId: value ?? "", actionPPAId: "" })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.code} - {program.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Ação do PPA</Label><Select value={appropriationForm.actionPPAId} onValueChange={(value) => setAppropriationForm({ ...appropriationForm, actionPPAId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{selectedProgram?.actions.map((action) => <SelectItem key={action.id} value={action.id}>{action.code} - {action.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Código da dotação</Label><Input required value={appropriationForm.code} onChange={(event) => setAppropriationForm({ ...appropriationForm, code: event.target.value })} /></div>
      <div className="space-y-2"><Label>Unidade orçamentária</Label><Select value={appropriationForm.budgetUnitId} onValueChange={(value) => setAppropriationForm({ ...appropriationForm, budgetUnitId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{budgetUnits.map((item) => <SelectItem key={item.id} value={item.id}>{item.code} - {item.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Natureza de despesa</Label><Select value={appropriationForm.expenseNatureId} onValueChange={(value) => setAppropriationForm({ ...appropriationForm, expenseNatureId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{expenseNatures.map((item) => <SelectItem key={item.id} value={item.id}>{item.code} - {item.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Fonte de recursos</Label><Select value={appropriationForm.resourceSourceId} onValueChange={(value) => setAppropriationForm({ ...appropriationForm, resourceSourceId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{resourceSources.map((item) => <SelectItem key={item.id} value={item.id}>{item.code} - {item.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Valor inicial</Label><MoneyInput value={appropriationForm.initialValue} onChange={(initialValue) => setAppropriationForm({ ...appropriationForm, initialValue })} /></div>
      <div className="flex items-end"><Button type="submit" disabled={pending}>{pending ? "Criando..." : "Criar dotação"}</Button></div>
    </form></CardContent></Card>}

    <Card size="sm"><CardHeader className="border-b border-slate-200"><CardTitle>Fixações e Alocações</CardTitle></CardHeader><CardContent className="pt-3"><Table><TableHeader><TableRow><TableHead>PPA</TableHead><TableHead>LOA</TableHead><TableHead>Fixação</TableHead><TableHead className="text-right">Fixado</TableHead><TableHead className="text-right">Alocado</TableHead><TableHead className="text-right">Disponível</TableHead></TableRow></TableHeader><TableBody>{fixations.length === 0 ? <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">Nenhuma fixação de despesa vinculada a um PPA/LDO/LOA.</TableCell></TableRow> : fixations.map((fixation) => <TableRow key={fixation.id}><TableCell>{fixation.plan.code}</TableCell><TableCell>{fixation.annualBudgetLaw.financialYear} / {fixation.annualBudgetLaw.lawNumber}</TableCell><TableCell>{fixation.code} - {fixation.name}</TableCell><TableCell className="text-right">{currency.format(fixation.fixedValue)}</TableCell><TableCell className="text-right">{currency.format(fixation.allocatedValue)}</TableCell><TableCell className="text-right">{currency.format(fixation.fixedValue - fixation.allocatedValue)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </>}

    {activeSection === "execucao" && <>
    {canEdit && <div className="grid gap-3 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>CMD - Cronograma Mensal de Desembolso</CardTitle></CardHeader><CardContent><form onSubmit={submitCmd} className="grid gap-3 md:grid-cols-2"><Select value={cmdForm.annualBudgetLawId} onValueChange={(value) => setCmdForm({ ...cmdForm, annualBudgetLawId: value ?? "" })}><SelectTrigger><SelectValue placeholder="LOA" /></SelectTrigger><SelectContent>{laws.map((law) => <SelectItem key={law.id} value={law.id}>{law.year} / {law.lawNumber}</SelectItem>)}</SelectContent></Select><Select value={cmdForm.budgetUnitId} onValueChange={(value) => setCmdForm({ ...cmdForm, budgetUnitId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Unidade orçamentária" /></SelectTrigger><SelectContent>{budgetUnits.map((unit) => <SelectItem key={unit.id} value={unit.id}>{unit.code} - {unit.name}</SelectItem>)}</SelectContent></Select><Select value={cmdForm.month} onValueChange={(value) => setCmdForm({ ...cmdForm, month: value ?? "1" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, index) => <SelectItem key={index + 1} value={String(index + 1)}>Mês {index + 1}</SelectItem>)}</SelectContent></Select><MoneyInput value={cmdForm.limitValue} onChange={(limitValue) => setCmdForm({ ...cmdForm, limitValue })} /><Button type="submit" disabled={pending}>Salvar CMD</Button></form></CardContent></Card>
      <Card><CardHeader><CardTitle>MBA - Meta Bimestral de Arrecadação</CardTitle></CardHeader><CardContent><form onSubmit={submitMba} className="grid gap-3 md:grid-cols-2"><Select value={mbaForm.annualBudgetLawId} onValueChange={(value) => setMbaForm({ ...mbaForm, annualBudgetLawId: value ?? "" })}><SelectTrigger><SelectValue placeholder="LOA" /></SelectTrigger><SelectContent>{laws.map((law) => <SelectItem key={law.id} value={law.id}>{law.year} / {law.lawNumber}</SelectItem>)}</SelectContent></Select><Select value={mbaForm.bimonth} onValueChange={(value) => setMbaForm({ ...mbaForm, bimonth: value ?? "1" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 6 }, (_, index) => <SelectItem key={index + 1} value={String(index + 1)}>{index + 1}º bimestre</SelectItem>)}</SelectContent></Select><MoneyInput value={mbaForm.targetValue} onChange={(targetValue) => setMbaForm({ ...mbaForm, targetValue })} /><Button type="submit" disabled={pending}>Salvar MBA</Button></form></CardContent></Card>
    </div>}

    <Card size="sm"><CardHeader className="border-b border-slate-200"><CardTitle>CMD e MBA Registrados</CardTitle></CardHeader><CardContent className="pt-3"><Table><TableHeader><TableRow><TableHead>LOA</TableHead><TableHead>CMD</TableHead><TableHead>MBA</TableHead></TableRow></TableHeader><TableBody>{laws.length === 0 ? <TableRow><TableCell colSpan={3} className="h-20 text-center text-muted-foreground">Nenhuma LOA vinculada a PPA/LDO.</TableCell></TableRow> : laws.map((law) => { const schedulesByUnit = new Map<string, typeof law.cmdSchedules>(); for (const schedule of law.cmdSchedules) schedulesByUnit.set(schedule.budgetUnit.code, [...(schedulesByUnit.get(schedule.budgetUnit.code) ?? []), schedule]); const mbaComplete = new Set(law.mbaTargets.map((target) => target.bimonth)).size === 6; return <TableRow key={law.id}><TableCell>{law.year} / {law.lawNumber}</TableCell><TableCell>{schedulesByUnit.size === 0 ? "Sem CMD" : Array.from(schedulesByUnit.entries()).map(([unitCode, schedules]) => <p key={unitCode}>{unitCode}: {new Set(schedules.map((schedule) => schedule.month)).size}/12 meses {new Set(schedules.map((schedule) => schedule.month)).size === 12 ? "completo" : "incompleto"}</p>)}</TableCell><TableCell>{new Set(law.mbaTargets.map((target) => target.bimonth)).size}/6 bimestres {mbaComplete ? "completa" : "incompleta"}</TableCell></TableRow>; })}</TableBody></Table></CardContent></Card>
    </>}
  </div>;
}
