"use client";

import { useState, useTransition } from "react";
import { FileText, Pencil, Power, RotateCcw, Trash2 } from "lucide-react";
import { ConfirmActionDialog } from "@/components/app-ui/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteMaterialAction, setMaterialActiveAction, updateMaterialAction } from "./catalog-actions";

type Category = { id: string; name: string };
type MaterialRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: "MATERIAL" | "PATRIMONIO";
  unitOfMeasure: string;
  minStock: number;
  categoryId: string;
  categoryName: string;
  status: "Ativo" | "Inativo" | "Sem estoque";
  totalStock: number;
  warehouseLabel: string;
  unitCost: number | null;
  expirationLabel: string;
};

function currency(value: number | null) {
  return value === null ? "-" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function MaterialCatalogTable({ materials, categories, canUpdate, canDelete }: { materials: MaterialRow[]; categories: Category[]; canUpdate: boolean; canDelete: boolean }) {
  const [descriptionMaterial, setDescriptionMaterial] = useState<MaterialRow | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<MaterialRow | null>(null);
  const [editValues, setEditValues] = useState({ description: "", categoryId: "", type: "MATERIAL" as "MATERIAL" | "PATRIMONIO", unitOfMeasure: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(material: MaterialRow) {
    setEditingMaterial(material);
    setEditValues({ description: material.description || "", categoryId: material.categoryId, type: material.type, unitOfMeasure: material.unitOfMeasure });
    setEditError(null);
  }

  function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingMaterial) return;
    setEditError(null);
    startTransition(async () => {
      const result = await updateMaterialAction(editingMaterial.id, editValues);
      if (result.error) {
        setEditError(result.error);
        return;
      }
      setEditingMaterial(null);
    });
  }

  return (
    <>
      <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <tr className="h-7">
            <th className="w-[8%] px-3 text-left">Código</th>
            <th className="w-[17%] px-3 text-left">Nome</th>
            <th className="w-[4%] px-1 text-center">Det.</th>
            <th className="hidden w-[10%] px-3 text-left md:table-cell">Categoria</th>
            <th className="w-[8%] px-3 text-left">Status</th>
            <th className="hidden w-[13%] px-3 text-left xl:table-cell">Almoxarifado</th>
            <th className="w-[9%] px-3 text-right">Custo est.</th>
            <th className="hidden w-[8%] px-2 text-left xl:table-cell">Validade/Garantia</th>
            <th className="w-[5%] px-2 text-center">Un.</th>
            <th className="w-[7%] px-2 text-center">Mínimo</th>
            <th className="w-[8%] px-2 text-center">Saldo</th>
            <th className="w-[4.5rem] px-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {materials.length === 0 ? <tr><td colSpan={12} className="px-3 py-10 text-center text-slate-500">Nenhum material encontrado para os filtros informados.</td></tr> : materials.map((material) => {
            const inactive = material.status === "Inativo";
            const minStock = material.minStock || 0;
            const stock = material.totalStock;

            let stockColorClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
            if (stock < minStock) {
              stockColorClass = "text-rose-700 bg-rose-50 border-rose-200 font-bold";
            } else if (stock <= minStock * 1.2) {
              stockColorClass = "text-amber-800 bg-amber-50 border-amber-200 font-bold";
            }

            return (
              <tr key={material.id} className="h-[clamp(28px,3.2vh,38px)] border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-0 font-semibold text-emerald-800"><span className="block truncate">{material.code}</span></td>
                <td className="px-3 py-0 font-medium"><span className="block truncate">{material.name}</span></td>
                <td className="px-1 py-0 text-center"><button type="button" aria-label={`Ver descrição de ${material.name}`} title="Ver descrição detalhada" onClick={() => setDescriptionMaterial(material)} className="inline-flex size-6 items-center justify-center rounded text-slate-500 outline-none hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600"><FileText className="size-3.5" /></button></td>
                <td className="hidden px-3 py-0 md:table-cell"><span className="block truncate">{material.categoryName}</span></td>
                <td className="px-3 py-0"><span className={`font-semibold ${material.status === "Ativo" ? "text-emerald-700" : material.status === "Inativo" ? "text-rose-700" : "text-amber-700"}`}>{material.status}</span></td>
                <td className="hidden px-3 py-0 xl:table-cell"><span className="block truncate">{material.warehouseLabel}</span></td>
                <td className="px-3 py-0 text-right tabular-nums">{currency(material.unitCost)}</td>
                <td className="hidden px-2 py-0 tabular-nums xl:table-cell"><span className="block truncate">{material.expirationLabel}</span></td>
                <td className="px-2 py-0 text-center font-semibold text-slate-600">{material.unitOfMeasure}</td>
                <td className="px-2 py-0 text-center tabular-nums text-slate-500">{minStock.toLocaleString("pt-BR")}</td>
                <td className="px-2 py-0 text-center tabular-nums">
                  <span className={`inline-block rounded border px-2 py-0.5 text-center text-xs tabular-nums ${stockColorClass}`}>
                    {stock.toLocaleString("pt-BR")}
                  </span>
                </td>
                <td className="px-2 py-0">
                  {(canUpdate || canDelete) ? <div className="flex items-center justify-end gap-0.5">
                    {canUpdate && <button type="button" aria-label={`Editar ${material.name}`} title="Editar material" onClick={() => startEdit(material)} className="inline-flex size-7 items-center justify-center rounded text-slate-500 outline-none hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600"><Pencil className="size-3.5" /></button>}
                    {canUpdate && <ConfirmActionDialog title={inactive ? "Reativar material" : "Inativar material"} description={inactive ? `O material “${material.name}” voltará a ficar disponível para novos registros.` : `O material “${material.name}” deixará de ser oferecido para novos registros, preservando seu histórico.`} confirmLabel={inactive ? "Reativar" : "Inativar"} action={() => setMaterialActiveAction(material.id, inactive)} destructive={!inactive} trigger={<button type="button" aria-label={`${inactive ? "Reativar" : "Inativar"} ${material.name}`} title={inactive ? "Reativar material" : "Inativar material"} className={`inline-flex size-7 items-center justify-center rounded outline-none focus-visible:ring-2 ${inactive ? "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-emerald-600" : "text-slate-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-600"}`}>{inactive ? <RotateCcw className="size-3.5" /> : <Power className="size-3.5" />}</button>} />}
                    {canDelete && <ConfirmActionDialog title="Excluir material" description={`A exclusão de “${material.name}” é permanente e só será concluída se ele não tiver estoque, movimentações ou outros vínculos.`} confirmLabel="Excluir definitivamente" action={() => deleteMaterialAction(material.id)} destructive trigger={<button type="button" aria-label={`Excluir ${material.name}`} title="Excluir material" className="inline-flex size-7 items-center justify-center rounded text-slate-500 outline-none hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-rose-600"><Trash2 className="size-3.5" /></button>} />}
                  </div> : <span className="text-[10px] text-slate-400">Leitura</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Dialog open={Boolean(descriptionMaterial)} onOpenChange={(open) => { if (!open) setDescriptionMaterial(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ficha do material</DialogTitle>
            <DialogDescription>{descriptionMaterial?.code} · {descriptionMaterial?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-xs text-slate-700">
            <div className="rounded border bg-slate-50 p-2.5">
              <span className="font-semibold text-slate-900 block mb-1">Descrição detalhada:</span>
              <p className="whitespace-pre-wrap">{descriptionMaterial?.description || "Nenhuma descrição detalhada foi cadastrada."}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded border p-2.5 bg-white">
              <div><span className="text-slate-500 block">Categoria:</span> <span className="font-semibold">{descriptionMaterial?.categoryName}</span></div>
              <div><span className="text-slate-500 block">Unidade de medida:</span> <span className="font-semibold">{descriptionMaterial?.unitOfMeasure}</span></div>
              <div><span className="text-slate-500 block">Estoque mínimo:</span> <span className="font-semibold">{descriptionMaterial?.minStock}</span></div>
              <div><span className="text-slate-500 block">Saldo atual:</span> <span className="font-semibold">{descriptionMaterial?.totalStock}</span></div>
              <div><span className="text-slate-500 block">Custo estimado:</span> <span className="font-semibold">{currency(descriptionMaterial?.unitCost ?? null)}</span></div>
              <div><span className="text-slate-500 block">Validade/Garantia:</span> <span className="font-semibold">{descriptionMaterial?.expirationLabel}</span></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingMaterial)} onOpenChange={(open) => { if (!open && !isPending) setEditingMaterial(null); }}>
        <DialogContent className="sm:max-w-xl" showCloseButton={!isPending}>
          <DialogHeader><DialogTitle>Editar material</DialogTitle><DialogDescription>{editingMaterial?.code} · {editingMaterial?.name}</DialogDescription></DialogHeader>
          <form onSubmit={saveEdit} className="grid gap-3">
            <label className="grid gap-1 text-sm font-medium">Descrição<textarea rows={4} value={editValues.description} onChange={(event) => setEditValues((current) => ({ ...current, description: event.target.value }))} className="rounded-md border border-input bg-background px-3 py-2 text-sm" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">Categoria<select required value={editValues.categoryId} onChange={(event) => setEditValues((current) => ({ ...current, categoryId: event.target.value }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="grid gap-1 text-sm font-medium">Unidade de Medida (Tipo)<select required value={editValues.unitOfMeasure} onChange={(event) => setEditValues((current) => ({ ...current, unitOfMeasure: event.target.value }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="UN">UN - Unidade</option><option value="KIT">KIT - Kit</option><option value="PÇ">PÇ - Peça</option><option value="KG">KG - Quilograma</option><option value="CX">CX - Caixa</option><option value="LT">LT - Litro</option><option value="ROLO">ROLO - Rolo</option><option value="PAQ">PAQ - Pacote</option><option value="FL">FL - Folha</option></select></label>
            </div>
            {editError && <p role="alert" className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{editError}</p>}
            <DialogFooter><Button type="button" variant="outline" disabled={isPending} onClick={() => setEditingMaterial(null)}>Cancelar</Button><Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar alterações"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
