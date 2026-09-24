import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { AccessError, getCurrentTenantContext } from "@/lib/platform/tenant-context";

const bodySchema = z.object({
  eventType: z.enum([
    auditEventTypes.pageView,
    auditEventTypes.uiInteraction,
    auditEventTypes.formSubmit,
  ]),
  targetType: z.enum(["PAGE", "CONTROL", "FORM"]),
  // Targets are restricted to route and control identifiers, never form values or query strings.
  targetId: z.string().min(1).max(400).regex(/^\/[A-Za-z0-9_./|-]*$/),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const event = bodySchema.parse(await request.json());
    const context = await getCurrentTenantContext();

    await writeAuditEvent(context.prisma, {
      actorUsuarioId: context.user.id,
      ...event,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Evento de auditoria inválido." }, { status: 400 });
    }

    console.error("Falha ao registrar interação de uso", error);
    return NextResponse.json({ error: "Não foi possível registrar a interação." }, { status: 500 });
  }
}
