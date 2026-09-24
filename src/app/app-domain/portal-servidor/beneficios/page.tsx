import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { buttonVariants } from "@/components/ui/button";
import { getEmployeePortalAccess } from "@/lib/portal-servidor/access";
import type { Prisma } from "@prisma/client";
import { BadgeCheck, Search, WalletCards } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SearchParams = {
  q?: string | string[];
  page?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function resolvePage(value: string | string[] | undefined, total: number) {
  const requested = Number.parseInt(firstValue(value), 10);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, totalPages) : 1;
}

function hrefFor(page: number, q: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return "/portal-servidor/beneficios" + (query ? "?" + query : "");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(value);
}

function PortalUnavailable() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center p-3">
      <section className="max-w-md border border-slate-300 bg-white p-5 text-center shadow-sm">
        <WalletCards className="mx-auto size-6 text-slate-400" />
        <h1 className="mt-2 text-sm font-semibold text-slate-900">Benefícios indisponíveis</h1>
        <p className="mt-1 text-xs leading-5 text-slate-600">Seu acesso ainda não está vinculado a um cadastro funcional ativo.</p>
      </section>
    </div>
  );
}

export default async function BeneficiosPortalPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const access = await getEmployeePortalAccess();
  if (access.status !== "AVAILABLE") return <PortalUnavailable />;

  const params = await searchParams;
  const q = firstValue(params.q).trim().slice(0, 120);
  const { context, employee } = access;
  const benefitConfigWhere: Prisma.BenefitConfigWhereInput = q
    ? {
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { type: { contains: q, mode: "insensitive" } },
        ],
      }
    : { isActive: true };
  const where: Prisma.PayrollBenefitWhereInput = {
    employeeId: employee.id,
    status: "Ativo",
    benefitConfig: benefitConfigWhere,
  };

  const total = await context.prisma.payrollBenefit.count({ where });
  const page = resolvePage(params.page, total);
  const benefits = await context.prisma.payrollBenefit.findMany({
    where,
    select: {
      id: true,
      customValue: true,
      createdAt: true,
      benefitConfig: {
        select: {
          name: true,
          type: true,
          baseValue: true,
        },
      },
    },
    orderBy: [{ benefitConfig: { name: "asc" } }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
      <ErpPageTitle
        title="Meus benefícios"
        description="Consulta dos benefícios ativos vinculados exclusivamente ao seu cadastro funcional."
        icon={<WalletCards className="size-5 shrink-0 text-emerald-700" />}
        action={
          <Link
            href="/portal-servidor/ficha-funcional"
            className="inline-flex h-8 items-center gap-1.5 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Minha ficha
          </Link>
        }
      />

      <ErpListFrame
        toolbar={
          <form className="grid items-center gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto_auto]" role="search">
            <label className="relative block">
              <span className="sr-only">Buscar benefício ou tipo</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Benefício ou tipo"
                className="h-7 w-full rounded border border-slate-300 bg-white py-1 pl-8 pr-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              />
            </label>
            <button type="submit" className={buttonVariants({ size: "sm", className: "h-7 px-3 text-xs" })}>
              Aplicar
            </button>
            <Link
              href="/portal-servidor/beneficios"
              className="inline-flex h-7 items-center justify-center rounded border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Limpar
            </Link>
          </form>
        }
        summary={
          <p className="text-[11px] text-slate-600">
            <strong className="text-slate-900">{total}</strong> benefício(s) ativo(s) no seu cadastro funcional
          </p>
        }
        pagination={
          <ErpPagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            label="benefícios"
            previousHref={hrefFor(Math.max(1, page - 1), q)}
            nextHref={hrefFor(page + 1, q)}
          />
        }
      >
        {benefits.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center">
            <WalletCards className="size-5 text-slate-400" />
            <h2 className="mt-2 text-sm font-semibold text-slate-700">Nenhum benefício encontrado</h2>
            <p className="mt-1 max-w-md text-xs text-slate-500">Os benefícios ativos concedidos pela gestão de pessoas aparecerão nesta área.</p>
          </div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
                <thead className="h-7 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-[40%] px-3">Benefício</th>
                    <th className="w-[28%] px-3">Tipo</th>
                    <th className="w-[17%] px-3 text-right">Valor vigente</th>
                    <th className="w-[15%] px-3 text-right">Concedido em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {benefits.map((benefit) => {
                    const value = benefit.customValue ?? benefit.benefitConfig.baseValue;
                    return (
                      <tr key={benefit.id} className="h-[clamp(18px,2.65vh,28px)] hover:bg-slate-50">
                        <td className="px-3 py-0 font-semibold text-slate-800">
                          <span className="block truncate" title={benefit.benefitConfig.name}>{benefit.benefitConfig.name}</span>
                        </td>
                        <td className="px-3 py-0">
                          <span className="block truncate">{benefit.benefitConfig.type}</span>
                        </td>
                        <td className="px-3 py-0 text-right font-medium tabular-nums">{formatCurrency(value)}</td>
                        <td className="px-3 py-0 text-right text-[10px] text-slate-600">{formatDate(benefit.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto md:hidden">
              {benefits.map((benefit) => {
                const value = benefit.customValue ?? benefit.benefitConfig.baseValue;
                return (
                  <article key={benefit.id} className="space-y-1.5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-xs font-semibold text-slate-900">{benefit.benefitConfig.name}</p>
                      <BadgeCheck className="size-4 shrink-0 text-emerald-600" aria-label="Ativo" />
                    </div>
                    <p className="truncate text-[11px] text-slate-600">{benefit.benefitConfig.type}</p>
                    <p className="text-[11px] font-semibold text-slate-800">{formatCurrency(value)}</p>
                    <p className="text-[11px] text-slate-500">Concedido em {formatDate(benefit.createdAt)}</p>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </ErpListFrame>
    </div>
  );
}
