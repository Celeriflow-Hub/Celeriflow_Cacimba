"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CircleAlert, FileCog, Landmark, ListChecks, Plus, Save, Settings2, SlidersHorizontal, Umbrella, WalletCards } from "lucide-react";
import {
  initializeHrPayrollDemoConfiguration,
  saveHrCalculationPolicy,
  saveHrEmploymentRegime,
  saveHrPayrollRubric,
  saveHrPayrollRule,
  saveHrPayrollRuleSet,
  saveHrSocialSecurityBand,
  saveHrSocialSecurityScheme,
  saveHrVacationPolicy,
} from "./actions";

type RuleSetView = {
  id: string;
  code: string;
  name: string;
  status: string;
  scope: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  legalReference: string | null;
  notes: string | null;
  isDemo: boolean;
};

type RuleView = {
  id: string;
  category: string;
  code: string;
  name: string;
  description: string | null;
  valueType: string;
  value: string;
  unit: string | null;
  sortOrder: number;
  legalReference: string | null;
  isRequired: boolean;
  isActive: boolean;
};

type RubricView = {
  id: string;
  code: string;
  name: string;
  type: string;
  esocialNatureCode: string | null;
  calculationMethod: string;
  formulaExpression: string | null;
  calculationBaseCode: string | null;
  fixedValue: string | null;
  percentageRate: string | null;
  priority: number;
  legalReference: string | null;
  notes: string | null;
  isActive: boolean;
  incidences: string[];
};

type VacationPolicyView = {
  id: string;
  code: string;
  name: string;
  employmentNature: string;
  acquisitionMonths: number;
  concessionMonths: number;
  entitlementDays: number;
  maxSplits: number;
  minFirstSplitDays: number;
  minOtherSplitDays: number;
  additionalPayRate: string;
  allowsCashAbono: boolean;
  maxCashAbonoDays: number;
  allowsAdvanceThirteenth: boolean;
  requiresApproval: boolean;
  legalReference: string | null;
  notes: string | null;
  isActive: boolean;
};

type SocialSecurityBandView = {
  id: string;
  sequence: number;
  lowerLimit: string;
  upperLimit: string | null;
  employeeRate: string;
  employerRate: string | null;
};

type SocialSecuritySchemeView = {
  id: string;
  code: string;
  name: string;
  regime: string;
  employeeCalculationMethod: string;
  ceilingValue: string | null;
  employerContributionRate: string | null;
  actuarialContributionRate: string | null;
  legalReference: string | null;
  notes: string | null;
  isActive: boolean;
  bands: SocialSecurityBandView[];
};

type CalculationPolicyView = {
  id: string;
  currency: string;
  roundingMode: string;
  roundingScale: number;
  movementCutoffDay: number;
  paymentDay: number | null;
  negativeNetPayPolicy: string;
  maxConsignmentMarginRate: string | null;
  remunerationCeiling: string | null;
  freezeOnClose: boolean;
  legalReference: string | null;
  notes: string | null;
};

type EmploymentRegimeView = {
  id: string;
  code: string;
  name: string;
  employmentNature: string;
  esocialCategory: string | null;
  defaultMonthlyHours: number | null;
  socialSecuritySchemeId: string | null;
  vacationPolicyId: string | null;
  legalReference: string | null;
  isActive: boolean;
};

export type HrPayrollSettingsView = {
  ruleSet: RuleSetView;
  rules: RuleView[];
  rubrics: RubricView[];
  vacationPolicies: VacationPolicyView[];
  socialSecuritySchemes: SocialSecuritySchemeView[];
  calculationPolicy: CalculationPolicyView | null;
  employmentRegimes: EmploymentRegimeView[];
};

type TabKey = "visao" | "regras" | "rubricas" | "ferias" | "previdencia" | "calculo" | "vinculos";
type ActionResult = { error?: string; message?: string; ruleSetId?: string };

const tabItems: { key: TabKey; label: string; icon: typeof Settings2 }[] = [
  { key: "visao", label: "Visão", icon: Settings2 },
  { key: "regras", label: "Regras", icon: ListChecks },
  { key: "rubricas", label: "Rubricas", icon: WalletCards },
  { key: "ferias", label: "Férias", icon: Umbrella },
  { key: "previdencia", label: "Previdência", icon: Landmark },
  { key: "calculo", label: "Cálculo", icon: FileCog },
  { key: "vinculos", label: "Vínculos", icon: SlidersHorizontal },
];

const inputClass = "h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";
const textAreaClass = "min-h-16 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";
const labelClass = "block text-[11px] font-semibold text-slate-600";
const secondaryButtonClass = "inline-flex h-8 items-center justify-center gap-1.5 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
const primaryButtonClass = "inline-flex h-8 items-center justify-center gap-1.5 rounded bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60";
const PAGE_SIZE = 20;

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function prettyDate(value: string | null) {
  if (!value) return "Sem término";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function ruleValueForInput(rule: RuleView) {
  try {
    const parsed: unknown = JSON.parse(rule.value);
    return rule.valueType === "JSON" ? JSON.stringify(parsed) : String(parsed);
  } catch {
    return rule.value;
  }
}

function PageControls({ page, total, onPageChange }: { page: number; total: number; onPageChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <span>{total} registros{total > 0 && ` · ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)}`}</span>
      <span className="flex items-center gap-1">
        <button type="button" aria-label="Página anterior" disabled={page === 1} onClick={() => onPageChange(page - 1)} className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="size-4" /></button>
        <span>Página {page} de {pages}</span>
        <button type="button" aria-label="Próxima página" disabled={page === pages} onClick={() => onPageChange(page + 1)} className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="size-4" /></button>
      </span>
    </div>
  );
}

function usePage<T>(items: T[]) {
  const [page, setPage] = useState(1);
  const safePage = Math.min(page, Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
  return { page: safePage, setPage, items: items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) };
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"><CircleAlert className="mt-0.5 size-4 shrink-0" />{children}</div>;
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 px-3 py-2.5"><div><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</p></div>{action}</div>;
}

function TableShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return <section className="flex max-h-[60dvh] min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="min-h-0 flex-1 overflow-auto">{children}</div>{footer}</section>;
}

export function HrPayrollSettingsClient({ ruleSets, settings }: { ruleSets: RuleSetView[]; settings: HrPayrollSettingsView | null }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("visao");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingRuleSet, setEditingRuleSet] = useState<RuleSetView | null | "new">(null);

  const activeLabel = useMemo(() => settings?.ruleSet.isDemo ? "Demonstração editável" : settings?.ruleSet.scope === "PRODUCAO" ? "Produção" : "Homologação", [settings]);

  async function execute(action: () => Promise<ActionResult>) {
    setPending(true);
    setFeedback(null);
    const result = await action();
    setPending(false);
    if (result.error) {
      setFeedback({ type: "error", text: result.error });
      return result;
    }
    setFeedback({ type: "success", text: result.message || "Alteração salva." });
    router.refresh();
    return result;
  }

  if (!settings) {
    return (
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <Settings2 className="size-7 text-slate-400" />
        <h2 className="mt-3 text-sm font-semibold text-slate-900">Nenhum conjunto de regras de RH disponível</h2>
        <p className="mt-1 max-w-lg text-xs leading-5 text-slate-600">Inicialize a referência municipal demonstrativa. Ela será persistida no Neon, poderá ser editada nesta área e fica identificada como não normativa.</p>
        <button type="button" disabled={pending} onClick={() => void execute(initializeHrPayrollDemoConfiguration)} className={`mt-4 ${primaryButtonClass}`}><Plus className="size-4" />{pending ? "Inicializando…" : "Criar referência demonstrativa"}</button>
        {feedback && <p role="status" className={`mt-3 text-xs ${feedback.type === "error" ? "text-rose-700" : "text-emerald-700"}`}>{feedback.text}</p>}
      </section>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <section className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{settings.ruleSet.name}</p>
          <p className="text-[11px] text-slate-500">{settings.ruleSet.code} · vigência {prettyDate(settings.ruleSet.effectiveFrom)}{settings.ruleSet.effectiveUntil ? ` até ${prettyDate(settings.ruleSet.effectiveUntil)}` : ""}</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${settings.ruleSet.isDemo ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{activeLabel}</span>
          <select aria-label="Selecionar conjunto de regras" value={settings.ruleSet.id} onChange={(event) => router.push(`/rh/parametrizacoes?ruleSet=${event.target.value}`)} className="h-8 max-w-56 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700">
            {ruleSets.map((ruleSet) => <option key={ruleSet.id} value={ruleSet.id}>{ruleSet.name}</option>)}
          </select>
        </div>
      </section>

      {feedback && <p role="status" className={`border px-3 py-2 text-xs ${feedback.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{feedback.text}</p>}

      <nav aria-label="Seções de parametrizações" className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 p-2 dark:border-slate-800">
        {tabItems.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return <button type="button" key={item.key} onClick={() => setTab(item.key)} className={`inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-semibold ${active ? "bg-emerald-700 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}><Icon className="size-3.5" />{item.label}</button>;
        })}
      </nav>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-2.5">
      <Notice><span><strong>Referência controlada:</strong> as rubricas desta tela são versionadas e não alteram nem são consumidas pelo motor de folha legado. O motor novo deverá copiar esta configuração para o snapshot da competência antes do cálculo. O Portal mantém o filtro de folhas <strong>Fechada</strong> ou <strong>Paga</strong>, mesmo quando a publicação de demonstrativos estiver habilitada.</span></Notice>
      {tab === "visao" && <Overview settings={settings} onEditRuleSet={() => setEditingRuleSet(settings.ruleSet)} onNewRuleSet={() => setEditingRuleSet("new")} />}
      {tab === "regras" && <RulesEditor settings={settings} pending={pending} execute={execute} />}
      {tab === "rubricas" && <RubricsEditor settings={settings} pending={pending} execute={execute} />}
      {tab === "ferias" && <VacationEditor settings={settings} pending={pending} execute={execute} />}
      {tab === "previdencia" && <SocialSecurityEditor settings={settings} pending={pending} execute={execute} />}
      {tab === "calculo" && <CalculationEditor settings={settings} pending={pending} execute={execute} />}
      {tab === "vinculos" && <EmploymentRegimeEditor settings={settings} pending={pending} execute={execute} />}

       {editingRuleSet && <RuleSetEditor current={editingRuleSet === "new" ? null : editingRuleSet} onClose={() => setEditingRuleSet(null)} onSaved={(ruleSetId) => { setEditingRuleSet(null); router.push(`/rh/parametrizacoes?ruleSet=${ruleSetId}`); }} pending={pending} execute={execute} />}
      </div>
    </div>
  );
}

function Overview({ settings, onEditRuleSet, onNewRuleSet }: { settings: HrPayrollSettingsView; onEditRuleSet: () => void; onNewRuleSet: () => void }) {
  const metrics = [
    ["Regras", settings.rules.length],
    ["Rubricas", settings.rubrics.length],
    ["Políticas de férias", settings.vacationPolicies.length],
    ["Regimes previdenciários", settings.socialSecuritySchemes.length],
    ["Vínculos", settings.employmentRegimes.length],
  ];
  return <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.8fr)]"><section className="border border-slate-200 bg-white shadow-sm"><SectionHeader title="Conjunto de regras" description="Vigência, escopo e fonte normativa da configuração selecionada." action={<span className="flex gap-1"><button type="button" onClick={onEditRuleSet} className={secondaryButtonClass}>Editar versão</button><button type="button" onClick={onNewRuleSet} className={primaryButtonClass}><Plus className="size-4" />Nova versão</button></span>} /><dl className="grid gap-x-4 gap-y-3 p-3 text-xs sm:grid-cols-2"><div><dt className="text-slate-500">Status</dt><dd className="mt-0.5 font-semibold text-slate-800">{settings.ruleSet.status}</dd></div><div><dt className="text-slate-500">Escopo</dt><dd className="mt-0.5 font-semibold text-slate-800">{settings.ruleSet.scope}</dd></div><div className="sm:col-span-2"><dt className="text-slate-500">Referência legal</dt><dd className="mt-0.5 leading-5 text-slate-800">{settings.ruleSet.legalReference || "Não informada — não ativar em produção."}</dd></div><div className="sm:col-span-2"><dt className="text-slate-500">Observações</dt><dd className="mt-0.5 leading-5 text-slate-700">{settings.ruleSet.notes || "Sem observações."}</dd></div></dl></section><section className="border border-slate-200 bg-white shadow-sm"><SectionHeader title="Cobertura configurada" description="Itens persistidos no Neon para reutilização pelo RH, Portal e relatórios autorizados." /><div className="grid grid-cols-2 gap-px bg-slate-200">{metrics.map(([label, value]) => <div key={String(label)} className="bg-white p-3"><p className="text-xl font-bold text-slate-900">{value}</p><p className="mt-0.5 text-[11px] text-slate-500">{label}</p></div>)}</div></section></div>;
}

function RuleSetEditor({ current, onClose, onSaved, pending, execute }: { current: RuleSetView | null; onClose: () => void; onSaved: (ruleSetId: string) => void; pending: boolean; execute: (action: () => Promise<ActionResult>) => Promise<ActionResult> }) {
  return <section className="border border-emerald-200 bg-emerald-50/40 shadow-sm"><SectionHeader title={current ? "Editar conjunto de regras" : "Nova versão de regras"} description="Conjuntos de produção ativos exigem referência legal, não podem ser demonstrativos e não podem ter vigência sobreposta." action={<button type="button" onClick={onClose} className={secondaryButtonClass}>Fechar</button>} /><form key={current?.id || "new"} className="grid gap-3 p-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void execute(() => saveHrPayrollRuleSet({ id: current?.id, code: form.get("code"), name: form.get("name"), status: form.get("status"), scope: form.get("scope"), effectiveFrom: form.get("effectiveFrom"), effectiveUntil: form.get("effectiveUntil") || null, legalReference: form.get("legalReference"), notes: form.get("notes"), isDemo: form.get("isDemo") === "on" })).then((result) => { if (!result.error && result.ruleSetId) onSaved(result.ruleSetId); }); }}><Field label="Código"><input required name="code" defaultValue={current?.code || "MUNICIPAL_2026_V2"} className={inputClass} /></Field><Field label="Nome"><input required name="name" defaultValue={current?.name || "Regras municipais — nova versão"} className={inputClass} /></Field><Field label="Status"><select name="status" defaultValue={current?.status || "RASCUNHO"} className={inputClass}><option value="RASCUNHO">Rascunho</option><option value="ATIVA">Ativa</option><option value="ARQUIVADA">Arquivada</option></select></Field><Field label="Escopo"><select name="scope" defaultValue={current?.scope || "DEMONSTRACAO"} className={inputClass}><option value="DEMONSTRACAO">Demonstração</option><option value="HOMOLOGACAO">Homologação</option><option value="PRODUCAO">Produção</option></select></Field><Field label="Início de vigência"><input required type="date" name="effectiveFrom" defaultValue={dateInputValue(current?.effectiveFrom || new Date().toISOString())} className={inputClass} /></Field><Field label="Fim de vigência"><input type="date" name="effectiveUntil" defaultValue={dateInputValue(current?.effectiveUntil || null)} className={inputClass} /></Field><div className="md:col-span-2"><Field label="Referência legal"><textarea name="legalReference" defaultValue={current?.legalReference || ""} className={textAreaClass} /></Field></div><div className="md:col-span-2"><Field label="Observações"><textarea name="notes" defaultValue={current?.notes || ""} className={textAreaClass} /></Field></div><label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" name="isDemo" defaultChecked={current?.isDemo ?? true} /> Configuração demonstrativa</label><div className="flex justify-end"><button disabled={pending} className={primaryButtonClass}><Save className="size-4" />{pending ? "Salvando…" : "Salvar versão"}</button></div></form></section>;
}

function RulesEditor({ settings, pending, execute }: { settings: HrPayrollSettingsView; pending: boolean; execute: (action: () => Promise<ActionResult>) => Promise<ActionResult> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = settings.rules.find((item) => item.id === selectedId) ?? null;
  const pager = usePage(settings.rules);
  return (
    <div className="grid min-h-0 gap-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(21rem,.75fr)]">
      <TableShell footer={<PageControls page={pager.page} total={settings.rules.length} onPageChange={pager.setPage} />}>
        <SectionHeader title="Regras operacionais" description="Valores tipados por categoria, com vigência herdada do conjunto selecionado." action={<button type="button" onClick={() => setSelectedId(null)} className={secondaryButtonClass}><Plus className="size-4" />Nova regra</button>} />
        <CompactTable headers={["Código", "Nome", "Categoria", "Valor", "Status"]}>
          {pager.items.length === 0 && <EmptyTableRow columns={5} message="Nenhuma regra cadastrada nesta versão." />}
          {pager.items.map((rule) => (
            <tr key={rule.id} className={selectedId === rule.id ? "bg-emerald-50" : "hover:bg-slate-50"}>
              <td className="px-3 py-2 align-top"><button type="button" onClick={() => setSelectedId(rule.id)} className="font-semibold text-emerald-800 hover:underline">{rule.code}</button></td>
              <td className="px-3 py-2 align-top text-slate-800">{rule.name}</td>
              <td className="px-3 py-2 align-top text-slate-600">{rule.category}</td>
              <td className="max-w-48 px-3 py-2 align-top text-slate-600"><span className="block truncate">{ruleValueForInput(rule)}</span></td>
              <td className="px-3 py-2 align-top text-slate-600">{rule.isActive ? "Ativa" : "Inativa"}</td>
            </tr>
          ))}
        </CompactTable>
      </TableShell>

      <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        <SectionHeader title={selected ? "Editar regra" : "Nova regra"} description="Defina o valor na forma compatível com o tipo selecionado. Valores JSON precisam ser objetos ou listas JSON válidos." />
        <form key={selected?.id || "new"} className="grid gap-3 p-3 md:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void execute(() => saveHrPayrollRule({
            id: selected?.id,
            ruleSetId: settings.ruleSet.id,
            category: form.get("category"),
            code: form.get("code"),
            name: form.get("name"),
            description: form.get("description"),
            valueType: form.get("valueType"),
            value: form.get("value"),
            unit: form.get("unit"),
            sortOrder: form.get("sortOrder"),
            legalReference: form.get("legalReference"),
            isRequired: form.get("isRequired") === "on",
            isActive: form.get("isActive") === "on",
          })).then((result) => { if (!result.error) setSelectedId(null); });
        }}>
          <Field label="Código"><input required name="code" defaultValue={selected?.code || "NOVA_REGRA"} className={inputClass} /></Field>
          <Field label="Nome"><input required name="name" defaultValue={selected?.name || "Nova regra"} className={inputClass} /></Field>
          <Field label="Categoria"><select name="category" defaultValue={selected?.category || "GERAL"} className={inputClass}>{ruleCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></Field>
          <Field label="Tipo do valor"><select name="valueType" defaultValue={selected?.valueType || "TEXT"} className={inputClass}>{ruleValueTypes.map((valueType) => <option key={valueType} value={valueType}>{valueType}</option>)}</select></Field>
          <Field label="Valor" className="md:col-span-2"><textarea required name="value" defaultValue={selected ? ruleValueForInput(selected) : "Valor de referência"} className={textAreaClass} /></Field>
          <Field label="Unidade"><input name="unit" defaultValue={selected?.unit || ""} placeholder="Ex.: dias, horas, % ou R$" className={inputClass} /></Field>
          <Field label="Ordem"><input required type="number" min="0" name="sortOrder" defaultValue={selected?.sortOrder ?? 100} className={inputClass} /></Field>
          <Field label="Descrição" className="md:col-span-2"><textarea name="description" defaultValue={selected?.description || ""} className={textAreaClass} /></Field>
          <Field label="Referência legal" className="md:col-span-2"><textarea name="legalReference" defaultValue={selected?.legalReference || ""} className={textAreaClass} /></Field>
          <Checkbox name="isRequired" label="Obrigatória" defaultChecked={selected?.isRequired ?? false} />
          <Checkbox name="isActive" label="Regra ativa" defaultChecked={selected?.isActive ?? true} />
          <div className="flex justify-end md:col-span-2"><button disabled={pending} className={primaryButtonClass}><Save className="size-4" />{pending ? "Salvando…" : "Salvar regra"}</button></div>
        </form>
      </section>
    </div>
  );
}

function RubricsEditor({ settings, pending, execute }: { settings: HrPayrollSettingsView; pending: boolean; execute: (action: () => Promise<ActionResult>) => Promise<ActionResult> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = settings.rubrics.find((item) => item.id === selectedId) ?? null;
  const pager = usePage(settings.rubrics);
  return (
    <div className="grid min-h-0 gap-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(21rem,.75fr)]">
      <TableShell footer={<PageControls page={pager.page} total={settings.rubrics.length} onPageChange={pager.setPage} />}>
        <SectionHeader title="Rubricas" description="Proventos, descontos e bases que serão usados pelo motor de folha versionado." action={<button type="button" onClick={() => setSelectedId(null)} className={secondaryButtonClass}><Plus className="size-4" />Nova rubrica</button>} />
        <CompactTable headers={["Código", "Nome", "Tipo", "Método", "Status"]}>
          {pager.items.length === 0 && <EmptyTableRow columns={5} message="Nenhuma rubrica cadastrada nesta versão." />}
          {pager.items.map((rubric) => (
            <tr key={rubric.id} className={selectedId === rubric.id ? "bg-emerald-50" : "hover:bg-slate-50"}>
              <td className="px-3 py-2 align-top"><button type="button" onClick={() => setSelectedId(rubric.id)} className="font-semibold text-emerald-800 hover:underline">{rubric.code}</button></td>
              <td className="px-3 py-2 align-top text-slate-800">{rubric.name}</td>
              <td className="px-3 py-2 align-top text-slate-600">{rubric.type}</td>
              <td className="px-3 py-2 align-top text-slate-600">{rubric.calculationMethod}</td>
              <td className="px-3 py-2 align-top text-slate-600">{rubric.isActive ? "Ativa" : "Inativa"}</td>
            </tr>
          ))}
        </CompactTable>
      </TableShell>

      <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        <SectionHeader title={selected ? "Editar rubrica" : "Nova rubrica"} description="Informe somente incidências e fórmulas autorizadas pela norma aplicável." />
        <form key={selected?.id || "new"} className="grid gap-3 p-3 md:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void execute(() => saveHrPayrollRubric({
            id: selected?.id,
            ruleSetId: settings.ruleSet.id,
            code: form.get("code"),
            name: form.get("name"),
            type: form.get("type"),
            esocialNatureCode: form.get("esocialNatureCode"),
            calculationMethod: form.get("calculationMethod"),
            formulaExpression: form.get("formulaExpression"),
            calculationBaseCode: form.get("calculationBaseCode"),
            fixedValue: form.get("fixedValue"),
            percentageRate: form.get("percentageRate"),
            priority: form.get("priority"),
            legalReference: form.get("legalReference"),
            notes: form.get("notes"),
            incidences: form.getAll("incidences").map(String),
            isActive: form.get("isActive") === "on",
          })).then((result) => { if (!result.error) setSelectedId(null); });
        }}>
          <Field label="Código"><input required name="code" defaultValue={selected?.code || "NOVA_RUBRICA"} className={inputClass} /></Field>
          <Field label="Nome"><input required name="name" defaultValue={selected?.name || "Nova rubrica"} className={inputClass} /></Field>
          <Field label="Tipo"><select name="type" defaultValue={selected?.type || "PROVENTO"} className={inputClass}>{rubricTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></Field>
          <Field label="Método de cálculo"><select name="calculationMethod" defaultValue={selected?.calculationMethod || "MANUAL"} className={inputClass}>{rubricCalculationMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></Field>
          <Field label="Natureza eSocial"><input name="esocialNatureCode" defaultValue={selected?.esocialNatureCode || ""} className={inputClass} /></Field>
          <Field label="Prioridade"><input required type="number" min="0" name="priority" defaultValue={selected?.priority ?? 100} className={inputClass} /></Field>
          <Field label="Valor fixo (R$)"><input type="number" min="0" step="0.01" name="fixedValue" defaultValue={selected?.fixedValue || ""} className={inputClass} /></Field>
          <Field label="Percentual"><input type="number" min="0" max="100" step="0.01" name="percentageRate" defaultValue={selected?.percentageRate || ""} className={inputClass} /></Field>
          <Field label="Código da base de cálculo" className="md:col-span-2"><input name="calculationBaseCode" defaultValue={selected?.calculationBaseCode || ""} className={inputClass} /></Field>
          <Field label="Fórmula de referência" className="md:col-span-2"><input name="formulaExpression" defaultValue={selected?.formulaExpression || ""} placeholder="Ex.: BASE * 10 / 100" className={inputClass} /></Field>
          <div className="grid gap-2 md:col-span-2"><span className={labelClass}>Incidências</span><div className="flex flex-wrap gap-x-4 gap-y-2">{incidentTypes.map((incidence) => <Checkbox key={incidence} name="incidences" value={incidence} label={incidence} defaultChecked={selected?.incidences.includes(incidence) ?? false} />)}</div></div>
          <Field label="Referência legal" className="md:col-span-2"><textarea name="legalReference" defaultValue={selected?.legalReference || ""} className={textAreaClass} /></Field>
          <Field label="Observações" className="md:col-span-2"><textarea name="notes" defaultValue={selected?.notes || ""} className={textAreaClass} /></Field>
          <Checkbox name="isActive" label="Rubrica ativa" defaultChecked={selected?.isActive ?? true} />
          <div className="flex justify-end"><button disabled={pending} className={primaryButtonClass}><Save className="size-4" />{pending ? "Salvando…" : "Salvar rubrica"}</button></div>
        </form>
      </section>
    </div>
  );
}

function VacationEditor({ settings, pending, execute }: { settings: HrPayrollSettingsView; pending: boolean; execute: (action: () => Promise<ActionResult>) => Promise<ActionResult> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = settings.vacationPolicies.find((item) => item.id === selectedId) ?? null;
  const pager = usePage(settings.vacationPolicies);
  return (
    <div className="grid min-h-0 gap-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(21rem,.75fr)]">
      <TableShell footer={<PageControls page={pager.page} total={settings.vacationPolicies.length} onPageChange={pager.setPage} />}>
        <SectionHeader title="Políticas de férias" description="Parâmetros de aquisição, concessão, fracionamento e abono por natureza de vínculo." action={<button type="button" onClick={() => setSelectedId(null)} className={secondaryButtonClass}><Plus className="size-4" />Nova política</button>} />
        <CompactTable headers={["Código", "Nome", "Natureza", "Dias", "Status"]}>
          {pager.items.length === 0 && <EmptyTableRow columns={5} message="Nenhuma política de férias cadastrada nesta versão." />}
          {pager.items.map((policy) => (
            <tr key={policy.id} className={selectedId === policy.id ? "bg-emerald-50" : "hover:bg-slate-50"}>
              <td className="px-3 py-2 align-top"><button type="button" onClick={() => setSelectedId(policy.id)} className="font-semibold text-emerald-800 hover:underline">{policy.code}</button></td>
              <td className="px-3 py-2 align-top text-slate-800">{policy.name}</td>
              <td className="px-3 py-2 align-top text-slate-600">{policy.employmentNature}</td>
              <td className="px-3 py-2 align-top text-slate-600">{policy.entitlementDays}</td>
              <td className="px-3 py-2 align-top text-slate-600">{policy.isActive ? "Ativa" : "Inativa"}</td>
            </tr>
          ))}
        </CompactTable>
      </TableShell>

      <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        <SectionHeader title={selected ? "Editar política" : "Nova política"} description="Os valores devem refletir o estatuto, a CLT e as regras locais aplicáveis ao vínculo." />
        <form key={selected?.id || "new"} className="grid gap-3 p-3 md:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void execute(() => saveHrVacationPolicy({
            id: selected?.id,
            ruleSetId: settings.ruleSet.id,
            code: form.get("code"),
            name: form.get("name"),
            employmentNature: form.get("employmentNature"),
            acquisitionMonths: form.get("acquisitionMonths"),
            concessionMonths: form.get("concessionMonths"),
            entitlementDays: form.get("entitlementDays"),
            maxSplits: form.get("maxSplits"),
            minFirstSplitDays: form.get("minFirstSplitDays"),
            minOtherSplitDays: form.get("minOtherSplitDays"),
            additionalPayRate: form.get("additionalPayRate"),
            allowsCashAbono: form.get("allowsCashAbono") === "on",
            maxCashAbonoDays: form.get("maxCashAbonoDays"),
            allowsAdvanceThirteenth: form.get("allowsAdvanceThirteenth") === "on",
            requiresApproval: form.get("requiresApproval") === "on",
            legalReference: form.get("legalReference"),
            notes: form.get("notes"),
            isActive: form.get("isActive") === "on",
          })).then((result) => { if (!result.error) setSelectedId(null); });
        }}>
          <Field label="Código"><input required name="code" defaultValue={selected?.code || "FERIAS_PADRAO"} className={inputClass} /></Field>
          <Field label="Nome"><input required name="name" defaultValue={selected?.name || "Política de férias padrão"} className={inputClass} /></Field>
          <Field label="Natureza do vínculo"><select name="employmentNature" defaultValue={selected?.employmentNature || "ESTATUTARIO"} className={inputClass}>{employmentNatures.map((nature) => <option key={nature} value={nature}>{nature}</option>)}</select></Field>
          <Field label="Adicional de férias (%)"><input required type="number" min="0" max="100" step="0.01" name="additionalPayRate" defaultValue={selected?.additionalPayRate || "33.33"} className={inputClass} /></Field>
          <Field label="Meses aquisitivos"><input required type="number" min="1" max="60" name="acquisitionMonths" defaultValue={selected?.acquisitionMonths ?? 12} className={inputClass} /></Field>
          <Field label="Meses concessivos"><input required type="number" min="1" max="60" name="concessionMonths" defaultValue={selected?.concessionMonths ?? 12} className={inputClass} /></Field>
          <Field label="Dias de direito"><input required type="number" min="1" max="90" name="entitlementDays" defaultValue={selected?.entitlementDays ?? 30} className={inputClass} /></Field>
          <Field label="Máximo de fracionamentos"><input required type="number" min="1" max="12" name="maxSplits" defaultValue={selected?.maxSplits ?? 3} className={inputClass} /></Field>
          <Field label="Mínimo no primeiro período"><input required type="number" min="1" max="90" name="minFirstSplitDays" defaultValue={selected?.minFirstSplitDays ?? 14} className={inputClass} /></Field>
          <Field label="Mínimo nos demais períodos"><input required type="number" min="1" max="90" name="minOtherSplitDays" defaultValue={selected?.minOtherSplitDays ?? 5} className={inputClass} /></Field>
          <Field label="Máximo de dias de abono"><input required type="number" min="0" max="90" name="maxCashAbonoDays" defaultValue={selected?.maxCashAbonoDays ?? 0} className={inputClass} /></Field>
          <div className="grid content-end gap-2"><Checkbox name="allowsCashAbono" label="Permite abono pecuniário" defaultChecked={selected?.allowsCashAbono ?? false} /><Checkbox name="allowsAdvanceThirteenth" label="Permite adiantamento do 13º" defaultChecked={selected?.allowsAdvanceThirteenth ?? false} /><Checkbox name="requiresApproval" label="Exige aprovação" defaultChecked={selected?.requiresApproval ?? true} /></div>
          <Field label="Referência legal" className="md:col-span-2"><textarea name="legalReference" defaultValue={selected?.legalReference || ""} className={textAreaClass} /></Field>
          <Field label="Observações" className="md:col-span-2"><textarea name="notes" defaultValue={selected?.notes || ""} className={textAreaClass} /></Field>
          <Checkbox name="isActive" label="Política ativa" defaultChecked={selected?.isActive ?? true} />
          <div className="flex justify-end"><button disabled={pending} className={primaryButtonClass}><Save className="size-4" />{pending ? "Salvando…" : "Salvar política"}</button></div>
        </form>
      </section>
    </div>
  );
}

function SocialSecurityEditor({ settings, pending, execute }: { settings: HrPayrollSettingsView; pending: boolean; execute: (action: () => Promise<ActionResult>) => Promise<ActionResult> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const selected = settings.socialSecuritySchemes.find((item) => item.id === selectedId) ?? null;
  const pager = usePage(settings.socialSecuritySchemes);
  return (
    <div className="grid min-h-0 gap-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(21rem,.75fr)]">
      <TableShell footer={<PageControls page={pager.page} total={settings.socialSecuritySchemes.length} onPageChange={pager.setPage} />}>
        <SectionHeader title="Regimes previdenciários" description="Cadastre os regimes e suas faixas de contribuição sem sobrepor os limites." action={<button type="button" onClick={() => { setSelectedId(null); setSelectedBandId(null); }} className={secondaryButtonClass}><Plus className="size-4" />Novo regime</button>} />
        <CompactTable headers={["Código", "Nome", "Regime", "Cálculo", "Status"]}>
          {pager.items.length === 0 && <EmptyTableRow columns={5} message="Nenhum regime previdenciário cadastrado nesta versão." />}
          {pager.items.map((scheme) => (
            <tr key={scheme.id} className={selectedId === scheme.id ? "bg-emerald-50" : "hover:bg-slate-50"}>
              <td className="px-3 py-2 align-top"><button type="button" onClick={() => { setSelectedId(scheme.id); setSelectedBandId(null); }} className="font-semibold text-emerald-800 hover:underline">{scheme.code}</button></td>
              <td className="px-3 py-2 align-top text-slate-800">{scheme.name}</td>
              <td className="px-3 py-2 align-top text-slate-600">{scheme.regime}</td>
              <td className="px-3 py-2 align-top text-slate-600">{scheme.employeeCalculationMethod}</td>
              <td className="px-3 py-2 align-top text-slate-600">{scheme.isActive ? "Ativo" : "Inativo"}</td>
            </tr>
          ))}
        </CompactTable>
      </TableShell>

      <div className="space-y-2">
        <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
          <SectionHeader title={selected ? "Editar regime" : "Novo regime"} description="A alíquota patronal e o teto são opcionais quando não se aplicarem ao regime." />
          <form key={selected?.id || "new"} className="grid gap-3 p-3 md:grid-cols-2" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void execute(() => saveHrSocialSecurityScheme({
              id: selected?.id,
              ruleSetId: settings.ruleSet.id,
              code: form.get("code"),
              name: form.get("name"),
              regime: form.get("regime"),
              employeeCalculationMethod: form.get("employeeCalculationMethod"),
              ceilingValue: form.get("ceilingValue"),
              employerContributionRate: form.get("employerContributionRate"),
              actuarialContributionRate: form.get("actuarialContributionRate"),
              legalReference: form.get("legalReference"),
              notes: form.get("notes"),
              isActive: form.get("isActive") === "on",
            })).then((result) => { if (!result.error) setSelectedId(null); });
          }}>
            <Field label="Código"><input required name="code" defaultValue={selected?.code || "NOVO_REGIME"} className={inputClass} /></Field>
            <Field label="Nome"><input required name="name" defaultValue={selected?.name || "Novo regime previdenciário"} className={inputClass} /></Field>
            <Field label="Regime"><select name="regime" defaultValue={selected?.regime || "RPPS"} className={inputClass}>{socialSecurityRegimes.map((regime) => <option key={regime} value={regime}>{regime}</option>)}</select></Field>
            <Field label="Cálculo do servidor"><select name="employeeCalculationMethod" defaultValue={selected?.employeeCalculationMethod || "PROGRESSIVA"} className={inputClass}>{socialSecurityMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></Field>
            <Field label="Teto remuneratório (R$)"><input type="number" min="0" step="0.01" name="ceilingValue" defaultValue={selected?.ceilingValue || ""} className={inputClass} /></Field>
            <Field label="Alíquota patronal (%)"><input type="number" min="0" max="100" step="0.01" name="employerContributionRate" defaultValue={selected?.employerContributionRate || ""} className={inputClass} /></Field>
            <Field label="Alíquota atuarial (%)"><input type="number" min="0" max="100" step="0.01" name="actuarialContributionRate" defaultValue={selected?.actuarialContributionRate || ""} className={inputClass} /></Field>
            <Checkbox name="isActive" label="Regime ativo" defaultChecked={selected?.isActive ?? true} />
            <Field label="Referência legal" className="md:col-span-2"><textarea name="legalReference" defaultValue={selected?.legalReference || ""} className={textAreaClass} /></Field>
            <Field label="Observações" className="md:col-span-2"><textarea name="notes" defaultValue={selected?.notes || ""} className={textAreaClass} /></Field>
            <div className="flex justify-end md:col-span-2"><button disabled={pending} className={primaryButtonClass}><Save className="size-4" />{pending ? "Salvando…" : "Salvar regime"}</button></div>
          </form>
        </section>

        {selected ? <SocialSecurityBandsEditor scheme={selected} selectedBandId={selectedBandId} onSelectBand={setSelectedBandId} pending={pending} execute={execute} /> : <Notice><span>Salve ou selecione um regime para cadastrar suas faixas de contribuição.</span></Notice>}
      </div>
    </div>
  );
}

function SocialSecurityBandsEditor({ scheme, selectedBandId, onSelectBand, pending, execute }: { scheme: SocialSecuritySchemeView; selectedBandId: string | null; onSelectBand: (id: string | null) => void; pending: boolean; execute: (action: () => Promise<ActionResult>) => Promise<ActionResult> }) {
  const selected = scheme.bands.find((item) => item.id === selectedBandId) ?? null;
  return (
    <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
      <SectionHeader title={`Faixas de ${scheme.code}`} description="Limites são inclusivos e não podem se sobrepor." action={<button type="button" onClick={() => onSelectBand(null)} className={secondaryButtonClass}><Plus className="size-4" />Nova faixa</button>} />
      <div className="max-h-72 overflow-auto">
      <CompactTable headers={["Seq.", "Limite inicial", "Limite final", "Servidor", "Patronal"]}>
        {scheme.bands.length === 0 && <EmptyTableRow columns={5} message="Nenhuma faixa cadastrada neste regime." />}
        {scheme.bands.map((band) => (
          <tr key={band.id} className={selectedBandId === band.id ? "bg-emerald-50" : "hover:bg-slate-50"}>
            <td className="px-3 py-2"><button type="button" onClick={() => onSelectBand(band.id)} className="font-semibold text-emerald-800 hover:underline">{band.sequence}</button></td>
            <td className="px-3 py-2 text-slate-600">{band.lowerLimit}</td>
            <td className="px-3 py-2 text-slate-600">{band.upperLimit || "Sem teto"}</td>
            <td className="px-3 py-2 text-slate-600">{band.employeeRate}%</td>
            <td className="px-3 py-2 text-slate-600">{band.employerRate ? `${band.employerRate}%` : "-"}</td>
          </tr>
        ))}
      </CompactTable>
      </div>
      <form key={selected?.id || "new"} className="grid gap-3 border-t border-slate-200 p-3 md:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void execute(() => saveHrSocialSecurityBand({
          id: selected?.id,
          socialSecuritySchemeId: scheme.id,
          sequence: form.get("sequence"),
          lowerLimit: form.get("lowerLimit"),
          upperLimit: form.get("upperLimit"),
          employeeRate: form.get("employeeRate"),
          employerRate: form.get("employerRate"),
        })).then((result) => { if (!result.error) onSelectBand(null); });
      }}>
        <Field label="Sequência"><input required type="number" min="1" max="100" name="sequence" defaultValue={selected?.sequence ?? scheme.bands.length + 1} className={inputClass} /></Field>
        <Field label="Limite inicial (R$)"><input required type="number" min="0" step="0.01" name="lowerLimit" defaultValue={selected?.lowerLimit || "0"} className={inputClass} /></Field>
        <Field label="Limite final (R$)"><input type="number" min="0" step="0.01" name="upperLimit" defaultValue={selected?.upperLimit || ""} className={inputClass} /></Field>
        <Field label="Alíquota do servidor (%)"><input required type="number" min="0" max="100" step="0.01" name="employeeRate" defaultValue={selected?.employeeRate || "0"} className={inputClass} /></Field>
        <Field label="Alíquota patronal (%)"><input type="number" min="0" max="100" step="0.01" name="employerRate" defaultValue={selected?.employerRate || ""} className={inputClass} /></Field>
        <div className="flex items-end justify-end"><button disabled={pending} className={primaryButtonClass}><Save className="size-4" />{pending ? "Salvando…" : "Salvar faixa"}</button></div>
      </form>
    </section>
  );
}

function CalculationEditor({ settings, pending, execute }: { settings: HrPayrollSettingsView; pending: boolean; execute: (action: () => Promise<ActionResult>) => Promise<ActionResult> }) {
  const current = settings.calculationPolicy;
  return (
    <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
      <SectionHeader title="Política de cálculo" description="Parâmetros únicos da versão usados pelo motor antes de fechar a competência." />
      <form key={current?.id || "new"} className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void execute(() => saveHrCalculationPolicy({
          ruleSetId: settings.ruleSet.id,
          currency: "BRL",
          roundingMode: form.get("roundingMode"),
          roundingScale: form.get("roundingScale"),
          movementCutoffDay: form.get("movementCutoffDay"),
          paymentDay: form.get("paymentDay"),
          negativeNetPayPolicy: form.get("negativeNetPayPolicy"),
          maxConsignmentMarginRate: form.get("maxConsignmentMarginRate"),
          remunerationCeiling: form.get("remunerationCeiling"),
          freezeOnClose: form.get("freezeOnClose") === "on",
          legalReference: form.get("legalReference"),
          notes: form.get("notes"),
        }));
      }}>
        <Field label="Moeda"><input readOnly value="BRL" className={`${inputClass} bg-slate-50`} /></Field>
        <Field label="Modo de arredondamento"><select name="roundingMode" defaultValue={current?.roundingMode || "HALF_UP"} className={inputClass}>{roundingModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></Field>
        <Field label="Casas decimais"><input required type="number" min="0" max="6" name="roundingScale" defaultValue={current?.roundingScale ?? 2} className={inputClass} /></Field>
        <Field label="Corte de movimentações"><input required type="number" min="1" max="31" name="movementCutoffDay" defaultValue={current?.movementCutoffDay ?? 20} className={inputClass} /></Field>
        <Field label="Dia de pagamento"><input type="number" min="1" max="31" name="paymentDay" defaultValue={current ? current.paymentDay?.toString() || "" : "5"} className={inputClass} /></Field>
        <Field label="Líquido negativo"><select name="negativeNetPayPolicy" defaultValue={current?.negativeNetPayPolicy || "BLOQUEAR"} className={inputClass}>{negativeNetPayPolicies.map((policy) => <option key={policy} value={policy}>{policy}</option>)}</select></Field>
        <Field label="Margem consignável máxima (%)"><input type="number" min="0" max="100" step="0.01" name="maxConsignmentMarginRate" defaultValue={current?.maxConsignmentMarginRate || ""} className={inputClass} /></Field>
        <Field label="Teto remuneratório (R$)"><input type="number" min="0" step="0.01" name="remunerationCeiling" defaultValue={current?.remunerationCeiling || ""} className={inputClass} /></Field>
        <Checkbox name="freezeOnClose" label="Congelar configuração no fechamento" defaultChecked={current?.freezeOnClose ?? true} />
        <Field label="Referência legal" className="md:col-span-2 xl:col-span-3"><textarea name="legalReference" defaultValue={current?.legalReference || ""} className={textAreaClass} /></Field>
        <Field label="Observações" className="md:col-span-2 xl:col-span-3"><textarea name="notes" defaultValue={current?.notes || ""} className={textAreaClass} /></Field>
        <div className="flex justify-end md:col-span-2 xl:col-span-3"><button disabled={pending} className={primaryButtonClass}><Save className="size-4" />{pending ? "Salvando…" : "Salvar política de cálculo"}</button></div>
      </form>
    </section>
  );
}

function EmploymentRegimeEditor({ settings, pending, execute }: { settings: HrPayrollSettingsView; pending: boolean; execute: (action: () => Promise<ActionResult>) => Promise<ActionResult> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = settings.employmentRegimes.find((item) => item.id === selectedId) ?? null;
  const pager = usePage(settings.employmentRegimes);
  return (
    <div className="grid min-h-0 gap-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(21rem,.75fr)]">
      <TableShell footer={<PageControls page={pager.page} total={settings.employmentRegimes.length} onPageChange={pager.setPage} />}>
        <SectionHeader title="Vínculos e regimes" description="Associe cada natureza de vínculo ao regime previdenciário e à política de férias aplicáveis." action={<button type="button" onClick={() => setSelectedId(null)} className={secondaryButtonClass}><Plus className="size-4" />Novo vínculo</button>} />
        <CompactTable headers={["Código", "Nome", "Natureza", "Previdência", "Status"]}>
          {pager.items.length === 0 && <EmptyTableRow columns={5} message="Nenhum vínculo cadastrado nesta versão." />}
          {pager.items.map((regime) => (
            <tr key={regime.id} className={selectedId === regime.id ? "bg-emerald-50" : "hover:bg-slate-50"}>
              <td className="px-3 py-2 align-top"><button type="button" onClick={() => setSelectedId(regime.id)} className="font-semibold text-emerald-800 hover:underline">{regime.code}</button></td>
              <td className="px-3 py-2 align-top text-slate-800">{regime.name}</td>
              <td className="px-3 py-2 align-top text-slate-600">{regime.employmentNature}</td>
              <td className="px-3 py-2 align-top text-slate-600">{linkedName(settings.socialSecuritySchemes, regime.socialSecuritySchemeId)}</td>
              <td className="px-3 py-2 align-top text-slate-600">{regime.isActive ? "Ativo" : "Inativo"}</td>
            </tr>
          ))}
        </CompactTable>
      </TableShell>

      <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        <SectionHeader title={selected ? "Editar vínculo" : "Novo vínculo"} description="Os vínculos opcionais podem ficar sem associação até que a política correspondente seja criada." />
        <form key={selected?.id || "new"} className="grid gap-3 p-3 md:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void execute(() => saveHrEmploymentRegime({
            id: selected?.id,
            ruleSetId: settings.ruleSet.id,
            code: form.get("code"),
            name: form.get("name"),
            employmentNature: form.get("employmentNature"),
            esocialCategory: form.get("esocialCategory"),
            defaultMonthlyHours: form.get("defaultMonthlyHours"),
            socialSecuritySchemeId: form.get("socialSecuritySchemeId"),
            vacationPolicyId: form.get("vacationPolicyId"),
            legalReference: form.get("legalReference"),
            isActive: form.get("isActive") === "on",
          })).then((result) => { if (!result.error) setSelectedId(null); });
        }}>
          <Field label="Código"><input required name="code" defaultValue={selected?.code || "NOVO_VINCULO"} className={inputClass} /></Field>
          <Field label="Nome"><input required name="name" defaultValue={selected?.name || "Novo vínculo"} className={inputClass} /></Field>
          <Field label="Natureza do vínculo"><select name="employmentNature" defaultValue={selected?.employmentNature || "ESTATUTARIO"} className={inputClass}>{employmentNatures.map((nature) => <option key={nature} value={nature}>{nature}</option>)}</select></Field>
          <Field label="Categoria eSocial"><input name="esocialCategory" defaultValue={selected?.esocialCategory || ""} className={inputClass} /></Field>
          <Field label="Jornada mensal padrão"><input type="number" min="1" max="744" name="defaultMonthlyHours" defaultValue={selected?.defaultMonthlyHours?.toString() || ""} className={inputClass} /></Field>
          <Checkbox name="isActive" label="Vínculo ativo" defaultChecked={selected?.isActive ?? true} />
          <Field label="Regime previdenciário" className="md:col-span-2"><select name="socialSecuritySchemeId" defaultValue={selected?.socialSecuritySchemeId || ""} className={inputClass}><option value="">Não vincular agora</option>{settings.socialSecuritySchemes.map((scheme) => <option key={scheme.id} value={scheme.id}>{scheme.code} — {scheme.name}</option>)}</select></Field>
          <Field label="Política de férias" className="md:col-span-2"><select name="vacationPolicyId" defaultValue={selected?.vacationPolicyId || ""} className={inputClass}><option value="">Não vincular agora</option>{settings.vacationPolicies.map((policy) => <option key={policy.id} value={policy.id}>{policy.code} — {policy.name}</option>)}</select></Field>
          <Field label="Referência legal" className="md:col-span-2"><textarea name="legalReference" defaultValue={selected?.legalReference || ""} className={textAreaClass} /></Field>
          <div className="flex justify-end md:col-span-2"><button disabled={pending} className={primaryButtonClass}><Save className="size-4" />{pending ? "Salvando…" : "Salvar vínculo"}</button></div>
        </form>
      </section>
    </div>
  );
}

const ruleCategories = ["GERAL", "CALCULO", "FERIAS", "PREVIDENCIA", "CONSIGNACAO", "PORTAL"];
const ruleValueTypes = ["BOOLEAN", "INTEGER", "DECIMAL", "CURRENCY", "PERCENTAGE", "TEXT", "JSON", "DATE"];
const rubricTypes = ["PROVENTO", "DESCONTO", "INFORMATIVA", "BASE"];
const rubricCalculationMethods = ["MANUAL", "VALOR_FIXO", "PERCENTUAL", "FORMULA_CONTROLADA"];
const incidentTypes = ["RGPS", "RPPS", "IRRF", "FGTS", "FERIAS", "DECIMO_TERCEIRO", "TETO_REMUNERATORIO"];
const employmentNatures = ["ESTATUTARIO", "CLT", "COMISSIONADO", "TEMPORARIO", "ESTAGIARIO"];
const socialSecurityRegimes = ["RPPS", "RGPS", "COMPLEMENTAR"];
const socialSecurityMethods = ["PROGRESSIVA", "LINEAR"];
const roundingModes = ["HALF_UP", "HALF_EVEN", "DOWN", "UP"];
const negativeNetPayPolicies = ["BLOQUEAR", "PERMITIR", "GERAR_SALDO"];

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`grid gap-1 ${className}`}><span className={labelClass}>{label}</span>{children}</label>;
}

function Checkbox({ name, value, label, defaultChecked = false }: { name: string; value?: string; label: string; defaultChecked?: boolean }) {
  return <label className="flex items-center gap-1.5 text-xs text-slate-700"><input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="size-3.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600" />{label}</label>;
}

function CompactTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <table className="w-full table-fixed border-collapse text-left text-[11px] sm:text-xs"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"><tr>{headers.map((header) => <th key={header} className="truncate px-2.5 py-2 font-semibold" title={header}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody></table>;
}

function EmptyTableRow({ columns, message }: { columns: number; message: string }) {
  return <tr><td colSpan={columns} className="px-3 py-6 text-center text-xs text-slate-500">{message}</td></tr>;
}

function linkedName(items: { id: string; name: string }[], id: string | null) {
  if (!id) return "Não vinculado";
  return items.find((item) => item.id === id)?.name || "Referência não encontrada";
}
