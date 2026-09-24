import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { renderCdaPdf } from "@/lib/tributacao/cda-pdf";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const [debt, institution] = await Promise.all([
    prisma.activeDebt.findUnique({ where: { id }, include: { taxpayer: { include: { person: true, company: true } } } }),
    prisma.institution.findFirst({ select: { name: true, legalName: true, cnpj: true, city: true, state: true } }),
  ]);
  if (!debt?.cdaNumber) return new Response("CDA não encontrada.", { status: 404 });
  const versions = await prisma.taxCdaVersion.findMany({ where: { activeDebtId: debt.id }, orderBy: { versionNumber: "asc" } });
  const events = await prisma.taxActiveDebtEvent.findMany({ where: { activeDebtId: debt.id }, orderBy: { createdAt: "desc" }, take: 30 });
  const latest = versions[versions.length - 1];
  const pdf = await renderCdaPdf({
    cdaNumber: debt.cdaNumber,
    version: latest?.versionNumber ?? 1,
    annotation: latest?.annotation,
    signatureStatus: latest?.signatureStatus ?? "NAO_ASSINADA",
    debt: { origin: debt.originDebtType, year: debt.year, original: String(debt.originalValueDecimal ?? debt.originalValue), updated: String(debt.updatedValueDecimal ?? debt.updatedValue), status: debt.status, enrolledAt: debt.createdAt.toLocaleDateString("pt-BR") },
    taxpayer: { name: debt.taxpayer.company?.corporateName ?? debt.taxpayer.person?.fullName ?? "-", document: debt.taxpayer.company?.cnpj ?? debt.taxpayer.person?.cpf ?? "-" },
    institution: { name: institution?.name ?? institution?.legalName ?? "Município não configurado", cnpj: institution?.cnpj ?? "", city: institution?.city ?? "", state: institution?.state ?? "" },
    versions: versions.map((v) => ({ version: v.versionNumber, createdAt: v.createdAt.toLocaleString("pt-BR"), signature: v.signatureStatus })),
    events: events.map((e) => `${e.eventType}: ${e.description}`),
  });
  return new Response(pdf as BodyInit, { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="cda-${debt.cdaNumber}.pdf"`, "cache-control": "private, no-store" } });
}
