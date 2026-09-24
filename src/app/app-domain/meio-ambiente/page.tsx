import React from "react";
import { 
  Leaf, 
  Building2, 
  FileText, 
  AlertTriangle, 
  Search, 
  ShieldCheck, 
  Sprout, 
  Trash2, 
  GraduationCap, 
  FolderOpen 
} from "lucide-react";
import Link from "next/link";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function MeioAmbienteDashboardPage() {
  const { prisma } = await getTenantContextForModule("MEIO_AMBIENTE");
  const [
    totalEnterprises,
    totalLicenses,
    totalComplaints,
    totalGreenAreas
  ] = await Promise.all([
    prisma.envEnterprise.count(),
    prisma.envLicense.count(),
    prisma.envComplaint.count(),
    prisma.envGreenArea.count()
  ]);

  return (
    <PageFrame className="space-y-2 px-1 py-1 md:px-2">
      <PageHeader
        title="Painel do Meio Ambiente"
        icon={<Leaf className="size-4 shrink-0 animate-pulse text-green-600" />}
        className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-green-50 p-2.5 dark:bg-green-950/30">
            <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Empreendimentos</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-0.5">{totalEnterprises}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-blue-50 p-2.5 dark:bg-blue-950/30">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Licenças Ativas</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-0.5">{totalLicenses}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-red-50 p-2.5 dark:bg-red-950/30">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Denúncias</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-0.5">{totalComplaints}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-md bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
            <Sprout className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Áreas Preservadas</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-0.5">{totalGreenAreas}</p>
          </div>
        </div>
      </div>

      <h2 className="pt-1 text-sm font-semibold text-gray-900 dark:text-white">Módulos do Meio Ambiente</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/meio-ambiente/empreendimentos" className="group">
          <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-green-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-900/50">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-green-50 transition-transform group-hover:scale-110 dark:bg-green-950/30">
                <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 transition-colors group-hover:text-green-600 dark:text-white">Empreendimentos</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Cadastro de indústrias, comércios e postos sujeitos a regulação ambiental.</p>
            </div>
            <span className="text-xs font-bold text-green-600 dark:text-green-400 mt-4 group-hover:underline inline-flex items-center gap-1">Acessar Empreendimentos &rarr;</span>
          </div>
        </Link>

        <Link href="/meio-ambiente/licenciamento" className="group">
          <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-green-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-900/50">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 transition-transform group-hover:scale-110 dark:bg-blue-950/30">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white">Licenciamento</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Emissão e controle de licenças prévias (LP), instalação (LI), operação (LO) e condicionantes.</p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-4 group-hover:underline inline-flex items-center gap-1">Gerenciar Licenças &rarr;</span>
          </div>
        </Link>

        <Link href="/meio-ambiente/solicitacoes" className="group">
          <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-green-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-900/50">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 transition-transform group-hover:scale-110 dark:bg-emerald-950/30">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-white">Solicitações & Podas</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Pedidos de autorização de poda, supressão de árvores e plantios urbanos.</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-4 group-hover:underline inline-flex items-center gap-1">Ver Solicitações &rarr;</span>
          </div>
        </Link>

        <Link href="/meio-ambiente/denuncias" className="group">
          <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-green-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-900/50">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-red-50 transition-transform group-hover:scale-110 dark:bg-red-950/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 transition-colors group-hover:text-red-600 dark:text-white">Denúncias Ambientais</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Registro de queimadas, descarte irregular de entulho e poluição industrial.</p>
            </div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 mt-4 group-hover:underline inline-flex items-center gap-1">Ver Denúncias &rarr;</span>
          </div>
        </Link>

        <Link href="/meio-ambiente/fiscalizacao" className="group">
          <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-green-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-900/50">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-purple-50 transition-transform group-hover:scale-110 dark:bg-purple-950/30">
                <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 transition-colors group-hover:text-purple-600 dark:text-white">Fiscalização e Vistorias</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Emissão de notificações, autos de infração, agendamento de vistorias e multas.</p>
            </div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-4 group-hover:underline inline-flex items-center gap-1">Ver Fiscalização &rarr;</span>
          </div>
        </Link>

        <Link href="/meio-ambiente/areas-verdes" className="group">
          <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-green-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-900/50">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-teal-50 transition-transform group-hover:scale-110 dark:bg-teal-950/30">
                <Sprout className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 transition-colors group-hover:text-teal-600 dark:text-white">Áreas Verdes & Parques</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Controle de áreas protegidas, parques municipais, APPs e arborização urbana.</p>
            </div>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-4 group-hover:underline inline-flex items-center gap-1">Ver Áreas Verdes &rarr;</span>
          </div>
        </Link>

        <Link href="/meio-ambiente/residuos" className="group">
          <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-green-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-900/50">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-orange-50 transition-transform group-hover:scale-110 dark:bg-orange-950/30">
                <Trash2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white">Controle de Resíduos</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Gestão da geração de resíduos industriais e construtivos, com destinação final.</p>
            </div>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 mt-4 group-hover:underline inline-flex items-center gap-1">Ver Resíduos &rarr;</span>
          </div>
        </Link>

        <Link href="/meio-ambiente/educacao" className="group">
          <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-green-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-900/50">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 transition-transform group-hover:scale-110 dark:bg-amber-950/30">
                <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 transition-colors group-hover:text-amber-600 dark:text-white">Educação Ambiental</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Planejamento e acompanhamento de programas, palestras e campanhas ecológicas.</p>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-4 group-hover:underline inline-flex items-center gap-1">Ver Campanhas &rarr;</span>
          </div>
        </Link>

        <Link href="/meio-ambiente/documentos" className="group">
          <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-green-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-900/50">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 transition-transform group-hover:scale-110 dark:bg-slate-900/50">
                <FolderOpen className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 transition-colors group-hover:text-slate-600 dark:text-white">Documentos Oficiais</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Central de laudos, RIMAs, alvarás ambientais e termos de compromisso.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-4 group-hover:underline inline-flex items-center gap-1">Ver Documentos &rarr;</span>
          </div>
        </Link>
      </div>
    </PageFrame>
  );
}
