import { getTenantContextForModule } from "@/lib/platform/tenant-context";

function escapeHtml(value: unknown) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!); }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const entry = await prisma.taxRegistryEntry.findUnique({ where: { id } });
  if (!entry || entry.category !== "PEDIDO_ALTERACAO") return new Response("Protocolo não encontrado.", { status: 404 });
  const estate = await prisma.realEstate.findUnique({ where: { id: entry.entityId }, select: { municipalInsc: true, registration: true, streetName: true, number: true } });
  const data = entry.data as { campaignCode?: unknown; field?: unknown; proposedValue?: unknown };
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Protocolo de recadastramento</title><style>body{font:14px Arial;max-width:760px;margin:40px auto;color:#172033}h1{font-size:22px}.box{border:1px solid #cbd5e1;padding:16px;margin:16px 0}dt{font-weight:bold;margin-top:8px}@media print{button{display:none}}</style></head><body><h1>Protocolo de recadastramento imobiliário</h1><div class="box"><dl><dt>Protocolo</dt><dd>${escapeHtml(entry.id)}</dd><dt>Campanha</dt><dd>${escapeHtml(data.campaignCode)}</dd><dt>Imóvel</dt><dd>${escapeHtml(estate?.municipalInsc ?? estate?.registration ?? entry.entityId)}</dd><dt>Endereço</dt><dd>${escapeHtml(`${estate?.streetName ?? ""}, ${estate?.number ?? "s/n"}`)}</dd><dt>Campo solicitado</dt><dd>${escapeHtml(data.field)}</dd><dt>Valor proposto</dt><dd>${escapeHtml(data.proposedValue)}</dd><dt>Situação</dt><dd>${escapeHtml(entry.status.replaceAll("_", " "))}</dd><dt>Recebido em</dt><dd>${escapeHtml(entry.createdAt.toLocaleString("pt-BR"))}</dd></dl></div><p>Este protocolo comprova o recebimento interno da solicitação. A alteração cadastral depende de validação fiscal.</p><button onclick="window.print()">Imprimir</button></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
