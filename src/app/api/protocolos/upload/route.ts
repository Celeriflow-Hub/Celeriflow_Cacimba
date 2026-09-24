import { NextRequest, NextResponse } from "next/server";
import { AccessError } from "@/lib/platform/tenant-context";
import { getProtocolContextForOperation } from "@/lib/protocols/access";
import { ingestProcessDocument } from "@/lib/documents/document-flow-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const context = await getProtocolContextForOperation("create");
    if (!context.user.employeeId) {
      throw new Error("Seu usuario precisa estar vinculado a um servidor para anexar documentos.");
    }

    const employee = await context.prisma.employee.findUnique({
      where: { id: context.user.employeeId },
      include: { department: true },
    });
    if (!employee?.isActive || !employee.departmentId || !employee.department?.isActive) {
      throw new Error("Seu vinculo operacional nao esta ativo ou nao possui departamento.");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const processId = String(formData.get("processId") || "");
    const title = String(formData.get("title") || "").trim();
    const documentType = String(formData.get("documentType") || "Anexo").trim() || "Anexo";
    const documentClassId = String(formData.get("documentClassId") || "");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }
    if (!processId || !title || !documentClassId) {
      return NextResponse.json({ error: "Informe o processo, o titulo e a classe documental." }, { status: 400 });
    }

    const document = await ingestProcessDocument(context, {
      processId,
      employeeId: employee.id,
      departmentId: employee.departmentId,
      title,
      documentType,
      documentClassId,
      file,
    });

    return NextResponse.json({ id: document.documentId }, { status: 201 });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno ao enviar o arquivo." },
      { status: 400 },
    );
  }
}
