import React from "react";
import { Stethoscope, HeartPulse, Users, Activity, Pill, CalendarCheck, ClipboardType, AlertTriangle, Lock } from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AccessError, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

function SaudeUnavailable({ title, message, sessionExpired }: { title: string; message: string; sessionExpired?: boolean }) {
  return (
    <PageFrame className="space-y-2 px-1 py-1 md:px-2">
      <PageHeader
        title="Saúde"
        icon={<HeartPulse className="size-4 shrink-0 text-rose-600" />}
      />
      <div role="alert" className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
        <h2 className="flex items-center gap-2 font-semibold">
          {sessionExpired ? <Lock className="size-4 shrink-0 text-amber-700" /> : <AlertTriangle className="size-4 shrink-0 text-amber-700" />}
          {title}
        </h2>
        <p>{message}</p>
        <div className="flex flex-wrap gap-2">
          <a href={sessionExpired ? "/login" : "/saude"} className="inline-flex min-h-11 items-center justify-center rounded bg-rose-700 px-4 font-medium text-white">
            {sessionExpired ? "Entrar novamente" : "Tentar novamente"}
          </a>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded border border-slate-300 bg-white px-4 font-medium text-slate-700">
            Voltar aos módulos
          </Link>
        </div>
      </div>
    </PageFrame>
  );
}

export default async function SaudeDashboardPage() {
  let totalUnits = 0;
  let totalPatients = 0;
  let todayAppointments = 0;
  let todayVaccines = 0;

  try {
    const { prisma } = await getTenantContextForModule("SAUDE");
    const [units, patients, appointments, vaccines] = await Promise.all([
      prisma.healthUnit.count({ where: { isActive: true } }),
      prisma.patient.count({ where: { status: "Ativo" } }),
      prisma.healthAppointment.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      prisma.vaccinationRecord.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ]);
    totalUnits = units;
    totalPatients = patients;
    todayAppointments = appointments;
    todayVaccines = vaccines;
  } catch (error) {
    if (error instanceof AccessError) {
      if (error.status === 401) {
        return <SaudeUnavailable sessionExpired title="Sessão expirada" message="Sua sessão expirou ou não pôde ser validada. Entre novamente para acessar a Saúde." />;
      }
      return <SaudeUnavailable title="Acesso à Saúde indisponível" message={error.message} />;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2021", "P2022"].includes(error.code)) {
      return <SaudeUnavailable title="Saúde aguarda atualização do banco" message="A estrutura necessária para a Saúde ainda não está disponível no banco desta instância. O administrador precisa concluir a atualização do banco para liberar o módulo." />;
    }
    console.error("[saude/page] unexpected error:", error);
    return (
      <SaudeUnavailable
        title="Não foi possível carregar a Saúde"
        message={error instanceof Error && error.message ? `Falha técnica (diagnóstico): ${error.message}` : "Falha técnica ao carregar os dados do módulo. Verifique os logs do servidor com esta referência de horário e tente novamente."}
      />
    );
  }

  return (
    <PageFrame className="space-y-2 px-1 py-1 md:px-2">
      <PageHeader
        title="Saúde"
        icon={<HeartPulse className="size-4 shrink-0 text-rose-600" />}
        className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-indigo-100 p-2.5 dark:bg-indigo-900/50">
            <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Unidades Ativas</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalUnits}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-blue-100 p-2.5 dark:bg-blue-900/50">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pacientes Cadastrados</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalPatients}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-emerald-100 p-2.5 dark:bg-emerald-900/50">
            <CalendarCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Agendamentos (Hoje)</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{todayAppointments}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-teal-100 p-2.5 dark:bg-teal-900/50">
            <Pill className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Vacinas Aplicadas (Hoje)</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{todayVaccines}</p>
          </div>
        </div>
      </div>

      <h2 className="pt-1 text-sm font-semibold text-gray-900 dark:text-white">Acesso Rápido</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/saude/unidades" className="group">
          <div className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <Activity className="mb-3 h-6 w-6 text-indigo-500 transition-transform group-hover:scale-110" />
            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Unidades e Equipes</h3>
            <p className="text-sm text-gray-500">Gestão de UBS, ESF e profissionais da saúde.</p>
          </div>
        </Link>

        <Link href="/saude/pacientes" className="group">
          <div className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <Users className="mb-3 h-6 w-6 text-blue-500 transition-transform group-hover:scale-110" />
            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Pacientes</h3>
            <p className="text-sm text-gray-500">Cartão SUS, prontuário unificado e histórico clínico.</p>
          </div>
        </Link>

        <Link href="/saude/atendimentos" className="group">
          <div className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <Stethoscope className="mb-3 h-6 w-6 text-emerald-500 transition-transform group-hover:scale-110" />
            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Atendimentos</h3>
            <p className="text-sm text-gray-500">Agenda, triagem (sinais vitais) e evolução clínica.</p>
          </div>
        </Link>

        <Link href="/saude/farmacia" className="group">
          <div className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="flex gap-2">
              <Pill className="mb-3 h-6 w-6 text-teal-500 transition-transform group-hover:scale-110" />
              <ClipboardType className="mb-3 h-6 w-6 text-cyan-500 transition-transform group-hover:scale-110" />
            </div>
            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Farmácia e Vacinas</h3>
            <p className="text-sm text-gray-500">Dispensação de receitas, vacinação e controle básico.</p>
          </div>
        </Link>
      </div>
    </PageFrame>
  );
}
