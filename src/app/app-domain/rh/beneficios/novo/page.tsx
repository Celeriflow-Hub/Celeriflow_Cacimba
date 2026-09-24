import { BeneficioForm } from "../BeneficioForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";

export default async function NovoBeneficioPage() {
  const { prisma } = await getTenantContextForModule("RH");
  const suppliers = await prisma.supplier.findMany({ 
    include: { company: true, person: true },
    orderBy: { company: { corporateName: 'asc' } } 
  });
  
  return (
    <BeneficioForm suppliers={suppliers} />
  );
}
