import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { receiveDesifImport } from "@/lib/tributacao/s6-service";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const token = process.env.DESIF_WEBSERVICE_TOKEN;
  if (!token) return NextResponse.json({ error: "WebService DES-IF não configurado." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${token}`) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json(); const batch = await receiveDesifImport(prisma, { usuarioId: "DESIF_WEBSERVICE" }, { ...body, signaturePolicy: body.signaturePolicy === "ASSINATURA_INTERNA" ? "ASSINATURA_INTERNA" : "NAO_CONFIGURADA" });
    return NextResponse.json({ batchId: batch.id, status: batch.status, receipt: null, nextStep: "VALIDAR_NO_CELERIFLOW" }, { status: 202 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Arquivo DES-IF inválido." }, { status: 400 }); }
}
