import Link from "next/link";
import { Plus, Clock, Search } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PontoRowActions } from "./PontoRowActions";
import { UploadCSVButton } from "./UploadCSVButton";
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

function pontoVariant(status: string): ErpStatusVariant {
  if (status === "Presente") return "success";
  if (status === "Falta") return "danger";
  if (status === "Atraso") return "warning";
  return "neutral";
}

export default async function PontoPage({ searchParams }: { searchParams: Promise<{ q?: string; month?: string; page?: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { q, month, page } = await searchParams;

  const whereClause: Prisma.AttendanceRecordWhereInput = {};
  if (q) whereClause.employee = { name: { contains: q, mode: "insensitive" } };
  if (month) {
    const [year, m] = month.split("-");
    const startDate = new Date(parseInt(year), parseInt(m) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(m), 0);
    whereClause.date = { gte: startDate, lte: endDate };
  }

  const total = await prisma.attendanceRecord.count({ where: whereClause });
  const pagination = rhPagination(page, total);
  const records = await prisma.attendanceRecord.findMany({
    where: whereClause,
    take: pagination.take,
    skip: pagination.skip,
    orderBy: [{ date: "desc" }, { id: "asc" }],
    include: { employee: true },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-slate-50 p-3 dark:bg-slate-950">
      <ErpPageTitle
        title="Registro de Ponto"
        icon={<Clock className="size-4 text-violet-600" />}
        action={
          <div className="flex items-center gap-1.5">
            <UploadCSVButton />
            <Link
              href="/rh/ponto/novo"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600"
            >
              <Plus className="size-3.5" />
              Apontamento Manual
            </Link>
          </div>
        }
      />

      <ErpListFrame
        pagination={<RhPagination {...pagination} total={total} pathname="/rh/ponto" filters={{ q, month }} />}
        toolbar={
          <form action="/rh/ponto" method="GET" className="flex flex-wrap items-center gap-2">
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
              <label htmlFor="month" className="text-[11px] font-medium text-slate-500">Mês</label>
              <input
                id="month"
                type="month"
                name="month"
                defaultValue={month}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <button type="submit" className="h-8 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800">
              Filtrar
            </button>
            <Link href="/rh/ponto" className="inline-flex h-8 items-center px-2.5 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">
              Limpar
            </Link>
          </form>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[11%]">Data</ErpTableTh>
              <ErpTableTh className="w-[24%]">Servidor</ErpTableTh>
              <ErpTableTh className="w-[14%]">Entrada / Saída</ErpTableTh>
              <ErpTableTh className="w-[10%]">Horas Dia</ErpTableTh>
              <ErpTableTh className="w-[10%]">H. Extra</ErpTableTh>
              <ErpTableTh className="w-[10%]">Banco H.</ErpTableTh>
              <ErpTableTh className="w-[11%]">Status</ErpTableTh>
              <ErpTableTh className="w-[10%] text-right">Ações</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                  Nenhum registro de ponto encontrado.
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <ErpTableTr key={rec.id}>
                  <ErpTableTd>{format(new Date(rec.date), "dd/MM/yyyy")}</ErpTableTd>
                  <ErpTableTd className="font-semibold">{rec.employee?.name}</ErpTableTd>
                  <ErpTableTd className="font-mono text-[10.5px]">
                    {rec.entryTime ? format(new Date(rec.entryTime), "HH:mm") : "—"} / {rec.exitTime ? format(new Date(rec.exitTime), "HH:mm") : "—"}
                  </ErpTableTd>
                  <ErpTableTd className="font-mono">{rec.hoursWorked.toFixed(2)}h</ErpTableTd>
                  <ErpTableTd className="font-mono text-emerald-700">{rec.extraHours ? `${rec.extraHours.toFixed(2)}h` : "—"}</ErpTableTd>
                  <ErpTableTd className="font-mono text-sky-700">{rec.bankHours ? `${rec.bankHours.toFixed(2)}h` : "—"}</ErpTableTd>
                  <ErpTableTd>
                    <ErpStatusBadge variant={pontoVariant(rec.status)}>{rec.status}</ErpStatusBadge>
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    <PontoRowActions record={rec} />
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
