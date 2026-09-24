import { Prisma } from "@prisma/client";
import { Coins, FileText, Landmark, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

type ConselhosFundosPageProps = {
  searchParams?: Promise<{ q?: string; tipo?: string }>;
};

export default async function ConselhosFundosPage({
  searchParams,
}: ConselhosFundosPageProps) {
  const { prisma } = await getTenantContextForModule("CULTURA");
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const tipo = params?.tipo === "conselhos" || params?.tipo === "fundos" ? params.tipo : "";
  const showConselhos = tipo !== "fundos";
  const showFundos = tipo !== "conselhos";

  const conselhoWhere: Prisma.CulturaConselhoWhereInput = q
    ? {
        OR: [
          { nome: { contains: q, mode: "insensitive" } },
          { tipo: { contains: q, mode: "insensitive" } },
          { status: { contains: q, mode: "insensitive" } },
          { responsavel: { contains: q, mode: "insensitive" } },
          {
            documentos: {
              some: {
                OR: [
                  { purpose: { contains: q, mode: "insensitive" } },
                  { document: { title: { contains: q, mode: "insensitive" } } },
                ],
              },
            },
          },
        ],
      }
    : {};

  const fundoWhere: Prisma.CulturaFundoWhereInput = q
    ? {
        OR: [
          { nome: { contains: q, mode: "insensitive" } },
          { status: { contains: q, mode: "insensitive" } },
          { descricao: { contains: q, mode: "insensitive" } },
          {
            appropriation: {
              is: { code: { contains: q, mode: "insensitive" } },
            },
          },
        ],
      }
    : {};

  const [conselhos, fundos] = await Promise.all([
    showConselhos
      ? prisma.culturaConselho.findMany({
          where: conselhoWhere,
          include: {
            documentos: {
              orderBy: { createdAt: "desc" },
              include: {
                document: {
                  select: { title: true, documentType: true },
                },
              },
            },
          },
          orderBy: { nome: "asc" },
        })
      : Promise.resolve([]),
    showFundos
      ? prisma.culturaFundo.findMany({
          where: fundoWhere,
          include: {
            appropriation: {
              select: {
                code: true,
                financialYear: { select: { year: true } },
                budgetUnit: { select: { code: true, name: true } },
                resourceSource: { select: { code: true, name: true } },
                expenseNature: { select: { code: true, name: true } },
              },
            },
          },
          orderBy: { nome: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const hasFilters = Boolean(q || tipo);

  return (
    <PageFrame className="space-y-3 px-1 py-1 md:px-2">
      <PageHeader title="Conselhos e Fundos" icon={<ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" />} className="dark:border-slate-700 dark:bg-slate-800 dark:[&>h1]:text-white" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Conselhos vinculados, seus documentos e referências orçamentárias dos fundos culturais.</p>

      <form className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-end">
        <div className="w-full sm:flex-1">
          <label htmlFor="q" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Conselho, fundo, responsável ou referência"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-slate-900 outline-none transition-colors focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
        <div className="w-full sm:w-52">
          <label htmlFor="tipo" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Exibir
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={tipo}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            <option value="">Conselhos e fundos</option>
            <option value="conselhos">Somente conselhos</option>
            <option value="fundos">Somente fundos</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 font-medium text-white transition-colors hover:bg-rose-700 sm:flex-none"
          >
            <Search className="h-4 w-4" />
            Filtrar
          </button>
          {hasFilters && (
            <Link
              href="/cultura/conselhos-fundos"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Limpar
            </Link>
          )}
        </div>
      </form>

      <div className="grid gap-3 xl:grid-cols-2">
        {showConselhos && (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/50 md:px-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-900 dark:text-white">Conselhos</h2>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">{conselhos.length}</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {conselhos.length === 0 ? (
                <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
                  Nenhum conselho encontrado com os filtros atuais.
                </p>
              ) : (
                conselhos.map((conselho) => (
                  <article key={conselho.id} className="p-4 md:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{conselho.nome}</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {conselho.tipo} {conselho.responsavel ? `· Responsável: ${conselho.responsavel}` : ""}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {conselho.active ? conselho.status : "Inativo"}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <FileText className="h-3.5 w-3.5" />
                        Documentos vinculados
                      </p>
                      {conselho.documentos.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum documento vinculado.</p>
                      ) : (
                        <ul className="space-y-2">
                          {conselho.documentos.map(({ id, purpose, document }) => (
                            <li key={id} className="text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-medium">{document.title}</span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {` · ${document.documentType} · ${purpose}`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {showFundos && (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/50 md:px-6">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-600" />
                <h2 className="font-semibold text-slate-900 dark:text-white">Fundos</h2>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">{fundos.length}</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {fundos.length === 0 ? (
                <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
                  Nenhum fundo encontrado com os filtros atuais.
                </p>
              ) : (
                fundos.map((fundo) => (
                  <article key={fundo.id} className="p-4 md:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{fundo.nome}</h3>
                        {fundo.descricao && (
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{fundo.descricao}</p>
                        )}
                      </div>
                      <span className="w-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {fundo.active ? fundo.status : "Inativo"}
                      </span>
                    </div>

                    {fundo.appropriation ? (
                      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-700/40">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          <Landmark className="h-3.5 w-3.5" />
                          Referência orçamentária
                        </p>
                        <dl className="grid gap-2 text-slate-700 dark:text-slate-200 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs text-slate-500 dark:text-slate-400">Dotação / exercício</dt>
                            <dd className="font-medium">
                              {fundo.appropriation.code} · {fundo.appropriation.financialYear.year}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500 dark:text-slate-400">Unidade orçamentária</dt>
                            <dd className="font-medium">
                              {fundo.appropriation.budgetUnit.code} · {fundo.appropriation.budgetUnit.name}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500 dark:text-slate-400">Fonte de recurso</dt>
                            <dd className="font-medium">
                              {fundo.appropriation.resourceSource.code} · {fundo.appropriation.resourceSource.name}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500 dark:text-slate-400">Natureza da despesa</dt>
                            <dd className="font-medium">
                              {fundo.appropriation.expenseNature.code} · {fundo.appropriation.expenseNature.name}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                        Sem dotação orçamentária vinculada.
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </PageFrame>
  );
}
