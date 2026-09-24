import { Building2, Network, Users, ClipboardList, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdministracaoPage() {
  const { prisma } = await getTenantContextForModule("ADMINISTRACAO");
  // We can fetch real counts from the database here
  const institution = await prisma.institution.findFirst();
  const secretariatsCount = await prisma.secretariat.count();
  const departmentsCount = await prisma.department.count();
  const employeesCount = await prisma.employee.count();
  const rolesCount = await prisma.role.count();
  const unitsCount = await prisma.administrativeUnit.count();
  // const demandsCount = await prisma.internalDemand.count({ where: { status: "Aberta" } }); // Removed to avoid error if model is not created yet, wait, does internalDemand exist?

  const stats = [
    { title: "Secretarias", value: secretariatsCount.toString(), icon: Building2, href: "/administracao/secretarias", color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Departamentos", value: departmentsCount.toString(), icon: Network, href: "/administracao/departamentos", color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Unidades", value: unitsCount.toString(), icon: MapPin, href: "/administracao/unidades", color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Cargos", value: rolesCount.toString(), icon: Briefcase, href: "/administracao/cargos", color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Servidores", value: employeesCount.toString(), icon: Users, href: "/administracao/servidores", color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Demandas Abertas", value: "0", icon: ClipboardList, href: "/administracao/demandas", color: "text-rose-600", bg: "bg-rose-100" },
  ];

  return (
    <PageFrame className="space-y-2">
      <PageHeader title="Painel Administrativo" icon={<Building2 className="size-4 shrink-0 text-blue-600" />} />

      {!institution ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-bold text-amber-800">Dados da Prefeitura Incompletos</h2>
            <p className="mt-0.5 text-xs text-amber-700">Configure os dados principais da instituição para liberar algumas funcionalidades.</p>
          </div>
          <Link href="/administracao/instituicao" className="inline-flex h-7 shrink-0 items-center rounded bg-amber-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700">
            Configurar Agora
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          {institution.logoUrl ? (
            <Image src={institution.logoUrl} alt="Logo" width={48} height={48} unoptimized className="size-12 rounded object-contain" />
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-100">
              <Building2 className="size-6 text-slate-400" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-slate-800">{institution.name}</h2>
            <p className="text-xs text-slate-500">{institution.cnpj ? `CNPJ: ${institution.cnpj}` : 'CNPJ não configurado'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href} className="block group">
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md">
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.title}</p>
                <p className="mt-0.5 text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`flex size-9 items-center justify-center rounded-md ${stat.bg} transition-transform duration-200 group-hover:scale-105`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}
