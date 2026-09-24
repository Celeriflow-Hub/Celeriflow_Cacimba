import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { WarehouseForm } from "../WarehouseForm";
import { createWarehouseAction } from "../actions";

export default async function NovoAlmoxarifadoPage() {
  const { prisma } = await getTenantContextForModule("PATRIMONIO");
  const costCenters = await prisma.costCenter.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: [{ code: "asc" }, { name: "asc" }],
  });
  return <WarehouseForm title="Novo Almoxarifado" submitLabel="Salvar almoxarifado" costCenters={costCenters} action={createWarehouseAction} />;
}
