import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";

function csv(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

export async function GET(request: Request) {
  const context = await getTenantContextForModuleOperation("TRIBUTACAO", "issueReports");
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const where = q ? { OR: [
    { municipalInsc: { contains: q, mode: "insensitive" as const } },
    { person: { is: { fullName: { contains: q, mode: "insensitive" as const } } } },
    { company: { is: { corporateName: { contains: q, mode: "insensitive" as const } } } },
  ] } : {};
  const rows = await context.prisma.taxpayer.findMany({ where, include: { person: true, company: true, _count: { select: { realEstates: true, economicRegistrations: true } } }, orderBy: { updatedAt: "desc" } });
  const body = ["Tipo;Nome;Documento;Inscricao;Situacao;Empresas;Imoveis", ...rows.map((row) => [row.taxpayerType, row.company?.corporateName ?? row.person?.fullName, row.company?.cnpj ?? row.person?.cpf, row.municipalInsc, row.status, row._count.economicRegistrations, row._count.realEstates].map(csv).join(";"))].join("\r\n");
  await writeAuditEvent(context.prisma, { actorUsuarioId: context.user.id, eventType: auditEventTypes.reportIssued, targetType: "TAXPAYER_REPORT", targetId: `filter:${q || "all"}` });
  return new Response(`\uFEFF${body}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=cadastro-fiscal.csv" } });
}
