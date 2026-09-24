import { NextRequest, NextResponse } from "next/server";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { uploadFile } from "@/lib/platform/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await getTenantContextForModuleOperation("DOCUMENTOS", "create");
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const blob = await uploadFile(file);
    return NextResponse.json({ url: blob.url, pathname: blob.pathname }, { status: 201 });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Erro no upload:", error);
    return NextResponse.json({ error: "Erro interno ao enviar o arquivo." }, { status: 500 });
  }
}
