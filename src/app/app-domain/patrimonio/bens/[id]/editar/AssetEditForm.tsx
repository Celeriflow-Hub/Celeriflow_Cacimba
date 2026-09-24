"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { updateAssetAction } from "../../actions";

type Option = { id: string; name: string };

type AssetFormData = {
  name: string;
  description: string;
  brand: string;
  model: string;
  serialNumber: string;
  categoryId: string;
};

export function AssetEditForm({ asset, categories }: {
  asset: AssetFormData & { id: string; patrimonyNumber: string };
  categories: Option[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<AssetFormData>(asset);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateAssetAction(asset.id, values);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/patrimonio/bens/${encodeURIComponent(asset.id)}`);
    });
  }

  return (
    <PageFrame className="max-w-5xl space-y-2">
      <PageHeader title={`Editar bem · ${asset.patrimonyNumber}`} action={<Link href={`/patrimonio/bens/${encodeURIComponent(asset.id)}`}><Button size="sm" variant="outline">Cancelar</Button></Link>} />
      <form onSubmit={save} className="grid gap-3 rounded-md border bg-white p-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Número de tombamento</Label><Input value={asset.patrimonyNumber} readOnly /></div>
        <div className="space-y-2"><Label htmlFor="asset-name">Nome do bem</Label><Input id="asset-name" required value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /></div>
        <div className="space-y-2"><Label htmlFor="asset-brand">Marca</Label><Input id="asset-brand" value={values.brand} onChange={(event) => setValues((current) => ({ ...current, brand: event.target.value }))} /></div>
        <div className="space-y-2"><Label htmlFor="asset-model">Modelo</Label><Input id="asset-model" value={values.model} onChange={(event) => setValues((current) => ({ ...current, model: event.target.value }))} /></div>
        <div className="space-y-2"><Label htmlFor="asset-serial">Número de série</Label><Input id="asset-serial" value={values.serialNumber} onChange={(event) => setValues((current) => ({ ...current, serialNumber: event.target.value }))} /></div>
        <div className="space-y-2"><Label htmlFor="asset-category">Categoria patrimonial</Label><select id="asset-category" required value={values.categoryId} onChange={(event) => setValues((current) => ({ ...current, categoryId: event.target.value }))} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Selecione a categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <p className="text-xs text-slate-500 md:col-span-2">Para alterar o setor ou o responsável, use a transferência na ficha do bem. Esse fluxo preserva a rastreabilidade patrimonial.</p>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="asset-description">Descrição</Label><textarea id="asset-description" rows={5} value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
        {error && <p role="alert" className="text-sm text-rose-700 md:col-span-2">{error}</p>}
        <div className="flex justify-end gap-2 border-t pt-3 md:col-span-2"><Link href={`/patrimonio/bens/${encodeURIComponent(asset.id)}`}><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar alterações"}</Button></div>
      </form>
    </PageFrame>
  );
}
