import { getTenantContextForModule } from "@/lib/platform/tenant-context";
export const dynamic = "force-dynamic";
const xml = (value: unknown) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { provider: { include: { person: true, company: true } }, taker: { include: { person: true, company: true } } } });
  const fiscal = invoice ? await prisma.nfseInvoiceData.findUnique({ where: { invoiceId: invoice.id } }) : null;
  if (!invoice || !fiscal) return new Response("NFS-e não encontrada.", { status: 404 });
  const body = `<?xml version="1.0" encoding="UTF-8"?><Nfse versao="CeleriFlow-1"><Numero>${invoice.invoiceNumber}</Numero><CodigoVerificacao>${xml(invoice.verificationCode)}</CodigoVerificacao><Situacao>${xml(invoice.status)}</Situacao><Competencia>${xml(invoice.competence)}</Competencia><Prestador><Nome>${xml(invoice.provider.company?.corporateName ?? invoice.provider.person?.fullName)}</Nome></Prestador><Tomador><Nome>${xml(invoice.taker?.company?.corporateName ?? invoice.taker?.person?.fullName)}</Nome></Tomador><Servico><Descricao>${xml(fiscal.serviceDescription)}</Descricao><Valor>${invoice.serviceValueDecimal}</Valor><Deducoes>${invoice.deductionsDecimal}</Deducoes><BaseCalculo>${fiscal.taxableBaseDecimal}</BaseCalculo><Aliquota>${fiscal.rate}</Aliquota><Iss>${invoice.issValueDecimal}</Iss><Retido>${invoice.issRetained}</Retido></Servico></Nfse>`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "content-disposition": `attachment; filename="nfse-${invoice.invoiceNumber}.xml"` } });
}
