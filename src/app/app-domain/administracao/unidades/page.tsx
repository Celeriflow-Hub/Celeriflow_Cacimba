import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import Link from "next/link";
import UnidadesClient from "./UnidadesClient";
import { MapPin } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function UnidadesPage() {
  const { prisma } = await getTenantContextForModule("ADMINISTRACAO");
  const units = await prisma.administrativeUnit.findMany({
    orderBy: { name: 'asc' },
    include: { secretariat: true }
  });

  const secretariats = await prisma.secretariat.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-col">
      <PageHeader title="Unidades Administrativas" icon={<MapPin className="size-4 shrink-0 text-indigo-600" />} action={<Link href="/administracao/unidades/novo" className="inline-flex h-7 items-center rounded bg-indigo-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800">Adicionar unidade</Link>} />
      <UnidadesClient units={units} secretariats={secretariats} />
    </PageFrame>
  );
}
