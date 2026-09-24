import { AccessError, canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";

export async function GET(request: Request) {
  try {
    const context = await getTenantContextForModule("PATRIMONIO"), p = new URL(request.url).searchParams;
    const contains = { contains: (p.get("q") || "").slice(0, 100), mode: "insensitive" as const };
    let options: { id: string; label: string }[] = [];
    if (p.get("kind") === "departments") {
      options = (await context.prisma.department.findMany({ where: { isActive: true, name: contains }, select: { id: true, name: true }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 20 })).map(v => ({ id: v.id, label: v.name }));
    } else if (p.get("kind") === "employees" || p.get("kind") === "patrimonioEmployees") {
      if (!canPerformModuleOperation(context.user, "PATRIMONIO", "update") && !canPerformModuleOperation(context.user, "PATRIMONIO", "create")) throw new AccessError("Seu perfil não permite consultar responsáveis para transferência.", 403);
      const departmentId = (p.get("departmentId") || "").slice(0, 100);
      const specialistsOnly = p.get("kind") === "patrimonioEmployees";
      options = (await context.prisma.employee.findMany({
        where: {
          isActive: true,
          name: contains,
          ...(departmentId ? { departmentId } : {}),
          ...(specialistsOnly ? {
            OR: [
              { department: { is: { OR: [{ name: { contains: "patrimônio", mode: "insensitive" } }, { name: { contains: "almoxarifado", mode: "insensitive" } }] } } },
              { managedWarehouses: { some: {} } },
              { responsibleAssets: { some: {} } },
            ],
          } : {}),
        },
        select: { id: true, name: true, department: { select: { name: true } } },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        take: 20,
      })).map(v => ({ id: v.id, label: v.department ? `${v.name} · ${v.department.name}` : v.name }));
    } else if (p.get("kind") === "assets") {
      if (!canPerformModuleOperation(context.user, "PATRIMONIO", "update")) throw new AccessError("Seu perfil não permite consultar bens patrimoniais.", 403);
      const q = (p.get("q") || "").slice(0, 100);
      options = (await context.prisma.asset.findMany({
        where: {
          status: { notIn: ["Baixado", "Inativo"] },
          ...(q ? { OR: [{ patrimonyNumber: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}),
        },
        select: { id: true, patrimonyNumber: true, name: true },
        orderBy: [{ patrimonyNumber: "asc" }, { id: "asc" }],
        take: 20,
      })).map(v => ({ id: v.id, label: `${v.patrimonyNumber} · ${v.name}` }));
    }
    return Response.json({ options }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return Response.json({ error: error instanceof AccessError ? error.message : "Não foi possível consultar os registros." }, { status: error instanceof AccessError ? error.status : 500 }); }
}
