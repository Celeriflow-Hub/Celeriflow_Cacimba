import {
  BarChart3,
  Building2,
  ClipboardList,
  PackageOpen,
  Ruler,
  Wrench,
} from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const number = new Intl.NumberFormat("pt-BR");

export default async function RelatoriosPage() {
  const { prisma } = await getTenantContextForModule("OBRAS");
  const [obrasPorStatus, medicoes, servicosPorStatusETipo, materiaisEmitidos] = await Promise.all([
    prisma.obrasObra.groupBy({
      by: ["status"],
      where: { active: true },
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
    prisma.obrasMedicao.aggregate({
      where: { active: true },
      _count: { _all: true },
      _sum: { valorMedido: true },
    }),
    prisma.obrasServico.groupBy({
      by: ["status", "tipo"],
      where: { active: true },
      _count: { _all: true },
      orderBy: [{ status: "asc" }, { tipo: "asc" }],
    }),
    prisma.materialMovement.groupBy({
      by: ["unitValue"],
      where: {
        type: "Saída",
        obrasServicoId: { not: null },
      },
      _count: { _all: true },
      _sum: { quantity: true },
    }),
  ]);

  const totalObras = obrasPorStatus.reduce((total, obra) => total + obra._count._all, 0);
  const totalServicos = servicosPorStatusETipo.reduce(
    (total, servico) => total + servico._count._all,
    0,
  );
  const movimentacoesMateriais = materiaisEmitidos.reduce(
    (total, material) => total + material._count._all,
    0,
  );
  const custoMateriais = materiaisEmitidos.reduce(
    (total, material) =>
      total + (material._sum.quantity ?? 0) * (material.unitValue ?? 0),
    0,
  );

  return (
    <PageFrame className="space-y-4 px-1 py-1 md:px-2">
      <PageHeader title="Relatórios de Obras" icon={<BarChart3 className="size-4 shrink-0 text-cyan-600" />} className="dark:border-slate-700 dark:bg-slate-800 dark:[&>h1]:text-white" />
      <p className="px-1 text-sm text-slate-500 dark:text-slate-400">Acompanhamento operacional de obras, medições, serviços e materiais emitidos.</p>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo operacional">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/30">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">ativas</span>
          </div>
          <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">{number.format(totalObras)}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Obras cadastradas</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30">
              <Ruler className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">ativas</span>
          </div>
          <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">
            {number.format(medicoes._count._all)}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Medições registradas</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">ativos</span>
          </div>
          <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">{number.format(totalServicos)}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Serviços urbanos</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/30">
              <PackageOpen className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{number.format(movimentacoesMateriais)} saídas</span>
          </div>
          <p className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">{currency.format(custoMateriais)}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Custo de materiais emitidos</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-700">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <Building2 className="h-5 w-5 text-amber-600" />
              Obras por situação
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Situação</th>
                  <th className="px-6 py-3 text-right font-medium">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {obrasPorStatus.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Nenhuma obra ativa encontrada.
                    </td>
                  </tr>
                ) : (
                  obrasPorStatus.map((obra) => (
                    <tr key={obra.status} className="text-slate-700 dark:text-slate-300">
                      <td className="px-6 py-4 font-medium">{obra.status}</td>
                      <td className="px-6 py-4 text-right">{number.format(obra._count._all)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-700">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <Ruler className="h-5 w-5 text-blue-600" />
              Medições ativas
            </h2>
          </div>
          <dl className="divide-y divide-slate-100 dark:divide-slate-700">
            <div className="flex items-center justify-between px-6 py-5">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Quantidade de medições</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">{number.format(medicoes._count._all)}</dd>
            </div>
            <div className="flex items-center justify-between px-6 py-5">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Valor medido acumulado</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">
                {currency.format(medicoes._sum.valorMedido ?? 0)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-700">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            Serviços ativos por situação e tipo
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Situação</th>
                <th className="px-6 py-3 font-medium">Tipo de serviço</th>
                <th className="px-6 py-3 text-right font-medium">Quantidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {servicosPorStatusETipo.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhum serviço ativo encontrado.
                  </td>
                </tr>
              ) : (
                servicosPorStatusETipo.map((servico) => (
                  <tr key={`${servico.status}-${servico.tipo}`} className="text-slate-700 dark:text-slate-300">
                    <td className="px-6 py-4 font-medium">{servico.status}</td>
                    <td className="px-6 py-4">{servico.tipo}</td>
                    <td className="px-6 py-4 text-right">{number.format(servico._count._all)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageFrame>
  );
}
