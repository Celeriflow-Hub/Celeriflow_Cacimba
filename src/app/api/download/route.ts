import { NextRequest, NextResponse } from "next/server";
import { AccessError, getCurrentTenantContext, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { downloadFilename, getFile } from "@/lib/platform/blob";
import { getAttendanceContext, getOmbudsmanReadContext, ombudsmanScope, ticketScope } from "@/lib/attendance/access";
import { getProtocolContext, protocolScope } from "@/lib/protocols/access";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Faltando o parâmetro url" }, { status: 400 });
  }

  try {
    const context = await getCurrentTenantContext();
    let auditTarget: { type: string; id: string } | null = null;
    const document = await context.prisma.document.findFirst({
      where: { fileUrl: url },
      select: {
        id: true,
        ticketLinks: { select: { ticketId: true } },
        ombudsmanLinks: { select: { ombudsmanId: true } },
        processDocuments: { select: { processId: true } },
        healthStandardDocument: { select: { id: true } },
      },
    });

    if (document && (document.ticketLinks.length || document.ombudsmanLinks.length)) {
      let hasLinkedAccess = false;
      if (document.ombudsmanLinks.length) {
        const ombudsmanContext = await getOmbudsmanReadContext();
        const ombudsman = await ombudsmanContext.prisma.ombudsman.findFirst({
          where: {
            AND: [
              { id: { in: document.ombudsmanLinks.map((link) => link.ombudsmanId) } },
              ombudsmanScope(ombudsmanContext),
            ],
          },
          select: { id: true },
        });
        hasLinkedAccess = Boolean(ombudsman);
      }
      if (!hasLinkedAccess && document.ticketLinks.length) {
        const attendance = await getAttendanceContext();
        const ticket = await attendance.prisma.ticket.findFirst({
          where: { AND: [{ id: { in: document.ticketLinks.map((link) => link.ticketId) } }, ticketScope(attendance)] },
          select: { id: true },
        });
        hasLinkedAccess = Boolean(ticket);
      }
      if (!hasLinkedAccess) throw new AccessError("Sem acesso ao documento vinculado.", 403);
    } else if (document?.processDocuments.length) {
      const protocol = await getProtocolContext();
      const process = await protocol.prisma.process.findFirst({
        where: {
          AND: [
            { id: { in: document.processDocuments.map((link) => link.processId) } },
            protocolScope(protocol),
          ],
        },
        select: { id: true },
      });
      if (!process) throw new AccessError("Sem acesso ao documento vinculado.", 403);
    } else if (document?.healthStandardDocument) {
      await getTenantContextForModule("SAUDE");
      auditTarget = { type: "HEALTH_STANDARD_DOCUMENT", id: document.healthStandardDocument.id };
    } else if (document) {
      await getTenantContextForModule("DOCUMENTOS");
      auditTarget = { type: "DOCUMENT", id: document.id };
    } else {
      const envDocument = await context.prisma.envDocument.findFirst({
        where: { fileUrl: url },
        select: { id: true },
      });
      if (!envDocument) return NextResponse.json({ error: "Documento nao encontrado" }, { status: 404 });
      await getTenantContextForModule("MEIO_AMBIENTE");
      auditTarget = { type: "ENV_DOCUMENT", id: envDocument.id };
    }
    if (document) auditTarget = { type: "DOCUMENT", id: document.id };
    if (!auditTarget) throw new AccessError("Documento nao encontrado", 404);
    const response = await getFile(url);

    if (!response || !response.stream) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    const contentType = response.blob?.contentType || "application/pdf";
    const filename = downloadFilename(response.blob.pathname);
    await writeAuditEvent(context.prisma, {
      actorUsuarioId: context.user.id,
      eventType: auditEventTypes.documentDownload,
      targetType: auditTarget.type,
      targetId: auditTarget.id,
    });

    return new NextResponse(response.stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erro no download:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao baixar o documento" }, { status: 500 });
  }
}
