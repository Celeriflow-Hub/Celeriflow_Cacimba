import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import Link from "next/link";
import DepartamentosClient from "./DepartamentosClient";
import { Network } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function DepartamentosPage() {
  const { prisma } = await getTenantContextForModule("ADMINISTRACAO");
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { secretariat: true }
  });

  const secretariats = await prisma.secretariat.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-col">
      <PageHeader title="Departamentos" icon={<Network className="size-4 shrink-0 text-amber-600" />} action={<Link href="/administracao/departamentos/novo" className="inline-flex h-7 items-center rounded bg-amber-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-800">Adicionar departamento</Link>} />
      <DepartamentosClient departments={departments} secretariats={secretariats} />
    </PageFrame>
  );
}
