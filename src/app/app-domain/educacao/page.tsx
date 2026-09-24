import React from "react";
import { GraduationCap, School, Users, BookOpen, ClipboardCheck, Bus, Utensils, Calendar, BookOpenCheck, FileCheck2, UserRoundCheck, NotebookTabs, FileText, ClipboardList, UsersRound, BookMarked, Landmark, Gamepad2, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function EducacaoDashboardPage() {
  const { prisma } = await getTenantContextForModule("EDUCACAO");
  const [
    totalSchools,
    totalStudents,
    totalClasses,
    totalDiaries
  ] = await Promise.all([
    prisma.school.count(),
    prisma.student.count({ where: { status: "Ativo" } }),
    prisma.schoolClass.count({ where: { status: "Aberta" } }),
    prisma.classDiary.count({ where: { status: "Aberto" } }),
  ]);

  return (
    <PageFrame className="space-y-2 px-1 py-1 md:px-2">
      <PageHeader
        title="Educação"
        icon={<GraduationCap className="size-4 shrink-0 text-blue-600" />}
        className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white"
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-indigo-100 p-2.5 dark:bg-indigo-900/50">
            <School className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Escolas</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalSchools}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-blue-100 p-2.5 dark:bg-blue-900/50">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Alunos Ativos</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalStudents}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-emerald-100 p-2.5 dark:bg-emerald-900/50">
            <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Turmas Abertas</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalClasses}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-amber-100 p-2.5 dark:bg-amber-900/50">
            <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Diários Pendentes</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalDiaries}</p>
          </div>
        </div>
      </div>

      <h2 className="pt-1 text-sm font-semibold text-gray-900 dark:text-white">Acesso Rápido</h2>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/educacao/biblioteca" className="group"><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><BookMarked className="mb-3 h-6 w-6 text-indigo-500" /><h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Biblioteca escolar</h3><p className="text-sm text-gray-500">Acervo, exemplares, empréstimos e reservas.</p></div></Link>
        <Link href="/educacao/recursos-escolares" className="group"><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><Landmark className="mb-3 h-6 w-6 text-emerald-500" /><h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Recursos escolares</h3><p className="text-sm text-gray-500">Contas, repasses, movimentos e planos de aplicação.</p></div></Link>
        <Link href="/educacao/portal-interativo" className="group"><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><Gamepad2 className="mb-3 h-6 w-6 text-violet-500" /><h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Portal interativo</h3><p className="text-sm text-gray-500">Catálogo, atividades, jogos e resultados.</p></div></Link>
        <Link href="/educacao/suporte" className="group"><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><LifeBuoy className="mb-3 h-6 w-6 text-blue-500" /><h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Suporte da Educação</h3><p className="text-sm text-gray-500">Solicitações, histórico e acompanhamento.</p></div></Link>
        <Link href="/educacao/professor" className="group"><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><NotebookTabs className="mb-3 h-6 w-6 text-emerald-500" /><h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Área do professor</h3><p className="text-sm text-gray-500">Diário, avaliações, planejamento e atividades.</p></div></Link>
        <Link href="/educacao/documentos" className="group"><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><FileText className="mb-3 h-6 w-6 text-blue-500" /><h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Documentos acadêmicos</h3><p className="text-sm text-gray-500">Boletins, históricos e declarações em PDF.</p></div></Link>
        <Link href="/educacao/pre-matricula" className="group"><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><ClipboardList className="mb-3 h-6 w-6 text-indigo-500" /><h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Pré-matrícula</h3><p className="text-sm text-gray-500">Processos, classificação, vagas e alocação.</p></div></Link>
        <Link href="/educacao/portal-responsavel" className="group"><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><UsersRound className="mb-3 h-6 w-6 text-violet-500" /><h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Portal do responsável</h3><p className="text-sm text-gray-500">Frequência, resultados, materiais e atividades.</p></div></Link>
        <Link href="/educacao/academico" className="group">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><BookOpenCheck className="mb-3 h-6 w-6 text-indigo-500" /><h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Núcleo acadêmico</h3><p className="text-sm text-gray-500">Períodos, matrizes, turmas, docentes e horários.</p></div>
        </Link>
        <Link href="/educacao/alunos" className="group">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><UserRoundCheck className="mb-3 h-6 w-6 text-blue-500" /><h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Alunos e responsáveis</h3><p className="text-sm text-gray-500">Vínculos com o cadastro único de pessoas.</p></div>
        </Link>
        <Link href="/educacao/educacenso" className="group">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><FileCheck2 className="mb-3 h-6 w-6 text-emerald-500" /><h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Educacenso</h3><p className="text-sm text-gray-500">Importação, críticas e arquivos para conferência.</p></div>
        </Link>
        <Link href="/educacao/escolas" className="group">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <School className="mb-3 h-6 w-6 text-indigo-500 transition-transform group-hover:scale-110" />
            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Gestão de Escolas</h3>
            <p className="text-sm text-gray-500">Unidades de ensino, infraestrutura e capacidade.</p>
          </div>
        </Link>

        <Link href="/educacao/matriculas" className="group">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <Users className="mb-3 h-6 w-6 text-blue-500 transition-transform group-hover:scale-110" />
            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Matrículas e Turmas</h3>
            <p className="text-sm text-gray-500">Gestão de turmas, vagas e alunos matriculados.</p>
          </div>
        </Link>

        <Link href="/educacao/professores" className="group">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <BookOpen className="mb-3 h-6 w-6 text-emerald-500 transition-transform group-hover:scale-110" />
            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Professores</h3>
            <p className="text-sm text-gray-500">Corpo docente e alocação por turmas e escolas.</p>
          </div>
        </Link>

        <Link href="/educacao/calendario" className="group">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <Calendar className="mb-3 h-6 w-6 text-purple-500 transition-transform group-hover:scale-110" />
            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Calendário Escolar</h3>
            <p className="text-sm text-gray-500">Dias letivos, feriados, recessos e eventos.</p>
          </div>
        </Link>

        <Link href="/educacao/merenda" className="group">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <Utensils className="mb-3 h-6 w-6 text-orange-500 transition-transform group-hover:scale-110" />
            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Merenda Escolar</h3>
            <p className="text-sm text-gray-500">Controle de alimentação escolar e cardápios.</p>
          </div>
        </Link>

        <Link href="/educacao/transporte" className="group">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <Bus className="mb-3 h-6 w-6 text-amber-500 transition-transform group-hover:scale-110" />
            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">Transporte Escolar</h3>
            <p className="text-sm text-gray-500">Rotas e veículos para transporte de alunos.</p>
          </div>
        </Link>
      </div>
    </PageFrame>
  );
}
