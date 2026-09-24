import Link from "next/link";
import { AlertTriangle, Clock3, Eye, FileSearch, FileText, Inbox, Search, Timer } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getProtocolContext, protocolScope } from "@/lib/protocols/access";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type QueryValue = string | string[] | undefined;

type SearchParams = {
  q?: QueryValue;
  status?: QueryValue;
  priority?: QueryValue;
  departmentId?: QueryValue;
  deadline?: QueryValue;
  page?: QueryValue;
};

type ListingFilters = {
  q: string;
  status: string;
  priority: string;
  departmentId: string;
  deadline: string;
};

function valueOf(value: QueryValue) {
  return (Array.isArray(value) ? value[0] : value || "").trim();
}
function listHref(filters: ListingFilters, page = 1) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.departmentId) params.set("departmentId", filters.departmentId);
  if (filters.deadline) params.set("deadline", filters.deadline);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? "/protocolos/acompanhamento?" + query : "/protocolos/acompanhamento";
}

function deadlineState(expectedCompletionAt: Date | null, requestTime: Date) {
  if (!expectedCompletionAt) return { label: "Sem prazo", className: "bg-slate-100 text-slate-600" };
  const days = Math.ceil((expectedCompletionAt.getTime() - requestTime.getTime()) / 86_400_000);
  if (days < 0) return { label: String(Math.abs(days)) + "d atrasado", className: "bg-red-100 text-red-700" };
  if (days <= 3) return { label: String(days) + "d restantes", className: "bg-amber-100 text-amber-700" };
  return { label: String(days) + "d restantes", className: "bg-emerald-100 text-emerald-700" };
}

function statusClass(status: string) {
  if (["Concluido", "Concluído"].includes(status)) return "bg-emerald-100 text-emerald-700";
  if (status === "Aguardando Recebimento") return "bg-blue-100 text-blue-700";
  if (status === "Arquivado") return "bg-slate-100 text-slate-600";
  if (["Cancelado", "Rejeitado"].includes(status)) return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

export default async function AcompanhamentoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const requestTime = new Date();
  const context = await getProtocolContext();
  const raw = await searchParams;
  const isAdmin = context.protocolAccess.isAdmin;
  const deadlineValue = valueOf(raw.deadline);
  const filters: ListingFilters = {
    q: valueOf(raw.q).slice(0, 120),
    status: valueOf(raw.status).slice(0, 80),
    priority: valueOf(raw.priority).slice(0, 80),
    departmentId: isAdmin ? valueOf(raw.departmentId).slice(0, 120) : "",
    deadline: ["overdue", "soon"].includes(deadlineValue) ? deadlineValue : "",
  };
  const requestedPage = Number.parseInt(valueOf(raw.page), 10);
  const conditions: Prisma.ProcessWhereInput[] = [protocolScope(context)];

  if (filters.status) conditions.push({ status: filters.status });
  if (filters.priority) conditions.push({ priority: filters.priority });
  if (filters.departmentId) conditions.push({ currentDepartmentId: filters.departmentId });
  if (filters.deadline === "overdue") conditions.push({ expectedCompletionAt: { lt: requestTime } });
  if (filters.deadline === "soon") {
    conditions.push({ expectedCompletionAt: { gte: requestTime, lte: new Date(requestTime.getTime() + 3 * 86_400_000) } });
  }
  if (filters.q) {
    conditions.push({
      OR: [
        { protocolNumber: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { person: { is: { OR: [{ fullName: { contains: filters.q, mode: "insensitive" } }, { cpf: { contains: filters.q, mode: "insensitive" } }] } } },
        { company: { is: { OR: [{ corporateName: { contains: filters.q, mode: "insensitive" } }, { cnpj: { contains: filters.q, mode: "insensitive" } }] } } },
        { processType: { is: { name: { contains: filters.q, mode: "insensitive" } } } },
        { subject: { is: { name: { contains: filters.q, mode: "insensitive" } } } },
      ],
    });
  }

  const where: Prisma.ProcessWhereInput = { AND: conditions };
  const [total, awaitingReceipt, active, overdue, departments] = await Promise.all([
    context.prisma.process.count({ where }),
    context.prisma.process.count({ where: { AND: [protocolScope(context), { status: "Aguardando Recebimento" }] } }),
    context.prisma.process.count({ where: { AND: [protocolScope(context), { status: { in: ["Recebido", "Em Analise", "Reaberto"] } }] } }),
    context.prisma.process.count({ where: { AND: [protocolScope(context), { expectedCompletionAt: { lt: requestTime } }, { status: { notIn: ["Concluido", "Arquivado", "Cancelado"] } }] } }),
    isAdmin
      ? context.prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
  const processes = await context.prisma.process.findMany({
    where,
    include: {
      processType: { select: { name: true } },
      subject: { select: { name: true } },
      person: { select: { fullName: true } },
      company: { select: { corporateName: true } },
      currentDepartment: { select: { name: true } },
      currentResponsibleEmployee: { select: { name: true } },
      movements: {
        include: { fromDepartment: { select: { name: true } }, toDepartment: { select: { name: true } } },
        orderBy: { movedAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const firstVisible = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastVisible = Math.min(page * PAGE_SIZE, total);
  const returnTo = listHref(filters, page);

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 p-2 lg:p-3">
      <ErpPageTitle
        title="Acompanhamento"
        description="Status, prazos e tramitações no recorte autorizado."
        icon={<FileSearch className="size-5 shrink-0 text-emerald-700" />}
      />

      <ErpListFrame
        toolbar={(
          <form action="/protocolos/acompanhamento" method="GET" className="flex flex-wrap items-end gap-x-2 gap-y-1.5">
            <label className="min-w-48 flex-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Busca
              <span className="relative mt-0.5 block">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input name="q" defaultValue={filters.q} placeholder="Protocolo, interessado, CPF/CNPJ..." className="h-7 w-full rounded border border-slate-300 bg-white py-1 pl-7 pr-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" />
              </span>
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Situação
              <select name="status" defaultValue={filters.status} className="mt-0.5 h-7 max-w-36 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                <option value="">Todas</option><option>Aguardando Recebimento</option><option>Recebido</option><option>Em Analise</option><option>Reaberto</option><option>Concluido</option><option>Arquivado</option>
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Prioridade
              <select name="priority" defaultValue={filters.priority} className="mt-0.5 h-7 max-w-28 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                <option value="">Todas</option><option>Normal</option><option>Alta</option><option>Urgente</option>
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Prazo
              <select name="deadline" defaultValue={filters.deadline} className="mt-0.5 h-7 max-w-32 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                <option value="">Todos</option><option value="soon">Até 3 dias</option><option value="overdue">Atrasados</option>
              </select>
            </label>
            {isAdmin && (
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Setor
                <select name="departmentId" defaultValue={filters.departmentId} className="mt-0.5 h-7 max-w-40 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                  <option value="">Todos</option>
                  {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
              </label>
            )}
            <button className="h-7 rounded bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-700">Aplicar</button>
            <Link href="/protocolos/acompanhamento" className="inline-flex h-7 items-center justify-center px-1 text-xs font-semibold text-slate-600 hover:text-emerald-800">Limpar</Link>
          </form>
        )}
        summary={(
          <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-600">
            <span><strong className="text-slate-900">{total}</strong> processo(s) no recorte autorizado{total ? " · exibindo " + firstVisible + "–" + lastVisible : ""}.</span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1"><Clock3 className="size-3 text-blue-700" />Em andamento: <strong className="text-slate-800">{active}</strong></span>
              <span className="inline-flex items-center gap-1"><Inbox className="size-3 text-amber-700" />Aguardando: <strong className="text-slate-800">{awaitingReceipt}</strong></span>
              <span className="inline-flex items-center gap-1"><AlertTriangle className="size-3 text-red-700" />Atrasados: <strong className="text-slate-800">{overdue}</strong></span>
              {!isAdmin && !context.user.departmentId && <span className="font-medium text-amber-800">Vincule o usuário a um servidor com setor para acompanhar processos.</span>}
            </div>
          </div>
        )}
        pagination={<ErpPagination page={page} total={total} pageSize={PAGE_SIZE} previousHref={listHref(filters, page - 1)} nextHref={listHref(filters, page + 1)} label="processos acompanhados" />}
      >
        {processes.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center">
            <div className="mb-2 flex size-9 items-center justify-center rounded-full bg-slate-100"><FileText className="size-5 text-slate-400" /></div>
            <h2 className="text-sm font-bold text-slate-700">Nenhum processo encontrado</h2>
            <p className="mt-1 max-w-md text-xs text-slate-500">Revise os filtros ou aguarde uma nova tramitação no seu setor.</p>
          </div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <table className="w-full table-fixed border-collapse text-left text-[11px] leading-3">
                <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
                  <tr className="h-7">
                    <th className="w-[14%] px-2 text-left">Protocolo</th>
                    <th className="px-2 text-left">Tipo e assunto</th>
                    <th className="hidden w-[16%] px-2 text-left 2xl:table-cell">Interessado</th>
                    <th className="w-[22%] px-2 text-left">Setor e responsável</th>
                    <th className="w-[16%] px-2 text-left">Situação e prazo</th>
                    <th className="hidden w-[16%] px-2 text-left 2xl:table-cell">Última tramitação</th>
                    <th className="w-[8%] px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processes.map((process) => {
                    const lastMovement = process.movements[0];
                    const deadline = deadlineState(process.expectedCompletionAt, requestTime);
                    const processLabel = process.processType.name + " · " + process.subject.name;
                    const sectorLabel = (process.currentDepartment?.name || "Sem setor") + " · " + (process.currentResponsibleEmployee?.name || "Sem responsável");
                    const movementLabel = lastMovement
                      ? (lastMovement.fromDepartment?.name || "Abertura") + " → " + lastMovement.toDepartment.name + " · " + new Date(lastMovement.movedAt).toLocaleDateString("pt-BR")
                      : "Sem movimentação";
                    const interested = process.person?.fullName || process.company?.corporateName || "Não informado";
                    return (
                      <tr key={process.id} className="h-[clamp(18px,2.65vh,28px)] hover:bg-slate-50">
                        <td className="truncate px-2 py-0 font-semibold text-slate-800" title={process.protocolNumber}>{process.protocolNumber}</td>
                        <td className="truncate px-2 py-0 text-slate-700" title={processLabel}>{processLabel}</td>
                        <td className="hidden truncate px-2 py-0 text-slate-700 2xl:table-cell" title={interested}>{interested}</td>
                        <td className="truncate px-2 py-0 text-slate-700" title={sectorLabel}>{sectorLabel}</td>
                        <td className="px-2 py-0">
                          <div className="flex min-w-0 items-center gap-1">
                            <span className={["inline-flex max-w-[58%] truncate rounded px-1.5 py-0 text-[10px] font-semibold leading-3", statusClass(process.status)].join(" ")}>{process.status}</span>
                            <span className={["inline-flex max-w-[42%] truncate rounded px-1.5 py-0 text-[10px] font-semibold leading-3", deadline.className].join(" ")}>{deadline.label}</span>
                          </div>
                        </td>
                        <td className="hidden truncate px-2 py-0 text-[10px] text-slate-600 2xl:table-cell" title={movementLabel}>{movementLabel}</td>
                        <td className="px-2 py-0 text-right"><Link href={"/protocolos/processos/" + process.id + "?returnTo=" + encodeURIComponent(returnTo)} className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900"><Eye className="mr-1 inline size-3" />Abrir</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto md:hidden">
              {processes.map((process) => {
                const deadline = deadlineState(process.expectedCompletionAt, requestTime);
                return (
                  <article key={process.id} className="space-y-1.5 p-3">
                    <div className="flex items-start justify-between gap-2"><span className="font-semibold text-slate-900">{process.protocolNumber}</span><span className={["rounded px-1.5 py-0.5 text-[10px] font-semibold", statusClass(process.status)].join(" ")}>{process.status}</span></div>
                    <p className="text-xs font-medium text-slate-800">{process.processType.name} · {process.subject.name}</p>
                    <p className="text-xs text-slate-600">{process.currentDepartment?.name || "Sem setor"} · {process.currentResponsibleEmployee?.name || "Sem responsável"}</p>
                    <div className="flex items-center justify-between text-[11px]"><span className={["rounded px-1.5 py-0.5 text-[10px] font-semibold", deadline.className].join(" ")}>{deadline.label}</span><Link href={"/protocolos/processos/" + process.id + "?returnTo=" + encodeURIComponent(returnTo)} className="font-semibold text-emerald-700">Abrir</Link></div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </ErpListFrame>
      <p className="flex shrink-0 items-center gap-1 px-3 text-[10px] text-slate-500"><Timer className="size-3" />Acompanhamento interno. A consulta pública permanece fora do escopo.</p>
    </div>
  );
}
