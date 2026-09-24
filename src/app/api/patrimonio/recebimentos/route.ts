import { AccessError, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { previewNextAssetPatrimonyNumber } from "@/lib/patrimonio/identifiers";

export async function GET(request: Request) {
  try {
    const context = await getTenantContextForModule("PATRIMONIO");
    const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) || "";
    const contains = { contains: q, mode: "insensitive" as const };
    const receiptItems = await context.prisma.purchaseReceiptItem.findMany({
      where: {
        purchaseReceipt: { status: "APPROVED" },
        material: { type: "PATRIMONIO" },
        ...(q ? {
          OR: [
            { material: { name: contains } },
            { material: { code: contains } },
            { purchaseReceipt: { number: contains } },
            { brand: contains },
            { model: contains },
            { serialNumber: contains },
          ],
        } : {}),
      },
      include: {
        material: { select: { code: true, name: true, description: true, type: true } },
        purchaseReceipt: { select: { number: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 100,
    });
    const options = receiptItems
      .filter((item) => item.quantityIncorporated < item.quantity)
      .slice(0, 20)
      .map((item) => ({
        id: item.id,
        label: `${item.purchaseReceipt.number} · ${item.material.code} · ${item.material.name}`,
        remaining: item.quantity - item.quantityIncorporated,
        name: item.material.name,
        description: item.material.description,
        brand: item.brand,
        model: item.model,
        serialNumber: item.serialNumber,
      }));
    const suggestedPatrimonyNumber = options.length ? await previewNextAssetPatrimonyNumber(context.prisma) : null;
    return Response.json({ options, suggestedPatrimonyNumber }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof AccessError ? error.message : "Não foi possível consultar os itens recebidos." },
      { status: error instanceof AccessError ? error.status : 500 },
    );
  }
}
