import Link from "next/link";
import { Plus, HeartPulse, Search } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { LicencaRowActions } from "./LicencaRowActions";
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
  ErpStatusBadge,
  type ErpStatusVariant,
} from "@/components/app-ui/erp/ErpTable";

function licencaVariant(status: string): ErpStatusVariant {
  if (status === "Ativa") return "success";
  if (status === "Encerrada") return "neutral";
  if (status === "Cancelada") return "danger";
  return "neutral";
}

export default async function LicencasPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { q, status, page } = await searchParams;

  const whereClause: Prisma.LeaveWhereInput = {};
  if (q) whereClause.employee = { name: { contains: q, mode: "insensitive" } };
  if (status && status !== "all") whereClause.status = status;

  const total = await prisma.leave.count({ where: whereClause });
  const pagination = rhPagination(page, total);
  const leaves = await prisma.leave.findMany({
    where: whereClause,
    take: pagination.take,
    skip: pagination.skip,
    orderBy: [{ startDate: "desc" }, { id: "asc" }],
    include: { employee: true },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-slate-50 p-3 dark:bg-slate-950">
      <ErpPageTitle
        title="Licenças e Afastamentos"
        icon={<HeartPulse className="size-4 text-violet-600" />}
        action={
          <Link
            href="/rh/licencas/novo"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600"
          >
            <Plus className="size-3.5" />
            Registrar Licença
          </Link>
        }
      />

      <ErpListFrame
        pagination={<RhPagination {...pagination} total={total} pathname="/rh/licencas" filters={{ q, status }} />}
        toolbar={
          <form action="/rh/licencas" method="GET" className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
              <span className="sr-only">Buscar servidor</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por servidor"
                className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <div className="flex items-center gap-1.5">
              <label htmlFor="status" className="text-[11px] font-medium text-slate-500">Status</label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Todos</option>
                <option value="Ativa">Ativa</option>
                <option value="Encerrada">Encerrada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
            <button type="submit" className="h-8 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800">
              Filtrar
            </button>
            <Link href="/rh/licencas" className="inline-flex h-8 items-center px-2.5 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">
              Limpar
            </Link>
          </form>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[30%]">Servidor</ErpTableTh>
              <ErpTableTh className="w-[20%]">Tipo</ErpTableTh>
              <ErpTableTh className="w-[28%]">Período</ErpTableTh>
              <ErpTableTh className="w-[12%]">Status</ErpTableTh>
              <ErpTableTh className="w-[10%] text-right">Ações</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {leaves.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-xs text-slate-400">
                  Nenhuma licença registrada.
                </td>
              </tr>
            ) : (
              leaves.map((leave) => (
                <ErpTableTr key={leave.id}>
                  <ErpTableTd className="font-semibold">{leave.employee?.name}</ErpTableTd>
                  <ErpTableTd>{leave.type}</ErpTableTd>
                  <ErpTableTd className="text-[10.5px]">
                    {format(new Date(leave.startDate), "dd/MM/yy")} – {format(new Date(leave.endDate), "dd/MM/yy")}
                  </ErpTableTd>
                  <ErpTableTd>
                    <ErpStatusBadge variant={licencaVariant(leave.status)}>{leave.status}</ErpStatusBadge>
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    <LicencaRowActions leave={leave} />
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
