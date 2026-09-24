import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ControlClient } from "./ControlClient";

export default async function ControleInternoPage() {
  const { prisma } = await getTenantContextForModule("ADMINISTRACAO");
  const [plans, employees, documents] = await Promise.all([
    prisma.internalControlPlan.findMany({ include: { findings: { orderBy: { createdAt: "desc" } }, }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.employee.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.document.findMany({ where: { status: "Válido" }, select: { id: true, title: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return (
    <PageFrame className="space-y-2 [&>div]:space-y-4 [&>div]:p-0 [&>div>div:first-child]:hidden">
      <PageHeader title="Controle Interno" />
      <ControlClient plans={plans} employees={employees} documents={documents} />
    </PageFrame>
  );
}
