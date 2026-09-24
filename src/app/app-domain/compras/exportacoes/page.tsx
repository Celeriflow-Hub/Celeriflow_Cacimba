import { listProcurementExportBoard } from "@/lib/integrations/procurement-exports";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import ProcurementExportsClient from "./ProcurementExportsClient";

export const dynamic = "force-dynamic";

export default async function ProcurementExportsPage() {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const [rows, pendingInvitationCount] = await Promise.all([
    listProcurementExportBoard(prisma),
    prisma.priceQuote.count({ where: { status: "CONVITE_PENDENTE" } }),
  ]);

  return <ProcurementExportsClient rows={rows} pendingInvitationCount={pendingInvitationCount} />;
}
