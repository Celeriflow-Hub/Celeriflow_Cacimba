import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import Link from "next/link";
import ServidoresClient from "./ServidoresClient";
import { Users } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function ServidoresPage() {
  const { prisma } = await getTenantContextForModule("ADMINISTRACAO");
  const employees = await prisma.employee.findMany({
    orderBy: { name: 'asc' },
    include: {
      role: true,
      secretariat: true,
      department: true
    }
  });

  const roles = await prisma.role.findMany({ where: { isActive: true }, select: { id: true, name: true } });
  const secretariats = await prisma.secretariat.findMany({ where: { isActive: true }, select: { id: true, name: true } });
  const departments = await prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true, secretariatId: true } });

  return (
    <PageFrame className="flex h-full min-h-0 flex-col">
      <PageHeader title="Servidores" icon={<Users className="size-4 shrink-0 text-emerald-600" />} action={<Link href="/administracao/servidores/novo" className="inline-flex h-7 items-center rounded bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800">Adicionar servidor</Link>} />
      <ServidoresClient 
        employees={employees} 
        roles={roles}
        secretariats={secretariats}
        departments={departments}
      />
    </PageFrame>
  );
}
