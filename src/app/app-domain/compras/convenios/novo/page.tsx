import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ConvenioForm } from "../ConvenioForm";

export default async function NovoConvenioPage() {
  await getTenantContextForModule("COMPRAS");
  return <ConvenioForm />;
}
