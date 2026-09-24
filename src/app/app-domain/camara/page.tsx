import React from "react";
import { Landmark, Users, Calendar, FileText, ArrowRight, Scale, Mic, Globe } from "lucide-react";
import Link from "next/link";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function CamaraDashboard() {
  const { prisma } = await getTenantContextForModule("CAMARA");
  const [
    totalVereadores, 
    totalSessoes, 
    totalProposicoes,
    totalComissoes,
    totalLeis,
    totalAudiencias
  ] = await Promise.all([
    prisma.camVereador.count({ where: { status: "Em Exercício" } }),
    prisma.camSessao.count(),
    prisma.camProposicao.count(),
    prisma.camComissao.count({ where: { status: "Ativa" } }),
    prisma.camLei.count(),
    prisma.camAudiencia.count()
  ]);

  return (
    <PageFrame className="space-y-2 px-1 py-1 md:px-2">
      <PageHeader
        title="Câmara Municipal"
        icon={<Landmark className="size-4 shrink-0 text-[#9333EA]" />}
        className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white"
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-purple-100 p-2.5 text-[#9333EA] dark:bg-purple-900/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vereadores Ativos</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{totalVereadores}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-indigo-100 p-2.5 text-indigo-600 dark:bg-indigo-900/30">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sessões Realizadas</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{totalSessoes}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-fuchsia-100 p-2.5 text-fuchsia-600 dark:bg-fuchsia-900/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Proposições Registradas</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{totalProposicoes}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-900/30">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Leis Promulgadas</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{totalLeis}</h2>
            </div>
          </div>
        </div>
      </div>

      <h3 className="pt-1 text-sm font-semibold text-gray-900 dark:text-white">Módulos do Sistema Legislativo</h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        
        <Link href="/camara/legislaturas" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <Landmark className="h-6 w-6 text-[#9333EA] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#9333EA] transition-colors flex items-center justify-between">
              Legislaturas
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">Gestão de mandatos</p>
          </div>
        </Link>

        <Link href="/camara/vereadores" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <Users className="h-6 w-6 text-[#9333EA] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#9333EA] transition-colors flex items-center justify-between">
              Vereadores
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">Parlamentares, Mesa e Gabinetes</p>
          </div>
        </Link>

        <Link href="/camara/comissoes" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <Users className="h-6 w-6 text-[#9333EA] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#9333EA] transition-colors flex items-center justify-between">
              Comissões
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">{totalComissoes} comissões ativas</p>
          </div>
        </Link>

        <Link href="/camara/sessoes" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <Calendar className="h-6 w-6 text-[#9333EA] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#9333EA] transition-colors flex items-center justify-between">
              Sessões Plenárias
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">Sessões, Pautas e Atas</p>
          </div>
        </Link>

        <Link href="/camara/proposicoes" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <FileText className="h-6 w-6 text-[#9333EA] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#9333EA] transition-colors flex items-center justify-between">
              Proposições
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">Projetos, Votações e Pareceres</p>
          </div>
        </Link>

        <Link href="/camara/leis" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <Scale className="h-6 w-6 text-[#9333EA] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#9333EA] transition-colors flex items-center justify-between">
              Leis e Atos
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">Legislação municipal e decretos</p>
          </div>
        </Link>

        <Link href="/camara/audiencias" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <Mic className="h-6 w-6 text-[#9333EA] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#9333EA] transition-colors flex items-center justify-between">
              Audiências Públicas
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">{totalAudiencias} eventos de participação</p>
          </div>
        </Link>

        <Link href="/camara/portal" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <Globe className="h-6 w-6 text-[#9333EA] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#9333EA] transition-colors flex items-center justify-between">
              Portal Legislativo
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">Transparência e publicação</p>
          </div>
        </Link>

      </div>
    </PageFrame>
  );
}
