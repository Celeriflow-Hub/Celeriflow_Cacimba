import React from "react";
import Link from "next/link";
import { ArrowLeft, Save, Utensils, AlertCircle } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { createSchoolMeal } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function NovaMerendaPage() {
  const { prisma } = await getTenantContextForModule("EDUCACAO");
  const schools = await prisma.school.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <PageFrame className="space-y-3 px-1 py-1 md:px-2">
      <PageHeader title="Registrar Alimentação Servida" icon={<Utensils className="size-4 shrink-0 text-orange-600 dark:text-orange-300" />} action={<Link href="/educacao/merenda" className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30"><ArrowLeft className="h-3.5 w-3.5" />Voltar</Link>} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <div className="max-w-4xl space-y-3">

        <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Integração Financeira Automática</p>
            <p>
              Ao registrar o Custo Total da merenda, um registro de <strong>Empenho</strong> será automaticamente criado no Módulo Financeiro vinculado à Secretaria de Educação.
            </p>
          </div>
        </div>

        <form action={createSchoolMeal} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-gray-800">
          <div className="space-y-5 p-4">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Escola *</label>
              <select name="schoolId" required className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm bg-white">
                <option value="">Selecione a escola...</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Cardápio Servido *</label>
              <input type="text" name="menu" required placeholder="Ex: Arroz, feijão, frango e salada" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Quantidade de Alunos Servidos *</label>
                <input type="number" name="servedQuantity" required min="1" placeholder="Ex: 120" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Custo Total (R$)</label>
                <input type="number" step="0.01" name="totalCost" min="0" placeholder="0.00" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm" />
                <p className="text-xs text-slate-500">Irá gerar empenho financeiro.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Observações (Opcional)</label>
              <textarea name="notes" rows={3} placeholder="Alguma observação sobre a refeição?" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm resize-none"></textarea>
            </div>

          </div>
          <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <button type="submit" className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors">
              <Save className="w-4 h-4" /> Registrar Refeição
            </button>
          </div>
        </form>
      </div>
    </PageFrame>
  );
}
