import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { FiscalRecordWorkspace } from "../../cadastros-fiscais/FiscalRecordWorkspace";
import { getFiscalRegistryWorkspaceData } from "../../cadastros-fiscais/data";
import { PropertyCadastralTools } from "./PropertyCadastralTools";

export const dynamic = "force-dynamic";

export default async function RealEstateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const estate = await prisma.realEstate.findUnique({ where: { id }, include: { taxpayer: { include: { person: true, company: true, economicRegistrations: true } }, valuations: { orderBy: { year: "desc" } }, taxAssessments: { include: { tax: true }, orderBy: { createdAt: "desc" } } } });
  if (!estate) notFound();
  const [workspace, estateOptions] = await Promise.all([getFiscalRegistryWorkspaceData(prisma, "REAL_ESTATE", id), prisma.realEstate.findMany({ orderBy: { municipalInsc: "asc" }, select: { id: true, municipalInsc: true, registration: true, streetName: true } })]);
  const owner = estate.taxpayer?.company?.corporateName ?? estate.taxpayer?.person?.fullName ?? "Sem titular vinculado";
  const links = estate.taxpayer ? [{ label: owner, href: `/tributacao/pessoas/${estate.taxpayer.id}`, description: "Cadastro fiscal" }, ...estate.taxpayer.economicRegistrations.map((item) => ({ label: `Inscrição ${item.municipalInsc}`, href: `/tributacao/economico/${item.id}`, description: "Unidade econômica relacionada" }))] : [];
  return <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-2.5"><ErpPageTitle title={`Ficha do imóvel ${estate.municipalInsc ?? estate.registration ?? ""}`} description={`${estate.propertyType ?? "Imóvel"} · ${estate.streetName ?? "endereço não informado"}, ${estate.number ?? "s/n"} · ${owner}`} icon={<Home className="size-4 text-emerald-600" />} action={<div className="flex items-center gap-2"><PropertyCadastralTools estateId={id} landArea={estate.landArea ?? 0} builtArea={estate.builtArea ?? 0} estates={estateOptions.map((item) => ({ id: item.id, label: item.municipalInsc ?? item.registration ?? item.streetName ?? item.id }))} /><Link href="/tributacao/imoveis" className="inline-flex h-7 items-center gap-1 rounded border bg-white px-2 text-xs font-semibold"><ArrowLeft className="size-3.5" />Voltar</Link></div>} /><FiscalRecordWorkspace entityType="REAL_ESTATE" entityId={id} entries={workspace.entries} links={links} processes={workspace.processes} documents={workspace.documents} /></div>;
}

