import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { receiveRpsBatch } from "@/lib/tributacao/s4-service";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
function authorized(request: Request) { const token = process.env.NFSE_WEBSERVICE_TOKEN; return token ? request.headers.get("authorization") === `Bearer ${token}` : false; }
export async function POST(request: Request) {
  if (!process.env.NFSE_WEBSERVICE_TOKEN) return NextResponse.json({ error: "WebService NFS-e não configurado." }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json() as { batchNumber: string; providerTaxpayerId: string; items: { rpsNumber: string; payload: unknown }[] };
    const batch = await receiveRpsBatch(prisma, null, { ...body, source: "WEBSERVICE" });
    return NextResponse.json({ protocol: batch.protocol, status: batch.status, batchId: batch.id }, { status: 202 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Lote inválido." }, { status: 400 }); }
}
