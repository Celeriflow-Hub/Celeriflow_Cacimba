import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processPendingSiaficDeliveries } from "@/lib/siafic/dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.SIAFIC_WORKER_TOKEN?.trim();
  if (!secret) return NextResponse.json({ error: "SIAFIC worker is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Number.isInteger(requestedLimit) && requestedLimit >= 1 && requestedLimit <= 100 ? requestedLimit : undefined;
  try {
    return NextResponse.json(await processPendingSiaficDeliveries(prisma, limit));
  } catch {
    return NextResponse.json({ error: "SIAFIC worker configuration is invalid." }, { status: 503 });
  }
}
