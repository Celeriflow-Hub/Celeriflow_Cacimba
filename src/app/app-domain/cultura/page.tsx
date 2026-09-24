import React from "react";
import { 
  Palette, 
  Users, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Trophy, 
  ShieldAlert, 
  FileText 
} from "lucide-react";
import Link from "next/link";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function CulturaDashboard() {
  const { prisma } = await getTenantContextForModule("CULTURA");
  const [totalAgentes, totalEspacos, totalEventos] = await Promise.all([
    prisma.culturaAgente.count({ where: { active: true } }),
    prisma.culturaEspaco.count({ where: { active: true } }),
    prisma.culturaEvento.count({ where: { active: true } })
  ]);

  return (
    <PageFrame className="space-y-2 px-1 py-1 md:px-2">
      <PageHeader
        title="Cultura, Esporte e Lazer"
        icon={<Palette className="size-4 shrink-0 text-pink-600" />}
        className="dark:border-slate-700 dark:bg-slate-800 dark:[&>h1]:text-white"
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-pink-100 p-2.5 text-pink-600 dark:bg-pink-900/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Agentes Culturais</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{totalAgentes}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-indigo-100 p-2.5 text-indigo-600 dark:bg-indigo-900/30">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Espaços Cadastrados</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{totalEspacos}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-rose-100 p-2.5 text-rose-600 dark:bg-rose-900/30">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Eventos Programados</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{totalEventos}</h2>
            </div>
          </div>
        </div>
      </div>

      <h3 className="pt-1 text-sm font-semibold text-slate-900 dark:text-white">Acesso Rápido</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/cultura/gestao-cultural" className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-pink-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 dark:bg-pink-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <Palette className="h-7 w-7 text-pink-600 mb-3 relative z-10" />
          <div className="relative z-10">
            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-pink-600 transition-colors flex items-center justify-between">
              Gestão Cultural
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-slate-500 mt-1">Agentes, espaços e patrimônio</p>
          </div>
        </Link>

        <Link href="/cultura/fomento-projetos" className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <Sparkles className="h-7 w-7 text-indigo-600 mb-3 relative z-10" />
          <div className="relative z-10">
            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors flex items-center justify-between">
              Fomento e Projetos
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-slate-500 mt-1">Editais, incentivos e projetos</p>
          </div>
        </Link>

        <Link href="/cultura/esporte-lazer" className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-rose-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 dark:bg-rose-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <Trophy className="h-7 w-7 text-rose-600 mb-3 relative z-10" />
          <div className="relative z-10">
            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors flex items-center justify-between">
              Esporte e Lazer
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-slate-500 mt-1">Escolinhas, campeonatos e atletas</p>
          </div>
        </Link>

        <Link href="/cultura/espacos-reservas" className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <MapPin className="h-7 w-7 text-emerald-600 mb-3 relative z-10" />
          <div className="relative z-10">
            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors flex items-center justify-between">
              Espaços e Reservas
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-slate-500 mt-1">Reservas de quadras e teatros</p>
          </div>
        </Link>
        
        <Link href="/cultura/eventos" className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-amber-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <Calendar className="h-7 w-7 text-amber-600 mb-3 relative z-10" />
          <div className="relative z-10">
            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors flex items-center justify-between">
              Eventos
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-slate-500 mt-1">Agenda de eventos e festividades</p>
          </div>
        </Link>

        <Link href="/cultura/conselhos-fundos" className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-red-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <ShieldAlert className="h-7 w-7 text-red-600 mb-3 relative z-10" />
          <div className="relative z-10">
            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-red-600 transition-colors flex items-center justify-between">
              Conselhos e Fundos
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-slate-500 mt-1">Órgãos deliberativos e recursos</p>
          </div>
        </Link>

        <Link href="/cultura/documentos" className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <FileText className="h-7 w-7 text-slate-600 mb-3 relative z-10" />
          <div className="relative z-10">
            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-slate-800 transition-colors flex items-center justify-between">
              Documentos
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-xs text-slate-500 mt-1">Planos, resoluções e regulamentos</p>
          </div>
        </Link>
      </div>
    </PageFrame>
  );
}
