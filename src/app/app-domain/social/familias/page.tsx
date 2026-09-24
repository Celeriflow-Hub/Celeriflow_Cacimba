import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import FamiliasClient from "./FamiliasClient";

export default async function FamiliasSociaisPage() {
  const { prisma } = await getTenantContextForModule("SOCIAL");
  const familias = await prisma.socialFamily.findMany({
    include: {
      representative: true,
      members: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const persons = await prisma.person.findMany({
    orderBy: { fullName: 'asc' }
  });

  return <FamiliasClient familiasInicial={familias} persons={persons} />;
}
