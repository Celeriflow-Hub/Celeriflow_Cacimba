import React from "react";
import Link from "next/link";
import { ArrowLeft, Save, Building, MapPin, Users } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { createSchool } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function NovaEscolaPage() {
  const { prisma } = await getTenantContextForModule("EDUCACAO");
  const [employees, realEstates] = await Promise.all([
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.realEstate.findMany({
      orderBy: { streetName: "asc" },
    }),
  ]);

  return (
    <PageFrame className="space-y-3 px-1 py-1 md:px-2">
      <PageHeader title="Nova Escola" icon={<Building className="size-4 shrink-0 text-indigo-600 dark:text-indigo-300" />} action={<Link href="/educacao/escolas" className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30"><ArrowLeft className="h-3.5 w-3.5" />Voltar</Link>} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <div className="max-w-4xl space-y-3">

        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">
          <Building className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Aviso de Integração</p>
            <p>
              Recomendamos que você já tenha cadastrado o <strong>Imóvel</strong> da escola (no módulo de Patrimônio) e o <strong>Servidor Diretor</strong> (no módulo de RH) para vinculá-los aqui. Caso não os tenha, é possível criar a escola agora e realizar a vinculação posteriormente.
            </p>
          </div>
        </div>

        <form action={createSchool} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-gray-800">
          <div className="space-y-5 p-4">
            <div className="space-y-3">
              <h2 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-800 dark:border-gray-700 dark:text-white">Informações Básicas</h2>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nome da Escola *</label>
                <input type="text" name="name" required placeholder="Ex: E.M. Machado de Assis" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Código INEP</label>
                  <input type="text" name="inepCode" placeholder="Ex: 33001234" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">CNPJ (se houver)</label>
                  <input type="text" name="cnpj" placeholder="00.000.000/0000-00" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="flex items-center gap-2 border-b border-slate-200 pb-2 text-base font-semibold text-slate-800 dark:border-gray-700 dark:text-white">
                <Users className="h-5 w-5 text-slate-500" /> Gestão e Capacidade
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Diretor(a) / Gestor(a)</label>
                  <select name="directorId" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm bg-white">
                    <option value="">Selecione o servidor...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Capacidade Total de Alunos</label>
                  <input type="number" name="capacity" defaultValue={0} min={0} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="flex items-center gap-2 border-b border-slate-200 pb-2 text-base font-semibold text-slate-800 dark:border-gray-700 dark:text-white">
                <MapPin className="h-5 w-5 text-slate-500" /> Vínculo com Patrimônio
              </h2>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Imóvel da Escola</label>
                <select name="realEstateId" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm bg-white">
                  <option value="">Selecione o imóvel correspondente...</option>
                  {realEstates.map(re => (
                    <option key={re.id} value={re.id}>
                      {re.registration ? `Matrícula: ${re.registration} - ` : ""}
                      {re.streetName ? `${re.streetName}, ${re.number || 'S/N'}` : `Imóvel ID: ${re.id}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Isso conectará a escola aos registros de patrimônio e manutenção.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors">
              <Save className="w-4 h-4" /> Salvar Escola
            </button>
          </div>
        </form>
      </div>
    </PageFrame>
  );
}
