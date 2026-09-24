import Link from "next/link";
import { Plus, Gift, Search } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { BeneficioRowActions } from "./BeneficioRowActions";
import type { Prisma } from "@prisma/client";
import { RhListFrame as ErpListFrame } from "../_components/RhListFrame";
import { RhPagination } from "../_components/RhPagination";
import { rhPagination } from "@/lib/rh/list-pagination";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import {
  ErpTableContainer,
  ErpTableThead,
  ErpTableTh,
  ErpTableTr,
  ErpTableTd,
  ErpStatusBadge,
} from "@/components/app-ui/erp/ErpTable";

export default async function BeneficiosPage(
  props: { searchParams?: Promise<{ q?: string; page?: string }> }
) {
  const { prisma } = await getTenantContextForModule("RH");
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";

  const where: Prisma.BenefitConfigWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };

  const total = await prisma.benefitConfig.count({ where });
  const pagination = rhPagination(searchParams?.page, total);
  const benefits = await prisma.benefitConfig.findMany({
    where,
    take: pagination.take,
    skip: pagination.skip,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    include: {
      supplier: { include: { company: true, person: true } },
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-slate-50 p-3 dark:bg-slate-950">
      <ErpPageTitle
        title="Benefícios"
        icon={<Gift className="size-4 text-violet-600" />}
        action={
          <Link
            href="/rh/beneficios/novo"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600"
          >
            <Plus className="size-3.5" />
            Novo Benefício
          </Link>
        }
      />

      <ErpListFrame
        pagination={<RhPagination {...pagination} total={total} pathname="/rh/beneficios" filters={{ q }} />}
        toolbar={
          <form action="/rh/beneficios" method="GET" className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
              <span className="sr-only">Buscar benefício</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nome do benefício"
                className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <button type="submit" className="h-8 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800">
              Filtrar
            </button>
            <Link href="/rh/beneficios" className="inline-flex h-8 items-center px-2.5 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">
              Limpar
            </Link>
          </form>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[28%]">Nome</ErpTableTh>
              <ErpTableTh className="w-[16%]">Tipo</ErpTableTh>
              <ErpTableTh className="w-[28%]">Fornecedor</ErpTableTh>
              <ErpTableTh className="w-[14%]">Valor Base</ErpTableTh>
              <ErpTableTh className="w-[8%]">Status</ErpTableTh>
              <ErpTableTh className="w-[6%] text-right">Ações</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {benefits.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  Nenhum benefício master cadastrado.
                </td>
              </tr>
            ) : (
              benefits.map((ben) => (
                <ErpTableTr key={ben.id}>
                  <ErpTableTd className="font-semibold">{ben.name}</ErpTableTd>
                  <ErpTableTd>{ben.type}</ErpTableTd>
                  <ErpTableTd>
                    {ben.supplier?.company?.corporateName || ben.supplier?.person?.fullName || "—"}
                  </ErpTableTd>
                  <ErpTableTd className="font-mono">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ben.baseValue)}
                  </ErpTableTd>
                  <ErpTableTd>
                    <ErpStatusBadge variant={ben.isActive ? "success" : "neutral"}>
                      {ben.isActive ? "Ativo" : "Inativo"}
                    </ErpStatusBadge>
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    <BeneficioRowActions beneficio={ben} />
                  </ErpTableTd>
                </ErpTableTr>
              ))
            )}
          </tbody>
        </ErpTableContainer>
      </ErpListFrame>
    </div>
  );
}
