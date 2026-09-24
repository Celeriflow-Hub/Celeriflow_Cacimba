import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import type { Prisma } from "@prisma/client";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { StockOperationsClient } from "./StockOperationsClient";
import { MaterialCatalogTable } from "./MaterialCatalogTable";
import {
  clampPatrimonioListPage,
  patrimonioListHref,
  parsePatrimonioListPage,
  PATRIMONIO_LIST_PAGE_SIZE,
} from "../listing";

type MaterialView = "catalogo" | "movimentar";
type MaterialStatus = "" | "ATIVO" | "INATIVO" | "SEM_ESTOQUE";
type MaterialOrder = "code-asc" | "code-desc" | "name-asc" | "name-desc" | "description-asc" | "description-desc";
type SearchParams = { q?: string; page?: string; view?: string; type?: string; category?: string; status?: string; warehouse?: string; order?: string };

function getView(value?: string): MaterialView {
  return value === "movimentar" ? "movimentar" : "catalogo";
}

function getStatus(value?: string): MaterialStatus {
  return value === "ATIVO" || value === "INATIVO" || value === "SEM_ESTOQUE" ? value : "";
}

function getOrder(value?: string): MaterialOrder {
  return value === "code-desc" || value === "name-asc" || value === "name-desc" || value === "description-asc" || value === "description-desc" ? value : "code-asc";
}

function materialOrder(order: MaterialOrder): Prisma.MaterialOrderByWithRelationInput {
  if (order === "code-desc") return { code: "desc" };
  if (order === "name-asc") return { name: "asc" };
  if (order === "name-desc") return { name: "desc" };
  if (order === "description-asc") return { description: "asc" };
  if (order === "description-desc") return { description: "desc" };
  return { code: "asc" };
}

function currencyCost(stocks: { quantity: number; unitCost: number | null }[]) {
  const priced = stocks.filter((stock) => stock.unitCost !== null);
  if (!priced.length) return null;
  const quantity = priced.reduce((total, stock) => total + Math.max(stock.quantity, 0), 0);
  if (quantity === 0) return priced[0].unitCost;
  return priced.reduce((total, stock) => total + Math.max(stock.quantity, 0) * (stock.unitCost || 0), 0) / quantity;
}

export default async function MateriaisPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const context = await getTenantContextForModule("PATRIMONIO");
  const { prisma } = context;
  const params = await searchParams;
  const q = params?.q?.trim() || "";
  const view = getView(params?.view);
  const type = params?.type === "PATRIMONIO" ? "PATRIMONIO" : params?.type === "MATERIAL" ? "MATERIAL" : "";
  const categoryId = params?.category || "";
  const status = getStatus(params?.status);
  const warehouseId = params?.warehouse || "";
  const order = getOrder(params?.order);
  const requestedPage = parsePatrimonioListPage(params?.page);
  const whereParts: Prisma.MaterialWhereInput[] = [];
  if (q) whereParts.push({ OR: [{ name: { contains: q, mode: "insensitive" } }, { code: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] });
  if (type) whereParts.push({ type });
  if (categoryId) whereParts.push({ categoryId });
  if (status === "ATIVO") whereParts.push({ isActive: true });
  if (status === "INATIVO") whereParts.push({ isActive: false });
  if (status === "SEM_ESTOQUE") whereParts.push({ isActive: true, stocks: { none: warehouseId ? { warehouseId, quantity: { gt: 0 } } : { quantity: { gt: 0 } } } });
  if (warehouseId && status !== "SEM_ESTOQUE") whereParts.push({ stocks: { some: { warehouseId } } });
  const catalogWhere: Prisma.MaterialWhereInput = whereParts.length ? { AND: whereParts } : {};
  const catalogValues = { q, type, category: categoryId, status, warehouse: warehouseId, order };
  const catalogTotal = await prisma.material.count({ where: catalogWhere });
  const page = view === "movimentar" ? 1 : clampPatrimonioListPage(requestedPage, catalogTotal);

  const [materials, warehouses, categories, movementMaterials, settlements] = await Promise.all([
    view === "catalogo" ? prisma.material.findMany({
      where: catalogWhere,
      skip: (page - 1) * PATRIMONIO_LIST_PAGE_SIZE,
      take: PATRIMONIO_LIST_PAGE_SIZE,
      orderBy: materialOrder(order),
      include: { category: { select: { id: true, name: true } }, stocks: { select: { quantity: true, unitCost: true, expirationDate: true, warehouse: { select: { id: true, name: true } } } } },
    }) : Promise.resolve([]),
    prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.materialCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    view === "movimentar" ? prisma.material.findMany({ where: { isActive: true }, take: 200, orderBy: { name: "asc" }, select: { id: true, code: true, name: true } }) : Promise.resolve([]),
    view === "movimentar" ? prisma.settlement.findMany({ where: { status: "Liquidado" }, take: 100, orderBy: { date: "desc" }, select: { id: true, date: true, value: true, commitment: { select: { number: true } } } }) : Promise.resolve([]),
  ]);
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId);
  const canCreate = canPerformModuleOperation(context.user, "PATRIMONIO", "create");
  const canUpdate = canPerformModuleOperation(context.user, "PATRIMONIO", "update");
  const canDelete = canPerformModuleOperation(context.user, "PATRIMONIO", "delete");

  const panelHref = (nextView: MaterialView, nextPage = 1) => patrimonioListHref("/patrimonio/materiais", nextPage, nextView === "catalogo" ? { ...catalogValues, view: nextView } : { view: nextView });
  const materialRows = materials.map((material) => {
    const visibleStocks = warehouseId ? material.stocks.filter((stock) => stock.warehouse.id === warehouseId) : material.stocks;
    const totalStock = visibleStocks.reduce((total, stock) => total + stock.quantity, 0);
    const earliestExpiration = visibleStocks.flatMap((stock) => stock.expirationDate ? [stock.expirationDate] : []).sort((left, right) => left.valueOf() - right.valueOf())[0];
    const warehouseLabel = [...new Set(visibleStocks.map((stock) => stock.warehouse.name))].join(", ") || (selectedWarehouse ? selectedWarehouse.name : "Sem saldo");
    const materialStatus: "Ativo" | "Inativo" | "Sem estoque" = !material.isActive ? "Inativo" : totalStock <= 0 ? "Sem estoque" : "Ativo";
    return {
      id: material.id,
      code: material.code,
      name: material.name,
      description: material.description,
      type: material.type === "PATRIMONIO" ? "PATRIMONIO" as const : "MATERIAL" as const,
      unitOfMeasure: material.unitOfMeasure,
      minStock: material.minStock,
      categoryId: material.categoryId,
      categoryName: material.category.name,
      status: materialStatus,
      totalStock,
      warehouseLabel,
      unitCost: currencyCost(visibleStocks),
      expirationLabel: earliestExpiration ? earliestExpiration.toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "-",
    };
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
      <ErpPageTitle title="Estoque" action={canCreate ? <Link href="/patrimonio/materiais/novo" className={buttonVariants({ size: "sm" })}><Plus className="size-3.5" /><span className="hidden sm:inline">Novo material</span><span className="sm:hidden">Novo</span></Link> : undefined} />
      <nav className="flex shrink-0 items-center gap-1 border-b border-slate-300 px-1" aria-label="Visões de estoque">
        {([ ["catalogo", "Estoque"], ["movimentar", "Movimentar"] ] as Array<[MaterialView, string]>).map(([itemView, label]) => <Link key={itemView} href={panelHref(itemView)} aria-current={view === itemView ? "page" : undefined} className={`border-b-2 px-3 py-1.5 text-xs font-semibold transition-colors ${view === itemView ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"}`}>{label}</Link>)}
      </nav>

      {view === "catalogo" && <ErpListFrame
        toolbar={<form className="flex flex-wrap items-center gap-2" role="search"><input type="hidden" name="view" value="catalogo" /><Input name="q" defaultValue={q} placeholder="Código, nome ou descrição" className="h-8 min-w-0 flex-1 bg-white text-xs sm:min-w-52" /><select name="type" defaultValue={type} aria-label="Filtrar por tipo" className="h-8 rounded-md border border-input bg-white px-2 text-xs"><option value="">Tipo: todos</option><option value="MATERIAL">Material</option><option value="PATRIMONIO">Patrimônio</option></select><select name="category" defaultValue={categoryId} aria-label="Filtrar por categoria" className="h-8 max-w-44 rounded-md border border-input bg-white px-2 text-xs"><option value="">Categoria: todas</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select name="status" defaultValue={status} aria-label="Filtrar por status" className="h-8 rounded-md border border-input bg-white px-2 text-xs"><option value="">Status: todos</option><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option><option value="SEM_ESTOQUE">Sem estoque</option></select><select name="warehouse" defaultValue={warehouseId} aria-label="Filtrar por almoxarifado" className="h-8 max-w-48 rounded-md border border-input bg-white px-2 text-xs"><option value="">Almoxarifado: todos</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select><select name="order" defaultValue={order} aria-label="Ordenar materiais" className="h-8 max-w-48 rounded-md border border-input bg-white px-2 text-xs"><option value="code-asc">Código: A-Z</option><option value="code-desc">Código: Z-A</option><option value="name-asc">Nome: A-Z</option><option value="name-desc">Nome: Z-A</option><option value="description-asc">Descrição: A-Z</option><option value="description-desc">Descrição: Z-A</option></select><button type="submit" className={buttonVariants({ size: "sm" })}><Search className="size-3.5" />Filtrar</button></form>}
        summary={<p className="text-[11px] text-slate-600"><strong className="text-slate-900">{catalogTotal}</strong> material(is) no catálogo</p>}
        pagination={<ErpPagination page={page} total={catalogTotal} pageSize={PATRIMONIO_LIST_PAGE_SIZE} label="materiais" previousHref={panelHref("catalogo", page - 1)} nextHref={panelHref("catalogo", page + 1)} jumpTo={{ pathname: "/patrimonio/materiais", values: { ...catalogValues, view: "catalogo" } }} />}
      ><MaterialCatalogTable materials={materialRows} categories={categories} canUpdate={canUpdate} canDelete={canDelete} /></ErpListFrame>}

      {view === "movimentar" && <ErpListFrame toolbar={<p className="text-xs font-semibold text-slate-800">Registrar movimentação de estoque</p>}><div className="p-3"><StockOperationsClient materials={movementMaterials.map((material) => ({ id: material.id, label: `${material.code} - ${material.name}` }))} warehouses={warehouses.map((warehouse) => ({ id: warehouse.id, label: warehouse.name }))} settlements={settlements.map((settlement) => ({ id: settlement.id, label: `${settlement.commitment.number} - ${settlement.date.toLocaleDateString("pt-BR", { timeZone: "UTC" })} - ${settlement.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` }))} /></div></ErpListFrame>}
    </div>
  );
}
