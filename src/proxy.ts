import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/platform/rate-limit";

// ATENÇÃO: O middleware roda no Edge Runtime — NÃO importar módulos Node.js aqui.
const SESSION_COOKIE_NAME = "celeriflow_session";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp)).*)",
  ],
};

export default function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const isPublicValidation = /^\/validar-(?:documento|aviso)\/[^/]+$/.test(url.pathname);
  const isPublicProtocolPortal = url.pathname === "/portal-protocolos";
  const isPublicInstitutionalPortal = url.pathname === "/portal" || url.pathname.startsWith("/portal/");
  const isPublicTransparencyPortal = url.pathname === "/portal-transparencia";
  if (isPublicValidation || isPublicProtocolPortal || isPublicInstitutionalPortal || isPublicTransparencyPortal) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(`public-read:${ip}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }
    return NextResponse.next();
  }
  const hostname = (req.headers.get("host") || "").toLowerCase().split(":")[0];

  // Domínio que deve apontar direto para o sistema interno (dashboard)
  const systemDomain = "divinosaolourenco.celeriflow.com.br";

  const isSystemDomain = hostname === systemDomain || hostname === "app.localhost" || hostname.includes("vercel.app");

  // Se o usuário tentar acessar a pasta interna via URL, reescreve ou redireciona
  if (url.pathname.startsWith("/app-domain")) {
    const newUrl = url.pathname.replace("/app-domain", "") || "/";
    return NextResponse.redirect(new URL(newUrl, req.url));
  }

  // Se for o domínio do sistema ou Vercel app, faz o rewrite (redirecionamento invisível) para /app-domain
  if (isSystemDomain) {
    const internalPath = url.pathname === "/" ? "/login" : url.pathname;
    const newPath = `/app-domain${internalPath}`;

    // Redireciona para /login se não há sessão e não está já na página de login
    const hasSession = req.cookies.has(SESSION_COOKIE_NAME);
    if (!hasSession && internalPath !== "/login" && !internalPath.startsWith("/login")) {
      const loginUrl = new URL("/login", req.url);
      // The destination is always built from the original internal path, never
      // accepted as an absolute URL, so the login flow cannot become an open redirect.
      loginUrl.searchParams.set("returnTo", internalPath + url.search);
      return NextResponse.redirect(loginUrl);
    }

    // Reescrita invisível: domínio -> /app-domain/...
    return NextResponse.rewrite(new URL(newPath, req.url));
  }

  return NextResponse.next();
}
