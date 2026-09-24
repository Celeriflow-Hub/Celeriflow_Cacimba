import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { FiscalRecordWorkspace } from "../../cadastros-fiscais/FiscalRecordWorkspace";
import { getFiscalRegistryWorkspaceData } from "../../cadastros-fiscais/data";

export const dynamic = "force-dynamic";

export default async function EconomicRegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const registration = await prisma.economicRegistration.findUnique({ where: { id }, include: { taxpayer: { include: { person: true, company: { include: { representatives: { include: { representative: true } }, addresses: true, documents: true } }, realEstates: true } }, taxAssessments: { include: { tax: true }, orderBy: { createdAt: "desc" } }, licenses: true } });
  if (!registration) notFound();
  const workspace = await getFiscalRegistryWorkspaceData(prisma, "ECONOMIC_REGISTRATION", id);
  const name = registration.taxpayer.company?.corporateName ?? registration.taxpayer.person?.fullName ?? "Unidade econômica";
  const links = [{ label: name, href: `/tributacao/pessoas/${registration.taxpayer.id}`, description: "Cadastro fiscal" }, ...registration.taxpayer.realEstates.map((item) => ({ label: `Imóvel ${item.municipalInsc ?? item.registration ?? item.id}`, href: `/tributacao/imoveis/${item.id}`, description: item.status }))];
  return <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-2.5"><ErpPageTitle title={`Ficha da empresa · ${name}`} description={`Inscrição ${registration.municipalInsc} · ${registration.primaryCnae ?? "CNAE não informado"} · ${registration.taxRegime ?? "regime não informado"}`} icon={<Building2 className="size-4 text-emerald-600" />} action={<Link href="/tributacao/economico" className="inline-flex h-7 items-center gap-1 rounded border bg-white px-2 text-xs font-semibold"><ArrowLeft className="size-3.5" />Voltar</Link>} /><FiscalRecordWorkspace entityType="ECONOMIC_REGISTRATION" entityId={id} entries={workspace.entries} links={links} processes={workspace.processes} documents={workspace.documents} /></div>;
}

