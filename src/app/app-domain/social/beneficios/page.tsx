import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import BeneficiosClient from "./BeneficiosClient";

export default async function BeneficiosSociaisPage() {
  const { prisma } = await getTenantContextForModule("SOCIAL");
  const beneficios = await prisma.socialBenefit.findMany({
    orderBy: { name: 'asc' }
  });

  const programas = await prisma.socialProgram.findMany({
    orderBy: { name: 'asc' }
  });

  const secretariats = await prisma.secretariat.findMany({
    orderBy: { name: 'asc' }
  });

  const appropriations = await prisma.budgetAppropriation.findMany({
    include: { expenseNature: true },
    orderBy: { code: 'asc' }
  });

  return <BeneficiosClient 
    beneficiosInicial={beneficios} 
    programasInicial={programas} 
    secretariats={secretariats} 
    appropriations={appropriations} 
  />;
}
