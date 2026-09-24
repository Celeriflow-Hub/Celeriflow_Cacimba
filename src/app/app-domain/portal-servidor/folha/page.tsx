import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { buttonVariants } from "@/components/ui/button";
import { getEmployeePortalAccess } from "@/lib/portal-servidor/access";
import { arePortalPayrollStatementsEnabled } from "@/lib/rh/payroll-configuration";
import type { Prisma } from "@prisma/client";
import { FileText, Search, WalletCards } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const AVAILABLE_PAYROLL_STATUSES = ["Fechada", "Paga"] as const;

type SearchParams = {
  competence?: string | string[];
  page?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function parseCompetence(value: string | string[] | undefined) {
  const raw = firstValue(value).trim();
  if (/^(0[1-9]|1[0-2])\/\d{4}$/.test(raw)) return raw;

  const isoMatch = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(raw);
  return isoMatch ? isoMatch[2] + "/" + isoMatch[1] : "";
}

function resolvePage(value: string | string[] | undefined, total: number) {
  const requested = Number.parseInt(firstValue(value), 10);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, totalPages) : 1;
}

function hrefFor(page: number, competence: string) {
  const params = new URLSearchParams();
  if (competence) params.set("competence", competence);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return "/portal-servidor/folha" + (query ? "?" + query : "");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function eventTypeLabel(type: string) {
  if (type === "Vencimento") return "Provento";
  if (type === "Desconto") return "Desconto";
  if (type === "Base") return "Base";
  return type;
}

function eventTypeClass(type: string) {
  if (type === "Vencimento") return "bg-emerald-100 text-emerald-800";
  if (type === "Desconto") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function payrollStatusClass(status: string) {
  return status === "Paga" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800";
}

function PortalUnavailable() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center p-3">
      <section className="max-w-md border border-slate-300 bg-white p-5 text-center shadow-sm">
        <WalletCards className="mx-auto size-6 text-slate-400" />
        <h1 className="mt-2 text-sm font-semibold text-slate-900">Demonstrativo de folha indisponível</h1>
        <p className="mt-1 text-xs leading-5 text-slate-600">Seu acesso ainda não está vinculado a um cadastro funcional ativo.</p>
      </section>
    </div>
  );
}

function PayrollStatementsDisabled() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center p-3">
      <section className="max-w-md border border-slate-300 bg-white p-5 text-center shadow-sm">
        <WalletCards className="mx-auto size-6 text-slate-400" />
        <h1 className="mt-2 text-sm font-semibold text-slate-900">Demonstrativos temporariamente indisponíveis</h1>
        <p className="mt-1 text-xs leading-5 text-slate-600">A disponibilização de demonstrativos foi desativada pela configuração do RH. Nenhum lançamento de folha é exibido enquanto essa regra estiver inativa.</p>
      </section>
    </div>
  );
}

export default async function FolhaPortalPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const access = await getEmployeePortalAccess();
  if (access.status !== "AVAILABLE") return <PortalUnavailable />;

  if (!await arePortalPayrollStatementsEnabled(access.context.prisma)) {
    return <PayrollStatementsDisabled />;
  }

  const params = await searchParams;
  const competence = parseCompetence(params.competence);
  const { context, employee } = access;
  const payrollWhere: Prisma.PayrollWhereInput = {
    status: { in: [...AVAILABLE_PAYROLL_STATUSES] },
  };

  if (competence) payrollWhere.competence = competence;

  const where: Prisma.PayrollItemWhereInput = {
    employeeId: employee.id,
    payroll: payrollWhere,
  };
  const total = await context.prisma.payrollItem.count({ where });
  const page = resolvePage(params.page, total);
  const items = await context.prisma.payrollItem.findMany({
    where,
    select: {
      id: true,
      value: true,
      reference: true,
      createdAt: true,
      payroll: {
        select: {
          competence: true,
          type: true,
          status: true,
          createdAt: true,
        },
      },
      event: {
        select: {
          code: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: [{ payroll: { createdAt: "desc" } }, { createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const pageTotals = items.reduce(
    (totals, item) => {
      if (item.event.type === "Vencimento") totals.proventos += item.value;
      if (item.event.type === "Desconto") totals.descontos += item.value;
      return totals;
    },
    { proventos: 0, descontos: 0 },
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
      <ErpPageTitle
        title="Demonstrativo de folha"
        description="Lançamentos de competências fechadas ou pagas vinculados exclusivamente ao seu cadastro funcional."
        icon={<WalletCards className="size-5 shrink-0 text-emerald-700" />}
        action={<Link href="/portal-servidor/ponto" className="inline-flex h-8 items-center gap-1.5 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Meu ponto</Link>}
      />

      <ErpListFrame
        toolbar={
          <form className="grid items-center gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto_auto]" role="search">
            <label className="relative block">
              <span className="sr-only">Competência</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                name="competence"
                defaultValue={competence}
                inputMode="numeric"
                pattern="(0[1-9]|1[0-2])/[0-9]{4}"
                placeholder="Competência (MM/AAAA)"
                aria-label="Filtrar por competência"
                className="h-7 w-full rounded border border-slate-300 bg-white py-1 pl-8 pr-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              />
            </label>
            <button type="submit" className={buttonVariants({ size: "sm", className: "h-7 px-3 text-xs" })}>Aplicar</button>
            <Link href="/portal-servidor/folha" className="inline-flex h-7 items-center justify-center rounded border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Limpar</Link>
          </form>
        }
        summary={
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-slate-600">
            <p><strong className="text-slate-900">{total}</strong> lançamento(s) de folha{competence ? " na competência " + competence : " no histórico disponibilizado"}</p>
            {items.length > 0 && (
              <p className="tabular-nums">
                <span className="text-slate-500">Totais dos itens exibidos nesta página:</span>{" "}
                <strong className="text-emerald-800">Proventos {formatCurrency(pageTotals.proventos)}</strong>{" · "}
                <strong className="text-amber-800">Descontos {formatCurrency(pageTotals.descontos)}</strong>
              </p>
            )}
          </div>
        }
        pagination={<ErpPagination page={page} total={total} pageSize={PAGE_SIZE} label="lançamentos de folha" previousHref={hrefFor(Math.max(1, page - 1), competence)} nextHref={hrefFor(page + 1, competence)} />}
      >
        {items.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center">
            <FileText className="size-5 text-slate-400" />
            <h2 className="mt-2 text-sm font-semibold text-slate-700">Nenhum lançamento de folha encontrado</h2>
            <p className="mt-1 max-w-md text-xs text-slate-500">A consulta exibe somente competências fechadas ou pagas vinculadas ao seu cadastro funcional.</p>
          </div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
                <thead className="h-7 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-[14%] px-3">Competência</th>
                    <th className="w-[34%] px-3">Evento</th>
                    <th className="hidden w-[16%] px-3 lg:table-cell">Referência</th>
                    <th className="w-[16%] px-3">Tipo</th>
                    <th className="w-[20%] px-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="h-[clamp(18px,2.65vh,28px)] hover:bg-slate-50">
                      <td className="px-3 py-0">
                        <span className="block truncate font-semibold text-slate-800">{item.payroll.competence}</span>
                        <span className="hidden truncate text-[10px] text-slate-500 xl:block">{item.payroll.type} · {item.payroll.status}</span>
                      </td>
                      <td className="px-3 py-0">
                        <span className="block truncate font-medium text-slate-800" title={item.event.name}>{item.event.name}</span>
                        <span className="block truncate text-[10px] text-slate-500">{item.event.code}</span>
                      </td>
                      <td className="hidden px-3 py-0 lg:table-cell"><span className="block truncate">{item.reference || "—"}</span></td>
                      <td className="px-3 py-0"><span className={["inline-flex max-w-full truncate rounded px-1.5 py-0 text-[10px] font-semibold leading-4", eventTypeClass(item.event.type)].join(" ")}>{eventTypeLabel(item.event.type)}</span></td>
                      <td className="px-3 py-0 text-right font-semibold tabular-nums text-slate-800">{formatCurrency(item.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto md:hidden">
              {items.map((item) => (
                <article key={item.id} className="space-y-1.5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900">{item.event.name}</p>
                      <p className="text-[11px] text-slate-500">{item.payroll.competence} · {item.event.code}</p>
                    </div>
                    <span className={["shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold", eventTypeClass(item.event.type)].join(" ")}>{eventTypeLabel(item.event.type)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <p className="min-w-0 truncate text-slate-500">Referência: {item.reference || "não informada"}</p>
                    <p className="shrink-0 font-semibold tabular-nums text-slate-800">{formatCurrency(item.value)}</p>
                  </div>
                  <p className="text-[10px] text-slate-500"><span className={["rounded px-1.5 py-0.5 font-semibold", payrollStatusClass(item.payroll.status)].join(" ")}>{item.payroll.status}</span> · {item.payroll.type}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </ErpListFrame>
    </div>
  );
}
