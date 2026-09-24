import { notFound } from "next/navigation";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { CostCenterForm } from "../../CostCenterForm";
import { updateCostCenterAction } from "../../actions";

export default async function EditarCentroCustoPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("PATRIMONIO");
  const { id } = await params;
  const costCenter = await prisma.costCenter.findUnique({ where: { id }, select: { id: true, code: true, name: true, description: true } });
  if (!costCenter) notFound();
  return <CostCenterForm title={`Editar Centro de Custo · ${costCenter.code}`} submitLabel="Salvar alterações" action={updateCostCenterAction.bind(null, costCenter.id)} initial={costCenter} />;
}
