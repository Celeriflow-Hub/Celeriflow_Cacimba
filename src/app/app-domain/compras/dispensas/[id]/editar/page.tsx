import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { DispensaForm } from "../../DispensaForm";
import { notFound } from "next/navigation";

export default async function EditarDispensaPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const resolvedParams = await params;
  const [dispensa, processos, fornecedores] = await Promise.all([
    prisma.directContracting.findUnique({
      where: { id: resolvedParams.id }
    }),
    prisma.purchaseProcess.findMany({ orderBy: { number: 'desc' } }),
    prisma.supplier.findMany({ include: { company: true }, orderBy: { company: { corporateName: 'asc' } } })
  ]);

  if (!dispensa) {
    notFound();
  }

  return <DispensaForm data={dispensa} processos={processos} fornecedores={fornecedores} />;
}
