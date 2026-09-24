import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ensureS10Defaults, listVafOverview } from "@/lib/tributacao/s10-service";
import VafClient from "./VafClient";
export const dynamic = "force-dynamic";
export default async function VafPage({ searchParams }: { searchParams?: Promise<{ year?: string }> }) {
  const { prisma, user } = await getTenantContextForModule("TRIBUTACAO");
  await ensureS10Defaults(prisma, { usuarioId: user.id });
  const sp = (await searchParams) ?? {};
  const year = sp.year ? Number(sp.year) : 2026;
  const data = await listVafOverview(prisma, Number.isFinite(year) ? year : 2026);
  return <VafClient data={JSON.parse(JSON.stringify(data))} />;
}
