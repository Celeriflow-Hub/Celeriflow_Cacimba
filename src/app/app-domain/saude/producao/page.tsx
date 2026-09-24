import { Factory } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { HealthSimpleListClient } from "../HealthSimpleListClient";
import { captureFactsAction, captureManualFactAction, closeCompetenceAction, generateFileAction, importProductionFileAction, openCompetenceAction, processCompetenceAction, processFileAction, reopenCompetenceAction, resolveCriticismAction, saveProductionTargetAction, saveUnitCeilingAction } from "./actions";
import type { Prisma } from "@prisma/client";

const field = "h-8 min-w-0 rounded border border-slate-200 bg-white px-2 text-xs";
const PAGE_SIZE = 20;
type Params = { q?: string | string[]; filter?: string | string[]; page?: string | string[]; comp?: string | string[]; professional?: string | string[]; procedure?: string | string[]; cid?: string | string[]; municipality?: string | string[]; state?: string | string[] };
const first = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
const num = (v: string | undefined) => v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : 1;

export default async function ProducaoPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getTenantContextForModule("SAUDE");
  const { prisma } = context;
  const unitIds = context.user.hasHealthAccessScope ? context.user.allowedHealthUnitIds || [] : undefined;
  const params = await searchParams;
  const q = (first(params.q) || "").trim().slice(0, 120);
  const filter = (first(params.filter) || "").trim().slice(0, 40);
  const compFilter = (first(params.comp) || "").trim().slice(0, 7);
  const professionalFilter = (first(params.professional) || "").trim().slice(0, 64);
  const procedureFilter = (first(params.procedure) || "").trim().slice(0, 64);
  const cidFilter = (first(params.cid) || "").trim().slice(0, 64);
  const municipalityFilter = (first(params.municipality) || "").trim().slice(0, 120);
  const stateFilter = (first(params.state) || "").trim().slice(0, 2).toUpperCase();
  const where: Prisma.HealthProductionFactWhereInput = {
    ...(unitIds ? { unitId: { in: unitIds } } : {}),
    ...(filter ? { status: filter } : {}),
    ...(compFilter ? { period: compFilter } : {}),
    ...(professionalFilter ? { professionalId: professionalFilter } : {}),
    ...(procedureFilter ? { procedureId: procedureFilter } : {}),
    ...(cidFilter ? { cidReferenceId: cidFilter } : {}),
    ...(municipalityFilter ? { municipality: { contains: municipalityFilter, mode: "insensitive" } } : {}),
    ...(stateFilter ? { state: stateFilter } : {}),
    ...(q ? { OR: [{ originType: { contains: q, mode: "insensitive" } }, { procedure: { code: { contains: q, mode: "insensitive" } } }, { procedure: { description: { contains: q, mode: "insensitive" } } }, { cidReference: { code: { contains: q, mode: "insensitive" } } }, { municipality: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const total = await prisma.healthProductionFact.count({ where });
  const page = Math.min(num(first(params.page)), Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const [facts, competences, criticisms, files, units, professionals, procedures, cids, municipalities] = await Promise.all([
    prisma.healthProductionFact.findMany({ where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: { occurredAt: "desc" }, include: { procedure: { select: { code: true } }, cidReference: { select: { code: true } }, unit: true, professional: { select: { id: true } } } }),
    prisma.healthProductionCompetence.findMany({ orderBy: { period: "desc" }, take: 24 }),
    prisma.healthProductionCriticism.findMany({ where: { status: "ABERTA", ...(unitIds ? { fact: { unitId: { in: unitIds } } } : {}) }, orderBy: { createdAt: "desc" }, take: 100, include: { fact: { select: { originType: true, originId: true, period: true } } } }),
    prisma.healthSusFile.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { competence: true, unit: true } }),
    prisma.healthUnit.findMany({ where: { isActive: true, ...(unitIds ? { id: { in: unitIds } } : {}) }, orderBy: { name: "asc" } }),
    prisma.healthProfessional.findMany({ where: { isActive: true }, take: 200, select: { id: true, cbo: true } }),
    prisma.healthSusProcedure.findMany({ where: { isActive: true, isCurrent: true }, take: 300, orderBy: { code: "asc" }, select: { id: true, code: true } }),
    prisma.healthSusReference.findMany({ where: { kind: "CID", isActive: true, isCurrent: true }, take: 200, orderBy: { code: "asc" }, select: { id: true, code: true } }),
    prisma.healthProductionFact.findMany({ where: { ...(unitIds ? { unitId: { in: unitIds } } : {}), municipality: { not: null } }, distinct: ["municipality"], take: 100, select: { municipality: true, state: true } }),
  ]);

  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Produção e Faturamento SUS" icon={<Factory className="size-4 text-teal-700" />} />
      <form method="get" className="grid shrink-0 gap-2 rounded-md border bg-white p-2 text-xs sm:grid-cols-2 lg:grid-cols-[1fr_130px_170px_170px_130px_170px_60px_auto]">
        <input name="q" defaultValue={q} placeholder="Buscar origem, procedimento, CID ou município" className="h-8 rounded border px-2.5" />
        <select name="comp" defaultValue={compFilter} className="h-8 rounded border bg-white px-2"><option value="">Todas as competências</option>{competences.map(c => <option key={c.id} value={c.period}>{c.period}</option>)}</select>
        <select name="professional" defaultValue={professionalFilter} className="h-8 rounded border bg-white px-2"><option value="">Todos os profissionais</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.cbo || p.id.slice(0,8)}</option>)}</select>
        <select name="procedure" defaultValue={procedureFilter} className="h-8 rounded border bg-white px-2"><option value="">Todos os procedimentos</option>{procedures.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}</select>
        <select name="cid" defaultValue={cidFilter} className="h-8 rounded border bg-white px-2"><option value="">Todos os CIDs</option>{cids.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}</select>
        <select name="municipality" defaultValue={municipalityFilter} className="h-8 rounded border bg-white px-2"><option value="">Todos os municípios</option>{municipalities.filter(m => m.municipality).map(m => <option key={m.municipality!} value={m.municipality!}>{m.municipality}{m.state ? `/${m.state}` : ""}</option>)}</select>
        <input name="state" defaultValue={stateFilter} placeholder="UF" maxLength={2} className="h-8 rounded border px-2 uppercase" />
        <button className="h-8 rounded bg-slate-800 px-4 font-bold text-white">Filtrar</button>
      </form>
      <div className="grid shrink-0 gap-2 lg:grid-cols-4">
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Competência</summary>
          <form action={openCompetenceAction} className="mt-2 grid gap-1"><input name="period" type="month" required className={field}/><button className="h-8 rounded bg-teal-700 font-semibold text-white">Abrir</button></form>
          <form action={captureFactsAction} className="mt-2 grid gap-1 border-t pt-2"><input name="period" type="month" placeholder="Período (vazio = tudo)" className={field}/><button className="h-8 rounded bg-slate-800 font-semibold text-white">Capturar fatos realizados</button></form>
          <form action={processCompetenceAction} className="mt-2 grid gap-1 border-t pt-2"><select name="competenceId" required className={field}><option value="">Competência</option>{competences.map(c => <option key={c.id} value={c.id}>{c.period} · {c.status}</option>)}</select><button className="h-8 rounded bg-teal-700 font-semibold text-white">Processar/validar</button></form>
          <div className="mt-2 flex gap-1">
            <form action={closeCompetenceAction} className="grid flex-1 gap-1"><input type="hidden" name="competenceId" value={competences[0]?.id || ""}/><button className="h-7 rounded border px-2">Fechar atual</button></form>
            <form action={reopenCompetenceAction} className="grid flex-1 gap-1"><input type="hidden" name="competenceId" value={competences.find(c => c.status==="FECHADA")?.id || ""}/><button className="h-7 rounded border px-2">Reabrir fechada</button></form>
          </div>
        </details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Gerar arquivo SUS</summary><form action={generateFileAction} className="mt-2 grid gap-1"><select name="competenceId" required className={field}><option value="">Competência</option>{competences.map(c => <option key={c.id} value={c.id}>{c.period} · {c.status}</option>)}</select><select name="fileType" required className={field}><option value="BPA">BPA</option><option value="RAAS">RAAS</option><option value="AIH">AIH</option><option value="FPO">FPO</option><option value="OUTRO">Outro</option></select><select name="unitId" className={field}><option value="">Todas as unidades (consolidado)</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><select name="financing" className={field}><option value="">Todos os financiamentos</option><option value="PAB">PAB</option><option value="MAC">MAC</option><option value="FAEC">FAEC</option></select><button className="h-8 rounded bg-teal-700 font-semibold text-white">Gerar a partir da competência</button></form></details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Digitação e metas</summary>
          <form action={captureManualFactAction} className="mt-2 grid gap-1"><select name="procedureId" required className={field}><option value="">Procedimento</option>{procedures.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}</select><select name="unitId" required className={field}><option value="">Unidade</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><select name="professionalId" className={field}><option value="">Profissional</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.cbo || p.id.slice(0, 8)}</option>)}</select><div className="grid grid-cols-2 gap-1"><input name="quantity" type="number" min="1" required placeholder="Qtde" className={field} /><input name="occurredAt" type="date" required className={field} /></div><input name="value" type="number" step="0.01" placeholder="Valor (vazio usa tabela)" className={field} /><button className="h-8 rounded bg-teal-700 font-semibold text-white">Digitar fato</button></form>
          <form action={importProductionFileAction} className="mt-2 grid gap-1 border-t pt-2"><input name="file" type="file" accept=".txt,.csv" required className={field} /><button className="h-8 rounded bg-slate-800 font-semibold text-white">Importar BPA recebido</button></form>
          <form action={saveProductionTargetAction} className="mt-2 grid gap-1 border-t pt-2"><select name="competenceId" required className={field}><option value="">Competência (FPO)</option>{competences.map(c => <option key={c.id} value={c.id}>{c.period}</option>)}</select><select name="procedureId" required className={field}><option value="">Procedimento</option>{procedures.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}</select><input name="contractedQuantity" type="number" min="1" required placeholder="Qtd contratada" className={field} /><button className="h-8 rounded bg-teal-700 font-semibold text-white">Definir meta FPO</button></form>
          <form action={saveUnitCeilingAction} className="mt-2 grid gap-1 border-t pt-2"><select name="unitId" required className={field}><option value="">Unidade (teto)</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><input name="period" type="month" required className={field} /><input name="value" type="number" min="0" step="0.01" required placeholder="Teto R$" className={field} /><button className="h-8 rounded bg-slate-800 font-semibold text-white">Definir teto</button></form>
        </details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Processar arquivo (adaptador)</summary><form action={processFileAction} className="mt-2 grid gap-1"><select name="fileId" required className={field}><option value="">Arquivo</option>{files.map(f => <option key={f.id} value={f.id}>{f.fileType} · {f.competence.period} · {f.status} · {f.quantity}</option>)}</select><p className="text-[10px] text-slate-500">Validador controlado: confere estrutura, devolve aceites/rejeições por linha.</p><button className="h-8 rounded bg-slate-800 font-semibold text-white">Processar</button></form></details>
        <div className="min-h-0 overflow-y-auto rounded border bg-white p-2"><h2 className="sticky top-0 bg-white pb-2 text-xs font-bold uppercase text-slate-500">Críticas abertas ({criticisms.length})</h2>{criticisms.map(c => <article key={c.id} className="mb-2 rounded border p-2 text-xs"><strong>{c.code}</strong><p className="text-slate-500">{c.message}</p><p className="text-slate-400">{c.fact.originType}:{c.fact.originId.slice(0,8)} · {c.fact.period}</p><p className="text-slate-400">{c.actionNeeded}</p><form action={resolveCriticismAction} className="mt-1"><input type="hidden" name="criticismId" value={c.id}/><button className="rounded border px-2 py-1">Resolver após corrigir origem</button></form></article>)}{criticisms.length===0 && <p className="text-xs text-slate-400">Sem críticas abertas.</p>}</div>
      </div>
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[2fr_1fr]">
        <HealthSimpleListClient rows={facts.map(f => ({ id: f.id, cells: { date: f.occurredAt.toLocaleDateString("pt-BR"), origin: f.originType, procedure: f.procedure?.code || "-", cid: f.cidReference?.code || "-", unit: f.unit?.name || "-", municipality: f.municipality ? `${f.municipality}${f.state ? `/${f.state}` : ""}` : "-", qty: String(f.quantity), status: f.status, period: f.period } }))} columns={[{ key: "date", label: "Data", width: "medium" }, { key: "origin", label: "Origem", width: "medium" }, { key: "procedure", label: "Procedimento", responsive: "sm" }, { key: "cid", label: "CID", responsive: "lg", width: "narrow" }, { key: "unit", label: "Unidade", responsive: "md" }, { key: "municipality", label: "Município", responsive: "lg", width: "medium" }, { key: "qty", label: "Qtde", width: "narrow" }, { key: "period", label: "Comp.", width: "narrow" }, { key: "status", label: "Situação", width: "medium" }]} label="fatos" searchPlaceholder="Buscar origem, procedimento, CID ou município" filterKey="status" filterLabel="Todos" serverPagination={{ page, total, pathname: "/app-domain/saude/producao", search: q, filter, filterOptions: ["VALIDO","CRITICADO"], extra: { comp: compFilter || undefined, professional: professionalFilter || undefined, procedure: procedureFilter || undefined, cid: cidFilter || undefined, municipality: municipalityFilter || undefined, state: stateFilter || undefined } }} />
        <div className="min-h-0 overflow-y-auto rounded border bg-white p-2"><h2 className="sticky top-0 bg-white pb-2 text-xs font-bold uppercase text-slate-500">Arquivos SUS</h2>{files.map(f => <article key={f.id} className="mb-2 rounded border p-2 text-xs"><strong>{f.fileType} · {f.competence.period}</strong><p className="text-slate-500">{f.unit?.name || "Todas"} · {f.status} · {f.processedCount}/{f.rejectedCount}/{f.quantity}</p><p className="truncate text-slate-400" title={f.hash}>hash {f.hash.slice(0,16)}…</p><div className="mt-1 flex gap-2"><a className="rounded border px-2 py-1" href={`/api/saude/producao/arquivos/${f.id}`}>Baixar</a></div>{Array.isArray(f.errors) && (f.errors as unknown[]).length > 0 && <p className="mt-1 text-rose-600">{(f.errors as Array<{reason:string}>).length} linha(s) rejeitada(s). Reprocesse após corrigir a origem.</p>}</article>)}{files.length===0 && <p className="text-xs text-slate-400">Nenhum arquivo gerado.</p>}</div>
      </div>
    </PageFrame>
  );
}
