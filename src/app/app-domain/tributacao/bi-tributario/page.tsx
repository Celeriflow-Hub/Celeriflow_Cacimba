import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { tributarioBi } from "@/lib/tributacao/s9-service";
import BiTributarioClient from "./BiTributarioClient";
export const dynamic = "force-dynamic";
export default async function BiTributarioPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const year = new Date().getUTCFullYear();
  const bi = await tributarioBi(prisma, { year });
  return <BiTributarioClient initial={{ bi, year }} />;
}
