import { notFound } from "next/navigation";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { WarehouseForm } from "../../WarehouseForm";
import { updateWarehouseAction } from "../../actions";

export default async function EditarAlmoxarifadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("PATRIMONIO");
  const { id } = await params;
  const warehouse = await prisma.warehouse.findUnique({ where: { id }, include: { manager: { select: { name: true } } } });
  if (!warehouse) notFound();
  const costCenters = await prisma.costCenter.findMany({
    where: warehouse.costCenterId ? { OR: [{ isActive: true }, { id: warehouse.costCenterId }] } : { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: [{ code: "asc" }, { name: "asc" }],
  });
  const action = updateWarehouseAction.bind(null, warehouse.id);

  return <WarehouseForm title={`Editar Almoxarifado · ${warehouse.name}`} submitLabel="Salvar alterações" costCenters={costCenters} action={action} initial={{ ...warehouse, managerName: warehouse.manager?.name || "" }} />;
}
