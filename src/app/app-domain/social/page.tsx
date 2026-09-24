import { Users, Building2, FileText, Gift } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default function SocialDashboardPage() {
  return (
    <PageFrame className="space-y-2 px-1 py-1 md:px-2">
      <PageHeader
        title="Painel da Assistência Social"
        icon={<Users className="size-4 shrink-0 text-blue-600" />}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-blue-100 p-2.5 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Famílias Cadastradas</p>
              <h3 className="text-2xl font-bold text-slate-800">42</h3>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-100 p-2.5 text-emerald-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Unidades CRAS/CREAS</p>
              <h3 className="text-2xl font-bold text-slate-800">5</h3>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-purple-100 p-2.5 text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Atendimentos no Mês</p>
              <h3 className="text-2xl font-bold text-slate-800">128</h3>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-100 p-2.5 text-amber-600">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Benefícios Concedidos</p>
              <h3 className="text-2xl font-bold text-slate-800">35</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Avisos e Ações Rápidas</h2>
        <p className="text-slate-600">
          Bem-vindo ao módulo de Gestão SUAS. Utilize o menu lateral para navegar entre Famílias, Unidades, Prontuário Eletrônico e Concessão de Benefícios.
        </p>
      </div>
    </PageFrame>
  );
}
