import { ContratoForm } from "../ContratoForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";

export default async function NovoContratoPage() {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const [processos, secretarias, unidadesGestoras, fornecedores] = await Promise.all([
    prisma.purchaseProcess.findMany({ include: { items: { select: { quantity: true } } }, orderBy: { number: 'desc' } }),
    prisma.secretariat.findMany({ orderBy: { name: 'asc' } }),
    prisma.budgetUnit.findMany({ orderBy: { code: 'asc' } }),
    prisma.supplier.findMany({ include: { company: true, person: true }, orderBy: { createdAt: 'desc' } })
  ]);

  return <ContratoForm processos={processos} secretarias={secretarias} unidadesGestoras={unidadesGestoras} fornecedores={fornecedores} />;
}
