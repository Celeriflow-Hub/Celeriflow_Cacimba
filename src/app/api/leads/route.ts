import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/platform/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const leadSchema = z.object({
  name: z.string().min(2),
  role: z.string().optional(),
  organization: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  moduleInterest: z.string().optional(),
  message: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "É necessário aceitar a política de privacidade",
  }),
});

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rateLimit = checkRateLimit(`lead:${ip}`);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${rateLimit.retryAfterSeconds} segundos.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json();

    const parsedData = leadSchema.parse(body);

    // Importação dinâmica do Prisma — só carrega quando a rota é chamada em runtime
    const { prisma } = await import("@/lib/prisma");

    const lead = await prisma.lead.create({
      data: {
        name: parsedData.name,
        role: parsedData.role,
        organization: parsedData.organization,
        city: parsedData.city,
        state: parsedData.state,
        email: parsedData.email,
        phone: parsedData.phone,
        moduleInterest: parsedData.moduleInterest,
        message: parsedData.message,
        consent: parsedData.consent,
      },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues },
        { status: 400 }
      );
    }
    console.error("Erro ao salvar lead:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
