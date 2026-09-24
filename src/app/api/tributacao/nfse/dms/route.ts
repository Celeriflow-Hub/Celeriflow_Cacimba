import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDmsDeclaration } from "@/lib/tributacao/s4-service";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const token = process.env.NFSE_WEBSERVICE_TOKEN;
  if (!token) return NextResponse.json({ error: "WebService NFS-e não configurado." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${token}`) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try { const body = await request.json(); const dms = await createDmsDeclaration(prisma, null, { ...body, channel: "WEBSERVICE" }); return NextResponse.json({ protocol: dms.protocol, status: dms.status }, { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Declaração inválida." }, { status: 400 }); }
}
