import { FolhaForm } from "../../FolhaForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";

export default async function EditarFolhaPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { id } = await params;
  const folha = await prisma.payroll.findUnique({
    where: { id }
  });

  if (!folha) {
    notFound();
  }

  return (
    <FolhaForm data={folha} />
  );
}
