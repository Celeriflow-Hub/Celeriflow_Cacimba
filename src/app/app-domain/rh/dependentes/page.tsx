import Link from "next/link";
import { UserPlus, Search } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { DependenteRowActions } from "./DependenteRowActions";
import { format } from "date-fns";
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
} from "@/components/app-ui/erp/ErpTable";

export default async function DependentesPage(
  props: { searchParams?: Promise<{ q?: string; page?: string }> }
) {
  const { prisma } = await getTenantContextForModule("RH");
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";

  const where: Prisma.DependentWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { employee: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const total = await prisma.dependent.count({ where });
  const pagination = rhPagination(searchParams?.page, total);
  const dependents = await prisma.dependent.findMany({
    where,
    take: pagination.take,
    skip: pagination.skip,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    include: { employee: true },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-slate-50 p-3 dark:bg-slate-950">
      <ErpPageTitle
        title="Dependentes"
        icon={<UserPlus className="size-4 text-violet-600" />}
        description="Cadastro na ficha do Servidor"
      />

      <ErpListFrame
        pagination={<RhPagination {...pagination} total={total} pathname="/rh/dependentes" filters={{ q }} />}
        toolbar={
          <form action="/rh/dependentes" method="GET" className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
              <span className="sr-only">Buscar dependente</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por dependente ou servidor"
                className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <button type="submit" className="h-8 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800">
              Filtrar
            </button>
            <Link href="/rh/dependentes" className="inline-flex h-8 items-center px-2.5 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">
              Limpar
            </Link>
          </form>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[32%]">Servidor Responsável</ErpTableTh>
              <ErpTableTh className="w-[30%]">Dependente</ErpTableTh>
              <ErpTableTh className="w-[18%]">Parentesco</ErpTableTh>
              <ErpTableTh className="w-[12%]">Nascimento</ErpTableTh>
              <ErpTableTh className="w-[8%] text-right">Ações</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {dependents.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-xs text-slate-400">
                  Nenhum dependente encontrado.
                </td>
              </tr>
            ) : (
              dependents.map((dep) => (
                <ErpTableTr key={dep.id}>
                  <ErpTableTd className="font-semibold">{dep.employee?.name}</ErpTableTd>
                  <ErpTableTd>{dep.name}</ErpTableTd>
                  <ErpTableTd>{dep.relationship}</ErpTableTd>
                  <ErpTableTd>
                    {dep.birthDate ? format(new Date(dep.birthDate), "dd/MM/yyyy") : "—"}
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    <DependenteRowActions dependent={dep} />
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
