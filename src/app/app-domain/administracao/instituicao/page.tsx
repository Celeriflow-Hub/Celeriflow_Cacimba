import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { InstitutionForm } from "./InstitutionForm";

export const dynamic = "force-dynamic";

export default async function InstituicaoPage() {
  const { prisma } = await getTenantContextForModule("ADMINISTRACAO");
  const institution = await prisma.institution.findFirst();

  return (
    <PageFrame className="max-w-[1440px] space-y-2">
      <PageHeader title="Dados da Prefeitura" />
      <InstitutionForm institution={institution} />
    </PageFrame>
  );
}
