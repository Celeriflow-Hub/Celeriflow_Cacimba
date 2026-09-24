import { NextRequest, NextResponse } from "next/server";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { uploadFile } from "@/lib/platform/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await getTenantContextForModuleOperation("SAUDE", "create");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Selecione um arquivo PDF." }, { status: 400 });
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Envie um documento em formato PDF." }, { status: 400 });
    const blob = await uploadFile(file);
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível armazenar o documento." }, { status: 400 });
  }
}
