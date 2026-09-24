import { ClipboardList } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { HealthSimpleListClient } from "../HealthSimpleListClient";
import { addAttachmentAction, createRegulationRequestAction, grantProviderAccessAction, reclassifyAction, saveRegulationQuotaAction, saveSectorAction, transferAuthorizationAction, transitionRegulationAction } from "./actions";
import { validateGuideCode } from "@/lib/saude/regulation-service";
import type { Prisma } from "@prisma/client";

const field = "h-8 min-w-0 rounded border border-slate-200 bg-white px-2 text-xs";
const PAGE_SIZE = 20;
type Params = { q?: string | string[]; filter?: string | string[]; page?: string | string[]; guideCode?: string | string[] };
const first = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
const num = (v: string | undefined) => v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : 1;

export default async function RegulacaoPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getTenantContextForModule("SAUDE");
  const { prisma } = context;
  const unitIds = context.user.hasHealthAccessScope ? context.user.allowedHealthUnitIds || [] : undefined;
  const params = await searchParams;
  const q = (first(params.q) || "").trim().slice(0, 120);
  const filter = (first(params.filter) || "").trim().slice(0, 40);
  const guideCode = (first(params.guideCode) || "").trim().slice(0, 16);
  const where: Prisma.HealthRegulationRequestWhereInput = {
    ...(unitIds ? { requestUnitId: { in: unitIds } } : {}),
    ...(filter ? { status: filter } : {}),
    ...(q ? { OR: [{ patient: { person: { fullName: { contains: q, mode: "insensitive" } } } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const total = await prisma.healthRegulationRequest.count({ where });
  const page = Math.min(num(first(params.page)), Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const [requests, quotas, patients, units, specialties, services, suppliers, procedures, sectors, cids, covenants, usuarios] = await Promise.all([
    prisma.healthRegulationRequest.findMany({ where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: { createdAt: "desc" }, include: { patient: { include: { person: true } }, requestUnit: true, specialty: true, service: true, quota: true, sector: true, cidReference: { select: { code: true } } } }),
    prisma.healthRegulationQuota.findMany({ where: unitIds ? { unitId: { in: unitIds } } : {}, orderBy: { period: "desc" }, include: { provider: { select: { id: true, person: { select: { fullName: true } }, company: { select: { corporateName: true } } } }, unit: true, specialty: true, service: true, convenio: { select: { number: true } } } }),
    prisma.patient.findMany({ where: { status: "Ativo", ...(unitIds ? { referenceUnitId: { in: unitIds } } : {}) }, take: 500, orderBy: { person: { fullName: "asc" } }, include: { person: true } }),
    prisma.healthUnit.findMany({ where: { isActive: true, ...(unitIds ? { id: { in: unitIds } } : {}) }, orderBy: { name: "asc" } }),
    prisma.healthSpecialty.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.healthService.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { status: "Ativo" }, take: 200, select: { id: true, person: { select: { fullName: true } }, company: { select: { corporateName: true } } } }),
    prisma.healthSusProcedure.findMany({ where: { isActive: true, isCurrent: true }, take: 300, orderBy: { description: "asc" } }),
    prisma.healthRegulationSector.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.healthSusReference.findMany({ where: { kind: "CID", isActive: true, isCurrent: true }, take: 300, orderBy: { code: "asc" }, select: { id: true, code: true } }),
    prisma.covenant.findMany({ take: 200, orderBy: { number: "asc" }, select: { id: true, number: true } }),
    prisma.usuario.findMany({ where: { ativo: true }, take: 200, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);
  let guideResult: Awaited<ReturnType<typeof validateGuideCode>> | null = null;
  let guideError = "";
  if (guideCode) {
    try {
      guideResult = await validateGuideCode(context, guideCode);
    } catch (error) {
      guideError = error instanceof Error ? error.message : "Código inválido.";
    }
  }

  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Regulação e Cotas" icon={<ClipboardList className="size-4 text-indigo-700" />} />
      <div className="grid shrink-0 gap-2 lg:grid-cols-4">
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Configurar cota</summary><form action={saveRegulationQuotaAction} className="mt-2 grid gap-1"><select name="providerSupplierId" required className={field}><option value="">Prestador</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.company?.corporateName || s.person?.fullName}</option>)}</select><select name="unitId" className={field}><option value="">Todas as unidades</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><select name="specialtyId" className={field}><option value="">Especialidade</option>{specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select name="serviceId" className={field}><option value="">Serviço</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select name="procedureId" className={field}><option value="">Procedimento</option>{procedures.map(p => <option key={p.id} value={p.id}>{p.code} · {p.description.slice(0,40)}</option>)}</select><select name="convenioId" className={field}><option value="">Sem convênio vinculado</option>{covenants.map(c => <option key={c.id} value={c.id}>{c.number}</option>)}</select><input name="period" type="month" required className={field}/><input name="totalQuantity" type="number" min="1" required placeholder="Quantidade total" className={field}/><input name="unitValue" type="number" step="0.01" placeholder="Valor unitário (opcional)" className={field}/><button className="h-8 rounded bg-indigo-700 font-semibold text-white">Salvar cota</button></form></details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Nova solicitação direta</summary><form action={createRegulationRequestAction} className="mt-2 grid gap-1"><select name="patientId" required className={field}><option value="">Paciente</option>{patients.map(p => <option key={p.id} value={p.id}>{p.person.fullName}</option>)}</select><select name="requestUnitId" className={field}><option value="">Unidade solicitante</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><select name="specialtyId" className={field}><option value="">Especialidade</option>{specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select name="serviceId" className={field}><option value="">Serviço</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select name="sectorId" className={field}><option value="">Setor</option>{sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select name="cidReferenceId" className={field}><option value="">CID</option>{cids.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}</select><select name="priority" className={field}><option>Normal</option><option>Media</option><option>Alta</option></select><input name="patientCondition" placeholder="Condição (ex. gestante)" className={field}/><input name="contactPhone" placeholder="Telefone de contato" className={field}/><input name="preparation" placeholder="Preparo" className={field}/><textarea name="observations" placeholder="Observações" className="min-h-12 rounded border p-2"/><textarea name="transportNotes" placeholder="Transporte/acompanhante/retorno" className="min-h-12 rounded border p-2"/><label className="flex items-center gap-2"><input type="checkbox" name="isExternal" /> Atendimento externo (TFD)</label><textarea name="description" placeholder="Descrição/motivo" className="min-h-16 rounded border p-2"/><button className="h-8 rounded bg-indigo-700 font-semibold text-white">Criar</button></form></details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Movimentar fila</summary><form action={transitionRegulationAction} className="mt-2 grid gap-1"><select name="requestId" required className={field}><option value="">Solicitação</option>{requests.map(r => <option key={r.id} value={r.id}>{r.patient.person.fullName} · {r.status}</option>)}</select><select name="toStatus" required className={field}><option value="EM_ANALISE">Em análise</option><option value="AUTORIZADA">Autorizar</option><option value="AGENDADA">Agendar</option><option value="EXECUTADA">Executar</option><option value="CONCLUIDA">Concluir/Retorno</option><option value="DEVOLVIDA">Devolver</option><option value="CANCELADA">Cancelar</option><option value="ARQUIVADA">Arquivar</option></select><select name="quotaId" className={field}><option value="">Cota (para autorizar)</option>{quotas.map(q => <option key={q.id} value={q.id}>{q.provider.company?.corporateName || q.provider.person?.fullName} · {q.period} · {q.totalQuantity - q.reservedQuantity - q.realizedQuantity} disp.</option>)}</select><input name="scheduledAt" type="datetime-local" className={field}/><input name="notes" placeholder="Observações" className={field}/><button className="h-8 rounded bg-slate-800 font-semibold text-white">Aplicar</button></form>
          <form action={reclassifyAction} className="mt-2 grid gap-1 border-t pt-2"><select name="requestId" required className={field}><option value="">Reclassificar</option>{requests.map(r => <option key={r.id} value={r.id}>{r.patient.person.fullName} · {r.status}</option>)}</select><select name="specialtyId" className={field}><option value="">Especialidade</option>{specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select name="serviceId" className={field}><option value="">Serviço</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><input name="notes" required placeholder="Motivo" className={field}/><button className="h-7 rounded border px-2">Reclassificar</button></form>
          <form action={transferAuthorizationAction} className="mt-2 grid gap-1 border-t pt-2"><select name="requestId" required className={field}><option value="">Autorizada</option>{requests.filter(r => r.status === "AUTORIZADA").map(r => <option key={r.id} value={r.id}>{r.patient.person.fullName}</option>)}</select><select name="quotaId" required className={field}><option value="">Cota destino</option>{quotas.map(q => <option key={q.id} value={q.id}>{q.provider.company?.corporateName || q.provider.person?.fullName} · {q.period}</option>)}</select><button className="h-7 rounded border px-2">Transferir autorização</button></form>
          <form action={addAttachmentAction} className="mt-2 grid gap-1 border-t pt-2"><select name="requestId" required className={field}><option value="">Solicitação</option>{requests.map(r => <option key={r.id} value={r.id}>{r.patient.person.fullName} · {r.status}</option>)}</select><input name="file" type="file" required className={field}/><button className="h-7 rounded border px-2">Anexar documento</button></form></details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Setores, guia e prestador</summary>
          <form action={saveSectorAction} className="mt-2 grid gap-1"><input name="name" required placeholder="Setor de regulação" className={field}/><button className="h-7 rounded border px-2">Salvar setor</button></form>
          <form method="get" className="mt-2 grid gap-1 border-t pt-2"><input name="guideCode" defaultValue={guideCode} placeholder="Código de validação da guia" className={field}/><button className="h-7 rounded border px-2">Validar guia</button></form>
          {guideError && <p className="mt-1 text-rose-600">{guideError}</p>}
          {guideResult && <p className="mt-1">Guia {guideResult.guideNumber || guideResult.id.slice(0, 8)} · {guideResult.patient} · {guideResult.service} · {guideResult.status}</p>}
          <form action={grantProviderAccessAction} className="mt-2 grid gap-1 border-t pt-2"><select name="supplierId" required className={field}><option value="">Prestador</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.company?.corporateName || s.person?.fullName}</option>)}</select><select name="usuarioId" required className={field}><option value="">Usuário do portal</option>{usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select><button className="h-7 rounded border px-2">Conceder acesso</button></form></details>
      </div>
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[2fr_1fr]">
        <HealthSimpleListClient rows={requests.map(r => ({ id: r.id, cells: { protocol: r.protocolNumber || "-", patient: r.patient.person.fullName, unit: r.requestUnit?.name || "-", specialty: r.specialty?.name || r.service?.name || "-", priority: r.priority, status: r.status, guide: r.guideNumber || "-", updated: r.updatedAt.toLocaleDateString("pt-BR"), quota: r.quota ? `${r.quota.reservedQuantity}/${r.quota.realizedQuantity}/${r.quota.totalQuantity}` : "-" } }))} columns={[{ key: "protocol", label: "Protocolo", width: "medium" }, { key: "patient", label: "Paciente" }, { key: "unit", label: "Unidade", responsive: "sm" }, { key: "specialty", label: "Especialidade/Serviço", responsive: "md" }, { key: "priority", label: "Prioridade", width: "narrow" }, { key: "status", label: "Situação", width: "medium" }, { key: "guide", label: "Guia", responsive: "lg", width: "medium" }, { key: "quota", label: "Cota Rsv/Real/Tot", width: "medium" }]} label="solicitações" searchPlaceholder="Buscar paciente ou descrição" filterKey="status" filterLabel="Todas" serverPagination={{ page, total, pathname: "/app-domain/saude/regulacao", search: q, filter, filterOptions: ["RECEBIDA","EM_ANALISE","AUTORIZADA","AGENDADA","EXECUTADA","CONCLUIDA","DEVOLVIDA","CANCELADA","ARQUIVADA"] }} />
        <div className="min-h-0 overflow-y-auto rounded border bg-white p-2"><h2 className="sticky top-0 bg-white pb-2 text-xs font-bold uppercase text-slate-500">Cotas</h2>{quotas.map(q => <article key={q.id} className="mb-2 rounded border p-2 text-xs"><strong>{q.provider.company?.corporateName || q.provider.person?.fullName}</strong><p className="text-slate-500">{q.unit?.name || "Todas"} · {q.period}{q.convenio ? ` · convênio ${q.convenio.number}` : ""}</p><p>Total {q.totalQuantity} · Reservado {q.reservedQuantity} · Realizado {q.realizedQuantity} · Disponível {q.totalQuantity - q.reservedQuantity - q.realizedQuantity}</p></article>)}{quotas.length===0 && <p className="text-xs text-slate-400">Nenhuma cota configurada.</p>}</div>
      </div>
    </PageFrame>
  );
}
