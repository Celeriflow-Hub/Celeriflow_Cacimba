import { Users, Building2, Home, FileBox, ShieldAlert, AlertTriangle, Lock } from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { AccessError, getTenantContextForModule } from "@/lib/platform/tenant-context";

export const dynamic = "force-dynamic";

function CadastrosUnavailable({ title, message, sessionExpired }: { title: string; message: string; sessionExpired?: boolean }) {
  return (
    <PageFrame className="space-y-2">
      <PageHeader title="Painel de Cadastros" icon={<Users className="size-4 shrink-0 text-indigo-600" />} />
      <div role="alert" className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
        <h2 className="flex items-center gap-2 font-semibold">
          {sessionExpired ? <Lock className="size-4 shrink-0 text-amber-700" /> : <AlertTriangle className="size-4 shrink-0 text-amber-700" />}
          {title}
        </h2>
        <p>{message}</p>
        <div className="flex flex-wrap gap-2">
          <a href={sessionExpired ? "/login" : "/cadastros"} className="inline-flex min-h-11 items-center justify-center rounded bg-indigo-700 px-4 font-medium text-white">
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

export default async function CadastrosDashboardPage() {
  let personsCount = 0;
  let companiesCount = 0;
  let suppliersCount = 0;
  let realEstatesCount = 0;

  try {
    const { prisma } = await getTenantContextForModule("CADASTROS");
    const [persons, companies, suppliers, realEstates] = await Promise.all([
      prisma.person.count(),
      prisma.company.count(),
      prisma.supplier.count(),
      prisma.realEstate.count(),
    ]);
    personsCount = persons;
    companiesCount = companies;
    suppliersCount = suppliers;
    realEstatesCount = realEstates;
  } catch (error) {
    if (error instanceof AccessError) {
      if (error.status === 401) {
        return <CadastrosUnavailable sessionExpired title="Sessão expirada" message="Sua sessão expirou ou não pôde ser validada. Entre novamente para acessar Cadastros." />;
      }
      return <CadastrosUnavailable title="Acesso a Cadastros indisponível" message={error.message} />;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2021", "P2022"].includes(error.code)) {
      return <CadastrosUnavailable title="Cadastros aguarda atualização do banco" message="A estrutura necessária para Cadastros ainda não está disponível no banco desta instância. O administrador precisa concluir a atualização do banco para liberar o módulo." />;
    }
    console.error("[cadastros/page] unexpected error:", error);
    return (
      <CadastrosUnavailable
        title="Não foi possível carregar Cadastros"
        message={error instanceof Error && error.message ? `Falha técnica (diagnóstico): ${error.message}` : "Falha técnica ao carregar os dados do módulo. Verifique os logs do servidor com esta referência de horário e tente novamente."}
      />
    );
  }

  const stats = [
    { title: "Pessoas Físicas", value: personsCount.toString(), icon: Users, href: "/cadastros/pessoas-fisicas", color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Pessoas Jurídicas", value: companiesCount.toString(), icon: Building2, href: "/cadastros/pessoas-juridicas", color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Fornecedores", value: suppliersCount.toString(), icon: Users, href: "/cadastros/fornecedores", color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Imóveis", value: realEstatesCount.toString(), icon: Home, href: "/cadastros/imoveis", color: "text-sky-600", bg: "bg-sky-100" },
  ];

  return (
    <PageFrame className="space-y-2">
      <PageHeader title="Painel de Cadastros" icon={<Users className="size-4 shrink-0 text-indigo-600" />} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href} className="block group">
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="mt-0.5 text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`flex size-9 items-center justify-center rounded-md ${stat.bg} transition-transform duration-200 group-hover:scale-105`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-slate-100">
              <FileBox className="size-4 text-slate-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Acesso Rápido</h3>
          </div>
          <div className="space-y-2">
            <Link href="/cadastros/pessoas-fisicas/novo" className="flex items-center justify-between rounded-md border border-slate-100 p-2 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
              <span className="text-sm font-medium text-slate-700">Nova Pessoa Física</span>
              <span className="text-xs text-indigo-600 font-semibold bg-indigo-100 px-2 py-1 rounded-md">Adicionar</span>
            </Link>
            <Link href="/cadastros/pessoas-juridicas/novo" className="flex items-center justify-between rounded-md border border-slate-100 p-2 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors">
              <span className="text-sm font-medium text-slate-700">Nova Empresa / Entidade</span>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-2 py-1 rounded-md">Adicionar</span>
            </Link>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-rose-100">
              <ShieldAlert className="size-4 text-rose-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Qualidade dos Dados</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-end justify-between border-b border-slate-100 pb-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Cadastros Duplicados Suspeitos</p>
                <p className="text-xs text-slate-500 mt-0.5">Pessoas com mesmo CPF ou nome similar</p>
              </div>
              <span className="text-lg font-bold text-slate-800">0</span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm font-medium text-slate-700">Documentos Vencidos</p>
                <p className="text-xs text-slate-500 mt-0.5">Certidões e alvarás expirados</p>
              </div>
              <span className="text-lg font-bold text-slate-800">0</span>
            </div>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
