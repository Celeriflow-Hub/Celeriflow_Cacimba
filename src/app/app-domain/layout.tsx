import { getOptionalTenantContext } from "@/lib/platform/tenant-context";
import ClientLayout from "./ClientLayout";

export const dynamic = "force-dynamic";

export default async function AppDomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getOptionalTenantContext();

  const institution = context
    ? await context.prisma.institution.findFirst()
    : null;

  return (
    <ClientLayout
      institution={institution}
      user={context?.user ?? null}
    >
      {children}
    </ClientLayout>
  );
}
