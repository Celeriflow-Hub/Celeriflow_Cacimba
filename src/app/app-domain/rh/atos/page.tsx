import Link from "next/link";
import { Plus, FileSignature, Search, ExternalLink } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { AtoRowActions } from "./AtoRowActions";
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

function atoVariant(type: string): ErpStatusVariant {
  if (type === "Admissão") return "success";
  if (type === "Demissão") return "danger";
  if (type === "Promoção") return "info";
  if (type === "Advertência") return "warning";
  return "neutral";
}

export default async function AtosPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; page?: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { q, type, page } = await searchParams;

  const whereClause: Prisma.PersonnelActWhereInput = {};
  if (q) whereClause.employee = { name: { contains: q, mode: "insensitive" } };
  if (type && type !== "all") whereClause.type = type;

  const total = await prisma.personnelAct.count({ where: whereClause });
  const pagination = rhPagination(page, total);
  const acts = await prisma.personnelAct.findMany({
    where: whereClause,
    take: pagination.take,
    skip: pagination.skip,
    orderBy: [{ date: "desc" }, { id: "asc" }],
    include: { employee: true },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-slate-50 p-3 dark:bg-slate-950">
      <ErpPageTitle
        title="Atos de Pessoal"
        icon={<FileSignature className="size-4 text-violet-600" />}
        action={
          <Link
            href="/rh/atos/novo"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600"
          >
            <Plus className="size-3.5" />
            Registrar Ato
          </Link>
        }
      />

      <ErpListFrame
        pagination={<RhPagination {...pagination} total={total} pathname="/rh/atos" filters={{ q, type }} />}
        toolbar={
          <form action="/rh/atos" method="GET" className="flex flex-wrap items-center gap-2">
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
              <label htmlFor="type" className="text-[11px] font-medium text-slate-500">Tipo</label>
              <select
                id="type"
                name="type"
                defaultValue={type}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Todos</option>
                <option value="Admissão">Admissão</option>
                <option value="Demissão">Demissão</option>
                <option value="Promoção">Promoção</option>
                <option value="Transferência">Transferência</option>
                <option value="Advertência">Advertência</option>
              </select>
            </div>
            <button type="submit" className="h-8 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800">
              Filtrar
            </button>
            <Link href="/rh/atos" className="inline-flex h-8 items-center px-2.5 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">
              Limpar
            </Link>
          </form>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[12%]">Data</ErpTableTh>
              <ErpTableTh className="w-[28%]">Servidor</ErpTableTh>
              <ErpTableTh className="w-[16%]">Tipo</ErpTableTh>
              <ErpTableTh className="w-[22%]">Nº do Ato</ErpTableTh>
              <ErpTableTh className="w-[8%]">Doc</ErpTableTh>
              <ErpTableTh className="w-[14%] text-right">Ações</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {acts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  Nenhum ato de pessoal registrado.
                </td>
              </tr>
            ) : (
              acts.map((ato) => (
                <ErpTableTr key={ato.id}>
                  <ErpTableTd>{format(new Date(ato.date), "dd/MM/yyyy")}</ErpTableTd>
                  <ErpTableTd className="font-semibold">{ato.employee?.name}</ErpTableTd>
                  <ErpTableTd>
                    <ErpStatusBadge variant={atoVariant(ato.type)}>{ato.type}</ErpStatusBadge>
                  </ErpTableTd>
                  <ErpTableTd>{ato.actNumber || "—"}</ErpTableTd>
                  <ErpTableTd>
                    {ato.documentUrl ? (
                      <a href={ato.documentUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-800">
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    <AtoRowActions ato={ato} />
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
