import { Activity } from "lucide-react";
import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { auditEventTypes } from "@/lib/platform/audit-evidence";
import { createAuditEventSearchParams, parseAuditEventQuery } from "@/lib/platform/audit-query";
import { getAuditEventPage } from "@/lib/platform/audit-query-service";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpTableContainer, ErpTableTd, ErpTableTh, ErpTableThead, ErpTableTr } from "@/components/app-ui/erp/ErpTable";

export const dynamic = "force-dynamic";

const eventLabels: Record<string, string> = {
  SESSION_LOGIN: "Iniciou sessão", SESSION_LOGOUT: "Encerrou sessão", DOCUMENT_DOWNLOAD: "Baixou documento",
  FINANCIAL_REPORT_EXPORT: "Exportou relatório financeiro", REPORT_ISSUED: "Emitiu relatório", PAGE_VIEW: "Visualizou página",
  UI_INTERACTION: "Interagiu com controle", FORM_SUBMIT: "Enviou formulário", INSTANCE_CONFIGURATION_CHANGED: "Alterou parâmetro da instância",
  PROCESS_OPENED: "Abriu processo", PROCESS_UPDATED: "Atualizou processo", PROCESS_DOCUMENT_LINKED: "Vinculou documento ao processo",
  GED_DOCUMENT_INGESTED: "Registrou documento no GED", DOCUMENT_SIGNATURE_REQUESTED: "Solicitou assinatura interna",
  DOCUMENT_SIGNATURE_REGISTERED: "Registrou assinatura interna", PUBLIC_NOTICE_PUBLISHED: "Publicou aviso público redigido",
};

function describeTarget(event: { targetType: string; targetId: string }) {
  if (event.targetType === "PAGE") return event.targetId;
  if (event.targetType === "CONTROL") { const [path, control] = event.targetId.split("|"); return `${control === "link" ? "Link" : "Controle"} em ${path}`; }
  if (event.targetType === "FORM") return `Formulário em ${event.targetId}`;
  const labels: Record<string, string> = { SESSION: "Sessão autenticada", DOCUMENT: "Documento protegido", FINANCIAL_REPORT: "Relatório financeiro", INSTANCE_CONFIGURATION: "Parâmetro operacional", PROCESS: "Processo privado", DOCUMENT_SIGNATURE: "Assinatura de documento", PUBLIC_NOTICE: "Aviso público" };
  return labels[event.targetType] ?? event.targetType;
}

function getLast24Hours() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export default async function AuditUsagePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { prisma } = await getTenantContextForSystemAdministration();
  const auditQuery = parseAuditEventQuery(await searchParams);
  const last24Hours = getLast24Hours();
  const [eventPage, totalEvents, eventsLast24Hours, activeUsers] = await Promise.all([
    getAuditEventPage(prisma, auditQuery), prisma.auditEvent.count(),
    prisma.auditEvent.count({ where: { createdAt: { gte: last24Hours } } }),
    prisma.auditEvent.groupBy({ by: ["actorUsuarioId"], where: { createdAt: { gte: last24Hours } } }),
  ]);
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" });
  const controlClass = "h-7 min-w-0 rounded border border-slate-300 bg-white px-2 text-xs text-slate-900 outline-none focus:border-amber-600";

  return <PageFrame className="flex h-full min-h-0 flex-col">
    <PageHeader title="Auditoria de uso" icon={<Activity className="size-4 text-amber-700" />} action={<span className="text-[11px] text-slate-500">{totalEvents} eventos · {eventsLast24Hours} nas últimas 24h · {activeUsers.length} usuários ativos</span>} />
    <ErpListFrame
      toolbar={<form method="get" className="grid grid-cols-2 gap-1.5 lg:flex lg:items-center">
        <input name="actorUsuarioId" defaultValue={auditQuery.filters.actorUsuarioId} placeholder="ID do usuário" aria-label="ID do usuário" className={controlClass} />
        <select name="eventType" defaultValue={auditQuery.filters.eventType ?? ""} aria-label="Ação" className={controlClass}><option value="">Todas as ações</option>{Object.values(auditEventTypes).map((eventType) => <option key={eventType} value={eventType}>{eventLabels[eventType]}</option>)}</select>
        <input name="targetType" defaultValue={auditQuery.filters.targetType} placeholder="Tipo de entidade" aria-label="Tipo de entidade" className={controlClass} />
        <input name="targetId" defaultValue={auditQuery.filters.targetId} placeholder="Identificador" aria-label="Identificador" className={controlClass} />
        <input name="from" type="date" defaultValue={auditQuery.filters.from} aria-label="Data inicial" className={controlClass} />
        <input name="to" type="date" defaultValue={auditQuery.filters.to} aria-label="Data final" className={controlClass} />
        <button type="submit" className="h-7 rounded bg-slate-900 px-3 text-xs font-semibold text-white">Filtrar</button>
        <a href="/configuracoes/auditoria" className="inline-flex h-7 items-center justify-center rounded border border-slate-300 px-3 text-xs font-semibold text-slate-700">Limpar</a>
      </form>}
      pagination={<div className="flex min-h-7 items-center justify-between text-[11px] text-slate-500"><span>20 eventos por página</span><div className="flex gap-2">{eventPage.previousCursor ? <a href={`/configuracoes/auditoria?${createAuditEventSearchParams(auditQuery.filters, { cursor: eventPage.previousCursor, direction: "previous" })}`} className="rounded border px-2.5 py-1 font-medium text-slate-700">Anterior</a> : <span className="rounded border px-2.5 py-1 text-slate-300">Anterior</span>}{eventPage.nextCursor ? <a href={`/configuracoes/auditoria?${createAuditEventSearchParams(auditQuery.filters, { cursor: eventPage.nextCursor })}`} className="rounded border px-2.5 py-1 font-medium text-slate-700">Próxima</a> : <span className="rounded border px-2.5 py-1 text-slate-300">Próxima</span>}</div></div>}
    >
      <ErpTableContainer><ErpTableThead><ErpTableTr><ErpTableTh className="w-[18%]">Data/hora</ErpTableTh><ErpTableTh className="w-[22%]">Usuário</ErpTableTh><ErpTableTh className="w-[25%]">Ação</ErpTableTh><ErpTableTh className="w-[15%]">Entidade</ErpTableTh><ErpTableTh>Identificador</ErpTableTh></ErpTableTr></ErpTableThead>
        <tbody>{eventPage.events.map((event) => <ErpTableTr key={event.id}><ErpTableTd>{dateFormatter.format(event.createdAt)}</ErpTableTd><ErpTableTd title={`${event.actorUsuario.nome} · ${event.actorUsuario.email}`}>{event.actorUsuario.nome}</ErpTableTd><ErpTableTd>{eventLabels[event.eventType] ?? event.eventType}</ErpTableTd><ErpTableTd>{event.targetType}</ErpTableTd><ErpTableTd className="font-mono" title={describeTarget(event)}>{describeTarget(event)}</ErpTableTd></ErpTableTr>)}{eventPage.events.length === 0 && <ErpTableTr><ErpTableTd colSpan={5} className="text-center text-slate-500">Nenhum evento encontrado.</ErpTableTd></ErpTableTr>}</tbody>
      </ErpTableContainer>
    </ErpListFrame>
  </PageFrame>;
}
