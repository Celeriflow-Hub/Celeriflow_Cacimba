import React from "react";
import { Droplets, FileText, Wrench, Receipt, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function SaneamentoDashboard() {
  const { prisma } = await getTenantContextForModule("SANEAMENTO");
  const [totalUnits, totalReadings, totalOS] = await Promise.all([
    prisma.sanConsumerUnit.count(),
    prisma.sanMeterReading.count(),
    prisma.sanServiceOrder.count()
  ]);

  return (
    <PageFrame className="space-y-2 px-1 py-1 md:px-2">
      <PageHeader
        title="Água e Saneamento"
        icon={<Droplets className="size-4 shrink-0 text-[#0284C7]" />}
        className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-[#E0F2FE] p-2.5 text-[#0284C7] dark:bg-[#0284C7]/20">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unidades Consumidoras</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{totalUnits}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-900/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Leituras Registradas</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{totalReadings}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-900/30">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ordens de Serviço (Total)</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{totalOS}</h2>
            </div>
          </div>
        </div>
      </div>

      <h3 className="pt-1 text-sm font-semibold text-gray-900 dark:text-white">Acesso Rápido</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/saneamento/unidades" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <Droplets className="h-6 w-6 text-[#0284C7] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#0284C7] transition-colors flex items-center justify-between">
              Unidades Consumidoras
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">Cadastro de hidrômetros e locais</p>
          </div>
        </Link>

        <Link href="/saneamento/leituras" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <FileText className="h-6 w-6 text-[#0284C7] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#0284C7] transition-colors flex items-center justify-between">
              Leituras e Consumo
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">Registro de aferições mensais</p>
          </div>
        </Link>

        <Link href="/saneamento/faturas" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <Receipt className="h-6 w-6 text-[#0284C7] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#0284C7] transition-colors flex items-center justify-between">
              Faturamento
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">Gestão de contas de água</p>
          </div>
        </Link>

        <Link href="/saneamento/servicos" className="group flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <Wrench className="h-6 w-6 text-[#0284C7] mb-2" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#0284C7] transition-colors flex items-center justify-between">
              Ordens de Serviço
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1">Cortes, manutenções e reparos</p>
          </div>
        </Link>
      </div>
    </PageFrame>
  );
}
