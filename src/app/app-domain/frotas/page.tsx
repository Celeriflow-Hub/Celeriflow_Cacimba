import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { fleetQuerySchema, type FleetQuery } from "@/lib/frotas/contract";
import { queryFleet } from "@/lib/frotas/queries";
import { departmentWhere, fleetScope } from "@/lib/frotas/service";
import { fleetPageIssue } from "@/lib/frotas/page-errors";
import { FrotasClient } from "./FrotasClient";
import { FleetUnavailable } from "./FleetUnavailable";

export const dynamic = "force-dynamic";

async function loadFleetPage(query: FleetQuery) {
  try {
    const context = await getTenantContextForModule("FROTAS"), scope = fleetScope(context);
    const [list, selectedUnit, selectedUnits] = await Promise.all([
      queryFleet(context, query),
      query.unitId ? context.prisma.fleetUnit.findFirst({ where: { id: query.unitId, ...departmentWhere(scope) }, select: { id: true, code: true, name: true, category: true } }) : null,
      query.unitIds ? context.prisma.fleetUnit.findMany({ where: { id: { in: query.unitIds.split(",") }, ...departmentWhere(scope) }, select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }) : [],
    ]);
    const permissions = { create: canPerformModuleOperation(context.user, "FROTAS", "create"), update: canPerformModuleOperation(context.user, "FROTAS", "update"), issueReports: canPerformModuleOperation(context.user, "FROTAS", "issueReports") };
    return { ok: true as const, list, selectedUnit, selectedUnits, permissions, departmentId: scope.departmentId || "" };
  } catch (error) {
    const issue = fleetPageIssue(error);
    if (!issue) throw error;
    return { ok: false as const, issue };
  }
}

export default async function FrotasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = Object.fromEntries(Object.entries(await searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const parsed = fleetQuerySchema.safeParse(raw);
  if (!parsed.success) return <div role="alert" className="rounded border border-red-200 bg-white p-5 text-sm text-red-800">Filtros inválidos: {parsed.error.issues.map(i => i.message).join(" ")} <a href="/frotas" className="underline">Limpar filtros</a></div>;
  const query = parsed.data;
  const result = await loadFleetPage(query);
  if (!result.ok) return <FleetUnavailable issue={result.issue} />;
  return <FrotasClient key={JSON.stringify(query)} query={query} list={result.list} selectedUnit={result.selectedUnit} selectedUnits={result.selectedUnits.map(v => ({ id: v.id, label: `${v.code} · ${v.name}` }))} permissions={result.permissions} departmentId={result.departmentId} />;
}
