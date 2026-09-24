import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/platform/session";
import { checkRateLimit } from "@/lib/platform/rate-limit";
import { AccessError, authorizeIdToken } from "@/lib/platform/tenant-context";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  idToken: z.string().min(100),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${rateLimit.retryAfterSeconds} segundos.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const { idToken } = bodySchema.parse(await request.json());
    const user = await authorizeIdToken(idToken);
    const sessionCookie = await createSession(idToken);
    await writeAuditEvent(prisma, {
      actorUsuarioId: user.id,
      eventType: auditEventTypes.sessionLogin,
      targetType: "SESSION",
      targetId: user.id,
    });

    const response = NextResponse.json({ ok: true });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Token de autenticacao invalido." }, { status: 400 });
    }

    console.error("Falha ao criar sessao", error);
    return NextResponse.json({ error: "Nao foi possivel iniciar a sessao." }, { status: 500 });
  }
}
