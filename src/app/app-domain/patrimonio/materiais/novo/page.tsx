import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { Button } from "@/components/ui/button";
import { getTenantContextForModule, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { nextMaterialCode } from "@/lib/patrimonio/identifiers";

const materialInput = z.object({
  name: z.string().trim().min(1, "Informe o nome do material."),
  description: z.string().trim().optional(),
  type: z.enum(["MATERIAL", "PATRIMONIO"]),
  unitOfMeasure: z.string().trim().min(1, "Informe a unidade de medida.").max(30, "A unidade deve ter no máximo 30 caracteres."),
  categoryId: z.string().trim().min(1, "Selecione a categoria."),
  catalogItemId: z.string().trim().optional(),
  minStock: z.number().finite().nonnegative("O estoque mínimo deve ser maior ou igual a zero."),
  maxStock: z.number().finite().nonnegative("O estoque máximo deve ser maior ou igual a zero."),
  isPerishable: z.boolean(),
});

export default async function NovoMaterialPage() {
  const { prisma } = await getTenantContextForModule("PATRIMONIO");
  const [categories, catalogItems] = await Promise.all([
    prisma.materialCategory.findMany({ where: { isActive: true }, select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
    prisma.catalogItem.findMany({ where: { isActive: true }, select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  async function createMaterial(formData: FormData): Promise<void> {
    "use server";

    const parsed = materialInput.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      type: formData.get("type"),
      unitOfMeasure: formData.get("unitOfMeasure"),
      categoryId: formData.get("categoryId"),
      catalogItemId: formData.get("catalogItemId"),
      minStock: Number(formData.get("minStock") || 0),
      maxStock: Number(formData.get("maxStock") || 0),
      isPerishable: formData.get("isPerishable") === "on",
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados do material inválidos.");
    if (parsed.data.maxStock > 0 && parsed.data.maxStock < parsed.data.minStock) {
      throw new Error("O estoque máximo deve ser maior ou igual ao estoque mínimo.");
    }

    const context = await getTenantContextForModuleOperation("PATRIMONIO", "create");
    const catalogItemId = parsed.data.catalogItemId || undefined;
    const [category, catalogItem] = await Promise.all([
      context.prisma.materialCategory.findFirst({ where: { id: parsed.data.categoryId, isActive: true }, select: { id: true } }),
      catalogItemId
        ? context.prisma.catalogItem.findFirst({ where: { id: catalogItemId, isActive: true }, include: { materials: { select: { id: true } } } })
        : null,
    ]);
    if (!category) throw new Error("Selecione uma categoria de material ativa.");
    if (catalogItemId && !catalogItem) throw new Error("Selecione um item de catálogo ativo.");
    if (catalogItem && catalogItem.materials.length) throw new Error("O item de catálogo já está vinculado a outro material.");

    const code = await nextMaterialCode(context.prisma, parsed.data.type);
    await context.prisma.material.create({
      data: {
        code,
        name: parsed.data.name,
        description: parsed.data.description || null,
        type: parsed.data.type,
        unitOfMeasure: parsed.data.unitOfMeasure,
        categoryId: category.id,
        catalogItemId,
        minStock: parsed.data.minStock,
        maxStock: parsed.data.maxStock,
        isPerishable: parsed.data.isPerishable,
      },
    });
    revalidatePath("/patrimonio/materiais");
    revalidatePath("/compras/solicitacoes/nova");
    redirect("/patrimonio/materiais");
  }

  return (
    <PageFrame className="max-w-3xl space-y-2">
      <PageHeader title="Novo Material" action={<Link href="/patrimonio/materiais"><Button size="sm" variant="outline">Cancelar</Button></Link>} />
      <form action={createMaterial} className="grid gap-3 rounded-md border bg-white p-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Tipo de material
          <select name="type" defaultValue="MATERIAL" className="h-9 rounded-md border bg-background px-3 text-sm"><option value="MATERIAL">Material</option><option value="PATRIMONIO">Patrimônio</option></select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Unidade de medida
          <input name="unitOfMeasure" required maxLength={30} defaultValue="UN" className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="UN, KG, RESMA" />
        </label>
        <div className="grid gap-1 text-sm font-medium md:col-span-2"><span>Código</span><p className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-600">Gerado automaticamente no padrão MAT00000 ou PAT00000 conforme o tipo selecionado.</p></div>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">
          Nome
          <input name="name" required className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="Ex.: Papel A4" />
        </label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">
          Descrição detalhada
          <textarea name="description" rows={5} className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Especificações técnicas e demais informações do material." />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Categoria
          <select name="categoryId" required className="h-9 rounded-md border bg-background px-3 text-sm">
            <option value="">Selecione</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.code} - {category.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Item compartilhado de compras
          <select name="catalogItemId" className="h-9 rounded-md border bg-background px-3 text-sm">
            <option value="">Não vincular agora</option>
            {catalogItems.map((item) => <option key={item.id} value={item.id}>{item.code ? `${item.code} - ` : ""}{item.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Estoque mínimo
          <input name="minStock" type="number" min="0" step="any" defaultValue="0" className="h-9 rounded-md border bg-background px-3 text-sm" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Estoque máximo
          <input name="maxStock" type="number" min="0" step="any" defaultValue="0" className="h-9 rounded-md border bg-background px-3 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
          <input name="isPerishable" type="checkbox" className="size-4" />
          Material perecível ou sujeito a validade
        </label>
        <div className="flex justify-end gap-2 border-t pt-3 md:col-span-2">
          <Link href="/patrimonio/materiais"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit">Salvar material</Button>
        </div>
      </form>
    </PageFrame>
  );
}
