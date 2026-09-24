import Link from "next/link";
import { Plus, Users, Search } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ServidorRowActions } from "./ServidorRowActions";
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

export default async function ServidoresPage(
  props: {
    searchParams?: Promise<{
      q?: string;
      status?: string;
      departmentId?: string;
      page?: string;
    }>;
  }
) {
  const { prisma } = await getTenantContextForModule("RH");
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";
  const status = searchParams?.status || "";
  const departmentId = searchParams?.departmentId || "";

  const where: Prisma.EmployeeWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { cpf: { contains: q } },
      { registration: { contains: q } },
    ];
  }
  if (status && status !== "all") {
    where.isActive = status === "active";
  }
  if (departmentId && departmentId !== "all") {
    where.departmentId = departmentId;
  }

  const total = await prisma.employee.count({ where });
  const pagination = rhPagination(searchParams?.page, total);
  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({
      where,
      take: pagination.take,
      skip: pagination.skip,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: { role: true, department: true },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-slate-50 p-3 dark:bg-slate-950">
      <ErpPageTitle
        title="Servidores"
        icon={<Users className="size-4 text-violet-600" />}
        action={
          <Link
            href="/rh/servidores/novo"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600"
          >
            <Plus className="size-3.5" />
            Novo Servidor
          </Link>
        }
      />

      <ErpListFrame
        pagination={<RhPagination {...pagination} total={total} pathname="/rh/servidores" filters={{ q, status, departmentId }} />}
        toolbar={
          <form action="/rh/servidores" method="GET" className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
              <span className="sr-only">Buscar servidor</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nome, CPF ou matrícula"
                className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <div className="flex items-center gap-1.5">
              <label htmlFor="status" className="text-[11px] font-medium text-slate-500">Status</label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="departmentId" className="text-[11px] font-medium text-slate-500">Setor</label>
              <select
                id="departmentId"
                name="departmentId"
                defaultValue={departmentId}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Todos</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="h-8 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-700"
            >
              Filtrar
            </button>
            <Link
              href="/rh/servidores"
              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700"
            >
              Limpar
            </Link>
          </form>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[32%]">Nome</ErpTableTh>
              <ErpTableTh className="w-[18%]">CPF / Matrícula</ErpTableTh>
              <ErpTableTh className="w-[20%]">Cargo</ErpTableTh>
              <ErpTableTh className="w-[16%]">Setor</ErpTableTh>
              <ErpTableTh className="w-[8%]">Status</ErpTableTh>
              <ErpTableTh className="w-[6%] text-right">Ações</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  Nenhum servidor encontrado.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <ErpTableTr key={emp.id}>
                  <ErpTableTd className="font-semibold">{emp.name}</ErpTableTd>
                  <ErpTableTd className="font-mono text-[10.5px]">
                    {emp.cpf || "Sem CPF"} · {emp.registration || "Sem Matrícula"}
                  </ErpTableTd>
                  <ErpTableTd>{emp.role?.name || "—"}</ErpTableTd>
                  <ErpTableTd>{emp.department?.name || "—"}</ErpTableTd>
                  <ErpTableTd>
                    <ErpStatusBadge variant={emp.isActive ? "success" : "neutral"}>
                      {emp.isActive ? "Ativo" : "Inativo"}
                    </ErpStatusBadge>
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    <ServidorRowActions employee={emp} />
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
